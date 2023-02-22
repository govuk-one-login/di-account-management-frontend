FROM node:19.6.1-alpine@sha256:78fa26eb2b8081e9005253e816ed75eaf6f828feeca1e1956f476356f050d816 as builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN yarn install && yarn build && yarn clean-modules && yarn install --production=true

FROM node:16.19.1@sha256:78fa26eb2b8081e9005253e816ed75eaf6f828feeca1e1956f476356f050d816 as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["yarn", "start"]