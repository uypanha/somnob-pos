import { useState, useEffect, useRef, useMemo } from 'react';
import {
  calculateChange,
  calculateOrderTotals,
  PricingTier,
  PaymentMethod,
  ShiftStatus,
  WholesaleStatus,
} from '@somnob/shared';
import { api } from './lib/api';
import {
  ShoppingCart,
  Barcode,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  Printer,
  Wifi,
  WifiOff,
  Lock,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface CartItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  barcode?: string | null;
  size?: string | null;
  color?: string | null;
  unitPriceUsd: number;
  wholesalePriceUsd?: number | null;
  minWholesaleQty: number;
  costPriceUsd: number;
  quantity: number;
  discountUsd: number;
}

export default function PosApp() {
  // Store & Terminal State
  const [storeId] = useState<string>('STR-001'); // Flagship Store
  const [exchangeRate] = useState<number>(4100);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Auth & Shift State
  const [cashier, setCashier] = useState<{ id: string; fullName: string; role: string } | null>({
    id: 'user-cashier-1',
    fullName: 'Sophea Chan (Cashier)',
    role: 'CASHIER',
  });
  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [currentShift, setCurrentShift] = useState<any>({
    id: 'shift-active-1',
    registerId: 'reg-01',
    registerName: 'Register 1 - Front Counter',
    registerCode: 'REG-01',
    openedAt: new Date().toISOString(),
    openingFloatUsd: 50.0,
    openingFloatKhr: 200000,
    status: ShiftStatus.OPEN,
  });

  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false);
  const [openFloatUsd, setOpenFloatUsd] = useState<string>('50');
  const [openFloatKhr, setOpenFloatKhr] = useState<string>('200000');
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [closingCashUsd, setClosingCashUsd] = useState<string>('50');
  const [closingCashKhr, setClosingCashKhr] = useState<string>('200000');
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Catalog & Customer State
  const [categories] = useState<any[]>([
    { id: 'all', name: 'All Products' },
    { id: 'cat-bev', name: 'Beverages' },
    { id: 'cat-water', name: 'Water & Hydration' },
    { id: 'cat-snack', name: 'Snacks & Food' },
    { id: 'cat-apparel', name: 'Apparel & Clothes' },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [catalog, setCatalog] = useState<any[]>([
    {
      id: 'var-coke',
      productId: 'p-1',
      productName: 'Coca-Cola',
      variantName: '330ml Can',
      sku: 'COKE-330',
      barcode: '8850123456789',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=160&auto=format&fit=crop&q=80',
      categoryId: 'cat-bev',
      sellingPriceUsd: 0.85,
      wholesalePriceUsd: 0.7,
      minWholesaleQty: 24,
      costPriceUsd: 0.5,
      unitOfMeasure: 'CAN',
      quantityOnHand: 96,
      hasSizes: false,
    },
    {
      id: 'var-angkor',
      productId: 'p-2',
      productName: 'Angkor Beer',
      variantName: '330ml Can',
      sku: 'ANGKOR-330',
      barcode: '8841234567890',
      imageUrl: 'https://images.unsplash.com/photo-1608270546103-97992796c303?w=160&auto=format&fit=crop&q=80',
      categoryId: 'cat-bev',
      sellingPriceUsd: 1.1,
      wholesalePriceUsd: 0.95,
      minWholesaleQty: 24,
      costPriceUsd: 0.75,
      unitOfMeasure: 'CAN',
      quantityOnHand: 72,
      hasSizes: false,
    },
    {
      id: 'var-vital',
      productId: 'p-3',
      productName: 'Vital Mineral Water',
      variantName: '500ml Bottle',
      sku: 'VITAL-500',
      barcode: '8840001112223',
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=160&auto=format&fit=crop&q=80',
      categoryId: 'cat-water',
      sellingPriceUsd: 0.35,
      wholesalePriceUsd: 0.28,
      minWholesaleQty: 24,
      costPriceUsd: 0.2,
      unitOfMeasure: 'BOTTLE',
      quantityOnHand: 150,
      hasSizes: false,
    },
    {
      id: 'var-lays',
      productId: 'p-4',
      productName: "Lay's Classic Potato Chips",
      variantName: '50g Pack',
      sku: 'LAYS-50',
      barcode: '8850987654321',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=160&auto=format&fit=crop&q=80',
      categoryId: 'cat-snack',
      sellingPriceUsd: 1.25,
      wholesalePriceUsd: 1.05,
      minWholesaleQty: 10,
      costPriceUsd: 0.8,
      unitOfMeasure: 'BAG',
      quantityOnHand: 40,
      hasSizes: false,
    },
    {
      id: 'prod-tshirt',
      productId: 'p-5',
      productName: 'Angkor Heritage Graphic T-Shirt',
      variantName: 'Multiple Sizes Available',
      sku: 'TSHIRT-ANGKOR',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
      categoryId: 'cat-apparel',
      sellingPriceUsd: 12.0,
      wholesalePriceUsd: 9.5,
      minWholesaleQty: 10,
      costPriceUsd: 4.5,
      unitOfMeasure: 'PCS',
      quantityOnHand: 97,
      hasSizes: true,
      color: 'Black',
      sizeVariants: [
        {
          id: 'var-tshirt-s',
          variantName: 'Small (S)',
          size: 'S',
          color: 'Black',
          sku: 'TSHIRT-BLK-S',
          barcode: '884900111002',
          sellingPriceUsd: 12.0,
          wholesalePriceUsd: 9.5,
          minWholesaleQty: 10,
          costPriceUsd: 4.5,
          quantityOnHand: 25,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-tshirt-m',
          variantName: 'Medium (M)',
          size: 'M',
          color: 'Black',
          sku: 'TSHIRT-BLK-M',
          barcode: '884900111003',
          sellingPriceUsd: 12.0,
          wholesalePriceUsd: 9.5,
          minWholesaleQty: 10,
          costPriceUsd: 4.5,
          quantityOnHand: 32,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-tshirt-l',
          variantName: 'Large (L)',
          size: 'L',
          color: 'Black',
          sku: 'TSHIRT-BLK-L',
          barcode: '884900111004',
          sellingPriceUsd: 12.0,
          wholesalePriceUsd: 9.5,
          minWholesaleQty: 10,
          costPriceUsd: 4.5,
          quantityOnHand: 18,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-tshirt-xl',
          variantName: 'Extra Large (XL)',
          size: 'XL',
          color: 'Black',
          sku: 'TSHIRT-BLK-XL',
          barcode: '884900111005',
          sellingPriceUsd: 13.5,
          wholesalePriceUsd: 10.5,
          minWholesaleQty: 10,
          costPriceUsd: 5.0,
          quantityOnHand: 14,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-tshirt-xxl',
          variantName: 'Double Extra Large (XXL)',
          size: 'XXL',
          color: 'Black',
          sku: 'TSHIRT-BLK-XXL',
          barcode: '884900111006',
          sellingPriceUsd: 14.5,
          wholesalePriceUsd: 11.5,
          minWholesaleQty: 10,
          costPriceUsd: 5.5,
          quantityOnHand: 8,
          unitOfMeasure: 'PCS',
        },
      ],
    },
    {
      id: 'prod-hoodie',
      productId: 'p-6',
      productName: 'Somnob Premium Fleece Hoodie',
      variantName: 'Multiple Sizes Available',
      sku: 'HOODIE-FLEECE',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
      categoryId: 'cat-apparel',
      sellingPriceUsd: 26.0,
      wholesalePriceUsd: 21.0,
      minWholesaleQty: 5,
      costPriceUsd: 12.0,
      unitOfMeasure: 'PCS',
      quantityOnHand: 53,
      hasSizes: true,
      color: 'Heather Grey',
      sizeVariants: [
        {
          id: 'var-hoodie-s',
          variantName: 'Small (S)',
          size: 'S',
          color: 'Heather Grey',
          sku: 'HOODIE-GRY-S',
          barcode: '884900222001',
          sellingPriceUsd: 26.0,
          wholesalePriceUsd: 21.0,
          minWholesaleQty: 5,
          costPriceUsd: 12.0,
          quantityOnHand: 15,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-hoodie-m',
          variantName: 'Medium (M)',
          size: 'M',
          color: 'Heather Grey',
          sku: 'HOODIE-GRY-M',
          barcode: '884900222002',
          sellingPriceUsd: 26.0,
          wholesalePriceUsd: 21.0,
          minWholesaleQty: 5,
          costPriceUsd: 12.0,
          quantityOnHand: 20,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-hoodie-l',
          variantName: 'Large (L)',
          size: 'L',
          color: 'Heather Grey',
          sku: 'HOODIE-GRY-L',
          barcode: '884900222003',
          sellingPriceUsd: 26.0,
          wholesalePriceUsd: 21.0,
          minWholesaleQty: 5,
          costPriceUsd: 12.0,
          quantityOnHand: 12,
          unitOfMeasure: 'PCS',
        },
        {
          id: 'var-hoodie-xl',
          variantName: 'Extra Large (XL)',
          size: 'XL',
          color: 'Heather Grey',
          sku: 'HOODIE-GRY-XL',
          barcode: '884900222004',
          sellingPriceUsd: 28.0,
          wholesalePriceUsd: 22.5,
          minWholesaleQty: 5,
          costPriceUsd: 13.0,
          quantityOnHand: 6,
          unitOfMeasure: 'PCS',
        },
      ],
    },
  ]);

  const [customers] = useState<any[]>([
    {
      id: 'cust-retail',
      fullName: 'Walk-in Customer',
      phone: 'N/A',
      customerType: 'RETAIL',
      wholesaleStatus: WholesaleStatus.NONE,
    },
    {
      id: 'cust-ws-1',
      fullName: 'Vannak Mart BKK1',
      phone: '+855 12 345 678',
      customerType: 'WHOLESALE',
      wholesaleStatus: WholesaleStatus.APPROVED,
    },
  ]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-retail');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDiscountUsd, setOrderDiscountUsd] = useState<number>(0);
  const [taxRatePercentage] = useState<number>(0); // 0% or 10%

  // Checkout & Payment State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [tenderUsdInput, setTenderUsdInput] = useState<string>('0');
  const [tenderKhrInput, setTenderKhrInput] = useState<string>('0');
  const [cardRefInput, setCardRefInput] = useState<string>('');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  // Size Variant Selection Modal State
  const [sizeModalProduct, setSizeModalProduct] = useState<any | null>(null);

  // Barcode Scanner Fast Buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Monitor Network Online/Offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of offline queue
    api.getPendingCount().then((count) => setPendingSyncCount(count));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    try {
      const res = await api.syncOfflineSales();
      const remaining = await api.getPendingCount();
      setPendingSyncCount(remaining);
      if (res.synced > 0) {
        alert(`Synced ${res.synced} offline transaction(s) successfully!`);
      }
    } catch (err) {
      console.error('Offline sync failed', err);
    }
  };

  // Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an active modal text input
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        (activeEl as HTMLInputElement).type !== 'button'
      ) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (diff > 100) {
        barcodeBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 4) {
          const scannedCode = barcodeBufferRef.current.trim();
          handleScannedBarcode(scannedCode);
          barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catalog]);

  const handleScannedBarcode = (barcode: string) => {
    const clean = barcode.trim().toLowerCase();
    for (const item of catalog) {
      if (item.hasSizes && item.sizeVariants) {
        const match = item.sizeVariants.find(
          (v: any) =>
            (v.barcode && v.barcode.toLowerCase() === clean) ||
            v.sku.toLowerCase() === clean,
        );
        if (match) {
          addToCart(match, item.productName);
          return;
        }
      } else if (
        (item.barcode && item.barcode.toLowerCase() === clean) ||
        item.sku.toLowerCase() === clean
      ) {
        addToCart(item);
        return;
      }
    }
    alert(`Product with barcode or SKU "${barcode}" not found in catalog.`);
  };

  // Selected Customer Wholesale Status
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  const isApprovedWholesale = selectedCustomer?.wholesaleStatus === WholesaleStatus.APPROVED;
  const activePricingTier = isApprovedWholesale ? PricingTier.WHOLESALE : PricingTier.RETAIL;

  // Cart Authoritative Calculations using @somnob/shared
  const cartSummary = useMemo(() => {
    const sharedItems = cart.map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      barcode: item.barcode,
      size: item.size,
      color: item.color,
      unitPriceUsd: item.unitPriceUsd,
      wholesalePriceUsd: item.wholesalePriceUsd,
      minWholesaleQty: item.minWholesaleQty,
      costPriceUsd: item.costPriceUsd,
      quantity: item.quantity,
      priceType: activePricingTier,
      discountUsd: item.discountUsd,
    }));

    return calculateOrderTotals(
      sharedItems,
      exchangeRate,
      orderDiscountUsd,
      taxRatePercentage,
      activePricingTier,
    );
  }, [cart, exchangeRate, orderDiscountUsd, taxRatePercentage, activePricingTier]);

  // Cash Tender Calculation
  const tenderUsdNum = parseFloat(tenderUsdInput) || 0;
  const tenderKhrNum = parseFloat(tenderKhrInput) || 0;
  const changeResult = useMemo(() => {
    return calculateChange(cartSummary.totalUsd, tenderUsdNum, tenderKhrNum, exchangeRate);
  }, [cartSummary.totalUsd, tenderUsdNum, tenderKhrNum, exchangeRate]);

  // Cart Operations
  const addToCart = (product: any, overrideProductName?: string) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.variantId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          variantId: product.id,
          productName: overrideProductName || product.productName,
          variantName: product.variantName,
          sku: product.sku,
          barcode: product.barcode,
          size: product.size || null,
          color: product.color || null,
          unitPriceUsd: product.sellingPriceUsd,
          wholesalePriceUsd: product.wholesalePriceUsd,
          minWholesaleQty: product.minWholesaleQty || 1,
          costPriceUsd: product.costPriceUsd || 0,
          quantity: 1,
          discountUsd: 0,
        },
      ];
    });
  };

  const handleProductCardClick = (product: any) => {
    if (product.hasSizes && product.sizeVariants && product.sizeVariants.length > 0) {
      setSizeModalProduct(product);
    } else {
      addToCart(product);
    }
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.variantId === variantId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderDiscountUsd(0);
  };

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setTenderUsdInput(cartSummary.totalUsd.toString());
    setTenderKhrInput('0');
    setCardRefInput('');
    setPaymentMethod(PaymentMethod.CASH);
    setShowPaymentModal(true);
  };

  // Quick Cash Buttons
  const handleQuickUsdTender = (amount: number) => {
    setTenderUsdInput(amount.toString());
  };

  const handleQuickKhrTender = (amount: number) => {
    setTenderKhrInput(amount.toString());
  };

  // Process Checkout
  const handleCompleteSale = async () => {
    if (paymentMethod === PaymentMethod.CASH && !changeResult.isFullyPaid) {
      alert(`Insufficient cash tendered! Short by $${changeResult.shortageUsd.toFixed(2)}.`);
      return;
    }

    setIsProcessingCheckout(true);
    const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      idempotencyKey,
      storeId,
      shiftId: currentShift?.id,
      customerId: selectedCustomerId === 'cust-retail' ? null : selectedCustomerId,
      pricingTier: activePricingTier,
      orderDiscountUsd,
      taxRatePercentage,
      totalUsd: cartSummary.totalUsd,
      totalKhr: cartSummary.totalKhr,
      changeUsd: changeResult.changeDueUsd,
      changeKhr: changeResult.changeDueKhr,
      items: cart.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        discountUsd: i.discountUsd,
      })),
      payment: {
        paymentMethod,
        tenderedUsd: paymentMethod === PaymentMethod.CASH ? tenderUsdNum : cartSummary.totalUsd,
        tenderedKhr: paymentMethod === PaymentMethod.CASH ? tenderKhrNum : 0,
        transactionRef: cardRefInput || null,
      },
    };

    try {
      const receipt = await api.checkout(payload, isOnline);
      setShowPaymentModal(false);
      setCompletedReceipt(receipt);
      clearCart();

      // Deduct local catalog stock
      setCatalog((prev) =>
        prev.map((item) => {
          const inCart = cart.find((c) => c.variantId === item.id);
          if (inCart) {
            return {
              ...item,
              quantityOnHand: Math.max(0, item.quantityOnHand - inCart.quantity),
            };
          }
          return item;
        }),
      );

      if (receipt.isOfflineQueued) {
        const remaining = await api.getPendingCount();
        setPendingSyncCount(remaining);
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // PIN Login / Switch Cashier
  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPinInput('');
    setPinError('');
  };

  const handlePinSubmit = () => {
    if (pinInput === '1234' || pinInput === '5678') {
      setCashier({
        id: pinInput === '1234' ? 'user-cashier-1' : 'user-clerk-1',
        fullName: pinInput === '1234' ? 'Sophea Chan (Cashier)' : 'Vireak Men (Inventory Clerk)',
        role: pinInput === '1234' ? 'CASHIER' : 'STOCK_CLERK',
      });
      setIsPinLocked(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Invalid Cashier PIN code. Try 1234.');
    }
  };

  // Open Shift Handler
  const handleOpenShiftSubmit = () => {
    setCurrentShift({
      id: `shift-${Date.now()}`,
      registerId: 'reg-01',
      registerName: 'Register 1 - Front Counter',
      registerCode: 'REG-01',
      openedAt: new Date().toISOString(),
      openingFloatUsd: parseFloat(openFloatUsd) || 0,
      openingFloatKhr: parseFloat(openFloatKhr) || 0,
      status: ShiftStatus.OPEN,
    });
    setShowOpenShiftModal(false);
  };

  // Shift Close Z-Report
  const handleCloseShiftConfirm = async () => {
    try {
      const closeDto = {
        closingCashUsd: parseFloat(closingCashUsd) || 0,
        closingCashKhr: parseFloat(closingCashKhr) || 0,
        notes: closingNotes,
      };

      // In real scenario calls api.closeShift
      setShowCloseShiftModal(false);
      alert(
        `Register Shift closed successfully!\nZ-Report generated:\nActual USD: $${closeDto.closingCashUsd}\nActual KHR: ${closeDto.closingCashKhr.toLocaleString()}៛`,
      );
      setCurrentShift(null);
    } catch (err: any) {
      alert(`Failed to close shift: ${err.message}`);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      const matchCat =
        selectedCategory === 'all' || product.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery ||
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchQuery));
      return matchCat && matchSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* 1. TOP HEADER BAR */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.25rem',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <div>
              <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>Somnob POS</strong>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                BKK1 Flagship Store • {currentShift?.registerCode || 'REG-01'}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: isOnline ? '#064e3b' : '#7f1d1d',
              color: isOnline ? '#34d399' : '#f87171',
            }}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
          </div>

          {pendingSyncCount > 0 && (
            <button
              onClick={triggerSync}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <RefreshCw size={12} />
              <span>{pendingSyncCount} Offline Sale(s) Ready to Sync</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Exchange Rate Badge */}
          <div
            style={{
              background: '#0f172a',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid #334155',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: '#94a3b8' }}>Exchange Rate: </span>
            <strong style={{ color: '#38bdf8' }}>$1 = {exchangeRate.toLocaleString()}៛</strong>
          </div>

          {/* Current Shift Badge */}
          {currentShift ? (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#334155',
                color: '#e2e8f0',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Clock size={14} color="#38bdf8" />
              <span>Shift Active (End Shift)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Open Register Shift
            </button>
          )}

          {/* Cashier Quick Switch */}
          <button
            onClick={() => setIsPinLocked(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <User size={14} />
            <span>{cashier?.fullName || 'Cashier'}</span>
            <Lock size={12} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      </header>

      {/* 2. MAIN POS WORKSPACE */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT PANEL: CATALOG & BARCODE SCANNER */}
        <section
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            borderRight: '1px solid #334155',
            overflow: 'hidden',
          }}
        >
          {/* Quick Search & Barcode Input */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: '#1e293b',
                borderRadius: '8px',
                padding: '0 1rem',
                border: '1px solid #475569',
              }}
            >
              <Barcode size={20} color="#38bdf8" style={{ marginRight: '0.75rem' }} />
              <input
                type="text"
                placeholder="Scan Barcode or Search SKU / Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1rem',
                  padding: '0.85rem 0',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 500,
                    background: active ? '#2563eb' : '#1e293b',
                    color: active ? '#ffffff' : '#cbd5e1',
                    border: '1px solid ' + (active ? '#3b82f6' : '#334155'),
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.75rem',
              overflowY: 'auto',
              paddingRight: '0.25rem',
            }}
          >
            {filteredProducts.map((prod) => {
              const effectivePrice =
                isApprovedWholesale && prod.wholesalePriceUsd
                  ? prod.wholesalePriceUsd
                  : prod.sellingPriceUsd;

              const priceKhr = Math.round(effectivePrice * exchangeRate);

              return (
                <div
                  key={prod.id}
                  onClick={() => handleProductCardClick(prod)}
                  style={{
                    background: '#1e293b',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    border: '1px solid ' + (prod.hasSizes ? '#3b82f6' : '#334155'),
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    transition: 'border-color 0.15s, transform 0.1s',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.45rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#38bdf8',
                          background: '#0f172a',
                          padding: '0.18rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {prod.sku}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: prod.quantityOnHand > 10 ? '#34d399' : '#f87171',
                          fontWeight: 600,
                        }}
                      >
                        {prod.quantityOnHand} left
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.productName}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid #334155',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                            flexShrink: 0,
                          }}
                        >
                          📦
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.92rem', display: 'block', color: '#ffffff', lineHeight: 1.25 }}>
                          {prod.productName}
                        </strong>
                        {prod.hasSizes ? (
                          <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', background: '#2563eb', color: '#ffffff', padding: '0.12rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              👕 {prod.sizeVariants.length} Sizes
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Tap size →</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>
                            {prod.variantName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    {isApprovedWholesale && prod.wholesalePriceUsd ? (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                          Wholesale (min {prod.minWholesaleQty})
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                          ${effectivePrice.toFixed(2)}
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '4px' }}>
                            ({priceKhr.toLocaleString()}៛)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                        ${effectivePrice.toFixed(2)}
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '4px' }}>
                          ({priceKhr.toLocaleString()}៛)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT PANEL: CART & CHECKOUT */}
        <aside
          style={{
            width: '420px',
            background: '#131d31',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Cart Header & Customer Selector */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid #334155',
              background: '#1e293b',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} color="#38bdf8" />
                <strong style={{ fontSize: '1.05rem' }}>Current Order</strong>
                <span
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '0.1rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Customer Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: '1px solid ' + (isApprovedWholesale ? '#eab308' : '#475569'),
                  borderRadius: '6px',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.wholesaleStatus === WholesaleStatus.APPROVED ? '★ Wholesale' : ''}
                  </option>
                ))}
              </select>
            </div>
            {isApprovedWholesale && (
              <div
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#fde047',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <CheckCircle size={12} />
                <span>Wholesale Tier Pricing Active</span>
              </div>
            )}
          </div>

          {/* Cart Line Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {cart.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#64748b',
                }}
              >
                <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <span>Scan a barcode or tap products to start sale</span>
              </div>
            ) : (
              cart.map((item) => {
                const isWholesaleApplied =
                  isApprovedWholesale &&
                  item.wholesalePriceUsd &&
                  item.quantity >= item.minWholesaleQty;

                const effectiveUnitPrice = isWholesaleApplied
                  ? item.wholesalePriceUsd!
                  : item.unitPriceUsd;

                const lineSubtotal = effectiveUnitPrice * item.quantity - item.discountUsd;
                const lineKhr = Math.round(lineSubtotal * exchangeRate);

                return (
                  <div
                    key={item.variantId}
                    style={{
                      background: '#1e293b',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      border: '1px solid #334155',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                          {item.productName}
                        </strong>
                        {item.size && (
                          <span
                            style={{
                              marginLeft: '6px',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                            }}
                          >
                            Size: {item.size}
                          </span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {item.variantName} • ${effectiveUnitPrice.toFixed(2)}
                          {isWholesaleApplied && (
                            <span style={{ color: '#fbbf24', marginLeft: '4px', fontWeight: 600 }}>
                              [Wholesale]
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#38bdf8' }}>
                          ${lineSubtotal.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {lineKhr.toLocaleString()}៛
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.6rem',
                      }}
                    >
                      <button
                        onClick={() => removeItem(item.variantId)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '0.2rem',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateQuantity(item.variantId, -1)}
                          style={{
                            background: '#334155',
                            border: 'none',
                            color: '#ffffff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, 1)}
                          style={{
                            background: '#334155',
                            border: 'none',
                            color: '#ffffff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Financial Summary & Checkout Button */}
          <div
            style={{
              padding: '1rem',
              background: '#1e293b',
              borderTop: '1px solid #334155',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: '#94a3b8',
                marginBottom: '0.3rem',
              }}
            >
              <span>Subtotal:</span>
              <span>${cartSummary.subtotalUsd.toFixed(2)}</span>
            </div>

            {cartSummary.discountUsd > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: '#34d399',
                  marginBottom: '0.3rem',
                }}
              >
                <span>Order Discount:</span>
                <span>-${cartSummary.discountUsd.toFixed(2)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                margin: '0.6rem 0',
                paddingTop: '0.6rem',
                borderTop: '1px solid #334155',
              }}
            >
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Total Due:</strong>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  KHR: {cartSummary.totalKhr.toLocaleString()}៛
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
                ${cartSummary.totalUsd.toFixed(2)}
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={handleOpenPayment}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '8px',
                background: cart.length > 0 ? '#16a34a' : '#334155',
                color: cart.length > 0 ? '#ffffff' : '#64748b',
                border: 'none',
                cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: cart.length > 0 ? '0 4px 12px rgba(22, 163, 74, 0.4)' : 'none',
              }}
            >
              <CreditCard size={20} />
              <span>Charge ${cartSummary.totalUsd.toFixed(2)}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* 3. MULTI-TENDER PAYMENT MODAL */}
      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              width: '560px',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #475569',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff' }}>Select Payment Tender</h3>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  Total: ${cartSummary.totalUsd.toFixed(2)} ({cartSummary.totalKhr.toLocaleString()}៛)
                </span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: paymentMethod === PaymentMethod.CASH ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid ' + (paymentMethod === PaymentMethod.CASH ? '#3b82f6' : '#334155'),
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <DollarSign size={20} />
                <span>Cash (USD/KHR)</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: paymentMethod === PaymentMethod.CARD ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid ' + (paymentMethod === PaymentMethod.CARD ? '#3b82f6' : '#334155'),
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <CreditCard size={20} />
                <span>Card Terminal</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.KHQR)}
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: paymentMethod === PaymentMethod.KHQR ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  border: '1px solid ' + (paymentMethod === PaymentMethod.KHQR ? '#3b82f6' : '#334155'),
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <QrCode size={20} />
                <span>KHQR Bakong</span>
              </button>
            </div>

            {/* CASH TENDER VIEW */}
            {paymentMethod === PaymentMethod.CASH && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                      Tendered Cash (USD $)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tenderUsdInput}
                      onChange={(e) => setTenderUsdInput(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {[5, 10, 20, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => handleQuickUsdTender(amt)}
                          style={{
                            background: '#334155',
                            border: 'none',
                            color: '#e2e8f0',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                      Tendered Cash (KHR ៛)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={tenderKhrInput}
                      onChange={(e) => setTenderKhrInput(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      {[5000, 10000, 20000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => handleQuickKhrTender(amt)}
                          style={{
                            background: '#334155',
                            border: 'none',
                            color: '#e2e8f0',
                            borderRadius: '4px',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          {(amt / 1000).toFixed(0)}k៛
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Breakdown */}
                <div
                  style={{
                    background: changeResult.isFullyPaid ? '#064e3b' : '#7f1d1d',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Total Received:</span>
                    <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                      ${changeResult.totalTenderedInUsd.toFixed(2)}
                    </strong>
                  </div>

                  {changeResult.isFullyPaid ? (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>Change Due:</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                            ${changeResult.changeDueUsd.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.9rem', color: '#a7f3d0', marginLeft: '6px' }}>
                            ({changeResult.changeDueKhr.toLocaleString()}៛)
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.4rem', color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600 }}>
                      Shortage: ${changeResult.shortageUsd.toFixed(2)} (Need additional funds)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARD TENDER VIEW */}
            {paymentMethod === PaymentMethod.CARD && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  Card Authorization / Reference Number:
                </label>
                <input
                  type="text"
                  placeholder="e.g. VISA-998822"
                  value={cardRefInput}
                  onChange={(e) => setCardRefInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* KHQR BAKONG VIEW */}
            {paymentMethod === PaymentMethod.KHQR && (
              <div
                style={{
                  textAlign: 'center',
                  background: '#0f172a',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  border: '1px solid #334155',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                  }}
                >
                  <QrCode size={130} color="#0f172a" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e11d48' }}>
                  KHQR Bakong Dynamic Code
                </div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  Merchant: Somnob Retail • Amount: ${cartSummary.totalUsd.toFixed(2)} ({cartSummary.totalKhr.toLocaleString()}៛)
                </div>
              </div>
            )}

            {/* Complete Sale Action */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={isProcessingCheckout || (paymentMethod === PaymentMethod.CASH && !changeResult.isFullyPaid)}
                onClick={handleCompleteSale}
                style={{
                  flex: 2,
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background:
                    paymentMethod === PaymentMethod.CASH && !changeResult.isFullyPaid
                      ? '#475569'
                      : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {isProcessingCheckout ? 'Processing...' : 'Confirm & Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. THERMAL RECEIPT MODAL (80mm) */}
      {completedReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#000000',
              width: '380px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: 'monospace',
            }}
          >
            {/* Printable Receipt Content */}
            <div id="printable-receipt" style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem' }}>SOMNOB RETAIL POS</h2>
              <div style={{ fontSize: '0.8rem' }}>BKK1 Flagship Store</div>
              <div style={{ fontSize: '0.75rem' }}>Street 302, BKK1, Phnom Penh</div>
              <div style={{ fontSize: '0.75rem' }}>Tel: +855 23 888 999</div>
              <div style={{ margin: '0.5rem 0', borderBottom: '1px dashed #000' }} />

              <div style={{ textAlign: 'left', fontSize: '0.75rem', lineHeight: '1.4' }}>
                <div>Order: <strong>{completedReceipt.orderNumber}</strong></div>
                <div>Date: {new Date(completedReceipt.createdAt).toLocaleString()}</div>
                <div>Cashier: {cashier?.fullName || 'Cashier'}</div>
                {completedReceipt.customerName && (
                  <div>Customer: {completedReceipt.customerName}</div>
                )}
                {completedReceipt.pricingTier === PricingTier.WHOLESALE && (
                  <div>Tier: <strong>WHOLESALE TIER</strong></div>
                )}
              </div>

              <div style={{ margin: '0.5rem 0', borderBottom: '1px dashed #000' }} />

              {/* Line Items */}
              <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <th style={{ padding: '4px 0' }}>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedReceipt.items.map((i: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 0' }}>{i.productName || i.name}</td>
                      <td style={{ textAlign: 'center' }}>{i.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${(i.unitPriceUsd || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${(i.subtotalUsd || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ margin: '0.5rem 0', borderBottom: '1px dashed #000' }} />

              {/* Totals */}
              <div style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>${(completedReceipt.subtotalUsd || completedReceipt.totalUsd).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: '4px' }}>
                  <span>TOTAL (USD):</span>
                  <span>${completedReceipt.totalUsd.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>TOTAL (KHR):</span>
                  <span>{(completedReceipt.totalKhr || 0).toLocaleString()}៛</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'right' }}>
                  (Rate: $1 = {exchangeRate}៛)
                </div>
              </div>

              <div style={{ margin: '0.5rem 0', borderBottom: '1px dashed #000' }} />

              {/* Tender & Change */}
              <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Method:</span>
                  <span>{completedReceipt.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tendered:</span>
                  <span>${(completedReceipt.tenderedUsd || 0).toFixed(2)} + {(completedReceipt.tenderedKhr || 0).toLocaleString()}៛</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Change:</span>
                  <span>${(completedReceipt.changeUsd || 0).toFixed(2)} ({(completedReceipt.changeKhr || 0).toLocaleString()}៛)</span>
                </div>
              </div>

              <div style={{ margin: '0.8rem 0 0.4rem 0', fontSize: '0.75rem' }}>
                Thank you for shopping with Somnob!
              </div>
            </div>

            {/* Receipt Modal Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Printer size={16} />
                <span>Print</span>
              </button>
              <button
                onClick={() => setCompletedReceipt(null)}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '6px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CASHIER PIN PAD / LOCK SCREEN MODAL */}
      {isPinLocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#090d16',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              width: '320px',
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              border: '1px solid #334155',
            }}
          >
            <Lock size={36} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#ffffff' }}>Cashier Quick Switch</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Enter 4-digit Cashier PIN (e.g. 1234)</span>

            {/* Masked PIN Dots */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.75rem',
                margin: '1.5rem 0',
              }}
            >
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: pinInput.length > idx ? '#38bdf8' : '#334155',
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </div>

            {pinError && (
              <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {pinError}
              </div>
            )}

            {/* Numeric Keypad */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.6rem',
                marginBottom: '1rem',
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'C') handlePinClear();
                    else if (key === 'OK') handlePinSubmit();
                    else handlePinDigit(key);
                  }}
                  style={{
                    padding: '1rem',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: key === 'OK' ? '#16a34a' : key === 'C' ? '#ef4444' : '#0f172a',
                    color: '#ffffff',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsPinLocked(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 6. CLOSE SHIFT / Z-REPORT MODAL */}
      {showCloseShiftModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              width: '480px',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #475569',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#ffffff' }}>
              Close Register Shift (Z-Report)
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Count actual physical cash in register drawer before closing.
            </p>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#94a3b8' }}>Opening Float:</span>
                <strong>${currentShift?.openingFloatUsd?.toFixed(2)} + {currentShift?.openingFloatKhr?.toLocaleString()}៛</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#94a3b8' }}>Register:</span>
                <span>{currentShift?.registerCode || 'REG-01'}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Actual Cash (USD $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={closingCashUsd}
                  onChange={(e) => setClosingCashUsd(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Actual Cash (KHR ៛)
                </label>
                <input
                  type="number"
                  step="100"
                  value={closingCashKhr}
                  onChange={(e) => setClosingCashKhr(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                Shift Closing Notes:
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes or variance explanation..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowCloseShiftModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCloseShiftConfirm}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                End Shift & Close Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. OPEN SHIFT MODAL */}
      {showOpenShiftModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
          }}
        >
          <div
            style={{
              background: '#1e293b',
              width: '450px',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #475569',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#ffffff' }}>
              Open New Register Shift
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Enter the starting cash float in the drawer for Register 1 (REG-01).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Float (USD $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openFloatUsd}
                  onChange={(e) => setOpenFloatUsd(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>
                  Float (KHR ៛)
                </label>
                <input
                  type="number"
                  step="100"
                  value={openFloatKhr}
                  onChange={(e) => setOpenFloatKhr(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOpenShiftSubmit}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Confirm & Open Shift
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 7. SIZE VARIANT SELECTION MODAL (FOR CLOTHES & APPAREL) */}
      {sizeModalProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSizeModalProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b',
              borderRadius: '16px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '650px',
              border: '1px solid #3b82f6',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
                borderBottom: '1px solid #334155',
                paddingBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                {sizeModalProduct.imageUrl ? (
                  <img
                    src={sizeModalProduct.imageUrl}
                    alt={sizeModalProduct.productName}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1px solid #475569',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '1.75rem' }}>👕</span>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff' }}>
                    {sizeModalProduct.productName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      Select Size to Add to Cart
                    </span>
                    {sizeModalProduct.color && (
                      <span
                        style={{
                          background: '#0f172a',
                          color: '#38bdf8',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid #334155',
                        }}
                      >
                        Color: {sizeModalProduct.color}
                      </span>
                    )}
                    {isApprovedWholesale && (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        ★ Wholesale Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSizeModalProduct(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Sizes Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              {sizeModalProduct.sizeVariants?.map((v: any) => {
                const effectivePrice =
                  isApprovedWholesale && v.wholesalePriceUsd
                    ? v.wholesalePriceUsd
                    : v.sellingPriceUsd;
                const priceKhr = Math.round(effectivePrice * exchangeRate);
                const isOutOfStock = v.quantityOnHand <= 0;

                return (
                  <button
                    key={v.id}
                    disabled={isOutOfStock}
                    onClick={() => {
                      addToCart(
                        {
                          ...v,
                          productName: sizeModalProduct.productName,
                        },
                        sizeModalProduct.productName,
                      );
                      setSizeModalProduct(null);
                    }}
                    style={{
                      background: isOutOfStock ? '#0f172a' : '#0f172a',
                      border: '2px solid ' + (isOutOfStock ? '#334155' : '#2563eb'),
                      borderRadius: '10px',
                      padding: '1rem 0.75rem',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      opacity: isOutOfStock ? 0.45 : 1,
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.borderColor = '#38bdf8';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isOutOfStock) {
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: isOutOfStock ? '#94a3b8' : '#ffffff',
                      }}
                    >
                      {v.size || v.variantName}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {v.variantName}
                    </span>

                    <div style={{ marginTop: '0.2rem', textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: isApprovedWholesale ? '#fbbf24' : '#38bdf8',
                        }}
                      >
                        ${effectivePrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {priceKhr.toLocaleString()}៛
                      </div>
                    </div>

                    <span
                      style={{
                        marginTop: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isOutOfStock ? '#f87171' : v.quantityOnHand > 10 ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {isOutOfStock ? 'Out of Stock' : `${v.quantityOnHand} in stock`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setSizeModalProduct(null)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

