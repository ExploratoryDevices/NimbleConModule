#!/usr/bin/env bash
RESPONSE="HTTP/1.1 200 OK\r\nConnection: keep-alive\r\n\r\n${2:-"OK"}\r\n"
while { echo -en "$RESPONSE"; } | nc -l "${1:-8080}"; do
  echo "================================================"
done

# use this to make a webserver to swallow whatever you send it! useful for testing
# usage: ./mock_web_host.sh [port] [response]