FROM node:20.20.0-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8 as builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types

RUN npm ci && npm run build && npm run clean-modules && npm ci --production=true

FROM node:20.20.0-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8 as final

RUN ["apk", "add", "--no-cache", "tini"]
RUN ["apk", "add", "--no-cache", "curl"]

WORKDIR /app

COPY --chown=node:node --from=builder /app/package*.json ./
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

CMD ["npm", "start"]
