FROM node:21.7.1-alpine@sha256:577f8eb599858005100d84ef3fb6bd6582c1b6b17877a393cdae4bfc9935f068

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
