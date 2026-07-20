from supabase import create_client, Client
from config import settings

# In a real multi-tenant app, you should not use the service role key for user requests
# unless you manually pass the workspace_id in the API. 
# Alternatively, you can instantiate a client with the user's JWT.
# For simplicity in this demo backend, we use the global client.
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
