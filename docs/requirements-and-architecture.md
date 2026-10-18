# Somnob POS - Requirements & Architecture Specification

## Document Information
* **Project Name:** Somnob POS Ecosystem
* **Phase:** 1 - Requirements and Architecture
* **Status:** Pending User Approval
* **Version:** 1.0.0
* **Date:** 2026-10-18

---

## 1. Project Overview

Somnob POS is an enterprise-grade, modular Point of Sale (POS) and retail management ecosystem tailored for retail, grocery, and convenience businesses. It operates across multiple physical branch locations under a unified business entity, providing:

1. **Admin Dashboard (Web):** Centralized multi-branch control for catalog, inventory, pricing, employees, orders, suppliers, and reporting.
2. **POS Application (Touchscreen Web App / PWA):** High-speed in-store checkout terminal featuring offline-first sales capabilities, barcode scanning, cash register sessions, and support for Cash, Card, and dynamic Local QR (KHQR / PromptPay) payments.
3. **Customer Web App (Mobile-Responsive Web / PWA):** Customer ordering portal supporting catalog browsing, real-time store stock availability, pickup, and delivery fulfillment.
4. **Backend API (Modular Monolith):** NestJS REST API providing authoritative pricing, inventory tracking, role-based access control (RBAC), and transactional synchronization.
5. **Database:** PostgreSQL with Prisma ORM, utilizing ACID transactions, strict audit logging, and integer-minor-unit financial precision.

---

## 2. Confirmed Requirements

### 2.1 Organizational Model (Single Business, Multi-Branch)
* A single legal business entity operating one or more physical branches / stores.
* **Shared Master Catalog:** Products, categories, variants, and base SKUs are managed centrally.
* **Store-Specific Operations:** Inventory balances, stock alerts, cash registers, POS sessions, and physical orders are tracked per individual branch.
* **Store-Level Pricing (Optional/Configurable):** Master base pricing with optional branch-level price overrides.

### 2.2 Business Vertical (Retail / Convenience / Grocery)
* Barcode-first workflows (EAN-13, UPC, Code128, internal SKUs).
* Product variants (Size, Color, Unit of Measure: Piece, Box, Pack, Kilogram).
* Rapid cashier search and hotkey/touchscreen category grids.
* Strict stock traceability: every quantity increase/decrease is tied to a movement event (Sale, Refund, Adjustment, Transfer, Purchase Order receiving).

### 2.3 Payments & Currency
* **Approved Currencies (Cambodia Dual-Currency Standard):**
  * **Base Accounting Currency:** USD ($) - stored with 2 decimal places / cents.
  * **Secondary Operational Currency:** KHR (៛) Cambodian Riel - integer precision with configurable exchange rate (e.g., 1 USD = 4,100 KHR).
  * **Tender & Change Calculation:** Cashier can accept mixed payments (part USD, part KHR), and system computes change in either USD, KHR, or a combination.
  * **KHQR Integration:** Generates dynamic Bakong/KHQR codes in either USD or KHR matching the bill currency.
* **In-Store POS Payment Methods:**
  * **Cash:** Quick-tender buttons (USD bills: $1, $5, $10, $20, $50, $100; KHR notes: 1,000៛, 5,000៛, 10,000៛, 20,000៛, 50,000៛, 100,000៛), change calculation, cash drawer management.
  * **Card Terminal:** Reference transaction ID recording.
  * **KHQR / Bank Transfers:** Dynamic QR generation and reference ID verification.
* **Financial Calculations:**
  * Base currency stored as precise fixed-point decimal (`Decimal(12,2)`) in PostgreSQL to eliminate floating-point arithmetic errors.
  * Explicit rounding rules (Half-Up) enforced on the server.

### 2.4 Fulfillment Workflows
* **In-Store POS Sales:** Instant checkout, receipt issuance, instant stock deduction.
* **Customer Online Orders:**
  * **Pickup:** Customer selects specific branch location, system reserves stock, cashier/staff prepares package for pickup.
  * **Delivery:** Customer provides delivery address and contact info, system assigns order to fulfillment branch, dispatches for delivery.

### 2.5 Offline-First POS Capability
* Local caching via IndexedDB in the Touchscreen Web App (PWA).
* Cashier can continue ringing cash sales, scanning cached products, and printing receipts while offline.
* Offline sales are tagged with client-generated cryptographic UUIDs (idempotency keys) and sequential offline transaction numbers.
* Automatic background synchronization and reconciliation once network connectivity is re-established.
* Conflict resolution policies (e.g., negative stock warnings flagged for post-sync manager review rather than blocking cash checkout).

### 2.6 Platforms for Initial MVP
* **Admin Dashboard:** Next.js (TypeScript, desktop-responsive web).
* **POS Application:** Touchscreen-optimized React Web App (PWA with offline storage).
* **Customer App:** Mobile-responsive Web application (Next.js / React, optimized for mobile browsers, seamlessly convertible to Expo/React Native in Phase 9).
* **Backend:** NestJS (TypeScript), Prisma ORM, PostgreSQL.

---

## 3. Assumptions

1. **Network Reliability:** Offline operation is primarily required for the in-store POS terminal (cash sales and cached catalog). Admin dashboard and customer ordering require active internet connectivity.
2. **Authority:** The server remains the ultimate source of truth for pricing, discounts, tax, and order totals. When the POS is offline, it executes client-side calculation rules identical to the server algorithm and validates them upon reconciliation.
3. **Hardware Integration:** Barcode scanners communicate as standard USB/Bluetooth HID (keyboard emulation). Receipt printers connect via ESC/POS Network/IP or browser standard print dialog for the web MVP.
4. **Taxes:** Configurable tax rates (e.g., VAT inclusive or exclusive) applied at checkout.

---

## 4. User Roles & Permissions (RBAC)

| Role | Scope | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin / Owner** | Entire Business (All Branches) | Full access: business settings, branch creation, user management, global reports, catalog creation, pricing. |
| **Branch Manager** | Assigned Branch(es) | Branch inventory management, purchase orders, stock adjustments, cashier session reconciliations, branch reports, refund authorizations. |
| **Cashier** | Assigned Branch & Register | Open/close cash register session, search catalog, scan items, create sales, tender payments, issue receipts, request manager approval for discounts/voids. |
| **Inventory Clerk / Stock Staff** | Assigned Branch / Warehouse | Receive purchase orders, perform stock counts, execute stock transfers between branches. |
| **Customer** | Personal Account | Manage profile, save addresses, view catalog, manage cart, place pickup/delivery orders, track order history. |

---

## 5. System Architecture

### 5.1 Architecture Style
* **Modular Monolith Backend:** A single NestJS codebase structured with strict domain boundaries and encapsulation. This prevents microservice networking overhead while maintaining clean separation of concerns:
  * `AuthModule` (JWT, Refresh tokens, RBAC guard)
  * `UserModule` (Employees, roles, permissions)
  * `StoreModule` (Branches, settings, operating hours)
  * `CatalogModule` (Categories, products, variants, SKUs, barcodes)
  * `InventoryModule` (Stock levels, movements, adjustments, low-stock triggers)
  * `RegisterModule` (Cash registers, open/close shifts, cash counting)
  * `OrderModule` (Authoritative calculation, state machine, cart, checkout)
  * `PaymentModule` (Payment records, reconciliation, QR/Card/Cash verification)
  * `AuditModule` (Immutable logs of sensitive actions)

### 5.2 System Architecture Diagram

```
 +------------------------+   +-----------------------+   +-------------------------+
 |    Admin Dashboard     |   |    POS Application    |   |    Customer Web App     |
 |  (Next.js / Tailwind)  |   | (React PWA/IndexedDB) |   | (Mobile-Responsive Web) |
 +-----------+------------+   +-----------+-----------+   +------------+------------+
             |                            |                            |
             | HTTPS / REST               | HTTPS / Sync API           | HTTPS / REST
             v                            v                            v
 +----------------------------------------------------------------------------------+
 |                        Backend Gateway & Security Layer                          |
 |            (NestJS: CORS, Rate Limiting, Helmet, Validation Pipe, JWT)           |
 +----------------------------------------------------------------------------------+
                                          |
                                          v
 +----------------------------------------------------------------------------------+
 |                            Modular Domain Modules                                |
 |  [Auth] [Users] [Stores] [Catalog] [Inventory] [Register] [Order] [Payment]      |
 +----------------------------------------------------------------------------------+
                                          |
                                          v
 +----------------------------------------------------------------------------------+
 |                           Prisma ORM & Transaction Manager                       |
 +----------------------------------------------------------------------------------+
                                          |
                                          v
 +----------------------------------------------------------------------------------+
 |                        PostgreSQL Relational Database                             |
 |       (ACID Transactions, Foreign Keys, Audit Tables, Concurrency Locks)         |
 +----------------------------------------------------------------------------------+
```

---

## 6. Main Business Workflows

### 6.1 Register Shift Management (POS)
1. Cashier logs into POS with PIN / credentials.
2. If no active register shift exists, prompt for **Opening Float** (starting cash in drawer).
3. System logs `RegisterShift` (Status: `OPEN`, start timestamp, opening balance).
4. Sales, returns, and cash drops are logged during the shift.
5. At end of shift, cashier initiates **Close Register**, inputs physical cash count.
6. System calculates expected cash vs. actual cash, flags discrepancies (overage/shortage), and issues Z-Report summary.

### 6.2 In-Store Sale Workflow (Online & Offline)
1. Cashier scans barcode or selects item from category grid.
2. Cart item is added with variant, unit price, quantity, and applied discounts.
3. System verifies stock balance (online mode) or relies on cached inventory (offline mode).
4. Cashier chooses payment method:
   * **Cash:** Enter tendered amount -> calculate change -> trigger cash drawer -> print receipt.
   * **Card:** Enter reference/approval code from terminal.
   * **QR (KHQR / PromptPay):** Dynamic QR displayed on screen/customer-facing display with exact bill amount -> customer scans and pays -> cashier confirms payment reference.
5. Order state changes to `COMPLETED`.
6. Atomic transaction:
   * Deducts inventory from branch.
   * Creates `StockMovement` (type: `SALE`).
   * Records `Payment` entry linked to `Order` and `RegisterShift`.

### 6.3 Customer Pickup & Delivery Workflow
1. Customer selects fulfillment type: Pickup (with branch selection) or Delivery (with address).
2. Customer adds items to cart and submits order.
3. System verifies stock availability at chosen branch, places temporary stock reservation lock (TTL: 15 minutes).
4. Order created with status `PENDING_CONFIRMATION`.
5. Branch receives notification on Admin/POS.
6. Branch accepts order -> status `PREPARING` -> stock officially committed.
7. If Pickup: Customer arrives -> verifies order code -> marked `COMPLETED`.
8. If Delivery: Dispatcher/courier assigned -> status `OUT_FOR_DELIVERY` -> delivered -> marked `COMPLETED`.

---

## 7. Non-Functional Requirements

* **Performance:**
  * POS item lookup and barcode scan response time < 100ms.
  * Server API p95 response time < 200ms.
* **Security:**
  * Argon2 or Bcrypt password hashing.
  * JWT access tokens (short TTL, e.g., 15 mins) with secure HTTP-only refresh tokens.
  * Strict input sanitization via `class-validator` / DTO pipes.
  * No storage of credit card numbers/CVVs (PCI-DSS compliance scope reduction).
* **Data Integrity:**
  * Database-level constraints (foreign keys, check constraints, non-negative stock guards).
  * Pessimistic or optimistic concurrency locking for stock deductions to prevent overselling.
  * Monotonic transaction sequencing and idempotency keys on payment/checkout endpoints.
* **Auditability:**
  * Full audit logs for price changes, inventory adjustments, user role modifications, and cancelled/refunded orders.

---

## 8. MVP Scope Definition

### In Scope for MVP
* **Branches:** Multi-branch support (create branches, assign users & stock per branch).
* **Catalog:** Categories, products, variants, SKUs, barcode management, image URLs.
* **Inventory:** Per-branch inventory balances, manual stock adjustments with reason codes, stock movement history.
* **Cash Register:** Open shift (opening float), close shift (reconciliation, over/short count).
* **POS Terminal:** Barcode scan, item search, touchscreen cart, tax calculation, Cash/Card/Local QR payments, receipt preview/print, offline caching & sync for cash transactions.
* **Customer Web:** Mobile-responsive catalog browsing, cart, pickup and delivery order placement, order status tracking.
* **Admin Dashboard:** Overview metrics, CRUD for catalog, inventory management, user & branch management, order processing, basic sales reports.
* **Backend:** REST API, Prisma schema, PostgreSQL, seed data, unit and integration tests.

### Deferred to Post-MVP (Phase 2+)
* Inter-branch stock transfer approval workflows (can be manually adjusted in MVP).
* Purchase order receiving workflows from external suppliers (can use stock adjustments in MVP).
* Hardware ESC/POS raw socket printing drivers (MVP uses standard browser printing / web print templates).
* Native Android/iOS mobile build packaging (Customer web portal serves mobile users during initial release; Expo app wraps it in Phase 9).

---

## 9. Risks and Trade-offs

| Risk / Trade-off | Strategy |
| :--- | :--- |
| **Offline Sync Stock Conflicts** | When the POS is offline, another terminal or online order could sell the same item. Resolution: Offline sales are guaranteed to succeed locally for customer experience, but sync applies stock deduction; if inventory drops below zero, a `NEGATIVE_STOCK_ALERT` is logged for manager reconciliation. |
| **Dual Currency Complexity (USD + KHR)** | In retail environments using KHQR/Cambodian markets, dual currency (USD prices, KHR cash/QR or vice-versa) is standard. We will implement base currency storage with a configurable live exchange rate for tendering and change calculation. |
| **Monolith vs Microservices** | A modular monolith inside NestJS avoids distributed transactions, network latency, and orchestration overhead while keeping domains cleanly isolated for easy future extraction if necessary. |

---

## 10. Phase 1 Acceptance Criteria

1. Clear alignment on multi-branch retail model, payment types, and offline-first POS architecture.
2. Technical stack validated: Next.js (Admin), React PWA (POS), React/Next.js (Customer Web), NestJS (Backend), PostgreSQL + Prisma (Database).
3. Currency handling and precision approach approved.
4. MVP vs Post-MVP boundaries explicitly agreed upon.
5. User sign-off to proceed to **Phase 2: Database Design**.
