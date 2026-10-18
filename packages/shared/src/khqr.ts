/**
 * KHQR (Cambodia National Bank Bakong QR) EMVCo Generator
 * Zero-dependency, deterministic KHQR payload implementation.
 */

export interface KhqrOptions {
  bakongAccountId: string; // e.g. "somnob_retail@aclb"
  merchantName: string; // e.g. "Somnob Retail Group"
  merchantCity?: string; // e.g. "Phnom Penh"
  currency: 'USD' | 'KHR'; // 'USD' (840) or 'KHR' (116)
  amount: number; // e.g. 12.50 or 51250
  orderNumber: string; // e.g. "POS-20261018-0001"
  storeCode?: string; // e.g. "STR-001"
  terminalId?: string; // e.g. "REG-01"
}

/**
 * Formats a single EMVCo Tag-Length-Value chunk.
 */
export function formatEmvTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Calculates CRC-16/CCITT-FALSE checksum (polynomial 0x1021, init 0xFFFF).
 */
export function calculateCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generates an EMVCo-compliant KHQR Dynamic QR payload string.
 */
export function generateKhqrPayload(options: KhqrOptions): string {
  const currencyCode = options.currency === 'USD' ? '840' : '116';
  const amountStr =
    options.currency === 'USD'
      ? options.amount.toFixed(2)
      : Math.round(options.amount).toString();

  // Tag 29: Merchant Account Information (Bakong Account)
  // Sub-tag 00: Bakong Account ID
  const subTag00 = formatEmvTag('00', options.bakongAccountId);
  const merchantAccountInfo = formatEmvTag('29', subTag00);

  // Tag 62: Additional Data Field Template
  let subTagBill = formatEmvTag('01', options.orderNumber);
  if (options.storeCode) {
    subTagBill += formatEmvTag('02', options.storeCode);
  }
  if (options.terminalId) {
    subTagBill += formatEmvTag('07', options.terminalId);
  }
  const additionalData = formatEmvTag('62', subTagBill);

  const payloadWithoutCrc =
    formatEmvTag('00', '01') + // Payload Format Indicator
    formatEmvTag('01', '12') + // Point of Initiation: 12 (Dynamic QR)
    merchantAccountInfo + // Tag 29
    formatEmvTag('52', '5411') + // Merchant Category Code: Grocery / Retail
    formatEmvTag('53', currencyCode) + // Transaction Currency (840 or 116)
    formatEmvTag('54', amountStr) + // Transaction Amount
    formatEmvTag('58', 'KH') + // Country Code
    formatEmvTag('59', options.merchantName.slice(0, 25)) + // Merchant Name
    formatEmvTag('60', (options.merchantCity || 'Phnom Penh').slice(0, 15)) + // Merchant City
    additionalData + // Tag 62
    '6304'; // Tag 63 (CRC ID + Length placeholder)

  const crc = calculateCrc16(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
}
