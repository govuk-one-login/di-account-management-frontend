ARG NODE_VERSION
ARG NODE_INDEX_DIGEST
FROM node:${NODE_VERSION}-alpine@${NODE_INDEX_DIGEST}

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
