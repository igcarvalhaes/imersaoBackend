import fastify from "fastify";
import { prisma } from "./lib/prisma.js";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import {
  createBookSchema,
  bookResponseSchema,
  idParamsSchema,
} from "./schemas/livro.js";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

//  publicar livro
app.post(
  "/livros",
  {
    schema: {
      body: createBookSchema,
      response: {
        201: bookResponseSchema,
        500: z.object({
          error: z.string(),
        }),
      },
    },
  },
  async (request, reply) => {
    const { nome, autor, preco, quantidade } = request.body;

    try {
      const newBook = await prisma.livros.create({
        data: {
          nome,
          autor,
          preco,
          quantidade,
        },
      });
      return reply.status(201).send(newBook);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao criar livro" });
    }
  }
);

app.get(
  "/livros",
  {
    schema: {
      response: {
        200: z.array(bookResponseSchema),
        500: z.object({
          error: z.string(),
        }),
      },
    },
  },
  async (_, reply) => {
    try {
      const books = await prisma.livros.findMany();
      reply.send(books);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao buscar livros" });
    }
  }
);

app.put(
  "/livros/:id",
  {
    schema: {
      params: idParamsSchema,
      body: createBookSchema,
      response: {
        200: bookResponseSchema,
        500: z.object({
          error: z.string(),
        }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params;

    const { nome, autor, preco, quantidade } = request.body;

    try {
      const book = await prisma.livros.update({
        where: { id },
        data: {
          nome,
          autor,
          preco,
          quantidade,
        },
      });
      return reply.status(200).send(book);
    } catch (error) {
      reply.status(500).send({ error: "Não foi possível atualizar o livro" });
    }
  }
);

app.delete(
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

app.get("/", () => {
  return { message: "Hello World" };
});

app.listen({ port: 3000 }, () => {
  console.log("Server rodando no http://localhost:3000");
});

//  Métodos HTTP: GET, POST, PUT, DELETE, PATCH
//  CRUD: Create, Read, Update, Delete
//  GET: buscar informaçoes
//  POST: criar informaçoes
//  PUT: atualizar informaçoes de forma completa
//  PATCH: atualizar informaçoes de forma parcial
//  DELETE: deletar informaçoes

// Status Codes
// 200: OK
// 201: Created (criado com sucesso)
// 400: Bad Request (requisição inválida)
// 404: Not Found (não encontrado)
// 500: Internal Server Error (erro no servidor)

// GET /api/produtos/123456 -> buscar o produto com ID 123456
// POST /api/produtos -> criar um novo produto
// PUT /api/produtos/123456 -> atualizar o produto com ID 123456
// DELETE /api/produtos/123456 -> deletar o produto com ID 123456
// PATCH /api/produtos/123456 -> atualizar parcialmente o produto com ID 123456

// Rotas estaticas => /sobre /contato
// Rotas dinamicas => /produtos/:id

// Parametros de rota: /usuarios/123  => req.params.id  (PUT/DELETE)
// Query params: /usuarios?nome=Diego&idade=18 => req.query.nome, req.query.idade
// body params: {"nome": "Diego", "idade": 18} => req.body.nome, req.body.idade    (POST, PUT, PATCH)

// CRUD GET POST PUT DELETE

// GET / livros -> listar todos os livros
// POST / livros -> criar um novo livro
// PUT / livros /: id -> atualizar o livro com ID especifico
// DELETE / livros /: id -> deletar o livro com ID especifico
