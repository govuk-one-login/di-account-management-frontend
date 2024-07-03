FROM node:22.4.0-alpine@sha256:6fa9da622cb8350243700b15ed9b2b848f6631d00284761c1c9671239b268864

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run build-js:analytics && npm run dev
