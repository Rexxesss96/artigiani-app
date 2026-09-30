# Artigiani Directory

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

`npm run db:seed:demo` crea 6 imprese in varie città, alcune richieste di preventivo e alcune recensioni. Tutti gli account demo hanno la password **`Demo1234!`**.

| Email | Ruolo | Cosa puoi provare |
| --- | --- | --- |
| `cliente@demo.test` | Cliente (Giulia Bianchi) | Cercare imprese, inviare richieste, vedere "Le mie richieste", recensire Ferrari Impianti (già fatto) |
| `impresa@demo.test` | Impresa (Ferrari Impianti, Varese) | Dashboard "La mia impresa": richieste ricevute, Accetta/Rifiuta, Modifica profilo |
| `luca.moretti@demo.test` | Cliente (Luca Moretti) | Richieste accettate da Ferrari Impianti e Greco Colori, già recensite; una richiesta in attesa |
| `lucia.colombo@demo.test`, `andrea.russo@demo.test`, `sara.greco@demo.test`, `paolo.marino@demo.test`, `elena.conti@demo.test` | Imprese | Altre imprese demo |

Rilanciare lo script cancella e ricrea **solo** gli account `@demo.test` (con le loro imprese, richieste e recensioni): i tuoi account restano intatti.

## Comandi utili

| Comando | Cosa fa |
| --- | --- |
| `npm run dev` | Avvia l'app in sviluppo |
| `npx tsc --noEmit` | Controllo dei tipi TypeScript |
| `npm run lint` | ESLint |
| `npm run db` | Drizzle Studio, per vedere il database nel browser |
| `npm run db:seed` | Crea i mestieri di base |
| `npm run db:seed:demo` | Crea (o ricrea) i dati demo |
