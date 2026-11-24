'use strict';

window.MedAlertConsumer = (() => {
  const state = {
    step: 'capture',
    front: null,
    back: null,
    data: {},
    dataSources: {},
    ocrStatus: 'idle',
    ocrMessage: '',
    ocrResults: [],
    ocrEvidence: {},
    ocrRunId: 0,
    signals: [],
    signalNote: '',
    confirmedIdentity: false,
    confirmedPresentation: false,
    feedback: '',
    textScale: 1
  };
  let root;
  let returnToPharmacy;
  let objectUrls = [];

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, className, callback) => {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', callback);
    return node;
  };
  const bullets = [
    ['capture', 'Captura'],
    ['data', 'Datos'],
    ['package', 'Empaque'],
    ['result', 'Resultado']
  ];

  function disposeUrls() {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls = [];
  }

  function preview(file, label) {
    if (!file) return element('p', 'consumer-empty', `Aún no capturaste el ${label.toLowerCase()}.`);
    const url = URL.createObjectURL(file);
    objectUrls.push(url);
    const figure = element('figure', 'consumer-preview');
    const image = element('img');
    image.src = url;
    image.alt = `Vista previa: ${label}`;
    figure.append(image, element('figcaption', '', `${label} · ${file.name}`));
    return figure;
  }

  function localNotice(text = 'Tesseract.js procesa el OCR en este dispositivo; las fotos no se suben. Si solicitas el análisis, Gemini recibe la transcripción OCR y las comparaciones con el catálogo demo. No se consultan fuentes oficiales.') {
    const note = element('p', 'consumer-notice', text);
    note.setAttribute('role', 'note');
    note.prepend(window.MedAlertWeb.icon('info'));
    return note;
  }

  function addField(form, label, name, value = '', options = {}) {
    const wrapper = element('label', `consumer-field${options.highlight ? ' consumer-highlight' : ''}`);
    wrapper.append(element('span', '', label));
    const input = element(options.multiline ? 'textarea' : 'input');
    input.name = name;
    input.value = value || '';
    input.required = Boolean(options.required);
    if (options.type) input.type = options.type;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.rows) input.rows = options.rows;
    wrapper.append(input);
    form.append(wrapper);
    return input;
  }

  function openCapture(side, input) {
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        state.feedback = 'Elige un archivo de imagen.';
        render();
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        state.feedback = 'La imagen debe pesar 10 MB o menos.';
        render();
        return;
      }
      state[side] = file;
      state.ocrRunId++;
      state.ocrStatus = 'idle';
      state.ocrMessage = '';
      state.ocrResults = [];
      state.ocrEvidence = {};
      state.data = {};
      state.dataSources = {};
      state.captureConfirmed = false;
      state.confirmedIdentity = false;
      state.confirmedPresentation = false;
      state.feedback = '';
      render();
    });
  }

  function captureCard(side, label, instructions) {
    const card = element('section', 'consumer-capture-card');
    card.append(element('h3', '', label), element('p', '', instructions));
    const file = element('input', 'visually-hidden');
    file.type = 'file';
    file.setAttribute('aria-label', `Capturar ${label.toLowerCase()}`);
    openCapture(side, file);
    card.append(file, button(state[side] ? 'Repetir foto' : 'Tomar o elegir foto', 'button button-primary', () => file.click()));
    if (state[side]) {
      card.append(preview(state[side], label));
    } else {
      const guide = element('div', 'capture-frame', side === 'front' ? 'Encuadra el frente completo' : 'Encuadra el lote y el vencimiento');
      card.append(guide);
    }
    return card;
  }

  function stepper() {
    const list = element('ol', 'consumer-stepper');
    const index = bullets.findIndex(([id]) => id === state.step);
    for (const [stepId, label] of bullets) {
      const item = element('li', stepId === state.step ? 'active' : bullets.findIndex(([id]) => id === stepId) < index ? 'complete' : '');
      item.append(element('span', 'consumer-step-number', String(bullets.findIndex(([id]) => id === stepId) + 1)), element('span', '', label));
      list.append(item);
    }
    return list;
  }

  function shell(title, description) {
    disposeUrls();
    root.replaceChildren();
    root.classList.add('consumer-mode');
    const app = element('main', 'consumer-shell');
    const header = element('header', 'consumer-header');
    const titleBlock = element('div');
    const logo = element('img', 'medalert-logo consumer-logo');
    logo.src = 'assets/images/medalert-logo.png';
    logo.alt = 'MedAlert';
    logo.width = 1280;
    logo.height = 373;
    titleBlock.append(logo, element('div', 'consumer-eyebrow', 'Modo consumidor'), element('h1', '', title), element('p', '', description));
    const controls = element('div', 'consumer-controls');
    const decrease = button('A−', 'button button-secondary', () => changeTextScale(-0.1));
    const increase = button('A+', 'button button-secondary', () => changeTextScale(0.1));
    decrease.setAttribute('aria-label', 'Disminuir tamaño del texto');
    increase.setAttribute('aria-label', 'Aumentar tamaño del texto');
    const scaleStatus = element('span', 'consumer-scale-status');
    scaleStatus.setAttribute('role', 'status');
    updateScale();
    controls.append(
      decrease,
      increase,
      scaleStatus,
      button('Volver a farmacia', 'button button-secondary', () => {
        state.ocrRunId++;
        returnToPharmacy();
      })
    );
    header.append(titleBlock, controls);
    app.append(header, stepper());
    root.append(app);
    return app;

    function changeTextScale(amount) {
      const previous = state.textScale;
      state.textScale = Math.min(1.5, Math.max(0.9, Math.round((state.textScale + amount) * 10) / 10));
      if (state.textScale === previous) return;
      updateScale();
      scaleStatus.textContent = `Tamaño del texto: ${Math.round(state.textScale * 100)} %`;
    }

    function updateScale() {
      app.style.setProperty('--consumer-scale', String(state.textScale));
      decrease.setAttribute('aria-disabled', String(state.textScale === 0.9));
      increase.setAttribute('aria-disabled', String(state.textScale === 1.5));
    }
  }

  function updateOcrProgress(runId, progress) {
    if (runId !== state.ocrRunId) return;
    state.ocrMessage = progress.status === 'recognizing text'
      ? `Leyendo ${progress.label}… ${Math.round(progress.progress * 100)}%`
      : `Preparando OCR local para ${progress.label.toLocaleLowerCase('es')}…`;
    const status = root.querySelector('.ocr-status');
    if (status) status.textContent = state.ocrMessage;
  }

  async function runOcr() {
    const runId = ++state.ocrRunId;
    state.ocrStatus = 'working';
    state.ocrMessage = 'Preparando OCR local…';
    state.ocrResults = [];
    state.ocrEvidence = {};
    state.feedback = '';
    render();
    const images = [
      { side: 'front', label: 'Frente', file: state.front },
      { side: 'back', label: 'Reverso', file: state.back }
    ];
    try {
      const results = await window.MedAlertOCR.recognizeImages(images, progress => updateOcrProgress(runId, progress));
      if (runId !== state.ocrRunId) return;
      state.ocrResults = results;
      const candidates = window.MedAlertOCR.extractCandidates(results, state.ocrEvidence);
      state.data = { ...state.data };
      for (const [key, value] of Object.entries(candidates)) {
        if (state.dataSources[key] === 'manual') continue;
        state.data[key] = value;
        if (value) state.dataSources[key] = 'ocr';
        else delete state.dataSources[key];
      }
      const recognized = results.filter(result => result.text);
      state.ocrStatus = recognized.length ? 'complete' : 'empty';
      state.ocrMessage = recognized.length
        ? 'Lectura terminada. Revisa y corrige cada sugerencia antes de continuar.'
        : 'No se encontró texto legible. Puedes continuar e ingresar los datos manualmente.';
      render();
    } catch (error) {
      if (runId !== state.ocrRunId) return;
      state.ocrStatus = 'error';
      state.ocrMessage = `No se pudo completar el OCR (${error.message}). Puedes continuar con el ingreso manual.`;
      render();
    }
  }

  function renderCapture() {
    const app = shell('Verifica un medicamento', 'Sigue cada paso y revisa el empaque antes de consultar a un profesional.');
    const instructions = element('section', 'consumer-guide');
    instructions.append(element('h2', '', 'Guía para tomar las fotos'));
    const list = element('ul');
    for (const text of [
      'Busca buena iluminación y apoya el empaque sobre una superficie estable.',
      'Asegúrate de que el nombre y la concentración se lean completos.',
      'Fotografía primero el frente y luego el reverso, sin recortar los bordes.'
    ]) list.append(element('li', '', text));
    instructions.append(list);
    const captures = element('div', 'consumer-capture-grid');
    captures.append(captureCard('front', 'Frente del empaque', 'Incluye nombre, concentración y presentación.'), captureCard('back', 'Reverso del empaque', 'Incluye fabricante, lote, vencimiento y registro si aparecen.'));
    app.append(instructions, captures);
    const confirmation = element('label', 'consumer-confirm');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(state.front && state.back && state.captureConfirmed);
    checkbox.addEventListener('change', () => { state.captureConfirmed = checkbox.checked; render(); });
    confirmation.append(checkbox, element('span', '', 'Confirmo visualmente que ambas caras se ven completas y legibles.'));
    app.append(confirmation);
    const ocrStatus = element('p', 'ocr-status');
    ocrStatus.setAttribute('role', 'status');
    ocrStatus.setAttribute('aria-live', 'polite');
    ocrStatus.textContent = state.ocrMessage || 'El OCR es una sugerencia automática; revisa todos los datos en el empaque.';
    app.append(ocrStatus);
    if (state.feedback) {
      const error = element('p', 'consumer-error');
      error.append(window.MedAlertWeb.icon('warning'), element('span', '', state.feedback));
      app.append(error);
    }
    const read = button('Leer datos de las fotos', 'button button-secondary', () => { void runOcr(); });
    read.prepend(window.MedAlertWeb.icon('info'));
    read.disabled = !(state.front && state.back && state.captureConfirmed) || state.ocrStatus === 'working';
    app.append(read);
    const next = button('Continuar con el ingreso manual', 'button button-primary', () => {
      state.step = 'data';
      state.feedback = '';
      render();
    });
    next.disabled = !(state.front && state.back && state.captureConfirmed);
    if (state.ocrStatus === 'complete') next.textContent = 'Revisar datos reconocidos';
    app.append(next, localNotice());
  }

  function renderData() {
    const app = shell('Revisa los datos del empaque', 'Confirma cada sugerencia de OCR y corrige cualquier lectura incorrecta antes de continuar.');
    app.append(preview(state.front, 'Frente del empaque'), preview(state.back, 'Reverso del empaque'));
    if (state.ocrResults.length) {
      const recognizedText = element('details', 'consumer-ocr-results');
      recognizedText.append(element('summary', '', 'Texto de las fotos y calidad de lectura OCR'));
      recognizedText.append(element('p', '', 'El porcentaje estima la calidad del reconocimiento de texto. La autenticidad y la seguridad requieren una verificación independiente.'));
      for (const result of state.ocrResults) {
        const section = element('section');
        const confidence = Number.isFinite(result.confidence) ? ` · calidad estimada del texto ${result.confidence}%` : '';
        section.append(element('h3', '', `${result.label}${confidence}`), element('pre', '', result.text || 'No se detectó texto legible.'));
        recognizedText.append(section);
      }
      app.append(recognizedText);
      const evidence = window.MedAlertOCR.renderFieldEvidence(state.ocrEvidence);
      if (evidence) app.append(evidence);
      const analysisPanel = window.MedAlertGemini.createAnalysisPanel(state.ocrResults);
      if (analysisPanel) app.append(analysisPanel);
    }
    const form = element('form', 'consumer-form');
    for (const [label, key, options] of [
      ['Nombre y concentración', 'name', { required: true, highlight: true }],
      ['Presentación', 'presentation', { required: true, highlight: true }],
      ['Fabricante', 'manufacturer', { highlight: true }],
      ['Lote', 'lot', { highlight: true }],
      ['Vencimiento (mes/año)', 'expiry', { type: 'month', required: true, highlight: true }],
      ['Registro sanitario impreso', 'registration', { highlight: true }],
      ['Producto indicado en la receta (si corresponde)', 'indication', { wide: true }]
    ]) {
      const input = addField(form, label, key, state.data[key], options);
      if (state.ocrResults.length && key !== 'indication' && !state.data[key]) {
        const conflicting = state.ocrEvidence[key]?.length > 1;
        const help = element('small', 'consumer-field-help', conflicting
          ? 'Se leyeron valores distintos. Revisa el empaque y escribe el correcto.'
          : 'Campo sin lectura clara. Escríbelo o repite la foto.');
        help.id = 'ocr-help-' + key;
        input.setAttribute('aria-describedby', help.id);
        input.parentElement.append(help);
      }
      input.addEventListener('input', () => {
        state.data[key] = input.value;
        state.dataSources[key] = 'manual';
        updateCatalog();
      });
    }
    const catalogOutput = element('div', 'catalog-output');
    function updateCatalog() {
      catalogOutput.replaceChildren();
      const comparison = window.MedAlertCatalog.renderComparison({
        name: form.elements.name.value,
        presentation: form.elements.presentation.value,
        manufacturer: form.elements.manufacturer.value,
        registration: form.elements.registration.value
      });
      if (comparison) catalogOutput.append(comparison);
    }
    updateCatalog();
    form.append(catalogOutput);
    const actions = element('div', 'consumer-actions');
    const back = button('Volver a las fotos', 'button button-secondary', () => { state.step = 'capture'; render(); });
    const next = element('button', 'button button-primary', 'Guardar datos e inspeccionar empaque');
    next.type = 'submit';
    actions.append(back, next);
    form.append(actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      state.data = Object.fromEntries(new FormData(form).entries());
      state.confirmedIdentity = false;
      state.confirmedPresentation = false;
      state.step = 'package';
      render();
    });
    app.append(form, localNotice('Los campos sugeridos por OCR se pueden corregir. La lectura no valida el medicamento; compara cada valor con el empaque.'));
  }

  function renderPackage() {
    const app = shell('Inspecciona las señales visibles', 'Marca lo que observas directamente; MedAlert no analiza las fotos con IA.');
    const form = element('form', 'consumer-form');
    const fieldset = element('fieldset', 'consumer-signal-list');
    fieldset.append(element('legend', '', 'Señales del empaque'));
    for (const [key, text] of [
      ['damaged', 'Empaque golpeado, roto o abierto'],
      ['moisture', 'Humedad, manchas o filtraciones'],
      ['label', 'Etiqueta ilegible o aparentemente alterada'],
      ['seal', 'Sello ausente o manipulado']
    ]) {
      const label = element('label', 'consumer-signal');
      const input = element('input');
      input.type = 'checkbox';
      input.name = 'signals';
      input.value = key;
      input.checked = state.signals.includes(key);
      label.append(input, element('span', '', text));
      fieldset.append(label);
    }
    form.append(fieldset);
    addField(form, 'Notas (opcional)', 'signalNote', state.signalNote, { multiline: true, rows: 3, wide: true });
    const actions = element('div', 'consumer-actions');
    actions.append(
      button('Volver a los datos', 'button button-secondary', () => { state.step = 'data'; render(); }),
      Object.assign(element('button', 'button button-primary', 'Ver resumen de revisión'), { type: 'submit' })
    );
    form.append(actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      state.signals = [...form.querySelectorAll('input[name="signals"]:checked')].map(input => input.value);
      state.signalNote = form.elements.signalNote.value.trim();
      state.confirmedIdentity = false;
      state.confirmedPresentation = false;
      state.step = 'result';
      render();
    });
    app.append(form, localNotice());
  }

  function isExpired(value) {
    if (!/^\d{4}-\d{2}$/.test(value || '')) return false;
    const [year, month] = value.split('-').map(Number);
    const now = new Date();
    return new Date(year, month, 0) < new Date(now.getFullYear(), now.getMonth(), 1);
  }

  function resultSummary() {
    const expired = isExpired(state.data.expiry);
    if (expired) return {
      title: 'Revisión necesaria',
      description: 'La fecha ingresada parece vencida. No uses el medicamento hasta aclararlo con un farmacéutico o profesional de salud.'
    };
    if (state.signals.length) return {
      title: 'Revisión necesaria',
      description: 'Registraste señales visibles en el empaque. Antes de usar el producto, consulta a tu farmacia y lleva el empaque para que lo revisen.'
    };
    return {
      title: 'Autenticidad no confirmada',
      description: 'Los datos ingresados no sustituyen una consulta oficial. Verifica el producto y su registro con un farmacéutico o fuente oficial antes de usarlo.'
    };
  }

  function normalizeText(value) {
    return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  }

  function renderResult() {
    const app = shell('Resumen de la revisión', 'Comprueba los datos ingresados y confirma explícitamente lo que has revisado.');
    const summary = resultSummary();
    const card = element('section', 'consumer-result needs-review');
    card.append(window.MedAlertWeb.icon('warning'), element('span', 'consumer-eyebrow', 'Resultado local · Sin validación externa'), element('h2', '', summary.title), element('p', '', summary.description));
    card.append(button('Consultar a mi farmacia', 'button button-primary', () => { state.step = 'support'; render(); }));
    app.append(card);
    if (state.signals.length) {
      const warning = element('p', 'consumer-warning');
      warning.append(window.MedAlertWeb.icon('warning'), element('span', '', `Señales marcadas: ${state.signals.join(', ')}.${state.signalNote ? ` Nota: ${state.signalNote}` : ''}`));
      app.append(warning);
    }
    const verification = element('section', 'consumer-verification');
    verification.append(element('h2', '', 'Datos que ingresaste'));
    for (const [label, key] of [
      ['Nombre y concentración', 'name'], ['Presentación', 'presentation'], ['Fabricante', 'manufacturer'],
      ['Lote', 'lot'], ['Vencimiento', 'expiry'], ['Registro sanitario', 'registration'], ['Indicación en receta', 'indication']
    ]) {
      const row = element('div', 'consumer-data-row');
      const source = state.dataSources[key] === 'ocr' ? 'Sugerencia OCR · requiere revisión manual' : state.dataSources[key] === 'manual' ? 'Ingreso/corrección manual · no validado' : 'Sin lectura automática · no validado';
      row.append(element('strong', '', label), element('span', '', state.data[key] || 'Sin dato'), element('small', '', source));
      verification.append(row);
    }
    const expiryRow = element('div', 'consumer-data-row');
    const expired = isExpired(state.data.expiry);
    expiryRow.append(element('strong', '', 'Revisión de vencimiento'), element('span', '', expired ? 'La fecha ingresada parece vencida' : 'No parece vencido según la fecha ingresada'), element('small', '', 'Comprobación de fecha local, no valida el producto.'));
    verification.append(expiryRow);
    if (state.data.indication) {
      const identity = normalizeText(state.data.name);
      const indication = normalizeText(state.data.indication);
      const textualMatch = Boolean(identity && indication && (identity.includes(indication) || indication.includes(identity)));
      const row = element('div', 'consumer-data-row');
      row.append(
        element('strong', '', 'Comparación textual con indicación'),
        element('span', '', textualMatch ? 'Hay texto coincidente' : 'No hay coincidencia textual directa'),
        element('small', '', 'No evalúa si el medicamento corresponde clínicamente a una indicación.')
      );
      verification.append(row);
    }
    const imageEvidence = element('div', 'consumer-capture-grid');
    imageEvidence.append(preview(state.front, 'Frente del empaque'), preview(state.back, 'Reverso del empaque'));
    verification.append(imageEvidence);
    app.append(verification);
    const checks = element('section', 'consumer-confirmations');
    for (const [key, text] of [
      ['confirmedIdentity', 'Revisé el nombre y la concentración del producto.'],
      ['confirmedPresentation', 'Revisé la presentación del empaque.']
    ]) {
      const label = element('label', 'consumer-confirm');
      const input = element('input');
      input.type = 'checkbox';
      input.checked = state[key];
      input.addEventListener('change', () => { state[key] = input.checked; render(); });
      label.append(input, element('span', '', text));
      checks.append(label);
    }
    app.append(checks);
    const support = element('p', 'consumer-notice', 'Consultas oficiales, alertas sanitarias, comparación de similitud y análisis de riesgo real no están conectados en esta demostración.');
    app.append(support);
    const actions = element('div', 'consumer-actions');
    actions.append(
      button('Editar datos', 'button button-secondary', () => { state.step = 'data'; render(); })
    );
    const finish = button('Confirmé la revisión', 'button button-primary', () => {
      state.feedback = 'Confirmaste la lectura. Este resultado no confirma que el medicamento sea auténtico o seguro.';
      render();
    });
    finish.disabled = !(state.confirmedIdentity && state.confirmedPresentation);
    actions.append(finish);
    app.append(actions);
    if (state.feedback) {
      const success = element('p', 'consumer-success');
      success.append(window.MedAlertWeb.icon('check'), element('span', '', state.feedback));
      app.append(success);
    }
  }

  function renderSupport() {
    const app = shell('Consultar a mi farmacia', 'Lleva el empaque y señala el dato o la señal que requiere revisión.');
    app.append(
      element('section', 'consumer-result needs-review'),
      localNotice('No podemos confirmar si un medicamento es auténtico o seguro. Consulta a un farmacéutico o profesional de salud. Si crees que existe una emergencia, contacta los servicios de emergencia de tu localidad.')
    );
    app.querySelector('.consumer-result').append(window.MedAlertWeb.icon('warning'), element('h2', '', 'Opciones de consulta'), element('p', '', 'Conserva el empaque y la documentación para mostrarlos a un profesional.'));
    app.append(
      button('Volver al resumen', 'button button-secondary', () => { state.step = 'result'; render(); }),
      button('Terminar y borrar fotos de esta sesión', 'button button-primary', () => {
        state.front = null;
        state.back = null;
        state.ocrRunId++;
        state.ocrStatus = 'idle';
        state.ocrMessage = '';
        state.ocrResults = [];
        state.ocrEvidence = {};
        state.captureConfirmed = false;
        state.data = {};
        state.dataSources = {};
        state.signals = [];
        state.signalNote = '';
        state.confirmedIdentity = false;
        state.confirmedPresentation = false;
        state.feedback = '';
        state.step = 'capture';
        render();
      })
    );
  }

  function render() {
    if (state.step === 'capture') return renderCapture();
    if (state.step === 'data') return renderData();
    if (state.step === 'package') return renderPackage();
    if (state.step === 'result') return renderResult();
    return renderSupport();
  }

  function open(container, onBack) {
    root = container;
    returnToPharmacy = onBack;
    state.step = 'capture';
    state.front = null;
    state.back = null;
    state.ocrRunId++;
    state.ocrStatus = 'idle';
    state.ocrMessage = '';
    state.ocrResults = [];
    state.ocrEvidence = {};
    state.captureConfirmed = false;
    state.data = {};
    state.dataSources = {};
    state.signals = [];
    state.signalNote = '';
    state.confirmedIdentity = false;
    state.confirmedPresentation = false;
    state.feedback = '';
    state.textScale = 1;
    render();
  }

  return { open };
})();
