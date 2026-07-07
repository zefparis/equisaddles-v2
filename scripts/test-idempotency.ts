/**
 * Test: Simulated concurrent order creation with same stripeSessionId
 *
 * This test verifies that the UNIQUE constraint on stripe_session_id
 * prevents duplicate orders even under race conditions.
 *
 * Two concurrent createOrder() calls with the same stripeSessionId
 * should result in exactly one order, with the second call receiving
 * a PostgreSQL 23505 unique_violation error.
 *
 * Run: npx tsx scripts/test-idempotency.ts
 */

import { db } from "../server/db";
import { orders } from "../shared/schema";
import { eq } from "drizzle-orm";

const TEST_SESSION_ID = "test_concurrent_session_" + Date.now();

async function createOrder(stripeSessionId: string) {
  const orderData = {
    customerName: "Test Concurrent",
    customerEmail: "test-concurrent@example.com",
    customerAddress: "123 Test Street",
    customerCity: "Test City",
    customerPostalCode: "12345",
    customerCountry: "FR",
    items: JSON.stringify([{ id: 1, name: "Test Product", price: "100.00", quantity: 1 }]),
    totalAmount: "100.00",
    shippingCost: "12.90",
    status: "paid",
    stripeSessionId,
  };

  try {
    const result = await db.insert(orders).values(orderData).returning();
    return { success: true, orderId: result[0].id, error: null };
  } catch (error: any) {
    return { success: false, orderId: null, error: error.code || error.message };
  }
}

async function cleanup(stripeSessionId: string) {
  try {
    await db.delete(orders).where(eq(orders.stripeSessionId, stripeSessionId));
  } catch {
    // ignore cleanup errors
  }
}

async function main() {
  console.log("=== Idempotency Test: Concurrent Order Creation ===");
  console.log(`Test session ID: ${TEST_SESSION_ID}`);
  console.log("");

  // Cleanup any previous test data
  await cleanup(TEST_SESSION_ID);

  // Launch two concurrent createOrder calls with the same stripeSessionId
  console.log("Launching two concurrent createOrder() calls...");
  const [result1, result2] = await Promise.all([
    createOrder(TEST_SESSION_ID),
    createOrder(TEST_SESSION_ID),
  ]);

  console.log("");
  console.log("Result 1:", JSON.stringify(result1));
  console.log("Result 2:", JSON.stringify(result2));
  console.log("");

  // Verify only one order exists in the database
  const allOrders = await db.select().from(orders).where(eq(orders.stripeSessionId, TEST_SESSION_ID));
  const orderCount = allOrders.length;

  console.log(`Orders in database with this session ID: ${orderCount}`);
  console.log("");

  // Assertions
  const oneSucceeded = result1.success !== result2.success; // exactly one true
  const oneGot23505 = result1.error === '23505' || result2.error === '23505';
  const exactlyOneOrder = orderCount === 1;

  console.log("=== Assertions ===");
  console.log(`[1] Exactly one createOrder succeeded: ${oneSucceeded ? "PASS" : "FAIL"}`);
  console.log(`[2] The other received PostgreSQL 23505: ${oneGot23505 ? "PASS" : "FAIL"}`);
  console.log(`[3] Exactly one order in database: ${exactlyOneOrder ? "PASS" : "FAIL"}`);
  console.log("");

  const allPass = oneSucceeded && oneGot23505 && exactlyOneOrder;
  console.log(`Overall: ${allPass ? "ALL TESTS PASSED" : "TESTS FAILED"}`);

  // Cleanup
  await cleanup(TEST_SESSION_ID);
  console.log("");
  console.log("Test data cleaned up.");

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
