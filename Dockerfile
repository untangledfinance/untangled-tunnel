ARG NODE_VERSION=22

FROM oven/bun AS bundler
WORKDIR /untangled
COPY package.json .
COPY bun.lockb .
COPY tsconfig.json .
RUN bun install
COPY src/ src/
RUN bun build \
    --target=node \
    --outfile=./dist/index.js ./src/index.ts

FROM node:${NODE_VERSION}-slim
WORKDIR /untangled
COPY --from=bundler /untangled/dist/index.js .
COPY acl.json .
ENV ENV=production
ARG VERSION
ENV VERSION=${VERSION}
ENTRYPOINT [ "node", "index.js" ]
