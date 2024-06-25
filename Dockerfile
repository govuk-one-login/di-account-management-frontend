# test to trigger action 4
FROM node:22.3.0-alpine@sha256:dfd61407706dee667f08be1bb079d2f2c6643f69ed5d2abe5c180b5e6cd1733a as builder
ENV HUSKY=0
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:22.3.0-alpine@sha256:dfd61407706dee667f08be1bb079d2f2c6643f69ed5d2abe5c180b5e6cd1733a as final
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
USER node
CMD ["npm", "start"]
