import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import z from "zod";
import {
  createBookSchema,
  bookResponseSchema,
  idParamsSchema,
} from "../../schemas/livro.js";

type UpdateBookInput = z.infer<typeof createBookSchema>;
type IdParams = z.infer<typeof idParamsSchema>;

export async function atualizarLivros(app: FastifyInstance) {
  app.put<{ Body: UpdateBookInput; Params: IdParams }>(
    "/livros/:id",
    {
      schema: {
        params: idParamsSchema,
        body: createBookSchema,
        response: {
          200: bookResponseSchema,
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const { nome, autor, preco, quantidade } = request.body;

      try {
        const book = await prisma.livros.update({
          where: { id },
          data: {
            nome,
            autor,
            preco,
            quantidade,
          },
        });
        return reply.status(200).send(book);
      } catch (error) {
        reply.status(500).send({ error: "Não foi possível atualizar o livro" });
      }
    }
  );
}
