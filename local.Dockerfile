FROM node:20.20.1-alpine@sha256:b88333c42c23fbd91596ebd7fd10de239cedab9617de04142dde7315e3bc0afa

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

RUN apk add --no-cache git

CMD npm run install-all && npm run copy-assets && npm run dev
