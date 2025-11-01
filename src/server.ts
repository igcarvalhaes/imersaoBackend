import fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { createUser } from "./routes/usuarios/create-user.js";
import { login } from "./routes/usuarios/login.js";
import fastifyJwt from "@fastify/jwt";
import { criarLivros } from "./routes/livros/criar-livros.js";
import { listarLivros } from "./routes/livros/listar-livros.js";
import { atualizarLivros } from "./routes/livros/atualizar-livros.js";
import { removerLivros } from "./routes/livros/remover-livros.js";
import { profile } from "./routes/usuarios/profile.js";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

// criar usuario
app.register(createUser);

// logar usuario
app.register(login);

// profile
app.register(profile);

app.register(fastifyJwt, {
  secret: "secret",
});

//  publicar livro
app.register(criarLivros);

// listar livros
app.register(listarLivros);

// atualizar livros
app.register(atualizarLivros);

app.register(removerLivros);

app.get("/", () => {
  return { message: "Hello World" };
});

app.listen({ port: 3000 }, () => {
  console.log("Server rodando no http://localhost:3000");
});
