# Despite what SonarQube says both the tag and sha digest are needed:
# the digest pins the exact image for reproducibility,
# the tag allows Dependabot to evaluate version constraints
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf

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
