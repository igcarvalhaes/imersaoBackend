import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import z from "zod";
import { idParamsSchema } from "../../schemas/livro.js";

type IdParms = z.infer<typeof idParamsSchema>;

export async function removerLivros(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: "Você precia estar logado." });
    }
  });

  app.delete<{ Params: IdParms }>(
    "/livros/:id",
    {
      schema: {
        params: idParamsSchema,
        response: {
          200: z.object({
            message: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      try {
        const book = await prisma.livros.delete({
          where: { id },
        });
        reply.status(200).send({ message: "Livro removidoo com sucesso" });
      } catch (error) {
        reply.status(404).send({
          error: "Livro não encontrado",
        });
      }
    }
  );
}
