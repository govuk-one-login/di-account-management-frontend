FROM node:20.2.0@sha256:68ba78ba4a648b0eb50aa35b58126c88f6caa0ccbb5560b7487a7d4fb4b8e9e9

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
