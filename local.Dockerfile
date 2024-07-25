FROM node:20.16.0-alpine@sha256:1a8bc4dc4720f0eb2f68d1883fd09f939103bd6df3848e0ffdc919d7fbf4dee1

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run build-js:analytics && npm run dev
