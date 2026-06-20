FROM alpine:3.20

RUN apk add --no-cache \
    bash \
    ca-certificates \
    curl

WORKDIR /workspace

COPY run-tests.sh /usr/local/bin/run-tests.sh
RUN chmod +x /usr/local/bin/run-tests.sh

CMD ["bash", "/usr/local/bin/run-tests.sh"]
