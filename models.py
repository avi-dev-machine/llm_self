"""
Pydantic Models - API Request/Response schemas
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Auth Models
class UserCreate(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    provider: str
    provider_id: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: Optional[str]
    provider: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Chat Models
class MessageRequest(BaseModel):
    content: str
    conversation_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    has_graph: bool
    graph_path: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []
    
    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: int
    title: str
    updated_at: datetime
    message_count: int
    
    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    message: MessageResponse
    conversation_id: int
    should_offer_graph: bool = False
    graph_base64: Optional[str] = None


class GraphRequest(BaseModel):
    conversation_id: int
    generate: bool = True
