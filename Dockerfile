FROM node:19.6.0-alpine@sha256:72b0f918ad76b5ef68c6243869fab5800d7393c1dcccf54ef00958c2abc8164a as builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN yarn install && yarn build && yarn clean-modules && yarn install --production=true

FROM node:19.6.0-alpine@sha256:72b0f918ad76b5ef68c6243869fab5800d7393c1dcccf54ef00958c2abc8164a as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["yarn", "start"]