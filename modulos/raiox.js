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
     "layout":   {"pip":{"x":.035,"y":.60,"w":.36}, "legenda":54},
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
let efeitos = [], blocos = [], trilhas = {}, pulsos = [], giros = [];
let tlRef = null;                           // timeline usada na última compilação
let ligado = false, salvo = null;
let layout = {pip:{x:.035, y:.60, w:.36}, legenda:54};
let quadro = null;                          // câmera padrão (enquadra tudo)
const avisos = new Set();
const avisar = m => { avisos.add(m); };
const texCache = new Map();

/* =========================================================
   MUNDO: peças, elementos e nós animáveis
   ========================================================= */
function material(p){
  const m = new T3.MeshStandardMaterial({color: p.cor || '#cfd6dc', flatShading:true, roughness:.85, metalness:0});
  if(p.vidro){ m.transparent = true; m.opacity = clamp(num(p.vidro === true ? .28 : p.vidro, .28), .05, 1); m.depthWrite = false; m.roughness = .25; }
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
    cor: new T3.Color(def.cor || '#ffffff')}};
  nos[nome] = no; return no;
}
function criarElemento(def, pecas){
  const id = def && def.id;
  if(!id || typeof id !== 'string' || elems[id]){ avisar('elemento sem "id" ou com id repetido'); return; }
  const g = new T3.Group(); g.name = id;
  let ancoras = {}, mats = [], nivelObj = null;
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
  } else if(def.tipo){
    const f = criarForma(Object.assign({}, def, {forma:def.tipo === 'liquido' ? 'liquido' : def.tipo}));
    g.add(f.obj); mats = f.mats; nivelObj = f.nivelObj;
  } else avisar('elemento '+id+' precisa de "peca" ou "tipo"');
  // âncoras automáticas pela caixa do elemento (não sobrescrevem as suas)
  const bb = new T3.Box3().setFromObject(g);
  if(!bb.isEmpty()){
    const c = bb.getCenter(new T3.Vector3()), a = {topo:[c.x, bb.max.y, c.z], base:[c.x, bb.min.y, c.z], centro:[c.x, c.y, c.z],
      esq:[bb.min.x, c.y, c.z], dir:[bb.max.x, c.y, c.z], frente:[c.x, c.y, bb.max.z], fundo:[c.x, c.y, bb.min.z]};
    Object.keys(a).forEach(k => { if(!ancoras[k]) ancoras[k] = a[k]; });
  }
  mundo.add(g);
  const no = registrar(id, g, mats, def, nivelObj);
  elems[id] = {g, ancoras, no};
  g.position.set(...no.base.pos); g.rotation.set(rad(no.base.rot[0]), rad(no.base.rot[1]), rad(no.base.rot[2])); g.scale.set(...no.base.esc);
}
function limparMundo(){
  efeitos.forEach(e => e.apagar && e.apagar());
  efeitos = [];
  if(mundo){ mundo.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material && !o.material.userData.keep) o.material.dispose && o.material.dispose(); }); if(mundo.parent) mundo.parent.remove(mundo); }
  mundo = new T3.Group(); E.SCENES.raiox.g.add(mundo);
  nos = {}; elems = {}; trilhas = {}; pulsos = []; giros = []; blocos = []; tlRef = null; avisos.clear();
}
function montar(a){
  limparMundo(); anim = a;
  const amb = a.ambiente || {};
  layout = {pip: Object.assign({x:.035, y:.60, w:.36}, (a.layout || {}).pip || {}), legenda: num((a.layout || {}).legenda, 54)};
  // chão
  const fl = new T3.Mesh(new T3.CircleGeometry(40, 48), new T3.MeshStandardMaterial({color: amb.chao || '#d8c7a3', flatShading:true, roughness:1}));
  fl.rotation.x = -Math.PI/2; fl.receiveShadow = true; fl.userData.chao = true; mundo.add(fl); floor = fl;
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
const _cf = new T3.Vector3(), _cr = new T3.Vector3(), _cu = new T3.Vector3();
// põe o sprite no ponto p (mundo) com um deslocamento [dx,dy] em fração da altura da tela e o tamanho h (fração da altura)
function posicionarSprite(spr, p, des, h, aspect, k){
  const cam = E.cam; cam.updateMatrixWorld();
  _cr.setFromMatrixColumn(cam.matrixWorld, 0); _cu.setFromMatrixColumn(cam.matrixWorld, 1); cam.getWorldDirection(_cf);
  const prof = Math.max(.1, _v.copy(p).sub(cam.position).dot(_cf)), sh = 2*Math.tan(rad(cam.fov/2))*prof;
  spr.position.copy(p).addScaledVector(_cr, des[0]*sh).addScaledVector(_cu, des[1]*sh);
  const maxW = .9*9/16; if(h*aspect > maxW) h = maxW/aspect; // nunca passa da largura do vídeo
  const sy = h*2*Math.tan(rad(cam.fov/2))*k;
  spr.scale.set(sy*aspect, sy, 1);
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
const DUR = {mostrar:.4, esconder:.25, mover:.7, girar:.7, escalar:.45, cor:.5, nivel:1.2, destacar:.7, vibrar:.6, fluxo:2, temperatura:2};
const EIXO = {x:0, y:1, z:2};
function nomes(alvo){ return lista(alvo).filter(n => { if(typeof n === 'string' && nos[n]) return true; avisar('alvo "'+n+'" não existe'); return false; }); }
function compilarAcao(a, rec){
  if(!a || typeof a !== 'object'){ return; }
  const l = rec.l, t0 = tempoDe(a.em, l), dur = Math.max(.01, num(a.dur, DUR[a.faz] || .5)), t1 = t0 + dur;
  const ease = a.ease && EASES[a.ease] ? a.ease : null;
  const fimBloco = rec.t1;
  switch(a.faz){
    case 'mostrar': nomes(a.alvo).forEach(n => addSeg(n, 'vis', {t0, t1, to:1, ease: ease || 'pulo', mostrar:true})); break;
    case 'esconder': nomes(a.alvo).forEach(n => addSeg(n, 'vis', {t0, t1, to:0, ease: ease || 'suave'})); break;
    case 'mover': nomes(a.alvo).forEach(n => addSeg(n, 'pos', a.para ? {t0, t1, to:vec(a.para), ease} : {t0, t1, delta:vec(a.delta), ease})); break;
    case 'girar': nomes(a.alvo).forEach(n => {
      let d = [0,0,0];
      if(Array.isArray(a.graus)) d = vec(a.graus); else if(EIXO[a.eixo] != null) d[EIXO[a.eixo]] = num(a.graus, 90); else d[1] = num(a.graus, 90);
      addSeg(n, 'rot', {t0, t1, delta:d, ease}); }); break;
    case 'escalar': nomes(a.alvo).forEach(n => addSeg(n, 'esc', {t0, t1, to: Array.isArray(a.para) ? vec(a.para, [1,1,1]) : [num(a.para,1), num(a.para,1), num(a.para,1)], ease})); break;
    case 'cor': nomes(a.alvo).forEach(n => addSeg(n, 'cor', {t0, t1, to:new T3.Color(a.para || '#ffffff'), ease})); break;
    case 'nivel': nomes(a.alvo).forEach(n => addSeg(n, 'nivel', {t0, t1, to:clamp(num(a.para, 1), 0, 1), ease})); break;
    case 'destacar': nomes(a.alvo).forEach(n => { pulsos.push({nome:n, t0, t1, tipo:'destacar', cor:a.cor || '#fff3b0'}); nos[n].temPulso = true; }); break;
    case 'vibrar': nomes(a.alvo).forEach(n => { pulsos.push({nome:n, t0, t1, tipo:'vibrar', amp:num(a.forca, .03)}); }); break;
    case 'girar_continuo': nomes(a.alvo).forEach(n => giros.push({nome:n, t0, t1: a.dur != null ? t1 : Infinity, eixo: EIXO[a.eixo] != null ? EIXO[a.eixo] : 1, vel:num(a.vel, 180)})); break;
    case 'fluxo': if(a.de == null || a.para == null){ avisar('fluxo precisa de "de" e "para"'); break; } efeitos.push(criarFluxo(a, t0, t1)); break;
    case 'rotulo': efeitos.push(criarRotulo(a, t0, a.dur != null ? t1 : fimBloco)); break;
    case 'seta': efeitos.push(criarSeta(a, t0, a.dur != null ? t1 : fimBloco)); break;
    case 'temperatura': efeitos.push(criarTemperatura(a, t0, a.dur != null && a.ate_fim !== true ? t1 + num(a.fica, 1.2) : fimBloco)); break;
    default: avisar('ação "'+a.faz+'" não existe');
  }
}
function normCam(c, prev){
  const base = prev ? prev.b : quadro;
  const A = {}, B = {};
  ['alvo','dist','alt','azim'].forEach(k => {
    const d = base[k] != null ? base[k] : (k === 'alvo' ? (base.olha || [0,1,0]) : 0);
    A[k] = c[k] != null ? c[k] : d; B[k] = c[k+'_fim'] != null ? c[k+'_fim'] : A[k]; });
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
  efeitos.forEach(e => e.apagar && e.apagar()); efeitos = []; trilhas = {}; pulsos = []; giros = []; blocos = [];
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
RX.legendaPos = () => layout.legenda;
RX.atualizar = function(t, l, T, o){
  o = o || {};
  if(tlRef !== E.timeline()) compilar();
  if(!ligado){ ligado = true; }
  E.zuco.g.visible = false; E.guest.g.visible = false; E.SKY.visible = true; E.SCENES.raiox.g.visible = true;
  aplicarAmbiente();
  for(const k in nos) aplicarNo(nos[k], t);
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
  if(!ligado) return;
  const sz = R.getSize(new T3.Vector2());
  const vw = Math.min(sz.x, sz.y*9/16), vh = vw*16/9, ox = (sz.x - vw)/2, oy = (sz.y - vh)/2;
  const r = pipRect(vw, vh), x = ox + r.x, y = oy + r.y, gy = sz.y - (y + r.h);
  const sc = E.scene, zu = E.zuco, bg = sc.background, fog = sc.fog, hs = E.SCENES.raiox.g.visible;
  R.setRenderTarget(null);
  R.setScissorTest(true); R.setViewport(x, gy, r.w, r.h); R.setScissor(x, gy, r.w, r.h);
  sc.background = pipCor; sc.fog = null; E.SKY.visible = false; E.SCENES.raiox.g.visible = false; zu.g.visible = true;
  pipCam.aspect = r.w/r.h; pipCam.updateProjectionMatrix();
  const p = zu.g.position;
  pipCam.position.set(p.x + .55, p.y + .16, p.z + 2.7); pipCam.lookAt(p.x - .02, p.y + .0, p.z);
  R.render(sc, pipCam);
  zu.g.visible = false; sc.background = bg; sc.fog = fog; E.SKY.visible = true; E.SCENES.raiox.g.visible = hs;
  R.setScissorTest(false); R.setViewport(0, 0, sz.x, sz.y);
};
// moldura do Zuco e transições: desenhadas junto da legenda (drawCaptions), iguais no preview e no vídeo
RX.overlay = function(ctx, ox, oy, vw, vh, U, st){
  if(!ligado) return;
  const r = pipRect(vw, vh), x = ox + r.x, y = oy + r.y;
  ctx.save();
  ctx.lineWidth = 8*U; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(x, y, r.w, r.h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y + r.h - 38*U, 118*U, 38*U);
  ctx.fillStyle = '#3b3560'; ctx.font = '900 '+(24*U)+'px '+SANS; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('ZUCO', x + 12*U, y + r.h - 18*U);
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
    } else if(k === 'pecas' || k === 'ambiente' || k === 'layout') out[k] = Object.assign({}, out[k] || {}, novo[k]);
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
  host.innerHTML = '<div class="card"><h2>Animação (Raio-X)</h2>'
    + '<p class="note">O JSON da animação (peças, elementos e blocos) pode vir junto do roteiro ou ser colado aqui. “Mesclar” troca só o que tem o mesmo id e acrescenta o resto, para você pedir alterações pontuais à IA.</p>'
    + '<textarea id="rxEditor" spellcheck="false" aria-label="Animação em JSON"></textarea>'
    + '<div class="row"><button class="btn primary" id="rxAplicar">Aplicar animação</button><button class="btn" id="rxMesclar">Mesclar por id</button><button class="btn" id="rxExemplo">Exemplo: descarga</button></div>'
    + '<span class="msg" id="rxMsg"></span>'
    + '<h2 style="margin-top:14px">Blocos</h2><div class="row" style="margin-bottom:8px"><button class="btn" id="rxGravarTodos">Gravar todos os blocos (para conferir)</button></div>'
    + '<p class="note" id="rxVazio" hidden>Este roteiro ainda não tem animação. Use o formato “Raio-X” no gerador de prompt.</p>'
    + '<ol id="rxBlocos"></ol></div>';
  ui = {ed: host.querySelector('#rxEditor'), msg: host.querySelector('#rxMsg'), blocos: host.querySelector('#rxBlocos'), vazio: host.querySelector('#rxVazio')};
  host.querySelector('#rxAplicar').addEventListener('click', () => aplicarTexto('substituir'));
  host.querySelector('#rxGravarTodos').addEventListener('click', gravarTodos);
  host.querySelector('#rxMesclar').addEventListener('click', () => aplicarTexto('mesclar'));
  host.querySelector('#rxExemplo').addEventListener('click', () => { if(window.RAIOX_EXEMPLO) E.carregar(JSON.parse(JSON.stringify(window.RAIOX_EXEMPLO))); });
  RX.sincronizarUI(); RX.atualizarAvisos();
};

/* =========================================================
   PROMPT DA IA (formato "explica")
   ========================================================= */
RX.prompt = function(tema, cat){
  cat = cat || {};
  const acoes = Object.keys(cat.ACOES || {}).join(', '), sons = Object.keys(cat.SONS || {}).join(', '), climas = Object.keys(cat.CLIMAS || {}).join(', ');
  return [
'Você é o roteirista e diretor de animação do canal "Por Dentro do Óbvio", no formato RAIO-X: vídeos curtos (30 a 45 segundos) em que o Zuco, um alienígena curioso, explica COMO UMA COISA FUNCIONA por dentro, enquanto uma animação 3D low poly mostra o mecanismo atrás dele. O Zuco aparece pequeno no canto da tela, falando.',
'',
'O QUE VOCÊ ENTREGA',
'Um único JSON com: o roteiro falado (campo "falas") e a animação (campo "animacao"). O estúdio toca a animação sincronizada com a voz.',
'',
'ROTEIRO (campo "falas")',
'- Só o Zuco fala ("quem":"mascote"). Português do Brasil, coloquial, frases curtas fáceis de falar em voz alta; números por extenso, sem siglas nem símbolos.',
'- 6 a 9 falas, cada uma com 8 a 16 palavras, e cada fala é UM BLOCO de animação de 3 a 6 segundos. Uma ideia por bloco.',
'- Bloco 1 é o gancho: uma pergunta ou uma afirmação surpreendente sobre o assunto. O último bloco fecha com a conclusão que responde à pergunta.',
'- Tom: explicação de verdade, com humor leve do Zuco, sem aula. Nada que seja falso: se não tiver certeza de um fato, deixe-o de fora.',
'- Cada fala tem "bloco":"<id do bloco>" e pode ter "acao" (expressão do Zuco; opcional): '+acoes+'.',
'',
'ANIMAÇÃO (campo "animacao")',
'Mundo 3D em metros. Eixo Y é para cima, o chão é y=0, x é para a direita e z vem em direção à câmera. Objetos de 0,3 a 3 metros. A tela é vertical (9:16): o assunto precisa ser alto e estreito, e o canto inferior esquerdo fica coberto pelo Zuco.',
'Estrutura: {"ambiente":{...},"pecas":{...},"elementos":[...],"blocos":[...]}',
'',
'1) PEÇAS: objetos feitos de formas simples, escritos em JSON (nada de código). Ex.: "tanque":{"partes":[{"nome":"casca","forma":"caixa","tam":[1,.7,.34],"cor":"#e9eef2","vidro":.25},{"nome":"agua","forma":"liquido","base":"caixa","tam":[.92,.62,.28],"pos":[0,-.31,0],"nivel":.8},{"nome":"boia","forma":"esfera","raio":.1,"pos":[.3,.15,0],"cor":"#ff9f43"}],"ancoras":{"saida":[0,-.33,0]}}',
'Formas: caixa (tam [largura,altura,profundidade]), cilindro (raio, alt, raio_topo opcional), esfera (raio), cone (raio, alt), anel (raio, espessura), tubo (pontos [[x,y,z],...], raio), liquido (base "caixa" com tam, ou "cilindro" com raio e alt; "nivel" de 0 a 1; a origem fica no fundo), nuvem (raio).',
'Campos de cada parte: nome (obrigatório), forma, pos [x,y,z], rot [graus x,y,z], esc, cor "#rrggbb", vidro (transparência de 0,05 a 1, ex. .25), brilho (0 a 1). Use cores suaves e 4 a 6 matizes no total. Cada parte pode ser animada pelo nome "elemento.parte".',
'',
'2) ELEMENTOS: instâncias no mundo. {"id":"tanque","peca":"tanque","pos":[0,1.5,-.5],"rot":[0,0,0],"esc":1,"oculto":false}. Também dá para usar uma forma direto: {"id":"cano","tipo":"tubo","pontos":[...],"raio":.06,"vidro":.35}. Use no máximo 10 elementos e 20 partes. Todo elemento ganha âncoras automáticas: topo, base, centro, esq, dir, frente, fundo (use como "tanque.topo").',
'',
'3) BLOCOS: {"id":"b1","camera":{...},"transicao":{"tipo":"fade"},"acoes":[...]}. Cada bloco tem a câmera e as ações daquele pedaço da fala.',
'CÂMERA (campo "camera"): orbita em volta de um alvo. {"alvo":"tanque","dist":3,"alt":.4,"azim":20} e, para mover, os mesmos campos com _fim (dist_fim, alt_fim, azim_fim, alvo_fim) ou o atalho "movimento":"aproximar" | "afastar" | "orbitar" | "subir". "alvo" é um elemento, uma âncora ("tanque.boia") ou um ponto [x,y,z]; "azim" é o ângulo em graus ao redor do alvo (0 = de frente). O que faltar herda do bloco anterior. Mude a câmera a cada bloco (close, plano geral, ângulo diferente) e deixe o assunto no meio e na metade de cima da tela. "transicao" é opcional: "corte" (padrão), "fade" ou "flash".',
'',
'AÇÕES (cada uma: "em" = quando começa, "dur" = duração em segundos, "alvo" = elemento ou "elemento.parte", "faz" = o verbo)',
'- "em": segundos depois do começo da fala (ex. 0.5), ou {"palavra":4} para começar exatamente quando a quinta palavra da fala é dita (a primeira é a 0), ou {"palavra":"despenca"} pela própria palavra. Use isso para sincronizar com o que o Zuco diz.',
'- mostrar / esconder: aparece ou some (elementos com "mostrar" começam escondidos).',
'- mover: {"faz":"mover","alvo":"x","delta":[0,-.4,0]} (relativo) ou "para":[x,y,z] (absoluto).',
'- girar: {"faz":"girar","alvo":"x","eixo":"z","graus":40}; girar_continuo: {"faz":"girar_continuo","alvo":"x","eixo":"y","vel":180,"dur":3}.',
'- escalar: {"para":1.5}; cor: {"para":"#ff0000"}; nivel (só para "liquido"): {"alvo":"tanque.agua","para":.1,"dur":2.5}.',
'- destacar: pulsa e brilha (use para chamar atenção); vibrar: treme.',
'- fluxo: partículas que correm de um ponto a outro (água, ar, gás, energia): {"faz":"fluxo","de":"tanque.saida","via":[[0,.9,-.5]],"para":[0,.7,0],"dur":2.5,"cor":"#6cc0ff","qtd":22,"tam":.05}. "de", "via" e "para" aceitam elemento, âncora ou [x,y,z].',
'- rotulo: etiqueta com texto curto em MAIÚSCULAS (até 3 palavras): {"faz":"rotulo","alvo":"tanque.boia","texto":"BOIA","estilo":"pilula","desloc":[.12,.06]}. "desloc" é [direita, cima] em fração da altura da tela (0,1 = um décimo da tela); o tamanho do rótulo já é fixo em tela, não precisa de "tam". Estilos: pilula, titulo (grande, amarelo). Dura até o fim do bloco, a menos que tenha "dur".',
'- seta: {"faz":"seta","alvo":"tanque.valvula","dir":[0,-1,0]} (a seta aponta nessa direção).',
'- temperatura: contador animado: {"faz":"temperatura","alvo":"geladeira.topo","de":20,"para":4,"dur":2}.',
'Cada bloco precisa de pelo menos 2 ações. Faça acontecer o que a fala diz, no momento em que ela diz. Estados persistem: o que mudou num bloco continua mudado nos próximos.',
'',
'MÚSICA E SONS (opcionais): "clima" ('+climas+'); falas podem ter "som" ('+sons+') no máximo em 2 ou 3 delas.',
'',
'FORMATO DE SAÍDA',
'Responda SOMENTE com JSON válido, sem texto antes ou depois e sem bloco de código:',
'{"formato":"explica","titulo":"pergunta do vídeo","clima":"animada","falas":[{"quem":"mascote","texto":"...","bloco":"b1","acao":"espanto"}],"animacao":{"ambiente":{},"pecas":{},"elementos":[],"blocos":[{"id":"b1","camera":{},"acoes":[]}]},"publicacao":{"youtube_titulo":"...","youtube_descricao":"...","tiktok":"...","instagram":"...","hashtags":["..."]},"verificar":["fato 1 que deve ser conferido","fato 2"]}',
'- publicacao: título do YouTube até 70 caracteres com emoji, terminando com #shorts; descrição com 2 ou 3 frases e, na última linha, exatamente: "Animação e vozes feitas com ajuda de inteligência artificial."; hashtags de 4 a 6 em minúsculas, incluindo pordentrodoobvio.',
'- verificar: cada afirmação factual do roteiro que uma pessoa deve conferir antes de publicar (no máximo 6).',
'',
'TEMA: '+(tema && tema.trim() ? tema.trim() : '[escreva o tema aqui]')
  ].join('\n');
};

/* ---------- inicialização ---------- */
RX.init = function(ctx){
  E = ctx;
  E.addScene('raiox', {sky:['#b9d4e6','#d9e8ef','#f3ebde','#ffffff'], bg:'#f3ebde', fog:[28, 90], hemi:['#f4f6f8','#c9c3b8',.9], sun:['#fff0dc', 1.0], shots:{paisagem:{pos:[0,3,9], look:[0,1,0]}}}, g => {});
  mundo = new T3.Group(); E.SCENES.raiox.g.add(mundo);
};
RX.debug = () => ({nos, elems, blocos, trilhas, efeitos, avisos:[...avisos]});
})();
