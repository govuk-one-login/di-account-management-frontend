FROM node:16.19.1-alpine@sha256:0fcf4fb718a763fa53ac8d60073a7cd7dc1520076e08ea0180591174122e52f3 as builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN yarn install && yarn build && yarn clean-modules && yarn install --production=true

FROM node:16.19.1@sha256:0fcf4fb718a763fa53ac8d60073a7cd7dc1520076e08ea0180591174122e52f3 as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["yarn", "start"]