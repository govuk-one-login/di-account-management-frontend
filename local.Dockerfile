FROM node:20.19.6-alpine@sha256:16858294071a56ffd4cce9f17b57136cc39e41507b40e245b4f8e906f7a19463

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
