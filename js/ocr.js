'use strict';

window.MedAlertOCR = (() => {
  const libraryUrl = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
  const workerOptions = {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0'
  };
  let libraryPromise;

  function loadLibrary() {
    if (window.Tesseract?.createWorker) return Promise.resolve();
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = libraryUrl;
      script.async = true;
      script.onload = () => {
        if (window.Tesseract?.createWorker) resolve();
        else reject(new Error('Tesseract.js se cargó sin inicializarse correctamente.'));
      };
      script.onerror = () => reject(new Error('No se pudo cargar Tesseract.js. Revisa tu conexión e inténtalo de nuevo.'));
      document.head.append(script);
    }).catch(error => {
      libraryPromise = null;
      throw error;
    });
    return libraryPromise;
  }

  async function recognizeImages(images, onProgress = () => {}) {
    if (!images.length || images.some(image => !image.file)) {
      throw new Error('Selecciona al menos una foto del empaque.');
    }

    let worker;
    let activeLabel = 'Preparación';
    try {
      await loadLibrary();
      worker = await window.Tesseract.createWorker('spa+eng', 1, {
        ...workerOptions,
        logger: message => onProgress({
          label: activeLabel,
          status: message.status,
          progress: Number.isFinite(message.progress) ? message.progress : 0
        })
      });
      const results = [];
      for (const image of images) {
        activeLabel = image.label;
        onProgress({ label: activeLabel, status: 'recognizing text', progress: 0 });
        const { data } = await worker.recognize(image.file);
        results.push({
          side: image.side,
          label: image.label,
          text: data.text.trim(),
          confidence: Number.isFinite(data.confidence) ? Math.round(data.confidence) : null
        });
      }
      return results;
    } finally {
      if (worker) await worker.terminate();
    }
  }

  function linesOf(text) {
    return text.split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim())
      .filter(line => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(line));
  }

  const labels = [
    ['manufacturer', /fabricado\s+por|elaborado\s+por|manufactured\s+by|manufacturer|fabricante|laboratorio|lab\./i],
    ['lot', /lote|lot|batch/i],
    ['expiry', /fecha\s+de\s+(?:vencimiento|caducidad)|vencimiento|venc|vence|vto|caducidad|cad|f\s*\.\s*v|exp(?:iry|iration)?/i],
    ['registration', /registro\s+sanitario|reg\.?\s*san(?:itario)?\.?|r\s*\.\s*s\.?|rs(?=\s*[:#])/i],
    ['ignored', /fecha\s+de\s+(?:fabricaci[oó]n|elaboraci[oó]n|producci[oó]n)|fabricaci[oó]n|elaboraci[oó]n|mfg|titular(?:\s+del\s+registro\s+sanitario)?/i]
  ];
  const labelPattern = new RegExp(
    '(?:^|[\\s;|])(?:' + labels.map(([key, pattern]) => '(?<' + key + '>' + pattern.source + ')').join('|') + ')' +
    '(?=$|[\\s.:#–—-])\\.?',
    'gi'
  );
  const codePattern = /^[A-Z0-9][A-Z0-9./-]*$/i;

  function normalizeExpiry(value) {
    const numeric = value.replace(/\s*([./-])\s*/g, '$1');
    const iso = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/.exec(numeric);
    const local = /^(?:(\d{1,2})[./ -])?(\d{1,2})[./ -](\d{2}|\d{4})$/.exec(numeric);
    if (!iso && !local) return '';
    const [, yearText, monthText, dayText] = iso || [null, local[3], local[2], local[1]];
    const year = Number(yearText) + (yearText.length === 2 ? 2000 : 0);
    const month = Number(monthText);
    if (year < 2000 || year > 2200 || month < 1 || month > 12) return '';
    if (dayText && (+dayText < 1 || +dayText > new Date(Date.UTC(year, month, 0)).getUTCDate())) return '';
    return String(year) + '-' + String(month).padStart(2, '0');
  }

  function readField(key, rawValue) {
    const value = rawValue.trim().replace(/[.,;:|]+$/, '').trim();
    if (key === 'expiry') return normalizeExpiry(value);
    if (key === 'manufacturer') return /\p{L}/u.test(value) ? value.slice(0, 120) : '';
    if (key === 'lot' && value.length >= 2 && value.length <= 80 && codePattern.test(value)) return value;
    if (key === 'registration' && value.length >= 4 && value.length <= 100 && codePattern.test(value)
      && /\d/.test(value)) return value;
    return '';
  }

  function collectFields(results) {
    const found = { manufacturer: new Map(), lot: new Map(), expiry: new Map(), registration: new Map() };
    for (const result of results) {
      const lines = linesOf(result.text || '');
      lines.forEach((line, index) => {
        const matches = [...line.matchAll(labelPattern)];
        matches.forEach((match, matchIndex) => {
          const key = Object.keys(match.groups).find(name => match.groups[name]);
          if (key === 'ignored') return;
          const nextMatch = matches[matchIndex + 1];
          const inline = line.slice(match.index + match[0].length, nextMatch?.index)
            .replace(/^\s*(?:(?:nro|num|n[.º°o])\.?\s*(?=[:#\s\d]))?[:#–—-]?\s*/i, '');
          const nextLine = lines[index + 1] || '';
          const useNextLine = !inline && !nextMatch && ![...nextLine.matchAll(labelPattern)].length;
          const value = readField(key, useNextLine ? nextLine : inline);
          if (value && !(key === 'lot' && useNextLine && !/\d/.test(value))) {
            found[key].set(value.toLocaleLowerCase('es'), {
              value, label: result.label, source: useNextLine ? line + ' / ' + nextLine : line
            });
          }
        });
      });
    }
    return found;
  }

  function extractCandidates(results, review = {}) {
    const front = results.find(result => result.side === 'front')?.text || '';
    const frontLines = linesOf(front).filter(line => ![...line.matchAll(labelPattern)].some(match => match.index === 0));
    const dosePattern = /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|μg|g|ml|mL|ui|iu|%)\b/i;
    const doseIndex = frontLines.findIndex(line => dosePattern.test(line));
    let name = doseIndex >= 0 ? frontLines[doseIndex] : frontLines[0] || '';
    if (doseIndex > 0 && frontLines[doseIndex].replace(dosePattern, '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length < 3) {
      name = `${frontLines[doseIndex - 1]} ${frontLines[doseIndex]}`;
    }
    const presentationPattern = /\b((?:tabletas?|comprimidos?|c[aá]psulas?|jarabe|soluci[oó]n|suspensi[oó]n|inyectable|ampollas?|gotas|crema|gel|ung[uü]ento|polvo|granulado|spray|parche)\b.*)$/i;
    const presentationLine = frontLines.find(line => presentationPattern.test(line));
    const presentation = presentationPattern.exec(presentationLine || '')?.[1]
      || frontLines.find(line => /\bcaja\s*(?:x|de)\s*\d+/i.test(line))
      || '';
    const candidates = {
      name: name.slice(0, 120),
      presentation: presentation.slice(0, 120)
    };
    const frontLabel = results.find(result => result.side === 'front')?.label;
    for (const key of ['name', 'presentation']) {
      review[key] = candidates[key] ? [{ label: frontLabel, source: candidates[key] }] : [];
    }
    for (const [key, matches] of Object.entries(collectFields(results))) {
      review[key] = [...matches.values()];
      candidates[key] = matches.size === 1 ? review[key][0].value : '';
    }
    return candidates;
  }

  function renderFieldEvidence(review) {
    const labels = { name: 'Nombre y concentración', presentation: 'Presentación', manufacturer: 'Fabricante', lot: 'Lote', expiry: 'Vencimiento', registration: 'Registro sanitario' };
    const entries = Object.entries(review).filter(([, matches]) => matches.length);
    if (!entries.length) return null;
    const section = document.createElement('details');
    section.className = 'ocr-transcript';
    const summary = document.createElement('summary');
    summary.textContent = 'Evidencia OCR de los campos';
    section.append(summary);
    const list = document.createElement('ul');
    for (const [key, matches] of entries) {
      const item = document.createElement('li');
      const sources = matches.map(match => [match.label, match.source].filter(Boolean).join(' · '));
      const message = matches.length > 1 ? ' · valores en conflicto, revisa el empaque' : '';
      item.textContent = labels[key] + message + ' — ' + sources.join(' | ');
      list.append(item);
    }
    section.append(list);
    return section;
  }

  return { recognizeImages, extractCandidates, renderFieldEvidence };
})();
