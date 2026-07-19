import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings

security = HTTPBearer()

def verify_supabase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to verify Supabase JWT token.
    Decodes the JWT to get the user's workspace_id and role.
    """
    token = credentials.credentials
    try:
        # Supabase uses HS256 algorithm by default with the JWT secret (which is often the same as the anon key or a dedicated JWT secret).
        # Note: You should configure the SUPABASE_JWT_SECRET in your settings.
        # For this example, we assume settings.supabase_jwt_secret exists and is configured correctly.
        decoded = jwt.decode(
            token,
            settings.supabase_key, # Or a dedicated JWT secret if different
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Example usage in an endpoint:
# @app.get("/api/dashboard")
# async def get_dashboard_data(user_data: dict = Depends(verify_supabase_jwt)):
#     workspace_id = user_data.get("workspace_id")
#     return {"workspace": workspace_id}
