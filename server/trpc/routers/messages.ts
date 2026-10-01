import { z } from "zod";
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/server/db";
import { quoteRequests, requestMessages } from "@/server/db/schema";

// The conversation inside a quote request: the customer and the company
// can write to each other, and the company can propose a site visit.

// Who am I in this conversation? The customer who posted the job, the
// owner of the company it was sent to, or nobody (= no access).
async function getParticipant(requestId: number, userId: string) {
  const request = await db.query.quoteRequests.findFirst({
    where: eq(quoteRequests.id, requestId),
    columns: { id: true, userId: true, status: true },
    with: { company: { columns: { userId: true } } },
  });

  const role =
    request?.userId === userId
      ? "customer"
      : request?.company.userId === userId
        ? "company"
        : null;

  if (!request || !role) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return { request, role } as const;
}

export const messagesRouter = router({
  // All messages of a request, oldest first. Opening the conversation
  // also marks the other person's messages as read.

  list: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { request } = await getParticipant(
        input.requestId,
        ctx.session.user.id,
      );

      await db
        .update(requestMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(requestMessages.requestId, request.id),
            ne(requestMessages.senderId, ctx.session.user.id),
            isNull(requestMessages.readAt),
          ),
        );

      const messages = await db.query.requestMessages.findMany({
        where: eq(requestMessages.requestId, request.id),
        orderBy: asc(requestMessages.createdAt),
        with: { sender: { columns: { firstName: true } } },
      });

      return messages.map((message) => ({
        id: message.id,
        body: message.body,
        visitAt: message.visitAt,
        visitStatus: message.visitStatus,
        createdAt: message.createdAt,
        senderName: message.sender.firstName,
        // From the point of view of whoever is asking.
        mine: message.senderId === ctx.session.user.id,
      }));
    }),

  send: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        body: z.string().trim().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { request } = await getParticipant(
        input.requestId,
        ctx.session.user.id,
      );
      if (request.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.dict.errors.conversationClosed,
        });
      }

      const [message] = await db
        .insert(requestMessages)
        .values({
          requestId: request.id,
          senderId: ctx.session.user.id,
          body: input.body,
        })
        .returning();
      return message;
    }),

  // The company proposes a site visit ("sopralluogo") on a date and time.

  proposeVisit: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        visitAt: z.coerce.date(),
        body: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { request, role } = await getParticipant(
        input.requestId,
        ctx.session.user.id,
      );
      if (role !== "company" || request.status === "cancelled") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (input.visitAt.getTime() <= Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.dict.errors.visitInPast,
        });
      }

      const [message] = await db
        .insert(requestMessages)
        .values({
          requestId: request.id,
          senderId: ctx.session.user.id,
          body: input.body || null,
          visitAt: input.visitAt,
          visitStatus: "proposed",
        })
        .returning();
      return message;
    }),

  // The customer accepts or declines a proposed visit.

  answerVisit: protectedProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
        accept: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await db.query.requestMessages.findFirst({
        where: eq(requestMessages.id, input.messageId),
        columns: { id: true, requestId: true, visitStatus: true },
      });
      if (!message || message.visitStatus !== "proposed") {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const { role } = await getParticipant(
        message.requestId,
        ctx.session.user.id,
      );
      if (role !== "customer") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(requestMessages)
        .set({ visitStatus: input.accept ? "accepted" : "declined" })
        .where(eq(requestMessages.id, message.id));
    }),
});
