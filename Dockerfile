FROM node:20.19.6-alpine@sha256:77312b5413fe7ae6af2a44aba4ab67711d64d3dbc0abba98aa7cc64917cf8b35 as builder

ENV HUSKY=0

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types

RUN npm ci && npm run build && npm run clean-modules && npm ci --production=true

FROM node:20.19.6-alpine@sha256:77312b5413fe7ae6af2a44aba4ab67711d64d3dbc0abba98aa7cc64917cf8b35 as final

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
