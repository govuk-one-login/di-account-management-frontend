FROM node:20.20.2-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293

ENV NODE_ENV "development"
ENV PORT 6001

# Install git for repository operations and shadow for user management tools
# shadow provides usermod/groupmod commands not available in minimal Alpine
RUN apk add --no-cache git shadow

# Modify the existing node user to use UID/GID 1001 instead of default 1000
# This is required for GitHub Actions compatibility where the runner uses UID 1001
# Using usermod/groupmod preserves existing permissions and npm configuration
RUN usermod -u 1001 node && \
    groupmod -g 1001 node

VOLUME ["/app"]
WORKDIR /app

# Set ownership of /app directory to the node user
RUN chown -R node:node /app
# Switch to non-root node user for security best practices
USER node

# Configure git to trust the /app directory when mounted as volume
# Needed because Docker volumes can have different ownership characteristics
RUN git config --global --add safe.directory /app

EXPOSE $PORT

HEALTHCHECK NONE

CMD npm run install-all && npm run copy-assets && npm run dev
