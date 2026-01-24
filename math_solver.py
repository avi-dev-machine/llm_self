"""
Math Solver Module
Handles communication with Groq AI to solve math problems.
"""

from openai import OpenAI
from prompts import MATH_SYSTEM_PROMPT, GRAPH_PROMPT, GRAPH_KEYWORDS


class MathSolver:
    """Solves JEE/Olympiad math problems using Groq AI."""
    
    def __init__(self, api_key: str):
        if api_key:
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
        else:
            self.client = None
            
        self.model = "llama-3.3-70b-versatile"
    
    def solve(self, problem: str) -> str:
        """Send problem to AI and get step-by-step solution."""
        if not self.client:
            return "Error: API key not configured."

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": MATH_SYSTEM_PROMPT},
                    {"role": "user", "content": problem}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_graph_code(self, problem: str) -> str:
        """Generate matplotlib code for visualization."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": GRAPH_PROMPT},
                    {"role": "user", "content": problem}
                ],
                temperature=0.2,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"
    
    def needs_graph(self, problem: str) -> bool:
        """Check if problem asks for a graph/plot."""
        problem_lower = problem.lower()
        return any(kw in problem_lower for kw in GRAPH_KEYWORDS)
