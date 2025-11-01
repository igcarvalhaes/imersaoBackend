import type { FastifyInstance } from "fastify";

export async function profile(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.status(401).send({ error: "Você precia estar logado." });
    }
  });
  app.get("/profile", async (request) => {
    return request.user;
  });
}
