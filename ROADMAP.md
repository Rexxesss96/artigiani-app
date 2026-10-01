# Roadmap — TrovArtigiano

Piattaforma per trovare artigiani/imprese locali per mestiere. Next.js (App Router) + Drizzle ORM + Postgres + Better Auth + tRPC.

Questo file è la fonte di verità su **a che punto siamo**. Non fidarti della memoria di nessuna chat: se un dettaglio manca qui, non è "successo" a livello di progetto — aggiornalo qui appena si chiude un passo.

## Come lavoriamo

- Da ottobre 2026 il codice lo scrive **Claude**, una feature alla volta, e spiega ogni volta cosa ha fatto e perché (il progetto serve anche all'utente per imparare JavaScript/TypeScript). L'utente decide la direzione e può fermare o cambiare qualsiasi cosa.
- Flusso git: un branch per feature → PR su GitHub (`Rexxesss96/artigiani-app`) → typecheck + eslint verdi → review → merge su `main`. Claude fa il merge (autorizzato dall'utente).
- Review: CodeRabbit ha un limite di una review all'ora sul piano attuale; Claude rilegge comunque il diff prima di ogni merge.
- A ogni passo completato, aggiornare questo file (spuntare, spostare la riga "prossimo passo").

## Stato milestone

### ✅ Milestone 1 — Setup
Next.js + Drizzle ORM + driver Postgres. Schema DB iniziale: `user`/`session`/`account`/`verification` (Better Auth), `categories`, `companies`, `companies_categories`, `reviews`, `quote_requests`.

### ✅ Milestone 2 — Autenticazione
Better Auth con campi custom (`role`, `firstName`, `lastName`). Pagine login/register, navbar consapevole della sessione. Query cache pulita al logout.

### ✅ Milestone 3 — Impresa: registrazione, categorie, profilo pubblico
- ✅ tRPC setup (router `_app`, `companies`, `categories`)
- ✅ Registrazione impresa (`companies.create`, form in `app/(dashboard)/company/page.tsx`) — transazione atomica: crea impresa + collega categorie + promuove utente a ruolo `company`
- ✅ Selezione categorie/mestieri in fase di registrazione (`companies_categories`)
- ✅ Pagina profilo pubblico impresa (`companies.getById` + `app/(public)/companies/[id]/page.tsx`, Server Component — primo pezzo scritto senza `"use client"`)

### ✅ Milestone 4 — Ricerca pubblica imprese
- ✅ `companies.search` — query pubblica con filtri opzionali (`categoryId`, `city`), città case-insensitive e parziale, max 50 risultati ordinati per nome
- ✅ `app/(public)/page.tsx` — form di ricerca (`next/form`, filtri nell'URL) + lista risultati con link ai profili impresa della Milestone 3

### ✅ Milestone 5 — Richieste di preventivo
- ✅ Router `quoteRequests` (`create`, `listSent`, `listReceived`, `updateStatus`), regole verificate lato server: niente richieste alla propria impresa, una sola richiesta `pending` per impresa, solo l'impresa destinataria cambia lo stato e solo da `pending`
- ✅ Form "Request a quote" nel profilo impresa, pagina `/requests` per il cliente, richieste ricevute con Accept/Reject nella dashboard `/company`

### ✅ Milestone 6 — Recensioni
- ✅ Router `reviews` (`listByCompany` pubblico con media, `canReview`, `create`)
- ✅ Può recensire solo chi ha una richiesta di preventivo **accettata** da quell'impresa, una sola volta
- ✅ Voto medio, lista recensioni e form nel profilo impresa

### ✅ Milestone 7 — Rifinitura (deploy rimandato)
- ✅ Titoli delle pagine e bottoni leggibili con il tema scuro
- ✅ Interfaccia in italiano e inglese con selettore IT/EN nella navbar (`lib/i18n/`): lingua salvata nel cookie `lang`, altrimenti quella del browser, altrimenti italiano. Tradotti anche errori del server, mestieri e date
- ✅ Dati demo e account di prova: `npm run db:seed:demo` (vedi README)
- ✅ Nuova interfaccia grafica: token di colore e classi riutilizzabili (`.card`, `.btn`, `.input`...) in `globals.css`, tema chiaro/scuro, layout mobile
- ✅ Modifica del profilo impresa dalla dashboard (`companies.update`, form riutilizzabile `CompanyForm`)
- ✅ Mappa OpenStreetMap nel profilo impresa; coordinate calcolate dall'indirizzo con Nominatim alla registrazione e quando cambia l'indirizzo
- ⬜ Deploy su Vercel + database Postgres online (rimandato: per ora l'app resta in locale)

### ✅ Milestone 8 — Nuove funzioni (ottobre 2026)
- ✅ Nome dell'app: **TrovArtigiano** (`lib/brand.ts`), uguale in tutte le lingue
- ✅ Home: illustrazione "cantiere" in SVG e tessere dei mestieri con icone
- ✅ Preventivo vero: l'impresa accetta con importo (salvato in centesimi) e messaggio, o rifiuta con un messaggio
- ✅ Dashboard impresa con menu laterale (Panoramica, Richieste, Profilo, Recensioni) e contatore delle richieste in attesa nella navbar
- ✅ Logo e fino a 8 foto dei lavori (`uploads/` + `server/storage.ts`, Route Handler `/api/uploads`)
- ✅ Pagina account: dati personali, cambio password, eliminazione account; il cliente può annullare una richiesta in attesa
- ✅ Home: vista "Mappa" con tutte le imprese (Leaflet + OpenStreetMap) e ordinamento per voto

### 🔶 Milestone 9 — Lavori piccoli e grandi
- ✅ **Lavori con più imprese**: il cliente pubblica un lavoro (mestiere, città, descrizione, foto, urgenza, dimensione, budget) e lo invia fino a 5 imprese; confronta i preventivi, sceglie, segna come completato; la recensione si sblocca solo a lavoro completato
- ⬜ Pronto intervento e zona servita (km) delle imprese, filtro "pronto intervento"
- ⬜ Chat tra cliente e impresa dentro ogni richiesta, con proposta di sopralluogo (data e ora)
- ⬜ Avvisi nell'app anche per il cliente (nuovi preventivi, nuovi messaggi)

### Idee per il futuro
- Deploy online (rimandato: l'app resta in locale). Servirà anche spostare le immagini su uno storage cloud: basta cambiare `server/storage.ts`
- Notifiche email quando arriva o cambia una richiesta di preventivo
- Messaggi tra cliente e impresa dentro la richiesta (una piccola chat)
- Vincolo unico nel database "una recensione per cliente per impresa" (oggi è controllato solo nel codice)
- Paginazione dei risultati di ricerca (oggi massimo 50)
- Test automatici (unit test sui router tRPC, test end-to-end con Playwright)
