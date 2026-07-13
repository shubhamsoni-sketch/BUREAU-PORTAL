import { randomInt } from 'node:crypto';

const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';

export function generateTemporaryPassword(length = 10): string {
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}
