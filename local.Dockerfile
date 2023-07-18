FROM node:20.4.0-alpine@sha256:7c7522c24296574017a8e78227870808573b7ca9991dea6164469a0336e9aa4f

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
