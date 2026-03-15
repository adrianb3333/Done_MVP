# Golf Bag Club Selector on GPS Map Screen

## Features

- [x] **Golf bag button** appears in the bottom-left corner of the GPS tab during a Play session — only when sensors are NOT paired
- [x] Tapping the golf bag button opens a **popup card** with all available clubs (same clubs as in the Pairing screen: Woods, Hybrids, Irons, Wedges + Putter)
- [x] Selecting a club **saves to Supabase**: which club was selected, exact timestamp, and the phone's GPS coordinates at that moment
- [x] A **close button** on the popup to dismiss it without selecting
- [x] The popup also appears when the user skipped "Sensors ON" in the last setup step before starting Play

## Design

- [x] **Golf bag button**: White circle (~56px) in the bottom-left corner of the map, with a golf bag icon
- [x] **Club popup card**: Large white card that slides up from the bottom with dark frosted-glass club circles
- [x] Clubs displayed as **dark frosted-glass circles** with white text labels organized by category rows
- [x] A **downward chevron button** in the top-right of the popup to close it
- [x] Smooth fade/slide animation when opening and closing the popup
- [x] Selected club gets a brief highlight animation before the popup closes
- [x] **Auto-close**: Club selector popup closes immediately after selecting a club
- [x] **Shot markers**: Black-green dots appear on the GPS map at the exact location where each club was selected
- [x] **Shot path lines**: White lines connect sequential shot markers on the same hole
- [x] **Per-hole tracking**: Shot markers and lines reset when switching to a new hole (each hole tracks independently)
- [x] **Club label**: Each shot marker displays the selected club name in a dark label bubble below the dot

## Screens / Changes

- [x] **GPS Tab (Play session)**: Added golf bag circle button + club selector popup overlay — only visible when sensors not paired
- [x] **Club selection service**: `services/clubSelectionService.ts` — saves club_id, timestamp, GPS coordinates to `club_selections` table

## Supabase Setup Required

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE club_selections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  club_id text NOT NULL,
  selected_at timestamptz DEFAULT now() NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_club_selections_user_id ON club_selections(user_id);
CREATE INDEX idx_club_selections_selected_at ON club_selections(selected_at);

ALTER TABLE club_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own club selections"
  ON club_selections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own club selections"
  ON club_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
```
