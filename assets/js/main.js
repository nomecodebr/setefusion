/* ==========================================================================
   SETE FUSION CUISINE — interactions
   Vanilla JS. No framework, no build step. Everything degrades gracefully
   with prefers-reduced-motion and without JS (content is in the HTML).
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Header scroll state ---------------- */
  var header = document.querySelector(".site-header");
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 40);

    var bar = document.querySelector(".mobile-cta-bar");
    if (bar) {
      var heroH = window.innerHeight * 0.7;
      bar.classList.toggle("is-visible", y > heroH);
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- Hero loaded state (triggers zoom-out) ---------------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var heroImg = hero.querySelector(".hero-media img");
    function markLoaded() { hero.classList.add("is-loaded"); }
    if (heroImg) {
      if (heroImg.complete) requestAnimationFrame(markLoaded);
      else heroImg.addEventListener("load", markLoaded, { once: true });
    } else {
      markLoaded();
    }
  }

  /* ---------------- Hero pointer depth ---------------- */
  if (hero && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      var px = ((event.clientX - rect.left) / rect.width - 0.5) * -12;
      var py = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
      hero.style.setProperty("--pointer-x", px.toFixed(2) + "px");
      hero.style.setProperty("--pointer-y", py.toFixed(2) + "px");
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--pointer-x", "0px");
      hero.style.setProperty("--pointer-y", "0px");
    });
  }

  /* ---------------- Mobile nav ---------------- */
  var hamburger = document.querySelector(".hamburger");
  var mobileNav = document.querySelector(".mobile-nav");
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    hamburger.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
  }
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      hamburger.classList.toggle("is-open", open);
      document.body.classList.toggle("no-scroll", open);
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileNav);
    });
  }

  /* ---------------- Smooth in-page anchors (accounts for fixed header) ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var headerH = header ? header.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------------- Reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Subtle parallax on section media (desktop only, cheap) ---------------- */
  if (!reduceMotion && window.matchMedia("(min-width: 900px)").matches) {
    var parallaxEls = document.querySelectorAll("[data-parallax]");
    if (parallaxEls.length) {
      var ticking = false;
      function updateParallax() {
        var vh = window.innerHeight;
        parallaxEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          var progress = (rect.top - vh) / (vh + rect.height); // -1..0..
          var shift = progress * 26; // px
          el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
        });
        ticking = false;
      }
      window.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
          }
        },
        { passive: true }
      );
      updateParallax();
    }
  }

  /* =========================================================
     GALLERY LIGHTBOX
     ========================================================= */
  (function galleryLightbox() {
    var figures = Array.prototype.slice.call(document.querySelectorAll(".masonry figure[data-full]"));
    if (!figures.length) return;

    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lightbox-close" aria-label="Fechar">' + iconClose() + "</button>" +
      '<button class="lightbox-nav prev" aria-label="Anterior">' + iconChevron("left") + "</button>" +
      '<img alt="">' +
      '<button class="lightbox-nav next" aria-label="Pr\u00f3xima">' + iconChevron("right") + "</button>";
    document.body.appendChild(lb);

    var imgEl = lb.querySelector("img");
    var idx = 0;

    function openAt(i) {
      idx = (i + figures.length) % figures.length;
      var fig = figures[idx];
      imgEl.src = fig.getAttribute("data-full");
      imgEl.alt = fig.querySelector("img") ? fig.querySelector("img").alt : "";
      lb.classList.add("is-open");
      document.body.classList.add("no-scroll");
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    }

    figures.forEach(function (fig, i) {
      fig.addEventListener("click", function () { openAt(i); });
    });
    lb.querySelector(".lightbox-close").addEventListener("click", close);
    lb.querySelector(".prev").addEventListener("click", function () { openAt(idx - 1); });
    lb.querySelector(".next").addEventListener("click", function () { openAt(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") openAt(idx - 1);
      if (e.key === "ArrowRight") openAt(idx + 1);
    });
  })();

  /* =========================================================
     MENU VIEWER (cardápios em PDF renderizados como páginas)
     ========================================================= */
  (function menuViewer() {
    var openers = document.querySelectorAll("[data-menu-open]");
  var menuAssets = {
    "bebidas-01": "assets/media/bebidas-01_9fef9a02.webp",
    "bebidas-02": "assets/media/bebidas-02_a7ef8070.webp",
    "bebidas-03": "assets/media/bebidas-03_9564cabd.webp",
    "bebidas-04": "assets/media/bebidas-04_b8be5338.webp",
    "bebidas-05": "assets/media/bebidas-05_67abcbba.webp",
    "bebidas-06": "assets/media/bebidas-06_5c6657ee.webp",
    "bebidas-07": "assets/media/bebidas-07_64c14e1a.webp",
    "bebidas-08": "assets/media/bebidas-08_b70800a3.webp",
    "bebidas-09": "assets/media/bebidas-09_8b63cb9b.webp",
    "bebidas-10": "assets/media/bebidas-10_6f58f414.webp",
    "bebidas-11": "assets/media/bebidas-11_2e91b2a3.webp",
    "bebidas-12": "assets/media/bebidas-12_c2e54320.webp",
    "jantar-01": "assets/media/jantar-01_f4dda558.webp",
    "jantar-02": "assets/media/jantar-02_1dcffa45.webp",
    "jantar-03": "assets/media/jantar-03_10a14890.webp",
    "jantar-04": "assets/media/jantar-04_b54167c2.webp",
    "jantar-05": "assets/media/jantar-05_a35a5f10.webp",
    "jantar-06": "assets/media/jantar-06_bd53e499.webp",
    "jantar-07": "assets/media/jantar-07_afd37f62.webp",
    "jantar-08": "assets/media/jantar-08_26df691a.webp",
    "jantar-09": "assets/media/jantar-09_57a30746.webp",
  };
    if (!openers.length) return;

    var overlay = document.createElement("div");
    overlay.className = "menu-viewer";
    overlay.innerHTML =
      '<div class="mv-header">' +
      '  <div class="mv-title"><span class="kicker">Card\u00e1pio</span><h3 class="mv-name"></h3></div>' +
      '  <div class="mv-page-count"><span class="mv-current">1</span> / <span class="mv-total">1</span></div>' +
      '  <button class="mv-close" aria-label="Fechar card\u00e1pio">' + iconClose() + "</button>" +
      "</div>" +
      '<div class="mv-body">' +
      '  <button class="mv-nav prev" aria-label="P\u00e1gina anterior">' + iconChevron("left") + "</button>" +
      '  <div class="mv-track"></div>' +
      '  <button class="mv-nav next" aria-label="Pr\u00f3xima p\u00e1gina">' + iconChevron("right") + "</button>" +
      "</div>" +
      '<div class="mv-footer"></div>';
    document.body.appendChild(overlay);

    var track = overlay.querySelector(".mv-track");
    var footer = overlay.querySelector(".mv-footer");
    var nameEl = overlay.querySelector(".mv-name");
    var curEl = overlay.querySelector(".mv-current");
    var totEl = overlay.querySelector(".mv-total");
    var prevBtn = overlay.querySelector(".mv-nav.prev");
    var nextBtn = overlay.querySelector(".mv-nav.next");

    var pages = [];
    var current = 0;

    function render(name, list, startAt) {
      nameEl.textContent = name;
      pages = list;
      track.innerHTML = "";
      footer.innerHTML = "";
      list.forEach(function (src, i) {
        var page = document.createElement("div");
        page.className = "mv-page";
        var img = document.createElement("img");
        img.loading = i === 0 ? "eager" : "lazy";
        img.src = src;
        img.alt = name + " \u2014 p\u00e1gina " + (i + 1);
        page.appendChild(img);
        track.appendChild(page);

        var dot = document.createElement("span");
        dot.className = "mv-dot";
        dot.addEventListener("click", function () { goTo(i); });
        footer.appendChild(dot);
      });
      totEl.textContent = list.length;
      overlay.style.setProperty("--mv-page-w", overlay.querySelector(".mv-body").clientWidth + "px");
      goTo(startAt || 0, true);
    }

    function goTo(i, instant) {
      current = Math.max(0, Math.min(pages.length - 1, i));
      var w = overlay.querySelector(".mv-body").clientWidth;
      overlay.style.setProperty("--mv-page-w", w + "px");
      track.style.transition = instant || reduceMotion ? "none" : "transform .55s cubic-bezier(.16,1,.3,1)";
      track.style.transform = "translate3d(-" + current * w + "px,0,0)";
      curEl.textContent = current + 1;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === pages.length - 1;
      footer.querySelectorAll(".mv-dot").forEach(function (d, i2) {
        d.classList.toggle("is-active", i2 === current);
      });
      // preload neighbor
      var next = track.children[current + 1];
      if (next) { var im = next.querySelector("img"); if (im && im.loading === "lazy") im.loading = "eager"; }
    }

    function open(name, list) {
      render(name, list, 0);
      overlay.classList.add("is-open");
      document.body.classList.add("no-scroll");
    }
    function close() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    }

    prevBtn.addEventListener("click", function () { goTo(current - 1); });
    nextBtn.addEventListener("click", function () { goTo(current + 1); });
    overlay.querySelector(".mv-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    });
    window.addEventListener("resize", function () {
      if (overlay.classList.contains("is-open")) goTo(current, true);
    });

    // touch swipe
    var touchX = null;
    overlay.querySelector(".mv-body").addEventListener("touchstart", function (e) {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    overlay.querySelector(".mv-body").addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) { dx < 0 ? goTo(current + 1) : goTo(current - 1); }
      touchX = null;
    }, { passive: true });

    openers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var name = btn.getAttribute("data-menu-name");
        var base = btn.getAttribute("data-menu-open");
        var count = parseInt(btn.getAttribute("data-menu-count"), 10);
        var start = parseInt(btn.getAttribute("data-menu-start") || "1", 10);
        var pad = btn.getAttribute("data-menu-pad") === "1";
        var list = [];
        for (var i = start; i < start + count; i++) {
          var n = pad ? String(i).padStart(2, "0") : i;
          list.push(menuAssets[base + "-" + String(n).padStart(2, "0")]);
        }
        open(name, list);
      });
    });
  })();

  /* ---------------- tiny inline icon helpers ---------------- */
  function iconClose() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 4l16 16M20 4L4 20"/></svg>';
  }
  function iconChevron(dir) {
    var d = dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7";
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  }
})();
