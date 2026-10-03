# Grindset Design System

## 1. Product Context & Goals
**Grindset** is a Leetcode practice platform built for "forced reflection, spaced repetition, and zero tab-switching." It aims to keep users focused in "Grind Mode" with Pomodoro timers, spaced repetition queues, and a visually aggressive, distraction-free environment.

## 2. Branding & Aesthetic
**Theme**: Cyber/Dark Theme ("Grind" feel)
- **Vibe**: Aggressive, focused, modern, developer-centric.
- **Glassmorphism**: Heavy use of `.glass-panel` (blur 16px, subtle borders, saturated backdrops) to create depth.
- **Micro-interactions**: Glowing hover effects on buttons, floating animations for cards, and skeleton loaders.

## 3. Color Palette
- **Backgrounds**: 
  - Primary: `#0A0A0B` (Deepest Black)
  - Secondary: `#121214` (Surface panels)
  - Tertiary: `#1C1C1F` (Hover states, inputs)
- **Accents**: 
  - Primary Accent: `#FF2E54` (Grind Red/Pink) — used for primary actions, glowing effects (`rgba(255, 46, 84, 0.25)`).
  - Secondary Accent: `#FF6B00` (Orange) — used in gradients with Primary.
- **Text**: 
  - Primary: `#F3F3F4` (White-ish)
  - Secondary: `#A1A1AA` (Muted Grey)
- **Semantic**: 
  - Success: `#10B981` (Green)
  - Warning: `#F59E0B` (Yellow/Amber)
  - Error: `#EF4444` (Red)

## 4. Typography
- **Display Headings**: `Outfit` (Bold, tight letter spacing `-0.025em`)
- **Body & UI Text**: `Inter` (Clean, legible)
- **Code/Monospace**: `JetBrains Mono`

## 5. UI Primitives & Spacing
- **Border Radius**: Small (`6px`), Medium (`10px`), Large (`16px`), XL (`24px`).
- **Shadows**:
  - Small: `0 2px 4px rgba(0, 0, 0, 0.3)`
  - Medium: `0 8px 16px -2px rgba(0, 0, 0, 0.4)`
  - Glow: `0 0 24px rgba(255, 46, 84, 0.25)`
- **Buttons**:
  - `btn-primary`: Red-to-Orange gradient background with red shadow glow on hover. Touch-safe minimum size (44px).
  - `btn-outline`: Subtle transparent background with white border.

## 6. Layout & Composition
- **Max Width**: `1240px` wrapper (`.container`).
- **Dashboard Grid**: Uses CSS Grid for fluid card arrangements.
- **Spacing**: Generous gaps (`16px` to `32px`) between sections to reduce clutter.

## 7. Motion & Animation
- **Fade In**: Pages and panels slide up (`12px`) and fade in.
- **Pulse Glow**: Used to draw attention to critical actions (e.g., "Enter Grind Mode" button).
- **Interactions**: Buttons scale down slightly (`0.97`) on click for tactile feedback.
