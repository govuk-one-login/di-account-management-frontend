FROM node:20.19.6-alpine@sha256:77312b5413fe7ae6af2a44aba4ab67711d64d3dbc0abba98aa7cc64917cf8b35

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
