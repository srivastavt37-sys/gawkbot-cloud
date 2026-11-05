FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates git tar && rm -rf /var/lib/apt/lists/*
RUN npm install -g opencode-ai pg
RUN curl -sL https://github.com/najmuzzaman-mohammad/gawkbot/releases/download/v0.240.1/gawkbot_0.240.1_linux_amd64.tar.gz | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gawkbot
WORKDIR /app
COPY opencode-gateway.mjs /app/opencode-gateway.mjs
COPY cloud-entrypoint.mjs /app/cloud-entrypoint.mjs
RUN mkdir -p /data/.wuphf && chmod -R 777 /data
ENV HOME=/data \
    WUPHF_RUNTIME_HOME=/data \
    WUPHF_LLM_PROVIDER=opencode \
    WUPHF_OPENCODE_MODEL=opencode/crouton-alpha-free \
    OPENCODE_MODEL=opencode/crouton-alpha-free \
    WUPHF_WIKI_BACKEND=memory
EXPOSE 10000
CMD ["node", "/app/cloud-entrypoint.mjs"]
