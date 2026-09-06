# IRS — I Rugged Successfully ($IRS)

A parody meme-token site. Static HTML, CSS and vanilla JS — no build step, no
framework, no dependencies. Open `index.html` or drop the folder on any static
host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3).

```
index.html      homepage
audit.html      /audit — the GET AUDITED notice generator
styles.css      shared styling and design tokens
audit.css       generator styling (loaded only on /audit)
script.js       config + shared behaviour
audit-data.js   all generator copy: reasons, findings, captions
audit.js        generator logic + canvas rendering
assets/         logo variants, icons, social image
```

---

## 1. Editing token & link details

Everything you need to change lives in one block at the top of **`script.js`**:

```js
const CONFIG = {
  TOKEN_NAME:       "I Rugged Successfully",
  TOKEN_SYMBOL:     "$IRS",

  CONTRACT_ADDRESS: "CONTRACT_ADDRESS_HERE",
  NETWORK:          "",
  TOTAL_SUPPLY:     "",
  MINT_AUTHORITY:   "",
  FREEZE_AUTHORITY: "",

  BUY_URL:          "",
  X_URL:            "",
  TELEGRAM_URL:     "",
  EXPLORER_URL:     ""
};
```

**How empty values behave** — nothing is ever invented:

| Field | Left empty | Filled in |
|---|---|---|
| `NETWORK`, `TOTAL_SUPPLY` | shows `PENDING` | shows the value |
| `MINT_AUTHORITY`, `FREEZE_AUTHORITY` | shows `NOT YET FILED` | shows the value (e.g. `Revoked`) |
| `BUY_URL` | Buy buttons go inert, with a "not yet listed" note | Buy buttons open the link in a new tab |
| `X_URL`, `TELEGRAM_URL` | those links are hidden entirely | links appear in nav, menu and footer |
| `EXPLORER_URL` | no explorer link | link appears once a real contract is set |

`EXPLORER_URL` takes an `{address}` token, e.g.
`https://solscan.io/token/{address}`.

Addresses longer than 24 characters are shown truncated (`ABC123…XYZ789`); the
copy button always copies the full string, and the full address is in the
element's `title`.

---

## 2. GET AUDITED (`/audit`)

Visitors generate a personalised parody notice and download it as a PNG.
Everything runs in the browser — no server, no database, no dependencies.

**Editing the humour.** All copy is in `audit-data.js`:

- `reasons[]` — the twelve grounds for examination. Each has a `label`, the
  optional third field's `label`/`placeholder`, a `status`, two `stamp` lines
  and three `findings` (one is picked at random).
- `filingStatuses[]`, `captions[]`, `randomSubjects[]`, `randomExtras[]`.

Add a thirteenth reason by appending an object to `reasons[]` — the form row,
the conditional field and the notice all pick it up with no other changes.

**The exported image** is drawn with the Canvas 2D API in `audit.js`
(`drawNotice`), at 1200 × 1500 with a 2× backing store, so the PNG is
2400 × 3000 and stays sharp on high-DPI screens. The on-screen preview *is*
the export canvas, so what you see is exactly what downloads. Filename:
`IRS-AUDIT-<SUBJECT>.png`, sanitised.

**Sharing.** Download writes the PNG. On phones that support it, Share opens
the native sheet with the image attached. On desktop, Post on X opens a
compose window with the caption prefilled — X cannot attach a local image from
a link, and the UI says so rather than pretending otherwise.

**Analytics.** No vendor is installed. Six events fire — `audit_started`,
`audit_generated`, `audit_downloaded`, `audit_shared`, `audit_x_clicked`,
`audit_reset` — each pushed to `window.IRS_EVENTS`, dispatched as
`irs:<event>` DOM events, and forwarded to `window.plausible` or
`window.dataLayer` if either ever exists. Attach a provider without editing
`audit.js`.

**Deep links.** `/audit?r=<reason-id>` preselects a reason, e.g.
`/audit?r=buying-the-top`.

---

## 3. Adding a meme / notice

In `index.html`, find `<div class="notices">` in **Section 06 · Public records**.
Duplicate one `<article class="notice-card">` block and replace the placeholder:

```html
<div class="notice-card__media">
  <img class="notice-card__img"
       src="assets/notices/005.png"
       alt="Describe what the meme shows"
       loading="lazy" width="1000" height="1250">
</div>
```

Images are cropped to a 4:5 box, so portrait art works best. Always keep
`width`/`height` so the page doesn't jump while loading.

---

## 4. Design tokens

Colours, spacing, type and layout widths are CSS custom properties at the top of
`styles.css` under `01 · DESIGN TOKENS`. Change `--navy`, `--paper`, `--red` and
the whole site follows.

Typefaces: **Instrument Serif** (display), **Newsreader** (body),
**IBM Plex Mono** (labels, figures, metadata) — loaded from Google Fonts.

---

## 5. Assets

| File | Use |
|---|---|
| `lockup-white.png` | full seal + wordmark + tagline, white, transparent |
| `mark-white.png` | seal + "IRS", white, transparent |
| `seal-white.png` | crest only, white, transparent |
| `*-navy.png` | same three, in navy, for light backgrounds |
| `icon-64/180/512.png` | favicon and touch icon |
| `og.png` | 1200×630 social preview |

---

## 6. Before launch

- [ ] Paste the real `CONTRACT_ADDRESS`
- [ ] Set `NETWORK` and `TOTAL_SUPPLY`
- [ ] Set `MINT_AUTHORITY` / `FREEZE_AUTHORITY` **only if actually revoked**
- [ ] Add `BUY_URL`, `X_URL`, `TELEGRAM_URL`
- [ ] Swap the four notice placeholders for real memes
- [ ] Nothing to configure for GET AUDITED — it uses `SITE_URL` from `CONFIG`
- [x] ~~Update the `og:image` URL to an absolute one~~ (done — points at iruggedsuccessfully.com)

---

## Legal

$IRS is a parody meme token. It is not affiliated with, endorsed by, sponsored
by, or associated with the Internal Revenue Service, the United States
Government, or any government agency. Nothing on the site is financial,
investment, tax or legal advice. Keep the disclaimer bar and the footer notices
in place.
