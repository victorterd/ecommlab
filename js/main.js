/* Ecomlab — interacțiuni */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ── Marquee: umple banda și dublează conținutul pentru loop ─ */
  const fillTrack = (track) => {
    const originals = Array.from(track.children);
    if (!originals.length) return;
    const width = () => track.scrollWidth;
    const target = window.innerWidth * 1.2;
    let guard = 0;
    while (width() < target && guard < 10) {
      originals.forEach((node) => track.appendChild(node.cloneNode(true)));
      guard += 1;
    }
    // A doua jumătate identică — necesară pentru bucla translateX(-50%)
    Array.from(track.children).forEach((node) => track.appendChild(node.cloneNode(true)));
  };

  document
    .querySelectorAll(".marquee__track, .ribbon__track, .footer__marquee-track")
    .forEach(fillTrack);

  /* ── Proiecte: sloturi pregătite pentru clipuri ──────────────
     Adaugă data-video="assets/clips/nume.mp4" pe <figure class="project">
     și clipul pornește automat (mut, în buclă) când intră în viewport. */
  const projectClips = document.querySelectorAll(".project[data-video]");
  projectClips.forEach((card) => {
    const src = card.getAttribute("data-video");
    if (!src) return;
    const poster = card.querySelector("img");
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    if (poster) {
      video.poster = poster.currentSrc || poster.src;
      video.setAttribute("aria-label", poster.alt || "Clip proiect");
      poster.replaceWith(video);
    } else {
      card.appendChild(video);
    }
    if (reducedMotion) {
      video.controls = true;
    } else if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) video.play().catch(() => {});
            else video.pause();
          });
        },
        { threshold: 0.3 }
      );
      cio.observe(video);
    }
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

  /* ── Formular contact → FormSubmit (office.ecomlab@gmail.com) ─ */
  const form = document.getElementById("contact-form");
  if (form) {
    const status = form.querySelector("[data-form-status]");
    const submitBtn = form.querySelector(".contact__submit");
    const submitLabel = form.querySelector("[data-submit-label]");

    const setError = (input, message) => {
      const errorEl = document.getElementById(`${input.id}-error`);
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) errorEl.textContent = message || "";
    };

    const validators = [
      {
        input: form.querySelector("#f-name"),
        check: (v) => (v.trim().length >= 2 ? "" : "Te rugăm să ne spui numele tău."),
      },
      {
        input: form.querySelector("#f-email"),
        check: (v) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
            ? ""
            : "Adresa de e-mail nu pare corectă.",
      },
      {
        input: form.querySelector("#f-message"),
        check: (v) => (v.trim().length >= 10 ? "" : "Spune-ne în câteva cuvinte cum te putem ajuta."),
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

      try {
        const response = await fetch("https://formsubmit.co/ajax/office.ecomlab@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            message: form.message.value.trim(),
            _subject: "Mesaj nou de pe site-ul Ecomlab",
            _template: "table",
            _captcha: "false",
            _honey: form._honey.value,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        validators.forEach(({ input }) => setError(input, ""));
        status.textContent = "Mulțumim! Mesajul a fost trimis — revenim în cel mai scurt timp.";
        status.classList.add("is-ok");
      } catch (error) {
        status.textContent =
          "Ceva n-a mers. Încearcă din nou sau scrie-ne direct la office.ecomlab@gmail.com.";
        status.classList.add("is-err");
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
