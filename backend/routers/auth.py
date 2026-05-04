from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from services import qf_auth_service

router = APIRouter()

class LoginResponse(BaseModel):
    auth_url: str
    state: str
    message: str

class UserToken(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    user_id: Optional[str] = None
    email: Optional[str] = None

class UserInfo(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None

@router.get("/auth/login", response_model=LoginResponse)
async def get_login_url():
    auth_url, state = qf_auth_service.get_auth_url()
    return LoginResponse(auth_url=auth_url, state=state, message="Redirect user to auth_url")

@router.get("/auth/callback")
async def oauth_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None)
):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    try:
        token_response = await qf_auth_service.exchange_code(code, state)
        access_token = token_response.get("access_token")
        
        # Fetch actual user info using the access token
        try:
            user_info = await qf_auth_service.get_user_info(access_token)
            user_id = user_info.get("sub")
            email = user_info.get("email")
        except Exception as e:
            print(f"Failed to get user info: {e}")
            user_id = token_response.get("sub")
            email = token_response.get("email")
        
        return UserToken(
            access_token=access_token,
            refresh_token=token_response.get("refresh_token"),
            token_type=token_response.get("token_type", "Bearer"),
            user_id=user_id,
            email=email
        )
    except Exception as e:
        print(f"OAuth callback error: {e}")
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")

@router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    try:
        token_response = await qf_auth_service.refresh_user_token(refresh_token)
        return UserToken(
            access_token=token_response.get("access_token"),
            refresh_token=token_response.get("refresh_token"),
            token_type=token_response.get("token_type", "Bearer"),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Failed to refresh token")

@router.get("/auth/me")
async def get_current_user(authorization: Optional[str] = None):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    try:
        token = authorization.replace("Bearer ", "")
        user_data = await qf_auth_service.get_user_info(token)
        return UserInfo(
            user_id=user_data.get("sub"),
            email=user_data.get("email"),
            name=user_data.get("name")
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
