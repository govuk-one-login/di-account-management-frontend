FROM node:19.5.0-alpine@sha256:4619ec6c9a43ab4edfa12cf96745319c3ca43aff9dd630ab20e684dd3632318e as builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN yarn install && yarn build && yarn clean-modules && yarn install --production=true

FROM node:19.5.0-alpine@sha256:4619ec6c9a43ab4edfa12cf96745319c3ca43aff9dd630ab20e684dd3632318e as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["yarn", "start"]