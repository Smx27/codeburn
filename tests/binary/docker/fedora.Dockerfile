FROM fedora:40

RUN dnf install -y \
    bash \
    ca-certificates \
    curl \
  && dnf clean all

WORKDIR /workspace

COPY run-tests.sh /usr/local/bin/run-tests.sh
RUN chmod +x /usr/local/bin/run-tests.sh

CMD ["bash", "/usr/local/bin/run-tests.sh"]
