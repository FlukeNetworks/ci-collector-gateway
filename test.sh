#! /bin/bash

set -e

curl -XPOST https://lc0gl3oand.execute-api.us-east-1.amazonaws.com/latest/build -d '{
  "build": {
    "task_type": "e2e"
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
      "lines_pct": 82.9,
      "branches_pct": 82.9,
      "functions_pct": 82.9,
      "statements_pct": 82.9,
      "pass": 2,
      "fail": 1,
      "pending": 5
    }
  }
}'
