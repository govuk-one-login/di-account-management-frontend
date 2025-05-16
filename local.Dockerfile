FROM node:20.19.2-alpine@sha256:f075d0182869528c4a140254af5c55ed4225a04ae225ea7b8bc81a96eb085f73

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
