---
name: create-component
description: Guidelines for creating new UI components with a premium, glassmorphic design.
---

# Instructions

## Design Philosophy
*   **Premium Aesthetic**: All components must look modern and high-end. Avoid generic styling.
*   **Glassmorphism**: Use translucent backgrounds (`backdrop-filter: blur()`), subtle white borders, and soft shadows.
*   **Interactivity**: Every interactive element must have extensive hover and active states (scale, brightness, shadow shifts).
*   **Responsive**: Mobile-first design is mandatory.

## Technical Stack
*   **CSS**: Use standard CSS Modules (`.module.css`) or Global CSS variables. Do NOT use Tailwind (it is not installed).
*   **Icons**: Use `lucide-react`. 
    *   *Example*: `import { Home } from 'lucide-react';`
*   **Drag & Drop**: If the component involves sorting or moving items, use `@dnd-kit/core` and `@dnd-kit/sortable`.

## Standard Component Template
File structure: `src/components/ComponentName/ComponentName.tsx` + `ComponentName.module.css`

### CSS Variables to Use
Ensure these colors (or similar) are defined in your global CSS:
*   `--primary-color`: For main actions.
*   `--glass-bg`: `rgba(255, 255, 255, 0.1)`
*   `--glass-border`: `rgba(255, 255, 255, 0.2)`
*   --text-primary: Main text color.

## Checklist
1.  [ ] Does it look "wow"? 
2.  [ ] Are animations smooth (0.2s - 0.3s)?
3.  [ ] Is it accessible (contrast, keyboard nav)?
