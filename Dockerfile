# Despite what SonarQube says both the tag and sha digest are needed:
# the digest pins the exact image for reproducibility,
# the tag allows Dependabot to evaluate version constraints
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS builder

WORKDIR /app

COPY . .

RUN apk add --no-cache git && npm run install-all && npm run build && npm run clean-modules && npm ci --production=true

# Despite what SonarQube says both the tag and sha digest are needed:
# the digest pins the exact image for reproducibility,
# the tag allows Dependabot to evaluate version constraints
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS final

RUN ["apk", "add", "--no-cache", "tini"]
RUN ["apk", "add", "--no-cache", "curl"]

WORKDIR /app

COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist
COPY --chown=node:node --from=builder /app/submodules/passkey-authenticator-aaguids/combined_aaguid.json submodules/passkey-authenticator-aaguids/combined_aaguid.json

# DynaTrace
COPY --from=khw46367.live.dynatrace.com/linux/oneagent-codemodules-musl:nodejs / /
ENV LD_PRELOAD=/opt/dynatrace/oneagent/agent/lib64/liboneagentproc.so

ENV NODE_ENV="production"
ENV PORT=6001
EXPOSE $PORT

HEALTHCHECK CMD curl --fail http://localhost:6001/healthcheck || exit 1

USER node

ENTRYPOINT ["tini", "--"]

CMD ["npm", "start"]
