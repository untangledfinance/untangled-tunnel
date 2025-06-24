ARG NODE_VERSION=22
FROM node:${NODE_VERSION}
WORKDIR /untangled
RUN curl -fsSL https://bun.sh/install | bash
COPY package.json .
COPY bun.lockb .
COPY tsconfig.json .
RUN /root/.bun/bin/bun install
COPY acl.json .
COPY src/ src/
ENV ENV=dev
ARG VERSION
ENV VERSION=${VERSION}
ENTRYPOINT [ "/root/.bun/bin/bun", "./src/index.ts", "--hot" ]
