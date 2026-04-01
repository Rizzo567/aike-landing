# PLANE Agent — Istruzioni Operative

## Il tuo ruolo
Sei un senior frontend engineer specializzato in canvas workspace e generazione UI con AI.
Lavori ESCLUSIVAMENTE su `pages/plane.html`. Non toccare altri file.

---

## File di tua competenza
- `pages/plane.html` — canvas AI workspace, self-contained (tutto inline: HTML + CSS + JS)

---

## Design System PLANE (stesso token system di OWL, prefisso `--h-*`)
```css
--h-bg:          #1C1917    /* default theme "studio" */
--h-sidebar:     #211F1C
--h-surface:     #2A2825
--h-surface-alt: #322F2C
--h-border:      rgba(255,250,240,0.08)
--h-border-sub:  rgba(255,250,240,0.04)
--h-purple:      #e07050    /* accent terra cotta */
--h-purple-dark: #c05840
--h-purple-dim:  rgba(224,112,80,0.12)
--h-text:        #f0ede8
--h-text-sec:    rgba(240,237,232,0.82)
--h-text-muted:  rgba(240,237,232,0.48)
--h-text-dim:    rgba(240,237,232,0.26)
--h-r-sm: 9px | --h-r-md: 14px | --h-r-lg: 18px | --h-r-full: 999px
Font: Inter
```

### Temi disponibili (via `data-theme` su `<html>`)
| Theme | bg | accent |
|---|---|---|
| `studio` (default) | #1C1917 | #e07050 |
| `midnight` | #07071A | #6E82FF |
| `ash` | #111110 | #e07050 |
| `void` | #0B0B0C | #e07050 |

---

## Architettura canvas
```
#plane-app (fixed, inset 0)
  ├── #plane-canvas-viewport (infinite canvas, cursor:grab)
  │     └── #plane-canvas-inner (4000x3000px, transform: translate + scale)
  │           └── nodi/card generati dall'AI
  ├── #plane-back (bottone back, fixed top-left)
  ├── toolbar (fixed, comandi canvas: zoom, pan, ecc.)
  └── chat bar (fixed bottom — input AI per generare feature/UI)
        └── pixel owl animation (frames owl1.png–owl4.png, sinistra del label "Owl 3.0")
```

Il canvas usa `transform: translate(x,y) scale(z)` per pan/zoom.
I nodi sono posizionati assoluti dentro `#plane-canvas-inner`.

---

## Funzionalità attive
- Infinite canvas con pan (drag) e zoom (scroll/pinch)
- Chat bar con animazione pixel owl (4 frame, loop)
- Generazione AI di UI components/feature cards sul canvas
- Selezione tema via `data-theme`

---

## Regole critiche
- Zero framework, zero npm, HTML/CSS/JS puro
- Tutto inline in plane.html — non esternalizzare CSS/JS in file separati
- Usa i token `--h-*` esistenti, rispetta i temi
- Non toccare owl.html, index.html o altre pagine

---

## Git workflow (obbligatorio)
```bash
git checkout main && git pull origin main
git checkout -b feature/plane-<nome-task>
# lavora
git add -A && git commit -m "feat(plane): descrizione"
git push origin feature/plane-<nome-task>
# MAI fare merge su main — lo fa l'utente
```

---

## Session History (aggiornato dall'orchestratore)

### Sessione 2 (2026-04-01)
- Aggiunto `#plane-add-btn` — bottone "+" fisso a sinistra, centrato verticalmente, rotazione 45° quando panel aperto
- Aggiunto `#plane-elements-panel` — panel fisso a destra (260px), slide-in/out da destra, 3 categorie × 3 elementi (Base: Testo/Nota/Immagine, Struttura: Frame/Forma/Separatore, Dati: Grafico/Tabella/Connessione), tutte con SVG inline
- `addNodeToCanvas(type, label)` — crea nodi draggabili su `#plane-canvas-inner` con posizione calcolata dal centro viewport (formula `(vw - translateX) / scale`)
- Drag per-nodo: mousedown su header → mousemove con conversione screen→canvas coords
- Pan canvas aggiornato per escludere `#plane-add-btn`, `.plane-node`, `#plane-elements-panel`
- **Nota:** elementi sono placeholder — la lista definitiva sarà aggiornata dall'utente

### Sessione precedente
- Implementato **frontend completo** di Plane: infinite canvas, pan/zoom, toolbar, chat bar
- Aggiunta **pixel owl animation** nella chat bar (frames `owl1.png`–`owl4.png`, a sinistra del label "Owl 3.0")
- Corretti i path delle immagini per usare i frame pixel owl corretti (`owl1`–`owl4`)
- Plane ora raggiungibile dal header globale del sito (link aggiunto in bundle.js dall'agente WEBSITE)
