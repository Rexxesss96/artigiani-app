import "dotenv/config";
import { eq, like } from "drizzle-orm";
import { db } from "./index";
import {
  companies,
  companiesCategories,
  quoteRequests,
  reviews,
  user,
} from "./schema";
import { auth } from "@/lib/auth";

// Demo data for trying the app locally: `npm run db:seed:demo`.
//
// Every demo account uses an @demo.test email and the password below.
// Running the script again first deletes the demo accounts (and, thanks
// to "on delete cascade", their companies, requests and reviews), then
// recreates them — your own accounts are never touched.
// See README.md → "Demo accounts" for the list.

const DEMO_PASSWORD = "Demo1234!";
const DEMO_DOMAIN = "@demo.test";

type DemoCompany = {
  owner: { email: string; firstName: string; lastName: string };
  company: {
    businessName: string;
    vatNumber: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    description: string;
    latitude: string;
    longitude: string;
  };
  categorySlugs: string[];
};

const CUSTOMERS = [
  { email: `cliente${DEMO_DOMAIN}`, firstName: "Giulia", lastName: "Bianchi" },
  {
    email: `luca.moretti${DEMO_DOMAIN}`,
    firstName: "Luca",
    lastName: "Moretti",
  },
];

const COMPANIES: DemoCompany[] = [
  {
    owner: {
      email: `impresa${DEMO_DOMAIN}`,
      firstName: "Marco",
      lastName: "Ferrari",
    },
    company: {
      businessName: "Ferrari Impianti",
      vatNumber: "90000000001",
      address: "Via Sacco 5",
      city: "Varese",
      province: "VA",
      postalCode: "21100",
      phone: "0332 123456",
      description:
        "Impianti idraulici ed elettrici per case e uffici. Pronto intervento in giornata su Varese e provincia.",
      latitude: "45.8183",
      longitude: "8.8258",
    },
    categorySlugs: ["plumber", "electrician"],
  },
  {
    owner: {
      email: `lucia.colombo${DEMO_DOMAIN}`,
      firstName: "Lucia",
      lastName: "Colombo",
    },
    company: {
      businessName: "Colombo Legno",
      vatNumber: "90000000002",
      address: "Via Milano 20",
      city: "Como",
      province: "CO",
      postalCode: "22100",
      phone: "031 234567",
      description:
        "Falegnameria artigianale dal 1978: mobili su misura, porte, scale e restauro.",
      latitude: "45.8081",
      longitude: "9.0852",
    },
    categorySlugs: ["carpenter"],
  },
  {
    owner: {
      email: `andrea.russo${DEMO_DOMAIN}`,
      firstName: "Andrea",
      lastName: "Russo",
    },
    company: {
      businessName: "Russo Costruzioni",
      vatNumber: "90000000003",
      address: "Via Padova 30",
      city: "Milano",
      province: "MI",
      postalCode: "20127",
      phone: "02 3456789",
      description:
        "Ristrutturazioni complete, opere murarie e posa di pavimenti e rivestimenti.",
      latitude: "45.4960",
      longitude: "9.2210",
    },
    categorySlugs: ["mason", "tiler"],
  },
  {
    owner: {
      email: `sara.greco${DEMO_DOMAIN}`,
      firstName: "Sara",
      lastName: "Greco",
    },
    company: {
      businessName: "Greco Colori",
      vatNumber: "90000000004",
      address: "Via Tuscolana 100",
      city: "Roma",
      province: "RM",
      postalCode: "00182",
      phone: "06 4567890",
      description:
        "Tinteggiature interne ed esterne, decorazioni e trattamenti antimuffa.",
      latitude: "41.8830",
      longitude: "12.5160",
    },
    categorySlugs: ["house-painter", "painter"],
  },
  {
    owner: {
      email: `paolo.marino${DEMO_DOMAIN}`,
      firstName: "Paolo",
      lastName: "Marino",
    },
    company: {
      businessName: "Marino Serramenti",
      vatNumber: "90000000005",
      address: "Corso Francia 50",
      city: "Torino",
      province: "TO",
      postalCode: "10143",
      phone: "011 5678901",
      description:
        "Finestre, porte blindate e serrature. Sopralluogo e preventivo gratuiti.",
      latitude: "45.0770",
      longitude: "7.6490",
    },
    categorySlugs: ["window-installer", "locksmith"],
  },
  {
    owner: {
      email: `elena.conti${DEMO_DOMAIN}`,
      firstName: "Elena",
      lastName: "Conti",
    },
    company: {
      businessName: "Verde Conti",
      vatNumber: "90000000006",
      address: "Via Crispi 12",
      city: "Varese",
      province: "VA",
      postalCode: "21100",
      phone: "0332 654321",
      description:
        "Progettazione e manutenzione di giardini, potature e prati.",
      latitude: "45.8150",
      longitude: "8.8330",
    },
    categorySlugs: ["gardener"],
  },
];

// Creates a user through Better Auth, so the password is hashed exactly
// like a real sign-up.
async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  const result = await auth.api.signUpEmail({
    body: {
      ...data,
      name: `${data.firstName} ${data.lastName}`,
      password: DEMO_PASSWORD,
    },
  });
  return result.user.id;
}

async function main() {
  console.log("Removing old demo data...");
  await db.delete(user).where(like(user.email, `%${DEMO_DOMAIN}`));

  const allCategories = await db.query.categories.findMany();
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));
  if (categoryIdBySlug.size === 0) {
    throw new Error("No categories found: run `npm run db:seed` first.");
  }

  console.log("Creating customers...");
  const [giuliaId, lucaId] = await Promise.all(CUSTOMERS.map(createUser));

  console.log("Creating companies...");
  const companyIds: number[] = [];
  for (const demo of COMPANIES) {
    const ownerId = await createUser(demo.owner);
    await db.update(user).set({ role: "company" }).where(eq(user.id, ownerId));

    const [company] = await db
      .insert(companies)
      .values({ ...demo.company, userId: ownerId })
      .returning({ id: companies.id });
    companyIds.push(company.id);

    await db.insert(companiesCategories).values(
      demo.categorySlugs.map((slug) => ({
        companyId: company.id,
        categoryId: categoryIdBySlug.get(slug)!,
      })),
    );
  }

  const [ferrari, colombo, russo, greco] = companyIds;

  console.log("Creating quote requests and reviews...");
  await db.insert(quoteRequests).values([
    {
      userId: giuliaId,
      companyId: ferrari,
      message:
        "Perdita dal rubinetto della cucina, servirebbe un intervento entro la settimana.",
      status: "accepted",
      quoteAmountCents: 9000,
      responseMessage:
        "Possiamo passare giovedì mattina. Il prezzo include uscita, manodopera e guarnizioni.",
      respondedAt: new Date(),
    },
    {
      userId: giuliaId,
      companyId: colombo,
      message:
        "Vorrei un preventivo per una libreria su misura di circa 3 metri.",
      status: "pending",
    },
    {
      userId: giuliaId,
      companyId: russo,
      message: "Rifacimento completo del bagno, circa 6 mq.",
      status: "rejected",
      responseMessage: "Purtroppo siamo pieni fino a fine anno. Ci scusiamo!",
      respondedAt: new Date(),
    },
    {
      userId: lucaId,
      companyId: ferrari,
      message: "Sostituzione del quadro elettrico in un appartamento di 80 mq.",
      status: "accepted",
      quoteAmountCents: 85000,
      responseMessage:
        "Quadro nuovo a norma con differenziali, certificazione inclusa. Tempo: 1 giorno.",
      respondedAt: new Date(),
    },
    {
      userId: lucaId,
      companyId: greco,
      message: "Tinteggiatura di soggiorno e due camere.",
      status: "accepted",
      quoteAmountCents: 120050,
      respondedAt: new Date(),
    },
    {
      userId: lucaId,
      companyId: ferrari,
      message: "Installazione di uno scaldabagno elettrico.",
      status: "pending",
    },
  ]);

  await db.insert(reviews).values([
    {
      userId: giuliaId,
      companyId: ferrari,
      rating: 5,
      comment:
        "Puntuali e precisi, hanno risolto il problema in un'ora. Consigliati!",
    },
    {
      userId: lucaId,
      companyId: ferrari,
      rating: 4,
      comment:
        "Ottimo lavoro, prezzo onesto. Solo un piccolo ritardo sull'appuntamento.",
    },
    {
      userId: lucaId,
      companyId: greco,
      rating: 5,
      comment: "Lavoro pulitissimo e colori consigliati benissimo.",
    },
  ]);

  console.log(
    `Done: ${CUSTOMERS.length + COMPANIES.length} demo accounts (password: ${DEMO_PASSWORD}).`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exit(1);
});
