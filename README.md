# TrovArtigiano

Web app per trovare imprese e artigiani della propria zona, chiedere un preventivo e lasciare una recensione. Interfaccia in italiano e inglese.

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM + Postgres, Better Auth, tRPC. Lo stato del progetto è in [ROADMAP.md](ROADMAP.md).

## Avvio in locale

1. Copia `.env.example` in `.env` e compila i valori (database Postgres e `BETTER_AUTH_SECRET`).
2. Installa le dipendenze e prepara il database:

```bash
npm install
npx drizzle-kit migrate
npm run db:seed
```

3. (Facoltativo) Carica i dati demo, vedi sotto:

```bash
npm run db:seed:demo
```

4. Avvia l'app e apri [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

## Account demo

`npm run db:seed:demo` crea 8 imprese in varie città, alcuni lavori con i preventivi delle imprese e alcune recensioni. Tutti gli account demo hanno la password **`Demo1234!`**.

| Email | Ruolo | Cosa puoi provare |
| --- | --- | --- |
| `cliente@demo.test` | Cliente (Giulia Bianchi) | "I miei lavori": un lavoro urgente con 2 preventivi da confrontare, una ristrutturazione con un preventivo e una rinuncia, un lavoro in attesa e uno completato. "Pubblica un lavoro" |
| `impresa@demo.test` | Impresa (Ferrari Impianti, Varese) | Dashboard "La mia impresa": una richiesta urgente in attesa, preventivi inviati, lavori ottenuti, recensioni, logo e foto |
| `luca.moretti@demo.test` | Cliente (Luca Moretti) | Lavori completati e recensiti, uno assegnato, uno urgente in attesa |
| `lucia.colombo@demo.test`, `andrea.russo@demo.test`, `sara.greco@demo.test`, `paolo.marino@demo.test`, `elena.conti@demo.test`, `idraulica.express@demo.test`, `edil.lombardia@demo.test` | Imprese | Altre imprese demo |

Rilanciare lo script cancella e ricrea **solo** gli account `@demo.test` (con le loro imprese, richieste e recensioni): i tuoi account restano intatti.

## Aggiornare il database dopo un `git pull`

Quando lo schema cambia (nuove colonne o tabelle), nel repository arriva una nuova migrazione in `server/db/migrations`. Applicala al tuo database con:

```bash
npx drizzle-kit migrate
```

## Immagini caricate

Loghi e foto delle imprese vengono salvati nella cartella `uploads/` del progetto (esclusa da git) e serviti da `/api/uploads/...`. Tutta la gestione dei file è in `server/storage.ts`.

## Comandi utili

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Avvia l'app in sviluppo |
| `npx tsc --noEmit` | Controllo dei tipi TypeScript |
| `npm run lint` | ESLint |
| `npm run db` | Drizzle Studio, per vedere il database nel browser |
| `npm run db:seed` | Crea i mestieri di base |
| `npm run db:seed:demo` | Crea (o ricrea) i dati demo |
