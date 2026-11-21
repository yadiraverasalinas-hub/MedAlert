'use strict';

window.MedAlertWeb = (() => {
  const storageKey = 'medalert-web-state-v1';
  const checkDefinitions = [
    ['empaque', 'Empaque exterior íntegro', 'Sin golpes, humedad ni cintas violadas.'],
    ['guia', 'Guía de remisión presente', 'La guía corresponde a esta recepción.'],
    ['lote', 'Lote impreso y legible', 'Revisado manualmente en el empaque.'],
    ['vencimiento', 'Fecha de vencimiento vigente', 'Compara la fecha impresa con la fecha actual.'],
    ['registro', 'Registro sanitario visible', 'Revisado en el empaque; no implica consulta oficial.'],
    ['almacenamiento', 'Condiciones de almacenamiento', 'Confirma las condiciones indicadas para el producto.']
  ];
  const seedRecords = [
    { guide: 'GR-2026-1048', package: 'Bulto 01', supplier: 'Andina Pharma', product: 'Amoxicilina 500 mg', presentation: 'Cápsulas · Caja x 100', lot: '#88392-B', expiry: '11/2027', quantity: '120 cajas', status: 'Inconsistencia', note: 'Revisión manual requerida' },
    { guide: 'GR-2026-1048', package: 'Bulto 02', supplier: 'Andina Pharma', product: 'Ibuprofeno 400 mg', presentation: 'Tabletas · Caja x 20', lot: 'IB-2408', expiry: '06/2028', quantity: '80 cajas', status: 'Verificado local', note: 'Datos de ejemplo revisados localmente' },
    { guide: 'GR-2026-1049', package: 'Bulto 03', supplier: 'Salud Distrib.', product: 'Paracetamol 500 mg', presentation: 'Tabletas · Caja x 100', lot: 'PC-2609', expiry: '09/2028', quantity: '200 cajas', status: 'Verificado local', note: 'Datos de ejemplo revisados localmente' },
    { guide: 'GR-2026-1049', package: 'Bulto 04', supplier: 'Salud Distrib.', product: 'Loratadina 10 mg', presentation: 'Tabletas · Caja x 10', lot: 'LR-091', expiry: '03/2028', quantity: '60 cajas', status: 'Verificado local', note: 'Datos de ejemplo revisados localmente' },
    { guide: 'GR-2026-1050', package: 'Bulto 05', supplier: 'Medifarma Sur', product: 'Omeprazol 20 mg', presentation: 'Cápsulas · Caja x 30', lot: 'OM-6621', expiry: '12/2027', quantity: '90 cajas', status: 'Inconsistencia', note: 'Revisión manual requerida' },
    { guide: 'GR-2026-1050', package: 'Bulto 06', supplier: 'Medifarma Sur', product: 'Losartán 50 mg', presentation: 'Tabletas · Caja x 30', lot: 'LS-3026', expiry: '07/2028', quantity: '100 cajas', status: 'Verificado local', note: 'Datos de ejemplo revisados localmente' }
  ];
  let persistenceWarning = '';
  let savedState = null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      savedState = JSON.parse(stored);
      if (!savedState || !Array.isArray(savedState.records)) throw new Error('El formato guardado no es válido.');
    }
  } catch (error) {
    persistenceWarning = `No se pudieron leer los datos guardados (${error.message}). Se muestran datos de ejemplo.`;
    savedState = null;
  }
  function defaultChecks(allDone = false, firstRecord = false) {
    return checkDefinitions.map(([id, title, description], index) => ({
      id, title, description, done: allDone || (firstRecord && index < 4)
    }));
  }
  function normalizeRecord(record, index) {
    const checks = Array.isArray(record.checks)
      ? checkDefinitions.map(([id, title, description], checkIndex) => ({
        id, title, description, done: Boolean(record.checks[checkIndex]?.done)
      }))
      : defaultChecks(record.status === 'Verificado' || record.status === 'Verificado local', index === 0);
    const document = record.document || {};
    return {
      ...record,
      id: record.id || `sample-${index + 1}`,
      status: record.status === 'Verificado' ? 'Verificado local' : record.status,
      manufacturer: record.manufacturer || record.supplier || '',
      registration: record.registration || '',
      document: {
        product: document.product ?? record.product ?? '',
        presentation: document.presentation ?? record.presentation ?? '',
        manufacturer: document.manufacturer ?? record.manufacturer ?? record.supplier ?? '',
        lot: document.lot ?? record.lot ?? '',
        expiry: document.expiry ?? record.expiry ?? '',
        registration: document.registration ?? record.registration ?? ''
      },
      checks,
      inspection: Array.isArray(record.inspection) ? record.inspection : [],
      alerts: Array.isArray(record.alerts) ? record.alerts : [],
      actions: Array.isArray(record.actions) ? record.actions : [],
      createdAt: record.createdAt || new Date().toISOString()
    };
  }
  const records = (savedState?.records || seedRecords).map(normalizeRecord);
  let selectedRecordId = records.some(record => record.id === savedState?.selectedRecordId)
    ? savedState.selectedRecordId
    : records[0]?.id;

  const routes = {
    '2:5027': { section: 'Recepción', eyebrow: 'Operación diaria / Recepción', title: 'Recepción de mercadería', description: 'Revisa cada lote antes de ingresarlo al inventario.' },
    '50:166': { section: 'Inventario', eyebrow: 'Operación diaria / Inventario', title: 'Inventario de lotes', description: 'Consulta los productos y lotes registrados en la farmacia.' },
    '50:582': { section: 'Cuarentena', eyebrow: 'Control de calidad / Cuarentena', title: 'Lotes en cuarentena', description: 'Mantén separados los productos que requieren una revisión.' },
    '42:166': { section: 'Historial', eyebrow: 'Consultas / Historial', title: 'Historial de verificaciones', description: 'Localiza verificaciones e irregularidades anteriores.' },
    '42:488': { section: 'Reportes', eyebrow: 'Consultas / Reportes', title: 'Indicadores de recepción', description: 'Un resumen del trabajo registrado en este entorno de demostración.' },
    '42:723': { section: 'Permisos', eyebrow: 'Administración / Permisos', title: 'Permisos por rol', description: 'Revisa qué acciones están disponibles para cada perfil.' },
    '2:5251': { section: 'Recepción', eyebrow: 'Operación diaria / Recepción', title: 'Detalle de recepción', description: 'Revisa los registros y las observaciones de esta entrega.' },
    '37:166': { section: 'Recepción', eyebrow: 'Operación diaria / Recepción', title: 'Recepción rápida', description: 'Captura consecutiva de bultos para una misma guía.' },
    '37:292': { section: 'Recepción', eyebrow: 'Recepción / Guía GR-2026-1048', title: 'Comprobaciones de recepción', description: 'Lista breve para revisar cada bulto de forma consistente.' },
    '37:435': { section: 'Recepción', eyebrow: 'Control de calidad / Verificación', title: 'Contraste de datos', description: 'Compara la información detectada en el empaque con la guía de recepción.' },
    '37:579': { section: 'Recepción', eyebrow: 'Control de calidad / Inspección', title: 'Estado del empaque', description: 'Registra las condiciones observadas durante la inspección.' },
    '37:682': { section: 'Cuarentena', eyebrow: 'Control de calidad / Alertas', title: 'Alertas y clasificación', description: 'Consulta las alertas de ejemplo y clasifica el lote.' },
    '41:166': { section: 'Cuarentena', eyebrow: 'Control de calidad / Observación', title: 'Registrar observación', description: 'Separa los lotes que requieren una revisión manual.' },
    '41:414': { section: 'Cuarentena', eyebrow: 'Control de calidad / Medida', title: 'Acción ante irregularidad', description: 'Registra una medida y conserva una constancia.' },
    '41:679': { section: 'Historial', eyebrow: 'Consultas / Constancia', title: 'Constancia de verificación', description: 'Resumen de la revisión de ejemplo.' },
    '42:1099': { section: 'Recepción', eyebrow: 'Operación diaria / Sin conexión', title: 'Capturas sin conexión', description: 'Consulta el estado de las capturas guardadas localmente.' },
    '58:299': { section: 'Recepción', eyebrow: 'Operación diaria / Sincronización', title: 'Sincronización completada', description: 'Estado de los registros guardados en este dispositivo.' }
  };
  const nav = [
    ['2:5027', 'Recepción', 'package'],
    ['50:166', 'Inventario', 'boxes'],
    ['50:582', 'Cuarentena', 'shield'],
    ['42:166', 'Historial', 'history'],
    ['42:488', 'Reportes', 'report'],
    ['42:723', 'Permisos', 'lock']
  ];
  const workflows = {
    '2:5251': ['Detalle de recepción', 'Revisa los registros y las observaciones asociadas a esta entrega.', 'Volver a recepción', '2:5027'],
    '37:166': ['Recepción rápida', 'Registra varios bultos de una misma guía sin interrumpir el flujo de trabajo.', 'Iniciar captura', '37:435'],
    '37:292': ['Lista de comprobaciones', 'Confirma que los datos, el empaque y la documentación estén completos antes de aprobar el lote.', 'Revisar inventario', '50:166'],
    '37:435': ['Contraste de datos', 'Compara la información detectada en el empaque con los datos de recepción.', 'Revisar estado del empaque', '37:579'],
    '37:579': ['Estado del empaque', 'Registra las condiciones visibles del empaque y deja constancia de la revisión.', 'Consultar alertas', '37:682'],
    '37:682': ['Alertas y clasificación', 'Revisa las señales reportadas antes de definir el siguiente paso.', 'Ver lotes observados', '41:166'],
    '41:166': ['Registrar observación', 'Deja un lote fuera del inventario mientras se revisa la inconsistencia.', 'Elegir acción', '41:414'],
    '41:414': ['Acción ante irregularidad', 'Documenta la medida adoptada y conserva un registro de la decisión.', 'Ver constancia', '41:679'],
    '41:679': ['Constancia de verificación', 'Resumen de una verificación de ejemplo realizada en este dispositivo.', 'Volver a recepción', '2:5027'],
    '42:1099': ['Capturas sin conexión', 'Las capturas de esta demostración se conservan localmente y quedan pendientes de sincronización.', 'Ver sincronización', '58:299'],
    '58:299': ['Sincronización completada', 'Estado de sincronización de los registros locales de ejemplo.', 'Volver a recepción', '2:5027']
  };
  let navigate = () => {};
  let currentId = '2:5027';
  let toastTimer;
  const quickDraft = {};

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function persistState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ records, selectedRecordId }));
      return true;
    } catch (error) {
      announce(`No se guardaron los cambios en este dispositivo (${error.message}).`);
      return false;
    }
  }
  function resetLocalData() {
    if (!window.confirm('Se eliminarán los registros creados en este navegador y volverán los datos de ejemplo. ¿Continuar?')) return;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      announce(`No se pudieron eliminar los datos guardados (${error.message}).`);
      return;
    }
    records.splice(0, records.length, ...seedRecords.map(normalizeRecord));
    selectedRecordId = records[0]?.id;
    render(currentId, navigate);
    announce('Datos locales eliminados; se restauraron los ejemplos.');
  }
  function selectedRecord() {
    return records.find(record => record.id === selectedRecordId) || records[0] || null;
  }
  function selectRecord(record, destination) {
    selectedRecordId = record.id;
    persistState();
    navigate(destination);
  }
  function recordNeedsReview(record) {
    return !['Verificado local', 'Verificado'].includes(record.status);
  }
  function quarantineCount() {
    return records.filter(record => ['Observado', 'En cuarentena'].includes(record.status)).length;
  }
  function makeId() {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function startNewReception() {
    quickDraft.guide = '';
    quickDraft.supplier = '';
    navigate('37:166');
  }
  const icon = (name, className = '') => {
    const paths = {
      package: ['M12 3 3.5 7.5 12 12l8.5-4.5L12 3Z', 'M3.5 7.5V17L12 21l8.5-4V7.5', 'M12 12v9', 'm8 5.1 8.5 4.6'],
      boxes: ['m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z', 'M3.5 7.5V12L12 16.5l8.5-4.5V7.5', 'M12 12v4.5', 'm7 13.8-3.5 2L12 20l4-2.2', 'M12 16v4', 'm17 13.8 3.5 2'],
      shield: ['M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z', 'M12 8v4', 'M12 15h.01'],
      history: ['M3 11a9 9 0 1 1 2.6 6.4', 'M3 4v7h7', 'M12 7v5l3 2'],
      report: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 16v-3', 'M12 16v-5', 'M15 16v-2'],
      lock: ['M5 10h14v11H5z', 'M8 10V7a4 4 0 0 1 8 0v3', 'M12 14v3'],
      search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'm16 16 4 4'],
      bell: ['M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4'],
      arrow: ['M4 12h15', 'm13 6 6 6-6 6'],
      info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 11v5', 'M12 7h.01'],
      warning: ['M12 3 2 21h20L12 3Z', 'M12 9v4', 'M12 17h.01'],
      check: ['m5 12 4 4L19 6']
    };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('ui-icon');
    if (className) svg.classList.add(className);
    for (const data of paths[name] || []) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', data);
      svg.append(path);
    }
    return svg;
  };
  const button = (text, className, callback) => {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', callback);
    return node;
  };
  const statusClass = status => ['Inconsistencia', 'Observado'].includes(status)
    ? 'danger'
    : ['En cuarentena', 'Pendiente', 'En revisión'].includes(status)
      ? 'warning'
      : 'success';
  const statusExplanation = record => {
    if (record.status === 'Verificado local') return 'Contraste manual; sin validación de fuentes oficiales.';
    if (record.status === 'En cuarentena') return record.note || 'Separado del inventario y pendiente de revisión.';
    if (record.status === 'Observado' || record.status === 'Inconsistencia') return record.note || 'Requiere revisión manual antes de continuar.';
    return record.note || 'Estado local registrado durante la recepción.';
  };

  function announce(text) {
    const box = document.querySelector('#feedback');
    box.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.textContent = ''; }, 4000);
  }

  function confirmSensitiveAction(titleText, descriptionText, actionLabel, onConfirm) {
    const dialog = document.querySelector('#confirm-action');
    const title = element('h2', '', titleText);
    title.id = 'confirm-action-title';
    const description = element('p', '', descriptionText);
    description.id = 'confirm-action-description';
    const actions = element('div', 'dialog-actions');
    const cancel = button('Cancelar', 'button button-secondary', () => dialog.close());
    const confirm = button(actionLabel, 'button button-danger', () => {
      dialog.close();
      onConfirm();
    });
    confirm.prepend(icon('warning'));
    actions.append(cancel, confirm);
    dialog.setAttribute('aria-labelledby', title.id);
    dialog.setAttribute('aria-describedby', description.id);
    dialog.replaceChildren(title, description, actions);
    if (!dialog.open) dialog.showModal();
    confirm.focus();
  }

  function showDetails(record) {
    selectedRecordId = record.id;
    persistState();
    const dialog = document.querySelector('#details');
    dialog.querySelector('h2').textContent = record.product;
    const body = dialog.querySelector('.details-body');
    body.replaceChildren();
    const fields = [
      ['Guía', record.guide], ['Bulto', record.package], ['Proveedor', record.supplier],
      ['Fabricante (dato ingresado)', record.manufacturer], ['Registro (dato ingresado)', record.registration || 'Sin dato'],
      ['Lote', record.lot], ['Vencimiento', record.expiry], ['Cantidad', record.quantity],
      ['Estado', record.status], ['Observación', record.note]
    ];
    for (const [label, value] of fields) {
      const row = element('p', 'detail-row');
      row.append(element('strong', '', label), element('span', '', value));
      body.append(row);
    }
    const checklist = record.checks.filter(check => check.done).length;
    const progress = element('p', 'detail-row');
    progress.append(element('strong', '', 'Checklist'), element('span', '', `${checklist} de ${record.checks.length} comprobaciones`));
    body.append(progress);
    for (const [label, destination] of [
      ['Abrir checklist', '37:292'],
      ['Contrastar con guía', '37:435'],
      ['Registrar inspección', '37:579'],
      ['Ver alertas y riesgo', '37:682'],
      ['Registrar acción', '41:414']
    ]) {
      body.append(button(label, 'button button-secondary', () => {
        dialog.close();
        selectRecord(record, destination);
      }));
    }
    if (record.status !== 'Observado') {
      body.append(button('Marcar como observado', 'button button-primary', () => {
        dialog.close();
        selectRecord(record, '41:166');
      }));
    }
    if (record.status !== 'En cuarentena') {
      body.append(button('Enviar a cuarentena', 'button button-secondary', () => {
        dialog.close();
        confirmSensitiveAction(
          'Confirmar cuarentena',
          `El bulto ${record.package} de ${record.product} se marcará en cuarentena y quedará fuera del inventario de este navegador.`,
          'Mover a cuarentena',
          () => {
            record.status = 'En cuarentena';
            record.note = 'Pendiente de revisión manual';
            persistState();
            render(currentId, navigate);
            announce('Lote separado para revisión.');
          }
        );
      }));
    }
    if (!dialog.open) dialog.showModal();
  }

  function makeShell(root, route) {
    const picker = document.querySelector('.picker');
    root.replaceChildren();
    const sidebar = element('aside', 'web-sidebar');
    const brand = element('a', 'web-brand');
    brand.href = '#';
    const mark = element('span', 'brand-mark');
    mark.append(icon('shield'));
    brand.append(mark, element('span', '', 'MedAlert'));
    brand.addEventListener('click', event => { event.preventDefault(); navigate('2:5027'); });
    sidebar.append(brand);
    const pharmacy = element('div', 'pharmacy-card');
    pharmacy.append(element('strong', '', 'Farmacia San Miguel'), element('span', '', 'Área de recepción · Lima'));
    sidebar.append(pharmacy);
    const navList = element('nav', 'web-nav');
    navList.setAttribute('aria-label', 'Navegación principal');
    for (const [id, label, iconName] of nav) {
      const link = button('', `nav-link${route.section === label ? ' active' : ''}`, () => navigate(id));
      link.setAttribute('aria-current', route.section === label ? 'page' : 'false');
      const navIcon = element('span', 'nav-icon');
      navIcon.append(icon(iconName));
      link.append(navIcon, element('span', 'nav-label', label));
      if (id === '50:582') link.append(element('span', 'nav-count', String(quarantineCount())));
      navList.append(link);
    }
    sidebar.append(navList);
    sidebar.append(button('＋ Nueva recepción', 'sidebar-create', startNewReception));
    sidebar.append(button('Modo consumidor', 'mode-switch', () => {
      if (!window.MedAlertConsumer) {
        announce('El modo consumidor no está disponible en esta carga.');
        return;
      }
      window.MedAlertConsumer.open(root, () => {
        root.classList.remove('consumer-mode');
        render(currentId, navigate);
      });
    }));
    const sidebarNote = element('div', 'sidebar-note');
    sidebarNote.append(element('span', 'note-mark', 'i'), element('div', '', 'Datos de demostración · No ingreses información personal'));
    sidebar.append(sidebarNote);

    const content = element('section', 'web-content');
    const topbar = element('header', 'web-topbar');
    const searchWrap = element('label', 'global-search');
    const searchMark = element('span', 'search-mark');
    searchMark.append(icon('search'));
    searchWrap.append(searchMark);
    const search = element('input');
    search.type = 'search';
    search.placeholder = 'Buscar por lote, producto o guía…';
    search.setAttribute('aria-label', 'Buscar por lote, producto o guía');
    searchWrap.append(search, element('kbd', 'search-shortcut', '⌘ K'));
    const pickerSlot = element('div');
    pickerSlot.id = 'web-screen-picker';
    if (picker) pickerSlot.append(picker);
    const user = element('div', 'user-chip');
    const notifications = button('', 'notification-button', () => announce('No tienes notificaciones nuevas.'));
    notifications.setAttribute('aria-label', 'Notificaciones');
    notifications.append(icon('bell'), element('span', 'notification-dot'));
    user.append(element('span', 'avatar', 'AV'), element('span', 'user-copy'));
    user.lastChild.append(element('strong', '', 'Farmacéutico Titular'), element('small', '', 'Ana Valdivia · Turno mañana'));
    topbar.append(searchWrap, pickerSlot, notifications, user);
    content.append(topbar);
    const main = element('div', 'web-main');
    const intro = element('div', 'page-intro');
    const heading = element('div');
    heading.append(element('div', 'eyebrow', route.eyebrow), element('h1', '', route.title), element('p', '', route.description));
    intro.append(heading);
    if (currentId === '2:5027') {
      intro.append(button('＋  Nueva recepción', 'button button-primary', startNewReception));
    } else if (currentId === '37:292') {
      const next = button('Continuar al contraste', 'button button-primary', () => {
        const record = selectedRecord();
        if (!record || record.checks.some(check => !check.done)) {
          announce('Completa las seis comprobaciones antes de continuar.');
          return;
        }
        record.checklistCompletedAt = new Date().toISOString();
        persistState();
        navigate('37:435');
      });
      next.id = 'continue-checklist';
      next.prepend(icon('arrow'));
      next.disabled = !selectedRecord()?.checks.every(check => check.done);
      intro.append(next);
      intro.append(button('＋ Nueva recepción', 'button button-secondary', startNewReception));
    } else if (['50:166', '42:166'].includes(currentId)) {
      intro.append(button('↓  Exportar resultados', 'button button-secondary', exportRecords));
    }
    main.append(intro);
    content.append(main);
    root.append(sidebar, content);
    search.addEventListener('input', () => {
      const table = root.querySelector('.records-table');
      if (table) filterTable(table, search.value, root.querySelector('.status-filter')?.value || '');
    });
    return main;
  }

  function makeStats(main) {
    const wrap = element('section', 'stats-grid');
    wrap.setAttribute('aria-label', 'Resumen de recepción');
    const stats = [
      ['Bultos registrados', String(records.length), 'Datos de ejemplo y locales', 'blue'],
      ['Revisión local completa', String(records.filter(item => item.status === 'Verificado local').length), 'Sin consulta oficial', 'green'],
      ['Requieren revisión', String(records.filter(recordNeedsReview).length), 'No ingresar al inventario', 'amber']
    ];
    for (const [title, value, caption, color] of stats) {
      const card = element('article', `stat-card ${color}`);
      card.append(element('span', 'stat-label', title), element('strong', 'stat-value', value), element('span', 'stat-caption', caption));
      wrap.append(card);
    }
    main.append(wrap);
  }

  function makeTable(main, rows, { filter = true } = {}) {
    if (filter) {
      const tools = element('div', 'table-tools');
      const label = element('label', 'filter-label');
      label.append(element('span', '', 'Estado'));
      const select = element('select', 'status-filter');
      select.setAttribute('aria-label', 'Filtrar por estado');
      for (const value of ['Todos los estados', 'Verificado local', 'Pendiente', 'En revisión', 'Inconsistencia', 'Observado', 'En cuarentena']) select.append(new Option(value, value === 'Todos los estados' ? '' : value));
      label.append(select);
      tools.append(element('strong', '', `${rows.length} ${rows.length === 1 ? 'resultado' : 'resultados'}`), label);
      main.append(tools);
    }
    const container = element('div', 'table-card');
    const table = element('table', 'records-table');
    const head = element('thead');
    const header = element('tr');
    for (const text of ['ID bulto / guía', 'Producto', 'Lote / vencimiento', 'Cantidad', 'Estado de revisión', '']) header.append(element('th', '', text));
    head.append(header);
    const body = element('tbody');
    for (const record of rows) {
      const row = element('tr');
      row.dataset.search = [record.guide, record.package, record.supplier, record.product, record.lot, record.status, record.note].join(' ').toLocaleLowerCase('es');
      row.dataset.status = record.status;
      const guide = element('td', 'guide-cell');
      guide.append(element('strong', '', record.guide), element('span', '', `${record.package} · ${record.supplier}`));
      const product = element('td', 'product-cell');
      product.append(element('strong', '', record.product), element('span', '', record.presentation));
      const lot = element('td', 'lot-cell');
      lot.append(element('strong', '', record.lot), element('span', '', `Vence ${record.expiry}`));
      const quantity = element('td', 'quantity-cell');
      quantity.append(element('strong', '', record.quantity), element('span', '', 'Unidades comerciales'));
      const status = element('td');
      const pill = element('span', `status-pill ${statusClass(record.status)}`);
      pill.append(icon(record.status === 'Verificado local' ? 'check' : record.status === 'Inconsistencia' || record.status === 'Observado' ? 'warning' : 'info'), element('span', '', record.status));
      status.append(pill, element('span', 'status-note', statusExplanation(record)));
      const action = element('td');
      action.append(button(record.status === 'Verificado local' ? 'Ver detalle' : 'Revisar lote', 'button button-small', () => showDetails(record)));
      row.append(guide, product, lot, quantity, status, action);
      body.append(row);
    }
    table.append(head, body);
    container.append(table);
    main.append(container);
    if (filter) {
      const search = document.querySelector('.global-search input');
      const select = document.querySelector('.status-filter');
      const apply = () => filterTable(table, search?.value || '', select?.value || '');
      select.addEventListener('change', apply);
      apply();
    }
  }

  function filterTable(table, query, status) {
    const words = query.toLocaleLowerCase('es').trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const row of table.tBodies[0].rows) {
      const matches = words.every(word => row.dataset.search.includes(word)) && (!status || row.dataset.status === status);
      row.hidden = !matches;
      if (matches) visible++;
    }
    const count = document.querySelector('.table-tools > strong');
    if (count) count.textContent = `${visible} ${visible === 1 ? 'resultado' : 'resultados'}`;
  }

  function exportRecords() {
    const rows = records.map(record => [record.guide, record.package, record.product, record.lot, record.expiry, record.quantity, record.status]);
    const csv = [['Guía', 'Bulto', 'Producto', 'Lote', 'Vencimiento', 'Cantidad', 'Estado'], ...rows]
      .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = element('a');
    link.href = url;
    link.download = 'MedAlert-registros.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function addFormField(container, label, name, value = '', options = {}) {
    const wrapper = element('label', `form-field${options.wide ? ' form-field-wide' : ''}`);
    wrapper.append(element('span', '', label));
    const input = element(options.multiline ? 'textarea' : 'input');
    input.name = name;
    input.value = value || '';
    input.required = Boolean(options.required);
    if (options.type) input.type = options.type;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (options.pattern) input.pattern = options.pattern;
    if (options.min) input.min = options.min;
    if (options.rows) input.rows = options.rows;
    wrapper.append(input);
    container.append(wrapper);
    return input;
  }

  function addFormPanel(main, title, description) {
    const panel = element('section', 'workflow-card form-panel');
    panel.append(element('div', 'eyebrow', 'Registro manual en este dispositivo'), element('h2', '', title), element('p', '', description));
    main.append(panel);
    return panel;
  }

  function addFieldset(form, title, description) {
    const fieldset = element('fieldset', 'form-fieldset');
    fieldset.append(element('legend', '', title));
    if (description) fieldset.append(element('p', 'form-help', description));
    form.append(fieldset);
    return fieldset;
  }

  function addLocalOnlyNotice(parent, text = 'No se ejecuta OCR ni se consultan fuentes oficiales. Verifica los datos en sus documentos originales.') {
    const notice = element('p', 'local-only-notice');
    notice.setAttribute('role', 'note');
    notice.append(icon('info'), element('span', '', text));
    parent.append(notice);
  }

  function renderQuickCapture(main) {
    const panel = addFormPanel(main, 'Nueva recepción · añadir bultos', 'Ingresa una guía nueva. Puedes guardar un bulto o añadir varios bultos de la misma guía.');
    const form = element('form', 'data-form');
    const guideFields = addFieldset(form, 'Guía y recepción', 'Usa los datos de la guía física.');
    addFormField(guideFields, 'Número de guía', 'guide', quickDraft.guide || '', { required: true, placeholder: 'Ej. GR-2026-1051' });
    addFormField(guideFields, 'Proveedor', 'supplier', quickDraft.supplier || '', { required: true });
    addFormField(guideFields, 'Cantidad recibida', 'quantity', '1 caja', { required: true });
    const packageFields = addFieldset(form, 'Datos impresos en el empaque', 'Ingresa los datos manualmente; esta web no ejecuta OCR.');
    addFormField(packageFields, 'Producto y concentración', 'product', '', { required: true });
    addFormField(packageFields, 'Presentación', 'presentation', '', { required: true });
    addFormField(packageFields, 'Fabricante', 'manufacturer', '', { required: true });
    addFormField(packageFields, 'Lote', 'lot', '', { required: true });
    addFormField(packageFields, 'Vencimiento (MM/AAAA)', 'expiry', '', { required: true, pattern: '(0[1-9]|1[0-2])\\/([0-9]{4})', placeholder: 'MM/AAAA' });
    addFormField(packageFields, 'Registro sanitario impreso', 'registration', '', { required: true });
    const documentFields = addFieldset(form, 'Datos según la guía', 'Se usarán para comparar manualmente los datos de recepción.');
    addFormField(documentFields, 'Producto en la guía', 'documentProduct', '', { required: true });
    addFormField(documentFields, 'Lote en la guía', 'documentLot', '', { required: true });
    addFormField(documentFields, 'Vencimiento en la guía (MM/AAAA)', 'documentExpiry', '', { required: true, pattern: '(0[1-9]|1[0-2])\\/([0-9]{4})', placeholder: 'MM/AAAA' });
    addFormField(documentFields, 'Fabricante en la guía', 'documentManufacturer', '', { required: true });
    addFormField(documentFields, 'Registro en la guía', 'documentRegistration', '', { required: true });
    const actions = element('div', 'form-actions');
    const addAndContinue = element('button', 'button button-primary', 'Guardar bulto y abrir checklist');
    addAndContinue.type = 'submit';
    addAndContinue.value = 'checklist';
    const addNext = element('button', 'button button-secondary', 'Guardar y añadir siguiente');
    addNext.type = 'submit';
    addNext.value = 'next';
    actions.append(addAndContinue, addNext);
    form.append(actions);
    panel.append(form);
    addLocalOnlyNotice(panel, 'Datos almacenados solo en este navegador. El nombre del registro no representa una verificación sanitaria.');
    const recordsHeading = element('div', 'section-heading');
    recordsHeading.append(element('h2', '', 'Bultos registrados'), element('span', '', `${records.length} en este dispositivo`));
    main.append(recordsHeading);
    makeTable(main, records);
    form.addEventListener('input', () => {
      quickDraft.guide = form.elements.guide.value;
      quickDraft.supplier = form.elements.supplier.value;
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const sameGuideCount = records.filter(record => record.guide === data.guide).length + 1;
      const record = normalizeRecord({
        id: makeId(),
        guide: data.guide.trim(),
        package: `Bulto ${String(sameGuideCount).padStart(2, '0')}`,
        supplier: data.supplier.trim(),
        product: data.product.trim(),
        presentation: data.presentation.trim(),
        manufacturer: data.manufacturer.trim(),
        registration: data.registration.trim(),
        lot: data.lot.trim(),
        expiry: data.expiry.trim(),
        quantity: data.quantity.trim(),
        document: {
          product: data.documentProduct.trim(),
          lot: data.documentLot.trim(),
          expiry: data.documentExpiry.trim(),
          manufacturer: data.documentManufacturer.trim(),
          registration: data.documentRegistration.trim()
        },
        status: 'Pendiente',
        note: 'Pendiente de checklist y contraste manual.',
        checks: defaultChecks(),
        inspection: [],
        alerts: [],
        actions: [],
        createdAt: new Date().toISOString()
      }, records.length);
      records.unshift(record);
      selectedRecordId = record.id;
      persistState();
      if (event.submitter?.value === 'next') {
        announce(`${record.package} guardado localmente. Puedes registrar el siguiente bulto.`);
        render(currentId, navigate);
      } else {
        navigate('37:292');
      }
    });
  }

  function renderChecklist(main) {
    const record = selectedRecord();
    const layout = element('section', 'checklist-layout');
    layout.setAttribute('aria-label', 'Lista de comprobaciones de recepción');
    const list = element('div', 'checklist-items');
    for (const check of record.checks) {
      const row = element('label', `check-row${check.done ? ' is-done' : ''}`);
      const input = element('input', 'check-input');
      input.type = 'checkbox';
      input.checked = check.done;
      input.setAttribute('aria-label', check.title);
      const mark = element('span', 'check-mark');
      mark.setAttribute('aria-hidden', 'true');
      mark.append(icon('check'));
      const copy = element('span', 'check-copy');
      copy.append(element('strong', '', check.title), element('small', '', check.description));
      const state = element('span', `check-state${check.done ? ' is-done' : ''}`);
      state.append(icon(check.done ? 'check' : 'info'), element('span', '', check.done ? 'Hecha' : 'Pendiente'));
      row.append(input, mark, copy, state);
      input.addEventListener('change', () => {
        check.done = input.checked;
        row.classList.toggle('is-done', check.done);
        state.classList.toggle('is-done', check.done);
        state.replaceChildren(icon(check.done ? 'check' : 'info'), element('span', '', check.done ? 'Hecha' : 'Pendiente'));
        if (!check.done && record.status === 'Verificado local') {
          record.status = 'En revisión';
          record.note = 'Checklist modificado; requiere nueva revisión.';
        }
        persistState();
        updateProgress();
      });
      list.append(row);
    }

    const aside = element('aside', 'checklist-aside');
    const progressCard = element('section', 'progress-card');
    progressCard.append(element('h2', '', `Avance · ${record.package}`));
    const count = element('p', 'progress-count');
    const progress = element('div', 'progress-track');
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Avance de la revisión');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', String(record.checks.length));
    const fill = element('span', 'progress-fill');
    progress.append(fill);
    progressCard.append(count, progress);

    const notice = element('section', 'checklist-notice');
    notice.append(icon('info'), element('div', 'notice-copy'));
    const noticeTitle = element('strong');
    const noticeText = element('p');
    notice.lastChild.append(noticeTitle, noticeText);
    aside.append(progressCard, notice);
    layout.append(list, aside);
    main.append(layout);
    addLocalOnlyNotice(main, 'Checklist de revisión manual. Completarla no equivale a una consulta oficial ni a una aprobación sanitaria.');

    function updateProgress() {
      const complete = record.checks.filter(check => check.done).length;
      count.textContent = `${complete} de ${record.checks.length} comprobaciones hechas`;
      fill.style.width = `${complete / record.checks.length * 100}%`;
      progress.setAttribute('aria-valuenow', String(complete));
      const completeList = complete === record.checks.length;
      notice.classList.toggle('is-complete', completeList);
      noticeTitle.textContent = completeList ? 'Lista completa' : 'Sin todas las comprobaciones';
      noticeText.textContent = completeList
        ? 'El bulto está listo para el contraste manual.'
        : 'Completa todas las comprobaciones antes de continuar.';
      const next = document.querySelector('#continue-checklist');
      if (next) next.disabled = !completeList;
    }
    updateProgress();
  }

  function compareRecord(record) {
    const fields = [
      ['Producto', 'product', record.product],
      ['Presentación', 'presentation', record.presentation],
      ['Fabricante', 'manufacturer', record.manufacturer],
      ['Lote', 'lot', record.lot],
      ['Vencimiento', 'expiry', record.expiry],
      ['Registro sanitario', 'registration', record.registration]
    ];
    const rows = fields.map(([label, key, packageValue]) => {
      const documentValue = record.document[key] || '';
      const hasPackage = Boolean(packageValue?.trim());
      const hasDocument = Boolean(documentValue.trim());
      const hasBoth = hasPackage && hasDocument;
      const matches = hasBoth && packageValue.trim().toLocaleLowerCase('es') === documentValue.trim().toLocaleLowerCase('es');
      return { label, key, packageValue: packageValue || 'Sin dato', documentValue: documentValue || 'Sin dato', hasPackage, hasDocument, hasBoth, matches };
    });
    const requiredMissing = rows.some(row => row.hasPackage !== row.hasDocument)
      || ['product', 'lot'].some(key => !record.document[key]?.trim() || !record[key]?.trim());
    const mismatches = rows.filter(row => row.hasBoth && !row.matches);
    return { rows, requiredMissing, mismatches };
  }

  function renderComparison(main) {
    const record = selectedRecord();
    const panel = addFormPanel(main, `Contraste · ${record.product}`, 'Compara manualmente los datos del empaque con la documentación de recepción.');
    const result = compareRecord(record);
    const table = element('div', 'comparison-list');
    const header = element('div', 'comparison-header');
    for (const text of ['Dato', 'Empaque', 'Guía', 'Resultado']) header.append(element('span', '', text));
    table.append(header);
    for (const row of result.rows) {
      const item = element('div', `comparison-row${row.hasBoth ? row.matches ? ' match' : ' mismatch' : ' missing'}`);
      item.append(element('strong', '', row.label), element('span', '', row.packageValue), element('span', '', row.documentValue));
      const status = element('span', 'comparison-status');
      const statusLabel = row.hasBoth ? row.matches ? 'Coincide' : 'Diferencia' : 'Sin dato';
      status.append(
        icon(row.hasBoth ? row.matches ? 'check' : 'warning' : 'info'),
        element('span', '', statusLabel),
        element('small', '', row.hasBoth
          ? row.matches ? 'El dato del empaque coincide con la guía.' : 'Revisa la diferencia antes de continuar.'
          : 'Completa el dato faltante para contrastarlo.')
      );
      item.append(status);
      table.append(item);
    }
    panel.append(table);
    const form = element('form', 'data-form');
    const documentFields = addFieldset(form, 'Corregir datos de la guía', 'Edita solo con la información que aparece en el documento recibido.');
    for (const [label, key, required] of [
      ['Producto', 'product', true],
      ['Presentación', 'presentation', false],
      ['Fabricante', 'manufacturer', false],
      ['Lote', 'lot', true],
      ['Vencimiento (MM/AAAA)', 'expiry', false],
      ['Registro sanitario', 'registration', false]
    ]) {
      addFormField(documentFields, label, key, record.document[key], {
        required,
        pattern: key === 'expiry' ? '(0[1-9]|1[0-2])\\/([0-9]{4})' : undefined,
        placeholder: key === 'expiry' ? 'MM/AAAA' : ''
      });
    }
    const save = element('button', 'button button-secondary', 'Guardar datos de guía');
    save.type = 'submit';
    form.append(save);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      record.document = { ...record.document, ...data };
      record.comparisonAt = new Date().toISOString();
      persistState();
      announce('Datos de guía guardados en este dispositivo.');
      render(currentId, navigate);
    });
    panel.append(form);
    const confirm = button('Guardar contraste y clasificar', 'button button-primary', () => {
      const checksComplete = record.checks.every(check => check.done);
      const comparison = compareRecord(record);
      if (!checksComplete) {
        announce('Completa primero las seis comprobaciones de recepción.');
        return;
      }
      if (comparison.requiredMissing || comparison.mismatches.length) {
        record.status = 'Inconsistencia';
        const reasons = comparison.mismatches.map(row => row.label);
        if (comparison.requiredMissing) reasons.push('faltan datos en empaque o guía');
        record.note = `Diferencias o datos incompletos: ${reasons.join(', ')}.`;
      } else {
        record.status = 'Verificado local';
        record.note = 'Coincidencia manual con la guía; sin consulta a fuentes oficiales.';
      }
      record.comparisonAt = new Date().toISOString();
      persistState();
      announce(record.status === 'Verificado local'
        ? 'Contraste manual completo. No se consultaron fuentes oficiales.'
        : 'Se encontraron diferencias o datos incompletos. El bulto no pasa al inventario.');
      render(currentId, navigate);
    });
    confirm.disabled = !record.checks.every(check => check.done);
    panel.append(confirm, button('Registrar inspección', 'button button-secondary', () => selectRecord(record, '37:579')));
    addLocalOnlyNotice(panel, 'Este contraste es manual y solo compara empaque con guía. No verifica la autenticidad del registro sanitario ni consulta fuentes oficiales.');
  }

  function renderInspection(main) {
    const record = selectedRecord();
    const panel = addFormPanel(main, `Inspección · ${record.package}`, 'Registra las señales observadas directamente en el empaque.');
    const form = element('form', 'data-form');
    const fieldset = addFieldset(form, 'Condiciones del empaque', 'Marca todas las señales que observes. No selecciones ninguna si no encuentras daños.');
    const choices = [
      ['golpes', 'Golpes, abolladuras o deformación'],
      ['humedad', 'Humedad, manchas o filtraciones'],
      ['abierto', 'Sellos abiertos o manipulados'],
      ['etiqueta', 'Etiqueta ilegible, alterada o incompleta'],
      ['almacenamiento', 'Condición de almacenamiento inadecuada']
    ];
    for (const [id, label] of choices) {
      const choice = element('label', 'choice-row');
      const input = element('input');
      input.type = 'checkbox';
      input.name = 'inspection';
      input.value = id;
      input.checked = record.inspection.includes(id);
      choice.append(input, element('span', '', label));
      fieldset.append(choice);
    }
    addFormField(fieldset, 'Observación adicional', 'inspectionNote', record.inspectionNote, { multiline: true, rows: 3, wide: true });
    const save = element('button', 'button button-primary', 'Guardar inspección');
    save.type = 'submit';
    form.append(save);
    form.addEventListener('submit', event => {
      event.preventDefault();
      record.inspection = [...form.querySelectorAll('input[name="inspection"]:checked')].map(input => input.value);
      record.inspectionNote = form.elements.inspectionNote.value.trim();
      record.inspectionAt = new Date().toISOString();
      if (record.inspection.length) {
        record.status = 'Inconsistencia';
        record.note = `Señales del empaque: ${record.inspection.join(', ')}.`;
      }
      persistState();
      announce('Inspección guardada localmente.');
      render(currentId, navigate);
    });
    panel.append(form, button('Ver alertas y clasificación', 'button button-secondary', () => selectRecord(record, '37:682')));
    addLocalOnlyNotice(panel, 'La inspección depende de lo que registre la persona usuaria; no es una evaluación automática por IA.');
  }

  function getRisk(record) {
    const comparison = compareRecord(record);
    const factors = [];
    if (comparison.mismatches.length) factors.push(`Diferencias en: ${comparison.mismatches.map(row => row.label.toLowerCase()).join(', ')}.`);
    if (record.inspection.length) factors.push(`Señales de empaque: ${record.inspection.join(', ')}.`);
    const expiryMatch = /^(\d{2})\/(\d{4})$/.exec(record.expiry || '');
    if (expiryMatch) {
      const expiryDate = new Date(Number(expiryMatch[2]), Number(expiryMatch[1]), 0);
      const today = new Date();
      if (expiryDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) factors.push('La fecha de vencimiento ya pasó.');
    }
    if (['Observado', 'En cuarentena', 'Inconsistencia'].includes(record.status)) factors.push(record.note || `Estado: ${record.status}.`);
    const missing = ['product', 'lot'].some(key => !record[key]?.trim() || !record.document[key]?.trim());
    const incompleteChecklist = record.checks.some(check => !check.done);
    if (missing) factors.push('Faltan datos de producto o lote para completar el contraste.');
    if (incompleteChecklist) factors.push('El checklist de recepción está incompleto.');
    const high = comparison.mismatches.length > 0 || record.inspection.length > 0
      || factors.some(factor => factor.includes('vencimiento ya pasó'))
      || ['Observado', 'En cuarentena', 'Inconsistencia'].includes(record.status);
    const level = high ? 'Alto' : missing || incompleteChecklist ? 'Medio' : 'Bajo';
    return { level, factors, source: 'Reglas locales de demostración' };
  }

  function renderAlerts(main) {
    const record = selectedRecord();
    const risk = getRisk(record);
    const panel = addFormPanel(main, `Alertas y clasificación · ${record.product}`, `Producto ${record.product} · Lote ${record.lot || 'sin dato'}`);
    const result = element('section', `risk-card risk-${risk.level.toLowerCase()}`);
    result.append(icon(risk.level === 'Alto' ? 'warning' : 'info'), element('span', 'eyebrow', 'Clasificación orientativa local'), element('h2', '', `Riesgo ${risk.level}`));
    result.append(element('p', '', risk.factors.length ? risk.factors.join(' ') : 'No se registraron diferencias manuales ni señales de empaque.'));
    panel.append(result);
    addLocalOnlyNotice(panel, 'Clasificación calculada con reglas locales sobre datos ingresados. No es diagnóstico, evaluación oficial ni consulta de alertas sanitarias.');
    const alerts = element('section', 'report-panel');
    alerts.append(element('h2', '', 'Alertas internas de este bulto'));
    if (!record.alerts.length) alerts.append(element('p', '', 'Aún no se registraron alertas manuales.'));
    for (const alert of record.alerts) {
      const item = element('article', 'alert-item');
      item.append(element('strong', '', alert.title), element('p', '', alert.description), element('small', '', new Date(alert.createdAt).toLocaleString('es')));
      alerts.append(item);
    }
    const alertForm = element('form', 'data-form');
    const alertFields = addFieldset(alertForm, 'Registrar alerta interna', 'Esta alerta queda asociada al producto y lote en este dispositivo.');
    addFormField(alertFields, 'Título', 'title', '', { required: true });
    addFormField(alertFields, 'Descripción', 'description', '', { required: true, multiline: true, rows: 3, wide: true });
    const addAlert = element('button', 'button button-secondary', 'Guardar alerta interna');
    addAlert.type = 'submit';
    alertForm.append(addAlert);
    alertForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!alertForm.reportValidity()) return;
      const data = Object.fromEntries(new FormData(alertForm).entries());
      record.alerts.push({ title: data.title.trim(), description: data.description.trim(), createdAt: new Date().toISOString() });
      persistState();
      announce('Alerta interna guardada; no fue enviada a ninguna autoridad.');
      render(currentId, navigate);
    });
    alerts.append(alertForm);
    panel.append(alerts);
    panel.append(button('Marcar producto como observado', 'button button-primary', () => selectRecord(record, '41:166')));
  }

  function renderObservation(main) {
    const record = selectedRecord();
    const panel = addFormPanel(main, `Marcar como observado · ${record.product}`, `Producto ${record.product} · Lote ${record.lot || 'sin dato'}`);
    const form = element('form', 'data-form');
    const fields = addFieldset(form, 'Motivo de observación', 'El producto quedará fuera del inventario hasta que se tome una acción.');
    addFormField(fields, 'Describe la irregularidad observada', 'reason', record.observedNote, { required: true, multiline: true, rows: 4, wide: true });
    const save = element('button', 'button button-primary', 'Guardar como observado');
    save.type = 'submit';
    form.append(save);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const reason = form.elements.reason.value.trim();
      if (!reason) {
        form.elements.reason.setCustomValidity('Describe brevemente el motivo.');
        form.reportValidity();
        form.elements.reason.setCustomValidity('');
        return;
      }
      record.status = 'Observado';
      record.observedNote = reason;
      record.note = reason;
      record.observedAt = new Date().toISOString();
      persistState();
      announce('Producto observado y excluido del inventario local.');
      navigate('41:414');
    });
    panel.append(form);
    addLocalOnlyNotice(panel, 'El estado solo se guarda en este navegador. Avisa al responsable de calidad según el procedimiento de tu farmacia.');
  }

  function renderAction(main) {
    const record = selectedRecord();
    const panel = addFormPanel(main, `Registrar acción · ${record.product}`, `Deja constancia de la medida adoptada para el lote ${record.lot || 'sin dato'}.`);
    const form = element('form', 'data-form');
    const fields = addFieldset(form, 'Acción adoptada', 'La constancia quedará asociada a este producto y lote.');
    const label = element('label', 'form-field');
    label.append(element('span', '', 'Medida'));
    const select = element('select');
    select.name = 'action';
    for (const [value, text] of [
      ['quarantine', 'Separar en cuarentena'],
      ['return', 'Gestionar devolución al proveedor'],
      ['hold', 'Retener hasta recibir documentación'],
      ['notify', 'Notificar al responsable de calidad'],
      ['other', 'Otra medida']
    ]) select.append(new Option(text, value));
    label.append(select);
    fields.append(label);
    addFormField(fields, 'Detalle y responsable de seguimiento', 'description', '', { required: true, multiline: true, rows: 4, wide: true });
    const save = element('button', 'button button-primary', 'Guardar acción y generar constancia');
    save.type = 'submit';
    form.append(save);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const description = form.elements.description.value.trim();
      if (!description) {
        form.elements.description.setCustomValidity('Añade el detalle de la medida.');
        form.reportValidity();
        form.elements.description.setCustomValidity('');
        return;
      }
      const action = {
        type: form.elements.action.value,
        label: form.elements.action.selectedOptions[0].textContent,
        description,
        createdAt: new Date().toISOString()
      };
      record.actions.push(action);
      record.note = `${action.label}: ${description}`;
      if (action.type === 'quarantine') record.status = 'En cuarentena';
      persistState();
      navigate('41:679');
    });
    panel.append(form);
    addLocalOnlyNotice(panel, 'El registro es local y no sustituye un reporte formal ni se envía al proveedor o a una autoridad.');
  }

  function renderConstancy(main) {
    const record = selectedRecord();
    const panel = addFormPanel(main, 'Constancia de revisión local', `${record.product} · ${record.lot || 'Lote sin dato'} · ${record.guide}`);
    const latestAction = record.actions[record.actions.length - 1];
    const details = [
      ['Estado', record.status],
      ['Proveedor', record.supplier],
      ['Fabricante ingresado', record.manufacturer],
      ['Vencimiento', record.expiry],
      ['Checklist', `${record.checks.filter(check => check.done).length} de ${record.checks.length}`],
      ['Inspección', record.inspection.length ? record.inspection.join(', ') : 'Sin señales registradas'],
      ['Observación', record.observedNote || 'Sin observación']
    ];
    for (const [label, value] of details) {
      const row = element('p', 'detail-row');
      row.append(element('strong', '', label), element('span', '', value));
      panel.append(row);
    }
    if (latestAction) {
      const action = element('section', 'report-panel');
      action.append(element('h2', '', latestAction.label), element('p', '', latestAction.description), element('small', '', new Date(latestAction.createdAt).toLocaleString('es')));
      panel.append(action);
    } else {
      panel.append(element('p', 'form-help', 'Todavía no hay una acción registrada para este producto.'));
    }
    const print = button('Imprimir constancia', 'button button-secondary', () => {
      const lines = [
        'MedAlert · Constancia de revisión local',
        `Producto: ${record.product}`,
        `Lote: ${record.lot || 'Sin dato'}`,
        `Guía: ${record.guide}`,
        `Estado: ${record.status}`,
        `Observación: ${record.observedNote || 'Sin observación'}`,
        latestAction ? `Acción: ${latestAction.label} — ${latestAction.description}` : 'Acción: no registrada',
        'Datos ingresados localmente; no es una consulta ni certificación oficial.'
      ];
      document.querySelector('#print-report').textContent = lines.join('\n');
      window.print();
    });
    panel.append(print, button('Volver a recepción', 'button button-primary', () => navigate('2:5027')));
    addLocalOnlyNotice(panel, 'Constancia local de demostración; no es un documento sanitario oficial.');
  }

  function renderWorkflow(main, id) {
    if (id === '37:166') return renderQuickCapture(main);
    if (id === '37:435') return renderComparison(main);
    if (id === '37:579') return renderInspection(main);
    if (id === '37:682') return renderAlerts(main);
    if (id === '41:166') return renderObservation(main);
    if (id === '41:414') return renderAction(main);
    if (id === '41:679') return renderConstancy(main);
    const [title, description, actionLabel, destination] = workflows[id] || ['Flujo de recepción', 'Continúa con la revisión de los registros.', 'Volver a recepción', '2:5027'];
    const card = element('section', 'workflow-card');
    card.append(element('span', 'workflow-icon', id.startsWith('41:') ? '!' : '✓'), element('div', 'eyebrow', 'Flujo de trabajo'));
    card.append(element('h2', '', title), element('p', '', description));
    card.append(button(actionLabel, 'button button-primary', () => navigate(destination)));
    main.append(card);
    if (id === '2:5251') makeTable(main, records.slice(0, 3));
  }

  function render(id, onNavigate) {
    currentId = id;
    navigate = onNavigate;
    const root = document.querySelector('#web-app');
    const route = routes[id];
    if (!root || !route) return false;
    root.classList.remove('consumer-mode');
    if (persistenceWarning) {
      announce(persistenceWarning);
      persistenceWarning = '';
    }
    root.hidden = false;
    document.body.classList.add('native-web');
    const main = makeShell(root, route);
    if (id === '2:5027') {
      makeStats(main);
      const alert = element('div', 'alert-banner');
      alert.append(icon('warning'), element('p', '', `${records.filter(recordNeedsReview).length} bultos requieren revisión local. Los datos no están verificados por fuentes oficiales.`));
      main.append(alert);
      const title = element('div', 'section-heading');
      title.append(element('h2', '', 'Bultos en recepción'), element('span', '', 'Datos de ejemplo y registros de este dispositivo'));
      title.append(button('Restablecer datos locales', 'button button-secondary', resetLocalData));
      main.append(title);
      makeTable(main, records);
      main.append(element('p', 'disclaimer', 'El estado “Verificado local” solo indica una comparación manual en este navegador; no representa una consulta oficial.'));
    } else if (id === '50:166' || id === '50:582' || id === '42:166') {
      let rows = records;
      if (id === '50:166') rows = records.filter(record => record.status === 'Verificado local');
      if (id === '50:582') rows = records.filter(record => ['Observado', 'En cuarentena'].includes(record.status));
      const section = element('div', 'section-heading');
      section.append(element('h2', '', id === '50:582' ? 'Productos observados o en cuarentena' : id === '50:166' ? 'Lotes con revisión local completa' : 'Registros de este dispositivo'), element('span', '', `${rows.length} registros`));
      main.append(section);
      if (id === '50:166') addLocalOnlyNotice(main, 'El inventario muestra solo bultos con checklist completo y contraste manual sin diferencias. No se consultan fuentes oficiales.');
      if (id === '50:582' && !rows.length) {
        const empty = element('section', 'empty-state');
        empty.append(element('h2', '', 'No hay productos observados ni en cuarentena'), element('p', '', 'El contador solo incluye bultos marcados como observados o separados en cuarentena. Los pendientes e inconsistencias siguen en recepción.'));
        empty.append(button('Ir a recepción', 'button button-primary', () => navigate('2:5027')));
        main.append(empty);
      } else {
        makeTable(main, rows, { filter: id !== '50:166' });
      }
    } else if (id === '42:488') {
      makeStats(main);
      const panel = element('section', 'report-panel');
      panel.append(element('h2', '', 'Actividad de recepción'), element('p', '', 'Resumen de los registros de ejemplo disponibles en esta sesión.'));
      const bars = element('div', 'report-bars');
      for (const [label, value, type] of [['Revisión local completa', records.filter(item => item.status === 'Verificado local').length, 'success'], ['Requieren revisión', records.filter(recordNeedsReview).length, 'warning']]) {
        const row = element('div', 'bar-row');
        row.append(element('span', '', label));
        const track = element('div', 'bar-track');
        const fill = element('span', `bar-fill ${type}`);
        fill.style.width = `${Math.max(14, value / records.length * 100)}%`;
        track.append(fill);
        row.append(track, element('strong', '', String(value)));
        bars.append(row);
      }
      panel.append(bars);
      main.append(panel);
    } else if (id === '42:723') {
      const panel = element('section', 'table-card permissions-card');
      const table = element('table', 'records-table');
      const head = element('thead');
      const header = element('tr');
      for (const text of ['Permiso', 'Administrador', 'Farmacéutico titular', 'Consulta']) header.append(element('th', '', text));
      head.append(header);
      const body = element('tbody');
      for (const [name, values] of [['Consultar inventario', ['Sí', 'Sí', 'Sí']], ['Registrar recepción', ['Sí', 'Sí', 'No']], ['Registrar irregularidades', ['Sí', 'Sí', 'No']], ['Gestionar permisos', ['Sí', 'No', 'No']]]) {
        const row = element('tr');
        row.append(element('td', 'product-cell', name));
        for (const value of values) row.append(element('td', `permission ${value === 'Sí' ? 'allowed' : 'blocked'}`, value));
        body.append(row);
      }
      table.append(head, body);
      panel.append(table);
      main.append(panel);
    } else if (id === '37:292') {
      renderChecklist(main);
    } else if (workflows[id]) {
      renderWorkflow(main, id);
    } else {
      renderWorkflow(main, id);
    }
    return true;
  }

  function leave() {
    const picker = document.querySelector('.picker');
    const toolbar = document.querySelector('.toolbar');
    const edition = toolbar?.querySelector('.edition');
    if (picker && toolbar && edition) toolbar.insertBefore(picker, edition);
    document.body.classList.remove('native-web');
    const root = document.querySelector('#web-app');
    if (root) {
      root.classList.remove('consumer-mode');
      root.hidden = true;
    }
  }

  return { render, leave, icon };
})();
