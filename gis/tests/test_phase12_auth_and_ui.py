"""
Unit Tests for NEER Phase 12A — Production UI Cleanup & Real Authentication
Tests authentication, password hashing, session tokens, authorization gates (401/403), and RBAC role checks.
"""

import unittest
from fastapi import HTTPException

from backend.auth import (
    authenticate_user,
    verify_token,
    require_role,
    logout_user,
    SESSION_TOKENS,
    USER_DATABASE
)

class TestPhase12AuthAndUI(unittest.TestCase):

    def setUp(self):
        # Clear active session tokens before each test
        SESSION_TOKENS.clear()

    def test_valid_authority_login(self):
        session = authenticate_user("authority@ndma.gov.in", "Authority123!")
        self.assertIsNotNone(session)
        self.assertEqual(session["role"], "AUTHORITY")
        self.assertEqual(session["email"], "authority@ndma.gov.in")
        self.assertTrue(session["token"].startswith("neer-token-"))

    def test_valid_citizen_login(self):
        session = authenticate_user("citizen@neer.gov.in", "Citizen123!")
        self.assertIsNotNone(session)
        self.assertEqual(session["role"], "CITIZEN")

    def test_valid_response_login(self):
        session = authenticate_user("response@ndma.gov.in", "Response123!")
        self.assertIsNotNone(session)
        self.assertEqual(session["role"], "RESPONSE")

    def test_invalid_password(self):
        session = authenticate_user("authority@ndma.gov.in", "WrongPassword123")
        self.assertIsNone(session)

    def test_invalid_username(self):
        session = authenticate_user("fake_user@domain.com", "Authority123!")
        self.assertIsNone(session)

    def test_verify_valid_token(self):
        session = authenticate_user("authority@ndma.gov.in", "Authority123!")
        auth_header = f"Bearer {session['token']}"
        verified_session = verify_token(auth_header)
        self.assertEqual(verified_session["user_id"], session["user_id"])

    def test_verify_missing_token_raises_401(self):
        with self.assertRaises(HTTPException) as ctx:
            verify_token(None)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Authentication required", ctx.exception.detail)

    def test_verify_invalid_token_raises_401(self):
        with self.assertRaises(HTTPException) as ctx:
            verify_token("Bearer invalid-token-12345")
        self.assertEqual(ctx.exception.status_code, 401)

    def test_rbac_require_role_authorized(self):
        session = authenticate_user("authority@ndma.gov.in", "Authority123!")
        checker = require_role(["AUTHORITY"])
        res = checker(session)
        self.assertEqual(res["role"], "AUTHORITY")

    def test_rbac_require_role_forbidden_raises_403(self):
        session = authenticate_user("citizen@neer.gov.in", "Citizen123!")
        checker = require_role(["AUTHORITY"])
        with self.assertRaises(HTTPException) as ctx:
            checker(session)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Access denied", ctx.exception.detail)

    def test_logout_user(self):
        session = authenticate_user("authority@ndma.gov.in", "Authority123!")
        token = session["token"]
        self.assertIn(token, SESSION_TOKENS)

        success = logout_user(token)
        self.assertTrue(success)
        self.assertNotIn(token, SESSION_TOKENS)

        # Subsequent verification should fail
        with self.assertRaises(HTTPException):
            verify_token(f"Bearer {token}")

if __name__ == "__main__":
    unittest.main()
