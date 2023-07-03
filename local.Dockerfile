FROM node:20.3.1@sha256:2f0b0c15f97441defa812268ee943bbfaaf666ea6cf7cac62ee3f127906b35c6

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
