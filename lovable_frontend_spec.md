# Frontend UI/UX Specification (Lovable Prompt)

**Project:** Pro-Lifts Fitness PWA  
**Vibe:** Premium, High-Performance, Sleek Dark Mode, Pro-Athlete Aesthetic.

---

## 1. Design System & Brand Identity

*   **Colors:**
    *   **Base:** Deep Black (`#0A0A0A`) / Charcoal (`#151515`).
    *   **Accents:** "Racing Red" Gradient (`#EE2E31` to `#FF5F6D`).
    *   **Highlights:** Salmon/Pink for secondary muscle groups.
*   **Typography:** Modern Sans-Serif (e.g., 'Outfit' or 'Inter'). Heavy weights for headings (800+), light for detail text.
*   **Style:** Glassmorphism (blur: 16px, low-opacity white borders). Micro-animations on button clicks and set completion.
*   **Navigation:** Mobile-first bottom navigation bar with 4 tabs: **Today**, **Plans**, **Progress**, **Profile**.

---

## 2. Core Screen Specifications

### A. Dashboard ("Today")
*   **Hero Section:** Greeting + "Next Workout: Push Day" (Card with red gradient background).
*   **Workout Preview:** List of exercises to be done today (Card list) with primary muscle icons.
*   **Quick Start:** Floating Action Button (FAB) or prominent "Start Workout" button.

### B. Active Workout Session
*   **Header:** Progress bar (Percentage of exercises completed).
*   **Exercise Card:**
    *   **Anatomy Diagram:** Interactive SVG showing a Human Silhouette. Muscles being worked highlight in **Bright Red** (primary) and **Salmon** (secondary). Needs to be sleek, not clinical.
    *   **Set Logger:** A table/list of sets. Columns: Set #, Weight, Reps, Done (Checkbox).
    *   **Unit Toggle:** Simple toggle for kg/lb/custom.
    *   **Tutorial Video:** Collapsible section with an embedded video player.
*   **Rest Timer:** Circular countdown overlay when a set is checked "Done". Audio/Vibration on finish.
*   **Exercise Feedback:** Text area at the bottom of the card: "How did this feel? (pain/form issues)".

### C. Exercise Research & Planning Dashboard (Desktop/Mobile Hybrid)
*   **Search/Library:** List of all exercises.
*   **Planning Mode:** A detail view for each exercise where I can:
    *   Add/Embed YouTube/Vimeo tutorial links.
    *   Write "Personal Form Cues" (e.g., "Keep elbows tucked").
    *   Toggle Primary/Secondary muscles from a list to update the diagram.
    *   Set/Adjust "Science-Based Progression" settings (e.g., target 8-10 reps).

### D. Progress & Insights
*   **Line Charts:** Simple, glowing line charts for Weight Progression and Volume.
*   **Filtering:** Granularity buttons: Daily, Weekly, Monthly, Custom.
*   **Strength History:** Click a data point on a chart to see exactly what notes were written that day.

---

## 3. Interaction Logic & "Science" Features

*   **The 2-Week Progression Rule:** If the current exercise performance matches the target reps for the 2nd week in a row, show a "Level Up!" celebratory animation and suggest +2.5kg for the next session.
*   **Safety Alerts:** If I load an exercise where I previously noted "Shoulder Pain," show a red warning banner at the top of the card with my previous note.
*   **Superset Pairing:** Group exercises into "A1/A2" logic with a border connecting the cards.

---

## 4. Technical Integration (For Frontend Logic)

*   **Local-First Sync:** UI should reflect state immediately (Optimistic Updates) while a "Syncing..." cloud icon pulses in the status bar.
*   **Auth:** Premium login screen (Magic Link/Email) with high-contrast inputs.
*   **Onboarding:** 5-step wizard (Name -> Gender -> Age -> Height/Weight -> Select Split Type).

---

## 5. Visual References for Lovable

*   Search for: "Modern Fitness Dashboard Dark Mode," "Health App Glassmorphism UI," "Nike Training Club Sleek Aesthetics."
*   Use standard SVG path IDs for the muscle groups: `chest_left`, `chest_right`, `quads_left`, `quads_right`, etc.

---

## Lovable Implementation Task:

"Create a premium Next.js PWA for a fitness tracker using the design guidelines above. Focus on a high-performance dark mode aesthetic. Use Lucide-react for icons and Recharts for progress visualization. Ensure the Anatomy Diagram is a custom SVG component that can accept an array of muscle IDs to highlight in red. Implement a 'Workout Mode' that feels alive and interactive, not just a static form."
