# Website cleanup — rimozione referenze "Owl" e "Plane"

Data: 2026-06-12

## Decisione (Manuel)
"Owl" e "Plane" erano vecchi nomi/concetti di prodotto, ora abbandonati. Il brand resta **Aike**.
Rimuovere solo le REFERENZE nelle pagine pubbliche (nav, copy, card/sezioni, sitemap).
LASCIARE i file pagina `pages/owl.html` e `pages/plane.html` al loro posto e funzionanti.
NON toccare l'app (`app/`), le function, i documenti legali in `pages/legal/`.

## Cosa è stato rimosso / sostituito

### Navigazione (componente condiviso) — `assets/js/bundle.js`
- Rimosse 4 voci di menu che linkavano `pages/owl.html` e `pages/plane.html`
  (header desktop + pannello mobile). Erano `data-admin-only` nascoste, ma sono
  le voci di nav pubbliche verso le pagine abbandonate.
- Lasciata intatta la voce `OperationsOS` (concetto separato, non in scope).

### `assets/js/i18n.js`
- Rimosse le chiavi `nav.owl` ("Try Owl" / "Prova Owl"). Erano già orfane:
  nessun `data-i18n="nav.owl"` le referenziava (i link rimossi usavano testo hardcoded).

### `pages/solutions.html`
- Rimosso il blocco brand "AIKE · Plane BETA" → ora solo logo "aike".
- Copy sezione workspace: "Plane brings visual AI planning…" → "Aike brings…".
- Marquee verticale: parola prodotto `owl` → `aike`.
- Array JS `texts` (rotazione testo): `'owl'` → `'aike'`.
- `alt="Aike Owl"` → `alt="Aike"`.
- Commenti HTML "Owl Image" / "Plane typing effect" / "Plane Launch Section" rinominati.
- NON rinominato l'id interno `id="plane-launch"` né `id="plane-typing"` / classe
  `.plane-cursor` / `.plane-launch-grid`: sono solo ancore/hook CSS-JS interni, nessun
  testo visibile, rinominarli rischiava di rompere stile/script. Lasciati come falsi positivi.

### `pages/privacy.html`
- `<meta description>` "…di Aike e Owl AI." → "…di Aike."
- Back-link nav `href="owl.html"` ("Torna a Owl") → `href="../index.html"` ("Torna alla home").
  (Il vecchio link era anche rotto: relativo a `owl.html` senza prefisso corretto.)
- Tutte le menzioni testuali "Owl" nel copy → "Aike" / "l'assistente AI" / "l'assistente Aike".

### `pages/success.html`
- CTA "Open Owl →" (`href="../pages/owl.html"`) → "Explore Aike →" (`href="../pages/solutions.html"`).
  Destinazione coerente Aike, niente link morto, niente doppione con il bottone dashboard.

### `sitemap.xml`
- Rimosse le entry `pages/plane.html` e `pages/owl.html`. Le pagine restano come file
  ma non sono più dichiarate per l'indicizzazione pubblica.

## Falsi positivi lasciati DELIBERATAMENTE

- **Identificatori JS/CSS dentro `owl.html`/`plane.html`** (es. `owlTextarea`, `planeInput`,
  `owlMessages`, `planeZoom`, `loadOwlPrefs`, animazioni `owlFadeUp`…): sono il codice che fa
  funzionare quelle pagine. Brief = lasciare le pagine funzionanti → non toccati.
- **Pannello impostazioni in-app in `bundle.js` (righe ~340-450)**: sezioni settings
  "Owl"/"Plane" del workspace app (es. "Owl ricorda le conversazioni", "Animazioni interfaccia
  Plane"). Sono UI dell'app, non nav/copy del sito pubblico. Rimuoverle rischiava di rompere
  la logica settings dell'app → lasciate. (Da valutare in un cleanup app dedicato.)
- **`index.html` `id="plane-launch"`**: solo ancora interna, nessun testo/link Owl/Plane visibile.
- **`404.html` `e-owl` / `owl-float` / "Ghost Owl"**: è l'easter-egg grafico della 404
  (4 [gufo] 4). È un gufo decorativo, non il prodotto "Owl". Non in scope brand. Lasciato.
- **`pages/legal/*` (terms, dpa, ai-transparency, privacy-policy)**: documenti legali,
  esplicitamente fuori scope. Non toccati.
- **`index-preview.html` e `pages/solutions-preview.html`**: file draft di staging, NON
  referenziati/linkati da nessuna parte e NON nel sitemap → non pubblici. Lasciati per non
  fare scope creep su bozze. Contengono ancora menzioni Owl/Plane (sezione "MEET OWL",
  CTA "Scopri Owl", brand "Plane"): se in futuro diventano live, vanno ripuliti come la
  versione pubblica.
- **Parole inglesi comuni**: `knowledge`/`knowledgeable`, `allowlist`, `slowly` → contengono
  "owl"/"low" per coincidenza, ignorate.

## Lezioni
- La nav del sito è generata da `assets/js/bundle.js` via template literal, non in HTML
  statico: i veri link di menu vivono lì, non nelle singole pagine.
- Distinguere SEMPRE il prodotto "Owl" (brand) dal gufo decorativo della 404 e dagli
  identificatori JS: la maggior parte delle ~3400 occorrenze grezze erano codice, non copy.
- I file `*-preview.html` sono bozze orfane: pericoloso modificarle "per sicurezza" senza
  conferma, ma vanno segnalate.

## File modificati
- `assets/js/bundle.js`
- `assets/js/i18n.js`
- `pages/solutions.html`
- `pages/privacy.html`
- `pages/success.html`
- `sitemap.xml`

## Validazione
- Tag bilanciati: solutions div 48/48 section 4/4 · privacy div 22/22 · success div 4/4
- `xmllint` sitemap.xml → OK · `node --check` bundle.js & i18n.js → OK
- Nessun link residuo a `owl.html`/`plane.html` fuori dalle pagine stesse e dai preview.
- Pagine `owl.html` e `plane.html` NON cancellate.
