import assert from "node:assert/strict";
import test from "node:test";

import type { CacheStore } from "../src/common/cache/cache-store.js";
import { setCacheStoreForTests } from "../src/common/cache/index.js";
import {
  clearCheckoutIpBan,
  isCheckoutIpTemporarilyBanned,
  registerCheckoutDecline
} from "../src/modules/billing/service.js";
import { createTestApiConfig } from "./test-config.js";

class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, { expiresAt: number; value: string }>();

  del(...keys: string[]): Promise<number> {
    let deleted = 0;

    for (const key of keys) {
      if (this.entries.delete(key)) {
        deleted += 1;
      }
    }

    return Promise.resolve(deleted);
  }

  get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      return Promise.resolve(null);
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return Promise.resolve(null);
    }

    return Promise.resolve(entry.value);
  }

  set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      expiresAt: Date.now() + ttlSeconds * 1000,
      value
    });
    return Promise.resolve();
  }
}

void test("checkout IP ban activates after repeated declines and can be cleared", async () => {
  const store = new MemoryCacheStore();
  setCacheStoreForTests(store);

  try {
    const config = createTestApiConfig();
    const ipAddress = "203.0.113.9";

    for (let attempt = 0; attempt < config.STRIPE_DECLINE_BAN_THRESHOLD; attempt += 1) {
      await registerCheckoutDecline({
        config,
        ipAddress
      });
    }

    assert.equal(await isCheckoutIpTemporarilyBanned(ipAddress), true);

    await clearCheckoutIpBan(ipAddress);

    assert.equal(await isCheckoutIpTemporarilyBanned(ipAddress), false);
  } finally {
    setCacheStoreForTests(null);
  }
});
