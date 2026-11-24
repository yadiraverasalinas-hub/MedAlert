'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createServer } = require('../server.js');

async function withServer(server, callback) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('health endpoint reports configuration without exposing credentials', async () => {
  const server = createServer({ env: { GEMINI_API_KEY: 'test-only-secret' } });
  await withServer(server, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { configured: true });
  });
});

test('static server serves the app but not dotfiles or backend source', async () => {
  const server = createServer({ env: {} });
  await withServer(server, async baseUrl => {
    const app = await fetch(`${baseUrl}/`);
    assert.equal(app.status, 200);
    const html = await app.text();
    assert.match(html, /MedAlert/);
    const iconPath = /rel="icon"[^>]*href="([^"]+)"/.exec(html)?.[1];
    assert.ok(iconPath);
    const icon = await fetch(new URL(iconPath, baseUrl));
    assert.equal(icon.status, 200);
    assert.equal(icon.headers.get('content-type'), 'image/x-icon');
    const iconBytes = Buffer.from(await icon.arrayBuffer());
    assert.equal(iconBytes.readUInt16LE(2), 1);
    assert.equal(iconBytes.readUInt16LE(4), 3);

    for (const pathname of ['/.env', '/.env.example', '/server.js']) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, 404);
    }
  });
});

test('medicine analysis compares OCR and demo-catalog differences using a mocked Gemini response', async () => {
  let upstreamRequest;
  const server = createServer({
    env: { GEMINI_API_KEY: 'test-only-secret', GEMINI_MODEL: 'gemini-test' },
    fetchImpl: async (url, options) => {
      upstreamRequest = { url: String(url), options };
      return new Response(JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                summary: 'Se encontró una diferencia textual.',
                catalogObservations: [{
                  candidate: 'Paracetamol Demo',
                  explanation: 'La concentración del candidato no coincide con la transcripción.'
                }],
                inconsistencies: [{ field: 'concentración', detail: 'Aparecen dos valores.', evidence: '500 mg / 1 g' }],
                uncertainties: []
              })
            }]
          }
        }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  });

  await withServer(server, async baseUrl => {
    const empty = await fetch(`${baseUrl}/api/analyze-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: '  ' })
    });
    assert.equal(empty.status, 400);

    const photos = await fetch(`${baseUrl}/api/analyze-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'Texto OCR de prueba.', images: [] })
    });
    assert.equal(photos.status, 400);

    const transcript = 'Frente: paracetamol 500 mg. Reverso: concentración 1 g.';
    const catalogDifferences = [{
      candidate: 'Paracetamol Demo',
      activeIngredient: 'Paracetamol',
      strength: '1 g',
      presentation: 'Caja x 50 tabletas',
      reason: 'Nombre o principio activo parecido',
      similarityPercent: 81,
      comparisons: [{
        field: 'Concentración',
        ocr: '500 mg',
        catalog: '1 g',
        similarityPercent: 0
      }]
    }];
    const response = await fetch(`${baseUrl}/api/analyze-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, catalogDifferences })
    });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).analysis, {
      summary: 'Se encontró una diferencia textual.',
      catalogObservations: [{
        candidate: 'Paracetamol Demo',
        explanation: 'La concentración del candidato no coincide con la transcripción.'
      }],
      inconsistencies: [{ field: 'concentración', detail: 'Aparecen dos valores.', evidence: '500 mg / 1 g' }],
      uncertainties: []
    });
  });

  assert.match(upstreamRequest.url, /models\/gemini-test:generateContent$/);
  assert.equal(upstreamRequest.options.headers['x-goog-api-key'], 'test-only-secret');
  assert.equal(new URL(upstreamRequest.url).search, '');
  const body = JSON.parse(upstreamRequest.options.body);
  assert.match(body.contents[0].parts[0].text, /paracetamol 500 mg/);
  assert.match(body.contents[0].parts[0].text, /Paracetamol Demo/);
  assert.equal(body.contents[0].parts.length, 1);
});

test('missing key returns a setup error without making an upstream request', async () => {
  let upstreamCalled = false;
  const server = createServer({
    env: {},
    fetchImpl: async () => {
      upstreamCalled = true;
      throw new Error('Must not call upstream');
    }
  });

  await withServer(server, async baseUrl => {
    const response = await fetch(`${baseUrl}/api/analyze-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'Texto OCR de prueba.' })
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /no está configurado/);
  });
  assert.equal(upstreamCalled, false);
});

test('Gemini has a per-instance request budget', async () => {
  let forwarded = 0;
  const server = createServer({
    env: { GEMINI_API_KEY: 'test-only-secret' },
    fetchImpl: async () => {
      forwarded++;
      return { ok: true, json: async () => ({ candidates: [] }) };
    }
  });
  await withServer(server, async baseUrl => {
    const send = () => fetch(`${baseUrl}/api/analyze-medicine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'Texto de prueba' })
    });
    for (let index = 0; index < 10; index++) {
      const response = await send();
      assert.equal(response.status, 502);
      await response.json();
    }
    const limited = await send();
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    assert.equal(forwarded, 10);
  });
});
