# Fix news detail popup to show text and date below the image

**Problem**
- When pressing a news card, the detail popup only shows the image — the title, caption text, and date are missing.

**Fix**
- Remove the gradient wrapper inside the scroll area that's causing the text to collapse
- Change the scroll view layout so it properly sizes to fit the text content below the image
- Ensure the title, full caption text, and posted date all render correctly beneath the image
- Keep the scrolling behavior so long text can be scrolled through
