/* ==========================================================================
   Bernici Tech — v2 behaviour
   Vanilla JS, no dependencies. Reuses window.I18N and window.PROJECTS
   from js/translations.js.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;
  var lang = "en";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function dict() { return (window.I18N && window.I18N[lang]) || {}; }

  /* ------------------------------------------------------------------
     Language
     ------------------------------------------------------------------ */

  function applyLang(next) {
    lang = next;
    var d = dict();

    html.setAttribute("lang", lang);
    html.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    $$("[data-i18n]").forEach(function (el) {
      var v = d[el.getAttribute("data-i18n")];
      if (v) el.textContent = v;
    });

    $$("[data-i18n-ph]").forEach(function (el) {
      var v = d[el.getAttribute("data-i18n-ph")];
      if (v) el.setAttribute("placeholder", v);
    });

    var en = $(".lang__en"), ar = $(".lang__ar");
    if (en && ar) {
      en.classList.toggle("lang__on", lang === "en");
      ar.classList.toggle("lang__on", lang === "ar");
    }

    try { localStorage.setItem("bt_lang", lang); } catch (e) { /* private mode */ }

    renderWorks(currentFilter);
    resetTape();
  }

  var saved = "en";
  try { saved = localStorage.getItem("bt_lang") || "en"; } catch (e) { /* ignore */ }

  var langBtn = $("#langToggle");
  if (langBtn) {
    langBtn.addEventListener("click", function () {
      applyLang(lang === "en" ? "ar" : "en");
    });
  }

  /* ------------------------------------------------------------------
     Nav — mobile drawer
     ------------------------------------------------------------------ */

  var burger = $("#burger");
  var drawer = $("#drawer");

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    $$("a", drawer).forEach(function (a) {
      a.addEventListener("click", function () {
        drawer.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------
     Scroll progress hairline
     ------------------------------------------------------------------ */

  var progress = $("#progress");
  if (progress) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        progress.style.width = pct + "%";
        ticking = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Reveals
     ------------------------------------------------------------------ */

  var revealables = $$(".rv");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealables.forEach(function (el) { revealer.observe(el); });
  }

  /* ------------------------------------------------------------------
     Hero — rotating word
     ------------------------------------------------------------------ */

  var rotator = $("#rotator");
  if (rotator && !reduceMotion) {
    var rotIndex = 0;
    setInterval(function () {
      var words = dict().rotators;
      if (!words || !words.length) return;
      rotIndex = (rotIndex + 1) % words.length;
      rotator.style.opacity = "0";
      setTimeout(function () {
        rotator.textContent = words[rotIndex];
        rotator.style.opacity = "1";
      }, 160);
    }, 2600);
    rotator.style.transition = "opacity 160ms ease";
  }

  /* ------------------------------------------------------------------
     Hero — the receipt prints itself
     ------------------------------------------------------------------ */

  var TAPE_ITEMS = {
    en: [
      { n: "Espresso", p: 8 },
      { n: "Chicken sandwich", p: 25 },
      { n: "Fresh juice", p: 12 },
      { n: "Baklava x2", p: 15 }
    ],
    ar: [
      { n: "إسبريسو", p: 8 },
      { n: "ساندويتش دجاج", p: 25 },
      { n: "عصير طازج", p: 12 },
      { n: "بقلاوة ×٢", p: 15 }
    ]
  };

  var tapeRows = $("#tapeRows");
  var tapeTotal = $("#tapeTotal");
  var tapePaid = $("#tapePaid");
  var tapeTimers = [];

  function clearTapeTimers() {
    tapeTimers.forEach(clearTimeout);
    tapeTimers = [];
  }

  function runTape() {
    if (!tapeRows || !tapeTotal) return;
    var items = TAPE_ITEMS[lang] || TAPE_ITEMS.en;
    var total = 0;

    tapeRows.innerHTML = "";
    tapeTotal.textContent = "0";
    if (tapePaid) tapePaid.classList.remove("is-on");

    if (reduceMotion) {
      items.forEach(function (item) {
        total += item.p;
        addTapeRow(item);
      });
      tapeTotal.textContent = String(total);
      if (tapePaid) tapePaid.classList.add("is-on");
      return;
    }

    items.forEach(function (item, i) {
      tapeTimers.push(setTimeout(function () {
        total += item.p;
        addTapeRow(item);
        tapeTotal.textContent = String(total);
        if (i === items.length - 1) {
          tapeTimers.push(setTimeout(function () {
            if (tapePaid) tapePaid.classList.add("is-on");
          }, 700));
          tapeTimers.push(setTimeout(runTape, 4200));
        }
      }, 700 * (i + 1)));
    });
  }

  function addTapeRow(item) {
    var row = document.createElement("div");
    row.className = "tape__row";
    var name = document.createElement("span");
    name.textContent = item.n;
    var price = document.createElement("span");
    price.textContent = String(item.p);
    row.appendChild(name);
    row.appendChild(price);
    tapeRows.appendChild(row);
  }

  function resetTape() {
    clearTapeTimers();
    runTape();
  }

  /* ------------------------------------------------------------------
     How it works — light each step as it arrives
     ------------------------------------------------------------------ */

  var stepEls = $$(".step");
  if (stepEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      stepEls.forEach(function (el) { el.classList.add("is-active"); });
    } else {
      var stepper = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      }, { threshold: 0.55 });
      stepEls.forEach(function (el) { stepper.observe(el); });
    }
  }

  /* ------------------------------------------------------------------
     Work — render, filter, open
     ------------------------------------------------------------------ */

  var worksEl = $("#works");
  var currentFilter = "all";

  function renderWorks(filter) {
    if (!worksEl || !window.PROJECTS) return;
    var d = dict();
    worksEl.innerHTML = "";

    window.PROJECTS
      .filter(function (p) { return filter === "all" || p.cat === filter; })
      .forEach(function (p, i) {
        var btn = document.createElement("button");
        btn.className = "work rv is-in";
        btn.type = "button";

        var n = document.createElement("span");
        n.className = "work__n";
        n.textContent = String(i + 1).padStart(2, "0");

        var body = document.createElement("div");
        body.className = "work__body";

        var name = document.createElement("h3");
        name.className = "work__name";
        name.textContent = p.name;

        var tag = document.createElement("p");
        tag.className = "work__tag";
        tag.textContent = (p.tag && p.tag[lang]) || "";

        var tech = document.createElement("div");
        tech.className = "work__tech";
        (p.tech || []).forEach(function (t) {
          var s = document.createElement("span");
          s.textContent = t;
          tech.appendChild(s);
        });

        var more = document.createElement("span");
        more.className = "work__more";
        more.textContent = d.work_view || "View project";

        body.appendChild(name);
        body.appendChild(tag);
        body.appendChild(tech);
        body.appendChild(more);

        var shot = document.createElement("img");
        shot.className = "work__shot";
        shot.src = p.img;
        shot.alt = p.name;
        shot.loading = "lazy";

        btn.appendChild(n);
        btn.appendChild(body);
        btn.appendChild(shot);
        btn.addEventListener("click", function () { openModal(p); });

        worksEl.appendChild(btn);
      });
  }

  $$(".filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentFilter = btn.getAttribute("data-filter");
      $$(".filter").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      renderWorks(currentFilter);
    });
  });

  /* ------------------------------------------------------------------
     Modal — focus trapped, Escape closes
     ------------------------------------------------------------------ */

  var modal = $("#modal");
  var sheet = $(".modal__sheet");
  var lastFocused = null;

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openModal(p) {
    if (!modal) return;
    var d = dict();

    lastFocused = document.activeElement;

    $("#modalShot").src = p.img;
    $("#modalShot").alt = p.name;
    $("#modalCat").textContent = d["work_cat_" + p.cat] || p.cat;
    $("#modalTitle").textContent = p.name;
    $("#modalDesc").textContent = (p.desc && p.desc[lang]) || "";

    var techBox = $("#modalTech");
    techBox.innerHTML = "";
    (p.tech || []).forEach(function (t) {
      var s = document.createElement("span");
      s.textContent = t;
      techBox.appendChild(s);
    });

    var linkBox = $("#modalLinks");
    linkBox.innerHTML = "";
    if (p.live) linkBox.appendChild(makeLink(p.live, d.work_live || "Live demo", "btn btn--solid"));
    if (p.code) linkBox.appendChild(makeLink(p.code, d.work_code || "View code", "btn btn--line"));

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // The sheet is visibility:hidden until the class lands — focusing in the
    // same tick is a no-op, so wait for the next frame.
    window.requestAnimationFrame(function () {
      $("#modalClose").focus();
    });
  }

  function makeLink(href, text, cls) {
    var a = document.createElement("a");
    a.className = cls;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = text;
    return a;
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  if (modal) {
    $("#modalClose").addEventListener("click", closeModal);
    $("#scrim").addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;

      if (e.key === "Escape") {
        closeModal();
        return;
      }

      if (e.key !== "Tab") return;

      var items = $$(FOCUSABLE, sheet).filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */

  var form = $("#form");
  var note = $("#formNote");

  if (form && note) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = dict();
      var ok = true;

      [$("#cName"), $("#cContact")].forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.value.trim().length > 0;
        field.classList.toggle("is-bad", !valid);
        input.setAttribute("aria-invalid", String(!valid));
        if (!valid) ok = false;
      });

      note.classList.remove("is-ok", "is-bad");

      if (!ok) {
        note.textContent = d.form_err || "Please fill in your name and how we can reach you.";
        note.classList.add("is-bad");
        return;
      }

      note.textContent = d.form_ok || "Thanks — we'll be in touch shortly.";
      note.classList.add("is-ok");
      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  applyLang(saved === "ar" ? "ar" : "en");
})();
