# === Etapa 1: build ===
FROM node:23-alpine3.20 AS builder

WORKDIR /app

# 1) Só dependências (pra cache funcionar melhor)
COPY package*.json ./
RUN npm ci

# 2) Todo o código, incluindo `src/`, `views/`, `tsconfig.json` etc.
COPY . .

# 3) Build da sua aplicação
RUN npm run build

# === Etapa 2: imagem final ===
FROM node:23-alpine3.20

WORKDIR /app

# 1) Instala só prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# 2) Copia build + views
COPY --from=builder /app/build    ./build
COPY --from=builder /app/src/views ./views

# 3) Cria pasta de dados, se precisar
RUN mkdir -p /app/actual-data

# 4) Ponto de entrada
CMD ["node", "build/index.js"]
