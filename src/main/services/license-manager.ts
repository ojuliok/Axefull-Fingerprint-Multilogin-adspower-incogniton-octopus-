import os from 'os';
import crypto from 'crypto';

let keytar: any;
try {
  // prefer native keytar for secure storage
  // note: install with `npm install keytar` in the project root
  // at runtime Electron main can use this module
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  keytar = require('keytar');
} catch (err) {
  keytar = null;
}

import jwt from 'jsonwebtoken';

const SERVICE = 'axe-multilogin';
const ACCOUNT = 'license_token';

export async function setLicenseToken(token: string): Promise<void> {
  if (!keytar) throw new Error('keytar not available – run `npm install keytar`');
  await keytar.setPassword(SERVICE, ACCOUNT, token);
}

export async function getLicenseToken(): Promise<string | null> {
  if (!keytar) throw new Error('keytar not available – run `npm install keytar`');
  return await keytar.getPassword(SERVICE, ACCOUNT);
}

export async function removeLicenseToken(): Promise<void> {
  if (!keytar) throw new Error('keytar not available – run `npm install keytar`');
  await keytar.deletePassword(SERVICE, ACCOUNT);
}

export function decodeToken(token: string): any | null {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
}

export function isExpiredToken(token: string): boolean {
  const decoded: any = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() / 1000 > decoded.exp;
}

export function deviceHwidHash(): string {
  // lightweight HWID for binding (document in privacy policy)
  const attrs = [os.hostname(), os.platform(), os.arch(), os.userInfo().username || ''];
  const raw = attrs.join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function validateOnline(serverUrl: string): Promise<any> {
  const token = await getLicenseToken();
  if (!token) throw new Error('no license token stored');

  const body = {
    license_token: token,
    device_hwid_hash: deviceHwidHash(),
    install_id: null
  };

  const res = await fetch(`${serverUrl.replace(/\/$/, '')}/licenses/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`validate failed: ${JSON.stringify(data)}`);
  return data;
}

export async function issueLicenseOnline(serverUrl: string, userId: string, plan = 'default'): Promise<any> {
  // Requires admin credentials on server side; this is a helper for admin flows only
  const body = { user_id: userId, plan, device_hwid_hash: deviceHwidHash(), install_id: null, valid_for_days: 30 };
  const res = await fetch(`${serverUrl.replace(/\/$/, '')}/licenses/issue`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admin': 'true' },
    body: JSON.stringify(body)
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(`issue failed: ${JSON.stringify(data)}`);
  if (data.license_token) await setLicenseToken(data.license_token);
  return data;
}

export default {
  setLicenseToken,
  getLicenseToken,
  removeLicenseToken,
  decodeToken,
  isExpiredToken,
  deviceHwidHash,
  validateOnline,
  issueLicenseOnline
};
