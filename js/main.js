/* Ecomlab — interacțiuni */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Meniu mobil ─────────────────────────────────────────────── */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.getElementById("nav-links");
  if (navToggle && navLinks) {
    const close = () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Deschide meniul");
    };
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Închide meniul" : "Deschide meniul");
    });
    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ── Smooth scroll cu easing pentru ancore ───────────────────── */
  if (!reducedMotion) {
    // dezactivăm smooth-ul nativ ca să nu se suprapună cu animația noastră
    document.documentElement.style.scrollBehavior = "auto";
    const NAV_OFFSET = 100;
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.getAttribute("href").length < 2) return;
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();

      const startY = window.scrollY;
      const endY =
        link.getAttribute("href") === "#top"
          ? 0
          : target.getBoundingClientRect().top + startY - NAV_OFFSET;
      const dist = endY - startY;
      const duration = Math.min(1300, Math.max(550, Math.abs(dist) * 0.45));
      let start = null;

      const tick = (ts) => {
        if (start === null) start = ts;
        const progress = Math.min(1, (ts - start) / duration);
        window.scrollTo(0, startY + dist * easeOutQuart(progress));
        if (progress < 1) requestAnimationFrame(tick);
        else history.replaceState(null, "", link.getAttribute("href"));
      };
      requestAnimationFrame(tick);
    });
  }

  /* ── Reveal on scroll ──────────────────────────────────────── */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ── Marquee: simplu și determinist ──────────────────────────
     Conținutul se clonează de un număr FIX de ori (fără măsurători,
     fără durate calculate): 3 seturi = o jumătate suficient de lată
     pentru orice ecran, apoi jumătatea se dublează pentru bucla
     translateX(-50%). Durata vine doar din CSS. */
  document
    .querySelectorAll(".marquee__track, .ribbon__track, .footer__marquee-track")
    .forEach((track) => {
      const originals = Array.from(track.children);
      if (!originals.length) return;
      for (let i = 0; i < 2; i += 1) {
        originals.forEach((node) => track.appendChild(node.cloneNode(true)));
      }
      Array.from(track.children).forEach((node) => track.appendChild(node.cloneNode(true)));
    });

  /* ── Clipuri: autoplay mut + controale pentru sunet/pauză ────
     Adaugă data-video="assets/clips/nume.mp4" pe .reel sau .project.
     Clipul pornește automat (fără sunet) când intră în viewport;
     vizitatorul poate porni sunetul sau opri clipul din controale,
     iar pauza dată manual e respectată. */
  document.querySelectorAll(".reel[data-video], .project[data-video]").forEach((card) => {
    const src = card.getAttribute("data-video");
    if (!src) return;
    const placeholder = card.querySelector(".reel__soon");
    const poster = card.querySelector("img");
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = true;
    video.preload = "metadata";
    video.setAttribute("controlslist", "nodownload");
    if (card.getAttribute("data-poster")) {
      video.poster = card.getAttribute("data-poster");
    }
    if (poster) {
      if (!video.poster) video.poster = poster.currentSrc || poster.src;
      video.setAttribute("aria-label", poster.alt || "Clip proiect");
      poster.replaceWith(video);
    } else {
      if (placeholder) placeholder.remove();
      video.setAttribute("aria-label", "Reclamă video Ecomlab");
      card.appendChild(video);
    }

    if (reducedMotion || !("IntersectionObserver" in window)) return;

    let ioPausing = false;
    let userPaused = false;
    video.addEventListener("pause", () => {
      if (!ioPausing) userPaused = true;
    });
    video.addEventListener("play", () => {
      userPaused = false;
    });

    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!userPaused) video.play().catch(() => {});
          } else if (!video.paused) {
            ioPausing = true;
            video.pause();
            ioPausing = false;
          }
        });
      },
      { threshold: 0.3 }
    );
    cio.observe(video);
  });

  /* ── Slider testimoniale ─────────────────────────────────────── */
  const slider = document.querySelector(".slider");
  if (slider) {
    const slides = Array.from(slider.querySelectorAll(".slide"));
    const counter = slider.querySelector("[data-slider-current]");
    const prevBtn = slider.querySelector("[data-slider-prev]");
    const nextBtn = slider.querySelector("[data-slider-next]");
    let index = 0;
    let timer = null;

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      if (counter) counter.textContent = String(index + 1).padStart(2, "0");
    };

    const stopAuto = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    prevBtn?.addEventListener("click", () => {
      stopAuto();
      show(index - 1);
    });
    nextBtn?.addEventListener("click", () => {
      stopAuto();
      show(index + 1);
    });

    if (!reducedMotion) {
      timer = setInterval(() => show(index + 1), 6500);
      slider.addEventListener("pointerenter", stopAuto, { once: true });
    }
  }

  /* ── Formular contact → Web3Forms → office.ecomlab@gmail.com ──
     Client-side, fără server: funcționează pe Vercel / orice hosting static. */
  const form = document.getElementById("contact-form");
  if (form) {
    const status = form.querySelector("[data-form-status]");
    const submitBtn = form.querySelector(".contact__submit");
    const submitLabel = form.querySelector("[data-submit-label]");
    const fallback = form.querySelector("[data-form-fallback]");
    const fallbackMail = form.querySelector("[data-fallback-mail]");
    const fallbackWa = form.querySelector("[data-fallback-wa]");

    const setError = (input, message) => {
      const errorEl = document.getElementById(`${input.id}-error`);
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) errorEl.textContent = message || "";
    };

    const nameInput = form.querySelector("#f-name");
    const emailInput = form.querySelector("#f-email");
    const phoneInput = form.querySelector("#f-phone");
    const shopInput = form.querySelector("#f-shop");
    const honeyInput = form.querySelector('[name="botcheck"]');

    const validators = [
      {
        input: nameInput,
        check: (v) => (v.trim().length >= 2 ? "" : "Te rugăm să ne spui numele tău."),
      },
      {
        input: emailInput,
        check: (v) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
            ? ""
            : "Adresa de e-mail nu pare corectă.",
      },
      {
        input: phoneInput,
        check: (v) =>
          v.trim().replace(/[^0-9+]/g, "").length >= 9
            ? ""
            : "Lasă-ne un număr de telefon la care te găsim.",
      },
    ];

    validators.forEach(({ input, check }) => {
      input?.addEventListener("blur", () => setError(input, check(input.value)));
      input?.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") setError(input, check(input.value));
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.textContent = "";
      status.classList.remove("is-ok", "is-err");

      let firstInvalid = null;
      validators.forEach(({ input, check }) => {
        const message = check(input.value);
        setError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      submitBtn.disabled = true;
      submitLabel.textContent = "Se trimite...";

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const shop = shopInput ? shopInput.value.trim() : "";

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: "84e49df0-ad20-4c5c-bcd6-d8776a1a3275",
            subject: "Cerere analiză gratuită — site Ecomlab",
            from_name: "Formular Ecomlab",
            name,
            email,
            telefon: phone,
            magazin: shop,
            botcheck: honeyInput ? honeyInput.value : "",
          }),
        });
        const data = await response.json().catch(() => ({}));
        const ok = response.ok && (data.success === true || data.success === "true");
        if (!ok) throw new Error(data.message || `HTTP ${response.status}`);
        form.reset();
        validators.forEach(({ input }) => setError(input, ""));
        if (fallback) fallback.hidden = true;
        status.textContent = "Mulțumim! Am primit cererea — primești analiza în cel mult 3 zile.";
        status.classList.add("is-ok");
      } catch (error) {
        // Serviciul de email e indisponibil: nu pierdem mesajul — îl oferim
        // precompletat pe email și WhatsApp, fără să părăsim pagina.
        status.textContent =
          "Serviciul de trimitere e momentan indisponibil. Mesajul tău e păstrat mai jos — trimite-l cu un click:";
        status.classList.add("is-err");
        const subject = encodeURIComponent("Cerere analiză gratuită — site Ecomlab");
        const bodyText = encodeURIComponent(
          `Nume: ${name}\nEmail: ${email}\nTelefon: ${phone}\nMagazin: ${shop}`
        );
        if (fallbackMail) {
          fallbackMail.href = `mailto:office.ecomlab@gmail.com?subject=${subject}&body=${bodyText}`;
        }
        if (fallbackWa) {
          fallbackWa.href = `https://wa.me/40728541017?text=${bodyText}`;
        }
        if (fallback) fallback.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitLabel.textContent = "Trimite";
      }
    });
  }

  /* ── Anul curent în footer ───────────────────────────────────── */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
