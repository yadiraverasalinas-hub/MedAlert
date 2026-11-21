'use strict';

window.MedAlertWeb = (() => {
  const records = [
    { guide: 'GR-2026-1048', package: 'Bulto 01', supplier: 'Andina Pharma', product: 'Amoxicilina 500 mg', presentation: 'Cápsulas · Caja x 100', lot: '#88392-B', expiry: '11/2027', quantity: '120 cajas', status: 'Inconsistencia', note: 'Revisión manual requerida' },
    { guide: 'GR-2026-1048', package: 'Bulto 02', supplier: 'Andina Pharma', product: 'Ibuprofeno 400 mg', presentation: 'Tabletas · Caja x 20', lot: 'IB-2408', expiry: '06/2028', quantity: '80 cajas', status: 'Verificado', note: 'Datos legibles y completos' },
    { guide: 'GR-2026-1049', package: 'Bulto 03', supplier: 'Salud Distrib.', product: 'Paracetamol 500 mg', presentation: 'Tabletas · Caja x 100', lot: 'PC-2609', expiry: '09/2028', quantity: '200 cajas', status: 'Verificado', note: 'Datos legibles y completos' },
    { guide: 'GR-2026-1049', package: 'Bulto 04', supplier: 'Salud Distrib.', product: 'Loratadina 10 mg', presentation: 'Tabletas · Caja x 10', lot: 'LR-091', expiry: '03/2028', quantity: '60 cajas', status: 'Verificado', note: 'Datos legibles y completos' },
    { guide: 'GR-2026-1050', package: 'Bulto 05', supplier: 'Medifarma Sur', product: 'Omeprazol 20 mg', presentation: 'Cápsulas · Caja x 30', lot: 'OM-6621', expiry: '12/2027', quantity: '90 cajas', status: 'Inconsistencia', note: 'Revisión manual requerida' },
    { guide: 'GR-2026-1050', package: 'Bulto 06', supplier: 'Medifarma Sur', product: 'Losartán 50 mg', presentation: 'Tabletas · Caja x 30', lot: 'LS-3026', expiry: '07/2028', quantity: '100 cajas', status: 'Verificado', note: 'Datos legibles y completos' }
  ];

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
  const checks = [
    { title: 'Empaque exterior íntegro', description: 'Sin golpes, humedad ni cintas violadas.', done: true },
    { title: 'Guía de remisión presente', description: 'GR-2026-1048 coincide con el bulto.', done: true },
    { title: 'Lote impreso y legible', description: 'Lectura OCR sin diferencias.', done: true },
    { title: 'Fecha de vencimiento vigente', description: 'Vence 11/2027.', done: true },
    { title: 'Registro sanitario visible', description: 'Código EN-01234 en la caja.', done: false },
    { title: 'Condiciones de almacenamiento', description: 'Temperatura registrada en recepción.', done: false }
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

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
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
  const statusClass = status => status === 'Inconsistencia' ? 'danger' : status === 'En cuarentena' ? 'warning' : 'success';

  function announce(text) {
    const box = document.querySelector('#feedback');
    box.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.textContent = ''; }, 4000);
  }

  function showDetails(record) {
    const dialog = document.querySelector('#details');
    dialog.querySelector('h2').textContent = record.product;
    const body = dialog.querySelector('.details-body');
    body.replaceChildren();
    const fields = [
      ['Guía', record.guide], ['Bulto', record.package], ['Proveedor', record.supplier],
      ['Lote', record.lot], ['Vencimiento', record.expiry], ['Cantidad', record.quantity],
      ['Estado', record.status], ['Observación', record.note]
    ];
    for (const [label, value] of fields) {
      const row = element('p', 'detail-row');
      row.append(element('strong', '', label), element('span', '', value));
      body.append(row);
    }
    if (record.status !== 'Verificado' && record.status !== 'En cuarentena') {
      body.append(button('Enviar a cuarentena', 'button button-primary', () => {
        record.status = 'En cuarentena';
        record.note = 'Pendiente de revisión manual';
        dialog.close();
        render(currentId, navigate);
        announce('Lote separado para revisión.');
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
      if (id === '50:582') link.append(element('span', 'nav-count', String(records.filter(item => item.status !== 'Verificado').length)));
      navList.append(link);
    }
    sidebar.append(navList);
    const sidebarNote = element('div', 'sidebar-note');
    sidebarNote.append(element('span', 'note-mark', 'i'), element('div', '', 'Entorno académico · Datos de ejemplo'));
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
      intro.append(button('＋  Nueva recepción', 'button button-primary', () => navigate('37:166')));
    } else if (currentId === '37:292') {
      const next = button('Continuar al contraste', 'button button-primary', () => navigate('37:435'));
      next.prepend(icon('arrow'));
      intro.append(next);
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
      ['Bultos recibidos', String(records.length), '3 guías · Hoy', 'blue'],
      ['OCR verificado', String(records.filter(item => item.status === 'Verificado').length), 'Lectura consistente', 'green'],
      ['Requieren revisión', String(records.filter(item => item.status !== 'Verificado').length), 'No ingresar al inventario', 'amber']
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
      for (const value of ['Todos los estados', 'Verificado', 'Inconsistencia', 'En cuarentena']) select.append(new Option(value, value === 'Todos los estados' ? '' : value));
      label.append(select);
      tools.append(element('strong', '', `${rows.length} ${rows.length === 1 ? 'resultado' : 'resultados'}`), label);
      main.append(tools);
    }
    const container = element('div', 'table-card');
    const table = element('table', 'records-table');
    const head = element('thead');
    const header = element('tr');
    for (const text of ['ID bulto / guía', 'Producto', 'Lote / vencimiento', 'Cantidad', 'Estado OCR', '']) header.append(element('th', '', text));
    head.append(header);
    const body = element('tbody');
    for (const record of rows) {
      const row = element('tr');
      row.dataset.search = [record.guide, record.package, record.supplier, record.product, record.lot, record.status].join(' ').toLocaleLowerCase('es');
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
      status.append(element('span', `status-pill ${statusClass(record.status)}`, record.status), element('span', 'status-note', record.note));
      const action = element('td');
      action.append(button(record.status === 'Verificado' ? 'Ver detalle' : 'Revisar lote', 'button button-small', () => showDetails(record)));
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

  function renderWorkflow(main, id) {
    const [title, description, actionLabel, destination] = workflows[id] || ['Flujo de recepción', 'Continúa con la revisión de lotes de ejemplo.', 'Volver a recepción', '2:5027'];
    const card = element('section', 'workflow-card');
    card.append(element('span', 'workflow-icon', id.startsWith('41:') ? '!' : '✓'), element('div', 'eyebrow', 'Flujo de trabajo'));
    card.append(element('h2', '', title), element('p', '', description));
    if (id === '37:166') {
      const file = element('input', 'visually-hidden');
      file.type = 'file';
      file.accept = 'image/*';
      file.setAttribute('aria-label', 'Elegir fotografía del empaque');
      file.addEventListener('change', () => {
        if (file.files.length) {
          announce('Captura añadida a la recepción de demostración.');
          navigate('37:292');
        }
      });
      card.append(file, button('Abrir cámara o elegir foto', 'button button-primary', () => file.click()));
    } else {
      card.append(button(actionLabel, 'button button-primary', () => navigate(destination)));
    }
    main.append(card);
    if (id === '37:166' || id === '37:435' || id === '37:579') makeTable(main, records.slice(0, 3));
  }

  function renderChecklist(main) {
    const layout = element('section', 'checklist-layout');
    layout.setAttribute('aria-label', 'Lista de comprobaciones de recepción');
    const list = element('div', 'checklist-items');
    for (const check of checks) {
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
        updateProgress();
      });
      list.append(row);
    }

    const aside = element('aside', 'checklist-aside');
    const progressCard = element('section', 'progress-card');
    progressCard.append(element('h2', '', 'Avance de la revisión'));
    const count = element('p', 'progress-count');
    const progress = element('div', 'progress-track');
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', 'Avance de la revisión');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', String(checks.length));
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

    function updateProgress() {
      const complete = checks.filter(check => check.done).length;
      count.textContent = `${complete} de ${checks.length} comprobaciones hechas`;
      fill.style.width = `${complete / checks.length * 100}%`;
      progress.setAttribute('aria-valuenow', String(complete));
      const completeList = complete === checks.length;
      notice.classList.toggle('is-complete', completeList);
      noticeTitle.textContent = completeList ? 'Lista completa' : 'Sin todas las comprobaciones';
      noticeText.textContent = completeList
        ? 'El bulto está listo para continuar al contraste.'
        : 'El bulto no pasa al inventario hasta completar la lista.';
    }
    updateProgress();
  }

  function render(id, onNavigate) {
    currentId = id;
    navigate = onNavigate;
    const root = document.querySelector('#web-app');
    const route = routes[id];
    if (!root || !route) return false;
    root.hidden = false;
    document.body.classList.add('native-web');
    const main = makeShell(root, route);
    if (id === '2:5027') {
      makeStats(main);
      const alert = element('div', 'alert-banner');
      alert.append(element('span', 'alert-dot'), element('p', '', `${records.filter(item => item.status !== 'Verificado').length} bultos presentan inconsistencias. Sepáralos físicamente y verifica la evidencia antes de aprobarlos.`));
      main.append(alert);
      const title = element('div', 'section-heading');
      title.append(element('h2', '', 'Bultos en recepción'), element('span', '', '03 oct 2026 · Registros de ejemplo'));
      main.append(title);
      makeTable(main, records);
      main.append(element('p', 'disclaimer', 'Datos y referencias oficiales demostrativos. No representan una consulta real a DIGEMID ni un reporte enviado.'));
    } else if (id === '50:166' || id === '50:582' || id === '42:166') {
      let rows = records;
      if (id === '50:582') rows = records.filter(record => record.status !== 'Verificado');
      const section = element('div', 'section-heading');
      section.append(element('h2', '', id === '50:582' ? 'Productos separados para revisión' : 'Registros de ejemplo'), element('span', '', 'Actualizado hoy'));
      main.append(section);
      makeTable(main, rows);
    } else if (id === '42:488') {
      makeStats(main);
      const panel = element('section', 'report-panel');
      panel.append(element('h2', '', 'Actividad de recepción'), element('p', '', 'Resumen de los registros de ejemplo disponibles en esta sesión.'));
      const bars = element('div', 'report-bars');
      for (const [label, value, type] of [['Verificados', records.filter(item => item.status === 'Verificado').length, 'success'], ['En revisión', records.filter(item => item.status !== 'Verificado').length, 'warning']]) {
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
    if (root) root.hidden = true;
  }

  return { render, leave };
})();
