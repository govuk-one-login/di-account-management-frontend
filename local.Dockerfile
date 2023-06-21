FROM node:20.3.0@sha256:fc738db1cbb81214be1719436605e9d7d84746e5eaf0629762aeba114aa0c28d

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
