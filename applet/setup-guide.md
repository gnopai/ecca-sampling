# ECCA Litter Study Applet — Setup & Hosting Guide

## Overview

The applet consists of two parts:

1. **`litter-study.html`** — the single-file volunteer-facing app, hosted statically (no server required).
2. **`Code.gs`** — a Google Apps Script that acts as the database backend, reading and writing to a Google Sheet.

---

## Step 1: Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something recognizable, e.g. **ECCA Litter Study Data**.
3. At the bottom, you will see tabs. Rename the default tab:
   - Double-click **Sheet1** → type **`Bags`** → press Enter.
4. Add a second tab:
   - Click the **+** button at the bottom left.
   - Double-click the new tab → type **`Items`** → press Enter.

> **Critical:** The tab names must be exactly **`Bags`** and **`Items`** (capital first letter, no extra spaces). The script will fail silently if these don't match.

The column headers will be written automatically the first time a record is submitted. You do not need to add headers manually.

---

## Step 2: Open the Apps Script Editor

1. In your Google Sheet, click **Extensions → Apps Script** in the top menu bar.
2. A new browser tab opens showing the Apps Script editor with a default empty function.
3. **Delete all existing code** in the editor (select all with Ctrl+A or Cmd+A, then Delete).
4. Paste the entire contents of **`Code.gs`** into the editor.
5. Click the **floppy disk icon** (or press Ctrl+S / Cmd+S) to save.
6. Give the project a name when prompted, e.g. **ECCA Litter Script**.

---

## Step 3: Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the **gear icon** next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description:** e.g. `ECCA Litter Study v1`
   - **Execute as:** `Me` (your Google account)
   - **Who has access:** `Anyone`
4. Click **Deploy**.
5. Google will ask you to **authorize** the script. Click **Authorize access**.

### Handling the "Unverified App" Warning

Because this script is not published to the Google Workspace Marketplace, Google shows a warning:

1. Click **Advanced** (small link at the bottom of the warning screen).
2. Click **Go to ECCA Litter Script (unsafe)**.
3. Review the permissions requested (it needs access to your Spreadsheets) and click **Allow**.

This is normal for internal/research tools and does not indicate a security problem. The script only accesses the spreadsheet you created.

---

## Step 4: Copy the Web App URL

1. After deployment, Google shows a dialog with a **Web app URL** that looks like:  
   `https://script.google.com/macros/s/AKfycb.../exec`
2. Copy the entire URL.
3. Open **`litter-study.html`** in a text editor.
4. Find this line near the top of the `<script>` section:
   ```javascript
   const SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
5. Replace `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with your copied URL, keeping the single quotes:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
6. Save the file.

> **Important:** Every time you make changes to `Code.gs` and want to redeploy, you must create a **New Deployment** (not "Manage deployments" → edit, which creates a new version but may not update the URL). The URL stays the same across new deployments of the same project.

---

## Step 5: Test the Connection

Before distributing to volunteers:

1. Open `litter-study.html` in a browser (you can open it as a local file for testing).
2. Go to the **Bag** tab.
3. Fill in all required fields and click **Save Bag Record & Go to Item Entry**.
4. Open your Google Sheet and check that a row appeared in the **Bags** tab with column headers in the first row.
5. Switch to the **Items** tab in the applet and submit one item.
6. Confirm a row appears in the **Items** tab of the sheet.
7. Go to the **Weights** tab, enter a plastic weight, and click **Confirm Bag**. Confirm that the `confirmed` column in both the Bags and Items tabs updates to `TRUE`.

---

## Step 6: Host the Applet

Choose one of the following hosting options.

### Option A: GitHub Pages (Recommended)

1. Create a free account at [github.com](https://github.com) if you don't have one.
2. Create a new repository (e.g. `ecca-litter-study`). Set it to **Public**.
3. Upload `litter-study.html` to the repository root. Rename it to `index.html` if you want the URL to be clean (e.g. `https://yourusername.github.io/ecca-litter-study/`).
4. Go to **Settings → Pages** in the repository.
5. Under "Source", select **Deploy from a branch**, choose `main`, and folder `/root`.
6. Click **Save**. Within a minute or two, your applet will be live at the URL shown.

**Pros:** Free, fast, version-controlled, HTTPS included.

### Option B: Netlify Drop

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop your `litter-study.html` file onto the page.
3. Netlify instantly publishes it and gives you a URL like `https://random-name-12345.netlify.app`.
4. You can customize the URL under site settings.

**Pros:** Fastest option, no account required for a quick test (account needed to keep the site alive).

### Option C: Google Sites

1. Go to [sites.google.com](https://sites.google.com) and create a new site.
2. In the page editor, click **Insert → Embed** and paste the full HTML content.
3. Alternatively, host the file on Google Drive and share the link.

**Note:** Google Sites may restrict some JavaScript features depending on your Google Workspace configuration. Test thoroughly before distributing.

---

## Distributing to Volunteers

Share the hosted URL with volunteers. The applet works in any modern mobile browser (Chrome, Safari, Firefox). No installation is required.

Volunteers should:
- Bookmark the URL on their phone.
- Note that data is saved locally first and synced when connected — they do not need to be online the entire time.

---

## Troubleshooting

### The sheet gets no data / "Network error" appears

- **Check the URL:** Confirm that `SCRIPT_URL` in the HTML file exactly matches the Web App URL from your deployment. No trailing spaces.
- **Check the deployment settings:** Go to Apps Script → Deploy → Manage deployments. Confirm "Who has access" is set to **Anyone** (not "Anyone with Google account").
- **Re-authorize:** If the script was never authorized, open the Web App URL directly in a browser. If it returns a Google sign-in page or an authorization prompt, complete the authorization flow.
- **CORS:** The Apps Script `doPost` endpoint accepts cross-origin requests by default. If you see a CORS error in the browser console, confirm you are posting to the `/exec` URL, not the `/dev` URL.

### Wrong tab names

- The script looks for tabs named exactly `Bags` and `Items` (case-sensitive).
- If your tabs are named differently (e.g. `bags`, `BAGS`, `Transects`), the script will return an error. Rename the tabs in Google Sheets and redeploy.

### Queue not clearing

- The Review tab verifies queued submissions against the sheet by matching timestamps. If a submission succeeded but the queue didn't clear, open the **Review** tab → click **↻ Refresh from Sheet**. Matched items will be removed from the queue automatically.
- If items still aren't clearing, check that the `timestamp` values in the sheet match the format stored locally. Timestamps are ISO 8601 strings (e.g. `2025-06-15T14:23:01.000Z`). If the sheet has reformatted them as dates, you may need to format column A in the sheet as **Plain text** before the next submission.
- To prevent this: select column A in both tabs → Format → Number → **Plain text**.

### Orphan check shows false positives

- The orphan check compares `transect_id` and `bag_number` values after trimming whitespace and converting to lowercase. Despite this, check for:
  - Extra spaces embedded inside the ID (not just leading/trailing) — e.g. `T 01` vs `T01`.
  - Different separators — e.g. `T-01` vs `T01`.
- The best fix is consistent data entry. Remind volunteers to use a standard format for transect IDs.

### Confirmed column not updating

- The **Confirm Bag** button sends a `confirmBag` action to the script, which updates both the Bags and Items tabs.
- If `confirmed` shows as blank or `FALSE` after confirming, check:
  - That the `transect_id` and `bag_number` in the Weights tab match exactly what was saved in the Bags tab (including case and spacing).
  - That the script is running as the correct Google account — go to Apps Script and check that "Execute as: Me" refers to the account that owns the spreadsheet.
- If you added the `confirmed` column header manually with different capitalization (e.g. `Confirmed` vs `confirmed`), the script's column lookup may fail. Delete the header row in both tabs and let the script recreate it on the next submission.

### "Unverified app" keeps appearing

- This only appears once during initial authorization. If it keeps appearing, you may be using the `/dev` deployment URL instead of the `/exec` URL. The `/dev` URL is for testing only and re-authorizes on every request. Use the `/exec` URL.

### Edit / Delete says "Row not found"

- Edit and Delete work by matching the `timestamp` of the last submitted record. If the sheet was modified manually (row deleted, timestamp changed), the match will fail.
- Solution: avoid manually editing timestamp values in the sheet. If needed, manually correct the record in the sheet instead of using the Edit button.

---

## Data Notes for Analysis

- **Machine-readable values** are stored in the sheet (e.g. `plastic`, `intentional`, `beverage`), not display labels. This means display labels in the applet can be updated without invalidating historical data.
- **Functional categories** are stored as a comma-separated list in a single cell (e.g. `food_container,beverage,alcoholic`). To analyze them in Sheets, use `SEARCH()` or parse in R/Python.
- **Confirmed** is stored as `TRUE`/`FALSE`. Unconfirmed items (those not yet processed through the Weights tab) will show `FALSE` or blank.
- **Plastic weight** is stored at the bag level in the `plastic_weight_lb` column of the Bags tab.
