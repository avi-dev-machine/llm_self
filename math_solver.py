"""
JEE/Olympiad Math Problem Solver - Groq API
Token-efficient, LaTeX-formatted solutions using Groq API.
"""

import os
from openai import OpenAI


MATH_SYSTEM_PROMPT = """You are a JEE/Olympiad math expert. Provide CONCISE step-by-step solutions.

FORMAT RULES:
- Use LaTeX for ALL math: $inline$ or $$display$$
- Keep explanations brief but clear
- Number your steps
- If asked to draw/plot/graph, include Python matplotlib code in ```python blocks

Be concise. No unnecessary text."""

GRAPH_ONLY_PROMPT = """Generate ONLY Python matplotlib code to visualize the given math problem.
No explanations, just working Python code in a ```python block.
Use numpy for calculations. Include proper labels and title."""


class MathSolver:
    """Math solver using Groq API."""
    
    def __init__(self, api_key: str = None):
        api_key = api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        self.model = "llama-3.3-70b-versatile"
    
    def solve(self, problem: str) -> str:
        """Get concise LaTeX-formatted solution."""
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
        """Generate only matplotlib code for the problem."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": GRAPH_ONLY_PROMPT},
                    {"role": "user", "content": problem}
                ],
                temperature=0.2,
                max_tokens=800
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {str(e)}"
    
    def needs_graph(self, problem: str) -> bool:
        """Check if problem explicitly asks for a graph."""
        keywords = ['draw', 'plot', 'graph', 'sketch', 'visualize', 'diagram']
        problem_lower = problem.lower()
        return any(kw in problem_lower for kw in keywords)
