"""
JEE/Olympiad Math Agent - FastAPI Backend
Conversational AI with OAuth authentication and chat history.
"""

from dotenv import load_dotenv
load_dotenv()  # Load env vars FIRST

import os
import base64
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session

from database import init_db, get_db, User, Conversation, Message
from models import (
    MessageRequest, MessageResponse, ChatResponse,
    ConversationResponse, ConversationListItem,
    UserResponse, TokenResponse, GraphRequest
)
from auth import (
    get_current_user, create_jwt_token,
    get_google_auth_url,
    exchange_google_code,
    get_or_create_user, FRONTEND_URL
)
from chat_engine import ChatEngine

# Initialize database
init_db()

# Initialize FastAPI
app = FastAPI(
    title="JEE/Olympiad Math Agent API",
    description="Conversational AI math tutor with authentication",
    version="2.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chat engine with local Phi-4 model
print("Initializing ChatEngine with local Phi-4 model...")
try:
    chat_engine = ChatEngine()
    print("ChatEngine initialized successfully!")
except Exception as e:
    print(f"Error initializing ChatEngine: {e}")
    chat_engine = None


# ============== Health Routes ==============

@app.get("/")
async def root():
    """API info and health check."""
    return {
        "name": "JEE/Olympiad Math Agent",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check for deployment."""
    return {"status": "healthy"}


# ============== Auth Routes ==============

@app.get("/auth/google")
async def auth_google():
    """Redirect to Google OAuth."""
    return RedirectResponse(get_google_auth_url())


@app.get("/auth/callback/{provider}")
async def auth_callback(
    provider: str,
    code: str = Query(...),
    db: Session = Depends(get_db)
):
    """OAuth callback - exchange code for token."""
    if provider == "google":
        user_data = await exchange_google_code(code)
    else:
        raise HTTPException(status_code=400, detail="Unknown provider")
    
    user = get_or_create_user(db, user_data)
    token = create_jwt_token(user.id, user.email)
    
    # Redirect to frontend with token
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}")


@app.get("/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return user


# ============== Chat Routes ==============

@app.post("/chat", response_model=ChatResponse)
async def send_message(
    request: MessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response."""
    
    # Get or create conversation
    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    
    if not conversation:
        conversation = Conversation(
            user_id=user.id,
            title=chat_engine.generate_title(request.content)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.content
    )
    db.add(user_msg)
    db.commit()
    
    # Get AI response
    response_text, offer_graph, graph_url = chat_engine.chat(
        request.content,
        conversation,
        db
    )
    
    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=response_text,
        has_graph=graph_url is not None,
        graph_path=graph_url  # Now stores Firebase URL or local path
    )
    db.add(assistant_msg)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_msg)
    
    # For Firebase URLs, no need for base64
    # For local paths, convert to base64
    graph_base64 = None
    if graph_url and not graph_url.startswith('http'):
        local_path = graph_url.replace('/graph/', 'outputs/')
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                graph_base64 = base64.b64encode(f.read()).decode("utf-8")
    
    return ChatResponse(
        message=MessageResponse(
            id=assistant_msg.id,
            role=assistant_msg.role,
            content=assistant_msg.content,
            has_graph=assistant_msg.has_graph,
            graph_path=assistant_msg.graph_path,
            created_at=assistant_msg.created_at
        ),
        conversation_id=conversation.id,
        should_offer_graph=offer_graph,
        graph_base64=graph_base64
    )


@app.get("/chat/history", response_model=list[ConversationListItem])
async def get_chat_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for current user."""
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user.id
    ).order_by(Conversation.updated_at.desc()).all()
    
    return [
        ConversationListItem(
            id=c.id,
            title=c.title,
            updated_at=c.updated_at,
            message_count=len(c.messages)
        )
        for c in conversations
    ]


@app.get("/chat/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation with all messages."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                has_graph=m.has_graph,
                graph_path=m.graph_path,
                created_at=m.created_at
            )
            for m in conversation.messages
        ]
    )


@app.delete("/chat/{conversation_id}")
async def delete_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Delete all messages first
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted"}


@app.post("/chat/{conversation_id}/graph")
async def generate_graph_for_conversation(
    conversation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a graph for the last problem in a conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Find the last user message (the problem)
    last_problem = None
    for msg in reversed(conversation.messages):
        if msg.role == "user":
            last_problem = msg.content
            break
    
    if not last_problem:
        raise HTTPException(status_code=400, detail="No problem found in conversation")
    
    # Generate graph
    graph_path = chat_engine.generate_graph(last_problem)
    
    if not graph_path:
        raise HTTPException(status_code=500, detail="Failed to generate graph")
    
    # Read and return as base64
    with open(graph_path, "rb") as f:
        graph_base64 = base64.b64encode(f.read()).decode("utf-8")
    
    return {
        "graph_base64": graph_base64,
        "graph_path": graph_path
    }


# ============== Static Files ==============

@app.get("/graph/{filename}")
async def serve_graph(filename: str):
    """Serve generated graph images."""
    file_path = f"outputs/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="Graph not found")


# ============== Entry Point ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)