FROM node:19.7.0-alpine@sha256:667dc6ed8fc6623ccd21cb5fa355c90f848daaf5d6df96bc940869bfdf91c19a as builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN yarn install && yarn build && yarn clean-modules && yarn install --production=true

FROM node:16.19.1@sha256:667dc6ed8fc6623ccd21cb5fa355c90f848daaf5d6df96bc940869bfdf91c19a as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["yarn", "start"]