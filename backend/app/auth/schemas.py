from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class FirebaseLoginRequest(BaseModel):
    id_token: str


class FCMTokenRequest(BaseModel):
    fcm_token: str