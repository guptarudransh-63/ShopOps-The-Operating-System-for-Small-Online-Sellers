const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Business = require('../models/Business');
const BusinessMembership = require('../models/BusinessMembership');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const InventoryBalance = require('../models/InventoryBalance');
const InventoryMovement = require('../models/InventoryMovement');
const Customer = require('../models/Customer');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const Payment = require('../models/Payment');
const ReturnRequest = require('../models/ReturnRequest');
const Expense = require('../models/Expense');
const inventoryService = require('../services/inventoryService');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const returnService = require('../services/returnService');
const { ROLES, ORDER_STATUS, PAYMENT_METHOD, SHIPMENT_STATUS, INQUIRY_STATUS } = require('../config/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopops';

async function seed() {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB');

    // Clean existing database
    await mongoose.connection.dropDatabase();
    console.log('[Seed] Cleared existing database');

    // 1. Create Demo Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const ownerUser = await User.create({
      fullName: 'Aria Sharma',
      email: 'aria@shopops.demo',
      passwordHash,
    });

    const staffUser = await User.create({
      fullName: 'Karan Patel',
      email: 'karan@shopops.demo',
      passwordHash,
    });

    // 2. Create Business Workspace
    const business = await Business.create({
      name: 'Aura Atelier',
      ownerId: ownerUser._id,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      reservationHoldMinutes: 60,
      taxRatePercent: 5.0,
      phone: '+91 98200 12345',
      email: 'support@auraatelier.in',
      address: {
        street: '14 Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
    });

    // 3. Memberships
    await BusinessMembership.create({
      userId: ownerUser._id,
      businessId: business._id,
      role: ROLES.OWNER,
      status: 'active',
    });

    await BusinessMembership.create({
      userId: staffUser._id,
      businessId: business._id,
      role: ROLES.STAFF,
      status: 'active',
    });

    // 4. Products & Clothing Variants
    const catalogData = [
      {
        name: 'Oversized Washed Linen Shirt',
        description: 'Breezy French linen shirt with relaxed dropped shoulders and shell buttons.',
        category: 'Tops',
        basePrice: 249900, // ₹2,499.00
        baseCostPrice: 95000, // ₹950.00
        lowStockThreshold: 4,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop'],
        variants: [
          { sku: 'AURA-LIN-WHT-S', title: 'Size: S / Color: Ivory White', size: 'S', color: 'Ivory White', stock: 15 },
          { sku: 'AURA-LIN-WHT-M', title: 'Size: M / Color: Ivory White', size: 'M', color: 'Ivory White', stock: 22 },
          { sku: 'AURA-LIN-WHT-L', title: 'Size: L / Color: Ivory White', size: 'L', color: 'Ivory White', stock: 8 },
          { sku: 'AURA-LIN-SGE-S', title: 'Size: S / Color: Sage Green', size: 'S', color: 'Sage Green', stock: 12 },
          { sku: 'AURA-LIN-SGE-M', title: 'Size: M / Color: Sage Green', size: 'M', color: 'Sage Green', stock: 18 },
          { sku: 'AURA-LIN-SGE-L', title: 'Size: L / Color: Sage Green', size: 'L', color: 'Sage Green', stock: 3 }, // low stock
        ],
      },
      {
        name: 'Pleated Wide-Leg Trousers',
        description: 'High-waisted tailored trousers crafted from breathable organic cotton twill.',
        category: 'Bottoms',
        basePrice: 319900, // ₹3,199.00
        baseCostPrice: 120000, // ₹1,200.00
        lowStockThreshold: 5,
        images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop'],
        variants: [
          { sku: 'AURA-TRS-BLK-S', title: 'Size: S / Color: Noir Black', size: 'S', color: 'Noir Black', stock: 10 },
          { sku: 'AURA-TRS-BLK-M', title: 'Size: M / Color: Noir Black', size: 'M', color: 'Noir Black', stock: 14 },
          { sku: 'AURA-TRS-BLK-L', title: 'Size: L / Color: Noir Black', size: 'L', color: 'Noir Black', stock: 7 },
          { sku: 'AURA-TRS-SAN-S', title: 'Size: S / Color: Desert Sand', size: 'S', color: 'Desert Sand', stock: 8 },
          { sku: 'AURA-TRS-SAN-M', title: 'Size: M / Color: Desert Sand', size: 'M', color: 'Desert Sand', stock: 12 },
        ],
      },
      {
        name: 'Chanderi Silk Anarkali Kurta',
        description: 'Pure handwoven Chanderi silk with subtle zari hand-embroidery along the neckline.',
        category: 'Ethnic Wear',
        basePrice: 489900, // ₹4,899.00
        baseCostPrice: 195000, // ₹1,950.00
        lowStockThreshold: 3,
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop'],
        variants: [
          { sku: 'AURA-KRT-MNT-S', title: 'Size: S / Color: Mint Sage', size: 'S', color: 'Mint Sage', stock: 6 },
          { sku: 'AURA-KRT-MNT-M', title: 'Size: M / Color: Mint Sage', size: 'M', color: 'Mint Sage', stock: 9 },
          { sku: 'AURA-KRT-MNT-L', title: 'Size: L / Color: Mint Sage', size: 'L', color: 'Mint Sage', stock: 2 }, // low stock
          { sku: 'AURA-KRT-BLS-M', title: 'Size: M / Color: Dusty Blush', size: 'M', color: 'Dusty Blush', stock: 5 },
        ],
      },
    ];

    const variantRecords = [];

    for (const item of catalogData) {
      const product = await Product.create({
        businessId: business._id,
        name: item.name,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        baseCostPrice: item.baseCostPrice,
        lowStockThreshold: item.lowStockThreshold,
        images: item.images,
      });

      for (const v of item.variants) {
        const variant = await ProductVariant.create({
          businessId: business._id,
          productId: product._id,
          sku: v.sku,
          title: v.title,
          attributes: [
            { name: 'Size', value: v.size },
            { name: 'Color', value: v.color },
          ],
          price: item.basePrice,
          costPrice: item.baseCostPrice,
        });

        await inventoryService.getOrCreateBalance(
          business._id,
          product._id,
          variant._id,
          v.stock
        );

        variantRecords.push({ variant, product, v });
      }
    }

    console.log(`[Seed] Created 3 products with ${variantRecords.length} sellable variants & balances`);

    // 5. Customers
    const customer1 = await Customer.create({
      businessId: business._id,
      fullName: 'Rhea Sen',
      email: 'rhea.sen@gmail.com',
      phone: '+91 98301 54321',
      addresses: [{
        street: 'Flat 4B, Silver Oak Heights, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India',
        isDefault: true,
      }],
      tags: ['Repeat Buyer', 'Instagram VIP'],
    });

    const customer2 = await Customer.create({
      businessId: business._id,
      fullName: 'Ananya Mehra',
      email: 'ananya.m@outlook.com',
      phone: '+91 98112 99887',
      addresses: [{
        street: 'D-32 Defence Colony',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110024',
        country: 'India',
        isDefault: true,
      }],
      tags: ['Boutique Shopper'],
    });

    const customer3 = await Customer.create({
      businessId: business._id,
      fullName: 'Devika Nair',
      email: 'devika.nair@yahoo.co.in',
      phone: '+91 94471 22334',
      addresses: [{
        street: 'House #12, Kowdiar Gardens',
        city: 'Thiruvananthapuram',
        state: 'Kerala',
        postalCode: '695003',
        country: 'India',
        isDefault: true,
      }],
      tags: ['New Customer'],
    });

    // 6. Channel Inquiries
    const inq1 = await Inquiry.create({
      businessId: business._id,
      customerId: customer1._id,
      customerName: customer1.fullName,
      customerPhone: customer1.phone,
      customerEmail: customer1.email,
      channel: 'instagram',
      messageSummary: 'DM on Instagram: "Hi! Can you let me know if the washed linen shirt in Sage Green Size M is true to size?"',
      interestedItems: [{
        productId: variantRecords[4].product._id,
        variantId: variantRecords[4].variant._id,
        productName: variantRecords[4].product.name,
        variantTitle: variantRecords[4].variant.title,
        quantity: 1,
      }],
      status: INQUIRY_STATUS.NEW,
      assignedStaffId: staffUser._id,
    });

    const inq2 = await Inquiry.create({
      businessId: business._id,
      customerId: customer2._id,
      customerName: customer2.fullName,
      customerPhone: customer2.phone,
      customerEmail: customer2.email,
      channel: 'whatsapp',
      messageSummary: 'WhatsApp: "Looking to order the Chanderi Silk Anarkali in Size M. Do you offer express delivery to Delhi?"',
      interestedItems: [{
        productId: variantRecords[12].product._id,
        variantId: variantRecords[12].variant._id,
        productName: variantRecords[12].product.name,
        variantTitle: variantRecords[12].variant.title,
        quantity: 1,
      }],
      status: INQUIRY_STATUS.IN_PROGRESS,
      assignedStaffId: staffUser._id,
    });

    // 7. Orders across different lifecycles
    // Order 1: Delivered & Paid with a partial return inspection!
    const order1 = await orderService.createOrder({
      businessId: business._id,
      customerData: {
        customerId: customer1._id,
        name: customer1.fullName,
        phone: customer1.phone,
        email: customer1.email,
        shippingAddress: customer1.addresses[0],
      },
      items: [
        { variantId: variantRecords[1].variant._id.toString(), quantity: 2 }, // Linen White M x 2
        { variantId: variantRecords[7].variant._id.toString(), quantity: 1 }, // Trousers Black M x 1
      ],
      shippingFee: 15000, // ₹150 shipping
      notes: 'Customer requested eco-friendly packaging',
      actorId: ownerUser._id,
    });
    // Move through transitions
    await orderService.confirmOrder(order1._id, business._id, ownerUser._id);
    await orderService.transitionStatus(order1._id, business._id, ORDER_STATUS.PROCESSING, 'Packing items', staffUser._id);
    await orderService.transitionStatus(order1._id, business._id, ORDER_STATUS.PACKED, 'Box sealed', staffUser._id);
    await orderService.transitionStatus(order1._id, business._id, ORDER_STATUS.SHIPPED, 'Dispatched via Delhivery', staffUser._id);
    await orderService.transitionStatus(order1._id, business._id, ORDER_STATUS.DELIVERED, 'Customer confirmed receipt', staffUser._id);

    // Shipment record
    await Shipment.create({
      businessId: business._id,
      orderId: order1._id,
      carrier: 'Delhivery',
      trackingNumber: 'DLHV-9988223311',
      trackingUrl: 'https://delhivery.com/track/DLHV-9988223311',
      shippingCost: 11000, // ₹110 actual cost
      deliveryStatus: SHIPMENT_STATUS.DELIVERED,
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // Payment record for Order 1
    const order1Fresh = await Order.findById(order1._id);
    await paymentService.recordPayment({
      businessId: business._id,
      orderId: order1._id,
      paymentMethod: PAYMENT_METHOD.UPI,
      amount: order1Fresh.financials.totalAmount,
      referenceId: 'UPI-UTR-4321098765',
      idempotencyKey: `PAY-ORD1-${order1._id}`,
      recordedBy: ownerUser._id,
    });

    // Process a return for 1 unit of Linen White M on Order 1
    const ret1 = await returnService.requestReturn({
      businessId: business._id,
      orderId: order1._id,
      reason: 'sizing_issue',
      items: [{
        variantId: variantRecords[1].variant._id.toString(),
        requestedQuantity: 1,
      }],
      returnShippingCost: 8000, // ₹80
    });
    await returnService.approveReturn(ret1._id, business._id);
    // Physically inspect: 1 unit is resellable!
    await returnService.inspectAndRestock({
      businessId: business._id,
      returnId: ret1._id,
      inspectionData: [{
        variantId: variantRecords[1].variant._id.toString(),
        resellableQuantity: 1,
        damagedQuantity: 0,
      }],
      issueRefund: true,
      refundPaymentMethod: 'upi',
      actorId: ownerUser._id,
    });

    // Order 2: Packed and Paid via Bank Transfer, awaiting courier pickup
    const order2 = await orderService.createOrder({
      businessId: business._id,
      customerData: {
        customerId: customer2._id,
        name: customer2.fullName,
        phone: customer2.phone,
        email: customer2.email,
        shippingAddress: customer2.addresses[0],
      },
      items: [
        { variantId: variantRecords[11].variant._id.toString(), quantity: 1 }, // Chanderi Kurta Mint S x 1
      ],
      orderDiscount: 20000, // ₹200 festival promo discount
      shippingFee: 0, // Free shipping
      notes: 'Festival gift wrap requested',
      actorId: staffUser._id,
    });
    await orderService.confirmOrder(order2._id, business._id, staffUser._id);
    await orderService.transitionStatus(order2._id, business._id, ORDER_STATUS.PROCESSING, 'Item steaming and inspection', staffUser._id);
    await orderService.transitionStatus(order2._id, business._id, ORDER_STATUS.PACKED, 'Box ready for courier', staffUser._id);

    const order2Fresh = await Order.findById(order2._id);
    await paymentService.recordPayment({
      businessId: business._id,
      orderId: order2._id,
      paymentMethod: PAYMENT_METHOD.BANK_TRANSFER,
      amount: order2Fresh.financials.totalAmount,
      referenceId: 'NEFT-AXIS-88771122',
      idempotencyKey: `PAY-ORD2-${order2._id}`,
      recordedBy: staffUser._id,
    });

    // Order 3: Active Confirmed Order with Active Stock Reservation (Unpaid COD)
    const order3 = await orderService.createOrder({
      businessId: business._id,
      customerData: {
        customerId: customer3._id,
        name: customer3.fullName,
        phone: customer3.phone,
        email: customer3.email,
        shippingAddress: customer3.addresses[0],
      },
      items: [
        { variantId: variantRecords[3].variant._id.toString(), quantity: 1 }, // Linen Sage S x 1
        { variantId: variantRecords[9].variant._id.toString(), quantity: 1 }, // Trousers Sand S x 1
      ],
      shippingFee: 15000,
      notes: 'COD order - Customer verified over phone',
      actorId: staffUser._id,
    });
    await orderService.confirmOrder(order3._id, business._id, staffUser._id);

    // 8. Record Business Operating Expenses
    await Expense.create({
      businessId: business._id,
      category: 'packaging',
      amount: 450000, // ₹4,500 for 100 premium kraft mailing boxes + custom tissue
      description: '100x Eco-friendly kraft boxes with embossed logo & butter paper',
      recordedBy: ownerUser._id,
    });

    await Expense.create({
      businessId: business._id,
      category: 'software',
      amount: 199900, // ₹1,999
      description: 'ShopOps Pro subscription',
      recordedBy: ownerUser._id,
    });

    console.log('[Seed] Database successfully seeded with rich boutique store data!');
    console.log('[Seed] Demo Credentials:');
    console.log('       Email: aria@shopops.demo / Password: password123 (Owner)');
    console.log('       Email: karan@shopops.demo / Password: password123 (Staff)');

    await mongoose.disconnect();
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
