#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE "clairvoyance_integration_claire_bot_development";
  CREATE DATABASE "clairvoyance_integration_claire_bot_test";

  GRANT ALL PRIVILEGES ON DATABASE clairvoyance_integration_claire_bot_development to postgres;
  GRANT ALL PRIVILEGES ON DATABASE clairvoyance_integration_claire_bot_test to postgres;
EOSQL
