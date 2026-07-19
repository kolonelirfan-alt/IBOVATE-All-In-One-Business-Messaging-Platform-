from supabase import create_client, Client
from config import settings
import logging
from datetime import datetime, timedelta

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def connect_whatsapp_channel(workspace_id: str, access_token: str):
    logger.info(f"Connecting WA channel for workspace {workspace_id}")
    # TODO: In real life, call Meta Graph API to exchange token and get WABA ID
    simulated_waba_id = "waba_" + access_token[:8]
    
    # Upsert channel
    response = supabase.table("channels").insert({
        "workspace_id": workspace_id,
        "type": "whatsapp",
        "external_account_id": simulated_waba_id,
        "coexistence_enabled": True,
        "status": "active",
        "historical_sync_status": "syncing",
        "historical_sync_started_at": datetime.utcnow().isoformat()
    }).execute()
    
    if hasattr(response, 'data') and len(response.data) > 0:
        channel_id = response.data[0]['id']
        logger.info(f"Channel {channel_id} created. Starting historical backfill simulation...")
        
        # Simulate backfill payload from Meta
        simulate_historical_backfill(workspace_id, channel_id, simulated_waba_id)

def connect_instagram_channel(workspace_id: str, code: str):
    logger.info(f"Connecting IG channel for workspace {workspace_id}")
    simulated_ig_id = "ig_" + code[:8]
    
    supabase.table("channels").insert({
        "workspace_id": workspace_id,
        "type": "instagram",
        "external_account_id": simulated_ig_id,
        "status": "active"
    }).execute()

def simulate_historical_backfill(workspace_id: str, channel_id: str, waba_id: str):
    logger.info("Simulating Historical Backfill batch...")
    # This simulates what Meta would normally push via Webhook as a historical batch
    
    # 1. Upsert contact
    contact_data = {
        "workspace_id": workspace_id,
        "channel_id": channel_id,
        "external_id": "+628999999999",
        "name": "Historical Customer"
    }
    contact = supabase.table("contacts").insert(contact_data).execute()
    contact_id = contact.data[0]['id']
    
    # 2. Upsert conversation
    conv_data = {
        "workspace_id": workspace_id,
        "contact_id": contact_id,
        "status": "resolved"
    }
    conv = supabase.table("conversations").insert(conv_data).execute()
    conv_id = conv.data[0]['id']
    
    # 3. Insert messages with is_historical=True and specific sent_at
    past_date = datetime.utcnow() - timedelta(days=30)
    messages = [
        {
            "conversation_id": conv_id,
            "direction": "in",
            "source": "customer",
            "content": "Halo, ini pesan lama",
            "sent_at": past_date.isoformat(),
            "meta_message_id": "meta_hist_1",
            "is_historical": True
        },
        {
            "conversation_id": conv_id,
            "direction": "out",
            "source": "app_echo",
            "content": "Ya, dibalas dari HP dulu",
            "sent_at": (past_date + timedelta(minutes=5)).isoformat(),
            "meta_message_id": "meta_hist_2",
            "is_historical": True
        }
    ]
    supabase.table("messages").insert(messages).execute()
    
    # Update status completed
    supabase.table("channels").update({
        "historical_sync_status": "completed",
        "historical_sync_completed_at": datetime.utcnow().isoformat()
    }).eq("id", channel_id).execute()
    logger.info("Historical Backfill complete.")

def process_whatsapp_webhook(payload: dict):
    logger.info("Processing WhatsApp webhook")
    # For a real implementation, we parse entry[0].changes[0].value
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                
                # Identify if it's an echo (sent from WA Business App)
                is_echo = False
                source = "customer"
                direction = "in"
                
                if "statuses" in value:
                    # Message status update (delivered, read)
                    continue
                    
                if "messages" in value:
                    message_info = value["messages"][0]
                    # Check if it's an echo message (meta usually provides specific fields for this depending on setup, but often you check the `from` vs `waba_id`)
                    # We will mock the detection
                    if message_info.get("type") == "echo" or message_info.get("from") == "me":
                        is_echo = True
                        source = "app_echo"
                        direction = "out"
                        
                    meta_message_id = message_info.get("id")
                    
                    # Deduplication check
                    existing = supabase.table("messages").select("id").eq("meta_message_id", meta_message_id).execute()
                    if existing.data:
                        logger.info("Message already exists, skipping duplicate.")
                        continue
                        
                    # Save to DB logic here...
                    # (Find conversation, update session_expires_at if customer, insert message)
                    # session_expires_at = sent_at + 24h IF source == 'customer'
                    logger.info(f"Processed message {meta_message_id}, Source: {source}")
    except Exception as e:
        logger.error(f"Failed to process WA webhook: {e}")

def process_instagram_webhook(payload: dict):
    logger.info("Processing Instagram webhook")
    # TODO: parsing logic
    pass
