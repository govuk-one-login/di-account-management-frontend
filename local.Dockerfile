FROM node:20.18.2-alpine@sha256:e7507c00b35ccecf4958d99296e3a9ecc69fcd0deccc12067a66b5745c846406

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run build-js:analytics && npm run dev
