# Fix Coach screen to show AI-generated analysis text

**Problem**
The Coach screen queries the database for rounds and drills but doesn't identify which user is logged in. The database security rules block these unfiltered requests, so no data comes back — meaning the AI text generation never triggers.

**Fixes**
- Get the logged-in user's ID and use it when fetching rounds and drill results from the database
- Fix a bug where generating two summaries at once could cause one to be lost
- Add better error logging so you can see in the console exactly what's happening if something still fails
- Show a user-friendly message if the connection to the database fails instead of just showing nothing