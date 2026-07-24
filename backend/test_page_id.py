import httpx
from database import supabase_admin

channels = supabase_admin.table('channels').select('*').eq('type', 'instagram').execute().data
if channels:
    ch = channels[0]
    token = ch["access_token"]
    
    # Get Page ID
    pages_res = httpx.get(f"https://graph.facebook.com/v18.0/me/accounts?access_token={token}")
    pages_data = pages_res.json().get('data', [])
    page_id = None
    for p in pages_data:
        if p.get('instagram_business_account'):
            page_id = p['id']
            break
            
    if not page_id:
        print("Could not find Page ID linked to IG")
    else:
        print(f"Found Page ID: {page_id}")
        
        # Test Conversations with PAGE_ID
        url1 = f"https://graph.facebook.com/v18.0/{page_id}/conversations?platform=instagram"
        print(f"\n--- Testing Conversations with Page ID ---")
        res1 = httpx.get(url1, params={"access_token": token, "limit": 2})
        print("Status:", res1.status_code)
        print("Response:", res1.json())
        
        # Test Profile Fetch with PAGE_ID token
        # Wait, the IGSID profile fetch: GET /igsid?fields=name...
        # It's not dependent on page_id in the URL, but the token must be the Page token.
        # But wait! If the token is missing pages_read_engagement, it might fail.
        # Let's test the profile fetch again.
        sender_id = '1388527109799621' # The one from the last run
        url2 = f"https://graph.facebook.com/v18.0/{sender_id}?fields=name,username&access_token={token}"
        print(f"\n--- Testing Profile Fetch ---")
        res2 = httpx.get(url2)
        print("Status:", res2.status_code)
        print("Response:", res2.json())
