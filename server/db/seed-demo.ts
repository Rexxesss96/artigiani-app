import "dotenv/config";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "./index";
import {
  companies,
  companiesCategories,
  companyPhotos,
  jobPhotos,
  jobs,
  quoteRequests,
  reviews,
  user,
} from "./schema";
import { auth } from "@/lib/auth";
import { deleteImage } from "@/server/storage";

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
    emergencyService: boolean;
    serviceRadiusKm: number;
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
      emergencyService: true,
      serviceRadiusKm: 25,
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
      emergencyService: false,
      serviceRadiusKm: 30,
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
      emergencyService: false,
      serviceRadiusKm: 40,
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
      emergencyService: false,
      serviceRadiusKm: 25,
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
      emergencyService: false,
      serviceRadiusKm: 20,
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
      emergencyService: false,
      serviceRadiusKm: 15,
    },
    categorySlugs: ["gardener"],
  },
  {
    owner: {
      email: `idraulica.express${DEMO_DOMAIN}`,
      firstName: "Davide",
      lastName: "Galli",
    },
    company: {
      businessName: "Idraulica Express",
      vatNumber: "90000000007",
      address: "Via Milano 8",
      city: "Gallarate",
      province: "VA",
      postalCode: "21013",
      phone: "0331 112233",
      description:
        "Pronto intervento idraulico 7 giorni su 7: perdite, scarichi otturati, caldaie.",
      latitude: "45.6596",
      longitude: "8.7915",
      emergencyService: true,
      serviceRadiusKm: 30,
    },
    categorySlugs: ["plumber"],
  },
  {
    owner: {
      email: `edil.lombardia${DEMO_DOMAIN}`,
      firstName: "Giorgio",
      lastName: "Rinaldi",
    },
    company: {
      businessName: "Edil Lombardia",
      vatNumber: "90000000008",
      address: "Via Torino 40",
      city: "Milano",
      province: "MI",
      postalCode: "20123",
      phone: "02 9876543",
      description:
        "Ristrutturazioni chiavi in mano: bagni, cucine e appartamenti completi, con direzione lavori.",
      latitude: "45.4605",
      longitude: "9.1840",
      emergencyService: false,
      serviceRadiusKm: 50,
    },
    categorySlugs: ["mason", "tiler"],
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
  // Image files aren't in the database: delete the ones of demo
  // companies by hand, before the rows that point to them disappear.
  const demoCompanies = await db
    .select({ id: companies.id, logoFile: companies.logoFile })
    .from(companies)
    .innerJoin(user, eq(user.id, companies.userId))
    .where(like(user.email, `%${DEMO_DOMAIN}`));
  if (demoCompanies.length > 0) {
    const photos = await db
      .select({ fileName: companyPhotos.fileName })
      .from(companyPhotos)
      .where(
        inArray(
          companyPhotos.companyId,
          demoCompanies.map((c) => c.id),
        ),
      );
    await Promise.all(
      [
        ...demoCompanies.map((c) => c.logoFile),
        ...photos.map((p) => p.fileName),
      ].map(deleteImage),
    );
  }
  // Photos attached to demo customers' jobs, too.
  const demoJobPhotos = await db
    .select({ fileName: jobPhotos.fileName })
    .from(jobPhotos)
    .innerJoin(jobs, eq(jobs.id, jobPhotos.jobId))
    .innerJoin(user, eq(user.id, jobs.userId))
    .where(like(user.email, `%${DEMO_DOMAIN}`));
  await Promise.all(demoJobPhotos.map((p) => deleteImage(p.fileName)));

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

  const [ferrari, colombo, russo, greco, , , express, edil] = companyIds;
  const categoryId = (slug: string) => categoryIdBySlug.get(slug)!;
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

  console.log("Creating jobs, quotes and reviews...");

  // Creates a job and one quote request per company. `answers` says how
  // each company replied (missing = still pending).
  async function createJob(
    job: Omit<typeof jobs.$inferInsert, "id">,
    answers: {
      companyId: number;
      status: (typeof quoteRequests.$inferInsert)["status"];
      quoteAmountCents?: number;
      responseMessage?: string;
    }[],
  ) {
    const [created] = await db.insert(jobs).values(job).returning();
    await db.insert(quoteRequests).values(
      answers.map((answer) => ({
        jobId: created.id,
        userId: job.userId,
        companyId: answer.companyId,
        status: answer.status,
        quoteAmountCents: answer.quoteAmountCents ?? null,
        responseMessage: answer.responseMessage ?? null,
        respondedAt: answer.status === "pending" ? null : job.createdAt,
        createdAt: job.createdAt,
      })),
    );
  }

  // ---------- Giulia ----------
  // Small urgent job: two plumbers answered, she has to choose.
  await createJob(
    {
      userId: giuliaId,
      categoryId: categoryId("plumber"),
      title: "Perdita dal rubinetto della cucina",
      description:
        "Il rubinetto della cucina gocciola forte anche da chiuso e c'è acqua sotto il lavello. Servirebbe un intervento il prima possibile.",
      city: "Varese",
      address: "Via Dandolo 3",
      urgency: "urgent",
      size: "small",
      budget: "under_200",
      createdAt: daysAgo(1),
    },
    [
      {
        companyId: ferrari,
        status: "quoted",
        quoteAmountCents: 9000,
        responseMessage:
          "Possiamo passare domani mattina. Il prezzo include uscita, manodopera e guarnizioni.",
      },
      {
        companyId: express,
        status: "quoted",
        quoteAmountCents: 7500,
        responseMessage: "Passo oggi pomeriggio entro le 18. Ricambi esclusi.",
      },
    ],
  );

  // Big job: a renovation, one company declined, one sent a quote.
  await createJob(
    {
      userId: giuliaId,
      categoryId: categoryId("mason"),
      title: "Ristrutturazione completa del bagno",
      description:
        "Bagno di circa 6 mq: rifacimento di pavimento e rivestimenti, sostituzione sanitari e piatto doccia al posto della vasca.",
      city: "Milano",
      urgency: "flexible",
      size: "large",
      budget: "over_5000",
      createdAt: daysAgo(5),
    },
    [
      {
        companyId: russo,
        status: "rejected",
        responseMessage: "Purtroppo siamo pieni fino a fine anno. Ci scusiamo!",
      },
      {
        companyId: edil,
        status: "quoted",
        quoteAmountCents: 850000,
        responseMessage:
          "Preventivo indicativo: per quello definitivo proponiamo un sopralluogo gratuito. Durata lavori circa 2 settimane.",
      },
    ],
  );

  // Still waiting for an answer.
  await createJob(
    {
      userId: giuliaId,
      categoryId: categoryId("carpenter"),
      title: "Libreria su misura per il soggiorno",
      description:
        "Libreria a parete di circa 3 metri per 2,5 in legno chiaro, con un vano per la TV.",
      city: "Como",
      urgency: "flexible",
      size: "large",
      budget: "1000_5000",
      createdAt: daysAgo(2),
    },
    [{ companyId: colombo, status: "pending" }],
  );

  // Done and reviewed.
  await createJob(
    {
      userId: giuliaId,
      categoryId: categoryId("plumber"),
      title: "Sostituzione del sifone del lavandino",
      description: "Il sifone del bagno perde, va sostituito.",
      city: "Varese",
      urgency: "week",
      size: "small",
      budget: "under_200",
      status: "completed",
      createdAt: daysAgo(40),
      completedAt: daysAgo(35),
    },
    [{ companyId: ferrari, status: "accepted", quoteAmountCents: 6000 }],
  );

  // ---------- Luca ----------
  await createJob(
    {
      userId: lucaId,
      categoryId: categoryId("electrician"),
      title: "Nuovo quadro elettrico",
      description:
        "Sostituzione del quadro elettrico in un appartamento di 80 mq, con certificazione.",
      city: "Varese",
      urgency: "week",
      size: "large",
      budget: "200_1000",
      status: "completed",
      createdAt: daysAgo(30),
      completedAt: daysAgo(25),
    },
    [
      {
        companyId: ferrari,
        status: "accepted",
        quoteAmountCents: 85000,
        responseMessage:
          "Quadro nuovo a norma con differenziali, certificazione inclusa. Tempo: 1 giorno.",
      },
    ],
  );

  await createJob(
    {
      userId: lucaId,
      categoryId: categoryId("house-painter"),
      title: "Tinteggiatura soggiorno e due camere",
      description:
        "Pareti e soffitti, circa 90 mq di superficie. Colori chiari.",
      city: "Roma",
      urgency: "flexible",
      size: "large",
      budget: "1000_5000",
      status: "completed",
      createdAt: daysAgo(20),
      completedAt: daysAgo(12),
    },
    [{ companyId: greco, status: "accepted", quoteAmountCents: 120050 }],
  );

  // Assigned, not finished yet.
  await createJob(
    {
      userId: lucaId,
      categoryId: categoryId("plumber"),
      title: "Installazione scaldabagno elettrico",
      description: "Scaldabagno da 80 litri in sostituzione di quello vecchio.",
      city: "Varese",
      urgency: "week",
      size: "small",
      budget: "200_1000",
      status: "assigned",
      createdAt: daysAgo(4),
    },
    [
      {
        companyId: ferrari,
        status: "accepted",
        quoteAmountCents: 35050,
        responseMessage:
          "Scaldabagno incluso, installazione in mezza giornata.",
      },
      { companyId: express, status: "not_selected", quoteAmountCents: 39000 },
    ],
  );

  // A new urgent request still waiting for Ferrari Impianti's answer.
  await createJob(
    {
      userId: lucaId,
      categoryId: categoryId("plumber"),
      title: "Scarico della doccia otturato",
      description: "L'acqua non scende più dallo scarico della doccia.",
      city: "Varese",
      urgency: "urgent",
      size: "small",
      budget: "under_200",
      createdAt: daysAgo(0),
    },
    [
      { companyId: ferrari, status: "pending" },
      { companyId: express, status: "pending" },
    ],
  );

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
