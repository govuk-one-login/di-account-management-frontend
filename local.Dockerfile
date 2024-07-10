FROM node:22.4.1-alpine@sha256:ba898e86c2cc720c8cf2ae05f8d2d4697fe0c8ca3e920d6fbf14a6cbf50bb9ca

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run build-js:analytics && npm run dev
