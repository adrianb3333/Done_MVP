# Add shot distance labels between GPS dots and save to Supabase

## Supabase Setup (you do this manually)
- Add a `distance_meters` column (type: `NUMERIC`, default: `NULL`) to your existing `club_selections` table
- Add an UPDATE RLS policy so authenticated users can update their own rows

## Features
- After each club selection, the distance from the **previous** shot dot to the new dot is calculated using GPS coordinates
- The distance (in meters) is displayed as a label next to the **first dot** of each pair, right beside the club name badge (e.g. "Dr 255 m", "7i 143 m")
- The distance is saved to Supabase in the `distance_meters` column of the `club_selections` row for the **first** shot (the one that was hit)
- The first dot on each hole has no distance label (no previous shot to measure from)

## Design
- Each shot dot marker now shows: club abbreviation + distance in meters (e.g. **"Dr  255 m"**)
- The distance label appears in a dark pill badge next to the club label, styled with green accent — matching the existing shot label look
- Clean, readable text that doesn't clutter the map

## Changes
- [x] Update the shot marker data to include a calculated distance from the previous shot
- [x] Update the shot marker rendering on the map to show the distance label next to each dot
- [x] Update the club selection service to accept and save `distance_meters` to Supabase
- [x] Calculate distance using the existing `haversineDistance` function already in the GPS tab, in meters
- [x] Add `updateClubSelectionDistance` function to update existing rows instead of inserting duplicates
- [x] Display distance in meters (not yards) in the UI
