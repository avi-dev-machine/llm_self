FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for matplotlib
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only backend files (not frontend)
COPY app.py .
COPY auth.py .
COPY chat_engine.py .
COPY database.py .
COPY firebase_utils.py .
COPY graph_renderer.py .
COPY math_solver.py .
COPY models.py .
COPY prompts.py .

# Create output directory for graphs
RUN mkdir -p outputs

# HuggingFace Spaces runs on port 7860
EXPOSE 7860

# Run the FastAPI app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
