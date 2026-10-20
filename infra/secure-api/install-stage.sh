#!/usr/bin/env bash
set -euo pipefail

staging_dir=${1:?Pass the absolute staging directory}
expected_fingerprint=B0835A9B06CF4AC110B826958B517519A3A008544C6CC3EC0670DCE8B1A30D7B
config_dir=/etc/credittrust/secure-api
app_dir=/opt/credittrust/secure-api
site=/etc/nginx/sites-available/secure-api.credittrust.in
service=/etc/systemd/system/credittrust-secure-api.service

if [[ $EUID -ne 0 ]]; then
  echo 'Run as root' >&2
  exit 1
fi

for file in proxy.mjs nginx.conf.template secure-api.service.template certs/binta-production-2026.pem; do
  test -f "$staging_dir/$file" || { echo "Missing staged file: $file" >&2; exit 1; }
done
for path in "$config_dir" "$app_dir" "$site" "$service"; do
  test ! -e "$path" || { echo "Refusing to overwrite $path" >&2; exit 1; }
done

cert="$staging_dir/certs/binta-production-2026.pem"
actual_fingerprint=$(openssl x509 -in "$cert" -noout -fingerprint -sha256 | cut -d= -f2 | tr -d ':')
test "$actual_fingerprint" = "$expected_fingerprint" || { echo 'Client certificate fingerprint mismatch' >&2; exit 1; }
openssl x509 -in "$cert" -checkend 0 -noout >/dev/null
openssl verify -CAfile "$cert" "$cert" >/dev/null
test -s /etc/letsencrypt/live/secure-api.credittrust.in/fullchain.pem
test -s /etc/letsencrypt/live/secure-api.credittrust.in/privkey.pem
node --check "$staging_dir/proxy.mjs"

backup_dir=/root/credittrust-secure-api-backups
install -d -m 0700 "$backup_dir"
backup="$backup_dir/nginx-before-secure-api-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
tar -C /etc -czf "$backup" nginx
chmod 0600 "$backup"

if ! id -u credittrust-proxy >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin credittrust-proxy
fi
install -d -m 0755 /etc/credittrust "$config_dir" /opt/credittrust "$app_dir"
install -m 0644 "$cert" "$config_dir/client-trust-bundle.pem"
install -m 0644 "$staging_dir/proxy.mjs" "$app_dir/proxy.mjs"
install -m 0644 "$staging_dir/secure-api.service.template" "$service"

signing_secret=$(openssl rand -hex 32)
edge_token=$(openssl rand -hex 32)
umask 077
printf 'PORT=9443\nUPSTREAM_URL=https://api.credittrust.in/api/v1/source\nMTLS_PROXY_SECRET=%s\nEDGE_INGRESS_SECRET=%s\nALLOWED_CERT_SHA256=%s\n' \
  "$signing_secret" "$edge_token" "$expected_fingerprint" > "$config_dir/proxy.env"
sed "s/REPLACE_WITH_EDGE_INGRESS_TOKEN/$edge_token/" "$staging_dir/nginx.conf.template" > "$site"
chmod 0600 "$config_dir/proxy.env" "$site"
systemctl daemon-reload
systemd-analyze verify "$service"
echo "Staged secure API files; NGINX site and proxy service remain disabled."
echo "Existing NGINX backup: $backup"
