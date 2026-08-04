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
        logger.warning("Missing X-Hub-Signature-256 header. Proceeding to process webhook payload.")
        return
    
    if not signature.startswith("sha256="):
        logger.warning("Invalid X-Hub-Signature-256 format. Proceeding to process webhook payload.")
        return
        
    if settings.meta_app_secret:
        try:
            expected_hash = hmac.new(
                settings.meta_app_secret.encode(),
                msg=payload,
                digestmod=hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(f"sha256={expected_hash}", signature):
                logger.warning(f"Signature mismatch! Expected sha256={expected_hash}, got {signature}.")
        except Exception as e:
            logger.warning(f"Signature check error: {e}")

@app.get("/webhook/whatsapp")
@app.get("/api/webhook/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

RAW_WEBHOOK_LOGS = []

@app.post("/webhook/whatsapp")
@app.post("/api/webhook/whatsapp")
async def handle_whatsapp_webhook(request: Request):
    payload = await request.body()
    try:
        payload_str = payload.decode('utf-8', errors='ignore')
        logger.info(f"RECEIVED WHATSAPP WEBHOOK POST: {payload_str}")
        RAW_WEBHOOK_LOGS.append({
            "timestamp": datetime.utcnow().isoformat(),
            "type": "whatsapp",
            "payload": payload_str
        })
        if len(RAW_WEBHOOK_LOGS) > 50:
            RAW_WEBHOOK_LOGS.pop(0)
    except Exception as e:
        logger.warning(f"Webhook log error: {e}")

    verify_meta_signature(request, payload)
    data = await request.json()
    worker.process_whatsapp_webhook(data)
    return {"status": "ok"}

@app.get("/api/internal/webhook-logs")
async def get_raw_webhook_logs():
    return {"data": RAW_WEBHOOK_LOGS}

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
    worker.process_instagram_webhook(data)
    return {"status": "ok"}

# --- INBOX API (For Frontend) ---

@app.get("/api/inbox/contacts")
async def get_contacts_inbox(request: Request, workspace_id: str = None, filter: str = "all"):
    """Get all contacts with their latest conversation for the sidebar"""
    user_email = request.headers.get("X-User-Email") or request.query_params.get("user_email")
    user_id = request.headers.get("X-User-Id") or request.query_params.get("user_id")
    workspace_id = _get_demo_workspace_id(user_email=user_email, user_id=user_id)
    if not workspace_id:
        return {"data": []}
        
    # Bulk fetch conversations with joined contacts, channels, and messages in 1 query
    convs_res = supabase_admin.table('conversations').select(
        '*, contacts(*, channels(type)), messages(*)'
    ).eq('workspace_id', workspace_id).order('last_message_at', desc=True).execute()

    result = []
    seen_contacts = set()

    for conv in convs_res.data or []:
        contact = conv.get('contacts')
        cid = contact['id'] if contact else conv['id']
        if cid in seen_contacts:
            continue
            
        status = conv.get('status')
        assigned_to = conv.get('assigned_to')
        
        # Apply filters
        if filter == "unassigned" and (status != "open" or assigned_to is not None):
            continue
        if filter == "assigned" and (status != "open" or assigned_to is None):
            continue
        if filter == "resolved" and status != "resolved":
            continue
        if filter == "mine" and (status != "open" or assigned_to is None):
            continue

        seen_contacts.add(cid)
        msgs = conv.get('messages', [])
        msgs.sort(key=lambda m: m.get('sent_at') or '', reverse=True)
        last_msg = msgs[0] if msgs else None

        if contact:
            channel_type = contact.get('channels', {}).get('type', 'whatsapp') if contact.get('channels') else 'whatsapp'
            c_name = contact.get('name') or contact.get('external_id')
            ext_id = contact.get('external_id')
        else:
            channel_type = 'whatsapp'
            c_name = "WhatsApp Sender"
            ext_id = "Unknown"

        result.append({
            "id": cid,
            "external_id": ext_id,
            "name": c_name,
            "phone": ext_id,
            "channel": channel_type,
            "status": 'online' if status == 'open' else 'offline',
            "ticket_status": status,
            "priority": conv.get('priority'),
            "assigned_to": assigned_to,
            "tags": [],
            "last_message_at": last_msg['sent_at'] if last_msg else conv.get('last_message_at'),
            "last_message_preview": last_msg['content'] if last_msg else None,
            "conversation_id": conv['id']
        })
        
    # Add contacts that don't have conversations yet
    if filter in ("all", "unassigned"):
        contacts_res = supabase_admin.table('contacts').select('*, channels(type)').eq('workspace_id', workspace_id).execute()
        for contact in contacts_res.data or []:
            if contact['id'] not in seen_contacts:
                channel_type = contact['channels'].get('type', 'unknown') if contact.get('channels') else 'unknown'
                result.append({
                    "id": contact['id'],
                    "external_id": contact['external_id'],
                    "name": contact.get('name') or contact['external_id'],
                    "phone": contact.get('phone'),
                    "channel": channel_type,
                    "status": 'offline',
                    "ticket_status": None,
                    "priority": None,
                    "assigned_to": None,
                    "tags": [],
                    "last_message_at": None,
                    "last_message_preview": None,
                    "conversation_id": None
                })
        
    return {"data": result}

@app.get("/api/inbox/counts")
async def get_counts(request: Request, workspace_id: str = None):
    """Get unread badge counts per filter category"""
    user_email = request.headers.get("X-User-Email") or request.query_params.get("user_email")
    user_id = request.headers.get("X-User-Id") or request.query_params.get("user_id")
    workspace_id = _get_demo_workspace_id(user_email=user_email, user_id=user_id)
    if not workspace_id:
        return {"all": 0, "unassigned": 0, "assigned": 0, "resolved": 0}

    convs = supabase_admin.table('conversations').select('id, status, assigned_to, messages(*)').eq('workspace_id', workspace_id).execute().data or []
    
    unread_all = 0
    unread_unassigned = 0
    unread_assigned = 0
    resolved_count = 0

    for c in convs:
        status = c.get('status')
        if status == 'resolved':
            resolved_count += 1
            continue
            
        msgs = sorted(c.get('messages', []), key=lambda x: x.get('sent_at') or '', reverse=True)
        is_unread = msgs and msgs[0].get('direction') == 'in'
        
        if is_unread:
            unread_all += 1
            if not c.get('assigned_to'):
                unread_unassigned += 1
            else:
                unread_assigned += 1

    return {
        "all": unread_all,
        "unassigned": unread_unassigned,
        "assigned": unread_assigned,
        "resolved": resolved_count,
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
        
    # 1. Fetch conversation and contact info to get phone number/ID
    conv_res = supabase_admin.table('conversations').select('*, contacts(*)').eq('id', conversation_id).execute()
    if not conv_res.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv = conv_res.data[0]
    contact = conv.get('contacts')
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    external_id = contact.get('external_id')
    if not external_id:
        raise HTTPException(status_code=400, detail="Contact has no external_id")
        
    # Strip any '+' from phone for Meta API (only relevant for WA but safe for IG)
    recipient_id = external_id.replace('+', '')
    
    # 2. Fetch channel access_token and meta_phone_id
    channel_res = supabase_admin.table('channels').select('*').eq('id', contact.get('channel_id')).execute()
    if not channel_res.data:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    channel = channel_res.data[0]
    access_token = channel.get('access_token')
    channel_type = channel.get('type')
    
    # For Instagram, the endpoint ID is stored in external_account_id, for WhatsApp it's meta_phone_id
    meta_endpoint_id = channel.get('external_account_id') if channel_type == 'instagram' else channel.get('meta_phone_id')
    
    if not access_token or not meta_endpoint_id:
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
                
                if channel_type == "instagram":
                    payload = {
                        "recipient": {"id": recipient_id},
                        "message": {"text": content}
                    }
                    if access_token.startswith("IG"):
                        meta_res = await client.post(
                            "https://graph.instagram.com/me/messages",
                            headers=headers,
                            json=payload
                        )
                    else:
                        meta_res = await client.post(
                            f"https://graph.facebook.com/v18.0/{meta_endpoint_id}/messages",
                            headers=headers,
                            json=payload
                        )
                        if meta_res.status_code == 400:
                            meta_res = await client.post(
                                "https://graph.instagram.com/me/messages",
                                headers=headers,
                                json=payload
                            )
                else: # Default to whatsapp
                    payload = {
                        "messaging_product": "whatsapp",
                        "recipient_type": "individual",
                        "to": recipient_id,
                        "type": "text",
                        "text": {"preview_url": False, "body": content}
                    }
                    meta_res = await client.post(
                        f"https://graph.facebook.com/v18.0/{meta_endpoint_id}/messages",
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
    msg_res = supabase_admin.table('messages').insert(new_msg).execute()
    
    # Update conversation last_message_at
    supabase.table('conversations').update({"last_message_at": new_msg["sent_at"]}).eq('id', conversation_id).execute()
    
    return {"status": "success", "data": msg_res.data[0] if msg_res.data else None}

def _extract_workspace_id(request: Request) -> str:
    user_email = request.headers.get("X-User-Email") or request.query_params.get("user_email")
    user_id = request.headers.get("X-User-Id") or request.query_params.get("user_id")
    return _get_demo_workspace_id(user_email=user_email, user_id=user_id)

# --- CONTACTS API ---

@app.get("/api/contacts")
async def get_contacts(request: Request, q: str = None):
    """Get all saved contacts with optional search"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        return {"data": []}
    
    query = supabase_admin.table('contacts').select('id, name, external_id, created_at, channel_id, is_saved, channels(type)').eq('workspace_id', ws_id).eq('is_saved', True)
    if q:
        query = query.ilike('name', f'%{q}%')
    
    res = query.order('created_at', desc=True).execute()
    
    # Format the data for the frontend
    formatted = []
    for c in res.data or []:
        channel_type = c.get('channels', {}).get('type') if c.get('channels') else 'unknown'
        formatted.append({
            'id': c['id'],
            'name': c['name'] or c['external_id'],
            'phone': c.get('external_id'),
            'channel': channel_type,
            'created_at': c['created_at'],
            'tags': []
        })
    return {"data": formatted}

@app.post("/api/contacts")
async def create_contact(request: Request):
    """Create a new manual contact"""
    data = await request.json()
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    name = data.get('name')
    phone = data.get('phone')
    
    if not name or not phone:
        raise HTTPException(status_code=400, detail="Name and phone required")
        
    existing = supabase_admin.table('contacts').select('*').eq('workspace_id', ws_id).eq('external_id', phone).execute()
    if existing.data:
        res = supabase_admin.table('contacts').update({
            'name': name,
            'is_saved': True
        }).eq('id', existing.data[0]['id']).execute()
    else:
        res = supabase_admin.table('contacts').insert({
            'workspace_id': ws_id,
            'name': name,
            'external_id': phone,
            'is_saved': True
        }).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

@app.post("/api/contacts/save")
async def save_contact_info(request: Request):
    """Save/update contact info from ProfilePanel or Inbox (+ Add Contact)"""
    data = await request.json()
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    contact_id = data.get('contact_id')
    external_id = data.get('external_id') or data.get('phone')
    name = data.get('name')
    
    if contact_id:
        res = supabase_admin.table('contacts').update({
            'is_saved': True,
            'name': name if name else None
        }).eq('id', contact_id).execute()
        return {"status": "success", "data": res.data[0] if res.data else None}
    elif external_id:
        existing = supabase_admin.table('contacts').select('*').eq('workspace_id', ws_id).eq('external_id', external_id).execute()
        if existing.data:
            res = supabase_admin.table('contacts').update({
                'is_saved': True,
                'name': name if name else existing.data[0].get('name')
            }).eq('id', existing.data[0]['id']).execute()
        else:
            res = supabase_admin.table('contacts').insert({
                'workspace_id': ws_id,
                'external_id': external_id,
                'name': name or external_id,
                'is_saved': True
            }).execute()
        return {"status": "success", "data": res.data[0] if res.data else None}
    else:
        raise HTTPException(status_code=400, detail="contact_id or external_id required")

# --- CAMPAIGNS API ---

@app.get("/api/campaigns")
async def get_campaigns(request: Request):
    """Get all campaigns"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        return {"data": []}
    
    res = supabase_admin.table('campaigns').select('*, templates(name)').eq('workspace_id', ws_id).order('created_at', desc=True).execute()
    
    formatted = []
    for c in res.data or []:
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
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    name = data.get('name')
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
async def get_automation_rules(request: Request):
    """Get all automation rules for the workspace"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        return {"data": []}
    
    res = supabase_admin.table('automation_rules').select('*').eq('workspace_id', ws_id).order('created_at', desc=True).execute()
    return {"data": res.data}

@app.post("/api/automation/rules")
async def create_automation_rule(request: Request):
    """Create a new automation rule"""
    data = await request.json()
    ws_id = _extract_workspace_id(request)
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

def _get_demo_workspace_id(user_email: str = None, user_id: str = None):
    PRIMARY_WS_ID = "f14e4aa3-a921-4f9c-8e23-6691daea608d"

    clean_email = (user_email or "").lower().strip()
    
    # 1. Primary workspace only for kolonel.irfan@gmail.com
    if clean_email == "kolonel.irfan@gmail.com":
        return PRIMARY_WS_ID

    # 2. Check users table for assigned workspace
    if clean_email:
        res = supabase_admin.table('users').select('workspace_id').eq('email', clean_email).execute()
        if res.data and res.data[0].get('workspace_id'):
            return res.data[0]['workspace_id']
    
    if user_id:
        res = supabase_admin.table('users').select('workspace_id').eq('id', user_id).execute()
        if res.data and res.data[0].get('workspace_id'):
            return res.data[0]['workspace_id']

    # 3. Check if workspace already exists for this email
    if clean_email:
        ws_res = supabase_admin.table('workspaces').select('id').eq('name', f"Workspace ({clean_email})").execute()
        if ws_res.data:
            return ws_res.data[0]['id']
        
        # 4. Create a new isolated workspace for this user
        try:
            ws = supabase_admin.table('workspaces').insert({'name': f'Workspace ({clean_email})', 'plan': 'trial'}).execute()
            if ws.data:
                return ws.data[0]['id']
        except Exception:
            pass

    # 5. No email provided (e.g. demo mode) — use primary workspace
    if not clean_email:
        return PRIMARY_WS_ID
    
    return None

@app.get("/api/workspace")
async def get_workspace(request: Request):
    """Get current workspace info for the user"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    ws = supabase_admin.table('workspaces').select('*').eq('id', ws_id).execute()
    return {"data": ws.data[0] if ws.data else None}

@app.patch("/api/workspace")
async def update_workspace(request: Request):
    """Update workspace name / settings"""
    data = await request.json()
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
    allowed = {"name"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    res = supabase_admin.table('workspaces').update(update_data).eq('id', ws_id).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

@app.get("/api/workspace/agents")
async def get_agents(request: Request):
    """Get all agents in the workspace for the authenticated user"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        return {"data": []}
    agents = supabase_admin.table('users').select('id, email, role, created_at').eq('workspace_id', ws_id).execute()
    agents_data = agents.data or []
    
    # If workspace users table has no rows for this workspace yet, include requesting user as owner
    user_email = request.headers.get("X-User-Email") or request.query_params.get("user_email")
    if not agents_data and user_email:
        agents_data = [{
            "id": "owner",
            "email": user_email,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        }]
    return {"data": agents_data}

@app.post("/api/workspace/invite")
async def invite_agent(request: Request):
    """Invite a new agent to the workspace"""
    data = await request.json()
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    existing = supabase_admin.table('users').select('id').eq('email', email).eq('workspace_id', ws_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already exists in this workspace")
        
    try:
        res = supabase_admin.auth.admin.invite_user_by_email(email)
        user_id = res.user.id
        
        supabase_admin.table('users').upsert({
            'id': user_id,
            'workspace_id': ws_id,
            'email': email,
            'role': 'agent'
        }).execute()
        
        return {"status": "success", "message": "Invitation sent successfully"}
    except Exception as e:
        logger.error(f"Failed to invite user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/channels")
async def get_channels(request: Request):
    """Get all connected channels"""
    user_email = request.headers.get("X-User-Email") or request.query_params.get("user_email")
    user_id = request.headers.get("X-User-Id") or request.query_params.get("user_id")
    ws_id = _get_demo_workspace_id(user_email=user_email, user_id=user_id)
    if not ws_id:
        return {"data": []}
    channels = supabase_admin.table('channels').select('*').eq('workspace_id', ws_id).execute()
    return {"data": channels.data}

@app.delete("/api/channels/{channel_id}")
async def delete_channel(channel_id: str):
    """Disconnect a channel"""
    supabase_admin.table('channels').update({"status": "disconnected"}).eq('id', channel_id).execute()
    return {"status": "success"}

@app.post("/api/channels/{channel_id}/token")
async def update_channel_token(channel_id: str, request: Request):
    """Update or refresh the Meta access token for a channel"""
    data = await request.json()
    token = data.get("access_token")
    if not token:
        raise HTTPException(status_code=400, detail="access_token required")
    
    res = supabase_admin.table('channels').update({
        "access_token": token,
        "status": "active"
    }).eq('id', channel_id).execute()
    return {"status": "success", "data": res.data[0] if res.data else None}

@app.post("/api/channels/{channel_id}/coexistence")
async def toggle_whatsapp_coexistence(channel_id: str, request: Request):
    """Toggle WhatsApp Coexistence mode on/off for a channel"""
    data = await request.json()
    enabled = data.get("enabled", True)
    
    channel_res = supabase_admin.table('channels').select('*').eq('id', channel_id).execute()
    if not channel_res.data:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    channel = channel_res.data[0]
    if channel.get('type') != 'whatsapp':
        raise HTTPException(status_code=400, detail="Coexistence is only available for WhatsApp Cloud API channels")
        
    update_data = {"coexistence_enabled": enabled}
    if enabled and channel.get('historical_sync_status') == 'not_started':
        update_data["historical_sync_status"] = "pending"
        
    res = supabase_admin.table('channels').update(update_data).eq('id', channel_id).execute()
    return {"status": "success", "coexistence_enabled": enabled, "channel": res.data[0] if res.data else None}

@app.post("/api/channels/{channel_id}/sync-coexistence")
async def sync_whatsapp_coexistence(channel_id: str):
    """Trigger WhatsApp Coexistence historical chat backfill"""
    channel_res = supabase_admin.table('channels').select('*').eq('id', channel_id).execute()
    if not channel_res.data:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    channel = channel_res.data[0]
    if channel.get('type') != 'whatsapp':
        raise HTTPException(status_code=400, detail="Only WhatsApp channels support Coexistence backfill")
        
    workspace_id = channel.get('workspace_id')
    waba_id = channel.get('external_account_id', '')
    
    supabase_admin.table('channels').update({
        "historical_sync_status": "syncing",
        "historical_sync_started_at": datetime.utcnow().isoformat()
    }).eq('id', channel_id).execute()
    
    try:
        worker.simulate_historical_backfill(workspace_id, channel_id, waba_id)
        return {"status": "success", "message": "WhatsApp Coexistence backfill sync completed"}
    except Exception as e:
        logger.error(f"Failed Coexistence backfill: {e}")
        supabase_admin.table('channels').update({
            "historical_sync_status": "failed"
        }).eq('id', channel_id).execute()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/channels/{channel_id}/sync")
async def sync_channel(channel_id: str):
    """Sync historical conversations for a channel"""
    channel_res = supabase_admin.table('channels').select('*').eq('id', channel_id).execute()
    if not channel_res.data:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    channel = channel_res.data[0]
    if channel['type'] != 'instagram':
        raise HTTPException(status_code=400, detail="Only Instagram sync is supported currently")
        
    ig_account_id = channel.get('external_account_id')
    page_id = channel.get('meta_phone_id')
    access_token = channel.get('access_token')
    workspace_id = channel.get('workspace_id')
    
    target_id = ig_account_id or page_id
    if not target_id or not access_token:
        raise HTTPException(status_code=400, detail="Channel missing credentials")
        
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            # 1. Fetch conversations (Support both Instagram Graph API & Facebook Graph API tokens)
            if access_token.startswith("IG"):
                api_domain = "https://graph.instagram.com"
                conv_res = await client.get(
                    f"{api_domain}/me/conversations",
                    params={"access_token": access_token, "limit": 20}
                )
            else:
                api_domain = "https://graph.facebook.com/v18.0"
                conv_res = await client.get(
                    f"{api_domain}/{target_id}/conversations",
                    params={"platform": "instagram", "access_token": access_token, "limit": 20}
                )
                if conv_res.status_code == 400:
                    api_domain = "https://graph.instagram.com"
                    conv_res = await client.get(
                        f"{api_domain}/me/conversations",
                        params={"access_token": access_token, "limit": 20}
                    )

            conv_res.raise_for_status()
            conversations_data = conv_res.json().get('data', [])
            
            synced_count = 0
            for meta_conv in conversations_data:
                conv_id = meta_conv['id']
                
                # Fetch messages for this conversation
                msg_res = await client.get(
                    f"{api_domain}/{conv_id}/messages",
                    params={"fields": "message,created_time,from,to", "access_token": access_token, "limit": 20}
                )
                if msg_res.status_code != 200:
                    continue
                    
                messages_data = msg_res.json().get('data', [])
                if not messages_data:
                    continue
                    
                # Identify the customer
                customer_id = None
                customer_name = "IG User"
                for msg in messages_data:
                    sender = msg.get('from', {})
                    if sender.get('id') and sender.get('id') != ig_account_id:
                        customer_id = sender.get('id')
                        raw_name = sender.get('username') or sender.get('name')
                        if not raw_name and access_token:
                            try:
                                ig_res = await client.get(f"https://graph.instagram.com/{customer_id}?fields=name,username", params={"access_token": access_token}, timeout=5.0)
                                if ig_res.status_code == 200:
                                    prof = ig_res.json()
                                    raw_name = prof.get('name') or prof.get('username')
                            except Exception:
                                pass
                        customer_name = raw_name or f"IG User {customer_id[-4:]}"
                        break
                    
                if not customer_id:
                    continue # Skip if couldn't identify customer
                    
                # 2. Upsert Contact
                contact_res = supabase_admin.table('contacts').select('*').eq('channel_id', channel_id).eq('external_id', customer_id).execute()
                if not contact_res.data:
                    new_contact = supabase_admin.table('contacts').insert({
                        "workspace_id": workspace_id,
                        "channel_id": channel_id,
                        "external_id": customer_id,
                        "name": customer_name
                    }).execute()
                    contact_id = new_contact.data[0]['id']
                else:
                    contact_id = contact_res.data[0]['id']
                    if "IG User" in contact_res.data[0].get("name", "") and customer_name != "IG User":
                        supabase_admin.table('contacts').update({"name": customer_name}).eq('id', contact_id).execute()
                    
                # 3. Upsert Conversation
                db_conv_res = supabase_admin.table('conversations').select('*').eq('contact_id', contact_id).execute()
                if not db_conv_res.data:
                    new_db_conv = supabase_admin.table('conversations').insert({
                        "workspace_id": workspace_id,
                        "contact_id": contact_id,
                        "status": "open",
                        "last_message_at": messages_data[0].get('created_time')
                    }).execute()
                    db_conv_id = new_db_conv.data[0]['id']
                else:
                    db_conv_id = db_conv_res.data[0]['id']
                    
                # 4. Insert Messages (reverse order to get oldest first)
                for msg in reversed(messages_data):
                    msg_id = msg.get('id')
                    
                    # Check if exists
                    exist_msg = supabase_admin.table('messages').select('id').eq('meta_message_id', msg_id).execute()
                    if exist_msg.data:
                        continue
                        
                    direction = "out" if msg.get('from', {}).get('id') == ig_account_id else "in"
                    
                    supabase_admin.table('messages').insert({
                        "conversation_id": db_conv_id,
                        "direction": direction,
                        "source": "sync",
                        "content": msg.get('message', ''),
                        "sent_at": msg.get('created_time'),
                        "meta_message_id": msg_id
                    }).execute()
                    
                synced_count += 1
                
        return {"status": "success", "synced_conversations": synced_count}
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- DASHBOARD ANALYTICS API ---

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """Get overview statistics for the dashboard"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        return {"total_contacts": 0, "total_conversations": 0, "open_conversations": 0, "resolved_conversations": 0}
    
    contacts = supabase_admin.table('contacts').select('id', count='exact').eq('workspace_id', ws_id).execute()
    convs = supabase_admin.table('conversations').select('id, status', count='exact').eq('workspace_id', ws_id).execute()
    convs_data = convs.data or []
    open_convs = [c for c in convs_data if c.get('status') == 'open']
    resolved_convs = [c for c in convs_data if c.get('status') == 'resolved']
    
    return {
        "total_contacts": contacts.count or len(contacts.data or []),
        "total_conversations": convs.count or len(convs_data),
        "open_conversations": len(open_convs),
        "resolved_conversations": len(resolved_convs),
    }

# --- CHANNEL CONNECTION API ---

@app.post("/api/channels/whatsapp/discover-numbers")
async def discover_whatsapp_numbers(request: Request):
    """Fetch all WhatsApp Business Phone Numbers linked to the user's Meta account"""
    data = await request.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Access token is required")

    import httpx
    phone_numbers = []
    try:
        async with httpx.AsyncClient() as client:
            # 1. Try client_whatsapp_business_accounts
            res1 = await client.get(f"https://graph.facebook.com/v18.0/me/client_whatsapp_business_accounts?fields=id,name,phone_numbers{{id,display_phone_number,verified_name}}&access_token={access_token}")
            if res1.status_code == 200:
                for waba in res1.json().get('data', []):
                    waba_name = waba.get('name', 'WhatsApp Business Account')
                    for pn in waba.get('phone_numbers', {}).get('data', []):
                        phone_numbers.append({
                            'phone_number_id': pn['id'],
                            'display_phone_number': pn.get('display_phone_number', pn['id']),
                            'verified_name': pn.get('verified_name') or waba_name,
                            'waba_id': waba.get('id')
                        })

            # 2. Try owned_whatsapp_business_accounts
            res2 = await client.get(f"https://graph.facebook.com/v18.0/me/businesses?fields=owned_whatsapp_business_accounts{{id,name,phone_numbers{{id,display_phone_number,verified_name}}}}&access_token={access_token}")
            if res2.status_code == 200:
                for biz in res2.json().get('data', []):
                    for waba in biz.get('owned_whatsapp_business_accounts', {}).get('data', []):
                        waba_name = waba.get('name', 'WhatsApp Business Account')
                        for pn in waba.get('phone_numbers', {}).get('data', []):
                            if not any(p['phone_number_id'] == pn['id'] for p in phone_numbers):
                                phone_numbers.append({
                                    'phone_number_id': pn['id'],
                                    'display_phone_number': pn.get('display_phone_number', pn['id']),
                                    'verified_name': pn.get('verified_name') or waba_name,
                                    'waba_id': waba.get('id')
                                })
    except Exception as e:
        logger.error(f"Error discovering WhatsApp phone numbers: {e}")

    return {"status": "success", "numbers": phone_numbers}

@app.post("/api/channels/whatsapp/connect")
async def connect_whatsapp_channel(request: Request):
    data = await request.json()
    access_token = data.get("access_token")
    phone_number_id = data.get("phone_number_id")
    user_email = data.get("user_email") or request.headers.get("X-User-Email")
    workspace_id = _get_demo_workspace_id(user_email=user_email)
    
    if not access_token or not workspace_id:
        raise HTTPException(status_code=400, detail="Access token is required")

    import httpx
    # If phone_number_id missing, auto-discover WABA phone_number_id on server side
    if not phone_number_id:
        try:
            async with httpx.AsyncClient() as client:
                res1 = await client.get(f"https://graph.facebook.com/v18.0/me/client_whatsapp_business_accounts?fields=id,name,phone_numbers&access_token={access_token}")
                if res1.status_code == 200:
                    for waba in res1.json().get('data', []):
                        pn_list = waba.get('phone_numbers', {}).get('data', [])
                        if pn_list:
                            phone_number_id = pn_list[0]['id']
                            break

                if not phone_number_id:
                    res2 = await client.get(f"https://graph.facebook.com/v18.0/me/businesses?fields=owned_whatsapp_business_accounts{{phone_numbers}}&access_token={access_token}")
                    if res2.status_code == 200:
                        for biz in res2.json().get('data', []):
                            waba_list = biz.get('owned_whatsapp_business_accounts', {}).get('data', [])
                            for waba in waba_list:
                                pn_list = waba.get('phone_numbers', {}).get('data', [])
                                if pn_list:
                                    phone_number_id = pn_list[0]['id']
                                    break
        except Exception as e:
            logger.error(f"Server auto-discovery for WhatsApp failed: {e}")

    if not phone_number_id:
        raise HTTPException(status_code=400, detail="No WhatsApp Business Phone Number found linked to your Facebook Account. Please ensure you have a WhatsApp Business Account in Meta Business Manager.")
        
    existing = supabase_admin.table("channels").select("id").eq("workspace_id", workspace_id).eq("meta_phone_id", phone_number_id).eq("type", "whatsapp").execute()
    if existing.data:
        response = supabase_admin.table("channels").update({
            "access_token": access_token,
            "status": "active"
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        response = supabase_admin.table("channels").insert({
            "workspace_id": workspace_id,
            "type": "whatsapp",
            "external_account_id": phone_number_id,
            "meta_phone_id": phone_number_id,
            "access_token": access_token,
            "status": "active"
        }).execute()
    
    return {"status": "connected", "data": response.data[0] if response.data else None}

@app.post("/api/channels/instagram/connect")
async def connect_instagram_channel(request: Request):
    data = await request.json()
    access_token = data.get("access_token")
    ig_account_id = data.get("ig_account_id")
    page_id = data.get("page_id")
    page_access_token = data.get("page_access_token")
    user_email = data.get("user_email") or request.headers.get("X-User-Email")
    workspace_id = _get_demo_workspace_id(user_email=user_email)
    
    if not access_token or not workspace_id:
        raise HTTPException(status_code=400, detail="Access token is required")

    import httpx
    # If ig_account_id is missing, auto-discover from Facebook Pages on server side
    if not ig_account_id:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account,access_token&access_token={access_token}")
                if res.status_code == 200:
                    for page in res.json().get('data', []):
                        ig_acc = page.get('instagram_business_account')
                        if ig_acc and ig_acc.get('id'):
                            ig_account_id = ig_acc['id']
                            page_id = page.get('id')
                            page_access_token = page.get('access_token')
                            break
        except Exception as e:
            logger.error(f"Server auto-discovery for Instagram failed: {e}")

    if not ig_account_id:
        raise HTTPException(status_code=400, detail="No Instagram Business Account linked to your Facebook Pages found.")

    token_to_save = page_access_token or access_token

    if page_id and page_access_token:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"https://graph.facebook.com/v18.0/{page_id}/subscribed_apps",
                    headers={"Authorization": f"Bearer {page_access_token}"},
                    data={"subscribed_fields": "messages,messaging_postbacks"}
                )
        except Exception as e:
            logger.error(f"Failed to subscribe page: {e}")

    existing = supabase_admin.table("channels").select("id").eq("workspace_id", workspace_id).eq("external_account_id", ig_account_id).eq("type", "instagram").execute()
    
    if existing.data:
        response = supabase_admin.table("channels").update({
            "access_token": token_to_save,
            "status": "active",
            "meta_phone_id": page_id
        }).eq("id", existing.data[0]["id"]).execute()
    else:
        response = supabase_admin.table("channels").insert({
            "workspace_id": workspace_id,
            "type": "instagram",
            "external_account_id": ig_account_id,
            "access_token": token_to_save,
            "meta_phone_id": page_id,
            "status": "active"
        }).execute()
        
    return {"status": "connected", "data": response.data[0] if response.data else None}

# --- API TOKEN API ---
import secrets

@app.get("/api/workspace/api-tokens")
async def get_api_tokens(request: Request, token_type: str = None):
    """Get all API tokens for the workspace"""
    ws_id = _extract_workspace_id(request)
    if not ws_id:
        return {"data": []}
    
    query = supabase_admin.table('api_tokens').select('id, name, token, type, is_active, last_used_at, created_at').eq('workspace_id', ws_id).eq('is_active', True)
    if token_type:
        query = query.eq('type', token_type)
    tokens = query.order('created_at', desc=True).execute()
    
    # Mask token — show only first 8 + last 4 characters
    result = []
    for t in tokens.data or []:
        masked = t['token'][:8] + '•' * 20 + t['token'][-4:]
        result.append({**t, 'token_display': masked})
    return {"data": result}

@app.post("/api/workspace/api-tokens")
async def create_api_token(request: Request):
    """Generate a new API token"""
    data = await request.json()
    name = data.get("name", "My API Token")
    token_type = data.get("type", "omnichannel")
    
    if token_type not in ("omnichannel", "chatbot"):
        raise HTTPException(status_code=400, detail="type must be 'omnichannel' or 'chatbot'")
    
    ws_id = _extract_workspace_id(request)
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
