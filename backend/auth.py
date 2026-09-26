"""
NEER Authentication & Role-Based Access Control (RBAC) Module
Provides real user authentication, password verification, token generation, and server-side RBAC middleware.
Strict Zero-Fabrication Policy: Enforces real database/profile records with HTTP 401 & 403 authorization gates.
"""

import os
import hashlib
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from fastapi import Header, HTTPException, Depends, status
from db.database import get_db_manager

# Active session token store
SESSION_TOKENS: Dict[str, Dict[str, Any]] = {}
NEER_SECRET_KEY = os.getenv("NEER_SECRET_KEY", "neer-system-secret-key-2026")

def hash_password(password: str) -> str:
    # Keyed hash using NEER_SECRET_KEY environment variable
    return hashlib.sha256(f"{password}:{NEER_SECRET_KEY}".encode()).hexdigest()

def get_legacy_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Validates user credentials against database user records."""
    email_clean = email.strip().lower()
    db = get_db_manager()
    user = db.get_user_by_email(email_clean)

    if user:
        input_hashes = [hash_password(password), get_legacy_password_hash(password)]
        if user["password_hash"] in input_hashes:
            # Create session token
            token = f"neer-token-{secrets.token_hex(16)}"
            now_iso = datetime.now(timezone.utc).isoformat()
            exp_iso = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
            session_info = {
                "token": token,
                "user_id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "department": user.get("department") or "",
                "organization": user.get("organization") or "",
                "created_at": now_iso,
                "expires_at": exp_iso
            }
            SESSION_TOKENS[token] = session_info
            return session_info
    return None

def register_user(
    email: str,
    password: str,
    name: str,
    role: str = "CITIZEN",
    department: str = "",
    organization: str = "",
    phone: str = "",
    location: str = "",
    state: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    address: Optional[str] = None
) -> Dict[str, Any]:
    """Registers a new user and saves to central database."""
    db = get_db_manager()
    existing = db.get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An account with email '{email}' already exists. Please sign in instead."
        )

    pw_hash = hash_password(password)
    user = db.create_user(
        email=email,
        password_hash=pw_hash,
        name=name,
        role=role.upper(),
        department=department,
        organization=organization,
        phone=phone,
        location=location,
        state=state,
        district=district,
        village=village,
        address=address
    )

    # Automatically authenticate and return session
    token = f"neer-token-{secrets.token_hex(16)}"
    now_iso = datetime.now(timezone.utc).isoformat()
    exp_iso = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    session_info = {
        "token": token,
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "department": user.get("department") or "",
        "organization": user.get("organization") or "",
        "created_at": now_iso,
        "expires_at": exp_iso
    }
    SESSION_TOKENS[token] = session_info
    return session_info

def verify_token(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Validates Authorization header bearer token."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Authorization header."
        )

    token = authorization.replace("Bearer ", "").strip()
    if token not in SESSION_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please log in again."
        )

    session = SESSION_TOKENS[token]
    # Check expiration
    if datetime.fromisoformat(session["expires_at"]) < datetime.now(timezone.utc):
        del SESSION_TOKENS[token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again."
        )

    return session

def require_role(allowed_roles: List[str]):
    """Server-side RBAC dependency enforcing authorized roles (403 Forbidden)."""
    def role_checker(session: Dict[str, Any] = Depends(verify_token)):
        if session["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{session['role']}' is not authorized for this resource."
            )
        return session
    return role_checker

def logout_user(token: str) -> bool:
    """Destroys session token."""
    token_clean = token.replace("Bearer ", "").strip()
    if token_clean in SESSION_TOKENS:
        del SESSION_TOKENS[token_clean]
        return True
    return False
