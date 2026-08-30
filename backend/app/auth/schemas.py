from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse | None = None


class FirebaseLoginRequest(BaseModel):
    id_token: str


class FCMTokenRequest(BaseModel):
    fcm_token: str