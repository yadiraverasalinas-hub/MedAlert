'use strict';
const { pages, events, symbols, defs } = window.MedAlertDesign;
window.MedAlertPages = {};
const edition=document.documentElement.dataset.edition || '';
const byId = new Map(pages.map(page => [page.id,page]));
const screen = document.querySelector('#screen');
const stage = document.querySelector('.stage');
const svg = document.querySelector('#display');
const layers = document.querySelector('#layers');
const controls = [...document.querySelectorAll('[data-layout]')];
const narrow = matchMedia('(max-width:720px)');
const starts = {web:'2:5027',celular:'2:4726'};
const trail = [];
const scheduled = new Set();
const variants = new Map();
let active, layout = 'auto', loadVersion = 0, messageTimer, deleting;
const storeKey = 'medalert-figma-v1';
let saved;
try { saved = JSON.parse(localStorage.getItem(storeKey)) || {}; } catch { saved = {}; }
saved.fields ||= {}; saved.preferences ||= {};
for(const [key,value] of Object.entries(saved.preferences))variants.set(key,value); saved.records ||= []; saved.people ||= []; saved.deleted ||= [];
function persist() { try { localStorage.setItem(storeKey,JSON.stringify(saved)); return true; } catch { notice('Este navegador no permite guardar los cambios en este dispositivo.'); return false; } }
function notice(text) {
  const box = document.querySelector('#feedback');
  box.textContent = text;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {box.textContent='';}, 4500);
}
document.querySelector('#geometry').innerHTML = defs;
for (const [key,label] of [['celular','Celular'],['web','Web'],['design','Guía visual y componentes']]) {
  if(edition && key!==edition)continue;
  const group = document.createElement('optgroup'); group.label=label;
  for(const page of pages.filter(p=>p.kind===key)) group.append(new Option(page.name,page.id));
  screen.append(group);
}
function fit() {
  if(!active) return;
  const available = stage.clientWidth;
  let width = active.kind==='web' && available<720 ? Math.max(1000,available) : Math.min(available,active.w);
  if(active.kind==='celular' && saved.zoom)width*=saved.zoom;
  svg.style.maxWidth='none';
  svg.style.width=width+'px'; svg.style.height=width*active.h/active.w+'px';
}
new ResizeObserver(fit).observe(stage);
function go(id, push=true, transition=null) {
  const page=byId.get(id); if(!page) return;
  if(push && active && active.id!==id) trail.push(active.id);
  if(window.speechSynthesis) speechSynthesis.cancel();
  for(const timer of scheduled) clearTimeout(timer); scheduled.clear();
  const version=++loadVersion; active=page; screen.value=id;
  const draw=()=>{
    if(version!==loadVersion)return;
    if(page.kind==='web') {
      svg.setAttribute('hidden','');
      document.querySelector('#local-photo').hidden=true;
      document.querySelector('#local-items').replaceChildren();
      window.MedAlertWeb.render(id,go);
      stage.scrollTo(0,0);
      return;
    }
    window.MedAlertWeb.leave();
    svg.removeAttribute('hidden');
    layers.innerHTML=window.MedAlertPages[id];
    svg.setAttribute('viewBox', '0 0 '+page.w+' '+page.h);
    svg.setAttribute('aria-label',page.name); fit(); stage.scrollTo(0,0);
    prepare(layers); workflow.render(); svg.classList.toggle('contrast',Boolean(saved.contrast));
    if(transition && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      const dx=transition[2].includes('RIGHT')?14:transition[2].includes('LEFT')?-14:0;
      svg.animate([{opacity:0.65,transform:'translateX('+dx+'px)'},{opacity:1,transform:'none'}],{duration:Math.min(450,(transition[3]||0)*1000)});
    }
  };
  if(page.kind==='web' || window.MedAlertPages[id]) return draw();
  const script=document.createElement('script'); script.src='design/'+id.replace(':','-')+'.js';
  script.onload=draw; script.onerror=()=>notice('No se pudo cargar la pantalla. Vuelve a seleccionarla.'); document.head.append(script);
}
function useLayout(value) {
  layout=value; const device=value==='auto'?(narrow.matches?'celular':'web'):value;
  controls.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===value)));
  go(starts[device]);
}
controls.forEach(button=>button.onclick=()=>useLayout(button.dataset.layout));
screen.onchange=()=>{
  const page=byId.get(screen.value);
  if(page.kind!=='design'){layout=page.kind;controls.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===layout)));}
  go(page.id);
};
narrow.onchange=()=>{if(layout==='auto' && Object.values(starts).includes(active?.id))useLayout('auto');else fit();};
function descendants(node,selector) { return [...node.querySelectorAll(selector)]; }
function caption(node) {
  return descendants(node,'[data-text]').map(el=>el.dataset.text).join(' ').trim() || node.dataset.name;
}
function downloadRows() {
  const rows=descendants(layers,'[data-name="Fila"],[data-name="Bulto recibido"]').filter(row=>row.style.visibility!=='hidden');
  const content=rows.map(row=>descendants(row,'[data-text]').map(node=>'"'+node.dataset.text.replaceAll('"','""')+'"').join(',')).join('\r\n');
  const link=document.createElement('a'),url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'}));
  link.href=url;link.download='MedAlert-registros.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function editKey(input) {return active.id+'|'+input.closest('[data-id]').dataset.id;}
function extra(node,action) {
  node.dataset.extra=action;node.setAttribute('role','button');node.setAttribute('tabindex','0');
  node.setAttribute('aria-label',caption(node));
  if(!node.querySelector(':scope > .hit-area') && !node.querySelector('input,[role="button"]')){
    const rect=document.createElementNS(svg.namespaceURI,'rect'),bounds=node.getBBox();
    for(const key of ['x','y','width','height'])rect.setAttribute(key,bounds[key]);
    rect.setAttribute('class','hit-area');rect.setAttribute('fill','transparent');rect.setAttribute('pointer-events','all');node.append(rect);
  }
}
function prepare(root) {
  for(const instance of descendants(root,'[data-instance]')) {
    const key=active.id+'|'+instance.dataset.id;
    if(variants.has(key))instance.innerHTML=symbols[variants.get(key)];
  }
  for(const input of descendants(root,'input')) {
    const value=saved.fields[editKey(input)] ;
    if(value!==undefined){input.value=value;input.classList.add('edited');}
  }
  for(const node of descendants(root,'g[data-name]')) {
    const name=node.dataset.name;
    if(node.hasAttribute('data-event') || node.parentElement.closest('[role="button"]') || node.querySelector('[role="button"]'))continue;
    if(['Pausar','Detener audio'].includes(name) || name==='Acción' || name==='Opción' || (active.id==='37:292' && name==='Comprobación') || (active.id==='42:723' && ['Sí','No'].includes(name)))extra(node,'local');
  }
  for(const node of descendants(root,'[data-event]')) {
    for(const event of events[node.dataset.event]||[]) {
      if(event.type!=='AFTER_TIMEOUT')continue;
      if(node.hasAttribute('data-instance') && node.querySelector('[data-event]'))continue;
      const timer=setTimeout(()=>{scheduled.delete(timer);if(node.isConnected)follow(node,event);},event.delay*1000);scheduled.add(timer);
    }
  }
}
function follow(node,event) {
  for(const action of event.actions) {
    const [kind,target]=action;
    if(kind==='BACK') {go(trail.pop()||starts[active.kind]||starts.celular,false,action);return;}
    if(kind==='SWAP_STATE') {
      const instance=node.closest('[data-instance]');
      if(instance && symbols[target]) {
        instance.innerHTML=symbols[target];
        const key=active.id+'|'+instance.dataset.id;
        variants.set(key,target);
        if(active.id==='35:497'){
          saved.preferences[key]=target;
          if(instance.dataset.id==='62:301')saved.zoom=({'62:265':1,'62:279':1.1,'62:293':1.24})[target] || 1;
          if(instance.dataset.id==='62:250')saved.contrast=target==='62:239';
          persist();fit();svg.classList.toggle('contrast',Boolean(saved.contrast));
        }
        prepare(instance);
      }return;
    }
    if(kind==='NAVIGATE') {go(workflow.destination(target),true,action);return;}
  }
}
function toggle(node, remember=true) {
  const chosen=node.classList.toggle('picked');node.setAttribute('aria-pressed',String(chosen));
  if(remember){saved.choices ||= {};saved.choices[active.id+'|'+node.dataset.id]=chosen;persist();}
  let border=node.querySelector(':scope > .pick-border');
  if(!border){const bounds=node.getBBox();border=document.createElementNS(svg.namespaceURI,'rect');
    for(const key of ['x','y','width','height'])border.setAttribute(key,bounds[key]);
    border.setAttribute('class','pick-border');border.setAttribute('fill','none');border.setAttribute('pointer-events','none');node.append(border);}
}
function handle(event) {
  if(event.target.closest('input'))return;
  const node=event.target.closest('[role="button"]');if(!node)return;
  const label=caption(node);
  if(node.dataset.name==='Disparador' && node.dataset.event){
    const dialog=document.querySelector('#capture');dialog.showModal();
    const finish=()=>{dialog.close();const click=events[node.dataset.event].find(e=>e.type==='ON_CLICK');if(click)follow(node,click);};
    dialog.querySelector('[data-sample]').onclick=()=>{workflow.capture(null);finish();};
    const file=dialog.querySelector('input');file.value='';file.onchange=()=>{
      if(!file.files[0]?.type.startsWith('image/'))return;
      if(file.files[0].size>10*1024*1024){notice('Selecciona una foto de hasta 10 MB.');return;} workflow.capture(file.files[0]);finish();};return;
  }
  if(workflow.click(node,label))return;
  if(node.dataset.name==='Pausar'){if(window.speechSynthesis){if(speechSynthesis.paused)speechSynthesis.resume();else speechSynthesis.pause();}return;}
  if(node.dataset.name==='Detener audio'){window.speechSynthesis?.cancel();return;}
  const reaction=(events[node.dataset.event]||[]).find(item=>item.type==='ON_CLICK');
  if(reaction){follow(node,reaction);return;}
  
  if(/aplicar filtro/i.test(label)){filterRows();return;}
  if(/exportar inventario|exportar resultados/i.test(label)){downloadRows();return;}
  const links={'Volver a tomar foto':'2:4805','Repetir una cara':'35:553','Volver al resultado':'2:4923','Sí, guardar':'66:460','Ahora no':'2:4726','Consultar alerta':'53:166','Nueva recepción':'37:166'};
  if(links[label]){go(links[label]);return;}
  if(/escuchar|lectura por voz/i.test(label)) return;
  notice('Esta acción pertenece a la demostración.');
}
function filterRows(){workflow.filter();}
layers.onclick=handle;
layers.addEventListener('keydown',event=>{if(!event.target.matches('[role="button"]')||!['Enter',' '].includes(event.key))return;event.preventDefault();handle(event);});
layers.addEventListener('input',event=>{
  const input=event.target.closest('input');if(!input)return;
  input.classList.add('edited');saved.fields[editKey(input)]=input.value;
  workflow.edit(input);
  persist();
  if(input.closest('[data-name="Buscar lote"]'))filterRows();
});
useLayout(edition || (['web','celular'].includes(location.hash.slice(1))?location.hash.slice(1):'auto'));
