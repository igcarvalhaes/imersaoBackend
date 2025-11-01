import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import z from "zod";
import { createBookSchema, bookResponseSchema } from "../../schemas/livro.js";

type CreateBookInput = z.infer<typeof createBookSchema>;

export async function criarLivros(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: "Você precia estar logado." });
    }
  });

  app.post<{ Body: CreateBookInput }>(
    "/livros",
    {
      schema: {
        body: createBookSchema,
        response: {
          201: bookResponseSchema,
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { nome, autor, preco, quantidade } = request.body;

      try {
        const newBook = await prisma.livros.create({
          data: {
            nome,
            autor,
            preco,
            quantidade,
          },
        });
        return reply.status(201).send(newBook);
      } catch (error) {
        return reply.status(500).send({ error: "Erro ao criar livro" });
      }
    }
  );
}
