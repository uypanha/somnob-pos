import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  roundToDecimal,
  roundKhr,
  convertUsdToKhr,
  convertKhrToUsd,
  calculateOrderTotals,
  calculateChange,
} from './currency';
import { PricingTier } from './enums';

describe('Financial Precision & Hardening Edge Cases', () => {
  it('correctly handles Half-Up boundary conditions', () => {
    // 0.005 rounds up to 0.01
    assert.strictEqual(roundToDecimal(0.005, 2), 0.01);
    // 0.004999 rounds down to 0.00
    assert.strictEqual(roundToDecimal(0.004999, 2), 0.00);
    // 1.005 rounds to 1.01
    assert.strictEqual(roundToDecimal(1.005, 2), 1.01);
    // 1.004 rounds to 1.00
    assert.strictEqual(roundToDecimal(1.004, 2), 1.00);
  });

  it('accurately converts large currency figures without precision drift', () => {
    const rate = 4100;
    const largeUsd = 250000.5; // $250,000.50
    const khr = convertUsdToKhr(largeUsd, rate);
    assert.strictEqual(khr, 1025002050); // 1,025,002,050 KHR

    const backToUsd = convertKhrToUsd(khr, rate);
    assert.strictEqual(backToUsd, 250000.5);
  });

  it('handles zero and negative conversion guards safely', () => {
    assert.strictEqual(convertKhrToUsd(10000, 0), 0);
    assert.strictEqual(convertKhrToUsd(10000, -1), 0);
  });

  it('guarantees mixed tender change never outputs negative change or NaN', () => {
    const rate = 4100;

    // Exact tender: total $10, paid $5 + 20,500៛
    const exact = calculateChange(10.0, 5.0, 20500, rate);
    assert.strictEqual(exact.isFullyPaid, true);
    assert.strictEqual(exact.changeDueUsd, 0.0);
    assert.strictEqual(exact.changeDueKhr, 0);
    assert.strictEqual(exact.shortageUsd, 0);

    // Overpayment with mixed tender: total $10, paid $10 + 4,100៛
    const over = calculateChange(10.0, 10.0, 4100, rate);
    assert.strictEqual(over.isFullyPaid, true);
    assert.strictEqual(over.changeDueUsd, 1.0);
    assert.strictEqual(over.changeDueKhr, 4100);

    // Underpayment: total $10, paid $5 + 10,000៛ (10,000 / 4,100 = 2.44 USD -> Total paid 7.44 USD)
    const under = calculateChange(10.0, 5.0, 10000, rate);
    assert.strictEqual(under.isFullyPaid, false);
    assert.strictEqual(under.changeDueUsd, 0.0);
    assert.strictEqual(under.changeDueKhr, 0);
    assert.strictEqual(under.shortageUsd, 2.56);
  });

  it('handles multi-item wholesale quantity thresholds strictly', () => {
    const rate = 4100;
    const items = [
      {
        variantId: 'v1',
        productName: 'Coke',
        variantName: 'Can',
        sku: 'COKE',
        unitPriceUsd: 1.0,
        wholesalePriceUsd: 0.8,
        minWholesaleQty: 24,
        costPriceUsd: 0.5,
        quantity: 23, // 1 less than min threshold!
        priceType: PricingTier.WHOLESALE,
      },
    ];

    // Must NOT get wholesale discount because qty 23 < min 24
    const summaryNotEligible = calculateOrderTotals(items, rate, 0, 0, PricingTier.WHOLESALE);
    assert.strictEqual(summaryNotEligible.items[0].effectiveUnitPriceUsd, 1.0);
    assert.strictEqual(summaryNotEligible.totalUsd, 23.0);

    // Now test with exactly 24
    items[0].quantity = 24;
    const summaryEligible = calculateOrderTotals(items, rate, 0, 0, PricingTier.WHOLESALE);
    assert.strictEqual(summaryEligible.items[0].effectiveUnitPriceUsd, 0.8);
    assert.strictEqual(summaryEligible.totalUsd, 19.2); // 24 * 0.80 = 19.20
  });
});
