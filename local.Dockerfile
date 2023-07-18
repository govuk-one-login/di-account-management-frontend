FROM node:20.4.0-alpine@sha256:8165161b6e06ec092cf5d02731e8559677644845567dbe41b814086defc8c261

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
