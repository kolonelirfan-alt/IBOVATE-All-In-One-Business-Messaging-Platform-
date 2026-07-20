import os
from database import supabase_admin
from datetime import datetime, timedelta

def seed_db():
    print("Seeding database with realistic dummy data...")
    
    # 1. Create Workspace
    workspace = supabase_admin.table('workspaces').insert({
        "name": "Elegant Beauty Store",
        "plan": "premium"
    }).execute()
    ws_id = workspace.data[0]['id']
    
    # 2. Create Channels
    wa_channel = supabase_admin.table('channels').insert({
        "workspace_id": ws_id,
        "type": "whatsapp",
        "external_account_id": "628111222333",
        "status": "active"
    }).execute()
    wa_ch_id = wa_channel.data[0]['id']
    
    ig_channel = supabase_admin.table('channels').insert({
        "workspace_id": ws_id,
        "type": "instagram",
        "external_account_id": "elegantbeauty.id",
        "status": "active"
    }).execute()
    ig_ch_id = ig_channel.data[0]['id']
    
    # 3. Create Contacts (mix of WA and IG)
    contacts_raw = [
        {"workspace_id": ws_id, "channel_id": wa_ch_id, "external_id": "62811111111", "name": "Rina Kusuma"},
        {"workspace_id": ws_id, "channel_id": wa_ch_id, "external_id": "62822222222", "name": "Budi Santoso"},
        {"workspace_id": ws_id, "channel_id": wa_ch_id, "external_id": "62833333333", "name": "Dewi Rahayu"},
        {"workspace_id": ws_id, "channel_id": ig_ch_id, "external_id": "siti_style",  "name": "Siti Aminah"},
        {"workspace_id": ws_id, "channel_id": wa_ch_id, "external_id": "62844444444", "name": "Erwan Novianto"},
        {"workspace_id": ws_id, "channel_id": wa_ch_id, "external_id": "62855555555", "name": "Anya (cust jkt)"},
    ]
    contacts = supabase_admin.table('contacts').insert(contacts_raw).execute()
    c = contacts.data  # list of contact objects
    
    # 4. Create Conversations with different statuses
    now = datetime.utcnow()
    convs_raw = [
        {"workspace_id": ws_id, "contact_id": c[0]['id'], "status": "open",     "priority": "high",   "last_message_at": (now - timedelta(minutes=2)).isoformat()},
        {"workspace_id": ws_id, "contact_id": c[1]['id'], "status": "open",     "priority": "medium", "last_message_at": (now - timedelta(minutes=10)).isoformat()},
        {"workspace_id": ws_id, "contact_id": c[2]['id'], "status": "open",     "priority": "low",    "last_message_at": (now - timedelta(minutes=25)).isoformat()},
        {"workspace_id": ws_id, "contact_id": c[3]['id'], "status": "open",     "priority": "medium", "last_message_at": (now - timedelta(hours=1)).isoformat()},
        {"workspace_id": ws_id, "contact_id": c[4]['id'], "status": "resolved", "priority": "high",   "last_message_at": (now - timedelta(hours=2)).isoformat()},
        {"workspace_id": ws_id, "contact_id": c[5]['id'], "status": "resolved", "priority": "low",    "last_message_at": (now - timedelta(hours=3)).isoformat()},
    ]
    convs = supabase_admin.table('conversations').insert(convs_raw).execute()
    cv = convs.data
    
    # 5. Insert realistic messages per conversation
    msgs = [
        # Rina - open, high priority
        {"conversation_id": cv[0]['id'], "direction": "in",  "source": "customer",  "content": "Kak, stok serum vit C 30ml masih ada ga?", "sent_at": (now - timedelta(minutes=5)).isoformat()},
        {"conversation_id": cv[0]['id'], "direction": "out", "source": "dashboard", "content": "Ada Kak Rina! Masih ready stock. Mau pesan berapa botol?", "sent_at": (now - timedelta(minutes=3)).isoformat()},
        {"conversation_id": cv[0]['id'], "direction": "in",  "source": "customer",  "content": "Mau 2 botol sekalian sunscreen kak!", "sent_at": (now - timedelta(minutes=2)).isoformat()},
        # Budi - open, medium priority  
        {"conversation_id": cv[1]['id'], "direction": "in",  "source": "customer",  "content": "Halo kak, bisa COD ga untuk area Bekasi?", "sent_at": (now - timedelta(minutes=15)).isoformat()},
        {"conversation_id": cv[1]['id'], "direction": "out", "source": "dashboard", "content": "Halo Kak Budi! Untuk area Bekasi bisa lewat JNE atau J&T ya kak, COD tersedia!", "sent_at": (now - timedelta(minutes=10)).isoformat()},
        # Dewi - open, low priority
        {"conversation_id": cv[2]['id'], "direction": "in",  "source": "customer",  "content": "Kak produk toner kalian cocok buat kulit sensitif ga?", "sent_at": (now - timedelta(minutes=25)).isoformat()},
        # Siti - open, medium (instagram)
        {"conversation_id": cv[3]['id'], "direction": "in",  "source": "customer",  "content": "Kak dari feed IG, moisturizer yg viral itu masih available?", "sent_at": (now - timedelta(hours=1)).isoformat()},
        {"conversation_id": cv[3]['id'], "direction": "out", "source": "dashboard", "content": "Halo Kak Siti! Ya masih ada, lagi promo buy 1 get 1 sampai akhir bulan 🎉", "sent_at": (now - timedelta(minutes=55)).isoformat()},
        # Erwan - resolved
        {"conversation_id": cv[4]['id'], "direction": "in",  "source": "customer",  "content": "Paket saya nomor resi JNE belum sampai juga kak sudah 5 hari", "sent_at": (now - timedelta(hours=3)).isoformat()},
        {"conversation_id": cv[4]['id'], "direction": "out", "source": "dashboard", "content": "Maaf Kak Erwan, kami cek dulu ya nomor resinya. Mohon ditunggu 🙏", "sent_at": (now - timedelta(hours=2, minutes=50)).isoformat()},
        {"conversation_id": cv[4]['id'], "direction": "in",  "source": "customer",  "content": "Ok sudah sampai kak, makasih!", "sent_at": (now - timedelta(hours=2)).isoformat()},
        # Anya - resolved
        {"conversation_id": cv[5]['id'], "direction": "in",  "source": "customer",  "content": "Mau tanya harga paket hampers lebaran dong kak", "sent_at": (now - timedelta(hours=4)).isoformat()},
        {"conversation_id": cv[5]['id'], "direction": "out", "source": "dashboard", "content": "Halo Kak Anya! Paket hampers mulai dari 150rb ya kak, ada 3 pilihan paket 😊", "sent_at": (now - timedelta(hours=3)).isoformat()},
    ]
    supabase_admin.table('messages').insert(msgs).execute()
    
    print("Seed complete!")
    print(f"  Workspace ID : {ws_id}")
    print(f"  Contacts     : {len(c)}")
    print(f"  Conversations: {len(cv)} (4 open, 2 resolved)")
    print(f"  Messages     : {len(msgs)}")

if __name__ == "__main__":
    seed_db()
