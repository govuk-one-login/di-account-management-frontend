FROM node:20.19.4-alpine@sha256:940a1dc7c783725ebbf04fa433bec13fa7478437f20387753dbf701858ea8e31 as builder

ENV HUSKY=0

WORKDIR /app

COPY package.json ./
COPY bun.lockb ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types

RUN bun install --production

RUN bun install && bun run build && bun run clean-modules && bun install --production

FROM oven/bun:1.1.13 as final

RUN ["apk", "add", "--no-cache", "tini"]
RUN ["apk", "add", "--no-cache", "curl"]

WORKDIR /app

COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/bun.lockb ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

# DynaTrace
COPY --from=khw46367.live.dynatrace.com/linux/oneagent-codemodules-musl:nodejs / /
ENV LD_PRELOAD /opt/dynatrace/oneagent/agent/lib64/liboneagentproc.so

ENV NODE_ENV "production"
ENV PORT 6001
EXPOSE $PORT

HEALTHCHECK CMD curl --fail http://localhost:6001/healthcheck || exit 1

USER node

ENTRYPOINT ["tini", "--"]

CMD ["bun", "start"]
