"""
OAuth2 authentication router.
Handles Quran Foundation OAuth2 login flow:
1. GET /api/auth/login - redirects to QF OAuth2 login
2. GET /api/auth/callback - exchanges code for user token
3. GET /api/auth/me - returns current user info
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from services import qf_auth_service

router = APIRouter()


class LoginResponse(BaseModel):
    auth_url: str
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
    """
    Get OAuth2 login URL.
    Frontend redirects user to this URL to log in with Quran Foundation.
    """
    auth_url = qf_auth_service.get_auth_url()
    return LoginResponse(
        auth_url=auth_url,
        message="Redirect user to the auth_url to log in"
    )


@router.get("/auth/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code from QF OAuth2"),
    state: Optional[str] = Query(None)
):
    """
    OAuth2 callback endpoint.
    Quran Foundation redirects here after user authorization.
    Exchange code for access token.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    try:
        # Exchange code for tokens
        token_response = await qf_auth_service.exchange_code(code)
        
        # Return tokens to frontend (frontend stores in localStorage)
        return UserToken(
            access_token=token_response.get("access_token"),
            refresh_token=token_response.get("refresh_token"),
            token_type=token_response.get("token_type", "Bearer"),
            user_id=token_response.get("sub"),  # Usually the user ID in JWT
            email=token_response.get("email")
        )
    
    except Exception as e:
        print(f"OAuth callback error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Failed to exchange authorization code. Please try again."
        )


@router.post("/auth/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh an expired access token using refresh token.
    """
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Missing refresh_token")
    
    try:
        token_response = await qf_auth_service.refresh_user_token(refresh_token)
        
        return UserToken(
            access_token=token_response.get("access_token"),
            refresh_token=token_response.get("refresh_token"),
            token_type=token_response.get("token_type", "Bearer"),
            user_id=token_response.get("sub"),
            email=token_response.get("email")
        )
    
    except Exception as e:
        print(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Failed to refresh token. Please log in again."
        )


@router.get("/auth/me", response_model=UserInfo)
async def get_current_user(authorization: str = None):
    """
    Get current authenticated user info.
    Requires: Authorization: Bearer {access_token}
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        # Extract token from "Bearer {token}"
        token = authorization.replace("Bearer ", "")
        
        # Get user info from QF
        user_data = await qf_auth_service.get_user_info(token)
        
        return UserInfo(
            user_id=user_data.get("id") or user_data.get("sub"),
            email=user_data.get("email"),
            name=user_data.get("name")
        )
    
    except Exception as e:
        print(f"Get user info error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
