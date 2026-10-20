#!/usr/bin/env bash
set -euo pipefail

site=/etc/nginx/sites-enabled/secure-api.credittrust.in
source_site=/etc/nginx/sites-available/secure-api.credittrust.in
service=credittrust-secure-api.service
activated=0

if [[ $EUID -ne 0 ]]; then
  echo 'Run as root' >&2
  exit 1
fi
test -f "$source_site"
test ! -e "$site"
test "$(systemctl is-enabled "$service")" = disabled

rollback() {
  if [[ $activated -ne 1 ]]; then
    if [[ -L "$site" ]]; then
      rm "$site"
      nginx -t && systemctl reload nginx
    fi
    systemctl stop "$service" || true
  fi
}
trap rollback EXIT

systemctl start "$service"
ready=0
for _ in {1..20}; do
  if ss -lnt | grep -q '127.0.0.1:9443'; then ready=1; break; fi
  sleep 0.2
done
test "$ready" = 1

ln -s "$source_site" "$site"
nginx -t
systemctl reload nginx

# A caller without Binta's private key must fail before reaching the app.
status=000
for _ in {1..20}; do
  if status=$(curl --noproxy '*' --resolve secure-api.credittrust.in:443:65.20.75.9 \
    --max-time 4 -sS -o /dev/null -w '%{http_code}' \
    https://secure-api.credittrust.in/api/v1/source 2>/dev/null); then
    break
  fi
  sleep 0.25
done
test "$status" = 400 || { echo "Unexpected no-certificate status: $status" >&2; exit 1; }
systemctl is-active --quiet nginx
systemctl is-active --quiet "$service"
ss -lnt | grep -q ':4000 '
ss -lnt | grep -q '127.0.0.1:5000'
systemctl enable "$service" >/dev/null
activated=1
echo 'Secure API edge enabled. No-client-certificate request rejected with HTTP 400.'
