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
from datetime import datetime

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
        raise HTTPException(status_code=403, detail="Signature mismatch")

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
async def get_contacts(workspace_id: str):
    """Get all contacts with their latest conversation for the sidebar"""
    if not workspace_id:
        raise HTTPException(status_code=400, detail="workspace_id is required")
        
    # Get contacts
    contacts_res = supabase.table('contacts').select('*, channels(type)').eq('workspace_id', workspace_id).execute()
    contacts = contacts_res.data
    
    result = []
    for contact in contacts:
        # Get latest conversation for this contact
        conv_res = supabase.table('conversations').select('*').eq('contact_id', contact['id']).order('last_message_at', desc=True).limit(1).execute()
        conv = conv_res.data[0] if conv_res.data else None
        
        last_msg = None
        if conv:
            msg_res = supabase.table('messages').select('*').eq('conversation_id', conv['id']).order('sent_at', desc=True).limit(1).execute()
            last_msg = msg_res.data[0] if msg_res.data else None
            
        result.append({
            "id": contact['id'],
            "external_id": contact['external_id'],
            "name": contact['name'] or contact['external_id'],
            "phone": contact.get('phone'),
            "channel": contact['channels']['type'] if contact.get('channels') else 'unknown',
            "status": 'online' if conv and conv.get('status') == 'open' else 'offline',
            "tags": [],
            "last_message_at": last_msg['sent_at'] if last_msg else None,
            "last_message_preview": last_msg['content'] if last_msg else None,
            "conversation_id": conv['id'] if conv else None
        })
        
    return {"data": result}

@app.get("/api/inbox/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str):
    """Get all messages for a specific conversation"""
    msg_res = supabase.table('messages').select('*').eq('conversation_id', conversation_id).order('sent_at', desc=False).execute()
    return {"data": msg_res.data}

@app.post("/api/inbox/messages")
async def send_message(request: Request):
    """Send a message from the dashboard"""
    data = await request.json()
    conversation_id = data.get("conversation_id")
    content = data.get("content")
    
    if not conversation_id or not content:
        raise HTTPException(status_code=400, detail="conversation_id and content are required")
        
    # In a real app, you would:
    # 1. Fetch contact info to get external_id (phone/IG handle)
    # 2. Call Meta Graph API to send the message
    # 3. Save the message to DB only if successful or let webhook echo handle it
    
    # For now, we just insert into DB to simulate
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

# --- CHANNEL CONNECTION API ---

@app.post("/api/channels/whatsapp/connect")
async def connect_whatsapp_channel(request: Request):
    data = await request.json()
    access_token = data.get("access_token")
    workspace_id = data.get("workspace_id")
    
    if not access_token or not workspace_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    q.enqueue(worker.connect_whatsapp_channel, workspace_id, access_token)
    return {"status": "processing"}

@app.post("/api/channels/instagram/connect")
async def connect_instagram_channel(request: Request):
    data = await request.json()
    code = data.get("code")
    workspace_id = data.get("workspace_id")
    
    if not code or not workspace_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    q.enqueue(worker.connect_instagram_channel, workspace_id, code)
    return {"status": "processing"}

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
