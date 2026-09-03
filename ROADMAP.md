# Roadmap — Artigiani App

Piattaforma per trovare artigiani/imprese locali per mestiere. Next.js (App Router) + Drizzle ORM + Postgres + Better Auth + tRPC.

Questo file è la fonte di verità su **a che punto siamo**. Non fidarti della memoria di nessuna chat: se un dettaglio manca qui, non è "successo" a livello di progetto — aggiornalo qui appena si chiude un passo.

## Come lavoriamo

- Il codice lo scrive **l'utente** (sta imparando a fare sviluppo web, laureato/a in informatica ma con poca pratica). Claude spiega i concetti, propone il prossimo passo piccolo e concreto, fa review del codice scritto, aiuta con git.
- Un passo alla volta: non si scrive tutta una milestone in un colpo. Si spiega il "perché" prima del "come".
- Flusso git: branch `feat/<nome>` per ogni pezzo di milestone → PR su GitHub (`Rexxesss96/artigiani-app`) → merge su `main`.
- A ogni passo completato e pushato, aggiornare questo file (spuntare, spostare la riga "prossimo passo").

## Stato milestone

### ✅ Milestone 1 — Setup
Next.js + Drizzle ORM + driver Postgres. Schema DB iniziale: `user`/`session`/`account`/`verification` (Better Auth), `categories`, `companies`, `companies_categories`, `reviews`, `quote_requests`.

### ✅ Milestone 2 — Autenticazione
Better Auth con campi custom (`role`, `firstName`, `lastName`). Pagine login/register, navbar consapevole della sessione. Query cache pulita al logout.

### 🔶 Milestone 3 — Impresa: registrazione, categorie, profilo pubblico
- ✅ tRPC setup (router `_app`, `companies`, `categories`)
- ✅ Registrazione impresa (`companies.create`, form in `app/(dashboard)/company/page.tsx`) — transazione atomica: crea impresa + collega categorie + promuove utente a ruolo `company`
- ✅ Selezione categorie/mestieri in fase di registrazione (`companies_categories`)
- ⬜ **Prossimo passo:** pagina profilo pubblico impresa
  - `companies.getById` — query pubblica in `server/trpc/routers/companies.ts` (pattern simile a `getMine`, ma `findFirst` per `id` invece che `userId`)
  - `app/(public)/companies/[id]/page.tsx` — route dinamica, **Server Component** (niente `"use client"`: mostra solo dati, nessuna interattività) — concetto Server vs Client Component da capire bene qui, primo caso in cui esce dal pattern "tutto client" usato finora

### ⬜ Milestone 4 — Ricerca pubblica imprese
- `companies.search` — query pubblica con filtri opzionali (`categoryId`, `city`)
- `app/(public)/page.tsx` — da pagina statica ("Search coming in the next milestone") a form di ricerca + lista risultati, con link ai profili impresa della Milestone 3

### ⬜ Milestone 5 — Richieste di preventivo
- Cliente autenticato invia richiesta a un'impresa (`quote_requests`, stato `pending`)
- Dashboard impresa: vede le richieste ricevute, le accetta/rifiuta

### ⬜ Milestone 6 — Recensioni
- Cliente lascia voto (1-5) + commento su un'impresa (`reviews`)
- Mostrare le recensioni nella pagina profilo impresa (Milestone 3)

### ⬜ Milestone 7 — Rifinitura / deploy (da valutare insieme)
- Mappa con `latitude`/`longitude` (già in schema, non ancora usati)
- Deploy su Vercel
- Altro da decidere quando ci arriviamo
