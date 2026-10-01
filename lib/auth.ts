import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { deleteImage } from "@/server/storage";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    // Lets users delete their own account (from the /account page).
    // The database deletes their company, requests and reviews by itself
    // ("on delete cascade"); image files on disk we remove here.
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const company = await db.query.companies.findFirst({
          where: eq(schema.companies.userId, user.id),
          columns: { logoFile: true },
          with: { photos: { columns: { fileName: true } } },
        });
        if (company) {
          await Promise.all(
            [company.logoFile, ...company.photos.map((p) => p.fileName)].map(
              deleteImage,
            ),
          );
        }
      },
    },
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
        input: false, // the role is never decided by the client, only by the server
      },
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
});
