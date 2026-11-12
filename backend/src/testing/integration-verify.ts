import { createApp } from '../app.js';

async function runVerification(): Promise<void> {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind ephemeral port');
  }
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // 1. Health Check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = (await healthRes.json()) as {
      success: boolean;
      data: { status: string; supabase: { connected: boolean; mode: string } };
    };
    if (healthRes.status !== 200 || !healthJson.success) {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }
    console.log(
      `[TC_01 PASS] GET /api/v1/health -> HTTP ${healthRes.status} | Supabase Mode: ${healthJson.data.supabase.mode}`,
    );

    // 2. List Seed Items
    const listRes = await fetch(`${baseUrl}/items`);
    const listJson = (await listRes.json()) as {
      success: boolean;
      data: { items: Array<{ id: string; title: string }> };
    };
    if (
      listRes.status !== 200 ||
      !listJson.success ||
      listJson.data.items.length < 1
    ) {
      throw new Error(`List items failed: ${JSON.stringify(listJson)}`);
    }
    console.log(
      `[TC_02 PASS] GET /api/v1/items -> HTTP ${listRes.status} | Total items: ${listJson.data.items.length}`,
    );

    // 3. Create New Item
    const createRes = await fetch(`${baseUrl}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-master-token',
      },
      body: JSON.stringify({
        title: 'Test Supabase PostgreSQL Write Operation',
        description: 'Automated verification from integration-verify.ts',
        category: 'SUPABASE',
        status: 'ACTIVE',
        priority: 'HIGH',
      }),
    });
    const createJson = (await createRes.json()) as {
      success: boolean;
      data: { item: { id: string; title: string; status: string } };
    };
    if (createRes.status !== 201 || !createJson.success) {
      throw new Error(`Create item failed: ${JSON.stringify(createJson)}`);
    }
    const createdId = createJson.data.item.id;
    console.log(
      `[TC_03 PASS] POST /api/v1/items -> HTTP ${createRes.status} | Created ID: ${createdId}`,
    );

    // 4. Patch Item Status
    const patchRes = await fetch(`${baseUrl}/items/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const patchJson = (await patchRes.json()) as {
      success: boolean;
      data: { item: { id: string; status: string } };
    };
    if (patchRes.status !== 200 || patchJson.data.item.status !== 'COMPLETED') {
      throw new Error(`Patch item failed: ${JSON.stringify(patchJson)}`);
    }
    console.log(
      `[TC_04 PASS] PATCH /api/v1/items/${createdId} -> HTTP ${patchRes.status} | Status: ${patchJson.data.item.status}`,
    );

    // 5. Delete Item
    const deleteRes = await fetch(`${baseUrl}/items/${createdId}`, {
      method: 'DELETE',
    });
    if (deleteRes.status !== 200) {
      throw new Error(`Delete item failed: HTTP ${deleteRes.status}`);
    }
    console.log(
      `[TC_05 PASS] DELETE /api/v1/items/${createdId} -> HTTP ${deleteRes.status}`,
    );

    // 6. Negative Validation Test
    const invalidRes = await fetch(`${baseUrl}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'A' }),
    });
    if (invalidRes.status !== 400) {
      throw new Error(
        `Expected HTTP 400 for invalid input, got ${invalidRes.status}`,
      );
    }
    console.log(
      `[TC_06 PASS] POST /api/v1/items (invalid payload) -> HTTP ${invalidRes.status} (Zod Validation Guard)`,
    );

    console.log('ALL BACKEND + SUPABASE INTEGRATION TESTS PASSED 100%!');
  } finally {
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
