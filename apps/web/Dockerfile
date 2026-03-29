FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.6.0 --activate

WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/
RUN pnpm --filter @rentapp/shared build
RUN pnpm --filter @rentapp/web build

# Copy static assets into standalone directory
RUN cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
RUN if [ -d apps/web/public ]; then cp -r apps/web/public apps/web/.next/standalone/apps/web/public; fi

# Cleanup
RUN rm -rf apps/api apps/mobile packages/eslint-config packages/shared/src apps/web/src tsconfig.base.json

EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0 NODE_ENV=production
WORKDIR /app/apps/web/.next/standalone
CMD ["node", "apps/web/server.js"]
