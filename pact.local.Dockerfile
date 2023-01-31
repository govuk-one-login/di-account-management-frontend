FROM node:16.17.0

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD yarn install && yarn copy-assets && yarn add --dev @pact-foundation/pact@latest && yarn dev