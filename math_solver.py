"""
JEE/Olympiad Math Problem Solver - Local Phi-4 Model
Uses Microsoft Phi-4 via Hugging Face Transformers for local inference.
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

# Math-specific system prompt
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
    """Math solver using local Phi-4 model."""
    
    def __init__(self, model_name: str = "microsoft/phi-4"):
        print(f"Loading {model_name}... (this may take a few minutes)")
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto"
        )
        print(f"Model loaded on {self.model.device}")
    
    def _generate(self, messages: list[dict], max_tokens: int = 1024) -> str:
        """Generate response from messages."""
        inputs = self.tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt"
        ).to(self.model.device)
        
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=self.tokenizer.eos_token_id
        )
        
        # Decode only the generated tokens
        response = self.tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )
        return response.strip()
    
    def solve(self, problem: str) -> str:
        """Get concise LaTeX-formatted solution."""
        messages = [
            {"role": "system", "content": MATH_SYSTEM_PROMPT},
            {"role": "user", "content": problem}
        ]
        
        try:
            return self._generate(messages, max_tokens=1024)
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_graph_code(self, problem: str) -> str:
        """Generate only matplotlib code for the problem."""
        messages = [
            {"role": "system", "content": GRAPH_ONLY_PROMPT},
            {"role": "user", "content": problem}
        ]
        
        try:
            return self._generate(messages, max_tokens=600)
        except Exception as e:
            return f"Error: {str(e)}"
    
    def needs_graph(self, problem: str) -> bool:
        """Check if problem explicitly asks for a graph."""
        keywords = ['draw', 'plot', 'graph', 'sketch', 'visualize', 'diagram']
        problem_lower = problem.lower()
        return any(kw in problem_lower for kw in keywords)
