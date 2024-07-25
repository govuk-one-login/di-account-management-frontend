FROM node:20.16.0-alpine@sha256:1a8bc4dc4720f0eb2f68d1883fd09f939103bd6df3848e0ffdc919d7fbf4dee1 as builder
ENV HUSKY=0
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:20.16.0-alpine@sha256:1a8bc4dc4720f0eb2f68d1883fd09f939103bd6df3848e0ffdc919d7fbf4dee1 as final
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
