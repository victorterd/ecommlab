# Ecomlab — site de prezentare

Site static (HTML + CSS + JS, fără build tools). Deschide `index.html` sau găzduiește folderul pe Netlify / Vercel / GitHub Pages / orice hosting static.

## Structură

```
index.html        — pagina completă (toate secțiunile)
css/fonts.css     — fonturi self-hosted (Cal Sans + Hanken Grotesk)
css/style.css     — design system + stiluri
js/main.js        — interacțiuni (reveal, marquee, slider, formular)
assets/           — imagini, logo-uri, video, fonturi
```

## Cum adaugi clipuri la „Reclame video”

Pune fișierul în `assets/clips/` (ideal H.264, 720×1280, sub ~6MB) și adaugă în
grila `.reel-grid` din `index.html`:

```html
<figure class="reel" data-video="assets/clips/nume.mp4"></figure>
```

Clipul stă pe poster (generează unul cu ffmpeg și pune-l în `data-poster`) și
pornește doar la play — cu sunet. Rulează un singur clip odată, se oprește când
iese din ecran, iar butonul rotund din colț comută sunetul.

## Formular de contact

Formularul trimite prin **Web3Forms** (client-side, merge pe Vercel sau orice hosting
static) către **office.ecomlab@gmail.com**. Cheia de acces e în `index.html` și
`js/main.js` — cheile Web3Forms sunt gândite să fie publice, nu e o problemă.

Dacă serviciul nu răspunde, vizitatorul primește automat linkuri precompletate
(email + WhatsApp) cu mesajul lui — niciun lead nu se pierde.

> **Notă Vercel:** fiecare deploy primește și un URL unic „înghețat”
> (`ecommlab-xxxx.vercel.app`) care rămâne pe versiunea aceea și are de obicei
> Deployment Protection (403 pentru vizitatori). Site-ul public și testele se fac
> pe domeniul de producție al proiectului (ex. `ecommlab.vercel.app` sau domeniul
> propriu), care se actualizează la fiecare push.

## Butonul „Programează o întâlnire”

Deschide WhatsApp la +40 728 541 017 cu mesaj precompletat. Îl poți schimba editând
linkurile `https://wa.me/40728541017?text=...` din `index.html`.

## De completat ulterior

- Linkurile sociale din footer (LinkedIn / Instagram / TikTok) sunt `#` momentan.
- Paginile „Politica Confidentialitate” și „Termeni si Conditii” sunt `#` momentan.
- Testimonialele 2 și 3 (The Hive, Piky) sunt placeholder — înlocuiește-le cu citate reale
  (caută `PLACEHOLDER` în `index.html`).
