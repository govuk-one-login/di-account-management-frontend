FROM node:20.19.1-alpine@sha256:c628bdc7ebc7f95b1b23249a445eb415ce68ae9def8b68364b35ee15e3065b0f

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
