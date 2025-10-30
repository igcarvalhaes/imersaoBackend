"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var fastify_1 = require("fastify");
var app = (0, fastify_1.default)();
var livros = [];
//  publicar livro
app.post("/livros", function (request, reply) {
    var _a = request.body, nome = _a.nome, autor = _a.autor, preco = _a.preco, quantidade = _a.quantidade;
    if (!nome || !autor || !preco || !quantidade) {
        return reply
            .status(400)
            .send({ message: "Todos os campos são obrigatórios" });
    }
    var livro = {
        id: (0, crypto_1.randomUUID)(),
        nome: nome,
        autor: autor,
        preco: preco,
        quantidade: quantidade,
    };
    livros.push(livro);
    return reply
        .status(201)
        .send({ message: "Livro criado com sucesso!", livro: livro });
});
app.get("/", function () {
    return { message: "Hello World" };
});
app.listen({ port: 3000 }, function () {
    console.log("Server is running on http://localhost:3000");
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
