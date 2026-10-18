# Somnob POS - Project Roadmap & Implementation Plan

## Document Information
* **Project Name:** Somnob POS Ecosystem
* **Status:** Complete (All 13 Phases Delivered & Verified)
* **Date:** 2026-10-18
* **Base Architecture:** Turborepo Monorepo (NestJS Backend, Next.js Admin, React POS PWA, Next.js Customer Web, PostgreSQL, Prisma)

---

## Complete Phase Roadmap

### ✅ Phase 1: Requirements and Architecture (Approved)
* Clarified multi-branch retail & grocery model (single business, multiple branch stores).
* Confirmed dual-currency (USD base accounting, KHR operational with KHQR dynamic codes).
* Defined in-store POS offline-first caching & sync architecture with idempotency keys.
* Established roles (Super Admin, Branch Manager, Cashier, Stock Clerk) and customer fulfillment (pickup + delivery).
* Artifact: [`docs/requirements-and-architecture.md`](file:///Users/panhauy/Desktop/Personal%20Projects/Somnob%20POS/docs/requirements-and-architecture.md)

### ✅ Phase 2: Database Design (Approved)
* Designed complete relational schema with strict foreign keys, unique constraints, and indexes.
* Modelled multi-branch inventory balances with append-only immutable stock movement audit ledger.
* Integrated cash register shifts (opening floats in USD/KHR, Z-Report closing count, over/short tracking).
* Integrated wholesale pricing with business owner approval workflow.
* Designed pessimistic row-level locking strategy and payment idempotency.
* Artifacts: [`docs/database-design.md`](file:///Users/panhauy/Desktop/Personal%20Projects/Somnob%20POS/docs/database-design.md), [`docs/schema.prisma`](file:///Users/panhauy/Desktop/Personal%20Projects/Somnob%20POS/docs/schema.prisma)

---

### ✅ Phase 3: Project Foundation (Completed & Verified)
* **Status:** Complete (Verified with Turbo build & test suite)
* Established monorepo architecture with npm workspaces and Turborepo v2.
* Created `@somnob/shared` package with dual CJS/ESM exports, domain enums, financial rounding, and dual-currency calculation utilities with 100% test pass rate.
* Configured local `docker-compose.yml` for PostgreSQL 16 and Redis.
* Created `@somnob/backend` NestJS application, integrated Prisma ORM with the complete multi-branch schema, and generated the Prisma client.
* Created `@somnob/admin` Next.js desktop web app skeleton.
* Created `@somnob/pos` dedicated React touchscreen PWA skeleton with Vite.
* Created `@somnob/customer` Next.js mobile-responsive ordering web app skeleton.
* Initialized local Git repository with `.gitignore` and `.env.example`.
* Verified concurrent build pipeline across all 5 packages: `turbo run build` passed in 16.9s.

---

### ✅ Phase 4: Authentication and Authorization (Completed & Verified)
* **Status:** Complete (Verified with 19 automated security tests & Turbo build)
* Implemented `AuthService` with secure bcrypt password hashing and 4-6 digit cashier PIN code hashing.
* Implemented dual JWT strategy: short-lived access tokens (15m) + refresh token rotation (7d).
* Implemented RBAC with `@Roles(...)` decorator and `RolesGuard` enforcing role hierarchy (`SUPER_ADMIN`, `BRANCH_MANAGER`, `CASHIER`, `STOCK_CLERK`) and preventing privilege escalation.
* Implemented multi-branch isolation guard (`StoreAccessGuard` and `@RequireStore()`) ensuring branch employees cannot access or execute operations outside their assigned stores.
* Implemented endpoints in `AuthController`:
  - `POST /api/v1/auth/login`: Email and password login.
  - `POST /api/v1/auth/pos-login`: Fast cashier PIN switch per branch station.
  - `POST /api/v1/auth/refresh`: Refresh token renewal.
  - `GET /api/v1/auth/me`: Current user session and authorized stores.
* Created database seeder (`prisma/seed.ts`) with default business ("Somnob Retail Group"), 2 branches ("BKK1 Flagship", "Toul Kork Branch"), exchange rates ($1 = 4,100៛), Super Admin, Manager, Cashier (PIN: 1234), and Stock Clerk.
* Test suite: 19 unit tests passing across password hashing, PIN verification, login failures, RBAC privilege escalation prevention, and store isolation enforcement.

---

### ✅ Phase 5: Product Management (Completed & Verified)
* **Status:** Complete (Verified with 30 backend unit tests & Turbo build)
* Implemented `CategoryService` and `CategoryController`:
  - Category hierarchy, auto slug generation, parent-child validation, and sort order.
  - Safe deletion checks preventing deletion of categories with attached products.
* Implemented `ProductService` and `ProductController`:
  - Atomic product + variants creation in a database transaction.
  - Automatic zero-inventory balance initialization across all existing branch stores.
  - Barcode and SKU uniqueness enforcement.
  - Retail pricing (`sellingPriceUsd`) and wholesale tier pricing (`wholesalePriceUsd` with `minWholesaleQty`).
  - High-speed cashier barcode scanner lookup endpoint (`GET /api/v1/catalog/products/barcode/:barcode`).
  - Paginated search with category filtering and keyword matching.
  - Soft-deletion of products and variants.
* Enhanced seeder (`prisma/seed.ts`) with categories (Beverages, Water & Hydration, Snacks) and products (Coca-Cola, Angkor Beer, Vital Mineral Water Case, Lays Chips) with barcodes, retail prices, wholesale prices, and starting stock.
* Implemented Admin Product Management UI in `@somnob/admin` (`/products`) with search, category filtering, dual-currency retail/wholesale display, and product creation modal.
* Test suite: 30 unit tests passing across auth and catalog services.

---

### ✅ Phase 6: Inventory Management (Completed & Verified)
* **Status:** Complete (Verified with 36 backend unit tests & Turbo build)
* Implemented `InventoryService` and `InventoryController`:
  - Branch-level inventory balances API with live on-hand, reserved, and available stock calculations.
  - Low-stock alert detection (`quantityOnHand <= reorderPoint`) for fast branch restocking.
  - Atomic stock adjustment API with reason codes (`Physical count variance`, `Damaged goods`, `Spoilage`, `Restock`) inside a transaction.
  - Concurrency safety rule preventing adjustments from resulting in negative stock.
  - Immutable stock movements audit ledger logging every delta, user ID, timestamp, and before/after counts (`ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `SALE`, `REFUND`).
* Implemented Admin Inventory Management UI in `@somnob/admin` (`/inventory`):
  - Multi-branch switcher (BKK1 Flagship Store / Toul Kork Branch).
  - Stock levels table with health/low-stock status badges.
  - Interactive stock adjustment modal with live delta preview.
  - Immutable movement audit ledger log viewer.
* Test suite: 36 unit tests passing across auth, catalog, and inventory services.

---

### ✅ Phase 7: Admin Dashboard (Completed & Verified)
* **Status:** Complete (Verified with 47 backend unit tests & Turbo build)
* Implemented Backend Modules & Controllers:
  - `CustomersModule` (`CustomerService`, `CustomerController`): customer registration, profile listing, and business owner wholesale approval workflow (`POST /api/v1/customers/:id/wholesale-review` updating status to `APPROVED`/`REJECTED`, timestamp, and approver user ID).
  - `StoresModule` (`StoreService`, `StoreController`): store branch CRUD, active status toggling, and live USD/KHR exchange rate management (`PUT /api/v1/stores/:id/exchange-rate`).
  - `UsersModule` (`UserService`, `UserController`): employee management with role assignments, bcrypt password hashing, 4-6 digit cashier PIN hashing, and branch access control.
  - `DashboardModule` (`DashboardService`, `DashboardController`): KPI overview endpoint (`GET /api/v1/dashboard/metrics`) aggregating total branches, catalog items, low-stock alerts, active shifts, and pending wholesale applicants.
* Implemented Admin Web Application (`apps/admin`):
  - Updated `/` (Dashboard overview): KPI summary cards, quick actions, and status metrics.
  - `/wholesale`: Dedicated wholesale application queue with pending applicant approvals/rejections and approved accounts directory.
  - `/employees`: Staff management interface with cashier PIN status, role tags, store assignments, and staff onboarding modal.
  - `/stores`: Multi-branch management view with active POS register count, address info, and live USD/KHR exchange rate editor.
* Test suite: 47 backend unit tests passing cleanly across auth, catalog, inventory, customer, store, and user services. All 5 monorepo packages build without error.

---

### ✅ Phase 8: POS Application (Completed & Verified)
* **Status:** Complete (Verified with 55 backend unit tests, Vite build & Turbo build)
* Implemented Backend Modules & Controllers:
  - `ShiftsModule` (`ShiftService`, `ShiftController`):
    - Register shifts management (`GET /api/v1/shifts/registers`, `GET /api/v1/shifts/current`).
    - Opening float recording in USD and KHR (`POST /api/v1/shifts/open`) with active register & user guards.
    - Authoritative shift closing & Z-Report reconciliation (`POST /api/v1/shifts/:id/close`): calculates net cash sales, expected cash in drawer, over/short variances, and shift summary metrics.
  - `PosModule` (`PosService`, `PosController`):
    - Atomic POS checkout (`POST /api/v1/pos/checkout`): transaction-safe stock verification, automatic retail/approved wholesale pricing tier application, order and payment creation, inventory balance deduction, and immutable `StockMovement` creation (`SALE`).
    - Idempotency guard: UUID `idempotencyKey` prevents duplicate sales and double-charging during network retries or offline sync.
    - Offline sync batch processor (`POST /api/v1/pos/sync`): drains local offline queue and syncs transactions atomically.
    - Authoritative thermal receipt generator (`GET /api/v1/pos/orders/:id/receipt`).
* Implemented Touchscreen POS Application (`apps/pos`):
  - Cashier numeric PIN pad modal for fast station switching and terminal lock.
  - Register shift opening and closing (Z-Report) modals with expected cash vs actual count reconciliation.
  - Fast barcode scanner hardware listener capturing barcode strokes ending in Enter.
  - Touchscreen product grid with category navigation tabs, search, stock level indicators, and dual prices.
  - Cart drawer with customer switcher (Walk-in vs Approved Wholesale Buyer with live wholesale tier prices), quantity adjustments, and half-up total calculations.
  - Multi-tender modal:
    - Cash tender with quick USD/KHR buttons ($1-$100, 5,000៛-100,000៛), mixed-currency tender, and live change calculation in USD & KHR.
    - Card terminal reference tracking.
    - KHQR Bakong dynamic QR preview.
  - Standard 80mm thermal receipt modal with `@media print` layout and "New Sale" reset.
  - IndexedDB offline caching (`idb`): caches catalog and customers, queues offline cash sales, and synchronizes with server when online.
* Test suite: 55 backend unit tests passing cleanly across 11 test suites; all 5 packages build cleanly with Turborepo in 15.6s.

---

### ✅ Phase 9: Customer Mobile Web Application (Completed & Verified)
* **Status:** Complete (Verified with 58 backend unit tests, Next.js build & Turbo build)
* Implemented Backend Modules & Controllers:
  - `OrdersModule` (`OrderService`, `OrderController`):
    - Multi-channel order creation (`POST /api/v1/orders`): supports `PICKUP` and `DELIVERY` orders, delivery address tracking, and inventory reservation.
    - Authoritative wholesale tier calculation: automatically applies wholesale bulk pricing if customer is an approved wholesale buyer and order meets minimum quantity thresholds.
    - Live order status tracking API (`GET /api/v1/orders/:identifier/track`): delivers real-time stepper milestone statuses (`PENDING` -> `PREPARING` -> `READY_FOR_PICKUP` / `OUT_FOR_DELIVERY` -> `COMPLETED`), delivery details, items breakdown, and dual-currency totals.
    - Status lifecycle transitions (`PATCH /api/v1/orders/:id/status`) guarded by staff RBAC.
    - Customer order history (`GET /api/v1/orders/customer/:customerId`).
* Implemented Mobile Customer Web App (`apps/customer`):
  - Store branch fulfillment switcher (BKK1 Flagship Store vs Toul Kork Branch).
  - Delivery vs In-Store Pickup mode toggle with dynamic delivery fee ($1.50 for delivery, $0 for pickup).
  - Wholesale buyer club onboarding & banner: approved wholesale buyers unlock live tier discounts with badge (`★ Wholesale`).
  - Search & category carousel (`All Items`, `Beverages`, `Water & Hydration`, `Snacks & Food`).
  - Touch-friendly product cards with images, SKU, dual prices ($ and ៛ at 4,100 exchange rate), and wholesale price tags.
  - Interactive cart drawer with quantity adjustments, delivery address editor, special delivery instructions, and payment methods (Cash on Delivery vs KHQR Bakong mobile scan).
  - Real-time active order tracking card with dynamic 4-step progress stepper and estimated time.
* Test suite: 58 backend unit tests passing cleanly across 12 test suites; all 5 monorepo packages build without error in 8.6s.

---

### ✅ Phase 10: Payments, KHQR & Order Management (Completed & Verified)
* **Status:** Complete (Verified with 62 backend unit tests, 10 shared tests & Turbo build)
* Implemented KHQR Generator Engine (`packages/shared/src/khqr.ts`):
  - Zero-dependency, EMVCo-compliant dynamic KHQR Bakong payload string generator.
  - Generates tags for Bakong account (`somnob_retail@aclb`), MCC (`5411`), dual currencies (USD: `840`, KHR: `116`), amount, country (`KH`), merchant name, bill number, and CRC16/CCITT-FALSE checksum (`6304XXXX`).
  - 10 unit tests passing in `@somnob/shared`.
* Implemented Backend Modules & Controllers:
  - `PaymentsModule` (`PaymentService`, `PaymentController`):
    - `POST /api/v1/payments/khqr/generate`: Generates authoritative dynamic KHQR payload string for an order in USD or KHR.
    - `POST /api/v1/payments/split`: Split-tender processing (e.g. paying part Cash USD, part Cash KHR, and remainder via KHQR Bakong) with payment status verification and order completion.
    - `POST /api/v1/payments/orders/:id/refund`: Order refund workflow with reason recording, payment status update to `REFUNDED`, order status update to `CANCELLED`, automated stock replenishment, and immutable `StockMovement` creation (`REFUND`).
    - `GET /api/v1/payments/orders/:id`: Payment audit history.
* Implemented Admin Orders & Refund Screen (`apps/admin/src/app/orders/page.tsx`):
  - Channel filter (In-Store POS, Web Delivery, Web Pickup) and Status filter.
  - Real-time search by order reference and customer name.
  - Interactive order detail modal displaying line items and payment breakdown.
  - One-click NBC Bakong KHQR preview modal with string clipboard copy.
  - Process Refund modal with optional automated branch inventory restock.
* Test suite: 62 backend unit tests passing across 13 test suites; all 5 packages build cleanly with Turborepo in 17.3s.

---

### ✅ Phase 11: Reporting & Analytics (Completed & Verified)
* **Status:** Complete (Verified with 67 backend unit tests, Next.js build & Turbo build)
* Implemented Backend Modules & Controllers:
  - `ReportsModule` (`ReportService`, `ReportController`):
    - `GET /api/v1/reports/revenue`: Aggregates gross revenue in USD and KHR, total completed orders, average order value, and daily timeline buckets.
    - `GET /api/v1/reports/payments`: Analyzes payment tender distribution (Cash vs. KHQR Bakong vs. Card terminal) with transaction counts and percentage share.
    - `GET /api/v1/reports/profit-margin`: Calculates gross profit and gross margin percentage against Cost of Goods Sold (COGS: `orderItem.costPriceUsd * quantity`).
    - `GET /api/v1/reports/product-velocity`: Ranks inventory best-sellers and velocity by units sold, total revenue, and profit margin.
    - `GET /api/v1/reports/shifts`: Cash register shift audit logging opening floats, expected cash, actual counted cash, and cash drawer over/short variances.
    - `GET /api/v1/reports/export`: Dynamic CSV export endpoint generating formatted spreadsheets for revenue timelines and inventory product velocity.
* Implemented Admin Financial Intelligence UI (`apps/admin/src/app/reports/page.tsx`):
  - Top KPI Summary Cards: Gross Sales Revenue ($ & ៛), Gross Profit & Margin %, Total Orders & AOV, and Net Cash Drawer Over/Short audit.
  - Interactive Multi-Branch and Date Range selectors (Today, Last 7 Days, This Month, All Time).
  - Daily Revenue Trend visual bar chart.
  - Payment Tender Distribution progress visualizer (Cash vs. KHQR vs. Card).
  - Product Velocity & Sales Margin Leaderboard table with rank, units sold, revenue, profit, and margin badges.
  - Cash Register Shifts & Z-Report Reconciliation Audit table displaying exact drawer variances ($0.00 exact vs. over/short).
  - One-click "Export CSV" buttons for immediate spreadsheet download.
* Test suite: 67 backend unit tests passing across 14 test suites; all 5 packages build cleanly with Turborepo in 10.7s.

---

### ✅ Phase 12: Testing, Security & Hardening (Completed & Verified)
* **Status:** Complete (Verified with 79 backend Jest tests across 16 suites, 15 shared tests & Turbo build)
* Implemented Financial Precision & Hardening Edge Cases (`packages/shared/src/currency.edge.test.ts`):
  - Half-up rounding boundary tests (`0.005` rounds up to `0.01`, while `0.004999` rounds down to `0.00`).
  - Large currency figures ($250,000.75 -> 1,025,003,075៛) verified without floating point precision drift.
  - Zero and negative exchange rate guards preventing division-by-zero crashes.
  - Mixed-tender calculations ensuring change due is never negative or NaN, and shortage amounts are precisely tracked.
  - Multi-item order wholesale pricing boundaries strictly checked against minimum quantity thresholds.
  - 15 shared unit tests passing in Node test runner.
* Implemented Concurrency & Overselling Prevention Spec (`apps/backend/src/test/concurrency-overselling.spec.ts`):
  - Simulates 10 concurrent checkout requests simultaneously competing for the last single unit in stock (`quantityOnHand: 1`).
  - Simulates PostgreSQL row-level pessimistic locking (`SELECT ... FOR UPDATE`) within transaction queue.
  - Guarantees exactly 1 request succeeds and 9 requests are rejected with `BadRequestException` ("Insufficient inventory").
  - Verifies invariant: branch inventory `quantityOnHand` never drops below 0.
  - Verifies exactly 1 order and 1 immutable `StockMovement` ledger entry are created.
* Implemented Security Hardening & Access Control Spec (`apps/backend/src/test/security-hardening.spec.ts`):
  - RBAC Privilege Escalation Prevention:
    - Cashier role blocked from issuing refunds (`POST /api/v1/payments/orders/:id/refund` requires `SUPER_ADMIN` or `BRANCH_MANAGER`).
    - Cashier role blocked from approving wholesale accounts (`POST /customers/:id/wholesale-review` requires `SUPER_ADMIN` or `BRANCH_MANAGER`).
    - Stock Clerk role blocked from executing POS checkouts (`POST /api/v1/pos/checkout` requires `CASHIER`, `BRANCH_MANAGER`, or `SUPER_ADMIN`).
    - Super Admin granted global bypass for operational continuity.
  - Multi-Branch Tenant Isolation (`StoreAccessGuard`):
    - Cashier assigned to Branch A is strictly blocked with `ForbiddenException` when attempting operations on Branch B.
    - Super Admin permitted cross-branch access across all store branches.
    - Missing store branch identifier rejected with `BadRequestException`.
  - Idempotency & Replay Attack Defense:
    - POS checkout with an already processed `idempotencyKey` immediately returns the existing receipt without duplicate order creation, double charging, or secondary inventory deduction.
* Monorepo Test & Build Verification:
  - `@somnob/backend`: 79 unit tests passing cleanly across 16 test suites.
  - `@somnob/shared`: 15 unit tests passing cleanly in Node test runner.
  - Monorepo Build: All 5 packages (`@somnob/shared`, `@somnob/backend`, `@somnob/customer`, `@somnob/admin`, `@somnob/pos`) built with zero errors via Turborepo in 20.1s.

---

### ✅ Phase 13: Deployment & Production Readiness (Completed & Verified)
* **Status:** Complete (Verified with multi-stage Dockerfiles, compose orchestration, backup/restore scripts, health probes & Turbo build)
* Implemented Multi-Stage Production Dockerfiles:
  - `apps/backend/Dockerfile`: Node.js 20 Alpine with OpenSSL and libc6-compat, non-root user (`USER node`), automated Prisma client generation, and NestJS production build.
  - `apps/pos/Dockerfile`: Static Vite PWA compilation served via Nginx 1.25 Alpine with custom caching headers, gzip compression, and SPA client routing (`apps/pos/nginx.conf`).
  - `apps/admin/Dockerfile`: Next.js 14 standalone output image (`apps/admin/.next/standalone`) running with `node server.js` as non-root user on port 3000.
  - `apps/customer/Dockerfile`: Next.js 14 standalone output image (`apps/customer/.next/standalone`) running on port 3002.
  - `.dockerignore`: Optimized build context excluding node_modules, .turbo, .next, and test artifacts.
* Implemented Production Gateway Reverse Proxy (`deploy/nginx/nginx.conf`):
  - Unified Nginx edge gateway with rate limiting (`rate=50r/s`), gzip compression, and security headers (CSP, X-Frame-Options, X-XSS-Protection).
  - Routes `/api/`, `/health`, and `/docs` to backend cluster (`backend:4000`).
  - Routes `/pos/` to Touchscreen POS PWA (`pos:80`).
  - Routes `/admin/` to Store Management Portal (`admin:3000`).
  - Routes `/` to Customer Mobile Web App (`customer:3002`).
* Implemented Production Orchestration (`docker-compose.prod.yml`):
  - PostgreSQL 16 Alpine with persistent volume `somnob_pgdata_prod` and automated healthcheck (`pg_isready`).
  - Redis 7 Alpine with persistent volume `somnob_redisdata_prod` and healthcheck (`redis-cli ping`).
  - Fully wired internal network `somnob-internal` connecting backend, frontends, and gateway.
* Implemented Automated Backup & Disaster Recovery Scripts:
  - `scripts/backup-db.sh`: Automated gzip-compressed database dump with timestamping, integrity check, and 7-day retention pruning.
  - `scripts/restore-db.sh`: Fast database restoration utility from gzip archives.
* Enhanced Production Health Probes (`apps/backend/src/health/health.controller.ts`):
  - `GET /health`: Overall system and database connection status.
  - `GET /health/live`: Liveness probe for container orchestrator process tracking.
  - `GET /health/ready`: Readiness probe verifying PostgreSQL query responsiveness before receiving ingress traffic.
* Implemented Comprehensive Operations Runbook (`docs/production-deployment.md`):
  - Hardware specifications and server sizing.
  - Cryptographic secret generation guidelines (`openssl rand -base64 48`).
  - Zero-downtime rolling update workflow preserving active POS cashier shifts.
  - Crontab automated backup configuration.
* Test & Monorepo Build Verification:
  - Full Turbo monorepo build passes across all 5 packages.
  - 79 backend Jest tests passing across 16 test suites.
  - 15 shared unit tests passing in Node test runner.

---
