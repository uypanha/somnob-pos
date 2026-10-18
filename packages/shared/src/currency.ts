import { ChangeCalculationResult, CartLineItem, OrderCalculationSummary } from './types';
import { PricingTier } from './enums';

/**
 * Rounds a number to a specified number of decimal places using Half-Up rounding.
 */
export function roundToDecimal(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Rounds KHR amount to the nearest whole integer.
 */
export function roundKhr(khrAmount: number): number {
  return Math.round(khrAmount);
}

/**
 * Converts USD amount to KHR using the given exchange rate.
 */
export function convertUsdToKhr(amountUsd: number, exchangeRate: number): number {
  return roundKhr(amountUsd * exchangeRate);
}

/**
 * Converts KHR amount to USD using the given exchange rate.
 */
export function convertKhrToUsd(amountKhr: number, exchangeRate: number): number {
  if (exchangeRate <= 0) return 0;
  return roundToDecimal(amountKhr / exchangeRate, 2);
}

/**
 * Authoritative Order Price Calculator:
 * Calculates line totals, taxes, discounts, and dual-currency totals.
 * Handles wholesale pricing if pricingTier is WHOLESALE and quantity >= minWholesaleQty.
 */
export function calculateOrderTotals(
  items: CartLineItem[],
  exchangeRate: number,
  orderDiscountUsd: number = 0,
  taxRatePercentage: number = 0, // e.g. 10 for 10% VAT
  pricingTier: PricingTier = PricingTier.RETAIL
): OrderCalculationSummary {
  let subtotalUsd = 0;

  const processedItems = items.map((item) => {
    let effectiveUnitPrice = item.unitPriceUsd;
    let appliedPriceType = PricingTier.RETAIL;

    // Apply wholesale pricing if eligible
    if (
      pricingTier === PricingTier.WHOLESALE &&
      item.wholesalePriceUsd !== undefined &&
      item.wholesalePriceUsd !== null &&
      item.wholesalePriceUsd > 0 &&
      item.quantity >= (item.minWholesaleQty || 1)
    ) {
      effectiveUnitPrice = item.wholesalePriceUsd;
      appliedPriceType = PricingTier.WHOLESALE;
    }

    const lineDiscount = item.discountUsd || 0;
    const lineSubtotal = roundToDecimal(
      Math.max(0, effectiveUnitPrice * item.quantity - lineDiscount),
      2
    );

    subtotalUsd += lineSubtotal;

    return {
      ...item,
      priceType: appliedPriceType,
      effectiveUnitPriceUsd: effectiveUnitPrice,
      subtotalUsd: lineSubtotal,
    };
  });

  subtotalUsd = roundToDecimal(subtotalUsd, 2);
  const normalizedDiscount = Math.min(subtotalUsd, roundToDecimal(orderDiscountUsd, 2));
  const taxableAmount = Math.max(0, subtotalUsd - normalizedDiscount);
  const taxUsd = roundToDecimal(taxableAmount * (taxRatePercentage / 100), 2);
  const totalUsd = roundToDecimal(taxableAmount + taxUsd, 2);
  const totalKhr = convertUsdToKhr(totalUsd, exchangeRate);

  return {
    pricingTier,
    subtotalUsd,
    discountUsd: normalizedDiscount,
    taxUsd,
    totalUsd,
    exchangeRate,
    totalKhr,
    items: processedItems,
  };
}

/**
 * Dual-Currency Tender and Change Calculator:
 * Computes whether an order is paid and change due in USD and KHR.
 */
export function calculateChange(
  totalDueUsd: number,
  tenderedUsd: number,
  tenderedKhr: number,
  exchangeRate: number
): ChangeCalculationResult {
  const tenderKhrInUsd = convertKhrToUsd(tenderedKhr, exchangeRate);
  const totalTenderedInUsd = roundToDecimal(tenderedUsd + tenderKhrInUsd, 2);
  const totalDueKhr = convertUsdToKhr(totalDueUsd, exchangeRate);

  if (totalTenderedInUsd >= totalDueUsd) {
    const changeDueUsd = roundToDecimal(totalTenderedInUsd - totalDueUsd, 2);
    const changeDueKhr = convertUsdToKhr(changeDueUsd, exchangeRate);

    return {
      totalDueUsd,
      totalDueKhr,
      tenderedUsd,
      tenderedKhr,
      totalTenderedInUsd,
      changeDueUsd,
      changeDueKhr,
      isFullyPaid: true,
      shortageUsd: 0,
    };
  } else {
    const shortageUsd = roundToDecimal(totalDueUsd - totalTenderedInUsd, 2);
    return {
      totalDueUsd,
      totalDueKhr,
      tenderedUsd,
      tenderedKhr,
      totalTenderedInUsd,
      changeDueUsd: 0,
      changeDueKhr: 0,
      isFullyPaid: false,
      shortageUsd,
    };
  }
}
