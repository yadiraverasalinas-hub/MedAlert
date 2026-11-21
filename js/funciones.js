'use strict';
// Funciones del dispositivo y del navegador asociadas a los controles del diseño.
const workflow = (() => {
  const svgNS='http://www.w3.org/2000/svg';
  const productPages=['2:4856','34:232','58:166'];
  const demo={nombre:'Paracetamol 500mg',lote:'A123',vence:'08/2027',registro:'EN-04567'};
  let product=null, caseLot=null, photoURL='', pendingDelete=null, checkedIdentity=false, filterState='', evidence=[], motive='Lote inexistente', measure='Inmovilizar en cuarentena';
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const named=(name,root=layers)=>Array.from(root.querySelectorAll('g[data-name]')).filter(g=>g.dataset.name===name);
  const texts=node=>descendants(node,'[data-text]').map(n=>n.dataset.text);
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
  const fieldKey=label=>{
    const value=norm(label);
    if(value.includes('nombre comercial'))return 'nombre';
    if(value.includes('lote'))return 'lote';
    if(value.includes('vencimiento'))return 'vence';
    if(value.includes('registro sanitario'))return 'registro';
    if(value.includes('laboratorio'))return 'fabricante';
    if(value.includes('dosis') || value.includes('principio activo'))return 'dosis';
    return value;
  };
  function textValue(node,value){
    if(!node || node.dataset.text===value)return;
    const bounds=node.getBBox(),glyph=node.querySelector('use'),matrix=glyph?.getAttribute('transform')?.match(/translate\(([^ ]+) ([^)]+)\) scale\(([^ ]+)/);
    const text=document.createElementNS(svgNS,'text');
    text.setAttribute('x',matrix?.[1]||'0');text.setAttribute('y',matrix?.[2]||Math.max(12,bounds.height-2));
    text.setAttribute('font-size',matrix?.[3]||'15');text.setAttribute('fill',node.querySelector('[fill]')?.getAttribute('fill')||'#123347');
    text.setAttribute('font-family','Inter,Arial,sans-serif');text.textContent=value;
    node.replaceChildren(text);node.dataset.text=value;node.setAttribute('aria-label',value);
  }
  function line(tag,value){const row=el('p');row.append(el('strong',tag+' · '),document.createTextNode(String(value)));return row;}
  function dialog(title,items){
    const d=document.querySelector('#details');d.querySelector('h2').textContent=title;
    d.querySelector('.details-body').replaceChildren(...items);if(!d.open)d.showModal();return d;
  }
  function action(label,fn){const b=el('button',label);b.type='button';b.onclick=fn;return b;}
  function pick(title,options,fn){const close=()=>document.querySelector('#details').close();
    dialog(title,options.map(option=>action(option,()=>{close();fn(option);})));
  }
  function log(kind,data){
    const entry={id:crypto.randomUUID?.()||String(Date.now()),kind,at:new Date().toISOString(),...data};
    saved.entries??=[];saved.entries.unshift(entry);persist();return entry;
  }
  function current(){return product||{...demo};}
  function setProduct(object,custom=false){product={...object,custom};}
  function inputValues(){
    return Object.fromEntries(descendants(layers,'input[data-field]').filter(i=>!i.closest('[data-name="Buscar lote"]')).map(i=>[i.dataset.field,i.value.trim()]));
  }
  function edit(input){
    if(!productPages.includes(active.id))return;
    const key=fieldKey(input.dataset.field);setProduct({...current(),[key]:input.value.trim()},true);
  }
  function validate(){
    const data={};
    for(const input of descendants(layers,'input[data-field]')){
      const key=fieldKey(input.dataset.field),val=input.value.trim();
      const invalid=(['nombre','lote'].includes(key)&&!val)||
        (key==='vence'&&!/^(0?[1-9]|1[0-2])\s*\/\s*\d{4}$/.test(val))||
        (key==='registro'&&!/^[A-Za-z0-9][A-Za-z0-9-]{2,}$/.test(val));
      if(invalid){input.focus();input.setAttribute('aria-invalid','true');notice(key==='vence'?'Escribe el vencimiento como MM/AAAA.':'Revisa el campo «'+input.dataset.field+'» para continuar.');return false;}
      if(val && !/^(Escribe |Ej\. |Cuéntanos )/i.test(val))data[key]=val;
    }
    setProduct(data,Boolean(product?.custom||photoURL||Object.entries(data).some(([k,v])=>demo[k] && norm(demo[k])!==norm(v).replaceAll(' / ','/'))));
    return true;
  }
  function capture(file){if(photoURL)URL.revokeObjectURL(photoURL);photoURL=file?URL.createObjectURL(file):'';setProduct({...demo},!!file);}
  function destination(id){return active.id==='7:6051' && current().custom ? '20:166':id;}
  function filter(){
    const terms=descendants(layers,'input.edited').map(i=>norm(i.value)).filter(s=>s && !/^(todos?|todas?)( |$)/.test(s));
    if(active.id==='2:5027' && filterState)terms.push(norm(filterState));
    const rows=[...named('Bulto recibido'),...named('Fila').filter(row=>row.querySelector('[data-name="Celda"]'))];
    let count=0;
    for(const row of rows){
      const visible=terms.every(term=>norm(caption(row)).includes(term));row.style.visibility=visible?'visible':'hidden';if(visible)count++;
    }
    if(rows.length && terms.length)notice(count?count+' coincidencia(s).':'Sin coincidencias.');
    for(const node of descendants(layers,'[data-text]').filter(n=>n.dataset.text.startsWith('Mostrando ')))textValue(node,'Mostrando '+count+' de '+rows.length+' bultos');
  }
  function selectedLot(row){
    const cells=named('Dato de recepción',row).map(cell=>texts(cell));
    if(cells.length>=4)return {guia:cells[0][0],nombre:cells[1][0],lote:cells[2][0],vence:cells[2][1],cantidad:cells[3][0],estado:caption(named('Estado',row)[0]||row)};
    const vals=texts(row);return {nombre:vals[1],lote:vals[2],estado:vals[4]||'Observado'};
  }
  function info(data){
    const labels={at:'Fecha',nombre:'Producto o persona',guia:'Guía',lote:'Lote',vence:'Vencimiento',estado:'Estado',cantidad:'Cantidad',registro:'Registro sanitario',fabricante:'Fabricante',resultado:'Resultado',medida:'Acción adoptada',motivo:'Motivo',notas:'Notas'};
    return Object.entries(data).filter(([k,v])=>!['id','custom','kind'].includes(k)&&v!=null&&v!==''&&typeof v!=='object').map(([k,v])=>line(labels[k]||k,k==='at'?new Date(v).toLocaleString('es-PE'):v));
  }
  function saveReport(){const p=current();const row=log('informe',{...p,resultado:p.custom?'En revisión':'Resultado de ejemplo'});notice('Informe guardado · '+row.nombre);}
  function pickFile(){
    const file=el('input');file.type='file';file.multiple=true;file.accept='image/jpeg,image/png';
    file.onchange=()=>{const items=[...file.files];if(items.some(f=>!['image/jpeg','image/png'].includes(f.type)||f.size>10*1024*1024)){notice('Selecciona imágenes JPG o PNG de hasta 10 MB.');return;}
      evidence=items;document.querySelector('#details').close();notice(items.length+' archivo(s) adjunto(s).');};
    dialog('Fotos de evidencia',[el('p','JPG o PNG · Hasta 10 MB por imagen.'),file,...evidence.map(f=>el('p',f.name))]);
  }
  async function storeFiles(files){
    if(!files.length)return [];
    const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('medalert-adjuntos',1);req.onupgradeneeded=()=>req.result.createObjectStore('fotos');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    const refs=files.map(file=>({key:crypto.randomUUID(),name:file.name}));
    try{await new Promise((resolve,reject)=>{const tx=db.transaction('fotos','readwrite');files.forEach((f,i)=>tx.objectStore('fotos').put(f,refs[i].key));tx.oncomplete=resolve;tx.onabort=tx.onerror=reject;});}finally{db.close();}
    return refs;
  }
  async function openFile(ref){
    const req=indexedDB.open('medalert-adjuntos',1);
    req.onsuccess=()=>{const db=req.result,r=db.transaction('fotos').objectStore('fotos').get(ref.key);r.onsuccess=()=>{db.close();if(!r.result){notice('Archivo no disponible.');return;}
      const u=URL.createObjectURL(r.result),a=el('a');a.href=u;a.download=ref.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);};};
  }
  let committing=false;
  async function commitCase(node,kind){
    if(committing)return;
    if(kind==='inmovilización'&&!evidence.length){notice('Adjunta una foto del empaque antes de confirmar la inmovilización.');pickFile();return;}
    committing=true;
    try{
      const photos=await storeFiles(evidence);
      const details={...inputValues(),...caseLot,motivo:motive,medida:measure,notas:document.querySelector('#case-notes')?.value||'',fotos:photos};
      if(kind==='reporte')Object.assign(details,current());
      if(!details.nombre)details.nombre='Amoxicilina 500 mg';
      if(!details.lote)details.lote='#88392-B';
      if(kind==='inspección')details.condiciones=Object.values(saved.inspection||{}).join(' · ');
      log(kind,details);evidence=[];notice('Se guardó el registro local.');
      const reaction=(events[node.dataset.event]||[]).find(e=>e.type==='ON_CLICK');if(reaction)follow(node,reaction);
    }catch{notice('No se pudieron guardar las fotos. El formulario sigue abierto.');}finally{committing=false;}
  }
  function historyList(){
    const panel=document.querySelector('#local-items');panel.replaceChildren();
    let items=(saved.entries||[]).filter(x=>{
      if(active.id==='28:166')return ['informe','reporte'].includes(x.kind);
      if(active.id==='36:351')return x.kind==='persona';
      if(active.id==='50:582')return x.kind==='inmovilización';
      if(active.id==='42:166')return !['informe','reporte','persona'].includes(x.kind);
      return false;
    });
    if(active.id==='36:351')items=items.concat((saved.people||[]).map(nombre=>({nombre,kind:'persona'})));
    if(active.id==='28:166')items=items.concat((saved.records||[]).map(x=>({nombre:x.data?.['Nombre comercial']||x.action,at:x.at,...x.data})));
    if(active.id==='20:166'){
      panel.append(action('Guardar este resultado en mi historial',()=>{saveReport();go('28:166');}));
      stage.append(panel);return;
    }
    if(!items.length)return;
    panel.append(el('h2','Guardado en este dispositivo'));
    for(const entry of items){
      const title=[entry.nombre,entry.lote].filter(Boolean).join(' · ');
      panel.append(action(title,()=>{
        const parts=[...info(entry),...(entry.fotos||[]).map(ref=>action('Descargar '+ref.name,()=>openFile(ref)))];
        if(entry.kind==='informe')parts.push(action('Eliminar informe',()=>{dialog('¿Eliminar este informe?',[el('p',title),action('Confirmar eliminación',()=>{saved.entries=saved.entries.filter(x=>x.id!==entry.id);persist();document.querySelector('#details').close();historyList();})]);}));
        dialog(title,parts);
      }));
    }
    // Bring newly created entries into the first viewport alongside the mockup records.
    stage.insertBefore(panel,svg);
  }
  function replaceMatching(test,value,root=layers){for(const n of descendants(root,'[data-text]'))if(test(n.dataset.text))textValue(n,value);}
  function reportText(){
    const p=current();
    return ['MedAlert · Informe de verificación',p.nombre,'Lote: '+p.lote,'Vencimiento: '+(p.vence||'Por confirmar'),'Registro sanitario: '+(p.registro||'Por confirmar'),p.custom?'Estado: en revisión. Verificación manual pendiente.':'Estado: '+(p.estado||'Resultado de ejemplo'), 'Entorno académico. Sin consulta oficial.',new Date().toLocaleString('es-PE')].join('\n');
  }
  function printReport(){document.querySelector('#print-report').textContent=active.id==='41:679'?[active.name,...texts(named('Constancia',layers)[0]||layers)].join('\n'):reportText();window.print();}
  function openShare(){const text=reportText(),txt=el('textarea');txt.value=text;txt.readOnly=true;
    dialog('Compartir resumen',[txt,action('Copiar resumen',async()=>{try{await navigator.clipboard.writeText(text);notice('Resumen copiado.');}catch{txt.select();notice('Copia el texto seleccionado.');}}),action('Abrir correo',()=>{location.href='mailto:?subject=Informe%20MedAlert&body='+encodeURIComponent(text);}),...(navigator.share?[action('Compartir…',()=>navigator.share({text}).catch(()=>{}))]:[])]);
  }
  function attach(node,fnName){if(node)extra(node,fnName);}
  function render(){
    historyList();
    for(const input of descendants(layers,'input[data-field]')){
      if(!input.classList.contains('edited') && /^(Escribe |Ej\. |Cuéntanos )/i.test(input.value)){input.placeholder=input.value;input.value='';}
    }
    for(const row of named('Verificación reciente'))if(saved.deleted.includes(row.dataset.id))row.style.display='none';
    const photo=document.querySelector('#local-photo');photo.hidden=!photoURL||!['2:4856','34:358','35:623'].includes(active.id);if(!photo.hidden)photo.src=photoURL;
    if(productPages.includes(active.id) && product){for(const input of descendants(layers,'input')){const val=product[fieldKey(input.dataset.field)];if(val!==undefined){input.value=val;input.classList.add('edited');}}}
    if(active.id==='2:5027'){
      for(const node of named('Acción de bulto'))if(!node.hasAttribute('data-event'))attach(node,'detalle');
      for(const node of named('Filtro')){attach(node,'filtrar');if(filterState)textValue(node.querySelector('[data-text]'),filterState);}
    }
    for(const node of named('Fotos de evidencia').concat(named('Evidencia fotográfica')))attach(node,'fotos');
    for(const node of named('Opción de motivo').concat(named('Selector de motivo')))attach(node,'motivo');
    if(active.id==='2:5251'){
      const area=named('Área de notas')[0];
      if(area && !area.querySelector('textarea')){
        const box=area.getBBox(),foreign=document.createElementNS(svgNS,'foreignObject');
        foreign.setAttribute('width',box.width);foreign.setAttribute('height',box.height);
        const input=el('textarea');input.id='case-notes';input.setAttribute('aria-label','Notas técnicas');input.value='';
        input.placeholder='Escribe las notas del lote';input.style.cssText='box-sizing:border-box;width:100%;height:100%;padding:8px;border:1px solid #aec4ce;background:white;font:15px sans-serif';
        foreign.append(input);area.append(foreign);
      }
    }
    if(active.id==='2:5251' && caseLot){
      replaceMatching(t=>t.startsWith('Lote: '),'Lote: '+caseLot.lote+' · '+caseLot.nombre);
      replaceMatching(t=>t.includes('Bulto 01 · 120 cajas recibidas'),caseLot.guia+' · '+caseLot.cantidad);
    }
    if(active.id==='37:579')for(const group of named('Bloque').filter(g=>['Íntegro','Roto o ausente','Sin daños','Golpes o humedad','Nítida','Borrosa o alterada','Perforado o abierto'].includes(caption(g)))){attach(group,'condicion');group.classList.toggle('choice-active',saved.inspection?.[group.parentElement.dataset.id]===caption(group));}
    if(active.id==='37:292')for(const node of named('Comprobación')){
      const leaf=descendants(node,'[data-text]').find(n=>['Hecha','Pendiente'].includes(n.dataset.text));if(!leaf)continue;
      const value=saved.checklist?.[node.dataset.id];if(value!==undefined)textValue(leaf,value?'Hecha':'Pendiente');
      node.setAttribute('aria-pressed',String(leaf.dataset.text==='Hecha'));
    }
    if(active.id==='42:723')for(const node of [...named('Sí'),...named('No')].filter(n=>n.parentElement.dataset.name==='Celda')){
      attach(node,'permission');const value=saved.permissions?.[node.dataset.id];if(value!==undefined)textValue(node.querySelector('[data-text]'),value?'Sí':'No');
    }
    if(active.id==='36:225'){const node=named('Confirmación explícita')[0];attach(node,'confirm');node?.classList.toggle('choice-active',checkedIdentity);}
    if(active.id==='41:414')for(const opt of named('Opción').filter(g=>texts(g).length)){attach(opt,'measure');opt.classList.toggle('choice-active',caption(opt).startsWith(measure));}
    if(active.id==='78:257' && pendingDelete)replaceMatching(t=>t.includes(' · Lote '),pendingDelete.title);
    if(product && ['2:4923','7:6149','20:166','25:166','66:460','28:311','35:244','58:229','7:6082'].includes(active.id)){
      replaceMatching(t=>/^(Ibuprofeno 400mg|Paracetamol 500mg)( · Lote .*)?$/.test(t),product.nombre+' · '+product.lote);
      replaceMatching(t=>/^Lote .* · Vence /.test(t),'Lote '+product.lote+' · Vence '+(product.vence||'por confirmar'));
      if(product.custom && active.id==='20:166'){
        replaceMatching(t=>t.startsWith('Fuente: DIGEMID'),'Fuente: datos ingresados en este dispositivo.');
        replaceMatching(t=>t==='Validado en BD oficial','Pendiente de consulta oficial');
        replaceMatching(t=>t.startsWith('Sin alertas del producto'),'Alertas oficiales pendientes de consulta');
        replaceMatching(t=>t==='No se pudo leer con claridad','Dato ingresado manualmente');
      }
    }
    if(active.id==='41:679' && caseLot){replaceMatching(t=>t.startsWith('Amoxicilina 500 mg ·'),caseLot.nombre);replaceMatching(t=>t==='#88392-B',caseLot.lote);replaceMatching(t=>t.startsWith('Inmovilizado en cuarentena ·'),measure);}
    if(active.id==='35:244'||active.id==='58:229')for(const n of named('Bloque'))if(['Mensaje','Correo','Copiar enlace al resumen','Enviar por mensaje','Enviar a mi correo','Copiar enlace al PDF'].includes(caption(n)))attach(n,'share');
    filter();
  }
  function click(node,label){
    const name=node.dataset.name;
    if(label==='Reintentar conexión' && !navigator.onLine){notice('El dispositivo sigue sin conexión. Vuelve a intentarlo cuando haya red.');return true;}
    if(node.dataset.extra==='share'){active.id==='35:244'?openShare():printReport();return true;}
    if(name==='Fotos de evidencia'||name==='Evidencia fotográfica'){pickFile();return true;}
    if(node.dataset.extra==='filtrar'){pick('Filtrar bultos',['Todos los estados','Verificado','Inconsistencia'],v=>{filterState=v==='Todos los estados'?'':v;textValue(node.querySelector('[data-text]'),v);filter();});return true;}
    if(name==='Acción de bulto'){caseLot=selectedLot(node.closest('[data-name="Bulto recibido"]'));if(label==='Ver detalle'){dialog('Detalle del lote',info(caseLot));return true;}}
    if(active.id==='50:582' && node.closest('[data-name="Fila"]'))caseLot=selectedLot(node.closest('[data-name="Fila"]'));
    if(node.dataset.extra==='motivo'){const apply=v=>{motive=v;textValue(named('Selector de motivo')[0]?.querySelector('[data-text]'),v);};if(name==='Selector de motivo')pick('Motivo de inmovilización',['Empaque violado','Lote inexistente','Alerta de clonación'],apply);else apply(label);return true;}
    if(node.dataset.extra==='condicion'){saved.inspection||={};saved.inspection[node.parentElement.dataset.id]=label;persist();render();return true;}
    if(node.dataset.extra==='measure'){measure=texts(node)[0];render();return true;}
    if(node.dataset.extra==='permission'){
      const cell=node.parentElement,row=cell.parentElement,idx=[...row.children].filter(c=>c.dataset.name==='Celda').indexOf(cell),permission=texts(row)[0];
      if(idx===3 && /Registrar irregularidades|Liberar producto|Gestionar permisos/i.test(permission)){notice('El rol Consulta no puede realizar esta operación.');return true;}
      saved.permissions||={};const val=caption(node)!=='Sí';saved.permissions[node.dataset.id]=val;textValue(node.querySelector('[data-text]'),val?'Sí':'No');return true;
    }
    if(label==='Guardar cambios'){persist();notice('Permisos guardados en este dispositivo.');return true;}
    if(active.id==='37:292' && name==='Comprobación'){const leaf=descendants(node,'[data-text]').find(n=>['Hecha','Pendiente'].includes(n.dataset.text));if(leaf){saved.checklist||={};saved.checklist[node.dataset.id]=leaf.dataset.text!=='Hecha';persist();render();}return true;}
    if(node.dataset.extra==='confirm'){checkedIdentity=!checkedIdentity;node.classList.toggle('choice-active',checkedIdentity);node.setAttribute('aria-pressed',String(checkedIdentity));return true;}
    if(label==='Confirmar revisión' && !checkedIdentity){notice('Marca la confirmación de identidad y presentación.');return true;}
    if(/Confirmar y analizar|Guardar correcciones/i.test(label)&&productPages.includes(active.id)&&!validate())return true;
    if(name==='Eliminar'){
      const row=node.closest('[data-name="Verificación reciente"]');if(row)pendingDelete={id:row.dataset.id,title:texts(row).slice(0,2).join(' · ')};
    }
    if(label==='Eliminar informe'){if(!pendingDelete){notice('Selecciona primero un informe del historial.');go('28:166');return true;}saved.deleted.push(pendingDelete.id);pendingDelete=null;persist();}
    if(name==='Verificación reciente'&&active.id!=='53:166'){const vals=texts(node);setProduct({nombre:vals[0],lote:vals[1]?.split('Lote ').pop()||'Por verificar',estado:vals[2],vence:'Por verificar'});}
    if(label==='Escanear y Verificar Medicamento'){product=null;checkedIdentity=false;capture(null);}
    if(/Guardar en mi historial|^Sí, guardar$/i.test(label))saveReport();
    if(label==='Guardar persona'){const v=inputValues(),input=layers.querySelector('input');const nombre=input?.value.trim();if(!nombre||nombre.startsWith('Ej.')){input?.focus();notice('Escribe el nombre o apodo de la persona.');return true;}log('persona',{...v,nombre});}
    const operations={'Confirmar Inmovilización y Enviar Reporte':'inmovilización','Registrar acción':'medida','Guardar inspección':'inspección','Enviar reporte':'reporte','Marcar como observado':'observación'};
    if(operations[label] && !(label==='Marcar como observado' && active.id!=='41:166')){commitCase(node,operations[label]);return true;}
    if((label==='Exportar PDF' && active.id==='58:229')||label==='Exportar constancia'){printReport();return true;}
    if(label==='Compartir resumen' && active.id==='35:244'){openShare();return true;}
    if(/escuchar|activar lectura/i.test(label)){
      if(!window.speechSynthesis){notice('Este navegador no ofrece lectura en voz alta.');return true;}
      const msg=new SpeechSynthesisUtterance(texts(layers).join('. '));msg.lang='es-PE';setTimeout(()=>speechSynthesis.speak(msg),200);
    }
    if(label==='Activar Flash/Linterna'){notice('Para usar la linterna real, abre la cámara desde el disparador y selecciona el flash del teléfono.');return true;}
    return false;
  }
  return {render,click,edit,capture,destination,filter};
})();
