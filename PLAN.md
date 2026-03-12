# Update drill database to match new practice drills UI

## What's changing

The old database stored only 3 fields per drill (`user_id`, `drill_name`, `score`). The new practice drills UI captures much more data. We need to update both the database schema and the saving logic.

---

### Supabase table to update: `drill_results`

Drop the old table and recreate with these columns:

| Column | Type | Description |
|---|---|---|
| id | uuid (auto) | Primary key |
| user_id | uuid | The authenticated user |
| drill_name | text | Name of the drill (e.g. "Long Putts") |
| category | text | Category: Putting, Wedges, Irons, Woods |
| is_sensor_drill | boolean | Whether it was a sensor drill |
| rounds | integer | Number of rounds in the drill |
| targets_per_round | integer | Targets per round |
| total_shots | integer | Total shots (rounds × targets) |
| round_scores | jsonb | Array of scores per round (e.g. [5, 7, 3]) |
| total_hits | integer | Total targets hit across all rounds |
| percentage | integer | Overall hit percentage (0–100) |
| completed_at | timestamptz | When the drill was finished |

**SQL to run in Supabase:**
```sql
DROP TABLE IF EXISTS drill_results;

CREATE TABLE drill_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  drill_name text NOT NULL,
  category text NOT NULL,
  is_sensor_drill boolean DEFAULT false,
  rounds integer NOT NULL,
  targets_per_round integer NOT NULL,
  total_shots integer NOT NULL,
  round_scores jsonb NOT NULL,
  total_hits integer NOT NULL,
  percentage integer NOT NULL,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE drill_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own drill results"
  ON drill_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own drill results"
  ON drill_results FOR SELECT
  USING (auth.uid() = user_id);
```

---

### App changes

- **Save to Supabase on drill finish** — When a drill is completed and the summary screen shows, the result is automatically saved to Supabase with all the new fields (name, category, sensor flag, rounds, targets, round scores, hits, percentage)
- **Keep local AsyncStorage backup** — The existing local history still works as a fallback
- **Load drill history from Supabase** — The drill history screen pulls data from Supabase instead of only AsyncStorage
