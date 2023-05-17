FROM node:20.2.0-alpine@sha256:4559bc033338938e54d0a3c2f0d7c3ad7d1d13c28c4c405b85c6b3a26f4ce5f7 as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:16.19.1@sha256:4559bc033338938e54d0a3c2f0d7c3ad7d1d13c28c4c405b85c6b3a26f4ce5f7 as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["npm", "start"]
