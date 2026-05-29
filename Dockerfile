# --- Etapa Base ---
FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencias del sistema para Prisma, Argon2 y otros paquetes nativos
RUN apt-get update \
    && apt-get install -y openssl python3 make g++ curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Constructor del Backend ---
FROM base AS backend-builder

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/

RUN pnpm --filter @orqelis/shared build
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

# --- Constructor del Frontend ---
FROM base AS frontend-builder

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/

RUN pnpm --filter @orqelis/shared build
RUN pnpm --filter web build

# --- Servidor del Backend en producción ---
FROM base AS backend

RUN apt-get update \
    && apt-get install -y openssl curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY .env* ./
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --prod --frozen-lockfile

COPY apps/api/prisma ./apps/api/prisma
COPY --from=backend-builder /app/apps/api/prisma.config.ts ./apps/api/

RUN pnpm --filter api prisma:generate

COPY --from=backend-builder /app/apps/api/dist ./apps/api/dist
COPY --from=backend-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=backend-builder /app/packages/shared/package.json ./packages/shared/

WORKDIR /app/apps/api

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma db push --accept-data-loss && node dist/index.js"]

# --- Servidor del Frontend en producción ---
FROM nginx:stable-alpine AS frontend

COPY --from=frontend-builder /app/apps/web/dist /usr/share/nginx/html

RUN printf "server { \n\
    listen 80; \n\
    location /api { \n\
        proxy_pass http://backend:3001; \n\
        proxy_set_header Host \$host; \n\
        proxy_set_header X-Real-IP \$remote_addr; \n\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \n\
        proxy_set_header X-Forwarded-Proto \$scheme; \n\
    } \n\
    location /health { \n\
        proxy_pass http://backend:3001; \n\
        proxy_set_header Host \$host; \n\
    } \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html index.htm; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]