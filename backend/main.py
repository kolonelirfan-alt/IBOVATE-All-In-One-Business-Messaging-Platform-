import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.responses import PlainTextResponse
from redis import Redis
from rq import Queue
from config import settings
import worker

app = FastAPI(title="OmniCRM API")

redis_conn = Redis.from_url(settings.redis_url)
q = Queue('webhook_tasks', connection=redis_conn)

def verify_meta_signature(request: Request, payload: bytes):
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing X-Hub-Signature-256")
    
    # signature looks like "sha256=..."
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
    # This is for Meta's initial webhook verification
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/webhook/whatsapp")
async def handle_whatsapp_webhook(request: Request):
    payload = await request.body()
    verify_meta_signature(request, payload)
    
    data = await request.json()
    
    # Push to queue and return 200 immediately
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

# --- CHANNEL CONNECTION API ---

@app.post("/api/channels/whatsapp/connect")
async def connect_whatsapp_channel(request: Request):
    # In a real app, you would require Supabase JWT authentication here to get workspace_id.
    # We expect the payload from frontend containing the short-lived access token.
    data = await request.json()
    access_token = data.get("access_token")
    workspace_id = data.get("workspace_id") # Normally from JWT
    
    if not access_token or not workspace_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
        
    # Send to worker to do the Meta API call and save to DB
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

