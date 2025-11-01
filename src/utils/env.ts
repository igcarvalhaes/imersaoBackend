import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SECRET_JWT: z.string().min(8),
  PORT: z.coerce.number().optional().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variaveis de ambiente invalidas:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
