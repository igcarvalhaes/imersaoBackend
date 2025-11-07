import "dotenv/config";
import { envSchema } from "../schemas/env.js";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Variaveis de ambiente invalidas:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
