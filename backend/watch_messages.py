from database import supabase_admin
import time

print("Monitoring database for new incoming WhatsApp messages...")
start_time = "2026-08-04T09:56:40.000000+00:00"

for i in range(6):
    res = supabase_admin.table('messages').select('*, conversations(*, contacts(*))').gt('created_at', start_time).order('created_at', desc=True).execute()
    if res.data:
        print(f"FOUND {len(res.data)} NEW MESSAGES:")
        for m in res.data:
            conv = m.get('conversations', {})
            contact = conv.get('contacts', {})
            print(f"  - Message ID: {m['id']}")
            print(f"    Meta Msg ID: {m.get('meta_message_id')}")
            print(f"    Sender: {contact.get('name', 'Unsaved')} ({contact.get('external_id')})")
            print(f"    Content: '{m.get('content')}'")
            print(f"    Created At: {m.get('created_at')}")
            print()
        break
    else:
        print(f"[{i+1}/6] Waiting for incoming WhatsApp message...")
        time.sleep(3)
