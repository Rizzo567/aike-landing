# aike — Hero Video "Dal magazzino all'aeroporto" (drone flythrough)
### Pacchetto di produzione · keyframe (Nano Banana) + transizioni (Veo 3.1)

Formato: **16:9 orizzontale** · Stile: **low-poly diorama naturale e diurno** (come il video Emons) · Struttura: **8 keyframe → 7 transizioni** (logica first frame / last frame) · **un unico piano-sequenza drone, senza stacchi**.

> ⚠️ I video generati contengono **solo il mondo 3D, niente testo/logo/UI**. Logo gufo aike + headline + CTA si aggiungono dopo in HTML sopra il `<video>`.

---

## 1. L'idea (il percorso)

Un solo movimento di camera drone, continuo:

1. Si parte **vicino al magazzino/hub** di distribuzione: i camion sono alle baie di carico (vista 3/4 dall'alto, ravvicinata).
2. La camera fa **dezoom e arretra verso l'alto e a destra**, come un drone che sale: l'hub rimpicciolisce, si scopre il paesaggio.
3. Da molto in alto si vede **tutto il percorso dei camion** — puntini piccolissimi che corrono lungo la strada attraverso la campagna.
4. Il drone **segue la rotta in avanti** fino a raggiungere **l'aeroporto**.
5. Atterraggio sull'area cargo: **gli aerei atterrano, i camion arrivano e caricano la merce dentro gli aerei**.

Messaggio: *un'unica filiera fluida dalla terra al cielo* — raccontata in un solo volo.

I 7 frame del video originale (per riferimento di stile/colori) sono in `reference-emons/`.

---

## 2. Stile e colori (naturale, come l'originale)

Look **low-poly diorama pulito, luce diurna**, esattamente come l'estetica del video Emons. **Colori verosimili alla realtà**, NON viola:

| Elemento | Colore / resa |
|----------|---------------|
| Cielo | azzurro chiaro con qualche nuvola low-poly bianca |
| Strutture (magazzino, terminal, hangar) | bianco / grigio chiaro, tetti grigi |
| Strade / piste / asfalto | grigio asfalto, segnaletica bianca |
| Alberi / campi / vegetazione | **verde** naturale (più tonalità), prati verde chiaro |
| Acqua (fiumi/laghi) | azzurro naturale |
| Terreno | terra/erba realistici, beige e verdi |
| **Cassoni dei camion** | **viola `#a855f7` con scritta "aike"** in font Suisse Int'l sul fianco, **senza logo**. Cabina/motrice bianca o grigio chiaro |
| Aerei | bianchi/grigio chiaro con un sottile accento viola sulla coda |

**Mondo completo e continuo:** l'ambiente 3D deve riempire **tutta l'inquadratura fino all'orizzonte in ogni direzione** — niente isola che galleggia, niente bordi tagliati, niente vuoto attorno alla terra. È **lo stesso identico mondo** in tutti i frame, visto da punti diversi del volo, così la continuità regge senza stacchi.

**Viola** = solo sui cassoni dei camion e un tocco sulle code degli aerei. Tutto il resto naturale. Luce diurna morbida, ombre soffici, leggera profondità di campo, stile miniatura premium.

**Testo nel video:** l'**unica** scritta ammessa è la parola **"aike"** (Suisse Int'l, senza logo) sui cassoni viola dei camion. Nessun altro testo, logo, numero o UI.

---

## 3. Mappa del percorso — 7 keyframe / 6 transizioni

| Keyframe | Scena | Camera (target) |
|----------|-------|-----------------|
| **F1** | Magazzino/hub, camion alle baie | 3/4 dall'alto, ravvicinata |
| **F2** | Dietro la warehouse, muri trasparenti, interno con scatoloni spostati | orbita dietro, cutaway |
| **F3** | Drone arretra/sale a destra, hub più piccolo, camion escono in strada | aerea media, più in alto |
| **F4** | Vista altissima: camion piccolissimi lungo la strada nella campagna, aeroporto lontano | aerea molto alta, grandangolo |
| **F5** | Aeroporto in vista, un aereo in atterraggio, camion che convergono | alta, in avvicinamento |
| **F6** | Discesa sull'area cargo: aereo atterrato, camion che arrivano | media, in discesa |
| **F7** | Carico: camion scaricano, 2 muletti portano la merce all'aereo (parte dietro aperta) | ferma = F6 |
| **F8** | L'aereo riparte, leggermente in volo verso il fondo in alto a destra | ferma = F7 |

Transizioni: **T1** F1→F2, **T2** F2→F3, **T3** F3→F4, **T4** F4→F5, **T5** F5→F6, **T6** F6→F7, **T7** F7→F8.

---

## 4. KEYFRAME — prompt per Nano Banana (immagini, 16:9)

**F1 è il riferimento d'oro** (già generato, ottimo). Le 5 regole che fanno uscire bene i frame successivi:

1. **Ancora sempre a F1.** Per OGNI frame carica **F1 come immagine di riferimento** (non solo il frame precedente). Se il tool accetta 2 reference, usa F1 + l'ultimo frame buono.
2. **Spostamenti piccoli.** Muovi la camera **di poco per volta**: nessun salto drastico di quota o inquadratura, altrimenti il modello reinventa il mondo. Meglio passi graduali.
3. **Ripeti lo STYLE LOCK** (sotto) all'inizio di ogni prompt: non fidarti solo di "same as reference".
4. **Stesso seed** quando possibile.
5. Prompt in **inglese**, frasi brevi e concrete.

**STYLE LOCK — incolla questo blocco all'inizio di OGNI prompt (F2–F7):**
```
Bright clean low-poly 3D diorama, soft natural daylight, soft shadows, gentle depth of field, matte stylized surfaces — identical world, palette and art style to the reference image. The world: a grey flat-roofed warehouse with rooftop vents and a two-storey office annex on its left side, a row of loading-dock doors along the front, surrounded by a dark asphalt yard with white parking-line markings. Box trucks have white cabs and bright purple (#a855f7) cargo boxes with "aike" in lowercase white sans-serif (Suisse Intl) on the side. Vibrant green fields split by hedgerows, rounded low-poly trees, rolling green hills on the horizon, a winding grey highway with white dashed lines, puffy white low-poly clouds in a clear blue sky. The world fills the whole frame to the horizon — no cut edges, no floating island, no void. The only text anywhere is "aike" on the purple truck boxes; no logos, no UI, no numbers.
```
Sotto, ogni frame aggiunge **solo** la sua istruzione di camera + cosa cambia.

---

### F1 — Magazzino / hub (partenza)
```
Low-poly 3D diorama render, 16:9, bright natural daylight, clean miniature style. A modern logistics distribution warehouse with loading docks; several low-poly delivery trucks parked at the bays and a couple pulling away — each truck has a white/light-grey cab and a PURPLE (#a855f7) cargo box with the word "aike" written on the side in a clean Suisse Intl sans-serif font (lowercase, no logo, no other text). Grey asphalt yard and access road with white markings. The scene sits inside a COMPLETE, CONTINUOUS landscape that fills the entire frame all the way to the horizon: green fields, low-poly trees, hedgerows, distant hills and roads — no cut edges, no floating island, no empty void anywhere around the terrain. Blue sky with a few soft white clouds, realistic natural colors. High 3/4 aerial camera, fairly close to the warehouse, soft sunlight, gentle soft shadows, subtle depth of field, cinematic premium look.
The ONLY text in the image is "aike" on the purple truck boxes. No logos, no UI, no numbers, no other writing.
No photorealism, matte low-poly surfaces, clean vertices.
```

### F2 — Cutaway interno (muri aperti, scatoloni movimentati)
Riferimento: **F1** (+ se possibile il frame precedente).
```
[STYLE LOCK]
Camera: same high 3/4 angle and lighting as the reference, just moved a little closer toward the loading-dock side of the SAME warehouse. The near wall and the roof are removed in a clean dollhouse cutaway (open building), revealing the interior of the same building: tall low-poly storage racking full of cardboard boxes and pallets, low-poly forklifts and small robots actively carrying and stacking boxes along the aisles, conveyor lines moving parcels, a few tiny workers. The purple "aike" trucks are still docked at the bays being loaded. Everything else (yard, roads, fields, hills, trucks, sky) stays exactly as the reference. Small move only, no drastic change of framing.
```
*(Se "dollhouse cutaway / open building" non rende, prova "the front wall is transparent glass so the interior is visible".)*

### F3 — Drone arretra e sale a destra
Riferimento: **F1** (+ frame precedente).
```
[STYLE LOCK]
Camera: a small, smooth move — the drone pulls back and rises a little while drifting slightly to the right. The SAME warehouse (walls solid again) is now a bit smaller toward the lower-left of the frame. More of the green countryside is revealed on the right, where the grey highway leads away with a few purple "aike" trucks starting along it. Same world, same style and lighting as the reference; only the viewpoint is slightly higher and further back. No drastic change of framing.
```

### F4 — Si segue la strada (verso basso-destra, natura + casette)
Riferimento: **F1** (stile) **+ F3** (posizione/strada).
```
Bright clean low-poly 3D diorama, soft natural daylight, soft shadows, gentle depth of field, matte stylized surfaces — keep the world, palette and art style identical to the reference image (box trucks with white cabs and bright purple #a855f7 cargo boxes reading "aike" in lowercase white sans-serif; vibrant green fields split by hedgerows, rounded low-poly trees, rolling green hills, grey roads with white dashed lines, puffy white low-poly clouds in a clear blue sky).
Camera: the drone has moved to follow the SAME road that exits toward the LOWER-RIGHT of the reference image. The warehouse is now small in the upper-left background, being left behind. The grey road with white dashed lines winds away across the green countryside toward the lower-right, lined with clusters of low-poly trees, hedgerows, green fields and a few small low-poly houses / little cottages along the roadside. Several purple "aike" trucks travel along this road, well spaced out. The road continues into the distance toward the lower-right; the airport is NOT here yet (either out of frame or tiny and far on the lower-right horizon). High aerial 3/4 view following the road.
The world fills the whole frame to the horizon — no cut edges, no floating island, no void. The only text anywhere is "aike" on the purple truck boxes; no logos, no UI, no numbers.
```

### F5 — La strada arriva all'aeroporto
Riferimento: **F1** (stile) **+ F4** (posizione/strada).
```
Bright clean low-poly 3D diorama, soft natural daylight, soft shadows, gentle depth of field, matte stylized surfaces — keep the world, palette and art style identical to the reference image (vibrant green fields split by hedgerows, rounded low-poly trees, rolling green hills, grey roads with white dashed lines, puffy white low-poly clouds in a clear blue sky; box trucks with white cabs and bright purple #a855f7 cargo boxes reading "aike" in lowercase white sans-serif).
Camera: still following the SAME road toward the lower-right, the airport now comes into view at the end of the road. Grey runways with white markings, a white low-poly terminal and cargo hangars in the same art style as the warehouse, white low-poly airplanes with a subtle purple tail accent, and one airplane low on final approach about to land. The road leads right up to the airport's cargo entrance, with purple "aike" trucks arriving along it. Still surrounded by green countryside, clusters of low-poly trees, hedgerows and a few small houses. High aerial cinematic view, the airport in the lower-right portion of the frame.
The world fills the whole frame to the horizon — no cut edges, no floating island, no void. The only text anywhere is "aike" on the purple truck boxes; no logos, no UI, no numbers.
```

### F6 — Aereo atterrato (STESSA inquadratura di F5)
Riferimento: **solo F5** (NON allegare F1).
```
Use the EXACT same camera framing, angle, distance and composition as the reference image — do NOT move or change the camera at all. Keep EVERYTHING in the reference pixel-for-pixel identical: the same parked airplanes stay in their exact same positions and the exact same orientation near the hangars (do not rotate, move, add or remove any parked plane), the same purple "aike" trucks on the road, the same houses, trees, fields, runway, hangars, terminal, lighting and low-poly diorama style.
The ONE and ONLY change: the airplane that was in the air on final approach has now LANDED and rolled forward all the way DOWN the runway to its FAR END, deep toward the BACK of the image (the upper part of the runway), wheels on the ground. Keep its heading and orientation EXACTLY the same as in the reference — the nose points toward the far end of the runway (away from the camera) and the purple tail is at the rear toward the foreground. Do NOT flip, mirror or reverse the airplane; same direction as the reference, just moved to the far end of the runway and on the ground. No other differences whatsoever.
The only text anywhere is "aike" on the purple truck boxes; no logos, no UI, no numbers.
```

### F7 — Scarico e carico (STESSA inquadratura di F6)
Riferimento: **solo F6** (NON allegare F1).
```
Use the EXACT same camera framing, angle and composition as the reference image — do NOT move the camera. Keep everything pixel-for-pixel identical to the reference: the same landed airplane in its exact position and orientation, the same parked airplanes near the hangars, the same purple "aike" trucks in their same positions, the same houses, trees, fields, road, hangars, terminal, lighting and low-poly style.
The ONLY changes (the loading action): the landed airplane now has its REAR cargo door/ramp OPEN at the back of the fuselage. The purple "aike" trucks have their rear doors open and are being unloaded, with a few pallets and cardboard boxes on the ground beside them. TWO low-poly forklifts are carrying pallets of cardboard boxes across the apron from the trucks toward the airplane's open rear ramp, loading the cargo. A couple of tiny ground workers. Nothing else changes — same positions, same camera, same scene.
The only text anywhere is "aike" on the purple truck boxes; no logos, no UI, no numbers.
```

### F8 — L'aereo riparte / decollo (STESSA inquadratura di F7)
Riferimento: **solo F7** (NON allegare F1).
```
Use the EXACT same camera framing, angle and composition as the reference image — do NOT move the camera. Keep everything pixel-for-pixel identical to the reference: the same purple "aike" trucks in their exact same positions, the same parked airplanes near the hangars, the same houses, trees, fields, road, hangars, terminal, forklifts, lighting and low-poly style.
The ONLY change: the airplane that was on the runway has now TAKEN OFF and is slightly AIRBORNE — just lifted a little off the tarmac, climbing toward the FAR END of the runway in the TOP-RIGHT / back of the image. Keep its orientation exactly the same: nose toward the TOP-RIGHT, purple tail toward the LOWER-LEFT (do NOT flip or rotate it). It hovers just above the runway, casting its shadow on the tarmac below, rear cargo door now closed. Same plane, same heading, just lifted slightly into the air. No other differences.
The only text anywhere is "aike" on the purple truck boxes; no logos, no UI, no numbers.
```

---

## 5. TRANSIZIONI — prompt per Veo 3.1 (first frame / last frame)

Per ogni transizione: **first frame = F(n)**, **last frame = F(n+1)**, formato **16:9**, durata **3–4 s**. È **un unico volo drone continuo**, quindi i movimenti si concatenano fluidi. Veo 3.1 genera anche l'audio (suggerimento ambient). Per l'hero web di solito si tiene **muto**. Prompt in inglese.

### T1 · F1 → F2 (muri che diventano trasparenti, effetto X-ray)
```
One single continuous cinematic shot, absolutely NO cuts. The camera stays locked on the same warehouse with the same framing (only an extremely subtle, slow drift). The warehouse walls do NOT move, slide, lift, peel or open in any way. Instead, the outer walls gradually turn TRANSPARENT, like an X-ray / see-through glass effect, dissolving so the interior of the building becomes visible. As the walls fade to transparent we see inside: tall racking full of cardboard boxes, forklifts and small robots moving and stacking boxes, the purple conveyors running, and the purple "aike" trucks loading at the docks. Smooth, gradual, seamless. Natural daytime low-poly diorama style, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: soft drone hum, muffled warehouse activity, forklift beeps, light cinematic pad.
```

### T2 · F2 → F3 (i muri ricompaiono e il drone sale)
```
One single continuous cinematic shot, absolutely NO cuts. First the transparent walls of the warehouse gradually turn SOLID again (the X-ray effect reverses, the building becomes opaque). Then the drone smoothly rises and pulls up and back, gaining altitude, revealing the wider green countryside, until it reaches exactly the framing of the last frame, where the camera comes to rest and HOLDS completely still. The warehouse shrinks into the landscape with its roads, fields and a few purple "aike" trucks. Seamless, smooth, no cuts. Natural daylight low-poly diorama, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: rising wind, soft drone hum, ambient pad.
```

### T3 · F3 → F4 (stessa altezza, segue la strada in modo cinematico)
```
One single continuous cinematic shot, absolutely NO cuts. The drone stays at the EXACT same altitude for the whole shot — it does NOT go up or down at all. It simply glides and frames the road cinematically, smoothly moving from the first-frame framing to the last-frame framing, following the road lined with trees, small houses and purple "aike" trucks. Same height throughout, steady cinematic motion. Seamless, no cuts. Natural daylight low-poly diorama, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: gentle wind, soft drone hum, light ambient swell.
```

### T4 · F4 → F5 (stessa altezza, ma veloce fino all'aeroporto)
```
One single continuous cinematic shot, absolutely NO cuts. The drone moves in the exact same way as the previous shot and stays at the EXACT same altitude (it does NOT go up or down), but now travels FAST forward along the road, quickly covering the distance with a clear sense of speed and gentle motion blur, smoothly arriving at the airport and settling into the last-frame framing where an airplane is on final approach. Same height throughout, seamless fast glide, no cuts. Bright natural daylight, low-poly diorama, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: fast wind whoosh, rising drone hum, approaching jet, cinematic build.
```

### T5 · F5 → F6 (camera ferma: atterraggio e corsa in pista)
```
One single continuous cinematic shot, absolutely NO cuts. The drone holds a steady hover with the exact same framing; the camera does NOT move at all. The only thing that moves: the airplane on final approach touches down on the runway and rolls forward all the way down the runway to its far end (toward the top-right), keeping the exact same orientation (nose top-right, purple tail lower-left). Everything else stays perfectly locked. Seamless, natural daylight low-poly diorama, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: jet touchdown, tyres on tarmac, engines winding down.
```

### T6 · F6 → F7 (camera ferma: scarico e carico)
```
One single continuous cinematic shot, absolutely NO cuts. The drone holds the exact same steady framing; the camera does NOT move at all. The only things that move: the purple "aike" trucks open their rear doors, two low-poly forklifts carry pallets of cardboard boxes across the apron, and the airplane's rear cargo ramp opens as the cargo is loaded into it, with a few tiny ground workers. Everything else stays perfectly locked. Lively, seamless, natural daylight low-poly diorama, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: forklift beeps, loading clatter, busy apron ambience.
```

### T7 · F7 → F8 (camera ferma: l'aereo riparte)
```
One single continuous cinematic shot, absolutely NO cuts. The drone holds the exact same steady framing; the camera does NOT move at all. The only thing that moves: the airplane's rear cargo door closes, it taxis forward and gently lifts off, becoming slightly airborne and climbing toward the top-right / far end of the image, casting its shadow on the runway below, keeping the same orientation (nose top-right, purple tail lower-left). Everything else stays perfectly locked. Seamless, natural daylight low-poly diorama, realistic colors. Only the "aike" text on the purple truck boxes.
Ambient audio: engines spooling up, takeoff roll, lift-off whoosh, triumphant finish.
```

> **Loop (opzionale):** una **T8 · F8 → F1** con lento drift verso l'alto/indietro che riporta al magazzino, per chiudere il cerchio senza stacco.

---

## 6. Overlay aike (in HTML, fuori dal video)

Il video resta pulito. Sul sito, sopra il `<video>`, posizioni l'overlay nel terzo sinistro:
- Logo **gufo aike** (`assets/images/logo.png` — il nuovo gufo viola che mi hai dato) + wordmark **"aike"** in **Suisse Int'l**.
- Headline (ultima riga viola `#a855f7`) + sottotitolo grigio + CTA pill viola "Prenota la tua call 🚀".

Vantaggi: testo sempre nitido, responsive, multilingua (IT/EN dal tuo i18n).

---

## 7. Workflow + checklist

- [ ] Salva il **nuovo logo gufo** in `assets/images/logo.png`
- [ ] Genera **F1** (16:9, seed fissato), stile diurno naturale, viola minimo
- [ ] Genera **F2–F8** in chaining (reference = frame precedente; F6/F7/F8 = solo frame precedente, stessa inquadratura)
- [ ] Verifica: colori naturali, mondo continuo senza vuoti, cassoni viola con "aike", nessun'altra scritta
- [ ] Veo 3.1: genera **T1–T7** (first=F n, last=F n+1, 3–4 s, 16:9)
- [ ] (Opzionale) **T8** F8→F1 per il loop
- [ ] Monta in ordine T1→T7, esporta 1920×1080 (o 4K), H.264/H.265
- [ ] Integra come `<video>` (loop, muted, autoplay, playsinline) + `poster`
- [ ] Aggiungi overlay aike in HTML nel terzo sinistro

---

*Cartella: `WEBSITE/aike-website/hero-video/`. Riferimenti stile originale in `reference-emons/`.*
