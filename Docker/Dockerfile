# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG ALPINE=22-bullseye
FROM alpine:${ALPINE}

# ** [Optional] Uncomment this section to install additional packages. **
RUN apk update \
    && apk add --no-cache python3.12 py3-pip 