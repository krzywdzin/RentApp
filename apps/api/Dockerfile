FROM node:20-alpine
RUN apk add --no-cache chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN corepack enable && corepack prepare pnpm@10.6.0 --activate

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

# Cleanup source and dev files to reduce image size
RUN rm -rf apps/api/src apps/api/test apps/web apps/mobile packages/eslint-config packages/shared/src tsconfig.base.json

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
