import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";
import { loginUserSchema } from "../../schemas/login.js";
import { verifyPassword } from "../../utils/hash.js";

type LoginUserInput = z.infer<typeof loginUserSchema>;

export async function login(app: FastifyInstance) {
  app.post<{ Body: LoginUserInput }>("/login", async (request, reply) => {
    const { email, password } = request.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(400).send({ message: "Usuario não encontrado" });
    }

    const isPassword = await verifyPassword(password, user.password);

    if (!isPassword) {
      return reply.status(400).send({ message: "Senha incorreta" });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });

    return reply.status(200).send({ token: token });
  });
}
