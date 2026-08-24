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

**Filter offline, act online.** LinkedIn's own data export (see
[Getting your Connections.csv](#getting-your-connectionscsv) below) gives you
a CSV with `First Name, Last Name, URL, Email Address, Company, Position,
Connected On`. That
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

No build step, no coding needed — this takes about two minutes.

1. **Get the code.** On this repo's GitHub page, click the green **Code**
   button → **Download ZIP**. Save it anywhere, then unzip it (double-click
   the file on Mac; on Windows, right-click it → **Extract All**).
2. **Open Chrome's extensions page.** Type `chrome://extensions` into the
   address bar and press Enter.
3. **Turn on Developer mode.** It's a toggle in the top-right corner of that
   page. Chrome will start showing a small "Developer mode extensions are
   running" banner from now on — that's normal for any unpacked extension,
   not a warning specific to this one, and it goes away if you turn Developer
   mode back off later.
4. **Click Load unpacked**, then select the folder you unzipped in step 1
   (the one that directly contains `manifest.json`).
5. **Open any `linkedin.com` page.** The panel appears top-right.

To update later: download the ZIP again, unzip it over the old folder (or
delete the old one first), then go to `chrome://extensions` and click the
reload icon (↻) on this extension's card — no need to remove and re-add it.

If a Chrome Web Store listing exists for this extension, that's the easier
path — no Developer mode, no ZIP. Check the top of this README or the
repo's About section for a store link; if there isn't one yet, the steps
above are the only way to run it, and always will be if the listing is ever
rejected or removed. (Prep work for a possible listing lives in
[`STORE_LISTING.md`](STORE_LISTING.md), for whoever maintains this repo.)

## Use

### Getting your Connections.csv

1. Go to
   [linkedin.com/mypreferences/d/download-my-data](https://www.linkedin.com/mypreferences/d/download-my-data)
   (Settings → Data privacy → Get a copy of your data).
2. Take the **top radio button** — "Download larger data archive, including
   connections, verifications, contacts, account history, and information we
   infer about you based on your profile and activity." Its own label tells
   you connections are in there. The other option, "Want something in
   particular? Select the data files you're most interested in," doesn't even
   list a Connections checkbox — it's not the faster path, it's a dead end.
3. Click **Request archive**, enter your password to confirm.
4. Expect up to 24 hours, not the ~10 minutes some guides promise. LinkedIn
   often sends two separate emails for the larger archive — it arrives in
   batches, and connections may be in the second one. Watch for a subject
   line along the lines of your full data archive being ready.
5. Download the archive from the email, unzip it, and find `Connections.csv`
   inside.

(If you spot an "Export contacts" link under My Network → Connections →
Manage synced and imported contacts, it just redirects back to this same
page now — not a shortcut.)

### Run it

1. Load `Connections.csv` into the panel. It's parsed in memory and never sent anywhere.
2. Set filters. Put anyone you must not lose into **Never remove** — it's checked
   against name, company, position, and profile slug, and it wins over every
   other filter.
3. **Preview matches.** Read the count and the sample. Do this properly.
4. **Start** with dry run on. It walks each profile and opens the menu without
   confirming, so you can see the pacing and catch selector breakage safely.
5. Turn dry run off and start again if the record looks right.
6. Download the record. It's your only account of what happened — keep it, it's
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

### نصب

نیازی به برنامه‌نویسی یا نصب چیز اضافه‌ای نیست — کل کار حدود دو دقیقه طول
می‌کشد.

1. **کد را دانلود کنید.** در صفحه‌ی گیت‌هاب این پروژه، روی دکمه‌ی سبز
   **Code** بزنید ← **Download ZIP**. فایل را هرجا خواستید ذخیره کنید و از
   حالت فشرده خارجش کنید (در ویندوز: کلیک راست روی فایل ← Extract All).
2. **صفحه‌ی افزونه‌های کروم را باز کنید.** در نوار آدرس تایپ کنید
   `chrome://extensions` و اینتر بزنید.
3. **حالت Developer mode را روشن کنید.** یک کلید در گوشه‌ی بالا-راست همان
   صفحه است. از این به بعد کروم یک نوار کوچک درباره‌ی «Developer mode
   extensions» نشان می‌دهد — این طبیعی است و مخصوص این افزونه نیست؛ هر
   افزونه‌ی نصب‌شده به همین روش همین پیام را نشان می‌دهد.
4. روی **Load unpacked** بزنید و پوشه‌ای را انتخاب کنید که از حالت فشرده
   خارج کردید (همان پوشه‌ای که مستقیماً فایل `manifest.json` داخلش است).
5. **یک صفحه از linkedin.com باز کنید.** پنل بالا-سمت‌راست ظاهر می‌شود.

برای به‌روزرسانی بعداً: دوباره ZIP را دانلود کنید، روی پوشه‌ی قبلی
جایگزینش کنید (یا اول پوشه‌ی قبلی را پاک کنید)، بعد در
`chrome://extensions` روی آیکون رفرش (↻) روی کارت این افزونه بزنید — نیازی
به حذف و نصب دوباره نیست.

### گرفتن Connections.csv

1. به آدرس
   [linkedin.com/mypreferences/d/download-my-data](https://www.linkedin.com/mypreferences/d/download-my-data)
   بروید (مسیر: Settings ← Data privacy ← Get a copy of your data).
2. **گزینه‌ی رادیویی بالا** را انتخاب کنید — «Download larger data archive,
   including connections, verifications, contacts, account history, and
   information we infer about you based on your profile and activity». خودِ
   عنوان این گزینه می‌گوید که ارتباط‌ها (connections) در آن هست. گزینه‌ی
   دیگر، «Want something in particular? Select the data files you're most
   interested in»، اصلاً چک‌باکسی برای Connections ندارد — این گزینه میان‌بر
   نیست، بن‌بست است.
3. روی **Request archive** بزنید و رمز عبورتان را برای تأیید وارد کنید.
4. منتظر بمانید — تا ۲۴ ساعت طول می‌کشد، نه ده دقیقه‌ای که بعضی راهنماها
   می‌گویند. لینکدین معمولاً برای آرشیو بزرگ‌تر دو ایمیل جداگانه می‌فرستد؛
   چون آرشیو به‌صورت دسته‌ای آماده می‌شود و ممکن است بخش connections در
   ایمیل دوم باشد. دنبال موضوعی شبیه به «your full data archive being
   ready» بگردید.
5. آرشیو را از ایمیل دانلود کنید، از حالت فشرده خارجش کنید و فایل
   `Connections.csv` را پیدا کنید.

(اگر لینک «Export contacts» را زیر My Network ← Connections ← Manage synced
and imported contacts دیدید، بدانید که الان فقط به همین صفحه بازتان
می‌گرداند — میان‌بر نیست.)

### اجرای آن

1. فایل `Connections.csv` را در پنل بارگذاری کنید. فایل فقط در حافظه مرورگر
   پردازش می‌شود و به هیچ جایی ارسال نمی‌شود.
2. فیلترها را تنظیم کنید. هر کسی که نباید از دست بدهید را در قسمت
   **Never remove** وارد کنید — این فیلد در برابر نام، شرکت، سمت شغلی و
   نشانی پروفایل بررسی می‌شود و بر هر فیلتر دیگری اولویت دارد.
3. روی **Preview matches** بزنید. تعداد و نمونه‌ها را با دقت بخوانید. این
   مرحله را جدی بگیرید.
4. با حالت آزمایشی (dry run) روشن، دکمه **Start** را بزنید. افزونه هر
   پروفایل را باز می‌کند و منو را بدون تأیید نهایی نشان می‌دهد تا بتوانید
   سرعت اجرا را ببینید و مشکلات احتمالی را بدون خطر شناسایی کنید.
5. اگر گزارش درست به نظر می‌رسید، حالت آزمایشی را خاموش کنید و دوباره
   Start را بزنید.
6. گزارش نهایی را دانلود کنید. این تنها سند شماست از آنچه اتفاق افتاده —
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
icons/           toolbar/store icons (16, 48, 128px)
src/core.js      state, label dictionary, element matching, waitFor
src/csv.js       Connections.csv parser + filter engine
src/remover.js   the resumable one-removal-per-load state machine
src/panel.js     shadow-DOM panel (UI can't collide with LinkedIn's CSS)
src/main.js      wiring
PRIVACY.md       privacy policy (no data collected — required for a Web Store listing)
STORE_LISTING.md copy-paste reference for publishing to the Chrome Web Store
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

MIT. Your account, your call, your responsibility. Anyone can use, modify, or
redistribute this — free of charge, no permission needed.

Built with [Claude](https://claude.com/claude-code).
