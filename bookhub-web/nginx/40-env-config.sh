#!/bin/sh
set -eu
printf 'window.__ENV__ = { API_MODE: "%s" };\n' "${API_MODE:-mock}" > /usr/share/nginx/html/env-config.js
