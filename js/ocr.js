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

  function firstCapture(pattern, text) {
    for (const line of linesOf(text)) {
      const match = pattern.exec(line);
      if (match?.[1]) return match[1].trim().replace(/[.,;:]+$/, '');
    }
    return '';
  }

  function normalizeExpiry(value) {
    const parts = value.split(/[/. -]/).filter(Boolean).map(Number);
    let month;
    let year;
    if (parts.length === 2) {
      if (parts[0] > 999) [year, month] = parts;
      else [month, year] = parts;
    } else if (parts.length === 3) {
      month = parts[1];
      year = parts[2];
    }
    if (year < 100) year += 2000;
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200) return '';
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  function extractCandidates(results) {
    const front = results.find(result => result.side === 'front')?.text || '';
    const back = results.find(result => result.side === 'back')?.text || '';
    const allText = `${front}\n${back}`;
    const frontLines = linesOf(front);
    const dosePattern = /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|μg|g|ml|mL|ui|iu|%)\b/i;
    const doseIndex = frontLines.findIndex(line => dosePattern.test(line));
    let name = doseIndex >= 0 ? frontLines[doseIndex] : frontLines[0] || '';
    if (doseIndex > 0 && frontLines[doseIndex].replace(dosePattern, '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '').length < 3) {
      name = `${frontLines[doseIndex - 1]} ${frontLines[doseIndex]}`;
    }
    const presentation = firstCapture(/\b((?:tabletas?|comprimidos?|c[aá]psulas?|jarabe|soluci[oó]n|suspensi[oó]n|inyectable|ampollas?|gotas|crema|gel|ung[uü]ento|polvo|granulado|spray|parche)\b.*)$/i, front)
      || frontLines.find(line => /\bcaja\s*(?:x|de)\s*\d+/i.test(line))
      || '';
    const manufacturer = firstCapture(/(?:fabricante|fabricado\s+por|elaborado\s+por|manufactured\s+by|manufacturer|laboratorio|titular(?:\s+del?\s+registro\s+sanitario)?)\s*[:\-]?\s*(.+)$/i, back);
    const lot = firstCapture(/(?:lote|lot|batch)\s*(?:(?:n(?:ro|o)?|n[º°])\.?\s*)?[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]{2,})/i, allText);
    const expiryText = firstCapture(/(?:venc(?:imiento)?|caducidad|vence|exp(?:iry)?)\s*(?:fecha)?\s*[:#\-]?\s*(\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}|\d{1,2}[/. -]\d{2,4}|\d{4}[/. -]\d{1,2})/i, allText);
    const registration = firstCapture(/(?:registro\s+sanitario|reg\.?\s*san\.?|r\.?\s*s\.?)\s*(?:(?:n(?:ro|o)?|n[º°])\.?\s*)?[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]{3,})/i, allText);

    return {
      name: name.slice(0, 120),
      presentation: presentation.slice(0, 120),
      manufacturer: manufacturer.slice(0, 120),
      lot: lot.slice(0, 80),
      expiry: expiryText ? normalizeExpiry(expiryText) : '',
      registration: registration.slice(0, 100)
    };
  }

  return { recognizeImages, extractCandidates };
})();
