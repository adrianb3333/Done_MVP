# Fix distance not saving to Supabase

**Problem:**  
The shot distance in meters is calculated correctly in the app UI but never actually arrives in your Supabase database.

**Root causes:**
1. The database save is triggered inside an unreliable place (a state update function), which can silently fail or run multiple times
2. The database lookup to find the correct row uses exact GPS coordinate matching — tiny decimal differences cause it to miss the row entirely
3. Errors are swallowed and never surfaced

**Fix:**
- Move the database save out of the state update and into a proper reliable location that runs exactly once after each club selection
- Change the row lookup to use the most recent club selection by time instead of matching exact GPS coordinates
- Add better error logging so issues are visible in the console

**No changes needed on your Supabase side** — the table structure is fine. This is purely a code-side fix for how the app talks to the database.
