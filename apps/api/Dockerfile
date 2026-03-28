FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.6.0 --activate

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
RUN pnpm --filter @rentapp/shared build
RUN pnpm --filter @rentapp/api exec prisma generate
RUN pnpm --filter @rentapp/api build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/packages/shared/dist ./node_modules/@rentapp/shared/dist
COPY --from=build /app/packages/shared/package.json ./node_modules/@rentapp/shared/

USER nestjs
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
