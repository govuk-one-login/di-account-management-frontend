FROM node:20.20.2-alpine@sha256:f598378b5240225e6beab68fa9f356db1fb8efe55173e6d4d8153113bb8f333c

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
