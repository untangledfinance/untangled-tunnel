FROM oven/bun
WORKDIR /untangled
COPY package.json .
COPY bun.lockb .
COPY tsconfig.json .
RUN bun install
COPY acl.json .
COPY src/ src/
ENV ENV=prod
ARG VERSION
ENV VERSION=${VERSION}
ENTRYPOINT [ "bun", "--hot", "./src/index.ts" ]
