## Token Summary
- **Backgrounds**: `--bg-primary: #0A0A0B`, `--bg-secondary: #121214`, `--bg-tertiary: #1C1C1F`
- **Accents**: `--accent-primary: #FF2E54` (Grind Red/Pink), `--accent-secondary: #FF6B00`
- **Text**: `--text-primary: #F3F3F4`, `--text-secondary: #A1A1AA`
- **Typography**: `--font-sans` (Inter), `--font-display` (Outfit), `--font-mono` (JetBrains Mono)
- **Radius**: sm (6px), md (10px), lg (16px), xl (24px)
- **Glassmorphism**: `.glass-panel` background blur(16px).
- **Buttons**: `.btn-primary` (gradient), `.btn-outline` (subtle border)

## Raw CSS

```css
:root {
  /* Colors - Cyber/Dark Theme */
  --bg-primary: #0A0A0B;
  --bg-secondary: #121214;
  --bg-tertiary: #1C1C1F;
  --bg-overlay: rgba(10, 10, 11, 0.85);
  
  --accent-primary: #FF2E54; /* Aggressive Red/Pink for 'Grind' feel */
  --accent-secondary: #FF6B00;
  --accent-glow: rgba(255, 46, 84, 0.25);
  
  --text-primary: #F3F3F4;
  --text-secondary: #A1A1AA;
  --text-muted: #52525B;
  
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Shadows & Ambient Effects */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 8px 16px -2px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 16px 32px -4px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 24px var(--accent-glow);
  
  /* Borders & Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-primary);
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: var(--font-sans);
  cursor: pointer;
  border: none;
  background: none;
  color: inherit;
  touch-action: manipulation;
}

/* Global Focus-Visible Standards */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* Utilities */
.text-gradient {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Refined Glassmorphism */
.glass-panel {
  background: rgba(18, 18, 20, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Touch-Target Safe Zones (min-height: 44px) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  min-height: 44px;
  min-width: 44px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  user-select: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(255, 46, 84, 0.3);
}
.btn-primary:hover {
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}
.btn-primary:active {
  transform: translateY(0) scale(0.97);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}
.btn-outline:hover {
  border-color: var(--border-strong);
  background: rgba(255, 255, 255, 0.06);
}
.btn-outline:active {
  transform: scale(0.97);
}

.btn-icon {
  padding: 10px;
  min-height: 44px;
  min-width: 44px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, color 0.2s ease;
  background: transparent;
  color: var(--text-secondary);
}
.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.btn-icon:active {
  transform: scale(0.95);
}

/* Form Elements with Safe Touch Targets */
input, textarea, select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: var(--font-sans);
  padding: 12px 16px;
  min-height: 44px;
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

/* Skeleton Loading State */
.skeleton {
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: skeletonPulse 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeletonPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Keyframe Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(255, 46, 84, 0.4); }
  70% { box-shadow: 0 0 0 12px rgba(255, 46, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 46, 84, 0); }
}
.animate-pulse-glow {
  animation: pulseGlow 2.2s infinite;
}

/* Fluid Layout Container */
.container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 32px);
}
.flex { display: flex; }
.flex-col { display: flex; flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.gap-8 { gap: 32px; }

/* Code Editor Specifics */
.editor-font {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
}
```
