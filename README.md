# 📚 Projeto: API CRUD de Livros — Documentação detalhada (codebase)

Este README documenta, passo a passo, a implementação atual do projeto: organização dos arquivos, implementação dos principais módulos (servidor, rotas, schemas, Prisma, autenticação), exemplos de código reais e instruções para rodar e testar.

Objetivo: ser um guia didático para que você (ou outros desenvolvedores) entendam e estendam a aplicação.

---

## 🗂️ Estrutura do projeto (visão prática)

```
src/
├─ lib/
│  └─ prisma.ts           # exporta const prisma: PrismaClient
├─ routes/
│  ├─ usuarios/
│  │  ├─ criar-usuario.ts
│  │  ├─ login.ts
│  │  └─ profile.ts
│  └─ livros/
│     ├─ criar-livros.ts
│     ├─ listar-livros.ts
│     ├─ atualizar-livros.ts
│     └─ remover-livros.ts
├─ schemas/
│  ├─ user.ts             # Zod schemas relacionados a User
│  └─ livro.ts            # Zod schemas para Livro
├─ utils/
│  └─ hash.ts             # hashPassword, comparePassword
└─ server.ts              # instancia Fastify, registra plugins e rotas

prisma/
├─ schema.prisma          # models (Livros, User, etc.)

README.md                 # este arquivo
AUTH.md                   # guia de autenticação JWT
```

---

## ⚙️ server.ts — configuração principal do Fastify

Resumo do contrato deste arquivo:

- cria a instância do Fastify
- registra integrações (Zod type provider, JWT, compilers)
- registra rotas (via `app.register(...)`)
- inicia o servidor

Exemplo (trecho representativo):

```ts
// src/server.ts
import fastify from "fastify";
import {
  ZodTypeProvider,
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import fastifyJwt from "@fastify/jwt";
import createUser from "./routes/usuarios/criar-usuario";
import login from "./routes/usuarios/login";
import profile from "./routes/usuarios/profile";
import livrosRouter from "./routes/livros/index";

const app = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "dev_secret",
  sign: { expiresIn: "1h" },
});

app.register(createUser);
app.register(login);
app.register(profile);
app.register(livrosRouter, { prefix: "/livros" });

app.get("/", async () => ({ message: "Hello World" }));

app
  .listen({ port: Number(process.env.PORT) || 3000, host: "0.0.0.0" })
  .then(() => console.log("Server is running"))
  .catch((err) => {
    console.error("Failed to start server", err);
    process.exit(1);
  });
```

Notas:

- usamos `withTypeProvider<ZodTypeProvider>()` para que Fastify infira tipos a partir dos schemas Zod.
- `validatorCompiler` e `serializerCompiler` conectam Zod ao mecanismo interno do Fastify.

---

## 📦 src/lib/prisma.ts — instância do PrismaClient

Crie um único cliente Prisma e exporte para o app:

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({ log: ["query"] });
```

Uso: `import { prisma } from '../lib/prisma'` nos handlers das rotas.

Lembrete: sempre rode `npx prisma generate` após modificar `schema.prisma`.

---

## 🔐 src/utils/hash.ts — helpers para senha

Exemplo (bcryptjs recomendado no Windows):

```ts
// src/utils/hash.ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string) {
  return bcrypt.compare(password, hashed);
}
```

---

## 🧾 Schemas (Zod) — `src/schemas/*`

Exemplos resumidos para tipagem e validação.

`src/schemas/user.ts`:

```ts
import { z } from "zod";

export const createUserSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const userResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
```

`src/schemas/livro.ts`:

```ts
import { z } from "zod";

export const createLivroSchema = z.object({
  nome: z.string(),
  autor: z.string(),
  preco: z.number(),
  quantidade: z.number(),
});

export const livroResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  autor: z.string(),
  preco: z.number(),
  quantidade: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateLivroInput = z.infer<typeof createLivroSchema>;
```

Dica: nas rotas, coloque o schema em `schema.body` e o `response` com os status codes (ex.: `response: { 201: livroResponseSchema }`).

---

## 🛣️ Rotas (exemplos de implementação)

Observação: a arquitetura usa rotas modulares; cada arquivo exporta uma função async que recebe `app: FastifyInstance`.

### Usuarios

`src/routes/usuarios/criar-usuario.ts` (criação de usuário):

```ts
// src/routes/usuarios/criar-usuario.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../utils/hash";
import { createUserSchema, userResponseSchema } from "../../schemas/user";

export default async function createUser(app: FastifyInstance) {
  app.post(
    "/user",
    {
      schema: { body: createUserSchema, response: { 201: userResponseSchema } },
    },
    async (request, reply) => {
      const { nome, email, password } = request.body as any;

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists)
        return reply.status(409).send({ error: "E-mail já cadastrado" });

      const hashed = await hashPassword(password);
      const created = await prisma.user.create({
        data: { nome, email, password: hashed },
      });

      const { password: _p, ...rest } = created as any;
      return reply.status(201).send(rest);
    }
  );
}
```

`src/routes/usuarios/login.ts` (login e emissão de JWT):

```ts
// src/routes/usuarios/login.ts
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { comparePassword } from '../../utils/hash';

export default async function login(app: FastifyInstance) {
  app.post('/login', { schema: { body: /* seu schema de login (email + password) */ } }, async (request, reply) => {
    const { email, password } = request.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(401).send({ error: 'Credenciais inválidas' });

    const ok = await comparePassword(password, user.password);
    if (!ok) return reply.status(401).send({ error: 'Credenciais inválidas' });

    const token = app.jwt.sign({ sub: user.id, email: user.email });
    return { token };
  });
}
```

`src/routes/usuarios/profile.ts` (rota protegida):

```ts
// src/routes/usuarios/profile.ts
import { FastifyInstance } from "fastify";

export default async function profile(app: FastifyInstance) {
  app.get(
    "/profile",
    {
      onRequest: [
        async (request) => {
          await request.jwtVerify();
        },
      ],
    },
    async (request) => {
      return { user: request.user };
    }
  );
}
```

### Livros (CRUD)

As rotas de livros podem ficar agrupadas num router: `src/routes/livros/index.ts` que registra sub-rotas.

`criar-livros.ts`:

```ts
// src/routes/livros/criar-livros.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import { createLivroSchema, livroResponseSchema } from "../../../schemas/livro";

export default async function createLivro(app: FastifyInstance) {
  app.post(
    "/",
    {
      schema: {
        body: createLivroSchema,
        response: { 201: livroResponseSchema },
      },
    },
    async (request, reply) => {
      const { nome, autor, preco, quantidade } = request.body as any;
      const created = await prisma.livros.create({
        data: { nome, autor, preco, quantidade },
      });
      return reply.status(201).send(created);
    }
  );
}
```

`listar-livros.ts`:

```ts
// src/routes/livros/listar-livros.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import { livroResponseSchema } from "../../../schemas/livro";

export default async function listLivros(app: FastifyInstance) {
  app.get(
    "/",
    { schema: { response: { 200: livroResponseSchema.array() } } },
    async () => {
      return prisma.livros.findMany();
    }
  );
}
```

`atualizar-livros.ts` (PUT /:id):

```ts
// src/routes/livros/atualizar-livros.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";
import { createLivroSchema, livroResponseSchema } from "../../../schemas/livro";

export default async function updateLivro(app: FastifyInstance) {
  app.put(
    "/:id",
    {
      schema: {
        params: { id: "string" },
        body: createLivroSchema,
        response: { 200: livroResponseSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      const { nome, autor, preco, quantidade } = request.body as any;
      try {
        const updated = await prisma.livros.update({
          where: { id },
          data: { nome, autor, preco, quantidade },
        });
        return reply.status(200).send(updated);
      } catch (err) {
        return reply.status(404).send({ error: "Livro não encontrado" });
      }
    }
  );
}
```

`remover-livros.ts`:

```ts
// src/routes/livros/remover-livros.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../../../lib/prisma";

export default async function deleteLivro(app: FastifyInstance) {
  app.delete(
    "/:id",
    {
      schema: {
        params: { id: "string" },
        response: { 200: { type: "object" } },
      },
    },
    async (request, reply) => {
      const { id } = request.params as any;
      try {
        await prisma.livros.delete({ where: { id } });
        return reply
          .status(200)
          .send({ message: "Livro removido com sucesso" });
      } catch (err) {
        return reply.status(404).send({ error: "Livro não encontrado" });
      }
    }
  );
}
```

---

## 🧪 Scripts e execução local

Exemplo recomendado no `package.json` (dev):

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node ./dist/server.js"
}
```

Passos para rodar localmente:

1. Instale dependências:

```bash
npm install
```

2. Gerar o client do Prisma (sempre que `schema.prisma` mudar):

```bash
npx prisma generate
# se usar migrações locais (dev):
npx prisma migrate dev --name init
```

3. Inicie em modo dev:

```bash
npm run dev
```

4. Teste endpoints com Insomnia/Postman/cURL.

---

## ✅ Boas práticas aplicadas e pontos importantes

- Validação e tipagem com Zod para requests/responses
- Separação de responsabilidades: rotas, schemas, utils, lib
- Não retornar senha nos responses — sempre omitir password
- Usar `request.jwtVerify()` para proteger rotas
- Conectar `prisma` via um único cliente instanciado em `src/lib/prisma.ts`

## ✅ Checklist rápido de debugging

- Servidor não inicia: verifique se existe outra aplicação na porta 3000 (`netstat -ano | findstr :3000`)
- Erro do Prisma: rode `npx prisma generate` e cheque `DATABASE_URL` no `.env`
- Erro de validação: verifique o JSON enviado e os schemas Zod
- Erro de rota (assertion error do fastify): verifique se a rota tem `/` inicial e se `app.register` está correto

---

## Próximos passos e melhorias sugeridas

- Documentação OpenAPI/Swagger (usar `@fastify/swagger` e converter os schemas manualmente ou com um conversor compatível com Zod v4)
- Refresh tokens e estratégia de logout seguro
- Tests unitários e de integração (Jest / Vitest)
- Políticas de CORS, rate limiting e monitoramento

---

Se quiser, eu posso:

- Gerar os arquivos de rota completos (com imports corretos e tipagens) e aplicar ao repositório.
- Registrar o plugin `@fastify/jwt` automaticamente em `src/server.ts` e criar `.env.example` com `JWT_SECRET`.
- Gerar um `src/routes/livros/index.ts` que registra os sub-routers.

Diga qual desses você prefere que eu faça a seguir e eu aplico as mudanças no repositório.

# 📚 API CRUD de Livros - Documentação do Projeto

Este README foi atualizado para refletir a modularização das rotas, o uso do Prisma como ORM, a validação com Zod e a estrutura atual do projeto. Também contém exemplos e instruções rápidas para executar e testar a API.

## Estrutura principal do projeto

Exemplo simplificado das pastas relevantes:

```
src/
├─ lib/
│  └─ prisma.ts         # instancia do PrismaClient
├─ routes/
│  ├─ usuarios/
│  │  ├─ criar-usuario.ts
│  │  ├─ login.ts
│  │  └─ profile.ts
│  └─ livros/
│     ├─ criar-livros.ts
│     ├─ listar-livros.ts
│     ├─ atualizar-livros.ts
│     └─ remover-livros.ts
├─ schemas/
│  ├─ user.ts           # schemas Zod para usuário
│  └─ livro.ts          # schemas Zod para livro
├─ utils/
│  └─ hash.ts           # helpers para hash de senha
└─ server.ts            # registra plugins, middlewares e rotas
```

### Como as rotas são organizadas

- Cada arquivo em `src/routes/*` exporta uma função que recebe a instância do Fastify e registra as rotas. Exemplo (padrão):

```typescript
// src/routes/usuarios/criar-usuario.ts
export async function createUser(app: FastifyInstance) {
  app.post(
    "/user",
    {
      schema: { body: createUserSchema, response: { 201: userResponseSchema } },
    },
    async (request, reply) => {
      // handler
    }
  );
}
```

No `server.ts` você registra os arquivos assim:

```typescript
import { createUser } from "./routes/usuarios/criar-usuario";
app.register(createUser);
```

Isso tornam as rotas modulares e fáceis de manter.

### Uso dos Schemas (Zod)

- Os schemas Zod ficam em `src/schemas/*` (por exemplo `src/schemas/user.ts`).
- Nas rotas, você referencia o schema no campo `schema` do Fastify: `schema: { body: createUserSchema, response: { 201: userResponseSchema } }`.
- O projeto utiliza `fastify-type-provider-zod` e os compilers para integrar Zod com Fastify e permitir tipagem/validação automáticas.

### Proteção de rotas (exemplo)

- Para rotas que precisam de autenticação, usamos `fastify-jwt` e um hook `onRequest` no roteador (veja `src/routes/usuarios/profile.ts`) para chamar `request.jwtVerify()` e, em caso de falha, retornar 401.

## Operações principais (resumo)

- POST `/user` - criar usuário (validação Zod, senha hashada com `utils/hash.ts`)
- POST `/login` - autenticação e emissão de JWT
- GET `/profile` - rota protegida por JWT (retorna dados do usuário)
- POST `/livros` - criar livro (Prisma + Zod)
- GET `/livros` - listar livros
- PUT `/livros/:id` - atualizar livro
- DELETE `/livros/:id` - remover livro

## Como executar

Pré-requisitos:

```bash
npm install
```

Iniciar em modo dev (com `tsx`):

```bash
npm run dev
```

O servidor registra rotas e imprime: `Server is running on http://localhost:3000`.

## Testes rápidos

- Health check (navegador/cURL/Insomnia): `GET http://localhost:3000/` → `{ "message": "Hello World" }`
- Criar usuário (senha >= 8):

```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{"nome":"Igor","email":"igor@teste.com","password":"12345678"}'
```

## Boas práticas aplicadas

- Modularização das rotas (cada rota em arquivo próprio)
- Validação com Zod e tipagem com `fastify-type-provider-zod`
- Persistência com Prisma (model `Livros` em `prisma/schema.prisma`)
- Senha armazenada em hash e **não retornada** nas respostas

## Onde olhar quando algo dá errado

- Logs do terminal onde o servidor está rodando
- Verifique `netstat -ano | findstr :3000` se tiver problema de conexão
- Se o erro for do Prisma, verifique `DATABASE_URL` e rode `npx prisma migrate dev`

---

Este README agora descreve a organização modular do projeto e como usar as peças principais (schemas, rotas, Prisma, autenticação). Abaixo há um guia separado e didático sobre autenticação (arquivo `AUTH.md`).
