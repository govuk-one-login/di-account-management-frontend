FROM oven/bun:1.1.13

ENV PORT 6001

VOLUME ["/app"]
WORKDIR /app

EXPOSE $PORT

CMD bun install && bun run copy-assets && bun start
