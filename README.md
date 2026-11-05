# ShopOps — The Operating System for Small Online Sellers

ShopOps is a complete, production-grade business management platform tailored for small online sellers, Instagram clothing brands, and independent boutique owners. It unifies the entire commerce lifecycle—from product variant matrices and atomic inventory reservations to channel inquiry capture, shipping fulfillment, inspection-first returns, and contribution-profit accounting.

---

## 1. Core Product Workflows & Business Rules

### 1.1 Multi-Variant Catalog Management
- **Hierarchical Apparel Architecture**: Products represent apparel designs (e.g., *French Washed Linen Shirt*), with sellable variants tracking specific attributes like **Size** (XS, S, M, L, XL, XXL) and **Color** (Noir Black, Ivory White, Sage Green).
- **Unique SKU Enforcement**: Compound unique indexes (`businessId + sku`) prevent accidental duplicate catalog entries.
- **Stock Integrity**: Historic orders store immutable snapshots of product name, SKU, price, and cost basis so archived products never alter past records.

### 1.2 Atomic Inventory Reservations & Concurrency Protection
- **Formula**:
  $$\text{Available Stock} = \text{On Hand} - \text{Active Reserved}$$
- **Atomic Concurrency Guarantee**: When an order is confirmed, stock is reserved using MongoDB atomic conditional updates (`$expr: { $gte: [{ $subtract: ['$onHand', '$reserved'] }, quantity] }`). Multiple concurrent requests cannot oversell the final units.
- **Commit on Fulfillment**: When an order transitions to `shipped`, physical stock and reservations are decremented in tandem (`onHand: -qty`, `reserved: -qty`).
- **Reservation Expiration Worker**: A background scheduler periodically scans for stale unconfirmed reservations past their configurable hold window (default: 30 minutes) and auto-releases reserved units.

### 1.3 Order Lifecycle State Machine
Orders enforce strict server-side validated state transitions:
$$\text{Draft} \longrightarrow \text{Confirmed (Reserved)} \longrightarrow \text{Processing} \longrightarrow \text{Packed} \longrightarrow \text{Shipped (Committed)} \longrightarrow \text{Delivered}$$
- **Cancellation**: Allowed only prior to dispatch (`draft`, `confirmed`, `processing`, `packed`). Cancellation immediately releases held reservations with an audit ledger entry. Shipped or delivered orders must follow the return workflow.
- **Server-Side Financials**: Totals (subtotal, line discounts, order discounts, shipping, tax) are computed exclusively on the backend from trusted database pricing.

### 1.4 Inspection-First Returns & Exchanges
- **Zero Restocking on Request**: Merely requesting a return does **not** restore inventory.
- **Physical Inspection**: When the package arrives, staff inspect units and classify each piece:
  - **Resellable Units**: Restored to `onHand` sellable stock.
  - **Damaged Units**: Recorded in the separate damaged write-off bucket, never returned to sellable inventory.
- **Refund & Exchange**: Recorded with idempotency keys, updating the contribution profit waterfall.

### 1.5 Channel Inquiry-to-Order Pipeline
- Capture inbound leads across **Instagram DMs**, **WhatsApp**, **Websites**, or **Boutique Walk-ins**.
- Associate prospective product variants.
- **1-Click Conversion**: Generates a draft order with customer information and line items pre-populated, linking the original conversation.

### 1.6 True Contribution Profit Accounting
Distinguishes gross merchandise value, cash collected, and true retained earnings:
$$\text{Contribution Profit} = \text{Net Product Sales} - \text{COGS} - \text{Outbound Shipping} - \text{Packaging Costs} - \text{Payment Fees} - \text{Net Return Loss}$$
where:
$$\text{Net Return Loss} = \text{Refunds Issued} - \text{Restocked Cost Recovery} + \text{Return Shipping}$$

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, React Router v7, Axios.
- **Backend**: Node.js, Express.js, MongoDB 8.0, Mongoose, Zod, JWT (secure HTTP-only cookies), bcryptjs.
- **Testing**: Jest, Supertest, MongoDB Memory Server.
- **Background Jobs**: In-process reservation expiration monitor with graceful shutdown.

---

## 3. Design System & Aesthetic Tokens

ShopOps employs a calm, premium light aesthetic inspired by modern artisanal commerce:
- **Page Canvas**: `#F8F8F5` (warm ivory)
- **Cards & Surfaces**: `#FFFFFF` (crisp white)
- **Primary Typography**: `#242821` (deep charcoal)
- **Secondary Typography**: `#777C74` (muted slate)
- **Brand Accent**: `#607A63` (refined sage green)
- **Accent Soft**: `#EAF0E8` (soft sage background for badges and active pills)
- **Borders & Dividers**: `#E8E9E3`

---

## 4. Setup & Running Locally

### Prerequisites
- Node.js v18+ (tested on v26)
- MongoDB instance (running locally on `mongodb://127.0.0.1:27017` or via MongoDB Atlas)

### 1. Install Dependencies
```bash
# In the project root:
cd server && npm install
cd ../client && npm install
```

### 2. Seed Boutique Demo Data
Populates the database with realistic apparel items (artisanal linen shirts, trousers, silk kurtas), multi-state orders, shipments, customer inquiries, and inspected returns:
```bash
cd server
npm run seed
```

**Demo Credentials**:
- **Owner**: `aria@shopops.demo` / `password123`
- **Staff**: `karan@shopops.demo` / `password123`

### 3. Run Development Servers
In two separate terminals:

**Terminal 1 (Backend API on http://localhost:5001):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on http://localhost:5173):**
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** to access the application. Use the **1-Click Demo Login** buttons on the sign-in screen to instantly inspect the platform.

---

## 5. Automated Test Suite

Run the full suite of integration and invariant tests:
```bash
cd server
npm test
```

### Test Coverage Highlights
- `tests/inventory.test.js`: Verifies atomic reservations, oversell prevention under concurrent order attempts, stock release on cancellation, and selective return restocking.
- `tests/order.test.js`: Verifies server-side authoritative pricing, line item snapshotting, and enforcement of valid vs invalid state transitions.
- `tests/payment_returns.test.js`: Verifies idempotency key payment deduplication, refund limits, and uninspected return hold invariants.
- `tests/auth_tenant.test.js`: Verifies unauthenticated 401 rejections, staff RBAC permission boundaries (403), and cross-business tenant isolation (403).
