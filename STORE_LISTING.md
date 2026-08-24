# Chrome Web Store listing — copy-paste reference

Everything below is text you paste into the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
I can't submit this myself — it needs your Google account, a one-time $5
developer registration fee, and your click on "Submit for review." This file
exists so that part is just pasting, not writing.

## Before you start

- [ ] `manifest.json` is at version `0.2.0`, icons are in `icons/` — both
      already done in this repo.
- [ ] You have a Google account you're willing to register as a Chrome Web
      Store developer with (one-time $5 fee, separate from any specific app).
- [ ] Zip the repo folder for upload: **do not zip the parent folder**, zip
      so that `manifest.json` sits at the root of the archive, not one level
      down inside a subfolder — the Dashboard rejects the upload otherwise.
      From this folder: select `manifest.json`, `README.md`, `PRIVACY.md`,
      `src/`, `icons/` → right-click → "Send to → Compressed folder" (Windows)
      or select-all → Compress (Mac).

## Store listing fields

**Title**
```
Connection Cleanup for LinkedIn
```

**Summary** (132 char max — this one's 110)
```
Clean up old LinkedIn connections from your own data export — filter, preview, then remove them one at a time.
```

**Description** (paste as-is; the Dashboard renders plain text/line breaks)
```
Filter your official LinkedIn data export, review exactly who you're about
to remove, then let the extension do the clicking — paced, capped,
resumable, and logged.

READ THIS BEFORE INSTALLING
LinkedIn's User Agreement prohibits third-party software that automates
actions on the site. Installing this — or any tool like it — puts your
account at risk of restriction or loss. Removals are irreversible: you'd
have to re-invite and be re-accepted, and any recommendations or
endorsements between you and that person are withdrawn. Nobody is notified
when you disconnect. This is a personal utility for people who understand
that trade. Dry run is on by default — leave it on until you trust the
output.

HOW IT WORKS
1. Request your data export from LinkedIn (Settings > Data privacy > Get a
   copy of your data) and wait for Connections.csv.
2. Load that file into the panel that appears on any linkedin.com page.
   It's parsed in your browser and never leaves it.
3. Filter by connection date, company, position, or missing fields. Anyone
   in "Never remove" is protected no matter what else matches.
4. Preview the matches before doing anything.
5. Run it with dry run on first — it walks every profile and opens the
   menu without confirming, so you can watch the pacing and catch any
   selector breakage safely.
6. Turn dry run off once the record looks right. Defaults: 25 removals per
   run, 100/day cap, 4-9 seconds between actions.
7. Download the record afterward — it's your only account of what
   happened, and what you'd need to re-invite anyone removed by mistake.

WHAT IT DOES NOT DO
No analytics, no accounts, no ads, no data leaving your browser, no calls
to any server but linkedin.com itself. Full source and a plain-language
privacy policy are in the GitHub repo linked below.
```

**Category**
```
Productivity
```

**Language**
```
English
```

**Single purpose description** (Dashboard requires this exact kind of
one-liner separately from the description above)
```
Lets a user filter their own exported LinkedIn connections list and remove
the connections they selected, through LinkedIn's own web interface.
```

## Permission justifications

The Dashboard asks you to justify each permission separately before it will
publish.

**`storage`**
```
Stores the removal queue and action log locally so the in-progress job can
resume after each removal, which navigates the page and reloads the
extension. Nothing here is synced or transmitted anywhere.
```

**Host permission — `https://www.linkedin.com/*`**
```
The content script needs to run on linkedin.com to read the page's own
button/menu labels and click "Remove connection" on profiles the user
explicitly selected. It does not run on, or read data from, any other site.
```

## Privacy policy URL

Use the raw GitHub URL to `PRIVACY.md` once this is pushed:
```
https://github.com/she1da/linkedinOldConnectionsBulkRemover/blob/main/PRIVACY.md
```
(A nicer-looking option, if you want it: turn on GitHub Pages for this repo
— Settings → Pages → Source: `main` branch, `/ (root)` — and use the Pages
URL instead. Not required; the blob URL above is a valid HTTPS policy link
on its own.)

## Store icon

Upload `icons/icon128.png` (128×128) as the Store icon — same file the
extension itself uses, already in the repo.

## Screenshot (required — at least one)

The Dashboard requires a screenshot, 1280×800 or 640×400 PNG/JPEG. I can't
capture this myself without logging into a real LinkedIn account on your
behalf, which isn't something I should do for you. It's two steps on your
end:

1. Load the unpacked extension (see README → Install), open any
   `linkedin.com` page — the panel appears top-right.
2. Take a screenshot of the tab (Win: `Win+Shift+S`; Mac: `Cmd+Shift+4`),
   crop/pad it to 1280×800 or 640×400, and upload it as the listing
   screenshot.

## After you submit

Review typically takes a few hours to a few days. Given what this extension
does — automate actions on a site whose own terms prohibit that — there's a
real chance of rejection or a later takedown; that risk is exactly why the
"Load unpacked" install path in the README stays documented as the
always-available fallback regardless of what happens here.
