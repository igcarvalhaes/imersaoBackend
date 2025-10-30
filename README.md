# 📚 API CRUD de Livros - Documentação Completa

## 🎯 Visão Geral

Esta é uma API RESTful desenvolvida em **TypeScript** utilizando o framework **Fastify** para gerenciar um catálogo de livros. A aplicação implementa todas as operações CRUD (Create, Read, Update, Delete) seguindo as melhores práticas de desenvolvimento de APIs.

## 🛠️ Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript
- **TypeScript**: Superset do JavaScript com tipagem estática
- **Fastify**: Framework web rápido e eficiente para Node.js
- **UUID**: Para geração de identificadores únicos

## 🏗️ Arquitetura da Aplicação

### Imports e Dependências

```typescript
import { randomUUID } from "crypto";
import fastify from "fastify";
```

- **`randomUUID`**: Função nativa do Node.js para gerar IDs únicos
- **`fastify`**: Framework principal da aplicação

### Inicialização do Servidor

```typescript
const app = fastify();
```

Cria uma instância do servidor Fastify com configurações padrão.

### Modelagem de Dados

```prisma
model Livros {
  id         String   @id @default(uuid())
  nome       String
  autor      String
  preco      Int
  quantidade Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

O projeto utiliza **Prisma** como ORM — o model `Livros` está definido no arquivo `prisma/schema.prisma` (exemplo acima). No código usamos o `PrismaClient` (importado de `@prisma/client`) e acessamos `prisma.livros` para operações de banco de dados.

Exemplo de import no `server.ts`:

```typescript
import { prisma } from "./lib/prisma"; // exportado em src/lib/prisma.ts
```

Observação: anteriormente o projeto usava um array em memória como exemplo; após integrar o Prisma todas as operações CRUD gravam/consultam na base configurada em `DATABASE_URL`.

## 🔄 Operações CRUD Implementadas

### 1. **CREATE** - Criar Novo Livro (Prisma + Zod)

```http
POST /livros
```

**Código Implementado (exemplo real usando Prisma + Zod):**

```typescript
app.post(
  "/livros",
  {
    schema: {
      body: z.object({
        nome: z.string(),
        autor: z.string(),
        preco: z.number(),
        quantidade: z.number(),
      }),
      response: {
        201: z.object({
          id: z.string(),
          nome: z.string(),
          autor: z.string(),
          preco: z.number(),
          quantidade: z.number(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
        500: z.object({ error: z.string() }),
      },
    },
  },
  async (request, reply) => {
    const { nome, autor, preco, quantidade } = request.body;

    try {
      const newBook = await prisma.livros.create({
        data: { nome, autor, preco, quantidade },
      });
      return reply.status(201).send(newBook);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao criar livro" });
    }
  }
);
```

**Notas:**

- A validação do `body` é feita via Zod (integrado com `fastify-type-provider-zod`), então o Fastify já retorna 400 para payloads inválidos.
- O retorno é o objeto criado pelo Prisma, que inclui `createdAt` e `updatedAt`.

### 2. **READ** - Listar Todos os Livros (Prisma)

```http
GET /livros
```

**Código Implementado:**

```typescript
app.get(
  "/livros",
  {
    schema: {
      response: {
        200: z.array(
          z.object({
            id: z.string(),
            nome: z.string(),
            autor: z.string(),
            preco: z.number(),
            quantidade: z.number(),
            createdAt: z.date(),
            updatedAt: z.date(),
          })
        ),
      },
    },
  },
  async () => {
    return await prisma.livros.findMany();
  }
);
```

Retorna todos os registros da tabela `livros`.

### 3. **UPDATE** - Atualizar Livro Existente (Prisma)

```http
PUT /livros/:id
```

**Código Implementado:**

```typescript
app.put(
  "/livros/:id",
  {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        nome: z.string(),
        autor: z.string(),
        preco: z.number(),
        quantidade: z.number(),
      }),
      response: {
        200: z.object({
          id: z.string(),
          nome: z.string(),
          autor: z.string(),
          preco: z.number(),
          quantidade: z.number(),
          createdAt: z.date(),
          updatedAt: z.date(),
        }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    const { nome, autor, preco, quantidade } = request.body;

    try {
      const updated = await prisma.livros.update({
        where: { id },
        data: { nome, autor, preco, quantidade },
      });
      return reply.status(200).send(updated);
    } catch (error) {
      return reply
        .status(500)
        .send({ error: "Não foi possível atualizar o livro" });
    }
  }
);
```

### 4. **DELETE** - Remover Livro (Prisma)

```http
DELETE /livros/:id
```

**Código Implementado:**

```typescript
app.delete(
  "/livros/:id",
  {
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.livros.delete({ where: { id } });
      return reply.status(200).send({ message: "Livro removido com sucesso!" });
    } catch (error) {
      return reply.status(404).send({ error: "Livro não encontrado!" });
    }
  }
);
```

## 🛣️ Conceitos de Roteamento

### Rotas Estáticas vs Dinâmicas

- **Rota Estática**: `/livros` - URL fixa
- **Rota Dinâmica**: `/livros/:id` - `:id` é um parâmetro variável

### Tipos de Parâmetros

1. **Parâmetros de Rota**: `/livros/:id`

   - Acessados via `request.params`
   - Usados para identificar recursos específicos

2. **Parâmetros de Query**: `/livros?nome=exemplo&autor=tolkien`

   - Acessados via `request.query`
   - Usados para filtros e paginação

3. **Parâmetros de Body**: `{"nome": "exemplo"}`
   - Acessados via `request.body`
   - Usados para enviar dados complexos (POST, PUT, PATCH)

## 📊 Status Codes HTTP

A API utiliza os seguintes códigos de status:

| Código  | Significado           | Quando Usar                                       |
| ------- | --------------------- | ------------------------------------------------- |
| **200** | OK                    | Operação realizada com sucesso (GET, PUT, DELETE) |
| **201** | Created               | Recurso criado com sucesso (POST)                 |
| **400** | Bad Request           | Dados inválidos ou ausentes                       |
| **404** | Not Found             | Recurso não encontrado                            |
| **500** | Internal Server Error | Erro interno do servidor                          |

## 🔍 Métodos HTTP Utilizados

### GET - Buscar Informações

- **Idempotente**: Múltiplas chamadas retornam o mesmo resultado
- **Sem efeitos colaterais**: Não modifica dados no servidor
- **Cacheable**: Pode ser armazenado em cache

### POST - Criar Recursos

- **Não idempotente**: Cada chamada pode criar um novo recurso
- **Com efeitos colaterais**: Modifica o estado do servidor
- **Não cacheable**: Não deve ser armazenado em cache

### PUT - Atualizar Completamente

- **Idempotente**: Múltiplas chamadas têm o mesmo efeito
- **Substituição completa**: Todos os campos são atualizados
- **Com efeitos colaterais**: Modifica o estado do servidor

### DELETE - Remover Recursos

- **Idempotente**: Múltiplas chamadas têm o mesmo efeito
- **Com efeitos colaterais**: Remove dados do servidor
- **Irreversível**: Operação não pode ser desfeita

## 🔧 Rota de Teste e Inicialização do Servidor

### Rota Raiz - Health Check

```typescript
app.get("/", () => {
  return { message: "Hello World" };
});
```

Esta rota simples serve como um **health check** para verificar se o servidor está funcionando corretamente.

### Inicialização do Servidor

```typescript
app.listen({ port: 3000 }, () => {
  console.log("Server is running on http://localhost:3000");
});
```

**Configuração:**

- **Porta**: 3000
- **Host**: localhost (padrão)
- **Callback**: Função executada quando o servidor inicia

## 🧪 Como Testar a API

### 1. Usando cURL

```bash
# Criar um livro
curl -X POST http://localhost:3000/livros \
  -H "Content-Type: application/json" \
  -d '{"nome":"1984","autor":"George Orwell","preco":30,"quantidade":100}'

# Listar todos os livros
curl http://localhost:3000/livros

# Atualizar um livro
curl -X PUT http://localhost:3000/livros/[ID_DO_LIVRO] \
  -H "Content-Type: application/json" \
  -d '{"nome":"1984 Updated","autor":"George Orwell","preco":35,"quantidade":150}'

# Deletar um livro
curl -X DELETE http://localhost:3000/livros/[ID_DO_LIVRO]
```

### 2. Usando Insomnia/Postman

1. **POST** `/livros` - Criar livro
2. **GET** `/livros` - Listar livros
3. **PUT** `/livros/:id` - Atualizar livro
4. **DELETE** `/livros/:id` - Deletar livro

## 🚀 Como Executar

### Pré-requisitos

```bash
npm install fastify
npm install -D typescript @types/node tsx
```

### Comandos

```bash
# Desenvolvimento (com watch)
npm run dev

# Build
npm run build

# Produção
npm start
```

## 📝 Melhorias Futuras

### 1. Validação Avançada

- Implementar schema de validação com Joi ou Zod
- Validar tipos de dados e formatos

### 2. Persistência de Dados

- Integrar com banco de dados (PostgreSQL, MongoDB)
- Implementar camada de persistência

### 3. Autenticação e Autorização

- JWT tokens
- Middleware de autenticação

### 4. Logging e Monitoramento

- Logs estruturados
- Métricas de performance
- Health checks

### 5. Documentação da API

- Integração com Swagger/OpenAPI
- Documentação automática

### 6. Tratamento de Erros

- Middleware global de erro
- Logs detalhados de erro
- Respostas padronizadas

## 🏛️ Padrões Arquiteturais Utilizados

### REST (Representational State Transfer)

- URLs descritivas
- Uso apropriado de métodos HTTP
- Stateless (sem estado)
- Representação JSON

### MVC Simplificado

- **Model**: Interface `Livros` e array `livros`
- **View**: Respostas JSON
- **Controller**: Handlers das rotas

### CRUD Operations

- **C**reate: POST `/livros`
- **R**ead: GET `/livros`
- **U**pdate: PUT `/livros/:id`
- **D**elete: DELETE `/livros/:id`

---

## 📚 Conceitos de Programação Aplicados

### TypeScript

- **Tipagem Estática**: Prevenção de erros em tempo de desenvolvimento
- **Interfaces**: Contratos de dados bem definidos
- **Type Assertions**: `as Livros` para garantir tipagem

### JavaScript ES6+

- **Destructuring**: `const { nome, autor } = request.body`
- **Template Literals**: Para strings dinâmicas
- **Arrow Functions**: Sintaxe moderna para funções
- **Array Methods**: `findIndex()`, `splice()`, `push()`

### Programação Funcional

- **Funções Puras**: Handlers que não modificam estado global diretamente
- **Imutabilidade**: Criação de novos objetos em vez de modificar existentes
- **Higher-Order Functions**: Callbacks nos métodos de rota

### Tratamento de Erros

- **Validação de Input**: Verificação de campos obrigatórios
- **Status Codes Apropriados**: Comunicação clara de erros
- **Early Return**: Retorno antecipado em caso de erro

---

Esta documentação cobre todos os aspectos principais da aplicação, desde conceitos básicos até implementação técnica detalhada. A API serve como um excelente exemplo de implementação CRUD seguindo boas práticas de desenvolvimento.
