# Live orientation-based wind adjustments for Wind & Flight tabs

## Summary
Replace the static (hardcoded to 0°) target heading with a real-time device compass heading so the "Played As" / Adjusted Distance updates live as you rotate your phone.

---

## What changes

### 1. New shared compass hook
- A reusable hook that listens to the device compass at ~30Hz
- Applies a **moving average filter** (last 5 readings) to smooth out jitter so the numbers don't flicker
- Only triggers recalculation when heading changes by more than 1°
- Falls back gracefully on web (uses 0° heading)

### 2. Fix the wind vector math
- **Current bug:** The weather API inverts the head/tail sign, causing headwinds and tailwinds to be swapped
- **Fix:** Remove the manual negation so the formula correctly outputs:
  - **Positive longitudinal** → Headwind → Distance **increases**
  - **Negative longitudinal** → Tailwind → Distance **decreases**

### 3. Real-time recalculation in Wind & Flight tabs
- Both tabs currently pass a fixed `0` as the target heading — this will be replaced with the live smoothed compass heading
- The head/tail and crosswind values are **recalculated locally** each time the heading changes (without re-fetching the weather API — only wind speed and direction from the API are needed, the vector decomposition happens on-device)
- The Adjusted Distance, Wind breakdown stats (Cross, Head/Tail) all update instantly as the user scans the horizon

### 4. Compass component reuse
- The existing WindCompass already tracks device heading for the arrow — the new hook will be shared between the compass visual and the calculation, keeping them perfectly in sync

---

## What stays the same
- All visual design, layout, colors, and UI components remain untouched
- The ball flight toggle (Low/Normal/High) and distance input work exactly as before
- Weather data still fetches from the same API at the same intervals
- The compass arrow and ring animations stay the same
