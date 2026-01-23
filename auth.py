"""
Authentication - Google OAuth + JWT tokens
"""

import os
import httpx
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, User

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    print("CRITICAL WARNING: JWT_SECRET not found! Auth will fail.")

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 1 week

# Google OAuth - Your credentials
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:7860")

security = HTTPBearer(auto_error=False)


def create_jwt_token(user_id: int, email: str) -> str:
    """Generate JWT token for user."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_jwt_token(credentials.credentials)
    user_id = int(payload.get("sub"))
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """Optionally get current user (for routes that work with or without auth)."""
    if not credentials:
        return None
    try:
        payload = verify_jwt_token(credentials.credentials)
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except:
        return None


def get_google_auth_url() -> str:
    """Generate Google OAuth URL."""
    redirect_uri = f"{BACKEND_URL}/auth/callback/google"
    return (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        "scope=openid%20email%20profile&"
        "access_type=offline&"
        "prompt=consent"
    )


async def exchange_google_code(code: str) -> dict:
    """Exchange Google auth code for user info."""
    redirect_uri = f"{BACKEND_URL}/auth/callback/google"
    
    async with httpx.AsyncClient() as client:
        # Get access token
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
        )
        tokens = token_response.json()
        
        if "error" in tokens:
            raise HTTPException(
                status_code=400, 
                detail=f"Google auth failed: {tokens.get('error_description', tokens.get('error'))}"
            )
        
        # Get user info
        user_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        user_info = user_response.json()
        
        return {
            "email": user_info["email"],
            "name": user_info.get("name", user_info["email"].split("@")[0]),
            "avatar_url": user_info.get("picture"),
            "provider": "google",
            "provider_id": user_info["id"]
        }


def get_or_create_user(db: Session, user_data: dict) -> User:
    """Find existing user or create new one."""
    # Try to find by provider
    user = db.query(User).filter(
        User.provider == user_data["provider"],
        User.provider_id == user_data["provider_id"]
    ).first()
    
    if user:
        user.last_login = datetime.utcnow()
        user.avatar_url = user_data.get("avatar_url")  # Update avatar
        db.commit()
        return user
    
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data["email"]).first()
    if existing:
        existing.provider = user_data["provider"]
        existing.provider_id = user_data["provider_id"]
        existing.avatar_url = user_data.get("avatar_url")
        existing.last_login = datetime.utcnow()
        db.commit()
        return existing
    
    # Create new user
    new_user = User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
