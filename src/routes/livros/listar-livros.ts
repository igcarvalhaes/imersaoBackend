import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import z from "zod";
import { bookResponseSchema } from "../../schemas/livro.js";

export async function listarLivros(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: "Você precia estar logado." });
    }
  });

  app.get(
    "/livros",
    {
      schema: {
        response: {
          200: z.array(bookResponseSchema),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (_, reply) => {
      try {
        const books = await prisma.livros.findMany();
        reply.send(books);
      } catch (error) {
        return reply.status(500).send({ error: "Erro ao buscar livros" });
      }
    }
  );
}
