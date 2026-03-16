# Add shot distance labels between GPS dots and save to Supabase

## Supabase Setup (you do this manually)
- Add a `distance_meters` column (type: `NUMERIC`, default: `NULL`) to your existing `club_selections` table

## Features
- After each club selection, the distance from the **previous** shot dot to the new dot is calculated using GPS coordinates
- The distance (in yards) is displayed as a label next to the **first dot** of each pair, right beside the club name badge — like in the inspiration image (e.g. "Dr 278 yds", "7i 157 yds")
- The distance is saved to Supabase in the `distance_meters` column of the `club_selections` row for the **first** shot (the one that was hit)
- The first dot on each hole has no distance label (no previous shot to measure from)

## Design
- Each shot dot marker now shows: club abbreviation + distance in yards (e.g. **"Dr  278 yds"**)
- The distance label appears in a dark pill badge next to the club label, styled with green accent — matching the existing shot label look
- Clean, readable text that doesn't clutter the map

## Changes
- Update the shot marker data to include a calculated distance from the previous shot
- Update the shot marker rendering on the map to show the distance label next to each dot
- Update the club selection service to accept and save `distance_meters` to Supabase
- Calculate distance using the existing `haversineDistance` function already in the GPS tab, converted to yards
