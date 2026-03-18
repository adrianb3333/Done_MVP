# Fix ScrollView in news detail & chat navigation from profile card

## Fix 1: Smooth ScrollView in News Detail Popup

**Problem:** When pressing a news card, the detail popup's scroll doesn't work smoothly because touch events get intercepted by overlay pressables.

**Changes:**
- Restructure the news detail modal so the ScrollView gets full, uninterrupted touch handling
- Remove the nested Pressable wrappers that steal gestures from the ScrollView
- Use a proper close button instead of tap-outside-to-dismiss (which conflicts with scrolling)
- Give the ScrollView proper flex layout so it fills available space and scrolls naturally
- Add `scrollEventThrottle` and proper bounce settings for buttery smooth scrolling on iOS

## Fix 2: Chat navigation from another user's profile card

**Problem:** When pressing "Text" on someone's profile card, it doesn't reliably navigate to the chat conversation screen. The fullScreen modal closing and the new screen push create a timing conflict.

**Changes:**
- Increase the navigation delay after the profile card modal closes, giving the system enough time to finish the modal dismissal animation
- Use a callback-based approach so navigation only fires after the modal is truly closed
- Ensure the correct parameters (user ID, username, avatar) are passed through to the chat conversation screen
