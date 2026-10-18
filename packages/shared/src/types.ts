import { PricingTier, Role, WholesaleStatus, CustomerType } from './enums';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  businessId: string;
}

export interface StoreSummary {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface CustomerSummary {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  customerType: CustomerType;
  wholesaleStatus: WholesaleStatus;
}

export interface ProductVariantItem {
  id: string;
  productId: string;
  variantName: string;
  sku: string;
  barcode?: string | null;
  costPriceUsd: number;
  sellingPriceUsd: number;
  wholesalePriceUsd?: number | null;
  minWholesaleQty: number;
  unitOfMeasure: string;
  quantityOnHand?: number;
}

export interface CartLineItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode?: string | null;
  unitPriceUsd: number;
  wholesalePriceUsd?: number | null;
  minWholesaleQty: number;
  costPriceUsd: number;
  quantity: number;
  priceType: PricingTier;
  discountUsd?: number;
}

export interface OrderCalculationSummary {
  pricingTier: PricingTier;
  subtotalUsd: number;
  discountUsd: number;
  taxUsd: number;
  totalUsd: number;
  exchangeRate: number;
  totalKhr: number;
  items: Array<CartLineItem & {
    effectiveUnitPriceUsd: number;
    subtotalUsd: number;
  }>;
}

export interface ChangeCalculationResult {
  totalDueUsd: number;
  totalDueKhr: number;
  tenderedUsd: number;
  tenderedKhr: number;
  totalTenderedInUsd: number;
  changeDueUsd: number;
  changeDueKhr: number;
  isFullyPaid: boolean;
  shortageUsd: number;
}

export interface OpenShiftDto {
  registerId: string;
  openingFloatUsd: number;
  openingFloatKhr: number;
  notes?: string;
}

export interface CloseShiftDto {
  closingCashUsd: number;
  closingCashKhr: number;
  notes?: string;
}

export interface ShiftSummary {
  id: string;
  registerId: string;
  registerName: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  openingFloatUsd: number;
  openingFloatKhr: number;
  closingCashUsd?: number | null;
  closingCashKhr?: number | null;
  expectedCashUsd?: number | null;
  expectedCashKhr?: number | null;
  differenceUsd?: number | null;
  differenceKhr?: number | null;
  totalOrders: number;
  cashSalesUsd: number;
  cardSalesUsd: number;
  khqrSalesUsd: number;
  status: string;
  notes?: string | null;
}

export interface PosCheckoutItemDto {
  variantId: string;
  quantity: number;
  discountUsd?: number;
}

export interface PosPaymentDto {
  paymentMethod: string;
  tenderedUsd?: number;
  tenderedKhr?: number;
  transactionRef?: string;
}

export interface PosCheckoutDto {
  idempotencyKey: string;
  storeId: string;
  shiftId?: string | null;
  customerId?: string | null;
  pricingTier?: PricingTier;
  orderDiscountUsd?: number;
  taxRatePercentage?: number;
  items: PosCheckoutItemDto[];
  payment: PosPaymentDto;
  isOfflineSale?: boolean;
  notes?: string;
}

export interface ReceiptData {
  orderNumber: string;
  storeName: string;
  storeAddress?: string | null;
  storePhone?: string | null;
  cashierName: string;
  customerName?: string | null;
  pricingTier: string;
  createdAt: string;
  items: Array<{
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPriceUsd: number;
    subtotalUsd: number;
  }>;
  subtotalUsd: number;
  discountUsd: number;
  taxUsd: number;
  totalUsd: number;
  totalKhr: number;
  exchangeRate: number;
  paymentMethod: string;
  tenderedUsd: number;
  tenderedKhr: number;
  changeUsd: number;
  changeKhr: number;
  transactionRef?: string | null;
}
