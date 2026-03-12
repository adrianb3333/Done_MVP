# Upgrade Wind & Flight Calculations to Trackman-Based Model

**What changes (calculations only — no UI or design changes)**

This upgrade replaces the current simple linear wind factors with professionally calibrated Trackman empirical rules and adds air density correction.

---

**New Calculation Model**

- **Headwind effect**: Adds ~1% to the required distance per 1 m/s of headwind (scaled for metric). A 5 m/s headwind on a 150m shot ≈ +7.5m adjustment.
- **Tailwind effect**: Subtracts ~0.5% per 1 m/s of tailwind — half the headwind benefit, because the ball loses lift riding the wind.
- **Crosswind drift**: ~0.7 meters of lateral drift per 1 m/s of crosswind, scaled by trajectory (low ball drifts less, high ball drifts more).
- **Trajectory scaling**: Low/Normal/High ball flights still modify how much wind affects the shot, but now using percentage-based multipliers instead of flat additive factors.

---

**Air Density Correction (new)**

- The weather API already fetches pressure data — we'll now use it along with temperature to compute **air density**.
- Formula: ρ = P / (R × T), where P = pressure in Pascals, T = temperature in Kelvin.
- Compared to a baseline "standard day" (15°C, 1013.25 hPa), the app calculates how much thinner or thicker the air is.
- Thinner air (hot/high altitude) = ball flies further → reduce "play" distance.
- Thicker air (cold/low altitude) = more drag → increase "play" distance.
- This replaces the current crude temperature-only adjustment with a proper density-based one.

---

**Weather API Update**

- Add `pressureMb` (atmospheric pressure in millibars) to the weather data returned from the API — it's already available in the API response, just not being passed through.

---

**Files touched**

- Weather data service (add pressure field)
- Golf calculations service (new formula engine)
- No changes to any screens, components, or UI elements — the function signature stays the same so all callers (Wind tab, Flight tab, GPS tab, Position tab) work without modification.
