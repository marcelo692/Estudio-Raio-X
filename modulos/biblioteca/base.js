/* =========================================================
   BIBLIOTECA DE OBJETOS · base (padrão único para todos os objetos)
   Cada objeto é registrado com RAIOX_LIB.registrar({...}) e segue o mesmo contrato:
     id, nome, lote, categoria, descricao
     params: { nome: {padrao, opcoes?|min?,max?, desc} }
     criar(P, H) -> { obj: THREE.Group, ancoras: {nome:[x,y,z]}, dim:[l,a,p] }
        - toda parte animável é um Object3D com userData.parte = "nome" (endereçável como "elemento.parte")
        - o objeto fica apoiado em y=0 e centrado em x/z
     animacoes: { nome: { desc, dur, loop?, aplicar(partes, t, args, grupo) } }
        - aplicar é uma FUNÇÃO PURA do tempo t (segundos desde o início da animação);
          sempre parte da pose de repouso guardada em H.repouso(parte)
   Unidades: metros. Cores: "#rrggbb". Nada de Date.now/Math.random fora do gerador com semente.
   ========================================================= */
(function(){
'use strict';
const T3 = window.THREE;
const LIB = window.RAIOX_LIB = window.RAIOX_LIB || {itens:{}, ordem:[]};
const rad = d => d*Math.PI/180;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

/* ---------- gerador com semente (mesmo resultado sempre) ---------- */
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- cores ---------- */
function hsl(c){ const k = new T3.Color(c), o = {}; k.getHSL(o); return o; }
function css(h, s, l){ return 'hsl('+Math.round(h*360)+','+Math.round(clamp(s,0,1)*100)+'%,'+Math.round(clamp(l,0,1)*100)+'%)'; }
function tom(c, dl, ds){ const o = hsl(c); return css(o.h, o.s + (ds||0), o.l + dl); }

/* ---------- texturas procedurais (256x256, ladrilháveis) ---------- */
const TEX = new Map(), S = 256;
const PADROES = {
  madeira(x, cor, R){ // tábuas horizontais com veios
    const n = 4, h = S/n;
    for(let i = 0; i < n; i++){
      x.fillStyle = tom(cor, (R()-.5)*.08); x.fillRect(0, i*h, S, h);
      for(let k = 0; k < 14; k++){ x.strokeStyle = tom(cor, -.07 - R()*.05); x.globalAlpha = .5; x.lineWidth = 1 + R()*1.5; const y = i*h + 3 + R()*(h-6); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(S*.3, y + (R()-.5)*4, S*.6, y + (R()-.5)*4, S, y); x.stroke(); }
      x.globalAlpha = 1; x.fillStyle = tom(cor, -.2); x.fillRect(0, i*h, S, 3);
    }
  },
  tijolo(x, cor, R){
    x.fillStyle = '#b9b2a6'; x.fillRect(0, 0, S, S);
    const rows = 8, h = S/rows, bw = S/4;
    for(let r = 0; r < rows; r++) for(let c = -1; c < 4; c++){
      const ox = (r%2) ? bw/2 : 0; x.fillStyle = tom(cor, (R()-.5)*.1, (R()-.5)*.05);
      x.fillRect(c*bw + ox + 2, r*h + 2, bw - 4, h - 4);
    }
    for(let k = 0; k < 500; k++){ x.fillStyle = 'rgba(0,0,0,'+(R()*.08)+')'; x.fillRect(R()*S, R()*S, 2, 2); }
  },
  bloco(x, cor, R){ // blocos de concreto grandes
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 900; k++){ x.fillStyle = 'rgba('+(R()<.5?'255,255,255':'0,0,0')+','+(R()*.07)+')'; x.fillRect(R()*S, R()*S, 1 + R()*3, 1 + R()*3); }
    x.strokeStyle = tom(cor, -.18); x.lineWidth = 4;
    const rows = 4, h = S/rows, bw = S/2;
    for(let r = 0; r < rows; r++){ x.beginPath(); x.moveTo(0, r*h); x.lineTo(S, r*h); x.stroke(); const ox = (r%2) ? bw/2 : 0; for(let c = 0; c < 3; c++){ x.beginPath(); x.moveTo(c*bw + ox, r*h); x.lineTo(c*bw + ox, r*h + h); x.stroke(); } }
  },
  concreto(x, cor, R){
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 1800; k++){ x.fillStyle = 'rgba('+(R()<.5?'255,255,255':'0,0,0')+','+(R()*.09)+')'; x.fillRect(R()*S, R()*S, 1 + R()*2, 1 + R()*2); }
    for(let k = 0; k < 6; k++){ x.fillStyle = 'rgba(0,0,0,.04)'; x.beginPath(); x.arc(R()*S, R()*S, 20 + R()*40, 0, 7); x.fill(); }
  },
  telha(x, cor, R){
    const rows = 6, h = S/rows, w = S/5;
    for(let r = 0; r < rows; r++) for(let c = -1; c < 5; c++){
      const ox = (r%2) ? w/2 : 0, X = c*w + ox, Y = r*h; const g = x.createLinearGradient(0, Y, 0, Y + h);
      g.addColorStop(0, tom(cor, .06 + (R()-.5)*.05)); g.addColorStop(1, tom(cor, -.12)); x.fillStyle = g; x.fillRect(X + 1, Y, w - 2, h);
      x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(X, Y + h - 4, w, 4);
    }
  },
  grama(x, cor, R){
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 2600; k++){ x.strokeStyle = tom(cor, (R()-.45)*.16, (R()-.5)*.1); x.lineWidth = 1 + R()*1.2; const X = R()*S, Y = R()*S; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + (R()-.5)*4, Y - 4 - R()*6); x.stroke(); }
  },
  terra(x, cor, R){
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 1500; k++){ x.fillStyle = tom(cor, (R()-.5)*.18); x.fillRect(R()*S, R()*S, 1 + R()*3, 1 + R()*3); }
    for(let k = 0; k < 110; k++){ x.fillStyle = tom(cor, .08 + R()*.14, -.1); x.beginPath(); x.ellipse(R()*S, R()*S, 1.5 + R()*4, 1 + R()*3, R()*3, 0, 7); x.fill(); }
  },
  pedra(x, cor, R){
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 40; k++){ x.fillStyle = tom(cor, (R()-.5)*.14); x.beginPath(); x.ellipse(R()*S, R()*S, 10 + R()*34, 8 + R()*24, R()*3, 0, 7); x.fill(); }
    for(let k = 0; k < 12; k++){ x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.5; x.beginPath(); let X = R()*S, Y = R()*S; x.moveTo(X, Y); for(let j = 0; j < 5; j++){ X += (R()-.5)*50; Y += (R()-.3)*40; x.lineTo(X, Y); } x.stroke(); }
  },
  agua(x, cor, R){
    const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, tom(cor, .06)); g.addColorStop(1, tom(cor, -.06)); x.fillStyle = g; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 22; k++){ x.strokeStyle = 'rgba(255,255,255,'+(.1 + R()*.18)+')'; x.lineWidth = 2; const Y = R()*S; x.beginPath(); for(let X = 0; X <= S; X += 8) x.lineTo(X, Y + Math.sin((X/S)*Math.PI*4 + k)*3); x.stroke(); }
  },
  metal(x, cor, R){
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let k = 0; k < 160; k++){ x.fillStyle = 'rgba('+(R()<.5?'255,255,255':'0,0,0')+','+(R()*.08)+')'; x.fillRect(0, R()*S, S, 1 + R()*1.5); }
    x.strokeStyle = tom(cor, -.2); x.lineWidth = 3; x.strokeRect(2, 2, S-4, S-4);
    x.fillStyle = tom(cor, -.12); [[14,14],[S-14,14],[14,S-14],[S-14,S-14]].forEach(p => { x.beginPath(); x.arc(p[0], p[1], 4, 0, 7); x.fill(); });
  },
  tecido(x, cor, R){
    x.fillStyle = cor; x.fillRect(0, 0, S, S);
    for(let i = 0; i < S; i += 4){ x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(i, 0, 2, S); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, i, S, 2); }
    for(let k = 0; k < 500; k++){ x.fillStyle = 'rgba(0,0,0,'+(R()*.05)+')'; x.fillRect(R()*S, R()*S, 2, 2); }
  },
  piso(x, cor, R){
    const n = 2, h = S/n; for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){ x.fillStyle = tom(cor, ((i+j)%2 ? -.04 : .03) + (R()-.5)*.02); x.fillRect(j*h, i*h, h, h); }
    x.strokeStyle = tom(cor, -.22); x.lineWidth = 4; for(let i = 0; i <= n; i++){ x.beginPath(); x.moveTo(0, i*h); x.lineTo(S, i*h); x.stroke(); x.beginPath(); x.moveTo(i*h, 0); x.lineTo(i*h, S); x.stroke(); }
  },
  liso(x, cor){ x.fillStyle = cor; x.fillRect(0, 0, S, S); }
};
// m = quantos metros a textura cobre antes de repetir
function tex(nome, cor, m){
  const key = nome+'|'+cor+'|'+(m||1);
  if(TEX.has(key)) return TEX.get(key);
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  (PADROES[nome] || PADROES.liso)(x, cor, rng(hashStr(nome+cor)));
  const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; t.anisotropy = 4; t.userData = {m: m || 1};
  TEX.set(key, t); return t;
}

/* ---------- materiais ---------- */
// opcoes: {tex:'madeira', m:1, vidro:.4, brilho:.5, rough:.85, metal:0}
function mat(cor, o){
  o = o || {};
  const m = new T3.MeshStandardMaterial({color: o.tex ? '#ffffff' : cor, flatShading:true, roughness: o.rough != null ? o.rough : .85, metalness: o.metal || 0});
  if(o.tex) m.map = tex(o.tex, cor, o.m || 1);
  if(o.vidro){ m.transparent = true; m.opacity = clamp(o.vidro, .15, 1); m.depthWrite = false; m.roughness = .2; }
  if(o.brilho){ m.emissive = new T3.Color(cor); m.emissiveIntensity = o.brilho; if(o.tex){ m.emissiveMap = m.map; } }
  m.userData.e = {c: m.emissive.clone(), i: m.emissiveIntensity};
  return m;
}

/* ---------- geometrias com textura em escala de metros ---------- */
function uvCaixa(g, w, h, d, m){
  const uv = g.attributes.uv, f = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let face = 0; face < 6; face++) for(let v = 0; v < 4; v++){ const i = face*4 + v; uv.setXY(i, uv.getX(i)*f[face][0]/m, uv.getY(i)*f[face][1]/m); }
  uv.needsUpdate = true; return g;
}
function uvCil(g, r, h, m){
  const uv = g.attributes.uv; for(let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i)*(2*Math.PI*r)/m, uv.getY(i)*h/m);
  uv.needsUpdate = true; return g;
}
function sombra(me){ me.castShadow = !(me.material.transparent); me.receiveShadow = true; return me; }
function nomear(o, nome){ if(nome){ o.name = nome; o.userData.parte = nome; } return o; }
function por(o, opt){
  opt = opt || {};
  if(opt.pos) o.position.set(opt.pos[0], opt.pos[1], opt.pos[2]);
  if(opt.rot) o.rotation.set(rad(opt.rot[0]), rad(opt.rot[1]), rad(opt.rot[2]));
  if(opt.esc != null) Array.isArray(opt.esc) ? o.scale.set(opt.esc[0], opt.esc[1], opt.esc[2]) : o.scale.setScalar(opt.esc);
  nomear(o, opt.nome); if(opt.pai) opt.pai.add(o); return o;
}
// primitivas (opt: nome, pos, rot, esc, pai, m = metros por repetição da textura)
function caixa(w, h, d, matl, opt){
  opt = opt || {}; const g = new T3.BoxGeometry(w, h, d); if(matl.map) uvCaixa(g, w, h, d, matl.map.userData.m || 1);
  return por(sombra(new T3.Mesh(g, matl)), opt);
}
function cil(r, h, matl, opt){
  opt = opt || {}; const g = new T3.CylinderGeometry(opt.rTopo != null ? opt.rTopo : r, r, h, opt.lados || 12); if(matl.map) uvCil(g, r, h, matl.map.userData.m || 1);
  return por(sombra(new T3.Mesh(g, matl)), opt);
}
function cone(r, h, matl, opt){ opt = opt || {}; return por(sombra(new T3.Mesh(new T3.ConeGeometry(r, h, opt.lados || 8), matl)), opt); }
function esfera(r, matl, opt){ opt = opt || {}; return por(sombra(new T3.Mesh(new T3.IcosahedronGeometry(r, opt.det != null ? opt.det : 1), matl)), opt); }
function grupo(opt){ return por(new T3.Group(), opt); }
// pose de repouso: toda animação parte dela
function repouso(o){ if(!o.userData.rest) o.userData.rest = {p:o.position.clone(), r:o.rotation.clone(), s:o.scale.clone()}; return o.userData.rest; }
function volta(o){ const r = repouso(o); o.position.copy(r.p); o.rotation.copy(r.r); o.scale.copy(r.s); return r; }
const suave = t => { t = clamp(t, 0, 1); return t*t*(3 - 2*t); };
const saida = t => { t = clamp(t, 0, 1); return 1 - (1-t)*(1-t); };
const prog = (t, a, b) => clamp((t - a)/Math.max(1e-6, b - a), 0, 1);

const H = {T3, rad, clamp, rng, tex, mat, caixa, cil, cone, esfera, grupo, por, nomear, repouso, volta, suave, saida, prog, tom};
LIB.H = H;

LIB.registrar = function(def){
  if(!def || !def.id || typeof def.criar !== 'function') throw new Error('objeto da biblioteca sem id ou criar');
  def.defaults = () => { const o = {}; Object.keys(def.params || {}).forEach(k => { o[k] = def.params[k].padrao; }); return o; };
  def.animacoes = def.animacoes || {};
  if(!LIB.itens[def.id]) LIB.ordem.push(def.id);
  LIB.itens[def.id] = def; return def;
};
// constrói e prepara um objeto: guarda a pose de repouso de todas as partes e devolve {obj, ancoras, partes}
LIB.construir = function(id, params){
  const def = LIB.itens[id]; if(!def) return null;
  const P = Object.assign(def.defaults(), params || {});
  const r = def.criar(P, H), partes = {};
  r.obj.traverse(o => { if(o.userData.parte){ partes[o.userData.parte] = o; repouso(o); } });
  return {def, obj: r.obj, ancoras: r.ancoras || {}, dim: r.dim || def.dim || [1,1,1], partes, params: P};
};
// volta todas as partes à pose de repouso e às cores originais (o motor chama isso antes de aplicar as animações do quadro)
LIB.reset = function(partes){
  Object.keys(partes).forEach(k => { const o = partes[k]; volta(o); o.traverse(m => {
    if(!m.isMesh) return; const mt = m.material;
    if(mt.userData.cor0) mt.color.copy(mt.userData.cor0);
    const e = mt.userData.e; if(e && mt.emissive){ mt.emissive.copy(e.c); mt.emissiveIntensity = e.i; }
  }); });
};
// resumo para o prompt da IA
LIB.catalogo = function(){
  return LIB.ordem.map(id => {
    const d = LIB.itens[id], r = LIB.construir(id), ps = Object.keys(d.params || {}).map(k => { const p = d.params[k]; return k+(p.opcoes ? '('+p.opcoes.join('|')+')' : '')+'='+JSON.stringify(p.padrao); });
    return '- '+id+': '+d.descricao+' | tamanho ~'+r.dim.map(v => +v.toFixed(1)).join('x')+' m | params: '+(ps.join(', ') || '—')+' | partes: '+Object.keys(r.partes).join(', ')+' | animações (faz:"anim", nome): '+(Object.keys(d.animacoes).map(n => n+(d.animacoes[n].loop ? '*' : '')+' ('+d.animacoes[n].desc+')').join('; ') || '—');
  }).join('\n');
};
})();
