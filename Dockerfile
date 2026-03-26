FROM node:20.20.1-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa as builder

WORKDIR /app

COPY . .

RUN apk add --no-cache git && npm run install-all && npm run build && npm run clean-modules && npm ci --production=true && cat submodules/passkey-authenticator-aaguids/combined_aaguid.json

FROM node:20.20.1-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa as final

RUN ["apk", "add", "--no-cache", "tini"]
RUN ["apk", "add", "--no-cache", "curl"]

WORKDIR /app

COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist
COPY --chown=node:node --from=builder /app/submodules/passkey-authenticator-aaguids/combined_aaguid.json submodules/passkey-authenticator-aaguids/combined_aaguid.json

RUN ls . && cat submodules/passkey-authenticator-aaguids/combined_aaguid.json

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
