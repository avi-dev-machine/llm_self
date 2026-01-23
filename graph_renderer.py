"""
Graph Renderer Module
Executes matplotlib code and saves the output as an image.
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime


class GraphRenderer:
    """Renders graphs from Python matplotlib code."""
    
    def __init__(self, output_dir: str = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def extract_code(self, text: str) -> str:
        """Extract Python code from markdown code block."""
        lines = text.split('\n')
        in_code = False
        code_lines = []
        
        for line in lines:
            if line.strip().startswith('```python'):
                in_code = True
            elif line.strip() == '```' and in_code:
                break
            elif in_code:
                code_lines.append(line)
        
        return '\n'.join(code_lines) if code_lines else ""
    
    def render(self, code: str) -> tuple[str, str]:
        """
        Execute code and save graph image.
        Returns (image_path, None) on success or (None, error_message) on failure.
        """
        if not code.strip():
            return None, "No code to execute"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        img_path = self.output_dir / f"graph_{timestamp}.png"
        code_path = self.output_dir / f"code_{timestamp}.py"
        
        # Prepare code with matplotlib backend and save command
        prepared = "import matplotlib\nmatplotlib.use('Agg')\n"
        prepared += "import matplotlib.pyplot as plt\nimport numpy as np\n\n"
        prepared += code.replace('plt.show()', '')
        prepared += f"\nplt.tight_layout()\nplt.savefig(r'{img_path}', dpi=150, bbox_inches='tight')\nplt.close()"
        
        code_path.write_text(prepared, encoding='utf-8')
        
        try:
            result = subprocess.run(
                [sys.executable, str(code_path)],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.returncode == 0 and img_path.exists():
                return str(img_path), None
            return None, result.stderr or "Unknown error"
            
        except subprocess.TimeoutExpired:
            return None, "Timeout (15s)"
        except Exception as e:
            return None, str(e)
