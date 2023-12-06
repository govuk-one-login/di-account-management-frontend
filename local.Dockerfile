FROM node:21.4.0-alpine@sha256:9bfaec4816d320226b1533abd5d22d6a888105ee502b820676736de99a198408

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
