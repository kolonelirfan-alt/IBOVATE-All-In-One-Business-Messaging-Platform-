from supabase import create_client, Client
from config import settings
import logging
from datetime import datetime, timedelta

# Initialize Supabase admin client for worker
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Removed connect functions as they are handled synchronously in main.py now.

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
    try:
        entries = payload.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                
                # We need the phone_number_id to find our channel
                metadata = value.get("metadata", {})
                phone_number_id = metadata.get("phone_number_id")
                if not phone_number_id:
                    continue
                    
                # Find channel
                channel_res = supabase.table("channels").select("*").eq("meta_phone_id", phone_number_id).execute()
                if not channel_res.data:
                    logger.warning(f"Webhook received for unknown phone_number_id: {phone_number_id}")
                    continue
                channel = channel_res.data[0]
                workspace_id = channel["workspace_id"]
                
                if "messages" in value:
                    for message_info in value["messages"]:
                        meta_message_id = message_info.get("id")
                        
                        # Deduplication check
                        existing = supabase.table("messages").select("id").eq("meta_message_id", meta_message_id).execute()
                        if existing.data:
                            logger.info("Message already exists, skipping duplicate.")
                            continue
                        
                        from_number = message_info.get("from")
                        timestamp = message_info.get("timestamp")
                        message_type = message_info.get("type", "text")
                        
                        # Coexistence Echo detection (messages sent from WhatsApp Business App on phone)
                        is_echo = message_info.get("is_echo", False) or (
                            from_number in [phone_number_id, channel.get("meta_phone_id"), channel.get("external_account_id")]
                        )
                        direction = "out" if is_echo else "in"
                        source = "app_echo" if is_echo else "customer"
                        
                        # For echo message, contact is recipient (to), otherwise sender (from)
                        external_contact_id = message_info.get("to", from_number) if is_echo else from_number
                        
                        content = ""
                        if message_type == "text":
                            content = message_info.get("text", {}).get("body", "")
                        
                        # Get contact info (Meta provides it in "contacts" array)
                        contacts_info = value.get("contacts", [])
                        contact_name = external_contact_id
                        for c in contacts_info:
                            if c.get("wa_id") == external_contact_id:
                                contact_name = c.get("profile", {}).get("name", external_contact_id)
                                break
                                
                        # 1. Upsert Contact
                        contact_res = supabase.table("contacts").select("*").eq("channel_id", channel["id"]).eq("external_id", external_contact_id).execute()
                        if not contact_res.data:
                            new_contact = supabase.table("contacts").insert({
                                "workspace_id": workspace_id,
                                "channel_id": channel["id"],
                                "external_id": external_contact_id,
                                "name": contact_name,
                                "phone": f"+{external_contact_id}"
                            }).execute()
                            contact_id = new_contact.data[0]["id"]
                        else:
                            contact_id = contact_res.data[0]["id"]
                            # Update name if previously saved as just phone number
                            if contact_res.data[0].get('name') == external_contact_id and contact_name != external_contact_id:
                                supabase.table("contacts").update({"name": contact_name}).eq("id", contact_id).execute()
                            
                        # 2. Upsert Conversation
                        conv_res = supabase.table("conversations").select("*").eq("contact_id", contact_id).execute()
                        if not conv_res.data:
                            new_conv = supabase.table("conversations").insert({
                                "workspace_id": workspace_id,
                                "contact_id": contact_id,
                                "status": "open"
                            }).execute()
                            conv_id = new_conv.data[0]["id"]
                        else:
                            conv_id = conv_res.data[0]["id"]
                            # If it was resolved, open it again since customer replied
                            if conv_res.data[0]["status"] == "resolved":
                                supabase.table("conversations").update({"status": "open"}).eq("id", conv_id).execute()
                        
                        # 3. Insert Message
                        sent_at = datetime.fromtimestamp(int(timestamp)).isoformat() if timestamp else datetime.utcnow().isoformat()
                        
                        supabase.table("messages").insert({
                            "conversation_id": conv_id,
                            "direction": direction,
                            "source": source,
                            "content": content,
                            "meta_message_id": meta_message_id,
                            "sent_at": sent_at
                        }).execute()
                        
                        # 4. Update Conversation last message time
                        session_expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
                        supabase.table("conversations").update({
                            "last_message_at": sent_at,
                            "session_expires_at": session_expires_at
                        }).eq("id", conv_id).execute()
                        
                        logger.info(f"Processed message {meta_message_id} from {from_number}")
    except Exception as e:
        logger.error(f"Failed to process WA webhook: {e}")

def _handle_ig_message(message_info: dict):
    if "message" not in message_info:
        return
        
    sender_id = message_info.get("sender", {}).get("id")
    recipient_id = message_info.get("recipient", {}).get("id")
    timestamp = message_info.get("timestamp")
    message_obj = message_info.get("message", {})
    
    meta_message_id = message_obj.get("mid")
    content = message_obj.get("text", "")
    
    if not sender_id or not recipient_id or not meta_message_id:
        return
        
    # Find channel. In IG, recipient_id is our IG Account ID (external_account_id) or Page ID (meta_phone_id)
    channel_res = supabase.table("channels").select("*").eq("external_account_id", recipient_id).eq("type", "instagram").execute()
    if not channel_res.data:
        channel_res = supabase.table("channels").select("*").eq("meta_phone_id", recipient_id).eq("type", "instagram").execute()
    if not channel_res.data:
        # Check if it's an echo (we sent the message)
        channel_res = supabase.table("channels").select("*").eq("external_account_id", sender_id).eq("type", "instagram").execute()
        if not channel_res.data:
            channel_res = supabase.table("channels").select("*").eq("meta_phone_id", sender_id).eq("type", "instagram").execute()
        if not channel_res.data:
            logger.warning(f"IG Webhook received for unknown account: {recipient_id}")
            return
        else:
            logger.info("Ignoring IG echo message")
            return
            
    channel = channel_res.data[0]
    workspace_id = channel["workspace_id"]
    
    # Deduplication check
    existing = supabase.table("messages").select("id").eq("meta_message_id", meta_message_id).execute()
    if existing.data:
        logger.info("IG Message already exists, skipping duplicate.")
        return
        
    # 1. Upsert Contact
    contact_res = supabase.table("contacts").select("*").eq("channel_id", channel["id"]).eq("external_id", sender_id).execute()
    if not contact_res.data:
        # Fetch IG username if possible
        access_token = channel.get("access_token")
        name = f"IG User {sender_id[-4:]}"
        if access_token:
            import httpx
            try:
                # Try graph.instagram.com first
                res = httpx.get(
                    f"https://graph.instagram.com/{sender_id}?fields=name,username&access_token={access_token}",
                    timeout=5.0
                )
                if res.status_code != 200:
                    res = httpx.get(
                        f"https://graph.facebook.com/v18.0/{sender_id}?fields=name,username&access_token={access_token}",
                        timeout=5.0
                    )
                if res.status_code == 200:
                    profile = res.json()
                    name = profile.get("name") or profile.get("username") or name
            except Exception as e:
                logger.error(f"Failed to fetch IG profile for {sender_id}: {e}")

        new_contact = supabase.table("contacts").insert({
            "workspace_id": workspace_id,
            "channel_id": channel["id"],
            "external_id": sender_id,
            "name": name
        }).execute()
        contact_id = new_contact.data[0]["id"]
    else:
        contact_id = contact_res.data[0]["id"]
        # Update name if previously saved as IG User
        if "IG User" in contact_res.data[0].get("name", ""):
            access_token = channel.get("access_token")
            if access_token:
                import httpx
                try:
                    res = httpx.get(f"https://graph.instagram.com/{sender_id}?fields=name,username&access_token={access_token}", timeout=5.0)
                    if res.status_code != 200:
                        res = httpx.get(f"https://graph.facebook.com/v18.0/{sender_id}?fields=name,username&access_token={access_token}", timeout=5.0)
                    if res.status_code == 200:
                        profile = res.json()
                        fetched_name = profile.get("name") or profile.get("username")
                        if fetched_name:
                            supabase.table("contacts").update({"name": fetched_name}).eq("id", contact_id).execute()
                except Exception as e:
                    pass
        
    # 2. Upsert Conversation
    conv_res = supabase.table("conversations").select("*").eq("contact_id", contact_id).execute()
    if not conv_res.data:
        new_conv = supabase.table("conversations").insert({
            "workspace_id": workspace_id,
            "contact_id": contact_id,
            "status": "open"
        }).execute()
        conv_id = new_conv.data[0]["id"]
    else:
        conv_id = conv_res.data[0]["id"]
        if conv_res.data[0]["status"] == "resolved":
            supabase.table("conversations").update({"status": "open"}).eq("id", conv_id).execute()
            
    # 3. Insert Message
    if timestamp:
        try:
            # IG timestamp is usually in milliseconds
            ts_seconds = int(timestamp) / 1000.0 if len(str(timestamp)) > 10 else int(timestamp)
            sent_at = datetime.fromtimestamp(ts_seconds).isoformat()
        except:
            sent_at = datetime.utcnow().isoformat()
    else:
        sent_at = datetime.utcnow().isoformat()
        
    supabase.table("messages").insert({
        "conversation_id": conv_id,
        "direction": "in",
        "source": "customer",
        "content": content,
        "meta_message_id": meta_message_id,
        "sent_at": sent_at
    }).execute()
    
    # 4. Update Conversation status
    session_expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
    supabase.table("conversations").update({
        "last_message_at": sent_at,
        "session_expires_at": session_expires_at
    }).eq("id", conv_id).execute()
    
    logger.info(f"Processed IG message {meta_message_id} from {sender_id}")

def process_instagram_webhook(payload: dict):
    logger.info(f"Processing Instagram webhook, payload: {payload}")
    try:
        # Check if it's the Meta "Test" button payload format at root (rare, but just in case)
        if "value" in payload and payload.get("field") == "messages":
            _handle_ig_message(payload["value"])
            return

        # Standard Instagram webhook format
        entries = payload.get("entry", [])
        for entry in entries:
            # 1. Real Instagram messages usually come in "messaging" array
            messaging_events = entry.get("messaging", [])
            for message_info in messaging_events:
                _handle_ig_message(message_info)
                
            # 2. Meta Dashboard "Test" button sends them in "changes" array
            changes = entry.get("changes", [])
            for change in changes:
                if change.get("field") == "messages":
                    _handle_ig_message(change.get("value", {}))
    except Exception as e:
        logger.error(f"Failed to process IG webhook: {e}")
