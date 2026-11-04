/* =========================================================
   RAIO-X — motor de animações explicativas do Estúdio Raio-X
   =========================================================
   Lê o campo "animacao" do roteiro (JSON) e monta, em three.js, um mundo animado atrás do Zuco.
   O Zuco aparece num cantinho (picture-in-picture) falando com o lip sync de sempre.

   Princípios (iguais aos do estúdio do Zuco):
   - Tudo é função do TEMPO DO VÍDEO (t). Nada de setTimeout/relógio: o preview e a exportação saem idênticos
     e dá para pular para qualquer segundo.
   - O JSON só CHAMA nomes (peças, ações). O movimento em si mora aqui, no código.
   - JSON inválido nunca quebra: o que não existe é ignorado e avisado em "avisos".

   Formato do "animacao" (resumo; o manual completo está no AGENTS.md e no prompt do formato "explica"):
   {
     "ambiente": {"fundo":[topo,meio,horizonte,brilho], "chao":"#e9dfcc"},
     "layout":   {"pip":{"x":.03,"y":.63,"w":.36}, "legenda":54},
     "pecas":    {"nome": {"partes":[{"nome","forma","tam"|"raio"/"alt","pos","rot","cor","vidro","brilho"}], "ancoras":{"x":[0,0,0]}}},
     "elementos":[{"id","peca"|"tipo","pos","rot","esc","oculto"}],
     "blocos":   [{"id","camera":{...},"transicao":{...},"acoes":[{"em","dur","alvo","faz",...}]}]
   }
   Cada fala do roteiro aponta para um bloco com "bloco":"id" (ou, sem o campo, o bloco de mesma posição). */
(function(){
"use strict";
const T3 = THREE;
const RX = {};
window.Raiox = RX;
let E = null; // contexto do estúdio (RX.init)

/* ---------- utilidades ---------- */
const clamp = (x,a,b) => Math.min(b, Math.max(a, x));
const lerp = (a,b,k) => a + (b-a)*k;
const eIO = p => p < .5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
const eOut = p => 1 - Math.pow(1-p, 3);
const eBack = p => { const c1 = 1.70158, c3 = c1+1; return 1 + c3*Math.pow(p-1, 3) + c1*Math.pow(p-1, 2); };
const EASES = {suave:eIO, linear:p=>p, saida:eOut, entrada:p=>p*p*p, pulo:eBack};
const num = (v,d) => (typeof v === 'number' && isFinite(v)) ? v : d;
const vec = (a,d) => (Array.isArray(a) && a.length >= 3) ? [+a[0]||0, +a[1]||0, +a[2]||0] : (d || [0,0,0]);
const rad = x => x*Math.PI/180;
const hash = k => { const s = Math.sin(k*127.1 + 311.7)*43758.5453; return s - Math.floor(s); };
const SANS = '"Segoe UI Black","Arial Black","Helvetica Neue",Arial,sans-serif';
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const lista = x => x == null ? [] : (Array.isArray(x) ? x : [x]);

/* ---------- estado ---------- */
let anim = null, animSrc = null;            // animação em uso e o objeto de origem (para detectar troca)
let mundo = null, floor = null;
let nos = {}, elems = {};                   // nós animáveis ("id" e "id.parte") e elementos
let efeitos = [], blocos = [], trilhas = {}, pulsos = [], giros = [], libAnims = [];
let tlRef = null;                           // timeline usada na última compilação
let ligado = false, salvo = null;
let layout = {pip:{x:.03, y:.63, w:.36}, legenda:54};
let quadro = null;                          // câmera padrão (enquadra tudo)
const avisos = new Set();
const avisar = m => { avisos.add(m); };
const texCache = new Map();

/* =========================================================
   MUNDO: peças, elementos e nós animáveis
   ========================================================= */
// cores claras demais estouram e viram névoa: limita o brilho e dá um pouco mais de cor
function corSegura(c){
  const k = new T3.Color(c || '#cfd6dc'), h = {}; k.getHSL(h);
  k.setHSL(h.h, Math.min(1, h.s*1.12 + (h.s < .08 ? 0 : .04)), Math.min(h.l, .74)); return k;
}
function material(p){
  const m = new T3.MeshStandardMaterial({color: corSegura(p.cor), flatShading:true, roughness:.85, metalness:0});
  if(p.vidro){ m.transparent = true; m.opacity = clamp(num(p.vidro === true ? .4 : p.vidro, .4), .22, 1); m.depthWrite = false; m.roughness = .25; }
  if(p.brilho){ m.emissive = new T3.Color(p.cor || '#ffffff'); m.emissiveIntensity = num(p.brilho, .6); }
  m.userData.e = {c: m.emissive.clone(), i: m.emissiveIntensity};
  return m;
}
function geometria(p){
  switch(p.forma){
    case 'caixa': { const t = vec(p.tam, [1,1,1]); return new T3.BoxGeometry(t[0], t[1], t[2]); }
    case 'cilindro': return new T3.CylinderGeometry(num(p.raio_topo, num(p.raio, .5)), num(p.raio, .5), num(p.alt, 1), num(p.lados, 10));
    case 'esfera': return new T3.IcosahedronGeometry(num(p.raio, .5), num(p.detalhe, 1));
    case 'cone': return new T3.ConeGeometry(num(p.raio, .5), num(p.alt, 1), num(p.lados, 10));
    case 'anel': return new T3.TorusGeometry(num(p.raio, .5), num(p.espessura, .08), 6, num(p.lados, 16));
    case 'tubo': {
      const pts = (Array.isArray(p.pontos) && p.pontos.length >= 2 ? p.pontos : [[0,0,0],[0,1,0]]).map(a => new T3.Vector3(...vec(a)));
      const c = pts.length > 2 ? new T3.CatmullRomCurve3(pts, false, 'catmullrom', .2) : new T3.LineCurve3(pts[0], pts[1]);
      return new T3.TubeGeometry(c, pts.length > 2 ? pts.length*10 : 2, num(p.raio, .08), 6, false);
    }
  }
  return null;
}
function nuvemObj(p){
  const g = new T3.Group(), r = num(p.raio, .5), m = material({cor:p.cor || '#ffffff', vidro:num(p.op, .85)});
  [[0,0,0,1],[.6,-.1,.1,.75],[-.55,-.05,-.05,.8],[.2,.35,.1,.7],[-.2,.4,-.1,.6],[.45,.25,-.15,.55]].forEach((q,i)=>{
    const s = new T3.Mesh(new T3.IcosahedronGeometry(r*q[3], 1), m); s.position.set(q[0]*r, q[1]*r, q[2]*r); s.userData.y0 = s.position.y; s.userData.i = i; g.add(s); });
  g.userData.nuvem = true; return g;
}
// cria a malha de uma parte/forma; devolve {obj, nivelObj, mats}
function criarForma(p){
  if(p.forma === 'nuvem'){ const g = nuvemObj(p); const mats = []; g.traverse(o => { if(o.material && !mats.includes(o.material)) mats.push(o.material); }); return {obj:g, mats}; }
  let liquido = p.forma === 'liquido', def = p;
  let geo;
  if(liquido){
    def = Object.assign({vidro:.72, cor:'#58b4ff'}, p);
    const cil = p.base === 'cilindro';
    geo = geometria(cil ? {forma:'cilindro', raio:p.raio, alt:p.alt, lados:p.lados} : {forma:'caixa', tam:p.tam});
    const h = cil ? num(p.alt, 1) : vec(p.tam, [1,1,1])[1];
    if(geo) geo.translate(0, h/2, 0);
  } else geo = geometria(p);
  if(!geo){ avisar('forma "'+p.forma+'" não existe'); geo = new T3.BoxGeometry(.3,.3,.3); }
  const m = material(def);
  const mesh = new T3.Mesh(geo, m);
  mesh.castShadow = !(def.vidro || liquido); mesh.receiveShadow = true;
  // peças de vidro ganham contorno, senão viram um bloco liso sem forma ("contorno":false desliga)
  if(def.vidro && !liquido && def.contorno !== false && ['caixa','cilindro','anel'].includes(def.forma))
    mesh.add(new T3.LineSegments(new T3.EdgesGeometry(geo, 25), new T3.LineBasicMaterial({color: def.contorno || '#4f7287'})));
  if(liquido) mesh.scale.y = Math.max(.001, num(p.nivel, 1));
  return {obj:mesh, nivelObj: liquido ? mesh : null, mats:[m]};
}
function registrar(nome, obj, mats, def, nivelObj){
  const no = {nome, obj, mats, nivelObj, base:{
    pos: vec(def.pos), rot: vec(def.rot), esc: Array.isArray(def.esc) ? vec(def.esc, [1,1,1]) : [num(def.esc,1), num(def.esc,1), num(def.esc,1)],
    vis: def.oculto === true ? 0 : 1, oculto: def.oculto, nivel: num(def.nivel, 1),
    cor: corSegura(def.cor || '#ffffff')}};
  nos[nome] = no; return no;
}
function criarElemento(def, pecas){
  const id = def && def.id;
  if(!id || typeof id !== 'string' || elems[id]){ avisar('elemento sem "id" ou com id repetido'); return; }
  const g = new T3.Group(); g.name = id;
  let ancoras = {}, mats = [], nivelObj = null, libInfo = null;
  if(def.peca){
    const P = pecas[def.peca];
    if(!P){ avisar('peça "'+def.peca+'" não existe (elemento '+id+')'); }
    else {
      (P.partes || []).forEach(p => {
        if(!p || !p.nome){ avisar('parte sem nome na peça '+def.peca); return; }
        const f = criarForma(p), o = f.obj;
        o.position.set(...vec(p.pos)); o.rotation.set(rad(vec(p.rot)[0]), rad(vec(p.rot)[1]), rad(vec(p.rot)[2]));
        if(Array.isArray(p.esc)) o.scale.set(...vec(p.esc, [1,1,1])); else if(num(p.esc, 1) !== 1) o.scale.multiplyScalar(num(p.esc, 1));
        g.add(o); mats.push(...f.mats);
        const baseScaleY = o.scale.y;
        const no = registrar(id+'.'+p.nome, o, f.mats, p, f.nivelObj); no.base.escY = baseScaleY;
      });
      ancoras = Object.assign({}, P.ancoras || {});
    }
  } else if(def.lib){
    const LB = window.RAIOX_LIB, r = LB && LB.construir(def.lib, def.params || {});
    if(!r) avisar('objeto "'+def.lib+'" não existe na biblioteca (elemento '+id+')');
    else {
      g.add(r.obj); ancoras = Object.assign({}, r.ancoras || {});
      const partesNos = [];
      Object.keys(r.partes).forEach(n => {
        const o = r.partes[n], rs = o.userData.rest, ms = [];
        o.traverse(m => { if(m.isMesh && m.material && m.material.userData && m.material.userData.e && ms.indexOf(m.material) < 0) ms.push(m.material); });
        const no = registrar(id+'.'+n, o, ms, {pos:rs.p.toArray(), rot:[rs.r.x*180/Math.PI, rs.r.y*180/Math.PI, rs.r.z*180/Math.PI], esc:rs.s.toArray(), oculto: rs.v === false});
        no.base.escY = rs.s.y; partesNos.push(no);
      });
      libInfo = {def:r.def, partes:r.partes, params:r.params};
    }
  } else if(def.tipo){
    const f = criarForma(Object.assign({}, def, {forma:def.tipo === 'liquido' ? 'liquido' : def.tipo}));
    g.add(f.obj); mats = f.mats; nivelObj = f.nivelObj;
  } else avisar('elemento '+id+' precisa de "lib", "peca" ou "tipo"');
  // âncoras automáticas pela caixa do elemento (não sobrescrevem as suas)
  const bb = new T3.Box3().setFromObject(g);
  if(!bb.isEmpty()){
    const c = bb.getCenter(new T3.Vector3()), a = {topo:[c.x, bb.max.y, c.z], base:[c.x, bb.min.y, c.z], centro:[c.x, c.y, c.z],
      esq:[bb.min.x, c.y, c.z], dir:[bb.max.x, c.y, c.z], frente:[c.x, c.y, bb.max.z], fundo:[c.x, c.y, bb.min.z]};
    Object.keys(a).forEach(k => { if(!ancoras[k]) ancoras[k] = a[k]; });
  }
  mundo.add(g);
  const no = registrar(id, g, mats, def, nivelObj);
  elems[id] = {g, ancoras, no, lib: libInfo};
  g.position.set(...no.base.pos); g.rotation.set(rad(no.base.rot[0]), rad(no.base.rot[1]), rad(no.base.rot[2])); g.scale.set(...no.base.esc);
}
function limparMundo(){
  efeitos.forEach(e => e.apagar && e.apagar());
  efeitos = [];
  if(mundo){ mundo.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material && !o.material.userData.keep) o.material.dispose && o.material.dispose(); }); if(mundo.parent) mundo.parent.remove(mundo); }
  mundo = new T3.Group(); E.SCENES.raiox.g.add(mundo);
  nos = {}; elems = {}; trilhas = {}; pulsos = []; giros = []; libAnims = []; blocos = []; tlRef = null; avisos.clear();
}
function montar(a){
  limparMundo(); anim = a;
  const amb = a.ambiente || {};
  layout = {pip: Object.assign({x:.03, y:.63, w:.36}, (a.layout || {}).pip || {}), legenda: num((a.layout || {}).legenda, 54)};
  // chão
  const fl = new T3.Mesh(new T3.CircleGeometry(40, 48), new T3.MeshStandardMaterial({color: amb.chao || '#d8c7a3', flatShading:true, roughness:1}));
  fl.rotation.x = -Math.PI/2; fl.position.y = num(amb.chao_y, 0); fl.receiveShadow = true; fl.userData.chao = true; mundo.add(fl); floor = fl;
  const pecas = a.pecas && typeof a.pecas === 'object' ? a.pecas : {};
  (Array.isArray(a.elementos) ? a.elementos : []).forEach(d => criarElemento(d, pecas));
  // enquadramento padrão: tudo no quadro, de frente
  const bb = new T3.Box3();
  Object.values(elems).forEach(el => bb.expandByObject(el.g));
  if(bb.isEmpty()) bb.set(new T3.Vector3(-1,0,-1), new T3.Vector3(1,2,1));
  const c = bb.getCenter(new T3.Vector3()), s = bb.getSize(new T3.Vector3());
  const k = 1/(2*Math.tan(rad(21)));
  const dist = Math.max(s.y*k*1.25, s.x*k*(16/9)*1.15, 3) + s.z*.5;
  quadro = {alvo:[c.x, c.y, c.z], dist, alt:s.y*.2, azim:0, fov:42};
  // "palco": a câmera principal do vídeo; os blocos só variam em torno dela ("base":true volta para ela)
  if(a.palco && typeof a.palco === 'object') ['alvo','dist','alt','azim','fov'].forEach(k => { if(a.palco[k] != null) quadro[k] = a.palco[k]; });
  if(a.ambiente) aplicarAmbiente();
}
function aplicarAmbiente(){
  if(!anim) return;
  const amb = anim.ambiente || {};
  const sk = Array.isArray(amb.fundo) && amb.fundo.length >= 4 ? amb.fundo : ['#6f9fc9','#a9c8de','#e6dac4','#fff6e6'];
  const u = E.SKY.material.uniforms;
  u.top.value.set(sk[0]); u.mid.value.set(sk[1]); u.hor.value.set(sk[2]); u.glow.value.set(sk[3]);
  if(E.scene.background && E.scene.background.isColor) E.scene.background.set(sk[2]); else E.scene.background = new T3.Color(sk[2]);
  E.scene.fog.color.set(sk[2]); E.scene.fog.near = 40; E.scene.fog.far = 120;
  if(!salvo) salvo = {h: E.hemi.intensity, s: E.sun.intensity, r: E.rim.intensity};
  E.hemi.color.set('#ffffff'); E.hemi.groundColor.set('#8f98a3'); E.hemi.intensity = .5;
  E.sun.color.set('#ffe9cc'); E.sun.intensity = .72; E.rim.intensity = .25;
}

/* ---------- referências: "id", "id.âncora", "id.parte" ou [x,y,z] ---------- */
const _v = new T3.Vector3();
function resolver(ref, out){
  out = out || new T3.Vector3();
  if(Array.isArray(ref)) return out.set(+ref[0]||0, +ref[1]||0, +ref[2]||0);
  if(typeof ref === 'string'){
    const i = ref.indexOf('.'), id = i < 0 ? ref : ref.slice(0, i), sub = i < 0 ? '' : ref.slice(i+1);
    const el = elems[id];
    if(!el){ avisar('referência "'+ref+'" não existe'); return out.set(0,0,0); }
    if(sub){
      if(el.ancoras[sub]){ const a = el.ancoras[sub]; return out.set(a[0], a[1], a[2]).applyMatrix4(el.g.matrixWorld); }
      const no = nos[id+'.'+sub];
      if(no) return out.setFromMatrixPosition(no.obj.matrixWorld);
      avisar('referência "'+ref+'" não existe'); return out.setFromMatrixPosition(el.g.matrixWorld);
    }
    return out.setFromMatrixPosition(el.g.matrixWorld);
  }
  return out.set(0,0,0);
}

/* =========================================================
   TRILHAS: cada ação de propriedade vira um trecho no tempo
   ========================================================= */
const addV = (a,b) => Array.isArray(a) ? [a[0]+b[0], a[1]+b[1], a[2]+b[2]] : a + b;
function mix(a, b, k){
  if(Array.isArray(a)) return [lerp(a[0],b[0],k), lerp(a[1],b[1],k), lerp(a[2],b[2],k)];
  if(a && a.isColor) return a.clone().lerp(b, k);
  return lerp(a, b, k);
}
function addSeg(nome, prop, seg){ (trilhas[nome+'|'+prop] = trilhas[nome+'|'+prop] || []).push(seg); }
function inicial(nome, prop){
  const no = nos[nome]; if(!no) return 0;
  return no.base[prop] != null ? no.base[prop] : 0;
}
function finalizarTrilhas(){
  for(const k in trilhas){
    const i = k.indexOf('|'), nome = k.slice(0, i), prop = k.slice(i+1), no = nos[nome];
    const arr = trilhas[k].sort((a,b) => a.t0 - b.t0);
    let cur = inicial(nome, prop);
    // elemento que só aparece por "mostrar" começa escondido (a menos que diga oculto:false)
    if(prop === 'vis' && no && no.base.oculto == null && arr[0].mostrar){ cur = 0; no.base.vis = 0; }
    arr.forEach(s => { s.from = cur; s.toAbs = s.delta ? addV(cur, s.delta) : s.to; cur = s.toAbs; });
  }
}
function val(nome, prop, t, ini){
  const arr = trilhas[nome+'|'+prop]; if(!arr) return ini;
  let v = ini;
  for(const s of arr){
    if(t < s.t0) return s.from;
    if(t < s.t1){ const p = (EASES[s.ease] || eIO)((t - s.t0)/Math.max(1e-6, s.t1 - s.t0)); return mix(s.from, s.toAbs, p); }
    v = s.toAbs;
  }
  return v;
}

/* =========================================================
   EFEITOS: fluxo de partículas, rótulos, setas e temperatura
   ========================================================= */
const _m4 = new T3.Matrix4(), _q = new T3.Quaternion(), _s = new T3.Vector3(), _p = new T3.Vector3();
function criarFluxo(a, t0, t1){
  const n = clamp(Math.round(num(a.qtd, 22)), 4, 80), vida = Math.max(.3, num(a.vida, 1.4)), gap = vida/n;
  const M = clamp(Math.ceil((t1 - t0)/gap) + n + 2, n+2, 500);
  const cor = a.cor || '#6cc0ff';
  const im = new T3.InstancedMesh(new T3.IcosahedronGeometry(num(a.tam, .05), 0), new T3.MeshStandardMaterial({color:cor, emissive:cor, emissiveIntensity:.35, flatShading:true, transparent:true, opacity:.92}), M);
  im.frustumCulled = false; im.castShadow = false; mundo.add(im);
  const refs = [a.de].concat(lista(a.via), [a.para]);
  const esp = num(a.espalhar, .05);
  return {t0, t1, fim: t1 + vida,
    upd(t){
      const vis = t >= t0 && t <= t1 + vida; im.visible = vis; if(!vis) return;
      const pts = refs.map(r => resolver(r, new T3.Vector3()));
      const curva = pts.length > 2 ? new T3.CatmullRomCurve3(pts, false, 'catmullrom', .3) : null;
      for(let k=0; k<M; k++){
        const e = t0 + k*gap, age = t - e;
        if(e > t1 || age < 0 || age > vida){ _m4.makeScale(0,0,0); im.setMatrixAt(k, _m4); continue; }
        const u = age/vida;
        if(curva) curva.getPoint(u, _p); else _p.copy(pts[0]).lerp(pts[1], u);
        const w = Math.sin(Math.PI*u)*esp;
        _p.x += (hash(k) - .5)*2*w; _p.y += (hash(k+91) - .5)*2*w; _p.z += (hash(k+177) - .5)*2*w;
        const sc = Math.min(1, u*6, (1-u)*6) * (.7 + hash(k+5)*.6);
        _m4.compose(_p, _q.identity(), _s.set(sc, sc, sc)); im.setMatrixAt(k, _m4);
      }
      im.instanceMatrix.needsUpdate = true;
    },
    apagar(){ if(im.parent) im.parent.remove(im); im.geometry.dispose(); im.material.dispose(); }};
}
function texRotulo(texto, estilo, cor){
  const key = estilo+'|'+cor+'|'+texto;
  if(texCache.has(key)) return texCache.get(key);
  const fs = 96, c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = '900 '+fs+'px '+SANS; const tw = Math.ceil(x.measureText(texto).width);
  let W, H;
  if(estilo === 'titulo'){ W = tw + fs*.6; H = fs*1.5; }
  else { W = tw + fs*(estilo === 'pilula' ? 2.0 : 1.2); H = fs*1.55; }
  c.width = Math.ceil(W); c.height = Math.ceil(H);
  x.font = '900 '+fs+'px '+SANS; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  const rr = (px,py,w,h,r) => { x.beginPath(); x.moveTo(px+r,py); x.arcTo(px+w,py,px+w,py+h,r); x.arcTo(px+w,py+h,px,py+h,r); x.arcTo(px,py+h,px,py,r); x.arcTo(px,py,px+w,py,r); x.closePath(); };
  if(estilo === 'titulo'){
    x.lineWidth = fs*.2; x.strokeStyle = '#141414'; x.strokeText(texto, c.width/2, c.height/2+4); x.fillStyle = cor || '#ffd60a'; x.fillText(texto, c.width/2, c.height/2+4);
  } else if(estilo === 'temp'){
    rr(6, 6, c.width-12, c.height-12, (c.height-12)/2); x.fillStyle = cor || '#e8554e'; x.fill(); x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke();
    x.fillStyle = '#fff'; x.fillText(texto, c.width/2, c.height/2+4);
  } else { // pílula: bolinha colorida + texto
    rr(6, 6, c.width-12, c.height-12, (c.height-12)/2); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 8; x.strokeStyle = cor || '#2f6fe4'; x.stroke();
    x.fillStyle = cor || '#2f6fe4'; x.beginPath(); x.arc(fs*.72, c.height/2, fs*.2, 0, 7); x.fill();
    x.fillStyle = '#141414'; x.textAlign = 'left'; x.fillText(texto, fs*1.08, c.height/2+4);
  }
  const tex = new T3.CanvasTexture(c); tex.encoding = T3.sRGBEncoding; tex.anisotropy = 4;
  const r = {tex, aspect: c.width/c.height}; texCache.set(key, r); return r;
}
/* Rótulos têm tamanho em TELA (fração da altura do vídeo), não em metros: ficam legíveis de perto e de longe. */
function criarSprite(){
  const s = new T3.Sprite(new T3.SpriteMaterial({transparent:true, depthTest:false, fog:false, sizeAttenuation:false})); s.renderOrder = 20; s.visible = false; mundo.add(s); return s;
}
const TAM_ROTULO = {pilula:.055, titulo:.1, temp:.07};
const _cl = new T3.Vector3(), _cf = new T3.Vector3(), _cr = new T3.Vector3(), _cu = new T3.Vector3();
// põe o sprite no ponto p (mundo) com um deslocamento [dx,dy] em fração da altura da tela e o tamanho h (fração da altura)
function posicionarSprite(spr, p, des, h, aspect, k){
  const cam = E.cam; cam.updateMatrixWorld();
  _cr.setFromMatrixColumn(cam.matrixWorld, 0); _cu.setFromMatrixColumn(cam.matrixWorld, 1); cam.getWorldDirection(_cf);
  const prof = Math.max(.1, _v.copy(p).sub(cam.position).dot(_cf)), sh = 2*Math.tan(rad(cam.fov/2))*prof;
  spr.position.copy(p).addScaledVector(_cr, des[0]*sh).addScaledVector(_cu, des[1]*sh);
  const maxW = .9*9/16; if(h*aspect > maxW) h = maxW/aspect; // nunca passa da largura do vídeo
  const sy = h*2*Math.tan(rad(cam.fov/2))*k;
  spr.scale.set(sy*aspect, sy, 1);
  // mantém o rótulo inteiro dentro da tela: empurra o centro para dentro se a borda passar
  {
    const ca = cam.aspect || 9/16, hwN = (h*aspect)*(1/ca)*Math.min(1, k), hhN = h*Math.min(1, k);   // meia largura/altura em NDC (aprox.)
    _cl.copy(spr.position).project(cam);
    const nx = clamp(_cl.x, -(.97 - hwN), .97 - hwN); let ny = clamp(_cl.y, -(.95 - hhN), .95 - hhN);
    // não fica em cima da legenda (faixa central do texto falado): sobe ou desce para fora dela
    const lc = 1 - 2*(layout.legenda/100), fx = .12 + hhN;
    if(Math.abs(ny - lc) < fx) ny = (lc + fx + hhN < .95) ? lc + fx : lc - fx;
    const sw = 2*Math.tan(rad(cam.fov/2))*prof*ca;
    if(nx !== _cl.x) spr.position.addScaledVector(_cr, (nx - _cl.x)/2*sw);
    if(ny !== _cl.y) spr.position.addScaledVector(_cu, (ny - _cl.y)/2*sh);
  }
}
function criarRotulo(a, t0, t1){
  const estilo = a.estilo || 'pilula', cor = a.cor || (estilo === 'titulo' ? '#ffd60a' : '#2f6fe4');
  const spr = criarSprite(), h = num(a.tam, TAM_ROTULO[estilo] || .055);
  const r = texRotulo(String(a.texto == null ? '' : a.texto), estilo, cor); spr.material.map = r.tex; spr.material.needsUpdate = true;
  const des = Array.isArray(a.desloc) && a.desloc.length >= 2 ? [+a.desloc[0]||0, +a.desloc[1]||0] : [0, .08];
  return {t0, t1,
    upd(t){
      const ok = t >= t0 && t <= t1; spr.visible = ok; if(!ok) return;
      const k = Math.max(.001, eBack(clamp((t-t0)/.28, 0, 1)) * clamp((t1-t)/.2, 0, 1));
      resolver(a.alvo || a.ponto, _p); posicionarSprite(spr, _p, des, h, r.aspect, k);
    },
    apagar(){ if(spr.parent) spr.parent.remove(spr); spr.material.dispose(); }};
}
function criarTemperatura(a, t0, t1){
  const spr = criarSprite(), h = num(a.tam, TAM_ROTULO.temp), de = num(a.de, 20), para = num(a.para, 4), un = a.unidade == null ? ' °C' : a.unidade;
  const cA = new T3.Color(a.cor_de || (para < de ? '#e8554e' : '#3a8fe8')), cB = new T3.Color(a.cor_para || (para < de ? '#3a8fe8' : '#e8554e'));
  const des = Array.isArray(a.desloc) && a.desloc.length >= 2 ? [+a.desloc[0]||0, +a.desloc[1]||0] : [0, .08], dur = Math.max(.2, num(a.dur, 2));
  return {t0, t1,
    upd(t){
      const ok = t >= t0 && t <= t1; spr.visible = ok; if(!ok) return;
      const p = eIO(clamp((t-t0)/dur, 0, 1)), v = Math.round(lerp(de, para, p));
      const r = texRotulo(v+un, 'temp', '#'+cA.clone().lerp(cB, p).getHexString());
      if(spr.material.map !== r.tex){ spr.material.map = r.tex; spr.material.needsUpdate = true; }
      const k = Math.max(.001, eBack(clamp((t-t0)/.28, 0, 1)) * clamp((t1-t)/.2, 0, 1));
      resolver(a.alvo, _p); posicionarSprite(spr, _p, des, h, r.aspect, k);
    },
    apagar(){ if(spr.parent) spr.parent.remove(spr); spr.material.dispose(); }};
}
function criarSeta(a, t0, t1){
  const g = new T3.Group(), cor = a.cor || '#ff5a3c', s = num(a.tam, .7);
  const mt = new T3.MeshStandardMaterial({color:cor, emissive:cor, emissiveIntensity:.25, flatShading:true});
  // a seta é construída apontando para BAIXO (-Y), com a ponta na origem e o corpo para cima
  const ponta = new T3.Mesh(new T3.ConeGeometry(.13*s, .26*s, 8), mt); ponta.rotation.x = Math.PI; ponta.position.y = .13*s; g.add(ponta);
  const haste = new T3.Mesh(new T3.CylinderGeometry(.045*s, .045*s, .5*s, 6), mt); haste.position.y = .26*s + .25*s; g.add(haste);
  g.visible = false; g.renderOrder = 15; mundo.add(g);
  const dir = new T3.Vector3(...vec(a.dir, [0,-1,0])).normalize(); const folga = num(a.folga, .12);
  const down = new T3.Vector3(0,-1,0);
  return {t0, t1,
    upd(t){
      const ok = t >= t0 && t <= t1; g.visible = ok; if(!ok) return;
      resolver(a.alvo, _p);
      const k = Math.max(.001, eBack(clamp((t-t0)/.25, 0, 1)) * clamp((t1-t)/.2, 0, 1));
      const bob = Math.sin((t-t0)*7)*.07;
      g.quaternion.setFromUnitVectors(down, dir);
      g.position.copy(_p).addScaledVector(dir, -(folga + .05 + bob)); g.scale.setScalar(k);
    },
    apagar(){ if(g.parent) g.parent.remove(g); g.traverse(o => { if(o.geometry) o.geometry.dispose(); }); mt.dispose(); }};
}

/* =========================================================
   COMPILAÇÃO: transforma blocos + timeline em trilhas e efeitos
   ========================================================= */
function tempoDe(em, l){
  if(em == null) return l.start;
  if(typeof em === 'number') return l.start + em;
  if(typeof em === 'string'){
    if(em.endsWith('%')) return l.start + parseFloat(em)/100*l.dur;
    if(em === 'fim') return l.start + l.dur;
    const n = parseFloat(em); if(isFinite(n)) return l.start + n;
  }
  if(em && typeof em === 'object' && em.palavra != null){
    const ws = E.wordsOf(l) || []; let idx = em.palavra;
    if(typeof idx === 'string'){ const nz = norm(idx); idx = ws.findIndex(w => norm(w.w).startsWith(nz)); if(idx < 0){ avisar('palavra "'+em.palavra+'" não está na fala'); idx = 0; } }
    idx = clamp(idx|0, 0, Math.max(0, ws.length-1));
    return l.start + (ws[idx] ? ws[idx].t : 0) + num(em.mais, 0);
  }
  return l.start;
}
const DUR = {crescer:.9, mostrar:.4, esconder:.25, mover:.7, girar:.7, escalar:.45, cor:.5, nivel:1.2, destacar:.7, vibrar:.6, fluxo:2, temperatura:2};
const EIXO = {x:0, y:1, z:2};
function nomes(alvo){ const gr = anim && anim.grupos && typeof anim.grupos === 'object' ? anim.grupos : {}; const ex = []; lista(alvo).forEach(n => { if(typeof n === 'string' && Array.isArray(gr[n]) && !nos[n]) ex.push(...gr[n]); else ex.push(n); }); return ex.filter(n => { if(typeof n === 'string' && nos[n]) return true; avisar('alvo "'+n+'" não existe'); return false; }); }
function compilarAcao(a, rec){
  if(!a || typeof a !== 'object'){ return; }
  const l = rec.l, t0 = tempoDe(a.em, l), dur = Math.max(.01, num(a.dur, DUR[a.faz] || .5)), t1 = t0 + dur;
  const ease = a.ease && EASES[a.ease] ? a.ease : null;
  const fimBloco = rec.t1;
  switch(a.faz){
    case 'mostrar': nomes(a.alvo).forEach(n => addSeg(n, 'vis', {t0, t1, to:1, ease: ease || 'pulo', mostrar:true})); break;
    case 'esconder': nomes(a.alvo).forEach(n => addSeg(n, 'vis', {t0, t1, to:0, ease: ease || 'suave'})); break;
    case 'mover': nomes(a.alvo).forEach(n => addSeg(n, 'pos', a.para ? {t0, t1, to:vec(a.para), ease} : {t0, t1, delta:vec(a.delta), ease})); break;
    case 'crescer': nomes(a.alvo).forEach(n => { // o elemento brota do chão (ou da base dele), com a base parada
      const no = nos[n], el = elems[n];
      addSeg(n, 'vis', {t0, t1:t0 + .02, to:1, ease:'linear', mostrar:true});
      if(!el){ return; }
      const e = no.base.esc, p0 = no.base.pos, minY = (el.ancoras.base ? el.ancoras.base[1] : 0)*e[1], fin = .001;
      addSeg(n, 'esc', {t0:t0 - .02, t1:t0, to:[e[0], fin, e[2]], ease:'linear'});
      addSeg(n, 'pos', {t0:t0 - .02, t1:t0, to:[p0[0], p0[1] + minY*(1 - fin/e[1]), p0[2]], ease:'linear'});
      addSeg(n, 'esc', {t0, t1, to:e.slice(), ease: ease || 'saida'});
      addSeg(n, 'pos', {t0, t1, to:p0.slice(), ease: ease || 'saida'});
    }); break;
    case 'girar': nomes(a.alvo).forEach(n => {
      let d = [0,0,0];
      if(Array.isArray(a.graus)) d = vec(a.graus); else if(EIXO[a.eixo] != null) d[EIXO[a.eixo]] = num(a.graus, 90); else d[1] = num(a.graus, 90);
      addSeg(n, 'rot', {t0, t1, delta:d, ease}); }); break;
    case 'escalar': nomes(a.alvo).forEach(n => addSeg(n, 'esc', {t0, t1, to: Array.isArray(a.para) ? vec(a.para, [1,1,1]) : [num(a.para,1), num(a.para,1), num(a.para,1)], ease})); break;
    case 'cor': nomes(a.alvo).forEach(n => addSeg(n, 'cor', {t0, t1, to:corSegura(a.para || '#ffffff'), ease})); break;
    case 'nivel': nomes(a.alvo).forEach(n => addSeg(n, 'nivel', {t0, t1, to:clamp(num(a.para, 1), 0, 1), ease})); break;
    case 'destacar': nomes(a.alvo).forEach(n => { pulsos.push({nome:n, t0, t1, tipo:'destacar', cor:a.cor || '#fff3b0'}); nos[n].temPulso = true; }); break;
    case 'vibrar': nomes(a.alvo).forEach(n => { pulsos.push({nome:n, t0, t1, tipo:'vibrar', amp:num(a.forca, .03)}); }); break;
    case 'girar_continuo': nomes(a.alvo).forEach(n => giros.push({nome:n, t0, t1: a.dur != null ? t1 : Infinity, eixo: EIXO[a.eixo] != null ? EIXO[a.eixo] : 1, vel:num(a.vel, 180)})); break;
    case 'fluxo': if(a.de == null || a.para == null){ avisar('fluxo precisa de "de" e "para"'); break; } efeitos.push(criarFluxo(a, t0, t1)); break;
    case 'rotulo': efeitos.push(criarRotulo(a, t0, a.dur != null ? t1 : fimBloco)); break;
    case 'seta': efeitos.push(criarSeta(a, t0, a.dur != null ? t1 : fimBloco)); break;
    case 'anim': {
      const ids = lista(a.alvo);
      ids.forEach(id => {
        const el = elems[id];
        if(!el || !el.lib){ avisar('"anim" precisa de um elemento da biblioteca; "'+id+'" não é'); return; }
        const an = el.lib.def.animacoes[a.nome];
        if(!an){ avisar('o objeto "'+el.lib.def.id+'" não tem a animação "'+a.nome+'" (tem: '+Object.keys(el.lib.def.animacoes).join(', ')+')'); return; }
        const dd = a.dur != null ? Math.max(.05, num(a.dur, an.dur)) : an.dur;
        const fim = an.loop ? (a.dur != null ? t0 + dd : Infinity) : t0 + dd;
        libAnims.push({el, an, t0, t1: fim, args: a.args && typeof a.args === 'object' ? a.args : {}});
      });
      break; }
    case 'temperatura': efeitos.push(criarTemperatura(a, t0, a.dur != null && a.ate_fim !== true ? t1 + num(a.fica, 1.2) : fimBloco)); break;
    default: avisar('ação "'+a.faz+'" não existe');
  }
}
function normCam(c, prev){
  const base = (prev && !c.base) ? prev.b : quadro;
  const A = {}, B = {};
  ['alvo','dist','alt','azim'].forEach(k => {
    const d = base[k] != null ? base[k] : (k === 'alvo' ? (base.olha || [0,1,0]) : 0);
    A[k] = c[k] != null ? c[k] : d; B[k] = c[k+'_fim'] != null ? c[k+'_fim'] : A[k]; });
  if(c.zoom != null && c.dist == null) A.dist = base.dist/clamp(num(c.zoom, 1), .3, 4);
  if(c.zoom_fim != null && c['dist_fim'] == null) B.dist = base.dist/clamp(num(c.zoom_fim, 1), .3, 4); else if(c.dist_fim == null) B.dist = A.dist;
  A.fov = num(c.fov, base.fov || 42); B.fov = num(c.fov_fim, A.fov);
  const mv = c.movimento;
  if(mv === 'orbitar'){ B.azim = A.azim + num(c.graus, 50); }
  else if(mv === 'aproximar'){ B.dist = A.dist*.72; }
  else if(mv === 'afastar'){ B.dist = A.dist*1.35; }
  else if(mv === 'subir'){ B.alt = A.alt + 1; }
  if(c.pos){ A.pos = c.pos; A.olha = c.olha || A.alvo; B.pos = c.pos_fim || A.pos; B.olha = c.olha_fim || A.olha; }
  return {a:A, b:B, ease: c.ease && EASES[c.ease] ? c.ease : 'suave'};
}
function compilar(){
  efeitos.forEach(e => e.apagar && e.apagar()); efeitos = []; trilhas = {}; pulsos = []; giros = []; libAnims = []; blocos = [];
  Object.values(nos).forEach(n => { n.temPulso = false; });
  const tl = E.timeline(), s = E.script(); tlRef = tl;
  const lista_ = Array.isArray(anim.blocos) ? anim.blocos : [], porId = {};
  lista_.forEach(b => { if(b && b.id) porId[b.id] = b; });
  let ult = null;
  tl.forEach(l => {
    if(l.auto) return;
    const f = s.falas[l.i]; if(!f) return;
    const b = f.bloco ? porId[f.bloco] : lista_[l.i];
    if(f.bloco && !porId[f.bloco]) avisar('a fala '+(l.i+1)+' aponta para o bloco "'+f.bloco+'", que não existe');
    const rec = {id: b && b.id, i:l.i, t0: blocos.length ? l.start : 0, t1: l.start + l.dur + Math.max(0, l.gap), l, b: b || null};
    rec.cam = normCam(b && b.camera ? b.camera : {}, ult); ult = rec.cam;
    rec.trans = b && b.transicao && typeof b.transicao === 'object' ? b.transicao : null;
    blocos.push(rec);
  });
  if(blocos.length) blocos[blocos.length-1].t1 = Math.max(blocos[blocos.length-1].t1, E.total());
  blocos.forEach(rec => { if(rec.b) (Array.isArray(rec.b.acoes) ? rec.b.acoes : []).forEach(a => compilarAcao(a, rec)); });
  finalizarTrilhas();
  RX.atualizarAvisos();
}

/* =========================================================
   QUADRO A QUADRO
   ========================================================= */
function aplicarNo(no, t){
  const k = no.nome, b = no.base;
  let rot = val(k, 'rot', t, b.rot), esc = val(k, 'esc', t, b.esc), vis = val(k, 'vis', t, b.vis);
  const pos = val(k, 'pos', t, b.pos).slice();
  for(const g of giros){ if(g.nome === k && t > g.t0){ rot = rot.slice(); rot[g.eixo] += g.vel*(Math.min(t, g.t1) - g.t0); } }
  let m = 1, brilho = 0, bcor = null;
  for(const p of pulsos){
    if(p.nome !== k || t < p.t0 || t > p.t1) continue;
    const q = (t - p.t0)/(p.t1 - p.t0);
    if(p.tipo === 'vibrar') pos[0] += Math.sin(t*70)*p.amp*(1 - q);
    else { m *= 1 + .14*Math.sin(Math.PI*q); brilho = Math.max(brilho, Math.sin(Math.PI*q)); bcor = p.cor; }
  }
  const o = no.obj;
  o.position.set(pos[0], pos[1], pos[2]); o.rotation.set(rad(rot[0]), rad(rot[1]), rad(rot[2]));
  const sv = Math.max(0, vis) * m;
  o.scale.set(esc[0]*sv, esc[1]*sv, esc[2]*sv);
  if(no.nivelObj){ // líquido: o nível é a escala em Y da própria malha (parte) ou da malha filha (elemento)
    const n = Math.max(.001, val(k, 'nivel', t, b.nivel));
    if(no.nivelObj === o) o.scale.y = esc[1]*sv*n; else no.nivelObj.scale.y = n;
  }
  o.visible = vis > .002;
  if(trilhas[k+'|cor']){ const c = val(k, 'cor', t, b.cor); no.mats.forEach(mm => mm.color.copy(c)); }
  if(no.temPulso || brilho > 0) no.mats.forEach(mm => {
    if(brilho > 0){ mm.emissive.set(bcor || '#fff3b0'); mm.emissiveIntensity = .7*brilho; }
    else { mm.emissive.copy(mm.userData.e.c); mm.emissiveIntensity = mm.userData.e.i; } });
}
function blocoEm(t){
  let r = blocos[0] || null;
  for(const b of blocos){ if(t >= b.t0) r = b; else break; }
  return r;
}
const _pos = new T3.Vector3(), _look = new T3.Vector3(), _a = new T3.Vector3(), _b = new T3.Vector3();
function poseCamera(rec, t){
  const c = rec.cam, A = c.a, B = c.b;
  const p = (EASES[c.ease] || eIO)(clamp((t - rec.t0)/Math.max(.01, rec.t1 - rec.t0), 0, 1));
  if(A.pos){
    resolver(A.pos, _a); resolver(B.pos, _b); _pos.copy(_a).lerp(_b, p);
    resolver(A.olha, _a); resolver(B.olha, _b); _look.copy(_a).lerp(_b, p);
  } else {
    resolver(A.alvo, _a); resolver(B.alvo, _b); _look.copy(_a).lerp(_b, p);
    const az = rad(lerp(A.azim, B.azim, p)), d = lerp(A.dist, B.dist, p), al = lerp(A.alt, B.alt, p);
    _pos.set(_look.x + Math.sin(az)*d, _look.y + al, _look.z + Math.cos(az)*d);
  }
  return {pos:_pos, look:_look, fov: lerp(A.fov, B.fov, p)};
}

RX.ativo = function(script){
  const a = script && script.animacao;
  if(!a || typeof a !== 'object') return false;
  if(a !== animSrc){ animSrc = a; montar(a); }
  return true;
};
RX.ligado = () => ligado;
RX.pipLigado = () => { try{ return localStorage.getItem('rx-pip') !== '0'; }catch(e){ return true; } };
RX.pipDefinir = v => { try{ localStorage.setItem('rx-pip', v ? '1' : '0'); }catch(e){} };
RX.legendaPos = () => layout.legenda;
RX.atualizar = function(t, l, T, o){
  o = o || {};
  if(tlRef !== E.timeline()) compilar();
  if(!ligado){ ligado = true; }
  E.zuco.g.visible = false; E.guest.g.visible = false; E.SKY.visible = true; E.SCENES.raiox.g.visible = true;
  aplicarAmbiente();
  Object.values(elems).forEach(el => { if(el.lib && window.RAIOX_LIB) window.RAIOX_LIB.reset(el.lib.partes); });
  for(const k in nos) aplicarNo(nos[k], t);
  libAnims.forEach(la => { if(t < la.t0 || (la.an.loop && t > la.t1)) return; const tt = la.an.loop ? (t - la.t0) : Math.min(1, (t - la.t0)/Math.max(.01, la.t1 - la.t0))*la.an.dur; la.an.aplicar(la.el.lib.partes, tt, la.args, la.el.g); });
  mundo.updateMatrixWorld(true);
  // nuvens balançam com o tempo do vídeo
  Object.values(elems).forEach(el => el.g.traverse(ob => { if(ob.userData.nuvem) ob.children.forEach(c => { c.position.y = c.userData.y0 + Math.sin(t*1.6 + c.userData.i)*.04; }); }));
  const rec = blocoEm(t);
  if(!o.freeCam){
    const cp = rec ? poseCamera(rec, t) : {pos:_pos.set(0,2,6), look:_look.set(0,1,0), fov:42};
    E.cam.position.copy(cp.pos); E.cam.up.set(0,1,0); E.cam.lookAt(cp.look);
    if(Math.abs(E.cam.fov - cp.fov) > 1e-3){ E.cam.fov = cp.fov; E.cam.updateProjectionMatrix(); }
  }
  efeitos.forEach(e => e.upd(t)); // depois da câmera: rótulos dependem dela
};
RX.desligar = function(){
  if(!ligado) return;
  ligado = false; E.zuco.g.visible = true; E.guest.g.visible = true; E.SKY.visible = true;
  if(salvo){ E.rim.intensity = salvo.r; salvo = null; } // hemi e sun voltam sozinhos quando o cenário troca
  if(E.cam.fov !== 42){ E.cam.fov = 42; E.cam.updateProjectionMatrix(); }
};

/* ---------- Zuco no cantinho (picture-in-picture) ---------- */
const pipCam = new T3.PerspectiveCamera(34, 1, .1, 40), pipCor = new T3.Color('#3b3560');
function pipRect(vw, vh){
  const p = layout.pip, w = vw*p.w;
  return {x: vw*p.x, y: vh*p.y, w, h: w*(num(p.ar, 1.0))};
}
RX.pip = function(R){
  if(!ligado || !RX.pipLigado()) return;
  const sz = R.getSize(new T3.Vector2());
  const vw = Math.min(sz.x, sz.y*9/16), vh = vw*16/9, ox = (sz.x - vw)/2, oy = (sz.y - vh)/2;
  const r = pipRect(vw, vh), x = ox + r.x, y = oy + r.y, gy = sz.y - (y + r.h);
  const sc = E.scene, zu = E.zuco, bg = sc.background, fog = sc.fog, hs = E.SCENES.raiox.g.visible;
  R.setRenderTarget(null);
  R.setScissorTest(true); R.setViewport(x, gy, r.w, r.h); R.setScissor(x, gy, r.w, r.h);
  // fundo transparente: não limpa a cor, só a profundidade; o Zuco é desenhado direto por cima do mundo
  const ac = R.autoClear; R.autoClear = false; R.clearDepth();
  sc.background = null; sc.fog = null; E.SKY.visible = false; E.SCENES.raiox.g.visible = false; zu.g.visible = true;
  pipCam.aspect = r.w/r.h; pipCam.updateProjectionMatrix();
  const p = zu.g.position;
  pipCam.position.set(p.x + .35, p.y + .12, p.z + 1.9); pipCam.lookAt(p.x - .01, p.y + .0, p.z);
  R.render(sc, pipCam); R.autoClear = ac;
  zu.g.visible = false; sc.background = bg; sc.fog = fog; E.SKY.visible = true; E.SCENES.raiox.g.visible = hs;
  R.setScissorTest(false); R.setViewport(0, 0, sz.x, sz.y);
};
// moldura do Zuco e transições: desenhadas junto da legenda (drawCaptions), iguais no preview e no vídeo
RX.overlay = function(ctx, ox, oy, vw, vh, U, st){
  if(!ligado) return;
  const r = pipRect(vw, vh), x = ox + r.x, y = oy + r.y;
  ctx.save(); // sem moldura: o Zuco fica solto sobre a animação
  const t = st && st.t != null ? st.t : 0, rec = blocoEm(t);
  if(rec && rec.trans && rec.trans.tipo && rec.trans.tipo !== 'corte'){
    const d = Math.max(.1, num(rec.trans.dur, .35)), q = (t - rec.t0)/d;
    if(q >= 0 && q < 1){
      ctx.globalAlpha = 1 - q; ctx.fillStyle = rec.trans.tipo === 'flash' ? '#ffffff' : '#000000';
      ctx.fillRect(ox, oy, vw, vh);
    }
  }
  ctx.restore();
};

/* =========================================================
   INTERFACE: cartão "Animação (Raio-X)" com o JSON e a lista de blocos
   ========================================================= */
let ui = null;
RX.atualizarAvisos = function(){
  if(!ui) return;
  const n = avisos.size;
  ui.msg.className = 'msg' + (n ? ' err' : '');
  ui.msg.textContent = n ? 'Avisos: ' + [...avisos].slice(0, 6).join(' · ') : (anim ? 'Animação ativa: '+Object.keys(elems).length+' elementos, '+blocos.length+' blocos.' : 'Sem animação neste roteiro.');
};
function msg(t, err){ if(!ui) return; ui.msg.textContent = t; ui.msg.className = 'msg' + (err ? ' err' : ''); }
function textoDoJSON(){ return E.script() && E.script().animacao ? JSON.stringify(E.script().animacao, null, 2) : ''; }
RX.sincronizarUI = function(){ if(ui && document.activeElement !== ui.ed) ui.ed.value = textoDoJSON(); RX.renderBlocos(); };
function mesclar(base, novo){
  const out = JSON.parse(JSON.stringify(base || {}));
  Object.keys(novo).forEach(k => {
    if(k === 'elementos' || k === 'blocos'){
      out[k] = Array.isArray(out[k]) ? out[k] : [];
      lista(novo[k]).forEach(it => { const i = it && it.id ? out[k].findIndex(x => x.id === it.id) : -1; if(i >= 0) out[k][i] = it; else out[k].push(it); });
    } else if(k === 'pecas' || k === 'ambiente' || k === 'layout' || k === 'grupos') out[k] = Object.assign({}, out[k] || {}, novo[k]);
    else out[k] = novo[k];
  });
  return out;
}
function aplicarTexto(modo){
  const s = E.script(); if(!s){ return; }
  let j;
  try{ j = JSON.parse(ui.ed.value); }catch(e){ msg('O JSON da animação está com erro: '+e.message, true); return; }
  if(!j || typeof j !== 'object' || Array.isArray(j)){ msg('A animação precisa ser um objeto JSON.', true); return; }
  if(j.animacao && typeof j.animacao === 'object' && !j.elementos && !j.blocos) j = j.animacao; // aceita colar com a chave "animacao"
  s.animacao = modo === 'mesclar' ? mesclar(s.animacao, j) : j;
  E.refazer(); RX.sincronizarUI(); ui.ed.value = textoDoJSON();
  msg(modo === 'mesclar' ? 'Alterações mescladas por id.' : 'Animação aplicada.');
}
function trecho(t, n){ t = String(t||'').replace(/\s+/g,' ').trim(); return t.length > n ? t.slice(0, n-1)+'…' : (t || '(bloco sem fala)'); }
RX.renderBlocos = function(){
  if(!ui) return;
  const s = E.script(), tl = E.timeline(), ol = ui.blocos; ol.innerHTML = '';
  if(!s || !tl) return;
  const itens = tl.filter(l => !l.auto);
  ui.vazio.hidden = itens.length > 0 && RX.ativo(s);
  itens.forEach((l, pos) => {
    const li = document.createElement('li'); li.draggable = true; li.dataset.i = l.i;
    const f = s.falas[l.i] || {};
    li.innerHTML = '<span class="rxn"></span><span class="rxt"></span><span class="rxd"></span><span class="rxb"></span>';
    li.querySelector('.rxn').textContent = (pos+1);
    li.querySelector('.rxt').textContent = trecho(f.texto, 70) + (f.bloco ? '  ['+f.bloco+']' : '');
    li.querySelector('.rxd').textContent = l.dur.toFixed(1)+' s';
    const bx = li.querySelector('.rxb');
    const bt = (rot, tit, fn, dis) => { const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = rot; b.title = tit; b.disabled = !!dis; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); bx.appendChild(b); };
    bt('▶', 'Ver só este bloco', () => E.tocar(pos ? l.start : 0, l.start + l.dur + Math.max(0, l.gap)*.8));
    bt('⏺', 'Gravar só este bloco em MP4 (para conferir)', () => gravar(itens, pos));
    bt('↑', 'Subir', () => mover(l.i, l.i-1), l.i === 0);
    bt('↓', 'Descer', () => mover(l.i, l.i+1), l.i === s.falas.length-1);
    bt('−', 'Encurtar 0,5 s (não passa do tempo da voz)', () => duracao(l, -.5));
    bt('+', 'Esticar 0,5 s (segura a imagem depois da voz)', () => duracao(l, .5));
    bt('✕', 'Apagar este bloco', () => { if(s.falas.length > 1){ s.falas.splice(l.i, 1); E.refazer(); E.selecionar(Math.min(l.i, s.falas.length-1)); } }, s.falas.length <= 1);
    li.addEventListener('click', () => E.selecionar(l.i, true));
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(l.i)); li.classList.add('arrasta'); });
    li.addEventListener('dragend', () => li.classList.remove('arrasta'));
    li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('alvo'); });
    li.addEventListener('dragleave', () => li.classList.remove('alvo'));
    li.addEventListener('drop', e => { e.preventDefault(); li.classList.remove('alvo'); const de = +e.dataTransfer.getData('text/plain'); if(isFinite(de) && de !== l.i) mover(de, l.i); });
    ol.appendChild(li);
  });
};
// grava um bloco (ou todos, em sequência) em videos/<titulo>-bloco-NN.mp4. O vídeo final é a exportação normal, que junta tudo igual.
function faixa(itens, pos){ const l = itens[pos]; return [pos ? l.start : 0, pos === itens.length-1 ? E.total() : l.start + l.dur + Math.max(0, l.gap)]; }
async function gravar(itens, pos){
  if(E.emExportacao()) return;
  const [de, ate] = faixa(itens, pos);
  msg('Gravando o bloco '+(pos+1)+'…');
  const ok = await E.gravar(de, ate, '-bloco-'+String(pos+1).padStart(2, '0'));
  msg(ok ? 'Bloco '+(pos+1)+' gravado na pasta videos.' : 'Não consegui gravar o bloco '+(pos+1)+'. Veja a mensagem perto do botão Exportar.', !ok);
}
async function gravarTodos(){
  const s = E.script(); if(!s || E.emExportacao()) return;
  const itens = E.timeline().filter(l => !l.auto);
  for(let k = 0; k < itens.length; k++){
    msg('Gravando o bloco '+(k+1)+' de '+itens.length+'…');
    const ok = await E.gravar(...faixa(itens, k), '-bloco-'+String(k+1).padStart(2, '0'));
    if(!ok){ msg('Parei no bloco '+(k+1)+'. Veja a mensagem perto do botão Exportar.', true); return; }
  }
  msg('Todos os '+itens.length+' blocos foram gravados na pasta videos. Se estiver tudo certo, use "Exportar vídeo" para o vídeo completo.');
}
function mover(de, para){
  const s = E.script(); if(!s || para < 0 || para >= s.falas.length) return;
  const f = s.falas.splice(de, 1)[0]; s.falas.splice(para, 0, f);
  E.refazer(); E.selecionar(para);
}
function duracao(l, d){
  const s = E.script(), f = s.falas[l.i]; if(!f) return;
  const natural = E.natural(l);
  const alvo = Math.round((l.dur + d)*10)/10;
  if(alvo <= natural + .05) delete f.duracao; else f.duracao = alvo;
  E.refazer();
}
RX.timelineMudou = function(){ tlRef = null; RX.renderBlocos(); };
RX.montarUI = function(host){
  const css = document.createElement('style');
  css.textContent = '#rxBlocos{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}'
    + '#rxBlocos li{display:grid;grid-template-columns:26px 1fr auto auto;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--line,#ddd);border-radius:8px;cursor:pointer;font-size:13px}'
    + '#rxBlocos li.arrasta{opacity:.4}#rxBlocos li.alvo{outline:2px dashed #2f6fe4}'
    + '#rxBlocos .rxn{font-weight:700;opacity:.6}#rxBlocos .rxd{opacity:.7;font-variant-numeric:tabular-nums}#rxBlocos .rxb{display:flex;gap:4px}'
    + '#rxEditor{width:100%;box-sizing:border-box;min-height:220px;font:12px/1.4 ui-monospace,Consolas,monospace}';
  document.head.appendChild(css);
  // modo Raio-X: esconde o que é só do estúdio do Zuco (convidado, cenários, formatos, final) e renomeia a voz
  const css2 = document.createElement('style');
  css2.textContent = '#cardIA,[data-fold="convidado"],[data-fold="final"],#fZ,#fG,#elG,#elPrevG,#nvG,#ntG,#nsG,#bvG,#volG,#volAuto,#ritmoSel{display:none!important}'
    + '[for="elG"],[for="nvG"],[for="ntG"],[for="nsG"],[for="bvG"],[for="volG"],[for="volAuto"],[for="ritmoSel"],.field.ms:has(#ntG){display:none!important}';
  document.head.appendChild(css2);
  const ren = (sel, txt) => { const e = document.querySelector(sel); if(e) e.textContent = txt; };
  ren('[for="elZ"]', 'Voz do narrador'); ren('[for="nvZ"]', 'Voz do narrador'); ren('[for="bvZ"]', 'Voz do narrador'); ren('[for="volZ"]', 'Volume da voz'); ren('#elPrevZ', '▶ Ouvir a voz');
  host.innerHTML = '<div class="card"><h2>Criar vídeo</h2>'
    + '<p class="note">Vídeos longos saem em partes: o cenário e as peças ficam iguais e cada parte acrescenta elementos novos. Passo a passo: 1) escreva o tema e escolha o tamanho; 2) baixe o arquivo do prompt e anexe na IA (ChatGPT, Claude…); 3) baixe o arquivo JSON que ela devolver e solte aqui. Repita para as próximas partes.</p>'
    + '<label class="row" style="gap:6px;font-size:13px;margin:4px 0"><input type="checkbox" id="rxPip"> Mostrar o apresentador (Zuco) no canto da tela</label>'
    + '<div class="row"><input id="rxTema" type="text" placeholder="Tema do vídeo (ex.: Como funciona o monitor?)" style="flex:1;min-width:200px">'
    + '<select id="rxDur">'+DURACOES.map(d => '<option value="'+d[0]+'">'+d[1]+'</option>').join('')+'</select>'
    + '<select id="rxParte"></select><button class="btn primary" id="rxCopiar">Copiar prompt</button><button class="btn" id="rxBaixar">Baixar prompt (.txt)</button></div>'
    + '<p class="note" id="rxInfo"></p>'
    + '<div id="rxDrop" style="border:2px dashed var(--line,#bbb);border-radius:10px;padding:12px;margin:8px 0;text-align:center;font-size:13px">Arraste aqui os arquivos das partes (<b>.json</b>) ou <label style="text-decoration:underline;cursor:pointer">escolha no computador<input id="rxArq" type="file" multiple accept=".json,.txt,application/json,text/plain" hidden></label>. Pode ser em qualquer ordem: o estúdio lê o número da parte, monta na ordem certa e avisa o que falta.<div id="rxFila" class="note" style="margin-top:6px"></div></div>'
    + '<textarea id="rxResp" spellcheck="false" placeholder="Ou cole aqui o JSON da parte (texto)" style="width:100%;box-sizing:border-box;min-height:110px;font:12px/1.4 ui-monospace,Consolas,monospace"></textarea>'
    + '<div class="row"><button class="btn primary" id="rxAdd">Adicionar parte ao vídeo</button></div>'
    + '<span class="msg" id="rxMsg2"></span></div>'
    + '<div class="card"><h2>Animação (Raio-X)</h2>'
    + '<p class="note">O JSON da animação (peças, elementos e blocos) pode vir junto do roteiro ou ser colado aqui. “Mesclar” troca só o que tem o mesmo id e acrescenta o resto, para você pedir alterações pontuais à IA.</p>'
    + '<textarea id="rxEditor" spellcheck="false" aria-label="Animação em JSON"></textarea>'
    + '<div class="row"><button class="btn primary" id="rxAplicar">Aplicar animação</button><button class="btn" id="rxMesclar">Mesclar por id</button><button class="btn" id="rxExemplo">Exemplo: descarga</button><button class="btn" id="rxExemplo2">Exemplo: prédio (2 partes)</button><button class="btn" id="rxExemplo3">Exemplo: furacão (biblioteca)</button></div>'
    + '<span class="msg" id="rxMsg"></span>'
    + '<h2 style="margin-top:14px">Blocos</h2><div class="row" style="margin-bottom:8px"><button class="btn" id="rxGravarTodos">Gravar todos os blocos (para conferir)</button></div>'
    + '<p class="note" id="rxVazio" hidden>Este roteiro ainda não tem animação. Use o formato “Raio-X” no gerador de prompt.</p>'
    + '<ol id="rxBlocos"></ol></div>';
  ui = {fila: host.querySelector('#rxFila'), tema: host.querySelector('#rxTema'), dur: host.querySelector('#rxDur'), parte: host.querySelector('#rxParte'), info: host.querySelector('#rxInfo'), resp: host.querySelector('#rxResp'), msg2: host.querySelector('#rxMsg2'),
    ed: host.querySelector('#rxEditor'), msg: host.querySelector('#rxMsg'), blocos: host.querySelector('#rxBlocos'), vazio: host.querySelector('#rxVazio')};
  host.querySelector('#rxAplicar').addEventListener('click', () => aplicarTexto('substituir'));
  host.querySelector('#rxGravarTodos').addEventListener('click', gravarTodos);
  host.querySelector('#rxMesclar').addEventListener('click', () => aplicarTexto('mesclar'));
  host.querySelector('#rxExemplo').addEventListener('click', () => { if(window.RAIOX_EXEMPLO) E.carregar(JSON.parse(JSON.stringify(window.RAIOX_EXEMPLO))); });
  host.querySelector('#rxExemplo3').addEventListener('click', () => { if(window.RAIOX_EXEMPLO_FURACAO) E.carregar(JSON.parse(JSON.stringify(window.RAIOX_EXEMPLO_FURACAO))); });
  host.querySelector('#rxExemplo2').addEventListener('click', async () => {
    const ex = window.RAIOX_EXEMPLO_PREDIO; if(!ex) return;
    ui.dur.value = '60'; ui.tema.value = ex[0].titulo || '';
    for(const parte of JSON.parse(JSON.stringify(ex))){ await aplicarParte(parte); }
  });
  host.querySelector('#rxDur').addEventListener('change', () => preencherPartes());
  host.querySelector('#rxParte').addEventListener('change', infoParte);
  host.querySelector('#rxCopiar').addEventListener('click', copiarPrompt);
  host.querySelector('#rxBaixar').addEventListener('click', baixarPrompt);
  const drop = host.querySelector('#rxDrop'), arq = host.querySelector('#rxArq');
  arq.addEventListener('change', () => { lerArquivos([...arq.files]); arq.value = ''; });
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.background = 'rgba(47,111,228,.08)'; });
  drop.addEventListener('dragleave', () => { drop.style.background = ''; });
  drop.addEventListener('drop', e => { e.preventDefault(); drop.style.background = ''; lerArquivos([...(e.dataTransfer.files || [])]); });
  host.querySelector('#rxAdd').addEventListener('click', adicionarParte);
  const pipCk = host.querySelector('#rxPip'); pipCk.checked = RX.pipLigado(); pipCk.addEventListener('change', () => { RX.pipDefinir(pipCk.checked); if(E.refazer) E.refazer(); });
  const painel = host.parentElement; if(painel && painel.firstChild !== host) painel.insertBefore(host, painel.firstChild);
  preencherPartes(true);
  RX.sincronizarUI(); RX.atualizarAvisos();
};
function msg2(t, err){ if(!ui) return; ui.msg2.textContent = t; ui.msg2.className = 'msg' + (err ? ' err' : ''); }
function estadoPartes(){ const s = E.script(), p = s && s.partes; return {total: p ? p.total : nPartes(+ui.dur.value), dur: +ui.dur.value, atual: p ? p.atual : 0}; }
function preencherPartes(inicial){
  const s = E.script(), p = s && s.partes;
  if(inicial && p){ ui.dur.value = String(p.dur || ui.dur.value); if(s.tema_video) ui.tema.value = s.tema_video; }
  const n = p && !inicial ? p.total : nPartes(+ui.dur.value), prox = p ? Math.min(n, (p.atual || 0) + 1) : 1;
  ui.parte.innerHTML = ''; for(let k = 1; k <= n; k++){ const o = document.createElement('option'); o.value = k; o.textContent = 'Parte '+k+' de '+n; ui.parte.appendChild(o); }
  ui.parte.value = String(prox); infoParte();
}
function infoParte(){
  const n = ui.parte.options.length, k = +ui.parte.value || 1;
  ui.info.textContent = n === 1 ? 'Vídeo curto, de uma parte só.' : 'Vídeo de cerca de '+Math.round(+ui.dur.value/60*10)/10+' min em '+n+' partes. '+(k === 1 ? 'A parte 1 cria o cenário e as peças base e já traz o plano das outras.' : 'A parte '+k+' recebe, dentro do prompt, tudo o que já existe para reaproveitar.');
}
function textoPrompt(){
  const k = +ui.parte.value || 1, n = ui.parte.options.length, s = E.script();
  if(k > 1 && !(s && s.animacao)){ msg2('Primeiro adicione a parte 1 (o cenário e as peças base).', true); return null; }
  if(s && s.partes && k > 1 && k > (s.partes.atual || 0) + 1) msg2('Atenção: a parte '+((s.partes.atual||0)+1)+' ainda não foi adicionada.', true);
  return {k, n, txt: RX.prompt(ui.tema.value || (s && s.tema_video) || '', null, {parte:k, total:n, dur:Math.round(+ui.dur.value/n), plano: s && s.plano ? s.plano : null})};
}
function baixarPrompt(){
  const r = textoPrompt(); if(!r) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([r.txt], {type:'text/plain;charset=utf-8'}));
  a.download = 'prompt-raiox-parte-'+r.k+'-de-'+r.n+'.txt'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  msg2('Prompt da parte '+r.k+' de '+r.n+' baixado. Anexe o arquivo no chat da IA e diga: "siga as instruções do arquivo".');
}
// ---- arquivos das partes (em qualquer ordem) ----
const pool = {};
function numeroDoArquivo(nome){ const m = /parte[-_ ]*(\d+)(?:[-_ ]*de[-_ ]*(\d+))?/i.exec(nome || ''); return m ? {k:+m[1], n: m[2] ? +m[2] : 0} : null; }
async function lerArquivos(files){
  const erros = [];
  for(const f of files){
    try{
      const j = JSON.parse((await f.text()).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
      const nm = numeroDoArquivo(f.name), k = +j.parte || (nm && nm.k) || 0;
      if(!j || !Array.isArray(j.falas)){ erros.push(f.name+': não tem "falas"'); continue; }
      if(!k){ erros.push(f.name+': não achei o número da parte (nem no JSON nem no nome do arquivo)'); continue; }
      j.parte = k; if(!j.total && nm && nm.n) j.total = nm.n;
      pool[k] = j;
    }catch(e){ erros.push(f.name+': JSON com erro ('+e.message+')'); }
  }
  await processarFila(erros);
}
async function processarFila(erros){
  const s = E.script(); let atual = s && s.animacao && s.partes ? (s.partes.atual || 0) : 0, aplicadas = [];
  const repetidas = Object.keys(pool).map(Number).filter(k => k <= atual && !(k === 1 && atual === 0)); repetidas.forEach(k => delete pool[k]);
  while(pool[atual+1]){ const j = pool[atual+1]; delete pool[atual+1]; await aplicarParte(j); atual++; aplicadas.push(atual); }
  const s2 = E.script(), total = Math.max(s2 && s2.partes ? s2.partes.total : 0, ...Object.values(pool).map(j => +j.total || 0), ...Object.keys(pool).map(Number));
  const esperando = Object.keys(pool).map(Number).sort((a, b) => a - b), faltam = [];
  if(esperando.length){ for(let k = atual+1; k < esperando[esperando.length-1]; k++) if(!pool[k]) faltam.push(k); }
  const linhas = [];
  if(repetidas.length) linhas.push('A parte '+repetidas.join(', ')+' já estava no vídeo; ignorei.');
  if(aplicadas.length) linhas.push('Adicionada'+(aplicadas.length > 1 ? 's' : '')+' a'+(aplicadas.length > 1 ? 's partes ' : ' parte ')+aplicadas.join(', ')+'.');
  if(esperando.length) linhas.push('Guardada'+(esperando.length > 1 ? 's' : '')+' esperando: parte'+(esperando.length > 1 ? 's ' : ' ')+esperando.join(', ')+(faltam.length || atual+1 < esperando[0] ? ' (falta a parte '+(atual+1)+(faltam.length > 1 ? ' e outras' : '')+')' : '')+'.');
  else if(total && atual >= total) linhas.push('Vídeo completo: '+total+' partes.');
  else if(total) linhas.push('Falta a parte '+(atual+1)+' de '+total+'.');
  if(erros && erros.length) linhas.push('Problemas: '+erros.join(' · '));
  ui.fila.textContent = linhas.join(' ');
  msg2(linhas.join(' '), !!(erros && erros.length));
  preencherPartes();
}
function copiarPrompt(){
  const r = textoPrompt(); if(!r) return; const {k, n, txt} = r;
  const ok = () => msg2('Prompt da parte '+k+' de '+n+' copiado. Cole na IA e traga a resposta para a caixa abaixo.');
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, () => { ui.resp.value = txt; msg2('Não consegui copiar sozinho: o prompt está na caixa abaixo, selecione e copie.', true); });
  else { ui.resp.value = txt; msg2('Prompt na caixa abaixo: selecione e copie.', true); }
  window.__ultimoPrompt = txt;
}
async function adicionarParte(){
  let j; const bruto = ui.resp.value.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try{ j = JSON.parse(bruto); }catch(e){ msg2('O JSON está com erro: '+e.message, true); return; }
  if(!j || typeof j !== 'object' || !Array.isArray(j.falas)){ msg2('Não achei o campo "falas" nesse JSON.', true); return; }
  await aplicarParte(j);
}
async function aplicarParte(j){
  const s = E.script(), k = +j.parte || 1, total = +j.total || ui.parte.options.length;
  const dur = j.total ? Math.round(+j.total*36) : +ui.dur.value;
  if(k === 1 || !s || !s.animacao){
    j.partes = {total, atual:1, dur}; j.tema_video = ui.tema.value.trim() || j.titulo || '';
    await E.carregar(j);
    msg2('Parte 1 de '+total+' adicionada. Confira no player e depois copie o prompt da parte 2.');
  } else {
    const a = j.animacao && typeof j.animacao === 'object' ? j.animacao : {};
    delete a.ambiente; delete a.palco; delete a.layout; // o cenário não muda entre as partes
    const ids = new Set((s.animacao.blocos || []).map(b => b.id)), rep = (a.blocos || []).filter(b => ids.has(b.id)).map(b => b.id);
    if(rep.length){ msg2('Esta parte repete ids de blocos que já existem ('+rep.slice(0,3).join(', ')+'). Peça à IA para usar o prefixo p'+k+'b.', true); return; }
    s.falas.push(...j.falas);
    s.animacao = mesclar(s.animacao, a);
    s.partes = Object.assign({total, dur}, s.partes || {}, {total: s.partes && s.partes.total || total, atual: k});
    if(j.publicacao) s.publicacao = j.publicacao;
    if(Array.isArray(j.verificar)) s.verificar = (s.verificar || []).concat(j.verificar);
    if(j.clima && !s.clima) s.clima = j.clima;
    E.refazer(); RX.sincronizarUI();
    msg2('Parte '+k+' de '+s.partes.total+' adicionada ('+j.falas.length+' blocos novos).'+(k < s.partes.total ? ' Próxima: parte '+(k+1)+'.' : ' Vídeo completo!'));
  }
  ui.resp.value = ''; preencherPartes();
}

/* =========================================================
   PROMPT DA IA (formato "explica"), em uma parte só ou em várias partes
   ========================================================= */
const DURACOES = [[30,'30 segundos'],[60,'1 minuto'],[90,'1 min 30 s'],[120,'2 minutos'],[180,'3 minutos']];
const nPartes = d => Math.max(1, Math.round(d/60));
function catalogo(){ try{ return E.catalogo ? E.catalogo() : {}; }catch(e){ return {}; } }
// resumo do que já existe no vídeo, para a IA reaproveitar em vez de recriar
function estadoResumo(){
  const s = E.script(), a = s && s.animacao; if(!a) return null;
  const pecas = {}; Object.keys(a.pecas || {}).forEach(k => { pecas[k] = {partes: (a.pecas[k].partes || []).map(p => p.nome), ancoras: Object.keys(a.pecas[k].ancoras || {})}; });
  const elementos = (a.elementos || []).map(e => { const o = {id:e.id}; if(e.peca) o.peca = e.peca; if(e.tipo) o.tipo = e.tipo; if(e.pos) o.pos = e.pos; if(e.esc != null) o.esc = e.esc; return o; });
  const falas = (s.falas || []).map(f => f.texto);
  return {ambiente: a.ambiente || {}, palco: a.palco || null, pecas, elementos, blocos_existentes: (a.blocos || []).map(b => b.id), total_falas: falas.length, ultimas_falas: falas.slice(-3)};
}
RX.prompt = function(tema, cat, op){
  cat = (cat && cat.ACOES) ? cat : catalogo(); op = op || {};
  const total = op.total || 1, parte = op.parte || 1, multi = total > 1, ultima = parte === total, dur = op.dur || 60;
  const acoes = Object.keys(cat.ACOES || {}).join(', '), sons = Object.keys(cat.SONS || {}).join(', '), climas = Object.keys(cat.CLIMAS || {}).join(', ');
  const pre = multi ? 'p'+parte+'b' : 'b';
  const L = [];
  L.push('Você é o roteirista e diretor de animação de vídeos explicativos no formato RAIO-X: um NARRADOR curioso e bem-humorado explica COMO UMA COISA FUNCIONA enquanto uma animação 3D low poly mostra o mecanismo. '+(RX.pipLigado() ? 'O narrador aparece pequeno no canto da tela, falando.' : 'O narrador só se ouve; a tela é toda da animação.'));
  if(multi){
    L.push('', 'O vídeo completo terá cerca de '+Math.round(dur*total)+' segundos e é feito em '+total+' PARTES de uns '+dur+' segundos. Você entrega UMA parte por vez. Esta é a PARTE '+parte+' DE '+total+'.');
  } else L.push('', 'Este vídeo tem '+Math.round(dur)+' segundos, em uma parte só.');
  L.push('', 'O PALCO É FIXO (muito importante)',
'O vídeo inteiro acontece no MESMO CENÁRIO, como nos vídeos de construção que fazem sucesso: o fundo, o chão e o objeto principal ficam sempre no mesmo lugar e a câmera fica ao redor dele. De bloco em bloco mudam só os ELEMENTOS: peças que surgem, se abrem, se mexem, mudam de cor, e partes novas que são acrescentadas ao objeto principal. Nada de trocar de cenário.',
'Conte em vai e vem, assim: mostre o objeto → "para isso funcionar precisamos de X" → mostre X por dentro → "mas sem Y isso dá errado" (mostre falhando: vibra, fica vermelho, cai, vaza) → entra Y → agora funciona → e assim por diante. Cada problema é resolvido pela peça seguinte, e o objeto principal vai ficando completo.');
  if(multi && parte > 1){
    const est = estadoResumo();
    L.push('', 'O QUE JÁ EXISTE NO VÍDEO (da parte '+(parte-1)+' para trás). REAPROVEITE: use os mesmos ids de elementos e os mesmos nomes de peças, o mesmo estilo e as mesmas cores. NÃO recrie, NÃO mude "ambiente" nem "palco", NÃO repita elementos existentes. Só crie elementos e peças NOVOS, com ids novos.',
      est ? JSON.stringify(est) : '(cole aqui o estado se o estúdio não tiver preenchido)');
    if(op.plano) L.push('', 'PLANO DAS PARTES: '+JSON.stringify(op.plano));
    L.push('A primeira fala desta parte continua a última fala acima, sem recomeçar o assunto nem cumprimentar.');
  }
  if(multi && parte === 1) L.push('', 'Nesta primeira parte, monte o cenário e o objeto principal, defina TODAS as peças e elementos que serão base do vídeo (as partes seguintes vão reaproveitá-los) e entregue também o "plano" com o que cada parte cobre, sem repetir conteúdo entre as partes.');
  L.push('', 'ROTEIRO (campo "falas")',
'- Só o narrador fala ("quem":"mascote"; esse é o nome técnico do campo). Português do Brasil, coloquial, frases curtas fáceis de falar em voz alta; números por extenso, sem siglas nem símbolos.',
'- '+(multi ? '7 a 10' : '6 a 9')+' falas, cada uma com 8 a 16 palavras, e cada fala é UM BLOCO de animação de 3 a 6 segundos. Uma ideia por bloco.',
(parte === 1 ? '- O primeiro bloco é o gancho: uma pergunta ou uma afirmação surpreendente sobre o assunto.' : '- Continue a história de onde parou.')+(ultima ? ' O último bloco fecha com a conclusão que responde à pergunta do vídeo.' : ' Esta parte NÃO conclui o vídeo: termine com um gancho que leva à próxima parte.'),
'- Tom: explicação de verdade, com humor leve, sem aula. Nada que seja falso: se não tiver certeza de um fato, deixe-o de fora.',
'- Cada fala tem "bloco":"<id do bloco>" e pode ter "acao" (expressão do apresentador no canto; opcional e só faz efeito se ele estiver ligado): '+acoes+'.',
'',
'ANIMAÇÃO (campo "animacao")',
'Mundo 3D em metros. Eixo Y é para cima, o chão é y=0, x é para a direita e z vem em direção à câmera. A tela é vertical (9:16): o objeto principal deve ser grande, ocupar cerca de metade da altura da tela, e '+(RX.pipLigado() ? 'o canto inferior esquerdo fica coberto pelo apresentador.' : 'deixe livre a faixa de baixo, onde aparece a legenda.'),
'Estrutura: {'+(parte === 1 ? '"ambiente":{...},"palco":{...},' : '')+'"pecas":{...},"elementos":[...],"blocos":[...]}',
'',
'REGRAS VISUAIS (para a imagem ficar clara)',
'- Peças SÓLIDAS e coloridas: 5 a 7 cores saturadas no total, evite branco e cinza claro (estouram na tela). Vidro só em 1 ou 2 peças e NUNCA duas camadas de vidro uma atrás da outra.',
'- Para mostrar camadas ou o interior, AFASTE as peças com "mover" (vista explodida) em vez de empilhar vidros. Cada peça tem uma forma reconhecível (não use só caixas finas).',
'- Dê a cada elemento importante um rótulo curto quando ele entra em cena.',
'',
'1) BIBLIOTECA DE OBJETOS (USE ESTA PRIMEIRO). Já existem objetos 3D prontos, com textura e animações. Para usar um, crie um elemento com "lib" e, se quiser, "params": {"id":"casa","lib":"casa_corte","params":{"material":"tijolo"},"pos":[0,0,0]}. Para animar, use o verbo "anim": {"faz":"anim","alvo":"casa","nome":"voar_telhado","em":1,"dur":2}. Animações marcadas com * ficam repetindo (valem até o fim do bloco ou até "dur"). Animações com [argumento] aceitam "args": {"faz":"anim","alvo":"turbina","nome":"girar","args":{"velocidade":3}}. As partes de cada objeto são alvos normais: "casa.telhado", "casa.vidro" (para cor, destacar, esconder, rotulo etc.). Todos os objetos ficam com a base em y=0 e o centro em x=0, z=0, e as medidas abaixo são em metros: use "esc" no elemento para ficarem proporcionais entre si. Prefira SEMPRE os objetos da biblioteca; só crie peças próprias (item 2) para o que realmente não existir nela.',
'FORMATO: id | o que é | tamanho LxAxP | partes | params (padrão) | anims',
((window.RAIOX_LIB && window.RAIOX_LIB.catalogoCompacto) ? window.RAIOX_LIB.catalogoCompacto() : '(biblioteca não carregada)'),
'',
'2) PEÇAS PRÓPRIAS (só para o que não existe na biblioteca): objetos feitos de formas simples, escritos em JSON (nada de código). Ex.: "tanque":{"partes":[{"nome":"casca","forma":"caixa","tam":[1,.7,.34],"cor":"#4f9fd6","vidro":.35},{"nome":"agua","forma":"liquido","base":"caixa","tam":[.92,.62,.28],"pos":[0,-.31,0],"nivel":.8},{"nome":"boia","forma":"esfera","raio":.1,"pos":[.3,.15,0],"cor":"#ff9f43"}],"ancoras":{"saida":[0,-.33,0]}}',
'Formas: caixa (tam [largura,altura,profundidade]), cilindro (raio, alt, raio_topo opcional), esfera (raio), cone (raio, alt), anel (raio, espessura), tubo (pontos [[x,y,z],...], raio), liquido (base "caixa" com tam, ou "cilindro" com raio e alt; "nivel" de 0 a 1; a origem fica no fundo), nuvem (raio).',
'Campos de cada parte: nome (obrigatório), forma, pos [x,y,z], rot [graus x,y,z], esc, cor "#rrggbb", vidro (transparência de 0,25 a 1), brilho (0 a 1). Cada parte pode ser animada pelo nome "elemento.parte".',
'',
'3) ELEMENTOS: instâncias no mundo. Objeto da biblioteca: {"id":"casa","lib":"casa_corte","params":{},"pos":[0,0,0],"rot":[0,0,0],"esc":1}. Peça própria: {"id":"tanque","peca":"tanque","pos":[0,1.5,-.5],"rot":[0,0,0],"esc":1}. Também dá para usar uma forma direto: {"id":"cano","tipo":"tubo","pontos":[...],"raio":.06}. '+(multi ? 'No máximo 10 elementos NOVOS por parte.' : 'No máximo 10 elementos.')+' Todo elemento ganha âncoras automáticas: topo, base, centro, esq, dir, frente, fundo (use como "tanque.topo").'+(parte > 1 ? ' IMPORTANTE: todo elemento novo desta parte precisa entrar com "mostrar" ou "crescer" no bloco certo (senão ele já aparece nas partes anteriores).' : ' Elementos que só entram mais tarde devem ser revelados com "mostrar" ou "crescer" no bloco certo.'),
'',
'4) BLOCOS: {"id":"'+pre+'1","camera":{...},"transicao":{"tipo":"fade"},"acoes":[...]}. Cada bloco tem a câmera e as ações daquele pedaço da fala. Use ids '+(multi ? 'únicos, começando com "'+pre+'" ('+pre+'1, '+pre+'2, ...)' : 'b1, b2, ...')+'.',
'CÂMERA: orbita em volta de um alvo. '+(parte === 1 ? 'Defina "palco" (a câmera principal, que mostra o objeto inteiro): {"alvo":"monitor","dist":4.5,"alt":.6,"azim":0}. ATENÇÃO: a tela é vertical e a largura visível é só cerca de 0,43 da distância; para o conjunto inteiro caber, use dist ≈ 2,7 × a largura do conjunto (ex.: conjunto de 6 m de largura → dist 16) e alvo na altura do meio do conjunto. ' : '')+'Em cada bloco use só VARIAÇÕES PEQUENAS em torno do palco: {"base":true} volta ao palco, {"zoom":1.4} aproxima (2 no máximo), "azim" entre -35 e 35, "alvo" pode ser um elemento ou uma âncora ("tanque.boia") para olhar uma peça, e para mover use os mesmos campos com _fim (zoom_fim, azim_fim, alvo_fim) ou "movimento":"aproximar" | "afastar" | "orbitar" | "subir". Faça no máximo 2 close-ups fortes por parte e volte ao palco depois. O que faltar herda do bloco anterior. "transicao" é opcional: "corte" (padrão), "fade" ou "flash".',
'',
'AÇÕES (cada uma: "em" = quando começa, "dur" = duração em segundos, "alvo" = elemento ou "elemento.parte", "faz" = o verbo)',
'- "em": segundos depois do começo da fala (ex. 0.5), ou {"palavra":4} para começar exatamente quando a quinta palavra da fala é dita (a primeira é a 0), ou {"palavra":"despenca"} pela própria palavra. Use isso para sincronizar com o que o narrador diz.',
'- mostrar / esconder: aparece ou some. crescer: o elemento brota do chão (ou da base) com a base parada, bom para construir (só em elementos que não se mexeram antes).',
'- mover: {"faz":"mover","alvo":"x","delta":[0,-.4,0]} (relativo) ou "para":[x,y,z] (absoluto).',
'- girar: {"faz":"girar","alvo":"x","eixo":"z","graus":40}; girar_continuo: {"faz":"girar_continuo","alvo":"x","eixo":"y","vel":180,"dur":3}.',
'- escalar: {"para":1.5}; cor: {"para":"#ff0000"} (ótimo para mostrar erro ou aquecimento); nivel (só para "liquido"): {"alvo":"tanque.agua","para":.1,"dur":2.5}.',
'- destacar: pulsa e brilha (chama atenção); vibrar: treme (use para mostrar que algo está errado).',
'- fluxo: partículas que correm de um ponto a outro (água, ar, gás, energia): {"faz":"fluxo","de":"tanque.saida","via":[[0,.9,-.5]],"para":[0,.7,0],"dur":2.5,"cor":"#6cc0ff","qtd":22,"tam":.05}. "de", "via" e "para" aceitam elemento, âncora ou [x,y,z].',
'- rotulo: etiqueta com texto curto em MAIÚSCULAS (até 3 palavras): {"faz":"rotulo","alvo":"tanque.boia","texto":"BOIA","estilo":"pilula","desloc":[.12,.06]}. "desloc" é [direita, cima] em fração da altura da tela; o tamanho já é fixo em tela. Estilos: pilula, titulo (grande, amarelo). Dura até o fim do bloco, a menos que tenha "dur".',
'- seta: {"faz":"seta","alvo":"tanque.valvula","dir":[0,-1,0]} (a seta aponta nessa direção).',
'- temperatura: contador animado: {"faz":"temperatura","alvo":"geladeira.topo","de":20,"para":4,"dur":2}.',
'Cada bloco precisa de pelo menos 2 ações. Faça acontecer o que a fala diz, no momento em que ela diz. Estados persistem: o que mudou num bloco continua mudado nos próximos.',
'',
'MÚSICA E SONS (opcionais): "clima" ('+climas+'); falas podem ter "som" ('+sons+') no máximo em 2 ou 3 delas.',
'', 'FORMATO DE SAÍDA', 'Responda SOMENTE com JSON válido, sem texto antes ou depois e sem bloco de código:');
  if(parte === 1){
    L.push('{"formato":"explica","parte":1,"total":'+total+','+(multi ? '"plano":[{"parte":1,"titulo":"...","resumo":"..."},...],' : '')+'"titulo":"pergunta do vídeo","clima":"animada","falas":[{"quem":"mascote","texto":"...","bloco":"'+pre+'1","acao":"espanto"}],"animacao":{"ambiente":{},"palco":{},"pecas":{},"elementos":[],"blocos":[{"id":"'+pre+'1","camera":{},"acoes":[]}]}'+(ultima ? ',"publicacao":{"youtube_titulo":"...","youtube_descricao":"...","tiktok":"...","instagram":"...","hashtags":["..."]},"verificar":["fato 1"]' : ',"verificar":["fato 1"]')+'}');
  } else {
    L.push('{"parte":'+parte+',"total":'+total+',"falas":[{"quem":"mascote","texto":"...","bloco":"'+pre+'1"}],"animacao":{"pecas":{"so as novas":{}},"elementos":[{"so os novos":1}],"blocos":[{"id":"'+pre+'1","camera":{"base":true},"acoes":[]}]}'+(ultima ? ',"publicacao":{"youtube_titulo":"...","youtube_descricao":"...","tiktok":"...","instagram":"...","hashtags":["..."]},"verificar":["fato 1"]' : ',"verificar":["fato 1"]')+'}');
  }
  if(ultima) L.push('- publicacao (do vídeo COMPLETO): título do YouTube até 70 caracteres com emoji, terminando com #shorts; descrição com 2 ou 3 frases e, na última linha, exatamente: "Animação e vozes feitas com ajuda de inteligência artificial."; hashtags de 4 a 6 em minúsculas, e uma hashtag do assunto.');
  const slug = String(tema || 'video').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'video';
  L.push('- ENTREGA: se você puder criar arquivos, entregue o JSON como ARQUIVO para download chamado exatamente "raiox-'+slug+'-parte-'+parte+'-de-'+total+'.json" e escreva só uma frase no chat. Se não puder criar arquivos, responda com o JSON em texto.');
  L.push('- verificar: cada afirmação factual desta parte que uma pessoa deve conferir antes de publicar (no máximo 6).', '', 'TEMA: '+(tema && tema.trim() ? tema.trim() : '[escreva o tema aqui]'));
  return L.join('\n');
};

/* ---------- inicialização ---------- */
RX.init = function(ctx){
  E = ctx;
  E.addScene('raiox', {sky:['#b9d4e6','#d9e8ef','#f3ebde','#ffffff'], bg:'#f3ebde', fog:[28, 90], hemi:['#f4f6f8','#c9c3b8',.9], sun:['#fff0dc', 1.0], shots:{paisagem:{pos:[0,3,9], look:[0,1,0]}}}, g => {});
  mundo = new T3.Group(); E.SCENES.raiox.g.add(mundo);
};
RX.debug = () => ({nos, elems, blocos, trilhas, efeitos, avisos:[...avisos]});
})();
