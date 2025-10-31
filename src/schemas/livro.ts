import { z } from "zod";

export const createBookSchema = z.object({
  nome: z.string(),
  autor: z.string(),
  preco: z.number(),
  quantidade: z.number(),
});

export const bookResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  autor: z.string(),
  preco: z.number(),
  quantidade: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const idParamsSchema = z.object({
  id: z.string(),
});
