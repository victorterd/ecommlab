# Ecomlab — site de prezentare

Site static (HTML + CSS + JS, fără build tools). Deschide `index.html` sau găzduiește folderul pe Netlify / Vercel / GitHub Pages / orice hosting static.

## Structură

```
index.html        — pagina completă (toate secțiunile)
blog.html         — lista de articole
blog/*.html       — câte o pagină per articol
css/fonts.css     — fonturi self-hosted (Cal Sans + Hanken Grotesk)
css/style.css     — design system + stiluri
css/blog.css      — stiluri specifice blogului (listă + articol)
js/main.js        — interacțiuni (reveal, marquee, slider, formular)
assets/           — imagini, logo-uri, video, fonturi
assets/blog/      — imaginile de copertă ale articolelor
```

## Cum adaugi clipuri la „Reclame video”

Pune fișierul în `assets/clips/` (ideal H.264, 720×1280, sub ~6MB) și adaugă în
grila `.reel-grid` din `index.html`:

```html
<figure class="reel" data-video="assets/clips/nume.mp4" data-poster="assets/clips/nume-poster.webp"></figure>
```

Clipul pornește automat, fără sunet, când intră în viewport (desktop și mobil
deopotrivă) și se oprește când iese din ecran. Apare un buton central de play,
pe orice dispozitiv; la atingere/click, clipul primește sunet, butonul dispare
definitiv, iar clipul devine un player video normal, cu controale native ale
browserului (pauză, volum, derulare) — la fel ca orice video obișnuit. Pornirea
unui clip cu sunet oprește automat orice alt clip care avea deja sunet,
indiferent dacă a fost pornit din butonul propriu sau din controalele native.
Alternează clipurile noi cu cele vechi în grilă, ca să nu fie două la rând din
același set.

## Cum adaugi un articol de blog

1. Pune imaginea de copertă în `assets/blog/` (orice dimensiune — e decupată automat
   la 16:9, dimensiunea standard folosită de toate articolele; ideal o sursă lată,
   ex. 1600×900).
2. Copiază `blog/sablon-articol.html` într-un fișier nou, ex. `blog/numele-articolului.html`.
3. În fișierul nou, înlocuiește titlul (`<title>`, `og:title`, `<h1>`), descrierea
   (`meta description`, `og:description`), data, imaginea din `.article__cover` și
   conținutul din `.article__body`. Șterge `<meta name="robots" content="noindex, nofollow">`
   (era acolo doar ca șablonul să nu apară în Google).
4. Adaugă un card corespunzător în grila `.blog-grid` din `blog.html` (șterge
   `<p class="blog-empty">` dacă e primul articol adăugat):

```html
<a class="blog-card" href="blog/numele-articolului.html">
  <div class="blog-card__image">
    <img src="assets/blog/nume-imagine.webp" alt="Descriere scurtă" width="1600" height="900" loading="lazy">
  </div>
  <div class="blog-card__body">
    <p class="blog-card__date">23 iulie 2026</p>
    <h2 class="blog-card__title">Titlul articolului</h2>
    <p class="blog-card__excerpt">1-2 propoziții care rezumă articolul.</p>
    <span class="blog-card__link">Citește articolul
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </span>
  </div>
</a>
```

Articolele noi le adaugi la începutul grilei, ca să apară primele.

Adaugă și un `<url>` nou pentru articol în `sitemap.xml`.

## SEO: robots.txt și sitemap.xml

`robots.txt` permite indexarea întregului site și trimite spre `sitemap.xml`.
`sitemap.xml` listează paginile publice (acasă, blog, articole, pagini legale) —
actualizează-l când adaugi o pagină nouă sau un articol nou. Pagina șablon
(`blog/sablon-articol.html`) nu apare în sitemap și are `noindex, nofollow`.

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

## Butonul WhatsApp sticky

Elementul `.wa-sticky` din `index.html` (poza + numele lui Victor Prodan) e fixat jos,
pe mijlocul ecranului, vizibil tot timpul cât utilizatorul dă scroll — pe orice
dispozitiv, inclusiv mobil. Deschide WhatsApp la +40 728 541 017 cu mesaj precompletat — schimbă numărul, poza
(`assets/victor-avatar.webp`), numele sau mesajul direct în `index.html`.

## De completat ulterior

- Linkurile sociale din footer (LinkedIn / Instagram / TikTok) sunt `#` momentan.
- Testimonialele 2 și 3 (The Hive, Piky) sunt placeholder — înlocuiește-le cu citate reale
  (caută `PLACEHOLDER` în `index.html`).
