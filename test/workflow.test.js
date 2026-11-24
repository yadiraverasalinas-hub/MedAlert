'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../js/web-app.js'), 'utf8');

function loadWorkflow(record, history = []) {
  let stored = JSON.stringify({ records: [record], actionHistory: history });
  let rejectWrites = false;
  const feedback = {};
  const context = vm.createContext({
    window: {},
    document: { querySelector: () => feedback },
    localStorage: {
      getItem: () => stored,
      setItem: (_, value) => {
        if (rejectWrites) throw new Error('Cuota agotada');
        stored = value;
      }
    },
    structuredClone,
    setTimeout: () => 1,
    clearTimeout: () => {}
  });
  const workflow = vm.runInContext(source.replace(
    'return { render, leave, icon };',
    'return { record: records[0], actionHistory, inventoryBlockers, isHeld, isExpired, recordNeedsReview, saveChange, logAction };'
  ) + '\nwindow.MedAlertWeb;', context);
  return {
    ...workflow,
    failWrites: () => { rejectWrites = true; },
    saved: () => JSON.parse(stored)
  };
}

function verifiedRecord(overrides = {}) {
  return {
    id: 'record-1',
    status: 'Verificado local',
    product: 'Producto de prueba',
    lot: 'L01',
    presentation: 'Caja x 10',
    expiry: '12/2099',
    ...overrides
  };
}

test('inventory excludes expired, damaged, quarantined and mismatched records', () => {
  const valid = loadWorkflow(verifiedRecord());
  assert.equal(valid.recordNeedsReview(valid.record), false);

  for (const changes of [
    { expiry: '01/2000' },
    { expiry: '13/2099' },
    { inspection: ['Sello alterado'] },
    { status: 'En cuarentena' },
    { document: { presentation: 'Caja x 20' } },
    { checks: [] }
  ]) {
    const { record, recordNeedsReview } = loadWorkflow(verifiedRecord(changes));
    assert.equal(recordNeedsReview(record), true, JSON.stringify(changes));
  }

  const lastDay = new Date(2026, 10, 30, 23, 59);
  assert.equal(valid.isExpired('11/2026', lastDay), false);
  assert.equal(valid.isExpired('11/2026', new Date(2026, 11, 1)), true);
});

test('an older contrast that overwrote a quarantine is recovered from history', () => {
  const quarantine = { recordId: 'record-1', action: 'Enviado a cuarentena', reason: 'Sello alterado' };
  const release = { recordId: 'record-1', action: 'Bulto liberado', reason: 'Revisión completada' };
  const held = loadWorkflow(verifiedRecord(), [quarantine]);
  assert.equal(held.isHeld(held.record), true);
  assert.equal(held.record.quarantineReason, quarantine.reason);
  const released = loadWorkflow(verifiedRecord(), [release, quarantine]);
  assert.equal(released.isHeld(released.record), false);
});

test('a write failure rolls back both the edited record and its history', () => {
  const workflow = loadWorkflow(verifiedRecord());
  workflow.failWrites();
  assert.equal(workflow.saveChange(() => {
    workflow.record.document.lot = 'L02';
    workflow.record.status = 'En revisión';
    workflow.logAction(workflow.record, 'Datos de guía modificados', 'Repetir contraste');
  }), false);
  assert.equal(workflow.record.document.lot, 'L01');
  assert.equal(workflow.record.status, 'Verificado local');
  assert.equal(workflow.actionHistory.length, 0);
  assert.equal(workflow.saved().records[0].status, 'Verificado local');
});

test('the web entry point renders the main menu before any workflow screen', () => {
  const renderCalls = [];
  const nodes = new Map();
  const document = {
    documentElement: { dataset: { edition: 'web' } },
    querySelector(selector) {
      if (!nodes.has(selector)) {
        nodes.set(selector, {
          append() {}, setAttribute() {}, addEventListener() {},
          replaceChildren() {}, scrollTo() {}
        });
      }
      return nodes.get(selector);
    },
    querySelectorAll: () => [],
    createElement: () => ({ append() {} })
  };
  const main = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
  vm.runInNewContext(main, {
    document,
    window: {
      MedAlertDesign: {
        pages: [
          { kind: 'web', id: '2:5027', name: 'Menú principal' },
          { kind: 'web', id: '37:292', name: 'Checklist' },
          { kind: 'web', id: '37:435', name: 'Contraste' }
        ]
      },
      MedAlertWeb: { render: id => renderCalls.push(id) }
    },
    localStorage: { getItem: () => null },
    Option: class {},
    ResizeObserver: class { observe() {} },
    matchMedia: () => ({ matches: false })
  });
  assert.deepEqual(renderCalls, ['2:5027']);
});
