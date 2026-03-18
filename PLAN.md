# Fix loading screen bug, Coach data info, and add swipe-back navigation

## Changes

### 1. Fix: Loading screen only shows on app startup
- **Problem:** When you quit a round or practice, the app tries to navigate while the screen structure isn't ready, causing the whole app to reload and show the 7-second loading screen again
- **Fix:** Remove the forced navigation after quitting — the app already knows to show the correct screen based on session state. This prevents the accidental reload

### 2. Coach Screen — How the data works
The Coach screen automatically pulls data from your Supabase database:
- It reads from the **`rounds`** table (completed rounds with `is_completed = true`) and the **`hole_scores`** table (individual hole data like score, putts, fairway hits, GIR)
- It reads from the **`drill_results`** table (completed practice drills with drill name, percentage, hits/shots)
- The AI then generates a coaching summary based on that data plus your handicap goal

**What you need in Supabase for it to work:**
- A `rounds` table with columns: `id`, `user_id`, `course_name`, `is_completed`, `created_at`
- A `hole_scores` table with columns: `round_id`, `hole_number`, `par`, `score`, `putts`, `fairway_status`, `gir`
- A `drill_results` table with columns: `id`, `user_id`, `drill_name`, `percentage`, `category`, `total_hits`, `total_shots`, `completed_at`
- The current handicap values (14.2 and 16.8) are hardcoded — I'll connect them to the user's actual profile data instead

**No code changes needed for the Coach data setup** — once your Supabase tables have completed rounds/drills, the Coach will automatically pick them up and generate AI analysis.

### 3. Add swipe-back gesture on all screens
- Enable side-swipe (swipe from left edge to go back) on all screens and modals throughout the app
- This is the standard iOS gesture that users expect — swipe from the left edge to return to the previous screen