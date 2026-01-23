---
title: Math Agent
emoji: 🧮
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
app_port: 7860
---

# 🧮 Math Agent - JEE/Olympiad Problem Solver

A conversational AI math tutor for JEE and Olympiad preparation. Features step-by-step solutions with LaTeX rendering, graph generation, user authentication, and chat history.

![Math Agent](frontend/public/icon-192.png)

## ⚠️ OAuth Configuration Required

If you see `Error 400: redirect_uri_mismatch`, you need to update your Google Cloud Console:

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add exactly:
   `http://localhost:7860/auth/callback/google`
4. Click **Save**

---

## ✨ Features

- **Conversational AI** - Chat naturally like with ChatGPT/Gemini
- **Step-by-step Solutions** - Detailed explanations with key insights
- **LaTeX Math Rendering** - Beautiful mathematical notation
- **Graph Generation** - Automatic visualization when needed
- **User Authentication** - Google OAuth login
- **Chat History** - All conversations saved and retrievable
- **Dark Mode** - Modern dark UI with purble/blue gradients

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Install dependencies
cd llm_olympiad
pip install -r requirements.txt

# Run backend
python app.py
```

Backend runs at: `http://localhost:7860`

### 2. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Run frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🔧 Environment Variables

### Backend (.env)

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=163398929574-l6o51sede37suaq41mt0lu7ht89f3so5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:7860
DATABASE_URL=sqlite:///./math_agent.db
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:7860
```

---

Made with ❤️ for JEE/Olympiad aspirants
