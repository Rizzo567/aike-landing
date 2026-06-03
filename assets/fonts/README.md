# Fonts

## Druk (Commercial Type) — richiesto per la heading "WE'RE DAMN GOOD AT IT" (Sezione 4)

Font a pagamento, **non incluso** nel repo (licenza Commercial Type).
Droppa qui i file convertiti in `.woff2` (+ opzionale `.woff`) con QUESTI nomi esatti:

```
DrukWide-Bold.woff2     (+ DrukWide-Bold.woff)
DrukCond-Bold.woff2     (+ DrukCond-Bold.woff)
```

Il `@font-face` è già pronto in `assets/css/home.css`. La heading usa lo stack:
`'Druk Wide', 'Druk Cond', 'Archivo Black', sans-serif`

- Se droppi solo **Druk Wide** → usato lui.
- Se droppi solo **Druk Condensed** → Wide va in 404 (ignorato) e parte Cond.
- Se non droppi nulla → fallback **Archivo Black** (Google Fonts).

### Note dimensione
Druk **Wide** è molto largo: "WE'RE DAMN" su una riga può sforare.
Se usi Wide, abbassa `font-size` in `.al-heading span` (home.css).
Druk **Condensed** è stretto/alto: combacia meglio col layout 2-righe del reference.

Hai solo gli `.otf`/`.ttf`? Convertili in woff2 (es. `fonttools`, o un convertitore online) prima di metterli qui.
