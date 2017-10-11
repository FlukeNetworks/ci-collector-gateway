#! /bin/bash

set -e

curl -XPOST https://lc0gl3oand.execute-api.us-east-1.amazonaws.com/latest/build -d '{
  "build": {
    "project": "foo",
    "repository": "https://github.com/bar/foo",
    "branch": "master",
    "build": {
      "id": "1234",
      "href": "https://example.com/foo/1234"
    },
    "duration": 356,
    "success": true,
    "unit_tests": {
      "total": 1097,
      "pct": 82.12
    },
    "e2e_tests": {
      "total": 3
    }
  }
}'
