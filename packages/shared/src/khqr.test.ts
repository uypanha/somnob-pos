import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateCrc16, formatEmvTag, generateKhqrPayload } from './khqr';

describe('KHQR EMVCo Generator', () => {
  it('should correctly format EMVCo tag length and value', () => {
    assert.strictEqual(formatEmvTag('00', '01'), '000201');
    assert.strictEqual(formatEmvTag('58', 'KH'), '5802KH');
    assert.strictEqual(formatEmvTag('53', '840'), '5303840');
  });

  it('should calculate valid CRC16 CCITT checksum', () => {
    const testData = '0002010102126304';
    const crc = calculateCrc16(testData);
    assert.strictEqual(crc.length, 4);
    assert.strictEqual(/^[0-9A-F]{4}$/.test(crc), true);
  });

  it('should generate complete KHQR payload string for USD', () => {
    const payload = generateKhqrPayload({
      bakongAccountId: 'somnob_retail@aclb',
      merchantName: 'Somnob Retail Group',
      merchantCity: 'Phnom Penh',
      currency: 'USD',
      amount: 15.5,
      orderNumber: 'POS-20261018-0001',
      storeCode: 'STR-001',
      terminalId: 'REG-01',
    });

    assert.strictEqual(payload.startsWith('000201010212'), true);
    assert.strictEqual(payload.includes('5303840'), true); // Currency USD
    assert.strictEqual(payload.includes('540515.50'), true); // Amount 15.50
    assert.strictEqual(payload.includes('5802KH'), true); // Country KH
    assert.strictEqual(payload.includes('6304'), true); // CRC header
    assert.strictEqual(payload.length > 60, true);
  });

  it('should generate complete KHQR payload string for KHR', () => {
    const payload = generateKhqrPayload({
      bakongAccountId: 'somnob_retail@aclb',
      merchantName: 'Somnob Retail Group',
      currency: 'KHR',
      amount: 63550,
      orderNumber: 'WEB-20261018-0002',
    });

    assert.strictEqual(payload.includes('5303116'), true); // Currency KHR
    assert.strictEqual(payload.includes('540563550'), true); // Amount in KHR
    assert.strictEqual(payload.endsWith(calculateCrc16(payload.slice(0, -4))), true);
  });
});
