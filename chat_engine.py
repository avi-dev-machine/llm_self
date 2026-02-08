"""
Chat Engine - Conversational AI with context management
Handles multi-turn conversations and structured responses.
"""

import re
from typing import Optional
from sqlalchemy.orm import Session
from database import Conversation, Message
from math_solver import MathSolver
from graph_renderer import GraphRenderer
from prompts import GRAPH_KEYWORDS
from firebase_utils import upload_graph

# Graph offer phrases to detect when AI should offer graph
GRAPH_OFFER_PATTERNS = [
    r"quadratic|parabola|polynomial|cubic",
    r"sine|cosine|tangent|trig",
    r"exponential|logarithm",
    r"derivative|integral|calculus",
    r"function|equation|curve"
]


class ChatEngine:
    """Manages conversational flow with the AI."""
    
    def __init__(self, model_name: str = "microsoft/phi-4"):
        self.solver = MathSolver(model_name=model_name)
        self.renderer = GraphRenderer()
    
    def should_offer_graph(self, problem: str, solution: str) -> bool:
        """Determine if we should offer to generate a graph."""
        # Don't offer if user already asked for graph
        if self.solver.needs_graph(problem):
            return False
        
        # Check if problem/solution involves graphable concepts
        combined = (problem + " " + solution).lower()
        for pattern in GRAPH_OFFER_PATTERNS:
            if re.search(pattern, combined):
                return True
        return False
    
    def format_solution(self, solution: str, offer_graph: bool) -> str:
        """Format the AI response with structured output."""
        formatted = solution.strip()
        
        if offer_graph:
            formatted += "\n\n---\n📊 **Would you like me to generate a graph for this?** (Just say 'yes' or 'show graph')"
        
        return formatted
    
    def is_graph_confirmation(self, message: str) -> bool:
        """Check if user is confirming graph generation."""
        confirmations = ["yes", "yeah", "sure", "ok", "okay", "generate", "show", "graph", "plot", "draw"]
        msg_lower = message.lower().strip()
        return any(word in msg_lower for word in confirmations) and len(msg_lower) < 50
    
    def get_conversation_context(self, conversation: Conversation, limit: int = 10) -> list[dict]:
        """Build message history for context."""
        messages = conversation.messages[-limit:] if conversation.messages else []
        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
    
    def chat(
        self,
        user_message: str,
        conversation: Optional[Conversation],
        db: Session
    ) -> tuple[str, bool, Optional[str]]:
        """
        Process user message and return AI response.
        Returns: (response_text, should_offer_graph, graph_path)
        """
        # Check if this is a graph confirmation for previous message
        if conversation and conversation.messages:
            last_assistant = None
            for msg in reversed(conversation.messages):
                if msg.role == "assistant":
                    last_assistant = msg
                    break
            
            if last_assistant and "Would you like me to generate a graph" in last_assistant.content:
                if self.is_graph_confirmation(user_message):
                    # Find the original problem
                    original_problem = None
                    for msg in reversed(conversation.messages):
                        if msg.role == "user" and not self.is_graph_confirmation(msg.content):
                            original_problem = msg.content
                            break
                    
                    if original_problem:
                        graph_path = self.generate_graph(original_problem)
                        if graph_path:
                            return "Here's the graph you requested:", False, graph_path
                        else:
                            return "Sorry, I couldn't generate the graph. Please try with a different problem.", False, None
        
        # Check if user explicitly wants a graph
        if self.solver.needs_graph(user_message):
            solution = self.solver.solve(user_message)
            graph_path = self.generate_graph(user_message)
            return solution, False, graph_path
        
        # Regular problem solving
        solution = self.solver.solve(user_message)
        offer_graph = self.should_offer_graph(user_message, solution)
        formatted = self.format_solution(solution, offer_graph)
        
        return formatted, offer_graph, None
    
    def generate_graph(self, problem: str) -> Optional[str]:
        """Generate graph for a problem."""
        code_response = self.solver.generate_graph_code(problem)
        code = self.renderer.extract_code(code_response)
        
        if code:
            img_path, error = self.renderer.render(code)
            if img_path:
                # Try uploading to Firebase
                public_url = upload_graph(img_path)
                if public_url:
                    return public_url
                
                # Fallback to local path relative to API
                # img_path is like "outputs/xyz.png"
                # We return "/graph/xyz.png" which maps to the static file route
                filename = img_path.split("/")[-1]
                return f"/graph/{filename}"
            
        return None
    
    def generate_title(self, first_message: str) -> str:
        """Generate a short title for the conversation."""
        # Take first 50 chars, clean up
        title = first_message[:50].strip()
        if len(first_message) > 50:
            title += "..."
        # Remove newlines
        title = title.replace("\n", " ").strip()
        return title if title else "New Chat"
