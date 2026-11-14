/* Ecomlab — interacțiuni pentru pagina principală (doar index.html) */
(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("is-home-ready");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  /* ── Scroll fluid (Lenis), doar cu mouse ───────────────────────── */
  let lenis = null;
  if (!reducedMotion && finePointer && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.1, autoRaf: true });
    window.ecomlabLenis = lenis;
    const onFullscreen = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) lenis.stop();
      else if (!root.classList.contains("is-intro")) lenis.start();
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("webkitfullscreenchange", onFullscreen);
  }

  /* ── Apariții la scroll, în cascadă ─────────────────────────────── */
  const animEls = Array.from(document.querySelectorAll("[data-anim]"));
  let revealsStarted = false;

  const settle = (el, delay) => {
    setTimeout(() => {
      el.removeAttribute("data-anim");
      el.classList.remove("is-in");
      el.style.removeProperty("--anim-delay");
    }, 1450 + delay * 1000);
  };

  const startReveals = () => {
    if (revealsStarted) return;
    revealsStarted = true;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      animEls.forEach((el) => el.removeAttribute("data-anim"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target);
        visible.sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return ra.top - rb.top || ra.left - rb.left;
        });
        visible.forEach((el, i) => {
          const group = el.parentElement && el.parentElement.closest("[data-stagger]");
          const step = group ? parseFloat(group.dataset.stagger) || 0.08 : 0.08;
          const delay = Math.min(i * step, 0.6);
          el.style.setProperty("--anim-delay", `${delay.toFixed(2)}s`);
          el.classList.add("is-in");
          io.unobserve(el);
          settle(el, delay);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    animEls.forEach((el) => io.observe(el));
  };

  /* ── Intro: logo + contor, apoi cortina urcă ───────────────────── */
  const intro = document.querySelector(".intro");
  const endIntro = () => {
    root.classList.remove("is-intro", "intro-exit");
    if (lenis) lenis.start();
    startReveals();
  };

  if (intro && root.classList.contains("is-intro")) {
    if (lenis) lenis.stop();
    const count = intro.querySelector("[data-intro-count]");
    const fill = intro.querySelector(".intro__bar-fill");
    const MIN_MS = 1050;
    const MAX_WAIT_MS = 2200;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    let assetsReady = false;
    let finished = false;

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, MAX_WAIT_MS))]).then(() => {
      assetsReady = true;
    });

    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem("ecl-intro", "1");
      } catch (e) {
        /* sessionStorage indisponibil — intro-ul poate reapărea, nu e grav */
      }
      setTimeout(() => {
        root.classList.add("intro-exit");
        // ce e deja în ecran apare chiar în timp ce urcă cortina
        setTimeout(startReveals, 380);
        intro.addEventListener("transitionend", function done(ev) {
          if (ev.target !== intro) return;
          intro.removeEventListener("transitionend", done);
          endIntro();
        });
        setTimeout(endIntro, 1400);
      }, 160);
    };

    const start = performance.now();
    const tick = (now) => {
      let p = clamp((now - start) / MIN_MS, 0, 1);
      if (!assetsReady) p = Math.min(p, 0.94);
      const eased = easeOut(p);
      if (count) count.textContent = String(Math.round(eased * 100));
      if (fill) fill.style.transform = `scaleX(${eased.toFixed(4)})`;
      if (p >= 1) finish();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // plasă de siguranță: oricum nu ținem pagina blocată mai mult de 4s
    setTimeout(() => {
      finish();
      setTimeout(endIntro, 1500);
    }, 4000);
  } else {
    startReveals();
  }

  /* ── Clipuri: click oriunde pe clip = play cu sunet ────────────── */
  document.querySelectorAll(".reel").forEach((reel) => {
    reel.addEventListener("click", (e) => {
      if (e.target.closest(".reel__play")) return;
      const playBtn = reel.querySelector(".reel__play");
      if (playBtn) playBtn.click();
    });
  });

  /* ── Text care se rulează la hover (nav + butoane) ─────────────── */
  document
    .querySelectorAll(".navbar__links a:not(.navbar__cta--mobile), .navbar__cta:not(.navbar__cta--mobile), .packages__cta")
    .forEach((el) => {
      const text = el.textContent.trim();
      if (!text || el.children.length) return;
      el.setAttribute("data-roll", "");
      const roll = document.createElement("span");
      roll.className = "roll";
      const a = document.createElement("span");
      a.className = "roll__a";
      a.textContent = text;
      const b = document.createElement("span");
      b.className = "roll__b";
      b.setAttribute("aria-hidden", "true");
      b.textContent = text;
      roll.append(a, b);
      el.replaceChildren(roll);
    });

  /* ── Benzi diagonale: viteza urmează scroll-ul ─────────────────── */
  const ribbonsWrap = document.querySelector(".ribbons");
  const tracks = Array.from(document.querySelectorAll(".ribbon__track"));
  if (ribbonsWrap && tracks.length && !reducedMotion) {
    const state = tracks.map((el) => ({
      el,
      x: 0,
      w: 0,
      dir: el.classList.contains("ribbon__track--reverse") ? 1 : -1,
    }));
    // offsetWidth = lățimea reală din layout; getBoundingClientRect ar da
    // cutia benzii rotite (mai lată), iar bucla ar sări la fiecare tură
    const measure = () => {
      state.forEach((s) => {
        const group = s.el.querySelector(".mq");
        s.w = group ? group.offsetWidth : 0;
        if (!s.w) return;
        while (s.x <= -s.w) s.x += s.w;
        while (s.x > 0) s.x -= s.w;
      });
    };
    measure();
    state.forEach((s) => {
      if (s.dir > 0) s.x = -s.w / 2;
    });
    // remăsurăm după încărcarea fontului și doar la schimbări reale de lățime
    // (pe telefon, „resize” vine și când se ascunde bara browserului)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      measure();
    });
    tracks.forEach((t) => t.classList.add("is-driven"));

    const BASE_SPEED = 55; // px/s
    let lastY = window.scrollY;
    let lastT = performance.now();
    let velocity = 0;
    let running = false;

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const y = window.scrollY;
      velocity = lerp(velocity, (y - lastY) / Math.max(dt, 0.001), 0.1);
      lastY = y;
      const speed = clamp(BASE_SPEED + velocity * 0.3, -1400, 1400);
      state.forEach((s) => {
        if (!s.w) return;
        s.x += s.dir * speed * dt;
        if (s.x <= -s.w) s.x += s.w;
        if (s.x > 0) s.x -= s.w;
        s.el.style.transform = `translate3d(${s.x.toFixed(2)}px, 0, 0)`;
      });
      requestAnimationFrame(frame);
    };

    new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) {
        running = true;
        lastT = performance.now();
        lastY = window.scrollY;
        requestAnimationFrame(frame);
      } else if (!visible) {
        running = false;
      }
    }).observe(ribbonsWrap);
  }

  /* ── Lightbox pentru grafică ───────────────────────────────────── */
  const shots = Array.from(document.querySelectorAll("[data-lightbox]"));
  if (shots.length) {
    const icon = (d) =>
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Grafică — vizualizare mărită");
    box.inert = true;
    box.innerHTML =
      `<button type="button" class="lightbox__btn lightbox__close" aria-label="Închide">${icon("M6 6l12 12M18 6 6 18")}</button>` +
      `<button type="button" class="lightbox__btn lightbox__prev" aria-label="Imaginea anterioară">${icon("M15 18l-6-6 6-6")}</button>` +
      `<figure class="lightbox__stage"><img class="lightbox__img" alt=""></figure>` +
      `<button type="button" class="lightbox__btn lightbox__next" aria-label="Imaginea următoare">${icon("M9 18l6-6-6-6")}</button>` +
      `<p class="lightbox__count" aria-live="polite"></p>`;
    document.body.appendChild(box);

    const img = box.querySelector(".lightbox__img");
    const counter = box.querySelector(".lightbox__count");
    const closeBtn = box.querySelector(".lightbox__close");
    const buttons = Array.from(box.querySelectorAll("button"));
    let index = 0;
    let lastFocus = null;
    let swapTimer = null;

    const show = (i, animate) => {
      index = (i + shots.length) % shots.length;
      const source = shots[index].querySelector("img");
      const apply = () => {
        img.src = source.currentSrc || source.src;
        img.alt = source.alt;
        counter.textContent = `${index + 1} / ${shots.length}`;
        img.classList.remove("is-swapping");
      };
      clearTimeout(swapTimer);
      if (animate && !reducedMotion) {
        img.classList.add("is-swapping");
        swapTimer = setTimeout(apply, 170);
      } else {
        apply();
      }
    };

    const isOpen = () => box.classList.contains("is-open");
    const open = (i) => {
      lastFocus = document.activeElement;
      show(i, false);
      box.inert = false;
      box.classList.add("is-open");
      root.style.overflow = "hidden";
      if (lenis) lenis.stop();
      closeBtn.focus({ preventScroll: true });
    };
    const close = () => {
      if (!isOpen()) return;
      box.classList.remove("is-open");
      box.inert = true;
      root.style.overflow = "";
      if (lenis) lenis.start();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };

    shots.forEach((shot, i) => shot.addEventListener("click", () => open(i)));
    closeBtn.addEventListener("click", close);
    box.querySelector(".lightbox__prev").addEventListener("click", () => show(index - 1, true));
    box.querySelector(".lightbox__next").addEventListener("click", () => show(index + 1, true));
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!isOpen()) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1, true);
      else if (e.key === "ArrowRight") show(index + 1, true);
      else if (e.key === "Tab") {
        const pos = buttons.indexOf(document.activeElement);
        const next = (pos + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        e.preventDefault();
        buttons[next].focus();
      }
    });

    let touchX = null;
    box.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    box.addEventListener(
      "touchend",
      (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 45) show(index + (dx < 0 ? 1 : -1), true);
      },
      { passive: true }
    );
  }

  /* De aici în jos: doar pe dispozitive cu mouse și fără mișcare redusă */
  if (!finePointer || reducedMotion) return;

  /* ── Umbrele verzi din hero urmăresc mouse-ul ──────────────────── */
  const glows = Array.from(document.querySelectorAll(".hero__glow"));
  if (glows.length) {
    const reach = [
      [52, 38],
      [-44, -30],
    ];
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let moving = false;
    const loop = () => {
      cx = lerp(cx, tx, 0.05);
      cy = lerp(cy, ty, 0.05);
      glows.forEach((g, i) => {
        const [fx, fy] = reach[i] || reach[0];
        g.style.transform = `translate3d(${(cx * fx).toFixed(2)}px, ${(cy * fy).toFixed(2)}px, 0)`;
      });
      if (Math.abs(cx - tx) > 0.0005 || Math.abs(cy - ty) > 0.0005) requestAnimationFrame(loop);
      else moving = false;
    };
    window.addEventListener(
      "mousemove",
      (e) => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        if (!moving) {
          moving = true;
          requestAnimationFrame(loop);
        }
      },
      { passive: true }
    );
  }

  /* ── Cursor personalizat cu etichete contextuale ───────────────── */
  const cursor = document.createElement("div");
  cursor.className = "cursor is-hidden";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<div class="cursor__ring"><span class="cursor__circle"></span><span class="cursor__label"></span></div>' +
    '<div class="cursor__dot"></div>';
  document.body.appendChild(cursor);
  root.classList.add("has-cursor");

  const ring = cursor.querySelector(".cursor__ring");
  const dot = cursor.querySelector(".cursor__dot");
  const label = cursor.querySelector(".cursor__label");
  const STATES = ["is-link", "is-media", "is-text"];
  // suprafețe verzi: acolo cursorul verde n-ar mai fi vizibil, așa că devine închis
  const ON_GREEN = ".services__item, .navbar__cta, .packages__cta--primary, .contact__submit, .lightbox__btn";
  let mx = -100;
  let my = -100;
  let rx = -100;
  let ry = -100;
  let following = false;
  let lastTarget = null;

  const resolve = (target) => {
    if (!(target instanceof Element)) return { state: "" };
    if (target.closest("input, textarea, select")) return { state: "is-text" };
    const reel = target.closest(".reel");
    if (reel) {
      const video = reel.querySelector("video");
      return video && !video.controls ? { state: "is-media", text: "Play" } : { state: "is-link" };
    }
    if (target.closest("button.portfolio__shot")) return { state: "is-media", text: "Vezi" };
    if (target.closest("a.portfolio__shot")) return { state: "is-media", text: "Vezi site" };
    if (target.closest("a, button, label, [role='button'], .services__item")) return { state: "is-link" };
    return { state: "" };
  };

  const applyState = (target) => {
    const { state, text } = resolve(target);
    STATES.forEach((s) => cursor.classList.toggle(s, s === state));
    cursor.classList.toggle("is-dark", target instanceof Element && !!target.closest(ON_GREEN));
    if (text) label.textContent = text;
  };

  // re-evaluează ce e sub cursor fără mousemove (după click, Escape, scroll)
  const refresh = () => {
    const el = document.elementFromPoint(mx, my);
    if (el && el !== lastTarget) {
      lastTarget = el;
      applyState(el);
    }
  };

  const follow = () => {
    rx = lerp(rx, mx, 0.2);
    ry = lerp(ry, my, 0.2);
    ring.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0)`;
    if (Math.abs(rx - mx) > 0.1 || Math.abs(ry - my) > 0.1) requestAnimationFrame(follow);
    else following = false;
  };

  window.addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (cursor.classList.contains("is-hidden")) {
        cursor.classList.remove("is-hidden");
        rx = mx;
        ry = my;
      }
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        applyState(e.target);
      }
      if (!following) {
        following = true;
        requestAnimationFrame(follow);
      }
    },
    { passive: true }
  );

  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) cursor.classList.add("is-hidden");
  });
  window.addEventListener("mousedown", () => cursor.classList.add("is-down"));
  window.addEventListener("mouseup", () => cursor.classList.remove("is-down"));
  // după un click (play cu sunet, lightbox deschis) sau Escape, ce e sub
  // cursor se schimbă; la fel la scroll
  document.addEventListener("click", () =>
    setTimeout(() => {
      lastTarget = null;
      refresh();
    }, 0)
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setTimeout(refresh, 0);
  });
  window.addEventListener("scroll", refresh, { passive: true });

  /* ── Butoane magnetice ─────────────────────────────────────────── */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic) || 0.3;
    let ox = 0;
    let oy = 0;
    el.addEventListener("mousemove", (e) => {
      // poziția fără deplasarea magnetică de acum (care poate fi în tranziție)
      const r = el.getBoundingClientRect();
      const t = getComputedStyle(el).transform;
      const m = t && t !== "none" ? new DOMMatrixReadOnly(t) : { m41: 0, m42: 0 };
      const x = e.clientX - (r.left - m.m41 + r.width / 2);
      const y = e.clientY - (r.top - m.m42 + r.height / 2);
      ox = x * strength;
      oy = y * strength;
      el.style.transition = "transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)";
      el.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0)`;
      const inner = el.querySelector(".roll, [data-submit-label]");
      if (inner) {
        inner.style.display = "inline-block";
        inner.style.transition = el.style.transition;
        inner.style.transform = `translate3d(${(ox * 0.45).toFixed(2)}px, ${(oy * 0.45).toFixed(2)}px, 0)`;
      }
    });
    el.addEventListener("mouseleave", () => {
      ox = 0;
      oy = 0;
      el.style.transition = "transform 0.8s cubic-bezier(0.19, 1, 0.22, 1)";
      el.style.transform = "";
      const inner = el.querySelector(".roll, [data-submit-label]");
      if (inner) {
        inner.style.transition = el.style.transition;
        inner.style.transform = "";
      }
    });
  });

  /* ── Pachete: lumina urmărește cursorul ────────────────────────── */
  document.querySelectorAll(".packages__card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(1)}px`);
      card.style.setProperty("--my", `${(e.clientY - r.top).toFixed(1)}px`);
    });
  });
})();
