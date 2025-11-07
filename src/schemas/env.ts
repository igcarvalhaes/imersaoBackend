import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SECRET_JWT: z.string().min(8),
  PORT: z.coerce.number().optional().default(3000),
});
