# Privacy Policy — Connection Cleanup for LinkedIn

**Last updated: 2026-08-25**

This extension collects nothing, transmits nothing, and talks to no server but
LinkedIn's own — because you're using LinkedIn's own site through it. There
are no analytics, no error reporting, no ads, and no third-party libraries.

## What it touches, and why

| Data | What happens to it |
| --- | --- |
| Your `Connections.csv` file | Read into the browser tab's memory when you choose the file. Never uploaded, never leaves your device. Cleared when you close the tab. |
| The filtered queue and the action log | Stored in `chrome.storage.local` — a local database Chrome keeps on your machine, scoped to this extension. It's what lets the job survive the page navigation each removal causes. Nothing here is synced to a Google account or sent anywhere. |
| `linkedin.com` pages | The extension reads button and menu labels on the page to find "Remove connection," and clicks them. It does not read your messages, feed, or any content unrelated to the connection-removal flow. |

## Permissions, plainly

- **`storage`** — holds the queue/log described above, locally.
- **`host_permissions` for `https://www.linkedin.com/*`** — required so the
  extension's content script can run on LinkedIn pages at all. It does not
  run anywhere else.

## What this extension does not do

No accounts, no sign-in, no remote code execution, no network requests to
anything other than the LinkedIn pages you're already on, no data sale, no
data sharing — there's no data collected in the first place to share.

## Changes

If this policy ever changes, the update will be reflected here, in this same
file, in the same repository.

## Contact

Open an issue on the GitHub repository this file ships with.
