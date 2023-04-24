FROM node:20.0.0@sha256:242d81ad2a91353ac3a5ed3598582acb4a9a7761b16c60524b949a1603707848

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
