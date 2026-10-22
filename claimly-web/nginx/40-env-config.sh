#!/bin/sh
set -eu

UI_CODES='["f6l2","m3t8","v7b4","a9q5","s2h7","p8n3","j4w6"]'

if [ -n "${CLAIMLY_VARIANT:-}" ]; then
  VARIANT=$(jq -nc --arg v "$CLAIMLY_VARIANT" '$v | fromjson | {api, ui}')
else
  VARIANT=null
fi

UI_BUGS=$(jq -nc --arg s "${CLAIMLY_BUGS:-}" --argjson known "$UI_CODES" '$s | split(",") | map(gsub(" "; "")) | map(select(. as $code | $known | any(. == $code)))')

printf 'window.__ENV__ = { VARIANT: %s, UI_BUGS: %s };\n' "$VARIANT" "$UI_BUGS" > /usr/share/nginx/html/env-config.js
