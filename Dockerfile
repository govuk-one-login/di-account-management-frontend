FROM node:20.0.0-alpine@sha256:cc4e8f3d78a276fa05eae1803b6f8cbb43145441f54c828ab14e0c19dd95c6fd as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY ./src ./src
COPY ./@types ./@types
RUN npm install && npm run build && npm run clean-modules && npm install --production=true

FROM node:16.19.1@sha256:cc4e8f3d78a276fa05eae1803b6f8cbb43145441f54c828ab14e0c19dd95c6fd as final
WORKDIR /app
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules/ node_modules
COPY --chown=node:node --from=builder /app/dist/ dist

ENV NODE_ENV "production"
ENV PORT 6001

EXPOSE $PORT
USER node
CMD ["npm", "start"]
