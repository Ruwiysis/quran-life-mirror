import os, httpx, time, base64
from typing import Dict
from dotenv import load_dotenv
load_dotenv()

QF_CLIENT_ID = os.getenv("QF_CLIENT_ID")
QF_CLIENT_SECRET = os.getenv("QF_CLIENT_SECRET")
QF_API_BASE = os.getenv("QF_API_BASE")
QF_AUTH_ENDPOINT = os.getenv("QF_AUTH_ENDPOINT")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://quran-life-mirror.vercel.app")

_content_token_cache: Dict = {"token": None, "expires_at": 0}

def _basic_auth_header() -> str:
    credentials = base64.b64encode(f"{QF_CLIENT_ID}:{QF_CLIENT_SECRET}".encode()).decode()
    return f"Basic {credentials}"

def get_content_headers(token: str) -> Dict:
    return {"x-auth-token": token, "x-client-id": QF_CLIENT_ID}

async def get_content_token() -> str:
    current_time = time.time()
    if _content_token_cache["token"] and current_time < _content_token_cache["expires_at"] - 60:
        return _content_token_cache["token"]
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{QF_AUTH_ENDPOINT}/oauth2/token",
            data={"grant_type": "client_credentials", "scope": "content"},
            headers={"Content-Type": "application/x-www-form-urlencoded", "Authorization": _basic_auth_header()}
        )
        r.raise_for_status()
        data = r.json()
        _content_token_cache["token"] = data["access_token"]
        _content_token_cache["expires_at"] = current_time + data.get("expires_in", 3600)
        return _content_token_cache["token"]

def get_auth_url() -> str:
    scopes = "openid profile bookmarks collections streaks posts notes goals activity_days"
    return (
        f"{QF_AUTH_ENDPOINT}/oauth2/auth?"
        f"response_type=code&client_id={QF_CLIENT_ID}&"
        f"redirect_uri={FRONTEND_URL}/callback&"
        f"scope={scopes}"
    )

async def exchange_code(code: str) -> Dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{QF_AUTH_ENDPOINT}/oauth2/token",
            data={"grant_type": "authorization_code", "code": code, "redirect_uri": f"{FRONTEND_URL}/callback"},
            headers={"Content-Type": "application/x-www-form-urlencoded", "Authorization": _basic_auth_header()}
        )
        r.raise_for_status()
        return r.json()

async def refresh_user_token(refresh_token: str) -> Dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{QF_AUTH_ENDPOINT}/oauth2/token",
            data={"grant_type": "refresh_token", "refresh_token": refresh_token},
            headers={"Content-Type": "application/x-www-form-urlencoded", "Authorization": _basic_auth_header()}
        )
        r.raise_for_status()
        return r.json()

async def get_user_info(access_token: str) -> Dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{QF_AUTH_ENDPOINT}/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        r.raise_for_status()
        return r.json()

def get_user_api_headers(access_token: str) -> Dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
