# Global Info Pop-up from Sanity

**What it does**

When the app launches, it checks Sanity for the latest "info" post. If you haven't already acknowledged it, a pop-up appears with the post's image, title, and caption.

---

**Features**

- On app start, fetches the latest post from Sanity where `tabLocation == 'info'`
- Compares the post's ID against what's saved on the device
- If not previously acknowledged, shows a full-screen modal pop-up
- **"X" button** — closes the pop-up without saving (it will appear again next launch)
- **"Understand" button** — saves the post ID to device storage and closes the pop-up (won't show again)
- Once "Understand" is tapped, the post also becomes visible in the **News** segment of the Information screen (news-modal)

---

**Design**

- Semi-transparent dark overlay behind the pop-up
- Rounded card in the center of the screen
- Post image displayed at the top of the card
- Title in bold below the image, caption text underneath
- Small circular "X" button in the top-right corner of the card
- A prominent "Understand" button at the bottom of the card, matching the app's existing blue/light aesthetic
- Smooth fade-in animation when appearing

---

**How it works behind the scenes**

- A new component (`InfoPopup`) is added and rendered globally in the root layout, alongside the existing banners
- It uses `useQuery` to fetch info posts from Sanity and `AsyncStorage` to track acknowledged post IDs
- The News segment query in the Information screen is updated to include posts where `tabLocation == 'info'` AND whose ID has been saved (acknowledged), so they appear alongside regular news posts