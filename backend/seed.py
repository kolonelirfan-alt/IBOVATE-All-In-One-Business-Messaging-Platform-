import os
from database import supabase
from datetime import datetime, timedelta

def seed_db():
    print("Seeding database...")
    
    # 1. Create Workspace
    workspace = supabase.table('workspaces').insert({
        "name": "Elegant Beauty (Demo)",
        "plan": "premium"
    }).execute()
    ws_id = workspace.data[0]['id']
    
    # 2. Create Channel
    channel = supabase.table('channels').insert({
        "workspace_id": ws_id,
        "type": "whatsapp",
        "external_account_id": "123456789",
        "status": "active"
    }).execute()
    ch_id = channel.data[0]['id']
    
    # 3. Create Contact
    contact = supabase.table('contacts').insert({
        "workspace_id": ws_id,
        "channel_id": ch_id,
        "external_id": "6281234567890",
        "name": "Rina Gunawan",
        "phone": "+6281234567890"
    }).execute()
    c_id = contact.data[0]['id']
    
    # 4. Create Conversation
    conversation = supabase.table('conversations').insert({
        "workspace_id": ws_id,
        "contact_id": c_id,
        "status": "open",
        "last_message_at": datetime.utcnow().isoformat()
    }).execute()
    conv_id = conversation.data[0]['id']
    
    # 5. Insert Messages
    messages = [
        {
            "conversation_id": conv_id,
            "direction": "in",
            "source": "customer",
            "content": "Halo, apakah produk serum vit C masih ada?",
            "sent_at": (datetime.utcnow() - timedelta(minutes=10)).isoformat()
        },
        {
            "conversation_id": conv_id,
            "direction": "out",
            "source": "dashboard",
            "content": "Halo Kak Rina! Betul, serum Vit C kami masih ready stock ya kak. Mau pesan berapa botol?",
            "sent_at": (datetime.utcnow() - timedelta(minutes=5)).isoformat()
        }
    ]
    supabase.table('messages').insert(messages).execute()
    
    print(f"Seed complete! Workspace ID: {ws_id}")

if __name__ == "__main__":
    seed_db()
