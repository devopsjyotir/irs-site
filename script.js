/* ═══════════════════════════════════════════════════════════════════════
   IRS — I RUGGED SUCCESSFULLY
   ═══════════════════════════════════════════════════════════════════════ */


/* ╔═══════════════════════════════════════════════════════════════════╗
   ║  EDIT EVERYTHING HERE                                             ║
   ║  ---------------------------------------------------------------  ║
   ║  Leave a value as an empty string ("") and the site will show it   ║
   ║  as PENDING and hide the related button. Nothing is invented.      ║
   ╚═══════════════════════════════════════════════════════════════════╝ */

const CONFIG = {

  /* ── Token ─────────────────────────────────────────────────────── */
  TOKEN_NAME:       "I Rugged Successfully",
  TOKEN_SYMBOL:     "$IRS",

  CONTRACT_ADDRESS: "CONTRACT_ADDRESS_HERE",   // paste the real address at launch
  NETWORK:          "",                        // e.g. "Solana"
  TOTAL_SUPPLY:     "",                        // e.g. "1,000,000,000"

  // Only fill these in once they are actually true.
  MINT_AUTHORITY:   "",                        // e.g. "Revoked"
  FREEZE_AUTHORITY: "",                        // e.g. "Revoked"

  /* ── Links (empty = button hidden) ─────────────────────────────── */
  BUY_URL:          "",                        // e.g. "https://jup.ag/swap/SOL-<address>"
  X_URL:            "",                        // e.g. "https://x.com/yourhandle"
  TELEGRAM_URL:     "",                        // e.g. "https://t.me/yourgroup"

  // {address} is replaced with CONTRACT_ADDRESS. Empty = no explorer link.
  EXPLORER_URL:     ""                         // e.g. "https://solscan.io/token/{address}"
};


/* ═══════════════════════════════════════════════════════════════════════
   Nothing below here needs editing.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const PLACEHOLDER   = "CONTRACT_ADDRESS_HERE";
  const reduceMotion  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isSet = (v) => typeof v === "string" && v.trim().length > 0;

  const truncate = (addr) =>
    addr.length > 24 ? addr.slice(0, 6) + "…" + addr.slice(-6) : addr;


  /* ── 1 · Ledger fields ──────────────────────────────────────────── */
  const PENDING_LABEL = {
    NETWORK:          "Pending",
    TOTAL_SUPPLY:     "Pending",
    MINT_AUTHORITY:   "Not yet filed",
    FREEZE_AUTHORITY: "Not yet filed"
  };

  $$("[data-field]").forEach((el) => {
    const key = el.getAttribute("data-field");
    const value = CONFIG[key];
    if (isSet(value)) {
      el.textContent = value;
      el.classList.remove("is-pending");
    } else {
      el.textContent = PENDING_LABEL[key] || "Pending";
      el.classList.add("is-pending");
    }
  });


  /* ── 2 · Contract address ───────────────────────────────────────── */
  const address       = isSet(CONFIG.CONTRACT_ADDRESS) ? CONFIG.CONTRACT_ADDRESS.trim() : PLACEHOLDER;
  const addressIsReal = address !== PLACEHOLDER;

  $$("[data-contract-display]").forEach((el) => {
    el.textContent = truncate(address);
    el.setAttribute("title", address);
  });

  const hint = $("[data-contract-hint]");
  if (hint && !addressIsReal) hint.textContent = "Published at launch — placeholder shown.";

  const copyStatus = $("[data-copy-status]");

  function announce(message) {
    if (copyStatus) copyStatus.textContent = message;
  }

  async function copyAddress(button) {
    const label = $(".contract__copy-text", button);
    const original = button.dataset.label || (label ? label.textContent : "Copy");
    button.dataset.label = original;

    function legacyCopy() {
      const ta = document.createElement("textarea");
      ta.value = address;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, address.length);
      let done = false;
      try { done = document.execCommand("copy"); } catch (err) { done = false; }
      document.body.removeChild(ta);
      return done;
    }

    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(address);
        ok = true;
      } catch (err) {
        ok = legacyCopy();
      }
    } else {
      ok = legacyCopy();
    }

    if (label) label.textContent = ok ? "Copied" : "Copy failed";
    button.classList.toggle("is-copied", ok);
    announce(ok ? "Contract address copied to clipboard." : "Could not copy. Select the address manually.");

    clearTimeout(button._resetTimer);
    button._resetTimer = setTimeout(() => {
      if (label) label.textContent = original;
      button.classList.remove("is-copied");
      announce("");
    }, 2200);
  }

  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyAddress(button));
  });


  /* ── 3 · Links: fill, or hide when not configured ───────────────── */
  $$("[data-social]").forEach((el) => {
    const url = CONFIG[el.getAttribute("data-social")];
    if (isSet(url)) {
      el.href = url.trim();
      el.hidden = false;
    } else {
      el.hidden = true;
      el.removeAttribute("href");
    }
  });

  // Explorer link
  const explorer = $("[data-explorer]");
  if (explorer) {
    if (isSet(CONFIG.EXPLORER_URL) && addressIsReal) {
      explorer.href = CONFIG.EXPLORER_URL.trim().replace("{address}", encodeURIComponent(address));
      explorer.hidden = false;
    } else {
      explorer.hidden = true;
      explorer.removeAttribute("href");
    }
  }

  // Collapse the link row if nothing inside it is visible
  const linkRow = $(".contract__links");
  if (linkRow) {
    const anyVisible = $$("a", linkRow).some((a) => !a.hidden);
    linkRow.hidden = !anyVisible;
  }

  // "Channels open at launch." note in the footer
  const socialCol = $("[data-social-col]");
  if (socialCol) {
    const note = $("[data-social-empty]", socialCol);
    const anyVisible = $$("a", socialCol).some((a) => !a.hidden);
    if (note) note.hidden = anyVisible;
  }

  // Buy calls to action
  const buyNote = $("[data-cta-note]");
  $$('[data-cta="buy"]').forEach((el) => {
    if (isSet(CONFIG.BUY_URL)) {
      el.href = CONFIG.BUY_URL.trim();
      el.target = "_blank";
      el.rel = "noopener";
      el.removeAttribute("aria-disabled");
    } else {
      el.removeAttribute("href");
      el.removeAttribute("target");
      el.setAttribute("aria-disabled", "true");
      el.setAttribute("role", "link");
    }
  });
  if (buyNote) {
    buyNote.hidden = isSet(CONFIG.BUY_URL);
    if (!isSet(CONFIG.BUY_URL)) {
      buyNote.textContent = "Not yet listed — the buy link opens at launch.";
    }
  }


  /* ── 4 · Dates ──────────────────────────────────────────────────── */
  const now = new Date();
  const issued = $("[data-issued]");
  if (issued) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    issued.textContent =
      String(now.getDate()).padStart(2, "0") + " " + months[now.getMonth()] + " " + now.getFullYear();
  }
  $$("[data-year]").forEach((el) => { el.textContent = String(now.getFullYear()); });


  /* ── 5 · Masthead: solidify after scroll ────────────────────────── */
  const masthead = $("#masthead");
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      masthead.classList.toggle("is-stuck", window.scrollY > 24);
      ticking = false;
    });
  }
  if (masthead) {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }


  /* ── 6 · Mobile menu ────────────────────────────────────────────── */
  const burger = $("#burger");
  const sheet  = $("#mobile-menu");
  let sheetOpen = false;

  function openSheet() {
    if (!sheet) return;
    sheetOpen = true;
    sheet.hidden = false;
    document.body.classList.add("is-locked");
    burger.setAttribute("aria-expanded", "true");
    void sheet.offsetHeight;                 // force a reflow so the transition runs
    sheet.classList.add("is-open");
    const first = $("a", sheet);
    if (first) first.focus({ preventScroll: true });
  }

  function trapTab(e) {
    if (e.key !== "Tab" || !sheetOpen) return;
    const focusables = $$('a[href], button:not([disabled])', sheet).filter((el) => !el.hidden);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function closeSheet(returnFocus) {
    if (!sheet || !sheetOpen) return;
    sheetOpen = false;
    sheet.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    burger.setAttribute("aria-expanded", "false");
    if (returnFocus) burger.focus({ preventScroll: true });
    const done = () => { if (!sheetOpen) sheet.hidden = true; };
    reduceMotion ? done() : setTimeout(done, 400);
  }

  if (burger && sheet) {
    burger.addEventListener("click", () => (sheetOpen ? closeSheet(true) : openSheet()));
    $$("a", sheet).forEach((a) => a.addEventListener("click", () => closeSheet(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sheetOpen) closeSheet(true);
      trapTab(e);
    });
    window.addEventListener("resize", () => {
      if (sheetOpen && window.innerWidth > 900) closeSheet(false);
    }, { passive: true });
  }


  /* ── 7 · Reveals ────────────────────────────────────────────────── */
  const REVEAL_TARGETS = [
    ".notice__meta", ".letter__head", ".letter__body", ".letter__sign",
    ".define > .shell > .eyebrow", ".entry", ".define__body > p",
    ".record .sechead", ".ledger__row", ".contract", ".risk",
    ".archive .sechead", ".notice-card",
    ".faq .sechead", ".qa",
    ".foot__brand", ".foot__cols"
  ];

  const supportsIO   = "IntersectionObserver" in window;
  const pageHidden   = document.visibilityState === "hidden";
  const animateOK    = supportsIO && !reduceMotion && !pageHidden;

  const revealEls = [];
  REVEAL_TARGETS.forEach((selector) => {
    $$(selector).forEach((el) => { if (revealEls.indexOf(el) === -1) revealEls.push(el); });
  });

  function revealAll() {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  if (animateOK) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

    revealEls.forEach((el, index) => {
      el.classList.add("reveal");
      const sibling = el.previousElementSibling;
      if (sibling && sibling.classList.contains("reveal")) {
        el.style.transitionDelay = Math.min(index % 5, 4) * 70 + "ms";
      }
      observer.observe(el);
    });

    // Safety net: anything already on screen must never stay hidden.
    const sweep = () => {
      revealEls.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.15) el.classList.add("is-in");
      });
    };
    window.addEventListener("load", () => setTimeout(sweep, 300));
    setTimeout(sweep, 2400);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) revealAll();
    });
  }


  /* ── 8 · Stamp & refund ─────────────────────────────────────────── */
  const stamp = $("[data-stamp]");
  if (stamp && animateOK) {
    stamp.classList.add("is-armed");
    let inked = false;
    const ink = () => {
      if (inked) return;
      inked = true;
      stamp.classList.add("is-inked");
    };
    const stampObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setTimeout(ink, 420);
        obs.disconnect();
      });
    }, { threshold: 0.35 });
    stampObserver.observe(stamp.closest("[data-stamp-scope]") || stamp);
    setTimeout(ink, 4000);
  }

  const refund = $("[data-refund]");
  if (refund && animateOK) {
    refund.classList.add("is-armed");
    const refundObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        refund.classList.add("is-in");
        obs.disconnect();
      });
    }, { threshold: 0.3 });
    refundObserver.observe(refund);
    setTimeout(() => refund.classList.add("is-in"), 4000);
  }


  /* ── 9 · Hero opening ───────────────────────────────────────────── */
  if (!reduceMotion && !pageHidden) {
    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }

})();
