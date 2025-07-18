FROM oven/bun:1.1.10-alpine

ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD bun install && bun run copy-assets && bun start
