FROM node:20.19.3-alpine@sha256:674181320f4f94582c6182eaa151bf92c6744d478be0f1d12db804b7d59b2d11

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm ci && npm run copy-assets && npm run dev
