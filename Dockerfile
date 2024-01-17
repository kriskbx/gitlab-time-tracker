FROM node:8.2.1-alpine

ENV GTT_VERSION 1.7.39
ENV EDITOR vi

WORKDIR /pwd

RUN yarn global add --prefix /usr/local "gitlab-time-tracker@$GTT_VERSION"

VOLUME ["/root", "/pwd"]
ENTRYPOINT ["gtt"]
CMD ["--help"]
