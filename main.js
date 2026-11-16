/* ═══════════════════════════════════════════════════════════════
   جشنواره بین‌المللی خوارزمی — موتور اجرا
   صحنه‌های اسنپ، ظهور عناصر، اسلایدر، شمارشگر، پخش‌کننده و …
   ═══════════════════════════════════════════════════════════════ */
(() => {
"use strict";

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const VP = $("#viewport");
const RM   = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(pointer: fine)").matches;
const D    = window.KHA;
const INT  = D.config.heroInterval || 6500;
const DEADLINE = new Date(D.config.deadline).getTime();
const REGSTART = new Date(D.config.regStart).getTime();
const FA = "۰۱۲۳۴۵۶۷۸۹";
const faNum = v => String(v).replace(/\d/g, d => FA[d]);
const fmt = new Intl.NumberFormat("fa-IR");
const header = $("#siteHeader");
const scenes = $$(".scene");

/* جایگزین خودکار تصاویرِ بارگذاری‌نشده */
window.addEventListener("error", e => {
  const t = e.target;
  if (t && t.tagName === "IMG" && !t.dataset.fb) {
    t.dataset.fb = "1";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="400" y="310" font-family="Tahoma" font-size="34" fill="#6366f1" text-anchor="middle">جشنواره خوارزمی</text></svg>';
    t.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
}, true);

/* ── ناوبری عمومی ── */
function goto(sel) {
  const el = $(sel);
  if (el) el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
}
document.addEventListener("click", e => {
  const a = e.target.closest("[data-nav]");
  if (a) { e.preventDefault(); goto(a.dataset.nav); }
});

/* ── سیستم ظهور ── */
const rio = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    rio.unobserve(el);
    el.classList.add("rv-in");
    const done = () => { el.classList.remove("rv-in"); el.classList.add("rv-done"); };
    const h = ev => { if (ev.target !== el) return; el.removeEventListener("animationend", h); done(); };
    el.addEventListener("animationend", h);
    setTimeout(() => { if (el.classList.contains("rv-in")) done(); }, 1800 + (+el.dataset.d || 0) * 95);
  });
}, { root: VP, threshold: 0.18 });

function bindReveals(scope) {
  $$("[data-rv]", scope).forEach(el => {
    if (el.dataset.rvBound) return;
    el.dataset.rvBound = "1";
    if (RM) { el.classList.add("rv-done"); return; }
    el.style.setProperty("--d", el.dataset.d || "0");
    rio.observe(el);
  });
}

/* ── صحنه فعال ── */
let dots = [];
function setActive(sec) {
  scenes.forEach(s => s.classList.toggle("is-live", s === sec));
  sec.classList.add("seen");
  header.classList.toggle("on-dark", sec.dataset.header === "dark");
  dots.forEach(d => d.classList.toggle("active", d.dataset.target === "#" + sec.id));
  if (sec.id === "impact") runCounters();
}
const sio = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) setActive(en.target); });
}, { root: VP, rootMargin: "-45% 0px -45% 0px", threshold: 0 });

/* ── هدر / پیشرفت / بازگشت به بالا ── */
const toTop = $("#toTop"), progress = $("#scrollProgress");
function onScroll() {
  const y = VP.scrollTop;
  header.classList.toggle("scrolled", y > 30);
  const max = VP.scrollHeight - VP.clientHeight;
  progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  toTop.classList.toggle("show", y > innerHeight * 0.8);
}
VP.addEventListener("scroll", onScroll, { passive: true });
toTop.addEventListener("click", () => VP.scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }));

/* ── منوی همبرگری ── */
const menu = $("#menuOverlay"), btnMenu = $("#btnMenu");
function renderMenu() {
  $("#menuNav").innerHTML = scenes.map((s, i) =>
    `<li style="--d:${i}"><a href="#${s.id}" data-nav="#${s.id}"><span class="mn-num">${faNum(String(i + 1).padStart(2, "0"))}</span><span class="mn-txt">${s.dataset.title}</span><i class="bi bi-arrow-left"></i></a></li>`
  ).join("");
}
function openMenu() {
  menu.hidden = false;
  requestAnimationFrame(() => menu.classList.add("open"));
  btnMenu.classList.add("open");
  btnMenu.setAttribute("aria-expanded", "true");
  VP.style.overflow = "hidden";
}
function closeMenu() {
  menu.classList.remove("open");
  btnMenu.classList.remove("open");
  btnMenu.setAttribute("aria-expanded", "false");
  VP.style.overflow = "";
  setTimeout(() => { menu.hidden = true; }, 420);
}
btnMenu.addEventListener("click", () => menu.hidden ? openMenu() : closeMenu());
$("#menuClose").addEventListener("click", closeMenu);
$("#menuNav").addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });

/* ── جست‌وجو ── */
const searchOv = $("#searchOverlay"), searchInput = $("#searchInput"), searchRes = $("#searchResults");
let searchIndex = [];
function buildSearchIndex() {
  searchIndex = scenes.map(s => ({ t: s.dataset.title, k: "بخش", target: "#" + s.id }))
    .concat(D.news.map(n => ({ t: n.title, k: "خبر", target: "#news" })))
    .concat(D.faqs.map(f => ({ t: f.q, k: "پرسش", target: "#faq" })))
    .concat(D.projects.map(p => ({ t: p.title, k: "طرح", target: "#projects" })));
}
const norm = s => s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\u200c/g, " ").trim().toLowerCase();
function doSearch() {
  const q = norm(searchInput.value);
  if (q.length < 2) { searchRes.innerHTML = ""; return; }
  const hits = searchIndex.filter(r => norm(r.t).includes(q)).slice(0, 8);
  searchRes.innerHTML = hits.length
    ? hits.map(r => `<li><button data-target="${r.target}"><span>${r.t}</span><span class="sr-k">${r.k}</span></button></li>`).join("")
    : '<li class="sr-empty">موردی یافت نشد؛ عبارت دیگری را امتحان کنید.</li>';
}
function openSearch() {
  searchOv.hidden = false;
  requestAnimationFrame(() => searchOv.classList.add("open"));
  VP.style.overflow = "hidden";
  setTimeout(() => searchInput.focus(), 120);
}
function closeSearch() {
  searchOv.classList.remove("open");
  VP.style.overflow = "";
  setTimeout(() => { searchOv.hidden = true; }, 420);
}
$("#btnSearch").addEventListener("click", openSearch);
$("#searchClose").addEventListener("click", closeSearch);
searchInput.addEventListener("input", doSearch);
$$(".search-hints button").forEach(b => b.addEventListener("click", () => { searchInput.value = b.dataset.q; doSearch(); searchInput.focus(); }));
searchRes.addEventListener("click", e => {
  const b = e.target.closest("button[data-target]");
  if (b) { closeSearch(); goto(b.dataset.target); }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!menu.hidden) closeMenu(); if (!searchOv.hidden) closeSearch(); }
});

/* ── نقطه‌های ناوبری ── */
function renderDots() {
  $("#dotsNav").innerHTML = scenes.map(s =>
    `<button class="dot" data-target="#${s.id}" aria-label="${s.dataset.title}"><span class="lbl">${s.dataset.title}</span></button>`
  ).join("");
  dots = $$("#dotsNav .dot");
  dots.forEach(d => d.addEventListener("click", () => goto(d.dataset.target)));
}

/* ── هیرو: اسلایدر سینمایی بدون متن ── */
const slider = $("#heroSlider"), heroSec = $("#hero"), heroDotsWrap = $("#heroDots");
let hslides = [], hdots = [], cur = 0, hTimer = null, hStarted = false, hCleanup = null;
function mediaFor(s, i) {
  if (s.type === "video") return `<video src="${s.src}" poster="${s.poster || ""}" autoplay muted loop playsinline preload="metadata"></video>`;
  const load = i === 0 ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${s.src}" alt="${s.alt || ""}" ${load} decoding="async">`;
}
function renderHero() {
  slider.innerHTML = D.slides.map((s, i) => `<div class="hslide${i === 0 ? " is-active" : ""}">${mediaFor(s, i)}</div>`).join("");
  heroDotsWrap.innerHTML = D.slides.map((s, i) =>
    `<button class="hdot${i === 0 ? " on" : ""}" role="tab" aria-label="اسلاید ${faNum(i + 1)}" style="--int:${INT}ms"><i></i></button>`
  ).join("");
  hslides = $$(".hslide", slider);
  hdots = $$(".hdot", heroDotsWrap);
  hdots.forEach((d, i) => d.addEventListener("click", () => hGo(i, i > cur ? 1 : -1)));
}
function hGo(n, dir) {
  const next = (n + hslides.length) % hslides.length;
  if (next === cur) return;
  if (hCleanup) { clearTimeout(hCleanup.t); hCleanup.el.classList.remove("is-active", "under"); hCleanup = null; }
  slider.classList.toggle("alt", dir < 0);
  const prev = cur;
  cur = next;
  const ps = hslides[prev], ns = hslides[cur];
  ps.classList.add("under");
  ns.classList.remove("is-active", "under");
  void ns.offsetWidth;
  ns.classList.add("is-active");
  hCleanup = { el: ps, t: setTimeout(() => { ps.classList.remove("is-active", "under"); hCleanup = null; }, 1300) };
  hdots.forEach((d, i) => {
    d.classList.remove("on");
    if (i === cur) { void d.offsetWidth; d.classList.add("on"); }
  });
  hSchedule();
}
function hSchedule() {
  clearTimeout(hTimer);
  if (hStarted && !document.hidden) hTimer = setTimeout(() => hGo(cur + 1, 1), INT);
}
function heroStart() {
  if (hStarted) return;
  hStarted = true;
  const d = hdots[0];
  if (d) { d.classList.remove("on"); void d.offsetWidth; d.classList.add("on"); }
  hSchedule();
}
$(".hero-prev").addEventListener("click", () => hGo(cur - 1, -1));
$(".hero-next").addEventListener("click", () => hGo(cur + 1, 1));
document.addEventListener("visibilitychange", () => {
  heroSec.classList.toggle("paused", document.hidden);
  if (document.hidden) clearTimeout(hTimer); else hSchedule();
});
let swX = 0, swY = 0;
heroSec.addEventListener("pointerdown", e => { swX = e.clientX; swY = e.clientY; });
heroSec.addEventListener("pointerup", e => {
  if (e.target.closest("button")) return;
  const dx = e.clientX - swX, dy = e.clientY - swY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) hGo(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
});

/* ── درباره: پارالاکس لایه‌ها ── */
function initParallax() {
  if (!FINE || RM) return;
  const sec = $("#about"), layers = $$("#aboutVis [data-depth]");
  sec.addEventListener("mousemove", e => {
    const r = sec.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach(l => {
      const d = +l.dataset.depth;
      l.style.transform = `translate3d(${(-dx * d).toFixed(1)}px, ${(-dy * d).toFixed(1)}px, 0)`;
    });
  });
  sec.addEventListener("mouseleave", () => layers.forEach(l => { l.style.transform = ""; }));
}

/* ── تیلت سه‌بعدی ── */
function bindTilt(scope) {
  if (!FINE || RM) return;
  $$("[data-tilt]", scope).forEach(el => {
    if (el._tilt) return;
    el._tilt = 1;
    el.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse" || $("#winRail").classList.contains("dragging")) return;
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
      el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

/* ── برگزیدگان ── */
const rail = $("#winRail"), wtInd = $("#wtInd");
function winnerCard(w, i) {
  return `<article class="wcard" style="--d:${i}"><div class="wcard-in" data-tilt><div class="wframe"><img src="${w.img}" alt="${w.name}" loading="lazy" decoding="async"><div class="wover"><p>${w.work}</p><span class="wlink">مشاهده پروفایل <i class="bi bi-arrow-left"></i></span></div></div><div class="wmeta"><span class="wperiod">${w.period}</span><h3>${w.name}</h3><span class="wfield">${w.field}</span></div></div></article>`;
}
function renderWinners(g) {
  rail.innerHTML = D.winners[g].map(winnerCard).join("");
  rail.scrollLeft = 0;
  bindTilt(rail);
}
function moveInd(btn) {
  if (!btn) return;
  const tabs = btn.parentElement;
  wtInd.style.width = btn.offsetWidth + "px";
  wtInd.style.right = (tabs.clientWidth - btn.offsetLeft - btn.offsetWidth) + "px";
}
function initWinners() {
  renderWinners("main");
  let swapT = null;
  $$(".wtab").forEach(b => b.addEventListener("click", () => {
    $$(".wtab").forEach(x => { x.classList.remove("active"); x.setAttribute("aria-selected", "false"); });
    b.classList.add("active");
    b.setAttribute("aria-selected", "true");
    moveInd(b);
    rail.classList.add("swap");
    clearTimeout(swapT);
    swapT = setTimeout(() => { renderWinners(b.dataset.g); rail.classList.remove("swap"); }, 260);
  }));
  let down = false, sx = 0, sl = 0, moved = 0;
  rail.addEventListener("pointerdown", e => {
    down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft;
    rail.classList.add("dragging");
    rail.setPointerCapture(e.pointerId);
  });
  rail.addEventListener("pointermove", e => {
    if (!down) return;
    const dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    rail.scrollLeft = sl - dx;
  });
  ["pointerup", "pointercancel"].forEach(ev => rail.addEventListener(ev, () => { down = false; rail.classList.remove("dragging"); }));
  rail.addEventListener("click", e => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  const step = () => (rail.querySelector(".wcard") ? rail.querySelector(".wcard").offsetWidth + 26 : 280);
  $(".rail-prev").addEventListener("click", () => rail.scrollBy({ left: step(), behavior: RM ? "auto" : "smooth" }));
  $(".rail-next").addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: RM ? "auto" : "smooth" }));
}

/* ── مودال جزئیات ── */
function openDetail(o) {
  $("#dImg").src = o.img;
  $("#dImg").alt = o.title;
  $("#dChip").textContent = o.chip;
  $("#dTitle").textContent = o.title;
  $("#dMeta").textContent = o.meta;
  $("#dDesc").textContent = o.desc;
  if (window.bootstrap) bootstrap.Modal.getOrCreateInstance($("#detailModal")).show();
}

/* ── طرح‌ها ── */
function projCard(p, i) {
  const flag = p.slot === "a" ? '<span class="pflag"><i class="bi bi-award"></i> طرح شاخص</span>' : "";
  return `<article class="pcard p-${p.slot}" data-rv="mask" data-d="${i}" data-idx="${i}" tabindex="0" role="button" aria-label="${p.title}">${flag}<div class="pimg"><img src="${p.img}" alt="${p.title}" loading="lazy" decoding="async"></div><span class="parrow"><i class="bi bi-arrow-up-left"></i></span><div class="pinfo"><span class="pchip">${p.field}</span><h3>${p.title}</h3><p class="powners">${p.owners}</p><p class="pdesc">${p.desc}</p></div></article>`;
}
function renderProjects() {
  const grid = $("#projGrid");
  grid.innerHTML = D.projects.map(projCard).join("");
  const open = c => {
    const p = D.projects[+c.dataset.idx];
    openDetail({ img: p.img, chip: p.field, title: p.title, meta: p.owners, desc: p.desc });
  };
  grid.addEventListener("click", e => { const c = e.target.closest(".pcard"); if (c) open(c); });
  grid.addEventListener("keydown", e => {
    const c = e.target.closest(".pcard");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(c); }
  });
}

/* ── مسیر زمانی ── */
function renderTimeline() {
  $("#tNodes").innerHTML = D.stages.map((s, i) => {
    const up = s.y > 50 ? " up" : "";
    const ic = s.state === "done" ? '<i class="bi bi-check-lg"></i>' : "";
    const st = s.state === "active" ? '<span class="t-state">در حال انجام</span>' : "";
    return `<div class="t-node ${s.state}${up}" style="--x:${s.x}%;--y:${s.y}%;--d:${i}"><span class="t-dot">${ic}</span><div class="t-card"><b>${s.title}</b><span>${s.date}</span><small>${s.desc}</small>${st}</div></div>`;
  }).join("");
}
function sizeTimeline() {
  const wrap = $("#tWrap"), stage = $("#tStage");
  if (!wrap || !stage) return;
  if (matchMedia("(min-width: 992px)").matches) {
    const s = wrap.clientWidth / 1200;
    stage.style.setProperty("--s", s);
    wrap.style.height = Math.round(320 * s) + "px";
  } else {
    stage.style.removeProperty("--s");
    wrap.style.height = "";
  }
}

/* ── پرسش‌های متداول ── */
function renderFaq() {
  const list = $("#faqList");
  list.innerHTML = D.faqs.map((f, i) =>
    `<div class="faq-item${i === 0 ? " open" : ""}" data-cat="${f.cat}" data-rv="up" data-d="${i}"><button class="faq-q" aria-expanded="${i === 0}"><span class="fq-num">${faNum(String(i + 1).padStart(2, "0"))}</span><span class="fq-txt">${f.q}</span><span class="fq-ic"></span></button><div class="faq-a"><div class="faq-a-in"><p>${f.a}</p></div></div></div>`
  ).join("");
  list.addEventListener("click", e => {
    const q = e.target.closest(".faq-q");
    if (!q) return;
    const item = q.parentElement;
    const wasOpen = item.classList.contains("open");
    $$(".faq-item.open", list).forEach(o => { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); });
    if (!wasOpen) { item.classList.add("open"); q.setAttribute("aria-expanded", "true"); }
  });
  $$(".fchip").forEach(ch => ch.addEventListener("click", () => {
    $$(".fchip").forEach(x => x.classList.remove("active"));
    ch.classList.add("active");
    const cat = ch.dataset.cat;
    $$(".faq-item", list).forEach(it => it.classList.toggle("d-none", cat !== "all" && it.dataset.cat !== cat));
    $$(".faq-item.open", list).forEach(o => o.classList.remove("open"));
    const first = $(".faq-item:not(.d-none)", list);
    if (first) { first.classList.add("open"); $(".faq-q", first).setAttribute("aria-expanded", "true"); }
  }));
}

/* ── شمارش معکوس: ارقام غلتان ── */
function setCell(cell, ch) {
  const curSpan = cell.firstElementChild;
  if (curSpan && curSpan.textContent === ch) return;
  const n = document.createElement("span");
  n.textContent = ch;
  n.className = "pre";
  cell.appendChild(n);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    n.classList.remove("pre");
    if (curSpan) { curSpan.classList.add("out"); setTimeout(() => curSpan.remove(), 550); }
  }));
}
function setUnit(sel, val) {
  const box = $(sel);
  const str = faNum(String(val).padStart(2, "0"));
  while (box.children.length < str.length) {
    const d = document.createElement("span");
    d.className = "digit";
    box.appendChild(d);
  }
  while (box.children.length > str.length) box.lastElementChild.remove();
  Array.from(str).forEach((ch, i) => setCell(box.children[i], ch));
}
function initCountdown() {
  $("#cdLabel").textContent = D.config.deadlineLabel;
  let cdTimer = null;
  const tick = () => {
    let diff = DEADLINE - Date.now();
    if (diff <= 0) { diff = 0; $("#deadline").classList.add("ended"); if (cdTimer) clearInterval(cdTimer); }
    setUnit("#cdD", Math.floor(diff / 864e5));
    setUnit("#cdH", Math.floor(diff / 36e5) % 24);
    setUnit("#cdM", Math.floor(diff / 6e4) % 60);
    setUnit("#cdS", Math.floor(diff / 1e3) % 60);
  };
  tick();
  cdTimer = setInterval(tick, 1000);
}

/* ── اخبار ── */
function newsItem(n, i) {
  return `<article class="n-item" data-rv="start" data-d="${i + 1}" data-idx="${i + 1}" tabindex="0" role="button"><div class="ni-img"><img src="${n.img}" alt="${n.title}" loading="lazy" decoding="async"></div><div class="ni-body"><h4>${n.title}</h4><span><i class="bi bi-clock"></i>${n.date} · ${n.cat}</span></div></article>`;
}
function renderNews() {
  const f = D.news[0], rest = D.news.slice(1, 4);
  const feature = `<article class="n-feature" data-rv="mask" data-idx="0" tabindex="0" role="button"><div class="nf-img"><img src="${f.img}" alt="${f.title}" loading="lazy" decoding="async"><span class="nf-date"><i class="bi bi-calendar-event"></i> ${f.date}</span></div><div class="nf-body"><span class="nchip">${f.cat}</span><h3>${f.title}</h3><p>${f.excerpt}</p></div></article>`;
  const side = rest.map(newsItem).join("");
  const grid = $("#newsGrid");
  grid.innerHTML = feature + `<div class="n-side">${side}</div>`;
  const open = c => {
    const n = D.news[+c.dataset.idx];
    openDetail({ img: n.img, chip: n.cat, title: n.title, meta: n.date, desc: n.body || n.excerpt });
  };
  grid.addEventListener("click", e => { const c = e.target.closest("[data-idx]"); if (c) open(c); });
  grid.addEventListener("keydown", e => {
    const c = e.target.closest("[data-idx]");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(c); }
  });
  const tk = D.ticker.map(t => `<span class="tk-item">${t}</span>`).join("");
  $("#tickerTrack").innerHTML = tk + tk;
}

/* ── فراخوان‌ها ── */
function callCard(c, i) {
  const ic = c.status === "soon" ? "bi-clock-history" : "bi-check-circle";
  const st = c.status === "soon" ? "st-soon" : "st-closed";
  return `<article class="cs-card ${c.status}" data-rv="end" data-d="${i + 1}"><span class="cs-ic"><i class="bi ${ic}"></i></span><div class="cs-body"><h4>${c.title}</h4><p>${c.desc}</p><span class="tk-status ${st}"><i></i>${c.label}</span> <span class="cs-meta"><i class="bi bi-calendar-event"></i>${c.start} تا ${c.end}</span></div></article>`;
}
function renderCalls() {
  const a = D.calls[0];
  const pct = Math.min(100, Math.max(0, Math.round((Date.now() - REGSTART) / (DEADLINE - REGSTART) * 100)));
  const side = D.calls.slice(1).map(callCard).join("");
  const ticket = `<article class="ticket" data-rv="start"><div class="tk-main"><span class="tk-status st-active"><i></i>${a.label}</span><h3 class="tk-title">${a.title}</h3><p class="tk-desc">${a.desc}</p><div class="tk-dates"><span><i class="bi bi-calendar-check"></i>آغاز: <b>${a.start}</b></span><span><i class="bi bi-calendar-x"></i>پایان: <b>${a.end}</b></span></div><div class="tk-prog"><i style="--p:${pct}%"></i></div><p class="tk-plabel">${faNum(pct)}٪ از مهلت ثبت‌نام سپری شده است</p><div class="tk-cta"><a class="btn-kh" href="#" data-magnetic><span>ثبت طرح</span><i class="bi bi-arrow-left"></i></a><a class="more-link" href="#">شرایط شرکت <i class="bi bi-arrow-left"></i></a></div></div><div class="tk-stub"><i class="bi bi-megaphone"></i><b>${a.edition}</b><span>دوره جشنواره</span></div></article>`;
  $("#callWrap").innerHTML = '<div class="radar" aria-hidden="true"><i class="loop"></i><i class="loop"></i><i class="loop"></i></div>' + ticket + `<div class="call-side">${side}</div>`;
}

/* ── پادکست ── */
const audio = $("#khAudio"), podPanel = $(".pod-panel"), wave = $("#podWave");
const NB = 56;
let ep = 0, bars = [];
function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function buildWave(i) {
  const rnd = seedRand(i * 77 + 13);
  wave.innerHTML = Array.from({ length: NB }, (_, k) => {
    const h = Math.round(18 + rnd() * 82);
    return `<i style="--h:${h};--i:${k}"></i>`;
  }).join("");
  bars = $$("i", wave);
}
function fmtT(s) {
  if (!isFinite(s)) return "۰۰:۰۰";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return faNum(String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0"));
}
function loadEp(i, autoplay) {
  ep = (i + D.episodes.length) % D.episodes.length;
  const e = D.episodes[ep];
  audio.src = e.src;
  $("#podCover").src = e.cover;
  $("#podCover").alt = e.title;
  $("#podEp").textContent = "اپیزود " + e.n;
  $("#podTitle").textContent = e.title;
  $("#podDesc").textContent = e.desc;
  $("#podDur").textContent = e.dur;
  $("#podCur").textContent = "۰۰:۰۰";
  $("#podNote").hidden = true;
  buildWave(ep);
  $$(".ep-row").forEach((r, k) => r.classList.toggle("active", k === ep));
  if (autoplay) audio.play().catch(() => {});
}
function updateWave() {
  const r = audio.duration ? audio.currentTime / audio.duration : 0;
  const n = Math.floor(r * NB);
  bars.forEach((b, k) => b.classList.toggle("on", k < n));
  $("#podCur").textContent = fmtT(audio.currentTime);
}
function initPodcast() {
  $("#epList").innerHTML = D.episodes.map((e, i) =>
    `<button class="ep-row${i === 0 ? " active" : ""}" data-ep="${i}"><span class="ep-n">${e.n}</span><span class="ep-t"><b>${e.title}</b><small>${e.desc}</small></span><span class="ep-eq"><i></i><i></i><i></i></span><span class="ep-d">${e.dur}</span></button>`
  ).join("");
  loadEp(0, false);
  $("#podPlay").addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => { $("#podNote").hidden = false; });
    else audio.pause();
  });
  $("#podPrev").addEventListener("click", () => loadEp(ep - 1, !audio.paused));
  $("#podNext").addEventListener("click", () => loadEp(ep + 1, !audio.paused));
  $("#epList").addEventListener("click", e => {
    const r = e.target.closest(".ep-row");
    if (r) loadEp(+r.dataset.ep, true);
  });
  wave.addEventListener("click", e => {
    const r = wave.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (r.right - e.clientX) / r.width));
    if (audio.duration) { audio.currentTime = ratio * audio.duration; updateWave(); }
  });
  audio.addEventListener("play", () => { podPanel.classList.add("playing"); $("#podPlayIcon").className = "bi bi-pause-fill"; });
  audio.addEventListener("pause", () => { podPanel.classList.remove("playing"); $("#podPlayIcon").className = "bi bi-play-fill"; });
  audio.addEventListener("timeupdate", updateWave);
  audio.addEventListener("loadedmetadata", () => { $("#podDur").textContent = fmtT(audio.duration); });
  audio.addEventListener("ended", () => loadEp(ep + 1, true));
  audio.addEventListener("error", () => { $("#podNote").hidden = false; podPanel.classList.remove("playing"); $("#podPlayIcon").className = "bi bi-play-fill"; });
}

/* ── حامیان ── */
function markSvg(m, hue) {
  const c = `hsl(${hue} 75% 55%)`;
  if (m === "hex") return `<svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,3 28,10 28,22 16,29 4,22 4,10" fill="${c}"/></svg>`;
  if (m === "circle") return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="${c}"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>`;
  if (m === "tri") return `<svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,4 29,27 3,27" fill="${c}"/></svg>`;
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8" y="8" width="16" height="16" rx="3" transform="rotate(45 16 16)" fill="${c}"/></svg>`;
}
function spItem(p) {
  return `<a class="sp-item" href="${p.url}" target="_blank" rel="noopener" style="--h:${p.hue}">${markSvg(p.mark, p.hue)}<span>${p.name}</span></a>`;
}
function renderSponsors() {
  const row1 = D.partners.map(spItem).join("");
  const row2 = D.partners.slice().reverse().map(spItem).join("");
  $("#spRow1").innerHTML = row1 + row1;
  $("#spRow2").innerHTML = row2 + row2;
}

/* ── آمار ── */
const PAL = [["#4f46e5", "#06b6d4"], ["#0891b2", "#10b981"], ["#f59e0b", "#f43f5e"], ["#8b5cf6", "#ec4899"], ["#10b981", "#06b6d4"], ["#f43f5e", "#8b5cf6"]];
function glyphHtml(g, pct) {
  if (g === "ring") return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-p" cx="32" cy="32" r="26" pathLength="100" style="--p:${pct || 75}"/></svg>`;
  if (g === "bars") return '<span class="g-bars"><i style="--h:38%"></i><i style="--h:62%"></i><i style="--h:80%"></i><i style="--h:100%"></i></span>';
  if (g === "orbit") return '<span class="g-orbit loop"><i></i></span>';
  if (g === "pulse") return '<span class="g-pulse"><i class="loop"></i><i class="loop"></i><b></b></span>';
  if (g === "grid") {
    const cells = Array.from({ length: 9 }, (_, k) => `<i class="loop" style="--i:${k}"></i>`).join("");
    return `<span class="g-grid">${cells}</span>`;
  }
  const dots5 = Array.from({ length: 5 }, (_, k) => `<i class="loop" style="--i:${k}"></i>`).join("");
  return `<span class="g-wave">${dots5}</span>`;
}
function renderStats() {
  $("#statBand").innerHTML = D.stats.map((s, i) => {
    const c = PAL[i % PAL.length];
    return `<div class="stat" data-rv="zoom" data-d="${i}" style="--acc:${c[0]};--acc2:${c[1]}"><span class="st-glyph">${glyphHtml(s.glyph, s.pct)}</span><div class="st-txt"><span class="st-num" data-count="${s.v}">۰</span><span class="st-suf">${s.suffix}</span><span class="st-label">${s.label}</span><small>${s.sub}</small></div></div>`;
  }).join("");
}
let counted = false;
function runCounters() {
  if (counted) return;
  counted = true;
  $$("[data-count]").forEach((el, i) => {
    const target = +el.dataset.count;
    if (RM) { el.textContent = fmt.format(target); return; }
    const t0 = performance.now() + i * 140, dur = 2200;
    const step = now => {
      let t = (now - t0) / dur;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      const p = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = fmt.format(Math.round(target * p));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* ── مکان‌نما ── */
function initCursor() {
  if (!FINE || RM) return;
  const dot = $("#cursorDot"), ring = $("#cursorRing");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  document.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  });
  document.addEventListener("mouseover", e => {
    ring.classList.toggle("grow", !!e.target.closest("a, button, [data-tilt], .hdot, .dot"));
  });
  const loop = () => {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* ── دکمه‌های مغناطیسی ── */
function bindMagnetic(scope) {
  if (!FINE || RM) return;
  $$("[data-magnetic]", scope).forEach(el => {
    if (el._mag) return;
    el._mag = 1;
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX - r.left) / r.width - 0.5) * 10}px, ${((e.clientY - r.top) / r.height - 0.5) * 8}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}

/* ── پیش‌بارگذار ── */
let loaded = false;
function finish() {
  if (loaded) return;
  loaded = true;
  document.body.classList.add("is-loaded");
  heroStart();
  moveInd($(".wtab.active"));
  setTimeout(() => { const p = $("#preloader"); if (p) p.remove(); }, 1000);
}
window.addEventListener("load", finish);
setTimeout(finish, 2000);

/* ── راه‌اندازی ── */
renderHero();
renderMenu();
renderDots();
initWinners();
renderProjects();
renderTimeline();
renderFaq();
renderNews();
renderCalls();
initPodcast();
renderSponsors();
renderStats();
buildSearchIndex();
bindReveals(document);
scenes.forEach(s => sio.observe(s));
initParallax();
initCursor();
bindMagnetic(document);
initCountdown();
sizeTimeline();
onScroll();
let rzT = null;
window.addEventListener("resize", () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => { sizeTimeline(); moveInd($(".wtab.active")); }, 120);
});
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveInd($(".wtab.active")));

})();