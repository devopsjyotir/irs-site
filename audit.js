/* ═══════════════════════════════════════════════════════════════════════
   GET AUDITED — parody notice generator
   ───────────────────────────────────────────────────────────────────────
   Notices are drawn with the Canvas 2D API at 1200 x 1500 @2x. The canvas
   is both the on-screen preview and the exported PNG, so what you see is
   exactly what downloads. All copy lives in audit-data.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $  = (sel, root) => (root || document).querySelector(sel);

  const SITE_URL   = (typeof CONFIG !== "undefined" && CONFIG.SITE_URL) || "";
  const SITE_LABEL = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const ORG        = "Internal Rug Service";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Export geometry. W/H are the drawing coordinate system; SCALE gives a
     2400 x 3000 backing store so the PNG stays sharp on high-DPI screens. */
  const W = 1200, H = 1500, SCALE = 2, PAD = 76;

  const C = {
    navy:      "#0a2a63",
    paper:     "#f4f1ea",
    ink:       "#171a20",
    body:      "#3c3a37",
    dim:       "#67635a",
    red:       "#a4161a",
    rule:      "rgba(23, 26, 32, 0.16)",
    onNavy:    "#f0eee7",
    onNavyDim: "rgba(240, 238, 231, 0.55)"
  };

  const F = {
    display: '"Instrument Serif", "Iowan Old Style", "Times New Roman", serif',
    serif:   '"Newsreader", Georgia, "Times New Roman", serif',
    mono:    '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  };


  /* ── Analytics hooks ─────────────────────────────────────────────────
     No vendor is installed. Each interaction fires a DOM event and lands
     in a queue, so a provider can be attached later without touching this
     file. If Plausible or a GTM dataLayer appears, they are used too. */
  const EVENTS = (window.IRS_EVENTS = window.IRS_EVENTS || []);
  function track(name, detail) {
    const payload = Object.assign({ event: name, at: Date.now() }, detail || {});
    EVENTS.push(payload);
    try {
      if (typeof window.plausible === "function") window.plausible(name, { props: detail || {} });
      if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
      window.dispatchEvent(new CustomEvent("irs:" + name, { detail: payload }));
    } catch (err) { /* analytics must never break the feature */ }
  }


  /* ── Small helpers ───────────────────────────────────────────────────── */
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* Untrusted input: drop control characters, collapse whitespace, clamp. */
  function clean(value, max) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
      .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function caseNumber() {
    const yy = String(new Date().getFullYear()).slice(-2);
    let n = "";
    for (let i = 0; i < 6; i++) n += Math.floor(Math.random() * 10);
    return "IRS-" + yy + "-" + n;
  }

  function issuedDate() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = new Date();
    return String(d.getDate()).padStart(2, "0") + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function fileSafe(name) {
    const slug = String(name).toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    return slug || "TAXPAYER";
  }


  /* ── Canvas text utilities ───────────────────────────────────────────── */

  /* ctx.letterSpacing is not universal yet; fall back to per-glyph drawing. */
  const HAS_TRACKING = (function () {
    try {
      const c = document.createElement("canvas").getContext("2d");
      c.letterSpacing = "2px";
      return c.letterSpacing === "2px";
    } catch (err) { return false; }
  })();

  function tracked(ctx, text, x, y, spacing, align) {
    if (HAS_TRACKING) {
      ctx.letterSpacing = spacing + "px";
      ctx.textAlign = align || "left";
      ctx.fillText(text, x, y);
      ctx.letterSpacing = "0px";
      ctx.textAlign = "left";
      return;
    }
    const chars = Array.from(text);
    let width = 0;
    chars.forEach((ch) => { width += ctx.measureText(ch).width + spacing; });
    width -= spacing;
    let cursor = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
    ctx.textAlign = "left";
    chars.forEach((ch) => {
      ctx.fillText(ch, cursor, y);
      cursor += ctx.measureText(ch).width + spacing;
    });
  }

  function trackedWidth(ctx, text, spacing) {
    if (HAS_TRACKING) {
      ctx.letterSpacing = spacing + "px";
      const w = ctx.measureText(text).width;
      ctx.letterSpacing = "0px";
      return w;
    }
    return Array.from(text).reduce((a, ch) => a + ctx.measureText(ch).width + spacing, 0) - spacing;
  }

  /* Shrink a single line until it fits, then ellipsise as a last resort. */
  function fitLine(ctx, text, maxWidth, family, startSize, minSize, weight) {
    let size = startSize;
    while (size > minSize) {
      ctx.font = (weight || 400) + " " + size + "px " + family;
      if (ctx.measureText(text).width <= maxWidth) return { text: text, size: size };
      size -= 2;
    }
    ctx.font = (weight || 400) + " " + minSize + "px " + family;
    let out = text;
    while (out.length > 4 && ctx.measureText(out + "…").width > maxWidth) out = out.slice(0, -1);
    return { text: out.length < text.length ? out + "…" : out, size: minSize };
  }

  function wrap(ctx, text, maxWidth, maxLines) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
      const next = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = words[i];
        if (lines.length === maxLines) return lines;
      } else {
        line = next;
      }
    }
    if (lines.length < maxLines && line) lines.push(line);
    return lines;
  }

  function rule(ctx, y, x1, x2, color) {
    ctx.strokeStyle = color || C.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y + 0.5);
    ctx.lineTo(x2, y + 0.5);
    ctx.stroke();
  }


  /* ── Assets ──────────────────────────────────────────────────────────── */
  let sealPromise = null;
  function loadSeal() {
    if (sealPromise) return sealPromise;
    sealPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => resolve(null);     // the notice still renders without it
      img.src = "assets/seal-white.png";
    });
    return sealPromise;
  }

  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 100px "Instrument Serif"'),
      document.fonts.load('400 40px "Newsreader"'),
      document.fonts.load('400 20px "IBM Plex Mono"'),
      document.fonts.load('500 20px "IBM Plex Mono"'),
      document.fonts.load('600 20px "IBM Plex Mono"')
    ]).catch(() => {});
  }


  /* ── Paper grain, built once and reused ──────────────────────────────── */
  let grainTile = null;
  function grain() {
    if (grainTile) return grainTile;
    const size = 160;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const img = g.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + Math.random() * 135;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    g.putImageData(img, 0, 0);
    grainTile = c;
    return c;
  }


  /* ── The rubber stamp, built once per notice ─────────────────────────
     Pre-rendered so the ink texture stays fixed while the stamp presses. */
  const STAMP_W = 340, STAMP_H = 168;

  function makeStamp(lines) {
    const c = document.createElement("canvas");
    c.width = STAMP_W * SCALE;
    c.height = STAMP_H * SCALE;
    const g = c.getContext("2d");
    g.scale(SCALE, SCALE);

    g.strokeStyle = C.red;
    g.fillStyle = C.red;
    g.lineWidth = 5;
    g.strokeRect(6, 6, STAMP_W - 12, STAMP_H - 12);
    g.lineWidth = 1.5;
    g.strokeRect(15, 15, STAMP_W - 30, STAMP_H - 30);

    g.textBaseline = "alphabetic";
    g.font = '500 15px ' + F.mono;
    tracked(g, "EXAMINED", STAMP_W / 2, 52, 7, "center");
    g.font = '600 34px ' + F.mono;
    tracked(g, lines[0].toUpperCase(), STAMP_W / 2, 96, 3, "center");
    g.font = '500 20px ' + F.mono;
    tracked(g, lines[1].toUpperCase(), STAMP_W / 2, 128, 4, "center");

    /* Break the ink up so it reads as a stamp, not a border. */
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 340; i++) {
      g.beginPath();
      g.arc(Math.random() * STAMP_W, Math.random() * STAMP_H, Math.random() * 2.1, 0, Math.PI * 2);
      g.fill();
    }
    return c;
  }

  function drawStampOn(ctx, stamp, cx, cy, angle, scale, alpha) {
    const w = STAMP_W * scale, h = STAMP_H * scale;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.globalAlpha = alpha;
    ctx.drawImage(stamp, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.globalAlpha = 1;
  }


  /* ── Draw the whole notice ───────────────────────────────────────────── */
  function drawNotice(ctx, data, seal) {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.textBaseline = "alphabetic";

    const RIGHT = W - PAD;
    const COL   = W - PAD * 2;

    /* Paper ground */
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ctx.createPattern(grain(), "repeat");
    ctx.fillRect(0, 0, W, H);

    /* ── Masthead band ── */
    const BAND = 208;
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, W, BAND);

    let textX = PAD;
    if (seal) {
      const sh = 96, sw = (seal.width / seal.height) * sh;
      ctx.drawImage(seal, PAD, (BAND - sh) / 2, sw, sh);
      textX = PAD + sw + 30;
    }
    ctx.fillStyle = C.onNavy;
    ctx.font = '600 27px ' + F.mono;
    tracked(ctx, ORG.toUpperCase(), textX, 100, 6);
    ctx.fillStyle = C.onNavyDim;
    ctx.font = '400 15px ' + F.mono;
    tracked(ctx, "AUTOMATED EXAMINATION SYSTEM", textX, 133, 4.5);

    /* ── Kicker ── */
    ctx.fillStyle = C.red;
    ctx.font = '500 16px ' + F.mono;
    tracked(ctx, "OFFICIAL NOTICE OF PORTFOLIO EXAMINATION", PAD, BAND + 78, 5);

    /* ── Subject: the hero of the image ── */
    ctx.fillStyle = C.ink;
    const subject = fitLine(ctx, data.subject, COL, F.display, 122, 46);
    ctx.font = "400 " + subject.size + "px " + F.display;
    ctx.fillText(subject.text, PAD, BAND + 214);

    rule(ctx, BAND + 262, PAD, RIGHT);

    /* ── Metadata, two columns ── */
    const meta = [
      ["Case no.", data.caseNo],
      ["Filing status", data.filingStatus],
      ["Date issued", data.issued],
      data.extra ? [data.extra.label, data.extra.value] : ["Tax year", "Perpetual"]
    ];
    const colX = [PAD, PAD + COL / 2 + 16];
    meta.forEach((row, i) => {
      const x = colX[i % 2];
      const y = BAND + 322 + Math.floor(i / 2) * 92;
      ctx.fillStyle = C.dim;
      ctx.font = '400 14px ' + F.mono;
      tracked(ctx, row[0].toUpperCase(), x, y, 4);
      ctx.fillStyle = C.ink;
      const v = fitLine(ctx, row[1], COL / 2 - 24, F.mono, 23, 13, 500);
      ctx.font = "500 " + v.size + "px " + F.mono;
      ctx.fillText(v.text, x, y + 34);
    });

    rule(ctx, BAND + 478, PAD, RIGHT);

    /* ── Reason ── */
    ctx.fillStyle = C.dim;
    ctx.font = '400 14px ' + F.mono;
    tracked(ctx, "REASON FOR EXAMINATION", PAD, BAND + 530, 4);
    ctx.fillStyle = C.ink;
    const reason = fitLine(ctx, data.reason, COL, F.display, 62, 34);
    ctx.font = "400 " + reason.size + "px " + F.display;
    ctx.fillText(reason.text, PAD, BAND + 596);

    /* ── Finding ── */
    ctx.fillStyle = C.body;
    ctx.font = '400 29px ' + F.serif;
    const findingLines = wrap(ctx, data.finding, COL - 280, 3);
    findingLines.forEach((line, i) => ctx.fillText(line, PAD, BAND + 672 + i * 44));

    if (data.flag) {
      ctx.fillStyle = C.red;
      ctx.font = '500 15px ' + F.mono;
      tracked(ctx, data.flag.toUpperCase(), PAD, BAND + 672 + findingLines.length * 44 + 22, 4.5);
    }

    /* ── Case status + stamp ── */
    rule(ctx, BAND + 820, PAD, RIGHT);
    ctx.fillStyle = C.dim;
    ctx.font = '400 14px ' + F.mono;
    tracked(ctx, "CASE STATUS", PAD, BAND + 872, 4);
    ctx.fillStyle = C.ink;
    const status = fitLine(ctx, data.status, COL - 300, F.display, 72, 30);
    ctx.font = "400 " + status.size + "px " + F.display;
    ctx.fillText(status.text, PAD, BAND + 950);

    /* ── Parody line, then the footer band ── */
    const FOOT = 108;
    ctx.fillStyle = C.dim;
    ctx.font = '400 15px ' + F.mono;
    tracked(ctx, "PARODY — NOT A GOVERNMENT DOCUMENT.", PAD, H - FOOT - 62, 3.5);
    tracked(ctx, "NOT AFFILIATED WITH ANY GOVERNMENT AGENCY.", PAD, H - FOOT - 34, 3.5);

    ctx.fillStyle = C.navy;
    ctx.fillRect(0, H - FOOT, W, FOOT);
    ctx.fillStyle = C.onNavy;
    ctx.font = '600 24px ' + F.mono;
    tracked(ctx, "$IRS", PAD, H - FOOT + 64, 5);
    const tagX = PAD + trackedWidth(ctx, "$IRS", 5) + 56;
    ctx.fillStyle = C.onNavyDim;
    ctx.font = '400 17px ' + F.mono;
    tracked(ctx, "I RUGGED SUCCESSFULLY", tagX, H - FOOT + 64, 4);
    if (SITE_LABEL) {
      ctx.font = '400 17px ' + F.mono;
      tracked(ctx, SITE_LABEL.toUpperCase(), RIGHT, H - FOOT + 64, 3.5, "right");
    }
  }


  /* ── Compose base + stamp; animate the stamp landing ─────────────────
     Every frame ends with the stamp at full size, so the exported PNG is
     always the finished notice regardless of when the user hits download. */
  const STAMP_X = W - 248, STAMP_Y = 208 + 876;

  function renderNotice(canvas, data, seal, animate) {
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");

    const base = document.createElement("canvas");
    base.width  = W * SCALE;
    base.height = H * SCALE;
    drawNotice(base.getContext("2d"), data, seal);

    const stamp = makeStamp(data.stamp);

    function paint(scale, alpha) {
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      drawStampOn(ctx, stamp, STAMP_X, STAMP_Y, data.stampAngle, scale, alpha);
    }

    if (!animate || reduceMotion) {
      paint(1, 0.92);
      return Promise.resolve();
    }

    /* A stamp pressing down: oversized and faint, settling to its mark. */
    const DURATION = 260, DELAY = 200;
    return new Promise((resolve) => {
      paint(1, 0);
      setTimeout(() => {
        const start = performance.now();
        (function frame(now) {
          const t = Math.min(1, (now - start) / DURATION);
          const eased = 1 - Math.pow(1 - t, 3);
          paint(1.34 - 0.34 * eased, 0.92 * Math.min(1, eased * 1.8));
          if (t < 1) requestAnimationFrame(frame);
          else { paint(1, 0.92); resolve(); }
        })(performance.now());
      }, DELAY);
    });
  }


  /* ── Build notice data from the form ─────────────────────────────────── */
  function buildNotice(input) {
    const reason = AUDIT_COPY.reasons.find((r) => r.id === input.reasonId) || AUDIT_COPY.reasons[0];

    const subject = clean(input.subject, 28) || "Anonymous taxpayer";
    const bare  = subject.replace(/^@+/, "");
    const lower = bare.toLowerCase();

    let filingStatus = input.filingStatus || pick(AUDIT_COPY.filingStatuses);
    let status = reason.status;
    let stamp  = reason.stamp.slice();
    let flag   = "";

    /* Quiet easter eggs. Undocumented on purpose. */
    if (lower === "satoshi" || lower === "satoshinakamoto") {
      filingStatus = "Identity verification failed";
    }
    if (/irs/i.test(bare)) {
      status = "Conflict of interest detected";
      stamp  = ["Conflict", "Of interest"];
    }
    const extraValue = clean(input.extra, 28);
    if (/^\$?\s*420\.69$/.test(extraValue)) {
      flag = "Manual review required";
    }

    return {
      subject: subject,
      reason: reason.label,
      reasonId: reason.id,
      finding: pick(reason.findings),
      caseNo: caseNumber(),
      issued: issuedDate(),
      filingStatus: filingStatus,
      status: status,
      stamp: stamp,
      stampAngle: -4 + Math.random() * 2.4,
      flag: flag,
      extra: extraValue
        ? { label: input.extraLabel || "Additional evidence", value: extraValue }
        : null
    };
  }


  /* ── Page wiring ─────────────────────────────────────────────────────── */
  const form = $("#auditForm");
  if (!form) return;

  const subjectEl  = $("#subject");
  const extraEl    = $("#extra");
  const extraLabel = $("#extraLabel");
  const stageForm  = $('[data-stage="form"]');
  const stageBusy  = $('[data-stage="busy"]');
  const stageDone  = $('[data-stage="result"]');
  const canvas     = $("#noticeCanvas");
  const srSummary  = $("#noticeSummary");
  const captionEl  = $("#captionText");
  const lightbox   = $("#lightbox");
  const lightImg   = $("#lightboxImage");
  const reasonList = $("#reasonList");

  let current = null;
  let currentBlob = null;
  let started = false;

  /* Build the schedule of reasons from data — textContent only, never HTML. */
  AUDIT_COPY.reasons.forEach((r, i) => {
    const id = "reason-" + r.id;

    const row = document.createElement("label");
    row.className = "schedule__row";
    row.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "reason";
    input.value = r.id;
    input.id = id;
    input.className = "schedule__input";
    if (i === 0) input.checked = true;

    const num = document.createElement("span");
    num.className = "schedule__num";
    num.setAttribute("aria-hidden", "true");
    num.textContent = String(i + 1).padStart(2, "0");

    const text = document.createElement("span");
    text.className = "schedule__label";
    text.textContent = r.label;

    row.append(input, num, text);
    reasonList.appendChild(row);
  });

  function selectedReason() {
    const checked = $('input[name="reason"]:checked', reasonList);
    return AUDIT_COPY.reasons.find((r) => r.id === (checked && checked.value)) || AUDIT_COPY.reasons[0];
  }

  function syncExtraField() {
    const r = selectedReason();
    extraLabel.textContent = r.field.label;
    extraEl.placeholder = r.field.placeholder;
  }

  function markStarted() {
    if (started) return;
    started = true;
    track("audit_started");
  }

  reasonList.addEventListener("change", () => { syncExtraField(); markStarted(); });
  subjectEl.addEventListener("input", markStarted, { once: true });
  syncExtraField();

  function showStage(name) {
    stageForm.hidden = name !== "form";
    stageBusy.hidden = name !== "busy";
    stageDone.hidden = name !== "result";
  }

  async function generate(data) {
    const seal = await loadSeal();
    await loadFonts();
    current = data;
    currentBlob = null;
    const painted = renderNotice(canvas, data, seal, true);

    canvas.setAttribute("aria-label",
      "Parody notice of portfolio examination for " + data.subject +
      ". Reason: " + data.reason + ". Case status: " + data.status + ".");

    srSummary.textContent =
      ORG + " notice of portfolio examination. Subject: " + data.subject +
      ". Case number " + data.caseNo + ". Filing status: " + data.filingStatus +
      ". Reason for examination: " + data.reason + ". Finding: " + data.finding +
      " Case status: " + data.status + ". Parody, not a government document.";

    captionEl.value = pick(AUDIT_COPY.captions) + "\n\n$IRS" + (SITE_LABEL ? "\n" + SITE_LABEL : "");
    captionEl.style.height = "auto";
    captionEl.style.height = captionEl.scrollHeight + "px";   // never clip the last line

    showStage("result");
    stageDone.focus({ preventScroll: true });
    stageDone.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    track("audit_generated", { reason: data.reasonId });
    await painted;                       // export waits for the stamp to land
  }

  async function run(data) {
    showStage("busy");
    const wait = reduceMotion ? 0 : 700 + Math.random() * 400;
    await new Promise((r) => setTimeout(r, wait));
    await generate(data);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = selectedReason();
    run(buildNotice({
      subject: subjectEl.value,
      reasonId: r.id,
      extra: extraEl.value,
      extraLabel: r.field.label
    }));
  });

  $("#randomAudit").addEventListener("click", () => {
    markStarted();
    const r = pick(AUDIT_COPY.reasons);
    const extra = pick(AUDIT_COPY.randomExtras);
    run(buildNotice({
      subject: pick(AUDIT_COPY.randomSubjects),
      reasonId: r.id,
      extra: extra.value,
      extraLabel: extra.label,
      filingStatus: pick(AUDIT_COPY.filingStatuses)
    }));
  });


  /* ── Export ──────────────────────────────────────────────────────────── */
  function toBlob() {
    if (!current) return Promise.resolve(null);
    if (currentBlob) return Promise.resolve(currentBlob);
    return new Promise((resolve) => {
      canvas.toBlob((b) => { currentBlob = b; resolve(b); }, "image/png");
    });
  }

  const filename = () => "IRS-AUDIT-" + fileSafe(current ? current.subject : "") + ".png";

  $("#downloadNotice").addEventListener("click", async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    if ("download" in a) {
      a.href = url;
      a.download = filename();
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.open(url, "_blank");   // iOS Safari: opens for press-and-hold save
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    track("audit_downloaded", { reason: current && current.reasonId });
  });

  /* Native share sheet — the only route that can attach the image itself. */
  const shareBtn = $("#shareNotice");
  const canShareFiles = (function () {
    try {
      return !!(navigator.canShare && navigator.share &&
        navigator.canShare({ files: [new File([new Blob()], "t.png", { type: "image/png" })] }));
    } catch (err) { return false; }
  })();
  if (!canShareFiles) {
    shareBtn.hidden = true;
  } else {
    shareBtn.addEventListener("click", async () => {
      const blob = await toBlob();
      if (!blob) return;
      const file = new File([blob], filename(), { type: "image/png" });
      try {
        await navigator.share({ files: [file], text: captionEl.value });
        track("audit_shared", { via: "web-share", reason: current && current.reasonId });
      } catch (err) { /* the user dismissed the sheet */ }
    });
  }

  const copyBtn = $("#copyCaption");
  copyBtn.addEventListener("click", async () => {
    const label = $(".textbtn__text", copyBtn);
    const original = copyBtn.dataset.label || label.textContent;
    copyBtn.dataset.label = original;

    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(captionEl.value);
        ok = true;
      } else {
        throw new Error("fallback");
      }
    } catch (err) {
      captionEl.removeAttribute("readonly");
      captionEl.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      captionEl.setAttribute("readonly", "");
    }

    label.textContent = ok ? "Copied" : "Copy failed";
    copyBtn.classList.toggle("is-copied", ok);
    $("#shareStatus").textContent = ok
      ? "Caption copied to clipboard."
      : "Could not copy — select the text manually.";

    clearTimeout(copyBtn._t);
    copyBtn._t = setTimeout(() => {
      label.textContent = original;
      copyBtn.classList.remove("is-copied");
      $("#shareStatus").textContent = "";
    }, 2200);

    if (ok) track("audit_shared", { via: "clipboard" });
  });

  $("#postOnX").addEventListener("click", () => {
    window.open("https://x.com/intent/post?text=" + encodeURIComponent(captionEl.value),
                "_blank", "noopener");
    track("audit_x_clicked", { reason: current && current.reasonId });
  });

  $("#resetAudit").addEventListener("click", () => {
    showStage("form");
    subjectEl.value = "";
    extraEl.value = "";
    current = null;
    currentBlob = null;
    subjectEl.focus({ preventScroll: true });
    stageForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    track("audit_reset");
  });


  /* ── Tap the notice to view it larger ────────────────────────────────── */
  async function openLightbox() {
    const blob = await toBlob();
    if (!blob) return;
    lightImg.src = URL.createObjectURL(blob);
    lightbox.hidden = false;
    void lightbox.offsetWidth;
    lightbox.classList.add("is-open");
    document.body.classList.add("is-locked");
    $("#lightboxClose").focus({ preventScroll: true });
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    const done = () => {
      lightbox.hidden = true;
      if (lightImg.src && lightImg.src.indexOf("blob:") === 0) URL.revokeObjectURL(lightImg.src);
      lightImg.removeAttribute("src");
    };
    reduceMotion ? done() : setTimeout(done, 300);
  }

  canvas.addEventListener("click", openLightbox);
  $("#lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });


  /* Deep link: /audit?r=buying-the-top preselects a reason. */
  const wanted = new URLSearchParams(location.search).get("r");
  if (wanted && window.CSS && CSS.escape) {
    const radio = $('input[name="reason"][value="' + CSS.escape(wanted) + '"]', reasonList);
    if (radio) { radio.checked = true; syncExtraField(); }
  }
})();
