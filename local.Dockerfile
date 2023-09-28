FROM node:20.7.0-alpine@sha256:a329b146bcc99a36caa73056e60714d0911ca5c229ade3eb27e9283dc78c9eb6

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
