FROM node:19.9.0@sha256:876aa3dc96feb9363331dec40795f1e74d12184fcbd77f5b4d1eb070d2aae16f

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
