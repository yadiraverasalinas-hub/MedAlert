'use strict';

window.MedAlertGemini = (() => {
  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function analyzeTranscript(transcript, catalogDifferences) {
    if (window.location.protocol === 'file:') {
      throw new Error('Inicia el servidor local con node --env-file=.env server.js y abre http://127.0.0.1:4173.');
    }

    let response;
    try {
      response = await fetch('/api/analyze-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, catalogDifferences })
      });
    } catch {
      throw new Error('No se pudo conectar con la API local. Inicia el servidor Node y vuelve a intentarlo.');
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error('La API no respondió en este sitio. GitHub Pages necesita un backend aparte.');
    }
    if (!response.ok) throw new Error(payload.error || `La API respondió con HTTP ${response.status}.`);
    if (!payload.analysis || typeof payload.analysis.summary !== 'string') {
      throw new Error('La API devolvió un resultado incompleto.');
    }
    return payload.analysis;
  }

  function renderAnalysis(result, container) {
    container.replaceChildren();
    container.append(createElement('h4', '', 'Resultado orientativo de Gemini'));
    container.append(createElement('p', '', result.summary));

    const catalogObservations = Array.isArray(result.catalogObservations) ? result.catalogObservations : [];
    if (catalogObservations.length) {
      container.append(createElement('h5', '', 'Explicación de los candidatos del catálogo demo'));
      const list = createElement('ul', 'gemini-findings');
      for (const item of catalogObservations) {
        const entry = createElement('li');
        entry.append(
          createElement('strong', '', item.candidate || 'Candidato demo'),
          createElement('span', '', item.explanation || 'Revisa las diferencias en el envase.')
        );
        list.append(entry);
      }
      container.append(list);
    }

    const inconsistencies = Array.isArray(result.inconsistencies) ? result.inconsistencies : [];
    if (inconsistencies.length) {
      container.append(createElement('h5', '', 'Posibles inconsistencias textuales'));
      const list = createElement('ul', 'gemini-findings');
      for (const item of inconsistencies) {
        const entry = createElement('li');
        entry.append(
          createElement('strong', '', item.field || 'Dato'),
          createElement('span', '', item.detail || 'Revisa este dato en el empaque.')
        );
        if (item.evidence) entry.append(createElement('small', '', `Texto relacionado: ${item.evidence}`));
        list.append(entry);
      }
      container.append(list);
    } else {
      container.append(createElement('p', 'gemini-no-findings', 'La IA no detectó contradicciones explícitas en el texto. Esto no confirma el producto.'));
    }

    const uncertainties = Array.isArray(result.uncertainties) ? result.uncertainties : [];
    if (uncertainties.length) {
      container.append(createElement('h5', '', 'Datos ambiguos o incompletos'));
      const list = createElement('ul', 'gemini-findings');
      for (const uncertainty of uncertainties) list.append(createElement('li', '', uncertainty));
      container.append(list);
    }
  }

  function compareField(field, ocrValue, catalogValue, similarity) {
    if (!ocrValue || similarity === null) return null;
    return {
      field,
      ocr: ocrValue,
      catalog: catalogValue,
      similarityPercent: Math.round(similarity * 100)
    };
  }

  function catalogDifferences(results) {
    const fields = window.MedAlertOCR.extractCandidates(results);
    const matches = window.MedAlertCatalog.findMatches({
      name: fields.name,
      presentation: fields.presentation,
      manufacturer: fields.manufacturer,
      registration: fields.registration
    });
    return matches.map(match => {
      const medicine = match.medicine;
      const comparisons = [
        compareField('Nombre/principio activo', fields.name, `${medicine.name} · ${medicine.activeIngredient}`, match.nameScore),
        compareField('Concentración', match.strengthScore === null ? '' : fields.name, medicine.strength, match.strengthScore),
        compareField('Presentación', fields.presentation, `${medicine.dosageForm} · ${medicine.presentation}`, match.presentationScore),
        compareField('Fabricante', fields.manufacturer, medicine.manufacturer, match.manufacturerScore),
        compareField('Registro demo', fields.registration, medicine.demoRegistration, match.registrationScore)
      ].filter(Boolean);
      return {
        candidate: medicine.name,
        activeIngredient: medicine.activeIngredient,
        strength: medicine.strength,
        presentation: medicine.presentation,
        reason: match.reason,
        similarityPercent: Math.round(match.score * 100),
        comparisons
      };
    });
  }

  function createAnalysisPanel(results) {
    const transcript = results
      .filter(result => result && typeof result.text === 'string' && result.text.trim())
      .map(result => `${result.label || 'Cara del empaque'}:\n${result.text.trim()}`)
      .join('\n\n');
    if (!transcript) return null;

    const panel = createElement('section', 'gemini-analysis');
    panel.setAttribute('aria-label', 'Análisis orientativo de la transcripción OCR');
    panel.append(
      createElement('h3', '', 'Análisis de texto con Gemini'),
      createElement('p', 'gemini-disclaimer', 'Al pulsar el botón se enviarán la transcripción OCR y las comparaciones de candidatos del catálogo demo a Google Gemini; no se envían las fotos ni los campos que ingresaste manualmente. El resultado no verifica autenticidad, seguridad ni registros oficiales.')
    );
    const analyze = createElement('button', 'button button-secondary', 'Enviar transcripción a Gemini');
    analyze.type = 'button';
    const status = createElement('p', 'gemini-status', 'La transcripción no se envía hasta que pulses el botón.');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const output = createElement('div', 'gemini-result');
    analyze.addEventListener('click', async () => {
      analyze.disabled = true;
      output.replaceChildren();
      status.textContent = 'Enviando la transcripción y las comparaciones demo a Gemini…';
      try {
        const result = await analyzeTranscript(transcript, catalogDifferences(results));
        renderAnalysis(result, output);
        status.textContent = 'Análisis terminado. Contrasta cada observación con el empaque.';
      } catch (error) {
        status.textContent = `No se pudo completar el análisis: ${error.message}`;
      } finally {
        analyze.disabled = false;
      }
    });
    panel.append(analyze, status, output);
    return panel;
  }

  return { createAnalysisPanel };
})();
