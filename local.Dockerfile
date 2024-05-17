FROM node:22.2.0-alpine@sha256:9e8f45fc08c709b1fd87baeeed487977f57585f85f3838c01747602cd85a64bb

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
