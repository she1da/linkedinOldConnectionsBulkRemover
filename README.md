# Connection Cleanup for LinkedIn

Filter your **official LinkedIn data export**, review exactly who you're about to
remove, then let the extension do the clicking — paced, capped, resumable, and
logged.

> ⚠️ **Read this before you install it.**
> LinkedIn's User Agreement prohibits third-party software that automates
> actions on the site. Using this — or any tool like it — puts your account at
> risk of restriction or permanent loss. Removals are irreversible: you'd have to
> re-invite and be re-accepted, and any recommendations or endorsements between
> you and that person are withdrawn. Nobody is notified when you disconnect.
> This is a personal utility published for people who understand that trade.
> Dry run is on by default and you should leave it on until you trust the output.

---

## Why this design

Most bulk-remove scripts (including the well-known 2019 Medium one) do the same
two things, and both are why they break:

1. **They scrape the connections page for selection.** You scroll an infinite
   list injecting checkboxes. Slow, and the DOM churns under you.
2. **They hardcode CSS classes** like `.mn-connection-card`. LinkedIn ships
   hashed, generated class names. Every one of those scripts is dead within
   months of publishing.

Two changes fix both:

**Filter offline, act online.** LinkedIn's own data export (Settings → Data
Privacy → Get a copy of your data → Connections) gives you a CSV with `First
Name, Last Name, URL, Email Address, Company, Position, Connected On`. That
`Connected On` column is the thing the LinkedIn UI never lets you filter by — so
"everyone I connected with before 2019 who has no company listed" becomes a
one-line filter instead of an afternoon of scrolling. No scraping, and the
selection step happens against a file you already own.

**Match on accessible names, not classes.** Every element lookup goes through
`findByLabel(['remove connection', ...])`, which reads `aria-label` and text
content. Accessible names change far less often than hashed classes, and
supporting another UI language is adding a string to `src/core.js`, not
rewriting the matcher.

**One removal per page load.** Each removal navigates away and destroys the
content script, so the job is a state machine in `chrome.storage.local`, not a
loop. It resumes on the next load. Closing the tab is a valid stop button.

## Install

No build step.

1. Clone or download this repo.
2. Chrome → `chrome://extensions` → enable **Developer mode**.
3. **Load unpacked** → select this folder.
4. Open any `linkedin.com` page. The panel appears top-right.

Add an `icons/` folder and an `icons` key in `manifest.json` if you want a
toolbar icon; nothing here depends on it.

## Use

1. Request your data export from LinkedIn and wait for the email (minutes to
   ~24h). Unzip it and find `Connections.csv`.
2. Load that file into the panel. It's parsed in memory and never sent anywhere.
3. Set filters. Put anyone you must not lose into **Never remove** — it's checked
   against name, company, position, and profile slug, and it wins over every
   other filter.
4. **Preview matches.** Read the count and the sample. Do this properly.
5. **Start** with dry run on. It walks each profile and opens the menu without
   confirming, so you can see the pacing and catch selector breakage safely.
6. Turn dry run off and start again if the record looks right.
7. Download the record. It's your only account of what happened — keep it, it's
   also the list you'd need to re-invite anyone removed by mistake.

Defaults: 25 per run, 100/day cap, 4–9s between actions. The delays exist
because the page needs time to settle between navigations and because bursts of
identical timing break things. They do not make any of this compliant.

## راهنمای استفاده (فارسی)

> ⚠️ **قبل از نصب این افزونه حتماً بخوانید.**
> شرایط استفاده لینکدین استفاده از نرم‌افزارهای شخص‌ثالث برای خودکارسازی
> اقدامات در سایت را ممنوع کرده است. استفاده از این ابزار — یا هر ابزار
> مشابهی — حساب شما را در معرض ریسک محدودیت یا حذف دائمی قرار می‌دهد. حذف
> ارتباط‌ها غیرقابل بازگشت است: باید دوباره دعوت بفرستید و طرف مقابل قبول
> کند، و هر توصیه یا تأییدیه مهارتی بین شما و آن فرد هم پس گرفته می‌شود.
> هنگام قطع ارتباط به کسی اطلاع‌رسانی نمی‌شود. این ابزار برای کسانی منتشر
> شده که این معامله را می‌پذیرند. حالت آزمایشی (Dry run) به‌طور پیش‌فرض
> روشن است؛ تا وقتی به خروجی آن اعتماد نکرده‌اید آن را خاموش نکنید.

1. از لینکدین درخواست خروجی داده (data export) بدهید و منتظر ایمیل بمانید
   (از چند دقیقه تا حدود ۲۴ ساعت طول می‌کشد). فایل را از حالت فشرده خارج
   کنید و فایل `Connections.csv` را پیدا کنید.
2. آن فایل را در پنل بارگذاری کنید. فایل فقط در حافظه مرورگر پردازش می‌شود
   و به هیچ جایی ارسال نمی‌شود.
3. فیلترها را تنظیم کنید. هر کسی که نباید از دست بدهید را در قسمت
   **Never remove** وارد کنید — این فیلد در برابر نام، شرکت، سمت شغلی و
   نشانی پروفایل بررسی می‌شود و بر هر فیلتر دیگری اولویت دارد.
4. روی **Preview matches** بزنید. تعداد و نمونه‌ها را با دقت بخوانید. این
   مرحله را جدی بگیرید.
5. با حالت آزمایشی (dry run) روشن، دکمه **Start** را بزنید. افزونه هر
   پروفایل را باز می‌کند و منو را بدون تأیید نهایی نشان می‌دهد تا بتوانید
   سرعت اجرا را ببینید و مشکلات احتمالی را بدون خطر شناسایی کنید.
6. اگر گزارش درست به نظر می‌رسید، حالت آزمایشی را خاموش کنید و دوباره
   Start را بزنید.
7. گزارش نهایی را دانلود کنید. این تنها سند شماست از آنچه اتفاق افتاده —
   نگهش دارید؛ همان فهرستی است که برای دعوت دوباره‌ی افرادی که به اشتباه
   حذف شده‌اند لازم دارید.

مقادیر پیش‌فرض: ۲۵ مورد در هر اجرا، سقف ۱۰۰ مورد در روز، و ۴ تا ۹ ثانیه
فاصله بین اقدامات. این تأخیرها به این دلیل وجود دارند که صفحه بعد از هر
جابه‌جایی به زمان نیاز دارد و چون الگوهای زمانی یکسان و پشت‌سرهم باعث
مشکل می‌شوند. این تأخیرها این کار را «مجاز» نمی‌کنند.

## When it breaks

It will, eventually — LinkedIn ships UI changes constantly. The record tells you
how:

| Result | Meaning | Fix |
| --- | --- | --- |
| `failed:no-more-button` | The overflow menu wasn't found | Add the current button's `aria-label` to `LABELS.moreActions` |
| `failed:not-connected` | No Remove item in the menu | Usually genuine — already disconnected. If it's every row, update `LABELS.removeConnection` |
| `failed:no-confirm-dialog` | The modal didn't open or isn't `role="dialog"` | Inspect the modal; widen the selector in `remover.js` |
| `failed:no-confirm-button` | Modal opened, confirm button not matched | Add its label to `LABELS.confirmRemove` |

Fixing a break is normally editing one array in `src/core.js`. That's the whole
point of the design.

## Layout

```
manifest.json
src/core.js      state, label dictionary, element matching, waitFor
src/csv.js       Connections.csv parser + filter engine
src/remover.js   the resumable one-removal-per-load state machine
src/panel.js     shadow-DOM panel (UI can't collide with LinkedIn's CSS)
src/main.js      wiring
```

## Ideas worth building

- Restore list: emit re-invite URLs alongside the record.
- Unfollow instead of remove — same filters, keeps the connection, fixes your
  feed. For a lot of people this is what they actually wanted.
- Network report from the CSV alone: connections by year, top companies, dead
  weight. Read-only, no automation, no risk — arguably the more useful half.
- Firefox build (MV3 is close to compatible; `chrome.*` → `browser.*`).

## Not included, deliberately

No analytics, no remote calls, no accounts, no data leaving the browser. The
permissions are `storage` plus `linkedin.com` host access, and that's checkable
in `manifest.json` in about ten seconds.

No use of the internal `/voyager/api/` endpoints. Firing DELETE requests
directly is faster, but it's unambiguously programmatic access rather than
driving the UI, it needs the CSRF token out of your session cookie, and it
removes the pacing that keeps this from looking like an attack. Clicking buttons
is slower and better.

## License

MIT. Your account, your call, your responsibility.
