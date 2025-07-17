FROM node:20.19.4-alpine@sha256:940a1dc7c783725ebbf04fa433bec13fa7478437f20387753dbf701858ea8e31

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
