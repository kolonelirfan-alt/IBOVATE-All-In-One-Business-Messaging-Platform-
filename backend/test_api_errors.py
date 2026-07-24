import httpx
from database import supabase_admin

channels = supabase_admin.table('channels').select('*').eq('type', 'instagram').execute().data
if not channels:
    print("No IG channel")
else:
    ch = channels[0]
    token = ch["access_token"]
    ig_account_id = ch["external_account_id"]
    print(f"Testing with IG Account ID: {ig_account_id}")
    
    # 1. Test Conversations endpoint
    url1 = f"https://graph.facebook.com/v18.0/{ig_account_id}/conversations"
    print(f"\n--- Testing Conversations ---")
    print(f"GET {url1}?platform=instagram")
    res1 = httpx.get(url1, params={"platform": "instagram", "access_token": token, "limit": 2})
    print("Status:", res1.status_code)
    print("Response:", res1.json())
    
    # 2. Test IGSID profile fetch
    # We will grab a sender_id from the messages table
    msg = supabase_admin.table('messages').select('meta_message_id, sent_at').eq('direction', 'in').order('sent_at', desc=True).limit(1).execute().data
    if msg:
        print(f"\n--- Testing Profile Fetch ---")
        # To get the sender_id, we need it from the DB. Actually, we just need ANY recent contact's external_id
        contact = supabase_admin.table('contacts').select('external_id').eq('channel_id', ch['id']).order('created_at', desc=True).limit(1).execute().data
        if contact:
            sender_id = contact[0]['external_id']
            print(f"Testing with Sender ID: {sender_id}")
            url2 = f"https://graph.facebook.com/v18.0/{sender_id}?fields=name,username&access_token={token}"
            res2 = httpx.get(url2)
            print("Status:", res2.status_code)
            print("Response:", res2.json())
        else:
            print("No contacts found for this channel.")
