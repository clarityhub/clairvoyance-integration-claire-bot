#!/bin/bash

yarn install --no-progress > /dev/null && \
  yarn run migrate:up > /dev/null && \
  yarn run migrate:up:test > /dev/null && \
  yarn start
