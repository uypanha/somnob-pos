'use client';

import { useState, useMemo } from 'react';
import {
  calculateOrderTotals,
  PricingTier,
  OrderType,
  OrderStatus,
  WholesaleStatus,
  roundToDecimal,
  convertUsdToKhr,
} from '@somnob/shared';
import {
  ShoppingBag,
  MapPin,
  Truck,
  Store as StoreIcon,
  Search,
  User,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  ArrowRight,
  QrCode,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface CartItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPriceUsd: number;
  wholesalePriceUsd?: number | null;
  minWholesaleQty: number;
  costPriceUsd: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export default function CustomerApp() {
  // Store Selection & Exchange Rate
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string; address: string; phone: string }>({
    id: 'store-1',
    name: 'BKK1 Flagship Store',
    address: 'Street 302, BKK1, Phnom Penh',
    phone: '+855 23 888 999',
  });
  const [exchangeRate] = useState<number>(4100);
  const [fulfillmentType, setFulfillmentType] = useState<OrderType>(OrderType.DELIVERY);

  // Customer Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [customer, setCustomer] = useState<{
    id: string;
    fullName: string;
    phone: string;
    customerType: string;
    wholesaleStatus: WholesaleStatus;
    address: string;
  }>({
    id: 'cust-1',
    fullName: 'Sok Dara',
    phone: '+855 12 334 455',
    customerType: 'RETAIL',
    wholesaleStatus: WholesaleStatus.NONE,
    address: 'House 12, Street 288, BKK1, Phnom Penh',
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginPhone, setLoginPhone] = useState<string>('012 345 678');
  const [isWholesaleApplicant, setIsWholesaleApplicant] = useState<boolean>(false);
  const [businessName, setBusinessName] = useState<string>('');

  // Catalog State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Size Variant Selection Modal State
  const [sizeModalProduct, setSizeModalProduct] = useState<any | null>(null);
  const [selectedSizeVariant, setSelectedSizeVariant] = useState<any | null>(null);

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'cat-bev', name: 'Beverages' },
    { id: 'cat-water', name: 'Water & Hydration' },
    { id: 'cat-snack', name: 'Snacks & Food' },
    { id: 'cat-apparel', name: 'Clothes & Apparel' },
  ];

  const catalog = [
    {
      id: 'var-coke',
      productName: 'Coca-Cola',
      variantName: '330ml Can',
      sku: 'COKE-330',
      categoryId: 'cat-bev',
      sellingPriceUsd: 0.85,
      wholesalePriceUsd: 0.7,
      minWholesaleQty: 24,
      costPriceUsd: 0.5,
      icon: '🥤',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
      description: 'Refreshing sparkling cola drink served chilled.',
    },
    {
      id: 'var-angkor',
      productName: 'Angkor Beer',
      variantName: '330ml Can',
      sku: 'ANGKOR-330',
      categoryId: 'cat-bev',
      sellingPriceUsd: 1.1,
      wholesalePriceUsd: 0.95,
      minWholesaleQty: 24,
      costPriceUsd: 0.75,
      icon: '🍺',
      imageUrl: 'https://images.unsplash.com/photo-1608270546103-97992796c303?w=300&auto=format&fit=crop&q=80',
      description: 'My Country, My Beer - classic Cambodian premium lager.',
    },
    {
      id: 'var-vital',
      productName: 'Vital Mineral Water',
      variantName: '500ml Bottle',
      sku: 'VITAL-500',
      categoryId: 'cat-water',
      sellingPriceUsd: 0.35,
      wholesalePriceUsd: 0.28,
      minWholesaleQty: 24,
      costPriceUsd: 0.2,
      icon: '💧',
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
      description: 'Pure natural mineral water sourced from Cambodia.',
    },
    {
      id: 'var-lays',
      productName: "Lay's Classic Potato Chips",
      variantName: '50g Pack',
      sku: 'LAYS-50',
      categoryId: 'cat-snack',
      sellingPriceUsd: 1.25,
      wholesalePriceUsd: 1.05,
      minWholesaleQty: 10,
      costPriceUsd: 0.8,
      icon: '🥔',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
      description: 'Crispy salted golden potato chips.',
    },
    {
      id: 'prod-angkor-tee',
      productName: 'Angkor Heritage Graphic T-Shirt',
      variantName: 'Sizes S - XXL',
      sku: 'TEE-ANGKOR',
      categoryId: 'cat-apparel',
      sellingPriceUsd: 12.0,
      wholesalePriceUsd: 9.5,
      minWholesaleQty: 10,
      costPriceUsd: 6.0,
      icon: '👕',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80',
      description: '100% combed cotton tee with Angkor temple artwork.',
      hasSizes: true,
      sizeVariants: [
        { id: 'var-tee-s', size: 'S', sku: 'TEE-ANGKOR-S', sellingPriceUsd: 12.0, stockQty: 25 },
        { id: 'var-tee-m', size: 'M', sku: 'TEE-ANGKOR-M', sellingPriceUsd: 12.0, stockQty: 40 },
        { id: 'var-tee-l', size: 'L', sku: 'TEE-ANGKOR-L', sellingPriceUsd: 12.0, stockQty: 30 },
        { id: 'var-tee-xl', size: 'XL', sku: 'TEE-ANGKOR-XL', sellingPriceUsd: 13.5, stockQty: 15 },
        { id: 'var-tee-xxl', size: 'XXL', sku: 'TEE-ANGKOR-XXL', sellingPriceUsd: 14.5, stockQty: 10 },
      ],
    },
    {
      id: 'prod-hoodie',
      productName: 'Somnob Premium Fleece Hoodie',
      variantName: 'Sizes S - XL',
      sku: 'HOODIE-FLEECE',
      categoryId: 'cat-apparel',
      sellingPriceUsd: 26.0,
      wholesalePriceUsd: 21.0,
      minWholesaleQty: 5,
      costPriceUsd: 15.0,
      icon: '🧥',
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80',
      description: 'Heavyweight 380gsm brushed fleece hoodie with front pocket.',
      hasSizes: true,
      sizeVariants: [
        { id: 'var-hoodie-s', size: 'S', sku: 'HOODIE-FLEECE-S', sellingPriceUsd: 26.0, stockQty: 12 },
        { id: 'var-hoodie-m', size: 'M', sku: 'HOODIE-FLEECE-M', sellingPriceUsd: 26.0, stockQty: 20 },
        { id: 'var-hoodie-l', size: 'L', sku: 'HOODIE-FLEECE-L', sellingPriceUsd: 26.0, stockQty: 18 },
        { id: 'var-hoodie-xl', size: 'XL', sku: 'HOODIE-FLEECE-XL', sellingPriceUsd: 28.0, stockQty: 8 },
      ],
    },
  ];

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    'House 12, Street 288, BKK1, Phnom Penh',
  );
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'KHQR'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Active Placed Order Tracking
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  const isApprovedWholesale = isLoggedIn && customer.wholesaleStatus === WholesaleStatus.APPROVED;
  const activeTier = isApprovedWholesale ? PricingTier.WHOLESALE : PricingTier.RETAIL;

  // Cart Authoritative Financial Summary
  const cartTotals = useMemo(() => {
    const items = cart.map((i) => ({
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      sku: i.sku,
      unitPriceUsd: i.unitPriceUsd,
      wholesalePriceUsd: i.wholesalePriceUsd,
      minWholesaleQty: i.minWholesaleQty,
      costPriceUsd: i.costPriceUsd,
      quantity: i.quantity,
      priceType: activeTier,
      discountUsd: 0,
    }));

    const calculated = calculateOrderTotals(items, exchangeRate, 0, 0, activeTier);
    const deliveryFee = fulfillmentType === OrderType.DELIVERY ? 1.5 : 0.0;
    const finalTotalUsd = roundToDecimal(calculated.totalUsd + deliveryFee, 2);
    const finalTotalKhr = convertUsdToKhr(finalTotalUsd, exchangeRate);

    return {
      ...calculated,
      deliveryFee,
      finalTotalUsd,
      finalTotalKhr,
    };
  }, [cart, exchangeRate, activeTier, fulfillmentType]);

  // Cart Actions
  const addToCart = (product: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.variantId === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          variantId: product.id,
          productName: product.productName,
          variantName: product.variantName,
          sku: product.sku,
          unitPriceUsd: product.sellingPriceUsd,
          wholesalePriceUsd: product.wholesalePriceUsd,
          minWholesaleQty: product.minWholesaleQty,
          costPriceUsd: product.costPriceUsd,
          quantity: 1,
        },
      ];
    });
  };

  const addToCartWithSize = (parentProduct: any, sizeVariant: any) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.variantId === sizeVariant.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          variantId: sizeVariant.id,
          productName: parentProduct.productName,
          variantName: `Size ${sizeVariant.size}`,
          sku: sizeVariant.sku,
          unitPriceUsd: sizeVariant.sellingPriceUsd,
          wholesalePriceUsd: parentProduct.wholesalePriceUsd,
          minWholesaleQty: parentProduct.minWholesaleQty,
          costPriceUsd: parentProduct.costPriceUsd,
          quantity: 1,
          size: sizeVariant.size,
          color: sizeVariant.color || null,
        },
      ];
    });
    setSizeModalProduct(null);
    setSelectedSizeVariant(null);
  };

  const handleProductAddClick = (product: any) => {
    if (product.hasSizes && product.sizeVariants && product.sizeVariants.length > 0) {
      setSizeModalProduct(product);
      setSelectedSizeVariant(product.sizeVariants[0]);
    } else {
      addToCart(product);
    }
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variantId === variantId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Handle Checkout / Place Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (fulfillmentType === OrderType.DELIVERY && !deliveryAddress.trim()) {
      alert('Please provide a delivery address.');
      return;
    }

    setIsPlacingOrder(true);
    const orderNumber = `WEB-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Simulate server order placement
    setTimeout(() => {
      const placed = {
        id: `ord-${Date.now()}`,
        orderNumber,
        storeName: selectedStore.name,
        storeAddress: selectedStore.address,
        storePhone: selectedStore.phone,
        orderType: fulfillmentType,
        deliveryAddress: fulfillmentType === OrderType.DELIVERY ? deliveryAddress : null,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        items: cart.map((i) => ({
          productName: i.productName,
          variantName: i.variantName,
          quantity: i.quantity,
          size: i.size,
          unitPriceUsd:
            isApprovedWholesale && i.wholesalePriceUsd && i.quantity >= i.minWholesaleQty
              ? i.wholesalePriceUsd
              : i.unitPriceUsd,
          subtotalUsd:
            (isApprovedWholesale && i.wholesalePriceUsd && i.quantity >= i.minWholesaleQty
              ? i.wholesalePriceUsd
              : i.unitPriceUsd) * i.quantity,
        })),
        deliveryFee: cartTotals.deliveryFee,
        totalUsd: cartTotals.finalTotalUsd,
        totalKhr: cartTotals.finalTotalKhr,
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : 'KHQR Bakong Scan',
        currentStep: 0,
      };

      setActiveOrder(placed);
      setCart([]);
      setShowCartDrawer(false);
      setIsPlacingOrder(false);
    }, 700);
  };

  // Login / Switch Account simulation
  const handleAuthSubmit = () => {
    if (authTab === 'login') {
      if (loginPhone.includes('999') || loginPhone.includes('ws')) {
        // Wholesale Demo User
        setCustomer({
          id: 'cust-ws-1',
          fullName: 'Vannak Mart BKK1',
          phone: loginPhone,
          customerType: 'WHOLESALE',
          wholesaleStatus: WholesaleStatus.APPROVED,
          address: 'Building 45, Street 310, BKK1, Phnom Penh',
        });
      } else {
        // Retail User
        setCustomer({
          id: 'cust-retail-1',
          fullName: 'Dara Sok',
          phone: loginPhone,
          customerType: 'RETAIL',
          wholesaleStatus: WholesaleStatus.NONE,
          address: 'House 12, Street 288, BKK1, Phnom Penh',
        });
      }
      setIsLoggedIn(true);
      setShowAuthModal(false);
    } else {
      // Register
      setCustomer({
        id: `cust-${Date.now()}`,
        fullName: businessName || 'New Customer',
        phone: loginPhone,
        customerType: isWholesaleApplicant ? 'WHOLESALE' : 'RETAIL',
        wholesaleStatus: isWholesaleApplicant ? WholesaleStatus.APPROVED : WholesaleStatus.NONE,
        address: 'Phnom Penh, Cambodia',
      });
      setIsLoggedIn(true);
      setShowAuthModal(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return catalog.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        minHeight: '100vh',
        background: '#f8fafc',
        boxShadow: '0 0 25px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
        color: '#0f172a',
      }}
    >
      {/* 1. TOP MOBILE HEADER */}
      <header
        style={{
          background: '#1e293b',
          color: '#ffffff',
          padding: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>⚡</span>
            <div>
              <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>Somnob Market</strong>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fast Store Pickup & Delivery</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLoggedIn ? (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: isApprovedWholesale ? '#854d0e' : '#334155',
                  color: isApprovedWholesale ? '#fef08a' : '#f8fafc',
                  border: 'none',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <User size={13} />
                <span>{isApprovedWholesale ? '★ Wholesale' : customer.fullName.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setShowCartDrawer(true)}
              style={{
                position: 'relative',
                background: '#0284c7',
                border: 'none',
                color: '#ffffff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ShoppingBag size={18} />
              {totalCartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Store & Fulfillment Bar */}
        <div
          style={{
            marginTop: '0.75rem',
            background: '#0f172a',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0' }}>
            <MapPin size={14} color="#38bdf8" />
            <select
              value={selectedStore.id}
              onChange={(e) => {
                if (e.target.value === 'store-1') {
                  setSelectedStore({
                    id: 'store-1',
                    name: 'BKK1 Flagship Store',
                    address: 'Street 302, BKK1, Phnom Penh',
                    phone: '+855 23 888 999',
                  });
                } else {
                  setSelectedStore({
                    id: 'store-2',
                    name: 'Toul Kork Branch',
                    address: 'Street 315, Toul Kork, Phnom Penh',
                    phone: '+855 23 777 666',
                  });
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="store-1" style={{ background: '#1e293b' }}>
                BKK1 Flagship Store
              </option>
              <option value="store-2" style={{ background: '#1e293b' }}>
                Toul Kork Branch
              </option>
            </select>
          </div>

          {/* Fulfillment Toggle */}
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setFulfillmentType(OrderType.DELIVERY)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: 'none',
                background: fulfillmentType === OrderType.DELIVERY ? '#2563eb' : 'transparent',
                color: '#ffffff',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Truck size={12} />
              <span>Delivery</span>
            </button>
            <button
              onClick={() => setFulfillmentType(OrderType.PICKUP)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: 'none',
                background: fulfillmentType === OrderType.PICKUP ? '#2563eb' : 'transparent',
                color: '#ffffff',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <StoreIcon size={12} />
              <span>Pickup</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. WHOLESALE STATUS BANNER */}
      {isApprovedWholesale ? (
        <div
          style={{
            background: '#fef3c7',
            borderBottom: '1px solid #fde68a',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            color: '#92400e',
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={16} color="#d97706" />
          <span>Wholesale Buyer Account Active: Bulk discounts automatically applied!</span>
        </div>
      ) : (
        <div
          onClick={() => {
            setAuthTab('register');
            setIsWholesaleApplicant(true);
            setShowAuthModal(true);
          }}
          style={{
            background: '#eff6ff',
            borderBottom: '1px solid #dbeafe',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#1e40af',
            cursor: 'pointer',
          }}
        >
          <div>
            <strong>Are you a retailer or restaurant?</strong> Unlock wholesale bulk pricing.
          </div>
          <ChevronRight size={14} />
        </div>
      )}

      {/* 3. ACTIVE ORDER TRACKING WIDGET (IF PLACED) */}
      {activeOrder && (
        <div
          style={{
            margin: '0.75rem 1rem 0 1rem',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Order</span>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>
                {activeOrder.orderNumber}
              </strong>
            </div>
            <span
              style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              Preparing (20-30m)
            </span>
          </div>

          {/* Stepper Timeline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.75rem 0 0.5rem 0', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '15px',
                right: '15px',
                height: '2px',
                background: '#cbd5e1',
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '15px',
                width: '35%',
                height: '2px',
                background: '#2563eb',
                zIndex: 2,
              }}
            />

            {[
              { label: 'Received', done: true },
              { label: 'Preparing', active: true },
              { label: activeOrder.orderType === OrderType.DELIVERY ? 'On the way' : 'Ready', pending: true },
              { label: 'Delivered', pending: true },
            ].map((step, idx) => (
              <div key={idx} style={{ textAlign: 'center', zIndex: 3 }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: step.done || step.active ? '#2563eb' : '#ffffff',
                    border: '2px solid ' + (step.done || step.active ? '#2563eb' : '#cbd5e1'),
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.2rem auto',
                  }}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <span style={{ fontSize: '0.65rem', color: step.active ? '#2563eb' : '#64748b', fontWeight: step.active ? 700 : 500 }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: '#475569',
              background: '#f8fafc',
              padding: '0.5rem',
              borderRadius: '6px',
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{activeOrder.items.length} items • Total: ${activeOrder.totalUsd.toFixed(2)} ({activeOrder.totalKhr.toLocaleString()}៛)</span>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{activeOrder.paymentMethod}</span>
          </div>
        </div>
      )}

      {/* 4. SEARCH & CATEGORIES */}
      <div style={{ padding: '0.75rem 1rem 0.25rem 1rem' }}>
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '10px',
            padding: '0 0.75rem',
            border: '1px solid #e2e8f0',
            marginBottom: '0.75rem',
          }}
        >
          <Search size={18} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
          <input
            type="text"
            placeholder="Search groceries, drinks, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              padding: '0.65rem 0',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Horizontal Category Carousel */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            scrollbarWidth: 'none',
          }}
        >
          {categories.map((c) => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  border: '1px solid ' + (active ? '#2563eb' : '#cbd5e1'),
                  background: active ? '#2563eb' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. PRODUCT LIST */}
      <main style={{ flex: 1, padding: '0.75rem 1rem 5rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          {filteredProducts.map((prod) => {
            const inCart = cart.find((i) => i.variantId === prod.id);
            const isWholesaleEligible = isApprovedWholesale && prod.wholesalePriceUsd;
            const effectivePrice = isWholesaleEligible ? prod.wholesalePriceUsd! : prod.sellingPriceUsd;
            const priceKhr = Math.round(effectivePrice * exchangeRate);

            return (
              <div
                key={prod.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Product Photo or Emoji Icon */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    prod.icon
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                    {prod.productName}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>
                    {prod.variantName} • {prod.sku}
                  </div>

                  {/* Pricing */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isWholesaleEligible ? '#d97706' : '#2563eb' }}>
                      ${effectivePrice.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ({priceKhr.toLocaleString()}៛)
                    </span>
                  </div>

                  {isWholesaleEligible && (
                    <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>
                      Wholesale Price (min {prod.minWholesaleQty})
                    </div>
                  )}
                </div>

                {/* Add to Cart Button */}
                <div>
                  {prod.hasSizes ? (
                    (() => {
                      const cartCount = cart
                        .filter((i) => i.productName === prod.productName)
                        .reduce((sum, i) => sum + i.quantity, 0);
                      return (
                        <button
                          onClick={() => handleProductAddClick(prod)}
                          style={{
                            background: cartCount > 0 ? '#eff6ff' : '#2563eb',
                            color: cartCount > 0 ? '#1d4ed8' : '#ffffff',
                            border: cartCount > 0 ? '1px solid #bfdbfe' : 'none',
                            padding: '0.45rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span>{cartCount > 0 ? `Sizes (${cartCount})` : 'Select Size'}</span>
                          <ChevronRight size={14} />
                        </button>
                      );
                    })()
                  ) : inCart ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#f1f5f9',
                        borderRadius: '20px',
                        padding: '0.2rem',
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(prod.id, -1)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: 'none',
                          background: '#ffffff',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(prod.id, 1)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          border: 'none',
                          background: '#2563eb',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(prod)}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 6. BOTTOM FLOATING CART SUMMARY (WHEN ITEMS IN CART) */}
      {cart.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2rem)',
            maxWidth: '448px',
            background: '#1e293b',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 90,
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {totalCartCount} item(s) • {fulfillmentType === OrderType.DELIVERY ? 'Delivery' : 'Pickup'}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>
              ${cartTotals.finalTotalUsd.toFixed(2)}{' '}
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>
                ({cartTotals.finalTotalKhr.toLocaleString()}៛)
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowCartDrawer(true)}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
          >
            <span>Review Order</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 7. CART & CHECKOUT DRAWER */}
      {showCartDrawer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Checkout & Review</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Fulfillment: {selectedStore.name}
                </div>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {/* Delivery Address or Pickup Info */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {fulfillmentType === OrderType.DELIVERY ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <Truck size={16} color="#2563eb" />
                      <span>Delivery Address (Express 20-30m)</span>
                    </div>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter street, house number, landmarks..."
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <StoreIcon size={16} color="#2563eb" />
                      <span>In-Store Pickup</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {selectedStore.address}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Tel: {selectedStore.phone}
                    </div>
                  </div>
                )}
              </div>

              {/* Items in Cart */}
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#475569' }}>Order Items</h4>
              <div style={{ marginBottom: '1rem' }}>
                {cart.map((item) => {
                  const isWholesaleApplied =
                    isApprovedWholesale &&
                    item.wholesalePriceUsd &&
                    item.quantity >= item.minWholesaleQty;
                  const unitPrice = isWholesaleApplied ? item.wholesalePriceUsd! : item.unitPriceUsd;
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <div
                      key={item.variantId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 0',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.productName}</span>
                          {item.size && (
                            <span
                              style={{
                                background: '#e0e7ff',
                                color: '#3730a3',
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ${unitPrice.toFixed(2)} x {item.quantity}
                          {isWholesaleApplied && (
                            <span style={{ color: '#d97706', marginLeft: '4px', fontWeight: 600 }}>
                              [Wholesale]
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '50px', textAlign: 'right' }}>
                          ${lineTotal.toFixed(2)}
                        </div>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          <button
                            onClick={() => updateQuantity(item.variantId, -1)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            onClick={() => updateQuantity(item.variantId, 1)}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Notes */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>
                  Special Instructions / Delivery Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave package with security guard..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Payment Method Selector */}
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#475569' }}>Payment Method</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setPaymentMethod('COD')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid ' + (paymentMethod === 'COD' ? '#2563eb' : '#cbd5e1'),
                    background: paymentMethod === 'COD' ? '#eff6ff' : '#ffffff',
                    color: paymentMethod === 'COD' ? '#1e40af' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <DollarSign size={16} />
                  <span>Cash on Delivery</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('KHQR')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid ' + (paymentMethod === 'KHQR' ? '#2563eb' : '#cbd5e1'),
                    background: paymentMethod === 'KHQR' ? '#eff6ff' : '#ffffff',
                    color: paymentMethod === 'KHQR' ? '#1e40af' : '#475569',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <QrCode size={16} />
                  <span>KHQR Bakong</span>
                </button>
              </div>

              {/* Financial Calculation Breakdown */}
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Items Subtotal:</span>
                  <span>${cartTotals.subtotalUsd.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Delivery Fee:</span>
                  <span>${cartTotals.deliveryFee.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    marginTop: '0.4rem',
                    paddingTop: '0.4rem',
                    borderTop: '1px solid #e2e8f0',
                    color: '#0f172a',
                  }}
                >
                  <span>Grand Total (USD):</span>
                  <span style={{ color: '#2563eb' }}>${cartTotals.finalTotalUsd.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem' }}>
                  <span>Grand Total (KHR):</span>
                  <span>{cartTotals.finalTotalKhr.toLocaleString()}៛ (Rate: 4,100៛)</span>
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
              <button
                disabled={isPlacingOrder}
                onClick={handlePlaceOrder}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                }}
              >
                <CheckCircle size={20} />
                <span>{isPlacingOrder ? 'Submitting Order...' : `Place Order • $${cartTotals.finalTotalUsd.toFixed(2)}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. AUTHENTICATION & WHOLESALE ONBOARDING MODAL */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '380px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                {authTab === 'login' ? 'Customer Sign In' : 'Create Account'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <button
                onClick={() => setAuthTab('login')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: authTab === 'login' ? '#2563eb' : '#64748b',
                  borderBottom: authTab === 'login' ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                }}
              >
                Quick Sign In
              </button>
              <button
                onClick={() => setAuthTab('register')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: authTab === 'register' ? '#2563eb' : '#64748b',
                  borderBottom: authTab === 'register' ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                }}
              >
                Register & Wholesale
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>
                Phone Number:
              </label>
              <input
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="012 345 678"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Demo Tip: Type phone with <strong>999</strong> to test Approved Wholesale Buyer mode!
              </div>
            </div>

            {authTab === 'register' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>
                  Full Name / Business Name:
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Vannak Mart or Dara Sok"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    marginBottom: '0.75rem',
                  }}
                />

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    background: '#fef3c7',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isWholesaleApplicant}
                    onChange={(e) => setIsWholesaleApplicant(e.target.checked)}
                  />
                  <span>Apply for Wholesale Tier (Shop / Restaurant)</span>
                </label>
              </div>
            )}

            <button
              onClick={handleAuthSubmit}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              {authTab === 'login' ? 'Sign In to Account' : 'Create & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* 9. SIZE VARIANT SELECTION DRAWER/MODAL */}
      {sizeModalProduct && selectedSizeVariant && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => {
            setSizeModalProduct(null);
            setSelectedSizeVariant(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {sizeModalProduct.imageUrl ? (
                    <img src={sizeModalProduct.imageUrl} alt={sizeModalProduct.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    sizeModalProduct.icon
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{sizeModalProduct.productName}</h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    {sizeModalProduct.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSizeModalProduct(null);
                  setSelectedSizeVariant(null);
                }}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Size Selector Label */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Select Size</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Selected: <strong style={{ color: '#2563eb' }}>{selectedSizeVariant.size}</strong>
                </span>
              </div>

              {/* Size Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {sizeModalProduct.sizeVariants.map((v: any) => {
                  const isSelected = selectedSizeVariant.id === v.id;
                  const isOutOfStock = v.stockQty <= 0;
                  return (
                    <button
                      key={v.id}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSizeVariant(v)}
                      style={{
                        padding: '0.75rem 0.25rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : isOutOfStock ? '#f1f5f9' : '#ffffff',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        opacity: isOutOfStock ? 0.45 : 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: isSelected ? '#1d4ed8' : '#1e293b',
                        }}
                      >
                        {v.size}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: isSelected ? '#2563eb' : '#64748b',
                          marginTop: '0.2rem',
                          fontWeight: 600,
                        }}
                      >
                        ${v.sellingPriceUsd.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: isOutOfStock ? '#ef4444' : '#10b981', marginTop: '0.1rem' }}>
                        {isOutOfStock ? 'Out' : `${v.stockQty} left`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Variant Price Summary & Add Button */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Price (Size {selectedSizeVariant.size}):</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  ${selectedSizeVariant.sellingPriceUsd.toFixed(2)}{' '}
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                    ({Math.round(selectedSizeVariant.sellingPriceUsd * exchangeRate).toLocaleString()}៛)
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                SKU: <span style={{ fontFamily: 'monospace' }}>{selectedSizeVariant.sku}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => addToCartWithSize(sizeModalProduct, selectedSizeVariant)}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: '12px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              <ShoppingBag size={18} />
              <span>Add to Bag • Size {selectedSizeVariant.size} (${selectedSizeVariant.sellingPriceUsd.toFixed(2)})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
