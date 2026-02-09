# AI Companion Chatbot — Design & Frontend Architecture (Next.js PWA)

## Objective

Create a **state-of-the-art, premium AI Companion chatbot mobile PWA** using **Next.js (latest App Router)** with advanced animations, 3D elements, glassmorphism, and mobile-first UX — matching the provided UI reference exactly in structure and behavior.

This document is the **single source of truth** for UI/UX, component breakdown, animations, interactions, and frontend architecture.

---

## Tech Stack (Mandatory)

* Next.js 14+ (App Router, Server Components + Client Components)
* React 18+
* Tailwind CSS (design system + utility-first)
* Framer Motion (micro-interactions + page transitions)
* GSAP (hero + complex timeline animations)
* Three.js / React Three Fiber (3D AI avatar / orb)
* PWA (manifest, service worker, offline shell)
* Zustand or Context API (UI + chat state)

---

## Global Design Language

### Visual Style

* Dark futuristic gradient background
* Glassmorphism panels
* Soft glow accents
* Neon purple + deep indigo palette
* Soft depth shadows
* Premium iOS-style rounded corners

### Core Keywords

* AI Companion
* Friendly futuristic
* Soft tech
* Calm + premium
* Mobile-first
* Apple-grade polish

---

## App Layout Structure (Global)

```
<AppShell>
  <MobileSafeArea>
    <TopStatusBar />
    <MainContent />
    <BottomNavigation />
  </MobileSafeArea>
</AppShell>
```

---

## Screen 1 — Onboarding / Welcome Screen

### Components

### 1. Hero AI Avatar (3D)

Component: `<AvatarHero3D />`

* Three.js / R3F rendered robot character OR animated orb
* Floating idle animation (GSAP + sin wave motion)
* Subtle glow around avatar
* Soft particle effects
* Parallax motion on device tilt (optional)

### 2. Title Text

Component: `<HeroTitle />`

Text:
"How may I help you today!"
