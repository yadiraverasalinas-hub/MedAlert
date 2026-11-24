'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/ocr.js'), 'utf8'), context);
const { extractCandidates } = context.window.MedAlertOCR;

function read(front, back, review) {
  return extractCandidates([
    { side: 'front', label: 'Frente', text: front },
    { side: 'back', label: 'Reverso', text: back }
  ], review);
}

test('OCR reads inline and split label values and records their evidence', () => {
  const review = {};
  const result = read('Producto de prueba\n500 mg\nTabletas caja x 10',
    'LOTE N°: AB-32 | VTO.\n11 / 2027\nR.S.: EN-1245\nFABRICADO POR\nEmpresa de Prueba S.A.', review);
  assert.equal(result.name, 'Producto de prueba 500 mg');
  assert.equal(result.presentation, 'Tabletas caja x 10');
  assert.equal(result.lot, 'AB-32');
  assert.equal(result.expiry, '2027-11');
  assert.equal(result.registration, 'EN-1245');
  assert.equal(result.manufacturer, 'Empresa de Prueba S.A');
  assert.equal(review.expiry[0].source, 'LOTE N°: AB-32 | VTO. / 11 / 2027');
});

test('conflicting values stay blank while equivalent date formats are deduplicated', () => {
  const review = {};
  const result = read('LOTE: AB-21\nVTO: 2027-11-30', 'BATCH: AB-32\nEXP: 11/27', review);
  assert.equal(result.lot, '');
  assert.equal(review.lot.length, 2);
  assert.equal(result.expiry, '2027-11');
  assert.equal(review.expiry.length, 1);
});

test('missing values do not consume another label, manufacturing date or another photo', () => {
  const result = read('LOTE:', 'AB-32\nVTO: MFG 11/2025\nREG. SAN.\nFABRICANTE:');
  assert.equal(result.lot, '');
  assert.equal(result.expiry, '');
  assert.equal(result.registration, '');
  assert.equal(result.manufacturer, '');
});

test('impossible dates are not suggested', () => {
  for (const date of ['13/2027', '31/02/2027', '2027-11-31', '11/202']) {
    assert.equal(read('', 'F.V.: ' + date).expiry, '', date);
  }
  assert.equal(read('', 'CAD: 29/02/2028').expiry, '2028-02');
});
