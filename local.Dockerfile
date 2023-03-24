FROM node:16.19.1@sha256:a67a33f791d1c86ced985f339fa160f6188f590ebbe963fe11cc00adc971fa41

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn dev