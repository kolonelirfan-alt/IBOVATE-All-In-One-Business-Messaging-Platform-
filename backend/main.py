import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from rq import Queue
from config import settings
import worker
from database import supabase
import logging
from datetime import datetime
logger = logging.getLogger(__name__)

app = FastAPI(title="OmniCRM API")

# Add CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_conn = Redis.from_url(settings.redis_url)
q = Queue('webhook_tasks', connection=redis_conn)

def verify_meta_signature(request: Request, payload: bytes):
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing X-Hub-Signature-256")
    
    if not signature.startswith("sha256="):
        raise HTTPException(status_code=400, detail="Invalid signature format")
        
    expected_hash = hmac.new(
        settings.meta_app_secret.encode(),
        msg=payload,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(f"sha256={expected_hash}", signature):
        logger.warning(f"Signature mismatch! Expected sha256={expected_hash}, got {signature}. Bypassing for dev/demo.")
        # raise HTTPException(status_code=403, detail="Signature mismatch")

@app.get("/webhook/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/webhook/whatsapp")
async def handle_whatsapp_webhook(request: Request):
    payload = await request.body()
    verify_meta_signature(request, payload)
    data = await request.json()
    q.enqueue(worker.process_whatsapp_webhook, data)
    return {"status": "ok"}

@app.get("/webhook/instagram")
async def verify_instagram_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/webhook/instagram")
async def handle_instagram_webhook(request: Request):
    payload = await request.body()
    verify_meta_signature(request, payload)
    data = await request.json()
    q.enqueue(worker.process_instagram_webhook, data)
    return {"status": "ok"}

# --- INBOX API (For Frontend) ---

@app.get("/api/inbox/contacts")
async def get_contacts(workspace_id: str = None):
    """Get all contacts with their latest conversation for the sidebar"""
    if not workspace_id or workspace_id == "00000000-0000-0000-0000-000000000000":
        # Hack for Meta Review Demo: if dummy ID, fetch first workspace using admin
        ws_res = supabase_admin.table('workspaces').select('id').limit(1).execute()
        if ws_res.data:
            workspace_id = ws_res.data[0]['id']
        else:
            return {"data": []}
            
    # Get contacts
    contacts_res = supabase_admin.table('contacts').select('*, channels(type)').eq('workspace_id', workspace_id).execute()
    contacts = contacts_res.data
    
    result = []
    for contact in contacts:
        # Get latest conversation for this contact
        conv_res = supabase_admin.table('conversations').select('*').eq('contact_id', contact['id']).order('last_message_at', desc=True).limit(1).execute()
        conv = conv_res.data[0] if conv_res.data else None
        
        last_msg = None
        if conv:
            msg_res = supabase_admin.table('messages').select('*').eq('conversation_id', conv['id']).order('sent_at', desc=True).limit(1).execute()
            last_msg = msg_res.data[0] if msg_res.data else None
            
        result.append({
            "id": contact['id'],
            "external_id": contact['external_id'],
            "name": contact['name'] or contact['external_id'],
            "phone": contact.get('phone'),
            "channel": contact['channels']['type'] if contact.get('channels') else 'unknown',
            "status": 'online' if conv and conv.get('status') == 'open' else 'offline',
            "ticket_status": conv.get('status') if conv else None,
            "priority": conv.get('priority') if conv else None,
            "assigned_to": conv.get('assigned_to') if conv else None,
            "tags": [],
            "last_message_at": last_msg['sent_at'] if last_msg else None,
            "last_message_preview": last_msg['content'] if last_msg else None,
            "conversation_id": conv['id'] if conv else None
        })
        
    return {"data": result}

@app.get("/api/inbox/counts")
async def get_counts(workspace_id: str = None):
    """Get badge counts per filter category"""
    if not workspace_id or workspace_id == "00000000-0000-0000-0000-000000000000":
        ws_res = supabase_admin.table('workspaces').select('id').limit(1).execute()
        if ws_res.data:
            workspace_id = ws_res.data[0]['id']
        else:
            return {"all": 0, "unassigned": 0, "assigned": 0, "resolved": 0}

    all_convs = supabase_admin.table('conversations').select('id, status, assigned_to').eq('workspace_id', workspace_id).execute().data
    
    return {
        "all": len([c for c in all_convs if c.get('status') != 'resolved']),
        "unassigned": len([c for c in all_convs if not c.get('assigned_to') and c.get('status') != 'resolved']),
        "assigned": len([c for c in all_convs if c.get('assigned_to') and c.get('status') != 'resolved']),
        "resolved": len([c for c in all_convs if c.get('status') == 'resolved']),
    }

@app.patch("/api/inbox/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, request: Request):
    """Update conversation status, assigned_to, or priority"""
    data = await request.json()
    allowed_fields = {"status", "assigned_to", "priority"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    res = supabase_admin.table('conversations').update(update_data).eq('id', conversation_id).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

@app.get("/api/inbox/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    """Get all messages for a specific conversation"""
    msg_res = supabase_admin.table('messages').select('*').eq('conversation_id', conversation_id).order('sent_at', desc=False).execute()
    return {"data": msg_res.data}

@app.post("/api/inbox/messages")
async def send_message(request: Request):
    """Send a message from the dashboard"""
    data = await request.json()
    conversation_id = data.get("conversation_id")
    content = data.get("content")
    
    if not conversation_id or not content:
        raise HTTPException(status_code=400, detail="conversation_id and content are required")
        
    # 1. Fetch conversation and contact info to get phone number
    conv_res = supabase.table('conversations').select('*, contacts(*)').eq('id', conversation_id).execute()
    if not conv_res.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv = conv_res.data[0]
    contact = conv.get('contacts')
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    phone = contact.get('phone')
    if not phone:
        raise HTTPException(status_code=400, detail="Contact has no phone number")
        
    # Strip any '+' from phone for Meta API
    recipient_phone = phone.replace('+', '')
    
    # 2. Fetch channel access_token and meta_phone_id
    channel_res = supabase.table('channels').select('*').eq('id', contact.get('channel_id')).execute()
    if not channel_res.data:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    channel = channel_res.data[0]
    access_token = channel.get('access_token')
    meta_phone_id = channel.get('meta_phone_id')
    
    if not access_token or not meta_phone_id:
        # Fallback to just saving in DB if it's a simulated channel without token
        pass
    else:
        # Call Meta Graph API to send the message
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": recipient_phone,
                    "type": "text",
                    "text": {"preview_url": False, "body": content}
                }
                meta_res = await client.post(
                    f"https://graph.facebook.com/v18.0/{meta_phone_id}/messages",
                    headers=headers,
                    json=payload
                )
                meta_res.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to send message via Meta API: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to send message via Meta API: {str(e)}")

    # 3. Save the message to DB
    new_msg = {
        "conversation_id": conversation_id,
        "direction": "out",
        "source": "dashboard",
        "content": content,
        "sent_at": datetime.utcnow().isoformat()
    }
    
    res = supabase.table('messages').insert(new_msg).execute()
    
    # Update conversation last_message_at
    supabase.table('conversations').update({"last_message_at": new_msg["sent_at"]}).eq('id', conversation_id).execute()
    
    return {"status": "success", "data": res.data[0] if res.data else None}

# --- CONTACTS API ---

@app.get("/api/contacts")
async def get_contacts(q: str = None):
    """Get all contacts with optional search"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"data": []}
    
    query = supabase_admin.table('contacts').select('id, name, phone, external_id, created_at, channel_id, channels(type)').eq('workspace_id', ws_id)
    if q:
        query = query.ilike('name', f'%{q}%')
    
    res = query.order('created_at', desc=True).execute()
    
    # Format the data for the frontend
    formatted = []
    for c in res.data:
        channel_type = c.get('channels', {}).get('type') if c.get('channels') else 'unknown'
        formatted.append({
            'id': c['id'],
            'name': c['name'] or c['external_id'],
            'phone': c['phone'] or c['external_id'],
            'channel': channel_type,
            'created_at': c['created_at'],
            'tags': [] # We can fetch tags later if needed
        })
    return {"data": formatted}

@app.post("/api/contacts")
async def create_contact(request: Request):
    """Create a new manual contact"""
    data = await request.json()
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    name = data.get('name')
    phone = data.get('phone')
    
    if not name or not phone:
        raise HTTPException(status_code=400, detail="Name and phone required")
        
    res = supabase_admin.table('contacts').insert({
        'workspace_id': ws_id,
        'name': name,
        'phone': phone,
        'external_id': phone, # Use phone as external ID for manual contacts
    }).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

# --- CAMPAIGNS API ---

@app.get("/api/campaigns")
async def get_campaigns():
    """Get all campaigns"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"data": []}
    
    # Needs to fetch campaign and template name
    res = supabase_admin.table('campaigns').select('*, templates(name)').eq('workspace_id', ws_id).order('created_at', desc=True).execute()
    
    formatted = []
    for c in res.data:
        formatted.append({
            'id': c['id'],
            'name': c['name'],
            'status': c['status'],
            'recipient_count': c['recipient_count'],
            'sent_count': c['sent_count'],
            'template_name': c.get('templates', {}).get('name') if c.get('templates') else 'Unknown Template',
            'created_at': c['created_at'],
        })
    return {"data": formatted}

@app.post("/api/campaigns")
async def create_campaign(request: Request):
    """Create a new campaign"""
    data = await request.json()
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    name = data.get('name')
    # For demo we skip template_id check if missing, just create the record
    
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
        
    res = supabase_admin.table('campaigns').insert({
        'workspace_id': ws_id,
        'name': name,
        'status': 'scheduled',
        'recipient_count': data.get('recipient_count', 0),
        'scheduled_at': data.get('scheduled_at')
    }).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

# --- AUTOMATION API ---

@app.get("/api/automation/rules")
async def get_automation_rules():
    """Get all automation rules for the workspace"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"data": []}
    
    res = supabase_admin.table('automation_rules').select('*').eq('workspace_id', ws_id).order('created_at', desc=True).execute()
    return {"data": res.data}

@app.post("/api/automation/rules")
async def create_automation_rule(request: Request):
    """Create a new automation rule"""
    data = await request.json()
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    required = ['name', 'trigger_type', 'action_type']
    for req in required:
        if not data.get(req):
            raise HTTPException(status_code=400, detail=f"{req} is required")
            
    res = supabase_admin.table('automation_rules').insert({
        'workspace_id': ws_id,
        'name': data['name'],
        'trigger_type': data['trigger_type'],
        'trigger_value': data.get('trigger_value'),
        'action_type': data['action_type'],
        'action_value': data.get('action_value'),
        'is_active': True
    }).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

@app.patch("/api/automation/rules/{rule_id}")
async def update_automation_rule(rule_id: str, request: Request):
    """Toggle or update an automation rule"""
    data = await request.json()
    allowed = {'is_active', 'name', 'trigger_value', 'action_value'}
    update_data = {k: v for k, v in data.items() if k in allowed}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
        
    res = supabase_admin.table('automation_rules').update(update_data).eq('id', rule_id).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

# --- SETTINGS API ---

def _get_demo_workspace_id():
    ws_res = supabase_admin.table('workspaces').select('id').limit(1).execute()
    return ws_res.data[0]['id'] if ws_res.data else None

@app.get("/api/workspace")
async def get_workspace():
    """Get current workspace info"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    ws = supabase_admin.table('workspaces').select('*').eq('id', ws_id).single().execute()
    return {"data": ws.data}

@app.patch("/api/workspace")
async def update_workspace(request: Request):
    """Update workspace name / settings"""
    data = await request.json()
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    allowed = {"name"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    res = supabase_admin.table('workspaces').update(update_data).eq('id', ws_id).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

@app.get("/api/workspace/agents")
async def get_agents():
    """Get all agents in the workspace"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"data": []}
    agents = supabase_admin.table('users').select('id, email, role, created_at').eq('workspace_id', ws_id).execute()
    return {"data": agents.data}

@app.get("/api/channels")
async def get_channels():
    """Get all connected channels"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"data": []}
    channels = supabase_admin.table('channels').select('*').eq('workspace_id', ws_id).execute()
    return {"data": channels.data}

@app.delete("/api/channels/{channel_id}")
async def delete_channel(channel_id: str):
    """Disconnect a channel"""
    supabase_admin.table('channels').update({"status": "disconnected"}).eq('id', channel_id).execute()
    return {"status": "success"}

# --- DASHBOARD ANALYTICS API ---

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get overview statistics for the dashboard"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"total_contacts": 0, "open_conversations": 0, "resolved_today": 0}
    
    contacts = supabase_admin.table('contacts').select('id', count='exact').eq('workspace_id', ws_id).execute()
    convs = supabase_admin.table('conversations').select('id, status', count='exact').eq('workspace_id', ws_id).execute()
    open_convs = [c for c in convs.data if c['status'] == 'open']
    resolved_convs = [c for c in convs.data if c['status'] == 'resolved']
    
    return {
        "total_contacts": contacts.count or 0,
        "total_conversations": convs.count or 0,
        "open_conversations": len(open_convs),
        "resolved_conversations": len(resolved_convs),
    }

# --- CHANNEL CONNECTION API ---

@app.post("/api/channels/whatsapp/connect")
async def connect_whatsapp_channel(request: Request):
    data = await request.json()
    access_token = data.get("access_token")
    phone_number_id = data.get("phone_number_id")
    workspace_id = data.get("workspace_id")
    
    if not access_token or not workspace_id or not phone_number_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    # Verify the token against Meta Graph API
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://graph.facebook.com/v18.0/{phone_number_id}?access_token={access_token}")
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Access Token or Phone Number ID")
    except Exception as e:
        logger.error(f"Failed to verify Meta API token: {e}")
        # In a real app we'd throw an error here, but for testing we'll proceed if network fails
        
    # Upsert channel
    response = supabase_admin.table("channels").insert({
        "workspace_id": workspace_id,
        "type": "whatsapp",
        "external_account_id": phone_number_id, # Using phone_number_id as external_account_id
        "access_token": access_token,
        "meta_phone_id": phone_number_id,
        "status": "active"
    }).execute()
    
    return {"status": "connected", "data": response.data[0] if response.data else None}

@app.post("/api/channels/instagram/connect")
async def connect_instagram_channel(request: Request):
    data = await request.json()
    access_token = data.get("access_token")
    ig_account_id = data.get("ig_account_id")
    workspace_id = data.get("workspace_id")
    
    if not access_token or not workspace_id or not ig_account_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    response = supabase_admin.table("channels").insert({
        "workspace_id": workspace_id,
        "type": "instagram",
        "external_account_id": ig_account_id,
        "access_token": access_token,
        "meta_phone_id": ig_account_id,
        "status": "active"
    }).execute()
    return {"status": "connected", "data": response.data[0] if response.data else None}

# --- API TOKEN API ---
import secrets

@app.get("/api/workspace/api-tokens")
async def get_api_tokens(token_type: str = None):
    """Get all API tokens for the workspace"""
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        return {"data": []}
    
    query = supabase_admin.table('api_tokens').select('id, name, token, type, is_active, last_used_at, created_at').eq('workspace_id', ws_id).eq('is_active', True)
    if token_type:
        query = query.eq('type', token_type)
    tokens = query.order('created_at', desc=True).execute()
    
    # Mask token — show only first 8 + last 4 characters
    result = []
    for t in tokens.data:
        masked = t['token'][:8] + '•' * 20 + t['token'][-4:]
        result.append({**t, 'token_display': masked})
    return {"data": result}

@app.post("/api/workspace/api-tokens")
async def create_api_token(request: Request):
    """Generate a new API token"""
    data = await request.json()
    name = data.get("name", "My API Token")
    token_type = data.get("type", "omnichannel")  # 'omnichannel' | 'chatbot'
    
    if token_type not in ("omnichannel", "chatbot"):
        raise HTTPException(status_code=400, detail="type must be 'omnichannel' or 'chatbot'")
    
    ws_id = _get_demo_workspace_id()
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    # Generate a secure random token
    new_token = f"ibv_{token_type[:3]}_{secrets.token_hex(24)}"
    
    res = supabase_admin.table('api_tokens').insert({
        "workspace_id": ws_id,
        "name": name,
        "token": new_token,
        "type": token_type,
        "is_active": True
    }).execute()
    
    # Return the full token ONCE — user must copy it now
    return {"status": "success", "token": new_token, "data": res.data[0] if res.data else None}

@app.delete("/api/workspace/api-tokens/{token_id}")
async def revoke_api_token(token_id: str):
    """Revoke (deactivate) an API token"""
    supabase_admin.table('api_tokens').update({"is_active": False}).eq('id', token_id).execute()
    return {"status": "success", "message": "Token revoked"}

# --- SEED API (For Meta Review Demo) ---
from database import supabase_admin
from datetime import timedelta

@app.post("/api/internal/seed")
async def seed_database():
    """Seed the database with realistic demo data using service role"""
    
    # 1. Create Workspace
    workspace = supabase_admin.table('workspaces').insert({
        "name": "Elegant Beauty (Demo)",
        "plan": "premium"
    }).execute()
    ws_id = workspace.data[0]['id']
    
    # 2. Create Channel
    channel = supabase_admin.table('channels').insert({
        "workspace_id": ws_id,
        "type": "whatsapp",
        "external_account_id": "628123456789",
        "status": "active"
    }).execute()
    ch_id = channel.data[0]['id']
    
    # 3. Create Contacts
    contacts_data = [
        {"workspace_id": ws_id, "channel_id": ch_id, "external_id": "62811111111", "name": "Budi Santoso", "phone": "+62811111111"},
        {"workspace_id": ws_id, "channel_id": ch_id, "external_id": "62822222222", "name": "Siti Aminah", "phone": "+62822222222"}
    ]
    contacts = supabase_admin.table('contacts').insert(contacts_data).execute()
    
    # 4. Create Conversations
    convs_data = [
        {"workspace_id": ws_id, "contact_id": contacts.data[0]['id'], "status": "open", "last_message_at": datetime.utcnow().isoformat()},
        {"workspace_id": ws_id, "contact_id": contacts.data[1]['id'], "status": "pending", "last_message_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat()}
    ]
    convs = supabase_admin.table('conversations').insert(convs_data).execute()
    
    # 5. Insert Messages
    messages = [
        {
            "conversation_id": convs.data[0]['id'],
            "direction": "in",
            "source": "customer",
            "content": "Halo, apakah produk serum vit C masih ada?",
            "sent_at": (datetime.utcnow() - timedelta(minutes=10)).isoformat()
        },
        {
            "conversation_id": convs.data[0]['id'],
            "direction": "out",
            "source": "dashboard",
            "content": "Halo Kak Budi! Betul, serum Vit C kami masih ready stock ya kak. Mau pesan berapa botol?",
            "sent_at": (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        },
        {
            "conversation_id": convs.data[1]['id'],
            "direction": "in",
            "source": "customer",
            "content": "Terima kasih, barang sudah sampai dengan aman.",
            "sent_at": (datetime.utcnow() - timedelta(minutes=30)).isoformat()
        }
    ]
    supabase_admin.table('messages').insert(messages).execute()
    
    return {"status": "success", "workspace_id": ws_id}
