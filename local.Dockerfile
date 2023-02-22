FROM node:16.19.1@sha256:78fa26eb2b8081e9005253e816ed75eaf6f828feeca1e1956f476356f050d816

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn dev