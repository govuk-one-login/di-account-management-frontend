FROM node:19.9.0-alpine@sha256:53741c7511b1836b5eb7e788a7b399c058b0b549f205d2c6af831ec1a9a81c31 as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:16.19.1@sha256:53741c7511b1836b5eb7e788a7b399c058b0b549f205d2c6af831ec1a9a81c31 as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["npm", "start"]
