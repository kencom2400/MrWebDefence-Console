/**
 * is-ip モック
 * JestでESMモジュールのis-ipを使用するためのモック
 * 実際のis-ipライブラリの動作を模倣
 */

// CommonJS形式でエクスポート
const isIp = {
  isIP: (ip: string): boolean => {
    if (!ip || typeof ip !== 'string') {
      return false;
    }
    // IPv4のチェック
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    // IPv6のチェック
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) {
      return true;
    }
    // 短縮形式のIPv6
    if (ip.includes('::')) {
      return true;
    }
    return false;
  },
  isIPv4: (ip: string): boolean => {
    if (!ip || typeof ip !== 'string') {
      return false;
    }
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) {
      return false;
    }
    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  },
  isIPv6: (ip: string): boolean => {
    if (!ip || typeof ip !== 'string') {
      return false;
    }
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) {
      return true;
    }
    if (ip.includes('::')) {
      return true;
    }
    return false;
  },
};

// CommonJS形式とESM形式の両方でエクスポート
export default isIp;
export const isIP = isIp.isIP;
export const isIPv4 = isIp.isIPv4;
export const isIPv6 = isIp.isIPv6;
export * from 'is-ip';
