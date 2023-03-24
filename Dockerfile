FROM node:19.8.1-alpine@sha256:a67a33f791d1c86ced985f339fa160f6188f590ebbe963fe11cc00adc971fa41 as builder
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN yarn install && yarn build && yarn clean-modules && yarn install --production=true

FROM node:16.19.1@sha256:a67a33f791d1c86ced985f339fa160f6188f590ebbe963fe11cc00adc971fa41 as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["yarn", "start"]