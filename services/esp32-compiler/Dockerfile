FROM debian:bookworm-slim
ARG TARGETARCH
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl python3 python3-serial xz-utils unzip && rm -rf /var/lib/apt/lists/*
# Official Arduino CLI v1.5.1 release, verified against published asset digests.
RUN case "$TARGETARCH" in \
      amd64) ARCH=64bit; SUM=28a8e119c498a25607821c36cb2dc49e8463941b261a0d99091baa7bc692dd2b;; \
      arm64) ARCH=ARM64; SUM=1e69e077479f300614d4551334e0a33f08ee40b04315d83b8e7e0e94f0d0ee62;; \
      *) exit 1;; esac \
    && curl -fsSL "https://github.com/arduino/arduino-cli/releases/download/v1.5.1/arduino-cli_1.5.1_Linux_${ARCH}.tar.gz" -o /tmp/cli.tar.gz \
    && echo "$SUM  /tmp/cli.tar.gz" | sha256sum -c - \
    && tar -xzf /tmp/cli.tar.gz -C /usr/local/bin arduino-cli && rm /tmp/cli.tar.gz
RUN mkdir -p /opt/arduino /opt/user /opt/downloads \
    && printf '%s\n' 'board_manager:' '  additional_urls:' '    - https://espressif.github.io/arduino-esp32/package_esp32_index.json' 'directories:' '  data: /opt/arduino' '  downloads: /opt/downloads' '  user: /opt/user' > /etc/arduino-cli.yaml \
    && arduino-cli --config-file /etc/arduino-cli.yaml core update-index \
    && arduino-cli --config-file /etc/arduino-cli.yaml core install esp32:esp32@3.3.12 \
    && chmod -R a+rX /opt/arduino /opt/user && rm -rf /opt/downloads/*
USER 65534:65534
WORKDIR /tmp
