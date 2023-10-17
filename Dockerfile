FROM node:20.8.1-alpine@sha256:a369136b6f7640f85acf300ce9d6498d8161972b855a72bbc79273150d4dd0c7 as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:20.8.1-alpine@sha256:a369136b6f7640f85acf300ce9d6498d8161972b855a72bbc79273150d4dd0c7 as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["npm", "start"]
