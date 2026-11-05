const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const inventoryService = require('../src/services/inventoryService');
const InventoryBalance = require('../src/models/InventoryBalance');
const InventoryMovement = require('../src/models/InventoryMovement');
const InventoryReservation = require('../src/models/InventoryReservation');
const Product = require('../src/models/Product');
const ProductVariant = require('../src/models/ProductVariant');

let mongoServer;
let businessId;
let productId;
let variantId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  businessId = new mongoose.Types.ObjectId();
  const product = await Product.create({
    businessId,
    name: 'Test T-Shirt',
    basePrice: 1000,
    baseCostPrice: 500,
  });
  productId = product._id;

  const variant = await ProductVariant.create({
    businessId,
    productId,
    sku: 'TEST-TSHIRT-M',
    title: 'Size: M / Color: Black',
    price: 1000,
    costPrice: 500,
  });
  variantId = variant._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Inventory & Atomic Reservation Logic', () => {
  beforeEach(async () => {
    await InventoryBalance.deleteMany({});
    await InventoryMovement.deleteMany({});
    await InventoryReservation.deleteMany({});

    // Initialize with 10 on-hand units
    await inventoryService.getOrCreateBalance(businessId, productId, variantId, 10);
  });

  test('Atomically reserves available stock', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const reservation = await inventoryService.reserveStock({
      businessId,
      orderId,
      variantId,
      productId,
      quantity: 4,
    });

    expect(reservation.status).toBe('active');
    expect(reservation.quantity).toBe(4);

    const balance = await InventoryBalance.findOne({ businessId, variantId });
    expect(balance.onHand).toBe(10);
    expect(balance.reserved).toBe(4);
    expect(balance.available).toBe(6);
  });

  test('Fails cleanly when requesting more than available stock', async () => {
    const orderId = new mongoose.Types.ObjectId();
    await expect(
      inventoryService.reserveStock({
        businessId,
        orderId,
        variantId,
        productId,
        quantity: 15, // Only 10 available
      })
    ).rejects.toThrow('Insufficient inventory');

    const balance = await InventoryBalance.findOne({ businessId, variantId });
    expect(balance.reserved).toBe(0);
    expect(balance.available).toBe(10);
  });

  test('Handles concurrent reservations without overselling', async () => {
    // There are 10 units available.
    // Let's fire 3 concurrent reservation attempts of 4 units each (12 total needed).
    // Exactly 2 must succeed (8 units), and 1 must fail with InsufficientStock!
    const results = await Promise.allSettled([
      inventoryService.reserveStock({
        businessId,
        orderId: new mongoose.Types.ObjectId(),
        variantId,
        productId,
        quantity: 4,
      }),
      inventoryService.reserveStock({
        businessId,
        orderId: new mongoose.Types.ObjectId(),
        variantId,
        productId,
        quantity: 4,
      }),
      inventoryService.reserveStock({
        businessId,
        orderId: new mongoose.Types.ObjectId(),
        variantId,
        productId,
        quantity: 4,
      }),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(1);

    const balance = await InventoryBalance.findOne({ businessId, variantId });
    expect(balance.reserved).toBe(8);
    expect(balance.available).toBe(2);
  });

  test('Releases reservation when order is cancelled', async () => {
    const orderId = new mongoose.Types.ObjectId();
    await inventoryService.reserveStock({
      businessId,
      orderId,
      variantId,
      productId,
      quantity: 5,
    });

    await inventoryService.releaseReservation({
      businessId,
      orderId,
      variantId,
      quantity: 5,
    });

    const balance = await InventoryBalance.findOne({ businessId, variantId });
    expect(balance.reserved).toBe(0);
    expect(balance.available).toBe(10);

    const resRecord = await InventoryReservation.findOne({ orderId });
    expect(resRecord.status).toBe('released');
  });

  test('Restocks only resellable units on return inspection, not damaged units', async () => {
    const returnRequestId = new mongoose.Types.ObjectId();

    // 2 units returned: 1 resellable, 1 damaged
    await inventoryService.processReturnRestock({
      businessId,
      returnRequestId,
      variantId,
      resellableQty: 1,
      damagedQty: 1,
    });

    const balance = await InventoryBalance.findOne({ businessId, variantId });
    expect(balance.onHand).toBe(11); // Initial 10 + 1 resellable
    expect(balance.damaged).toBe(1); // 1 damaged bucket
    expect(balance.available).toBe(11);
  });
});
