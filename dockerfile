# Etapa 1: Instala solo dependencias de producción
FROM node:22-alpine3.19 AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# Etapa 2: Genera el cliente Prisma y construye el proyecto
FROM node:22-alpine3.19 AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
COPY prisma ./prisma
RUN apk add --no-cache python3 make g++ \
    && npm ci --include=dev \
    && npx prisma generate \
    && npm run build \
    && npm prune --production

# Etapa 3: Imagen final de producción
FROM node:22-alpine3.19
WORKDIR /usr/src/app
ENV NODE_ENV=production

# tini como PID 1: reapea zombies y reenvía señales (node solo, como PID 1, no hace ninguna de las dos).
RUN apk add --no-cache tini

# Copia solo lo necesario para producción
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

STOPSIGNAL SIGTERM
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]

