'use strict';

window.MedAlertCatalog = (() => {
  const medicines = [
    { id: 'MED-001', name: 'Paracetamol Andino', activeIngredient: 'Paracetamol', strength: '500 mg', dosageForm: 'Tableta', presentation: 'Caja x 100 tabletas', manufacturer: 'Laboratorios Andinos Demo', registrationHolder: 'Andina Farma Demo S.A.C.', demoRegistration: 'DEMO-RS-0001', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-002', name: 'Paracetamol Andino Forte', activeIngredient: 'Paracetamol', strength: '1 g', dosageForm: 'Tableta', presentation: 'Caja x 50 tabletas', manufacturer: 'Laboratorios Andinos Demo', registrationHolder: 'Andina Farma Demo S.A.C.', demoRegistration: 'DEMO-RS-0002', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-003', name: 'Ibuprofeno Vital', activeIngredient: 'Ibuprofeno', strength: '400 mg', dosageForm: 'Tableta', presentation: 'Caja x 20 tabletas', manufacturer: 'BioSalud Ejemplo', registrationHolder: 'BioSalud Ejemplo S.A.C.', demoRegistration: 'DEMO-RS-0003', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-004', name: 'Ibuprofeno Vital Forte', activeIngredient: 'Ibuprofeno', strength: '600 mg', dosageForm: 'Tableta', presentation: 'Caja x 20 tabletas', manufacturer: 'BioSalud Ejemplo', registrationHolder: 'BioSalud Ejemplo S.A.C.', demoRegistration: 'DEMO-RS-0004', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-005', name: 'Amoxicilina FarmaPlus', activeIngredient: 'Amoxicilina', strength: '500 mg', dosageForm: 'Capsula', presentation: 'Caja x 21 capsulas', manufacturer: 'FarmaPlus Demo', registrationHolder: 'FarmaPlus Peru S.A.C.', demoRegistration: 'DEMO-RS-0005', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-006', name: 'Amoxicilina FarmaPlus Infantil', activeIngredient: 'Amoxicilina', strength: '250 mg/5 mL', dosageForm: 'Suspension oral', presentation: 'Frasco x 60 mL', manufacturer: 'FarmaPlus Demo', registrationHolder: 'FarmaPlus Peru S.A.C.', demoRegistration: 'DEMO-RS-0006', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-007', name: 'Loratadina Clarivida', activeIngredient: 'Loratadina', strength: '10 mg', dosageForm: 'Tableta', presentation: 'Caja x 10 tabletas', manufacturer: 'Clarivida Labs', registrationHolder: 'Clarivida Labs S.A.C.', demoRegistration: 'DEMO-RS-0007', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-008', name: 'Cetirizina Clarivida', activeIngredient: 'Cetirizina', strength: '10 mg', dosageForm: 'Tableta', presentation: 'Caja x 10 tabletas', manufacturer: 'Clarivida Labs', registrationHolder: 'Clarivida Labs S.A.C.', demoRegistration: 'DEMO-RS-0008', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-009', name: 'Omeprazol GastroMed', activeIngredient: 'Omeprazol', strength: '20 mg', dosageForm: 'Capsula gastrorresistente', presentation: 'Caja x 14 capsulas', manufacturer: 'GastroMed Demo', registrationHolder: 'GastroMed Peru S.A.C.', demoRegistration: 'DEMO-RS-0009', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-010', name: 'Omeprazol GastroMed Max', activeIngredient: 'Omeprazol', strength: '40 mg', dosageForm: 'Capsula gastrorresistente', presentation: 'Caja x 14 capsulas', manufacturer: 'GastroMed Demo', registrationHolder: 'GastroMed Peru S.A.C.', demoRegistration: 'DEMO-RS-0010', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-011', name: 'Metformina Diabecare', activeIngredient: 'Metformina', strength: '850 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Diabecare Labs', registrationHolder: 'Diabecare Peru S.A.C.', demoRegistration: 'DEMO-RS-0011', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-012', name: 'Metformina Diabecare XR', activeIngredient: 'Metformina', strength: '1000 mg', dosageForm: 'Tableta liberacion prolongada', presentation: 'Caja x 30 tabletas', manufacturer: 'Diabecare Labs', registrationHolder: 'Diabecare Peru S.A.C.', demoRegistration: 'DEMO-RS-0012', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-013', name: 'Azitromicina Bacterion', activeIngredient: 'Azitromicina', strength: '500 mg', dosageForm: 'Tableta', presentation: 'Caja x 3 tabletas', manufacturer: 'Bacterion Demo', registrationHolder: 'Bacterion Pharma S.A.C.', demoRegistration: 'DEMO-RS-0013', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-014', name: 'Azitromicina Bacterion Infantil', activeIngredient: 'Azitromicina', strength: '200 mg/5 mL', dosageForm: 'Suspension oral', presentation: 'Frasco x 15 mL', manufacturer: 'Bacterion Demo', registrationHolder: 'Bacterion Pharma S.A.C.', demoRegistration: 'DEMO-RS-0014', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-015', name: 'Losartan Cardiovida', activeIngredient: 'Losartan', strength: '50 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Cardiovida Labs', registrationHolder: 'Cardiovida Peru S.A.C.', demoRegistration: 'DEMO-RS-0015', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-016', name: 'Losartan Cardiovida Plus', activeIngredient: 'Losartan', strength: '100 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Cardiovida Labs', registrationHolder: 'Cardiovida Peru S.A.C.', demoRegistration: 'DEMO-RS-0016', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-017', name: 'Atorvastatina Lipocare', activeIngredient: 'Atorvastatina', strength: '20 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Lipocare Demo', registrationHolder: 'Lipocare Peru S.A.C.', demoRegistration: 'DEMO-RS-0017', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-018', name: 'Atorvastatina Lipocare Forte', activeIngredient: 'Atorvastatina', strength: '40 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Lipocare Demo', registrationHolder: 'Lipocare Peru S.A.C.', demoRegistration: 'DEMO-RS-0018', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-019', name: 'Diclofenaco Artiflex', activeIngredient: 'Diclofenaco sodico', strength: '50 mg', dosageForm: 'Tableta', presentation: 'Caja x 20 tabletas', manufacturer: 'Artiflex Labs', registrationHolder: 'Artiflex Peru S.A.C.', demoRegistration: 'DEMO-RS-0019', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-020', name: 'Diclofenaco Artiflex Gel', activeIngredient: 'Diclofenaco sodico', strength: '1 %', dosageForm: 'Gel topico', presentation: 'tubo x 30 g', manufacturer: 'Artiflex Labs', registrationHolder: 'Artiflex Peru S.A.C.', demoRegistration: 'DEMO-RS-0020', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-021', name: 'Prednisona Cortimed', activeIngredient: 'Prednisona', strength: '5 mg', dosageForm: 'Tableta', presentation: 'Caja x 20 tabletas', manufacturer: 'Cortimed Demo', registrationHolder: 'Cortimed Peru S.A.C.', demoRegistration: 'DEMO-RS-0021', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-022', name: 'Prednisona Cortimed Forte', activeIngredient: 'Prednisona', strength: '20 mg', dosageForm: 'Tableta', presentation: 'Caja x 20 tabletas', manufacturer: 'Cortimed Demo', registrationHolder: 'Cortimed Peru S.A.C.', demoRegistration: 'DEMO-RS-0022', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-023', name: 'Fluconazol Micofin', activeIngredient: 'Fluconazol', strength: '150 mg', dosageForm: 'Capsula', presentation: 'Caja x 1 capsula', manufacturer: 'Micofin Labs', registrationHolder: 'Micofin Peru S.A.C.', demoRegistration: 'DEMO-RS-0023', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-024', name: 'Salbutamol Respivida', activeIngredient: 'Salbutamol', strength: '100 mcg/dosis', dosageForm: 'Inhalador', presentation: 'Envase x 200 dosis', manufacturer: 'Respivida Demo', registrationHolder: 'Respivida Peru S.A.C.', demoRegistration: 'DEMO-RS-0024', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-025', name: 'Enalapril Cardiovida', activeIngredient: 'Enalapril', strength: '10 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Cardiovida Labs', registrationHolder: 'Cardiovida Peru S.A.C.', demoRegistration: 'DEMO-RS-0025', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-026', name: 'Enalapril Cardiovida Forte', activeIngredient: 'Enalapril', strength: '20 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'Cardiovida Labs', registrationHolder: 'Cardiovida Peru S.A.C.', demoRegistration: 'DEMO-RS-0026', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-027', name: 'Ciprofloxacino Bacterion', activeIngredient: 'Ciprofloxacino', strength: '500 mg', dosageForm: 'Tableta', presentation: 'Caja x 10 tabletas', manufacturer: 'Bacterion Demo', registrationHolder: 'Bacterion Pharma S.A.C.', demoRegistration: 'DEMO-RS-0027', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-028', name: 'Aciclovir Viracare', activeIngredient: 'Aciclovir', strength: '400 mg', dosageForm: 'Tableta', presentation: 'Caja x 35 tabletas', manufacturer: 'Viracare Labs', registrationHolder: 'Viracare Peru S.A.C.', demoRegistration: 'DEMO-RS-0028', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-029', name: 'Vitamina C NutriVida', activeIngredient: 'Acido ascorbico', strength: '500 mg', dosageForm: 'Tableta', presentation: 'Caja x 30 tabletas', manufacturer: 'NutriVida Demo', registrationHolder: 'NutriVida Peru S.A.C.', demoRegistration: 'DEMO-RS-0029', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' },
    { id: 'MED-030', name: 'Vitamina C NutriVida Plus', activeIngredient: 'Acido ascorbico', strength: '1000 mg', dosageForm: 'Tableta efervescente', presentation: 'Tubo x 10 tabletas', manufacturer: 'NutriVida Demo', registrationHolder: 'NutriVida Peru S.A.C.', demoRegistration: 'DEMO-RS-0030', registrationState: 'REGISTRO_FICTICIO', country: 'Peru', source: 'CATALOGO_DEMO' }
  ];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[μµ]/g, 'u')
      .toLocaleLowerCase('es')
      .replace(/[^a-z0-9%]+/g, ' ')
      .trim();
  }

  function editSimilarity(left, right) {
    if (left === right) return 1;
    if (!left || !right) return 0;
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row++) {
      const current = [row];
      for (let column = 1; column <= right.length; column++) {
        const cost = left[row - 1] === right[column - 1] ? 0 : 1;
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + cost
        );
      }
      previous = current;
    }
    return 1 - previous[right.length] / Math.max(left.length, right.length);
  }

  function textSimilarity(leftValue, rightValue) {
    const left = normalize(leftValue);
    const right = normalize(rightValue);
    if (!left || !right) return 0;
    if (left === right) return 1;
    const leftTokens = new Set(left.split(' '));
    const rightTokens = new Set(right.split(' '));
    let overlap = 0;
    for (const token of leftTokens) if (rightTokens.has(token)) overlap++;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    const containment = overlap / Math.min(leftTokens.size, rightTokens.size);
    return Math.max(
      editSimilarity(left, right),
      overlap / union,
      containment * 0.93
    );
  }

  function extractStrength(value) {
    const match = String(value || '').match(/\b\d+(?:[.,]\d+)?\s*(?:mcg|μg|µg|ug|mg|g|ml|mL|%)(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mcg|μg|µg|ug|mg|g|ml|mL|%)?)?(?:\s*\/?\s*dosis)?/i);
    return match ? match[0] : '';
  }

  function normalizeStrength(value) {
    const compact = normalize(value).replace(/\s/g, '').replace(',', '.');
    const match = compact.match(/^(\d+(?:\.\d+)?)(mcg|ug|mg|g|ml|%)(?:\/(\d+(?:\.\d+)?)(mcg|ug|mg|g|ml|%)?)?(?:\/?(dosis))?$/);
    if (!match) return compact;
    let amount = Number(match[1]);
    let unit = match[2];
    if (unit === 'g') {
      amount *= 1000;
      unit = 'mg';
    } else if (unit === 'ug') {
      unit = 'mcg';
    }
    const denominatorUnit = match[4] === 'ug' ? 'mcg' : match[4];
    const denominator = match[3] ? `/${match[3]}${denominatorUnit || ''}` : '';
    const dose = match[5] ? '/dose' : '';
    return `${Number(amount.toFixed(5))}${unit}${denominator}${dose}`;
  }

  function withoutStrength(value) {
    return normalize(String(value || '').replace(/\b\d+(?:[.,]\d+)?\s*(?:mcg|μg|µg|ug|mg|g|ml|mL|%)(?:\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mcg|μg|µg|ug|mg|g|ml|mL|%)?)?(?:\s*\/?\s*dosis)?/gi, ' '));
  }

  function compareRecord(query, medicine) {
    const name = query.name || query.product || '';
    const nameWithoutStrength = withoutStrength(name);
    const nameScore = Math.max(
      textSimilarity(name, medicine.name),
      textSimilarity(nameWithoutStrength, medicine.name),
      textSimilarity(nameWithoutStrength, medicine.activeIngredient),
      textSimilarity(name, medicine.activeIngredient)
    );
    const strength = query.concentration || extractStrength(name);
    const strengthScore = strength
      ? Number(normalizeStrength(strength) === normalizeStrength(medicine.strength))
      : null;
    const presentationScore = query.presentation
      ? textSimilarity(query.presentation, `${medicine.dosageForm} ${medicine.presentation}`)
      : null;
    const manufacturerScore = query.manufacturer
      ? Math.max(
        textSimilarity(query.manufacturer, medicine.manufacturer),
        textSimilarity(query.manufacturer, medicine.registrationHolder)
      )
      : null;
    const registrationScore = query.registration
      ? textSimilarity(query.registration, medicine.demoRegistration)
      : null;
    const factors = [
      [name ? nameScore : null, 0.5],
      [strengthScore, 0.2],
      [presentationScore, 0.15],
      [manufacturerScore, 0.1],
      [registrationScore, 0.05]
    ].filter(([score]) => score !== null);
    const score = factors.reduce((sum, [factor, weight]) => sum + factor * weight, 0)
      / factors.reduce((sum, [, weight]) => sum + weight, 0);
    return { medicine, score, nameScore, strengthScore, presentationScore, manufacturerScore, registrationScore };
  }

  function findMatches(candidates = {}) {
    const query = {
      name: candidates.name || candidates.product || '',
      presentation: candidates.presentation || '',
      manufacturer: candidates.manufacturer || '',
      registration: candidates.registration || '',
      concentration: candidates.concentration || ''
    };
    if (![query.name, query.presentation, query.manufacturer, query.registration, query.concentration].some(Boolean)) return [];
    return medicines.map(medicine => compareRecord(query, medicine))
      .filter(match => match.score >= 0.3 && (
        match.nameScore >= 0.5
        || (match.presentationScore !== null && match.presentationScore >= (query.name ? 0.78 : 0.6))
        || (match.registrationScore !== null && match.registrationScore >= 0.8)
        || (!query.name && match.manufacturerScore !== null && match.manufacturerScore >= 0.7)
      ))
      .map(match => ({
        ...match,
        reason: match.nameScore >= 0.5
          ? 'Nombre o principio activo parecido'
          : match.presentationScore !== null && match.presentationScore >= (query.name ? 0.78 : 0.6)
            ? 'Solo presentación parecida; el nombre puede ser distinto'
            : match.manufacturerScore !== null && match.manufacturerScore >= 0.7
              ? 'Fabricante parecido; el nombre puede ser distinto'
            : 'Registro demo parecido'
      }))
      .sort((left, right) => right.score - left.score || right.nameScore - left.nameScore || left.medicine.id.localeCompare(right.medicine.id))
      .slice(0, 3);
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function compareStatus(label, queryValue, recordValue, similarity, threshold = 0.7) {
    if (!queryValue) return `${label}: sin dato para comparar`;
    return `${label}: ${similarity >= threshold ? 'parecido en texto' : 'diferente'} (${queryValue} / ${recordValue})`;
  }

  function renderComparison(candidates = {}) {
    const matches = findMatches(candidates);
    if (!matches.length && ![candidates.name, candidates.product, candidates.presentation, candidates.manufacturer, candidates.registration, candidates.concentration].some(Boolean)) return null;
    const section = createElement('section', 'catalog-match');
    section.setAttribute('aria-label', 'Comparación con catálogo de demostración');
    section.append(
      createElement('h2', '', `Coincidencias de similitud · ${medicines.length} registros demo`),
      createElement('p', 'catalog-match-disclaimer', 'Catálogo local ficticio (Perú). El puntaje solo estima similitud textual; no confirma identidad, autorización ni seguridad, y no reemplaza una consulta oficial.')
    );
    if (!matches.length) {
      section.append(createElement('p', 'catalog-match-empty', 'No se encontró un candidato parecido dentro de este catálogo de demostración. Esto no significa que el producto sea falso o inseguro; puede no estar incluido o la lectura puede ser incompleta.'));
      return section;
    }
    const name = candidates.name || candidates.product || '';
    const queryStrength = candidates.concentration || extractStrength(name);
    const concentrationConflicts = matches.some(match => match.nameScore >= 0.5 && match.strengthScore === 0);
    if (concentrationConflicts && queryStrength) {
      section.append(createElement('p', 'catalog-match-alert', 'Algunos nombres o principios activos son parecidos, pero tienen otra concentración. No son equivalentes: verifica el envase y no elijas un producto solo por similitud.'));
    }
    const list = createElement('div', 'catalog-match-list');
    for (const match of matches) {
      const { medicine } = match;
      const article = createElement('article', 'catalog-match-item');
      const heading = createElement('div', 'catalog-match-heading');
      heading.append(
        createElement('h3', '', `${medicine.id} · ${medicine.name}`),
        createElement('span', 'catalog-match-score', `Similitud estimada: ${Math.round(match.score * 100)}%`)
      );
      article.append(
        heading,
        createElement('p', 'catalog-match-reason', `Motivo: ${match.reason}.`),
        createElement('p', '', `Principio activo: ${medicine.activeIngredient} · Concentración: ${medicine.strength}`),
        createElement('p', '', `Forma: ${medicine.dosageForm} · Presentación: ${medicine.presentation}`),
        createElement('p', '', `Fabricante: ${medicine.manufacturer} · Titular: ${medicine.registrationHolder}`),
        createElement('p', 'catalog-match-meta', `Registro demo: ${medicine.demoRegistration} · ${medicine.registrationState} · ${medicine.country} · ${medicine.source}`)
      );
      const checks = createElement('ul', 'catalog-match-checks');
      checks.append(
        createElement('li', '', `Nombre/principio activo: ${match.nameScore >= 0.72 ? 'parecido en texto' : match.nameScore >= 0.5 ? 'similitud parcial' : 'no coincide en texto'}`),
        createElement('li', '', compareStatus('Concentración', queryStrength, medicine.strength, match.strengthScore || 0, 1)),
        createElement('li', '', compareStatus('Presentación', candidates.presentation, `${medicine.dosageForm} ${medicine.presentation}`, match.presentationScore || 0)),
        createElement('li', '', compareStatus('Fabricante', candidates.manufacturer, medicine.manufacturer, match.manufacturerScore || 0)),
        createElement('li', '', compareStatus('Registro demo', candidates.registration, medicine.demoRegistration, match.registrationScore || 0, 0.8))
      );
      article.append(checks);
      list.append(article);
    }
    section.append(list);
    section.append(createElement('p', 'catalog-match-footnote', 'El catálogo no contiene lotes ni vencimientos. No uses estos resultados para confirmar un medicamento o sustituir una revisión profesional.'));
    return section;
  }

  return { size: medicines.length, findMatches, renderComparison };
})();
