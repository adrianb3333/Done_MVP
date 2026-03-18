# Fix News card text rendering & delay Info Popup until after loading

## Changes

**1. Fix text rendering in News segment cards**
- Remove the line limit on captions in the news card list so all text is visible
- Ensure the detail modal also shows all text without cutting off

**2. Delay the Info Popup until after loading screen**
- The important info popup will only appear once:
  - The loading splash screen has fully faded away
  - The user has landed on the main profile screen
- This prevents the popup from appearing over the splash/loading screen
- The popup logic and design stays exactly the same otherwise
