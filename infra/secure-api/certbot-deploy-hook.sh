#!/usr/bin/env bash
set -euo pipefail

# Certbot runs deploy hooks after a successful renewal, not on failed attempts.
if [[ ${RENEWED_LINEAGE:-} == /etc/letsencrypt/live/secure-api.credittrust.in ]]; then
  nginx -t
  systemctl reload nginx
fi
