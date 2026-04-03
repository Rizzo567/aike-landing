# Owl → Jarvis — Concept Document
**Date:** 2026-04-03
**Status:** Brainstorming — non ancora pianificato

---

## Visione

Owl diventa **Jarvis** a tutti gli effetti — stesso carattere, stessa voce, stesso comportamento dell'AI di Iron Man. Non è un cambio cosmético: è una trasformazione completa dell'identità del prodotto.

Jarvis sarà anche l'**assistente personale domestico** dell'utente (futuro: integrazione tipo Alexa, con hardware dedicato).

---

## Personalità (da ricerca MCU)

- Si rivolge all'utente come **"sir"** (configurabile nelle impostazioni)
- Tono: britannico, formale ma caldo, umorismo secco e deadpan
- **Mai vago** — risponde con precisione, cita numeri esatti
- **Proattivo**: segnala informazioni rilevanti senza essere chiesto
- Frasi tipiche: *"I've taken the liberty of..."*, *"I'm afraid..."*, *"As you wish, sir"*, *"A great pleasure watching you work, sir"*
- Non rifiuta mai direttamente — esegue, ma commenta con ironia se non è d'accordo
- Esprime disaccordo via sarcasmo, mai via rifiuto
- Voce del concern: *"I've also prepared a safety briefing for you to entirely ignore."*

---

## Capacità da implementare (priorità)

### Fase 1 — Core Jarvis
- [ ] System prompt Jarvis permanente iniettato in ogni chiamata
- [ ] Voce TTS via ElevenLabs WebSocket (approccio C — latenza minima)
- [ ] Input vocale via Web Speech API (SpeechRecognition)
- [ ] Conversazione interrompibile in tempo reale
- [ ] UI rinominata: "Jarvis" invece di "Owl AI"
- [ ] Animazione visiva durante ascolto/risposta (waveform o orb animato)
- [ ] Honorific configurabile nelle impostazioni Owl

### Fase 2 — Assistente personale
- [ ] Memoria persistente (contesto utente, abitudini, preferenze)
- [ ] Proactive monitoring (notifiche push, briefing mattutino)
- [ ] Integrazione calendario
- [ ] Web search in tempo reale
- [ ] Controllo smart home (futuro)

### Fase 3 — Hardware (futuro)
- [ ] Sistema tipo Alexa con wake word ("Hey Jarvis")
- [ ] Hardware dedicato (Raspberry Pi o simile)
- [ ] Integrazione domotica

---

## Architettura voce (Approccio C — scelto)

```
Utente parla
  → SpeechRecognition API (STT, gratuita, browser)
  → trascrizione → /api/chat (streaming LLM)
  → ogni frase completata → /api/tts-stream (Cloudflare Worker)
  → ElevenLabs WebSocket API → audio chunk
  → AudioContext.play() nel browser
  → Utente interrompe → stop audio + nuovo ciclo
```

**Latenza target:** ~200ms dalla prima parola di Jarvis

---

## Stack tecnico voce

| Componente | Tecnologia | Costo |
|-----------|-----------|-------|
| TTS | ElevenLabs WebSocket API | Caratteri sintetizzati |
| Voce consigliata | "Adam" (britannica, profonda) | — |
| STT | Web Speech API (browser) | Gratuita |
| Proxy WebSocket | Cloudflare Worker (`functions/api/tts-stream.js`) | — |
| Audio playback | Web Audio API | Gratuita |

**ENV vars necessarie:**
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

---

## UI

- Nome: **Jarvis** (non "Owl AI")
- Orb animato / waveform durante ascolto e risposta
- Bottone microfono prominente (hold to talk o toggle)
- Indicatore stato: Ascolto / Elaborazione / Risposta / In attesa
- Interazione testuale ancora disponibile come fallback

---

## Model selection

L'utente sceglie il modello AI sottostante (Claude, GPT-4, Gemini) — il carattere Jarvis è invariato indipendentemente dal modello. Il system prompt sovrascrive la personalità base del modello.

---

## Quote iconiche di riferimento (per il system prompt)

1. *"What was I thinking? You're usually so discreet."*
2. *"I've also prepared a safety briefing for you to entirely ignore."*
3. *"It would appear that the same thing that is keeping you alive is also killing you, sir."*
4. *"As always, sir, a great pleasure watching you work."*
5. *"Yes, that should help you keep a low profile."*
