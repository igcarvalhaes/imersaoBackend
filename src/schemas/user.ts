import { z } from "zod";

export const createUserSchema = z.object({
  nome: z.string(),
  email: z.string().email(),
  password: z.string().min(8, "Senha muito curta"),
});

export const userResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
});

export const userAlreadyExistResponseSchema = z.object({
  message: z.string(),
});
