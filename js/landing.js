/* Ecomlab — interacțiuni pentru landing (doar index.html).
   main.js se ocupă de meniu, clipuri, apariții, ancore și formular. */
(() => {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ── Scroll fluid pe desktop (Lenis) ───────────────────────────── */
  let lenis = null;
  if (!reducedMotion && finePointer && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.1, autoRaf: true });
    window.ecomlabLenis = lenis;
    const onFullscreen = () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) lenis.stop();
      else lenis.start();
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("webkitfullscreenchange", onFullscreen);
  }

  /* ── Clipuri: click oriunde pe clip = play cu sunet ────────────── */
  document.querySelectorAll(".reel").forEach((reel) => {
    reel.addEventListener("click", (e) => {
      if (e.target.closest(".reel__play")) return;
      const playBtn = reel.querySelector(".reel__play");
      if (playBtn) playBtn.click();
    });
  });

  /* ── Hero: player tip „story” cu clipurile reale ───────────────── */
  const story = document.querySelector("[data-story]");
  if (story) {
    const CLIPS = ["clip-29", "clip-4", "clip-1", "clip-4-2", "clip-7", "creativ-3", "clip-2", "clip-3-2"];
    const video = story.querySelector(".story__video");
    const barsWrap = story.querySelector("[data-story-bars]");
    const count = story.querySelector("[data-story-count]");
    const soundBtn = story.querySelector("[data-story-sound]");
    const soundLabel = story.querySelector("[data-story-sound-label]");
    const peeks = [story.querySelector(".story__peek--1"), story.querySelector(".story__peek--2")];
    const bars = CLIPS.map(() => {
      const bar = document.createElement("span");
      bar.className = "story__bar";
      bar.appendChild(document.createElement("i"));
      barsWrap.appendChild(bar);
      return bar;
    });
    let index = 0;
    let inView = true;
    const src = (name) => `assets/clips/${name}.mp4`;
    const poster = (name) => `assets/clips/${name}-poster.webp`;

    // fiecare clip rulează 7 secunde, apoi trece la următorul
    const SLIDE_SECONDS = 7;
    const limit = () => Math.min(SLIDE_SECONDS, video.duration || SLIDE_SECONDS);

    const paintBars = () => {
      bars.forEach((bar, i) => {
        const p = i < index ? 1 : i > index ? 0 : Math.min(1, video.currentTime / limit());
        bar.style.setProperty("--p", p.toFixed(3));
      });
    };

    // bara de progres se desenează pe fiecare cadru cât rulează clipul
    let raf = 0;
    const tick = () => {
      raf = 0;
      paintBars();
      if (video.currentTime >= limit() - 0.02) {
        load(index + 1);
        return;
      }
      if (!video.paused) raf = requestAnimationFrame(tick);
    };
    video.addEventListener("play", () => {
      if (!raf) raf = requestAnimationFrame(tick);
    });

    const load = (i) => {
      index = (i + CLIPS.length) % CLIPS.length;
      video.classList.add("is-switching");
      video.poster = poster(CLIPS[index]);
      video.src = src(CLIPS[index]);
      peeks.forEach((img, k) => {
        if (img) img.src = poster(CLIPS[(index + k + 1) % CLIPS.length]);
      });
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(CLIPS.length).padStart(2, "0")}`;
      paintBars();
      if (inView && !reducedMotion) video.play().catch(() => {});
    };

    video.addEventListener("playing", () => video.classList.remove("is-switching"));
    video.addEventListener("loadeddata", () => video.classList.remove("is-switching"));
    video.addEventListener("timeupdate", paintBars);
    video.loop = true;

    story.querySelector("[data-story-next]").addEventListener("click", () => load(index + 1));
    story.querySelector("[data-story-prev]").addEventListener("click", () => load(index - 1));
    peeks.forEach((img, k) => img && img.addEventListener("click", () => load(index + k + 1)));

    soundBtn.addEventListener("click", () => {
      video.muted = !video.muted;
      soundBtn.setAttribute("aria-pressed", String(!video.muted));
      soundLabel.textContent = video.muted ? "Pornește sunetul" : "Oprește sunetul";
      if (!video.muted) {
        // un singur clip cu sunet pe pagină
        document.querySelectorAll("video").forEach((v) => {
          if (v !== video && !v.muted) { v.muted = true; v.pause(); }
        });
        video.play().catch(() => {});
      }
    });

    // pe mouse: pauză cât timp ții cursorul pe clip
    if (finePointer) {
      story.querySelector(".story__phone").addEventListener("mouseenter", () => video.pause());
      story.querySelector(".story__phone").addEventListener("mouseleave", () => inView && video.play().catch(() => {}));
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !reducedMotion) video.play().catch(() => {});
        else video.pause();
      }, { threshold: 0.25 }).observe(story);
    }

    load(0);
  }

  /* ── Tab-uri: Video / Grafică / Website ────────────────────────── */
  const tablist = document.querySelector("[data-tabs]");
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.classList.toggle("is-active", on);
        // clipurile din panourile ascunse nu mai rulează
        if (!on && panel) panel.querySelectorAll("video").forEach((v) => v.pause());
      });
      if (focus) tab.focus();
      if (lenis) lenis.resize();
    };
    tabs.forEach((tab, i) => {
      tab.tabIndex = i === 0 ? 0 : -1;
      tab.addEventListener("click", () => select(tab, false));
      tab.addEventListener("keydown", (e) => {
        const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        select(tabs[(i + dir + tabs.length) % tabs.length], true);
      });
    });
  }

  /* ── Cifre care urcă la apariție ───────────────────────────────── */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reducedMotion && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          cio.unobserve(entry.target);
          const el = entry.target;
          const end = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const start = performance.now();
          const DURATION = 1600;
          const step = (now) => {
            const t = Math.min(1, (now - start) / DURATION);
            const eased = 1 - Math.pow(1 - t, 4);
            el.textContent = `${Math.round(end * eased)}${suffix}`;
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ── Anatomia unei reclame: pașii se aprind pe rând ────────────── */
  const anatomy = document.querySelector("[data-anatomy]");
  if (anatomy) {
    const steps = Array.from(anatomy.querySelectorAll(".anatomy__step"));
    const label = document.querySelector(".anatomy__label");
    const labelText = document.querySelector("[data-anatomy-label]");
    const labelN = document.querySelector("[data-anatomy-n]");
    const STEP_MS = 4500; // cât stă aprins fiecare pas
    const IDLE_MS = 10000;
    anatomy.style.setProperty("--step-ms", `${STEP_MS}ms`);
    let current = 0;
    let inView = false;
    let hovering = false;
    let resumeAt = 0;

    const select = (i) => {
      current = (i + steps.length) % steps.length;
      steps.forEach((step, k) => {
        const on = k === current;
        step.classList.toggle("is-active", on);
        step.querySelector(".anatomy__btn").setAttribute("aria-pressed", String(on));
        // repornește bara de progres
        const bar = step.querySelector(".anatomy__bar i");
        if (on && bar) {
          bar.style.animation = "none";
          void bar.offsetWidth;
          bar.style.animation = "";
        }
      });
      if (label) {
        labelText.textContent = steps[current].querySelector("strong").textContent;
        labelN.textContent = String(current + 1).padStart(2, "0");
        // eticheta coboară pe clip odată cu pașii
        label.style.top = `${14 + current * 15}%`;
        label.classList.remove("is-swap");
        void label.offsetWidth;
        label.classList.add("is-swap");
      }
    };

    steps.forEach((step, i) =>
      step.querySelector(".anatomy__btn").addEventListener("click", () => {
        resumeAt = Date.now() + IDLE_MS;
        select(i);
      })
    );

    // pasul următor vine când se umple bara; pauza oprește chiar bara
    const paused = () => reducedMotion || !inView || hovering || document.hidden || Date.now() < resumeAt;
    const update = () => anatomy.classList.toggle("is-paused", paused());
    steps.forEach((step) =>
      step.querySelector(".anatomy__bar i").addEventListener("animationend", () => {
        if (step.classList.contains("is-active") && !paused()) select(current + 1);
      })
    );
    steps.forEach((step) => step.querySelector(".anatomy__btn").addEventListener("click", () => {
      update();
      setTimeout(update, IDLE_MS + 50);
    }));
    document.addEventListener("visibilitychange", update);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        update();
      }, { threshold: 0.35 }).observe(anatomy);
    } else {
      inView = true;
    }
    if (finePointer) {
      anatomy.addEventListener("mouseenter", () => { hovering = true; update(); });
      anatomy.addEventListener("mouseleave", () => { hovering = false; update(); });
    }
    update();

    select(0);
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
        swapTimer = setTimeout(apply, 160);
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
        e.preventDefault();
        buttons[(pos + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    });

    let touchX = null;
    box.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    box.addEventListener(
      "touchend",
      (e) => {
        if (touchX === null) return;
        const dxTouch = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dxTouch) > 45) show(index + (dxTouch < 0 ? 1 : -1), true);
      },
      { passive: true }
    );
  }
})();
