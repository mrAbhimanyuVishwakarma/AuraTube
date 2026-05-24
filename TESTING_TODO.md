# AuraTube - Feature Testing Checklist (QA TODO)

Use this guide to verify functionality after any updates, refactors, or feature modifications.

---

## 1. User Authentication & Profiles
- [ ] **Account Registration**:
  - Open the **Sign In** modal from the header.
  - Switch to **Create Account** and register a new email.
  - Verify that the password confirmation validates mismatches.
  - Verify that registering a duplicate email shows the correct error message (`Email is already registered.`).
  - Verify that registration automatically logs in the user and shows their name/email in the header.
- [ ] **Account Login**:
  - Log out and reopen the modal.
  - Try logging in with incorrect credentials; verify error handling.
  - Log in with valid credentials; verify local token storage.
- [ ] **Profile Menu**:
  - Check that a free user profile does *not* display the premium `PRO` badge.
  - Verify that clicking the logout action clears the session token and updates the header.

---

## 2. Payment Gateway Checkouts (SaaS Billing)
- [ ] **Upgrade redirectional triggers**:
  - Log in as a free user and click **Go Premium** in the header.
  - Check that the upgrade modal loads features comparison and the subscription price.
- [ ] **Stripe (Global Checkout)**:
  - Click **Stripe / Cards / PayPal (Global)**.
  - Verify redirection to Stripe's hosted checkout portal.
  - (Test Mode) Complete transaction using Stripe test cards (`4242 4242 4242 4242`); verify redirect back.
- [ ] **Razorpay (UPI / Indian Cards)**:
  - Click **Razorpay / UPI / Cards (India)**.
  - Verify that Razorpay's Standard overlay pops up directly inside the application.
  - (Test Mode) Select UPI/Netbanking and complete a simulated success purchase; verify success modal alerts.

---

## 3. Core Downloader & Metadata Extractor
- [ ] **URL Extraction**:
  - Paste a single video link (e.g. `https://www.youtube.com/watch?v=...`) and click **Analyze**.
  - Verify that a glassmorphic skeleton loader displays while fetching.
  - Verify video thumbnail, title, length, and format resolutions map cleanly.
- [ ] **Playlist Manager**:
  - Paste a playlist link (e.g. `https://www.youtube.com/playlist?list=...`) and click **Analyze**.
  - Check that the playlist title and total count load.
  - Verify the batch checklist (Select All, Select None, toggle individual items).

---

## 4. Google Drive OAuth Integration
- [ ] **Settings Save**:
  - Scroll down to the **Setup & Integrations** card.
  - Input downloads directory path, Google Client ID, and Client Secret. Click **Save Configurations**.
  - Verify the success dialog and check that `backend/config/client_secrets.json` updates.
- [ ] **Google Drive Sign In**:
  - Click **Connect Google Account** (on the settings card or from the header status pill).
  - Verify that a centered authentication popup window opens.
  - Proceed with Google OAuth consent. Upon success, check that the popup closes automatically and the status pill changes to **Drive Connected** (green indicator).
- [ ] **Drive Disconnection**:
  - Click the **Drive Connected** pill or settings button. Confirm disconnection.
  - Verify the pill reverts to **Drive Standby**.

---

## 5. Free Tier Rate Limits & Guardrails
- [ ] **Google Drive Restriction**:
  - Log in as a free account and choose **Upload to Drive** in `FormatSelector`.
  - Verify that the upgrade modal triggers immediately.
- [ ] **Resolution Constraints**:
  - In `FormatSelector`, check that resolutions above 720p (1080p, 4K) show a lock `🔒` icon.
  - Click on 1080p; verify that the upgrade modal triggers and rejects downloads.
- [ ] **Playlist Constraints**:
  - Choose a playlist. Select **1080p** or **Drive** in bulk targets.
  - Click **Download**; verify upgrade overlay triggers.
- [ ] **Daily Rate Limits**:
  - Trigger 5 downloads. On the 6th download attempt, verify that the backend rejects the request with a `429 Too Many Requests` limit warning.

---

## 6. Premium SaaS Verification
- [ ] **HD Downloads**:
  - Log in as a Premium user.
  - Verify that resolutions > 720p are unlocked (no `🔒` badge).
  - Download a 1080p video; verify that the task downloads, merges audio/video on the backend, and completes.
- [ ] **Cloud Uploader**:
  - Select **Upload to Drive** and start a download.
  - Open the **Download Progress Dashboard**.
  - Check progress bar states: `downloading` -> `merging` -> `uploading`.
  - On completion, click **View on Google Drive** to confirm the video is successfully stored in the cloud.

---

## 7. Responsive UI & Smooth Scroll
- [ ] **Responsive Viewports**:
  - Resize the browser to mobile width (<768px).
  - Verify header columns stack neatly, input boxes remain readable, and download cards flex correctly.
- [ ] **Modal Scrolling**:
  - Open `PricingModal` on mobile. Verify that you can scroll vertically through all options without getting cropped.
- [ ] **Smooth Anchor Scroll**:
  - Connect Drive when client keys are missing; verify the page scrolls smoothly down to the Settings panel anchor.
