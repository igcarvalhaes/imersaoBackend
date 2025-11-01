import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";
import z from "zod";
import {
  createUserSchema,
  userResponseSchema,
  userAlreadyExistResponseSchema,
} from "../../schemas/user.js";
import { hashPassword } from "../../utils/hash.js";

type CreateUserInput = z.infer<typeof createUserSchema>;

export async function createUser(app: FastifyInstance) {
  app.post<{ Body: CreateUserInput }>(
    "/user",
    {
      schema: {
        body: createUserSchema,
        response: {
          201: userResponseSchema,
          400: userAlreadyExistResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { nome, email, password } = request.body;

      const existeUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existeUser) {
        return reply.status(400).send({ message: "Usuário já existe" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          nome,
          email,
          password: hashedPassword,
        },
      });

      return reply.status(201).send(user);
    }
  );
}
