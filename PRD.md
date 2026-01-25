# Pro-Lifts Fitness PWA - Product Requirements Document (PRD)

**Version:** 2.2 (Refined)  
**Last Updated:** 2026-01-25  
**Status:** 🔵 Active Development  
**Product Owner:** Arush Dixit  
**Design Vision:** Premium, High-Performance, Sleek Dark Mode (Pro-Athlete Aesthetic)

---

## 1. Product Overview

### 1.1 Vision
A Progressive Web App (PWA) that enables offline workout tracking for two users with flexible training splits, intelligent progression tracking, muscle visualization, AI-powered feedback analysis, and comprehensive progress metrics.

### 1.2 Key Differentiators
*   **Offline-First PWA:** Works without internet connection at the gym.
*   **Self-Hosted:** Zero cloud costs; complete data ownership via PouchDB/CouchDB.
*   **Flexible Scheduling:** No rigid "rest day" enforcement; shows next workout on demand.
*   **Exercise Planning Tool:** Dedicated space to research, document form guides, and refine exercises.
*   **Muscle Visualization:** Anatomical diagrams showing targeted muscles during exercises (Primary/Secondary).
*   **Tutorial Videos:** Embedded exercise instruction videos (YouTube/Vimeo/Self-hosted).
*   **AI Feedback Analysis:** Smart recommendations based on user-reported pain/form issues via OpenRouter.
*   **Science-Based Progression:** Weight increases only after 2 weeks of consistent technical performance.
*   **Cross-Device Sync:** Phone for workouts, desktop for planning (bi-directional replication).

---

## 2. User Management

### 2.1 User Profiles
Each profile stores:
*   Name
*   Gender (Male/Female) - affects strength score calculations
*   Age - affects strength score calculations
*   Height & Weight (tracked over time)
*   Body fat percentage (optional, tracked over time)

### 2.2 Profile Switching
Simple toggle interface (no PIN/authentication required). Each profile has independent:
*   Workout history & Current training split
*   Exercise customizations & Notes
*   Progress metrics & Charts
*   *Note:* Profiles can share workout templates but customize independently.

### 2.3 Onboarding
A 5-step setup wizard:
1.  **Identity:** Name & Profile Details.
2.  **Bio:** Gender & Age.
3.  **Metrics:** Current Height & Weight.
4.  **Goal:** Select Initial Training Split (PPL / Upper-Lower / Full Body).
5.  **Tutorial:** Walkthrough of the "2-Week Consistency" progression rule.

---

## 3. Workout Structure & Routines

### 3.1 Training Split Options
1.  **Push-Pull-Legs (PPL):**
    *   Push: Chest, shoulders, triceps
    *   Pull: Back, biceps
    *   Legs: Quads, hamstrings, glutes, calves
2.  **Upper-Lower:**
    *   Upper: Chest, back, shoulders, arms
    *   Lower: Quads, hamstrings, glutes, calves
3.  **Full Body:** All muscle groups each session.

### 3.2 Split Configuration & Smart Progression
*   **Fluid Switching:** Change splits anytime without penalty.
*   **Next Workout Logic:** App shows the next logical workout based on last session and rotation pattern.
*   **No Rigid Schedules:** No forced rest days; the app waits for the user.

### 3.3 Exercise Library & Supersets
*   **User-Built Library:** No generic bloat; import the "Starter 30" or build custom.
*   **Attributes:** Muscle mapping, Equipment (Barbell, Dumbbell, Machine, Cable, etc.), Custom notes.
*   **Superset Support:** Enabled by default for antagonistic muscle groups. UI shows "A1/A2" grouping. AI can suggest pairings during planning.

---

## 4. Workout Tracking & Science

### 4.1 Set Tracking (Simplified)
*   No complex set types (no warm-up/drop designations).
*   Records: Reps, Weight, Unit (kg, lbs, or Custom 1-10 numbering).
*   Completion: Interactive checkboxes with optimistic UI updates.

### 4.2 Auto-Progression Suggestions (The 2-Week Rule)
*   **Logic:** Suggest +2.5kg ONLY if the target rep range (e.g., 8-10) is hit for ALL sets for **2 consecutive weeks**.
*   **Safety:** If pain/form issues were reported in the last 2 workouts, suggest -5-10% weight reduction or substitution.
*   **Visuals:** "You've hit 8-10 reps for 2 weeks. Try 52.5kg today? [Yes] [No]"

### 4.3 Rest Timer
*   **Mandatory Feature:** Auto-starts after set completion.
*   **Defaults:** Compound (2-3 mins), Isolation (60-90s), Supersets (90-120s after circuit).
*   **Feedback:** Circular countdown with "Racing Red" gradient; audio/haptic alerts.

---

## 5. Muscle Targeting Visualization

### 5.1 Anatomy Diagram
*   **Intermediate Detail:** ~20 muscle groups (Chest, Delts, Biceps, Triceps, Traps, Lats, Quads, Hamstrings, etc.).
*   **Highlighting Logic:**
    *   **Primary:** Bold/Bright Red highlight.
    *   **Secondary:** Lighter Salmon/Pink highlight.
*   **SVG Standards:** Path IDs like `chest_left`, `quads_right` for programmatic control.

---

## 6. Feedback & AI Analysis (OpenRouter)

### 6.1 Feedback Capture
*   Free-form text input per exercise: "How did this exercise feel?"
*   Captured immediately after exercise completion.

### 6.2 AI Insights Dashboard
*   **Input:** Performance data + User feedback + Historical context.
*   **Outputs:** Form corrections, Exercise substitutions (e.g., "Switch to DB Bench if shoulder hurts"), Volume adjustments.
*   **User Control:** [Accept] applies change to next workout; [Dismiss] logs and ignores.

---

## 7. Progress Tracking & Metrics

*   **Exercise-Level:** Weight lifted, Estimated 1RM (Epley formula), Volume (Sets x Reps x Weight).
*   **Body Metrics:** Weight (kg) and Body Fat % trends.
*   **Visualizations:** Time-series charts (Daily, Weekly, Monthly) with drill-down to specific workout notes.

---

## 8. Exercise Planning & Research Tool

### 8.1 Workflow
*   **Discovery (Gym):** Log initial attempts, take notes on awkwardness/pain.
*   **Research (Desktop):** Add tutorial videos, document form cues ("Elbows at 45°"), set rep ranges.
*   **Refinement:** Update cues based on ongoing feedback; mark as "Mastered."

### 8.2 Starter Library (30 Exercises)
*   10 Compound (Squat, Bench, etc.).
*   15 Isolation (Leg Press, Bicep Curls, etc.).
*   5 Bodyweight (Push-ups, Planks, etc.).

---

## 9. Technical Architecture

*   **Offline-First:** Dexie.js (Local IndexedDB) ↔ Supabase (Cloud Sync).
*   **Stack:** React + TypeScript + Vite + Shadcn UI.
*   **PWA:** Service Workers for < 1s offline load.
*   **Sync Logic:** Background synchronization via Supabase Auth and Database.

---

## 10. MVP Implementation Roadmap

### Phase 1: Core Foundation (Weeks 1-3)
*   "Pro-Lifts" Aesthetic (Racing Red / Charcoal).
*   Profile Toggle & Onboarding.
*   Starter Library & Today Dashboard.
*   Basic Tracking & Rest Timer.

### Phase 2: Sync & Progression (Weeks 4-6)
*   CouchDB Sync.
*   Science-Based Progression (2-week rule).
*   Interactive Anatomy SVG.
*   Desktop Research Interface.

### Phase 3: AI & Analytics (Weeks 7-9)
*   OpenRouter Integration (Feedback Analysis).
*   AI Superset Generation.
*   Recharts Progress Dashboard.
*   Data Export (JSON/CSV/PDF).

---

## 11. Appendix & References
*   **Data Structure:** JSON based (exercises, sets, feedback, timestamps).
*   **AI Prompt Template:** Systematic analysis of pain vs. performance for form correction.
