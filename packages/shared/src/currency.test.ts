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
import { CartLineItem } from './types';

describe('Currency and Financial Calculations', () => {
  const EXCHANGE_RATE = 4100; // 1 USD = 4100 KHR

  it('correctly rounds decimal values using Half-Up rounding', () => {
    assert.strictEqual(roundToDecimal(10.254, 2), 10.25);
    assert.strictEqual(roundToDecimal(10.255, 2), 10.26);
    assert.strictEqual(roundToDecimal(10.256, 2), 10.26);
  });

  it('correctly converts USD to KHR and vice-versa', () => {
    assert.strictEqual(convertUsdToKhr(1.0, EXCHANGE_RATE), 4100);
    assert.strictEqual(convertUsdToKhr(2.5, EXCHANGE_RATE), 10250);
    assert.strictEqual(convertKhrToUsd(4100, EXCHANGE_RATE), 1.0);
    assert.strictEqual(convertKhrToUsd(20500, EXCHANGE_RATE), 5.0);
  });

  it('calculates retail order totals accurately', () => {
    const items: CartLineItem[] = [
      {
        variantId: 'v1',
        productName: 'Coca Cola Can',
        variantName: '330ml',
        sku: 'COKE-330',
        unitPriceUsd: 0.75,
        costPriceUsd: 0.5,
        quantity: 2,
        priceType: PricingTier.RETAIL,
        minWholesaleQty: 10,
        wholesalePriceUsd: 0.6,
      },
      {
        variantId: 'v2',
        productName: 'Angkor Beer',
        variantName: 'Can 330ml',
        sku: 'BEER-330',
        unitPriceUsd: 1.25,
        costPriceUsd: 0.9,
        quantity: 4,
        priceType: PricingTier.RETAIL,
        minWholesaleQty: 24,
        wholesalePriceUsd: 1.0,
      },
    ];

    // Subtotal: (0.75 * 2) + (1.25 * 4) = 1.50 + 5.00 = 6.50 USD
    // Tax (10% VAT): 0.65 USD -> Total: 7.15 USD
    const result = calculateOrderTotals(items, EXCHANGE_RATE, 0, 10, PricingTier.RETAIL);

    assert.strictEqual(result.subtotalUsd, 6.5);
    assert.strictEqual(result.taxUsd, 0.65);
    assert.strictEqual(result.totalUsd, 7.15);
    assert.strictEqual(result.totalKhr, 29315); // 7.15 * 4100
    assert.strictEqual(result.items[0].effectiveUnitPriceUsd, 0.75);
    assert.strictEqual(result.items[0].priceType, PricingTier.RETAIL);
  });

  it('applies wholesale pricing when customer is wholesale-approved and quantity meets threshold', () => {
    const items: CartLineItem[] = [
      {
        variantId: 'v1',
        productName: 'Mineral Water 500ml Case',
        variantName: '24 Bottles',
        sku: 'WATER-CASE',
        unitPriceUsd: 4.5,
        wholesalePriceUsd: 3.8,
        costPriceUsd: 3.0,
        quantity: 5,
        minWholesaleQty: 3,
        priceType: PricingTier.RETAIL,
      },
      {
        variantId: 'v2',
        productName: 'Single Snack Pack',
        variantName: 'Default',
        sku: 'SNACK-01',
        unitPriceUsd: 2.0,
        wholesalePriceUsd: 1.5,
        costPriceUsd: 1.0,
        quantity: 1, // Below minWholesaleQty (5)
        minWholesaleQty: 5,
        priceType: PricingTier.RETAIL,
      },
    ];

    const result = calculateOrderTotals(items, EXCHANGE_RATE, 0, 0, PricingTier.WHOLESALE);

    // Item 1: meets minWholesaleQty (5 >= 3) -> Wholesale price 3.80 * 5 = 19.00 USD
    assert.strictEqual(result.items[0].effectiveUnitPriceUsd, 3.8);
    assert.strictEqual(result.items[0].priceType, PricingTier.WHOLESALE);
    assert.strictEqual(result.items[0].subtotalUsd, 19.0);

    // Item 2: fails minWholesaleQty (1 < 5) -> Falls back to retail price 2.00 * 1 = 2.00 USD
    assert.strictEqual(result.items[1].effectiveUnitPriceUsd, 2.0);
    assert.strictEqual(result.items[1].priceType, PricingTier.RETAIL);
    assert.strictEqual(result.items[1].subtotalUsd, 2.0);

    // Total: 19.00 + 2.00 = 21.00 USD
    assert.strictEqual(result.totalUsd, 21.0);
    assert.strictEqual(result.totalKhr, 86100); // 21 * 4100
  });

  it('correctly calculates mixed tender change (USD + KHR) for cashiers', () => {
    // Total bill is 7.50 USD (30,750 KHR)
    const totalDueUsd = 7.5;
    // Customer tenders $5 USD bill + 15,000 KHR note
    // 15,000 KHR / 4100 = 3.66 USD
    // Total tendered: $5.00 + $3.66 = $8.66 USD
    // Change due: 8.66 - 7.50 = 1.16 USD -> 1.16 * 4100 = 4,756 KHR
    const change = calculateChange(totalDueUsd, 5.0, 15000, EXCHANGE_RATE);

    assert.strictEqual(change.isFullyPaid, true);
    assert.strictEqual(change.totalTenderedInUsd, 8.66);
    assert.strictEqual(change.changeDueUsd, 1.16);
    assert.strictEqual(change.changeDueKhr, 4756);
    assert.strictEqual(change.shortageUsd, 0);
  });

  it('detects shortage when tender is insufficient', () => {
    const totalDueUsd = 10.0;
    // Customer tenders $5 USD + 10,000 KHR (~$2.44) -> Total: $7.44 USD
    const change = calculateChange(totalDueUsd, 5.0, 10000, EXCHANGE_RATE);

    assert.strictEqual(change.isFullyPaid, false);
    assert.strictEqual(change.changeDueUsd, 0);
    assert.strictEqual(change.shortageUsd, 2.56);
  });
});
