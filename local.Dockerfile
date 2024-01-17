FROM node:21.6.0-alpine@sha256:ab620cffd0f4d4529ef97682b2309c0571cd14a75496aa0934a13b059d003647

ENV NODE_ENV "development"
ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD npm install && npm run copy-assets && npm run dev
