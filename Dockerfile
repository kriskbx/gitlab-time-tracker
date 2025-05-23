ARG NODE_VERSION=""
FROM node:${NODE_VERSION:-8.2.1-alpine}
ARG GTT_VERSION=@1.7.40
ENV GTT_VERSION=$GTT_VERSION
ENV EDITOR vi


RUN apk update && \
    apk add git && \
    addgroup -S gtt && adduser -S gtt -G gtt && \
    yarn global add --prefix /usr/local "gitlab-time-tracker${GTT_VERSION}"
USER gtt
WORKDIR /home/gtt

VOLUME ["/home/gtt"]
ENTRYPOINT ["gtt"]
CMD ["--help"]
