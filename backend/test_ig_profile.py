import httpx
from database import supabase_admin

channels = supabase_admin.table('channels').select('*').eq('type', 'instagram').execute().data
if not channels:
    print("No IG channel")
else:
    for ch in channels:
        print("Testing channel:", ch['id'])
        # The sender_id we got in the DB was '2884364191903415'
        sender_id = '2884364191903415' 
        token = ch["access_token"]
        res = httpx.get(f"https://graph.facebook.com/v18.0/{sender_id}?fields=name,username&access_token={token}")
        print(res.json())
