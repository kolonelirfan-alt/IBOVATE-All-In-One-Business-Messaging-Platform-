import asyncio
from database import supabase_admin

def test_invite():
    try:
        res = supabase_admin.auth.admin.invite_user_by_email("dummy.agent.12345@gmail.com")
        print(res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_invite()
