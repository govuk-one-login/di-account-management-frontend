FROM node:20.15.1-alpine@sha256:cf5e7b223dea2efc6a73c55c6655b740576fe9c2596927a53533feded0fb5f5f as builder
ENV HUSKY=0
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:20.15.1-alpine@sha256:cf5e7b223dea2efc6a73c55c6655b740576fe9c2596927a53533feded0fb5f5f as final
RUN apk --no-cache add curl
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
