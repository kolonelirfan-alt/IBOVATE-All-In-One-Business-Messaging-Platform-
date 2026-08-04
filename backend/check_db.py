from database import supabase_admin

# Check if ABGGFlA5Fpa already exists (deduplication would block new inserts)
msgs = supabase_admin.table('messages').select('id, meta_message_id, conversation_id, created_at').ilike('meta_message_id', 'ABGGFlA5Fpa%').execute()
print('=== All messages with ABGGFlA5Fpa ===')
for m in msgs.data or []:
    conv = supabase_admin.table('conversations').select('workspace_id').eq('id', m['conversation_id']).execute()
    ws = conv.data[0]['workspace_id'] if conv.data else 'UNKNOWN'
    print(f"  ID: {m['meta_message_id']}")
    print(f"  Workspace: {ws}")
    is_primary = ws == 'f14e4aa3-a921-4f9c-8e23-6691daea608d'
    print(f"  In PRIMARY workspace: {is_primary}")
    print(f"  Created: {m['created_at']}")
    print()

# Check most recent messages in PRIMARY workspace
print('=== Recent messages in PRIMARY workspace ===')
convs = supabase_admin.table('conversations').select('id').eq('workspace_id', 'f14e4aa3-a921-4f9c-8e23-6691daea608d').execute()
conv_ids = [c['id'] for c in convs.data or []]
if conv_ids:
    recent = supabase_admin.table('messages').select('id, meta_message_id, content, created_at, conversation_id').in_('conversation_id', conv_ids).order('created_at', desc=True).limit(5).execute()
    for m in recent.data or []:
        preview = (m.get('content') or '')[:50]
        print(f"  {m['meta_message_id']}: '{preview}' ({m['created_at']})")
else:
    print("  No conversations found in primary workspace!")
