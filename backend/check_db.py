import asyncio
from database import supabase_admin

def check_recent_messages():
    res = supabase_admin.table('messages').select('*').order('created_at', desc=True).limit(5).execute()
    print("Recent messages:")
    for m in res.data:
        print(f"{m['id']} | {m['direction']} | {m['content']} | {m['created_at']}")
        
    res2 = supabase_admin.table('contacts').select('*').order('created_at', desc=True).limit(5).execute()
    print("\nRecent contacts:")
    for c in res2.data:
        print(f"{c['id']} | {c['name']} | {c['channel_id']}")

if __name__ == "__main__":
    check_recent_messages()
