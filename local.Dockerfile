FROM node:16.19.1@sha256:029a85552a270cd6dfae0ec222465f1deacfaf7cee030981b7ff6acd6a0eaf33

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn dev