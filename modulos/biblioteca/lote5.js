/* =========================================================
   BIBLIOTECA · LOTE 5 (veículos e cidade): 10 objetos
   carro, onibus, aviao, barco, ponte, predio, poste, semaforo, caminhao, trem
   Veículos olham para +x.
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H, {RP, gx, gy, gz, tinge, brilha, treme, pos} = LIB.U;
const roda = (pai, nome, x, z, r, larg, mp, mc) => { const w = grupo({pai, nome, pos:[x, r, z]}); cil(r, larg, mp, {pai:w, rot:[90, 0, 0], lados:14}); cil(r*.5, larg + .02, mc, {pai:w, rot:[90, 0, 0], lados:8}); caixa(r*.12, r*1.5, larg + .03, mc, {pai:w}); return w; };
const girarRodas = (p, nomes, d, r) => nomes.forEach(n => gz(p[n], -d/r));
const andar = (p, nomes, r, t, v, corpo) => { const d = t*v; girarRodas(p, nomes, d, r); if(corpo) pos(p[corpo], 0, .008*Math.sin(t*18), 0); };

/* ---------- 41. carro ---------- */
LIB.registrar({id:'carro', nome:'Carro', lote:5, categoria:'veículos',
  descricao:'carro popular low poly olhando para +x, 4 rodas giratórias; anda, freia e bate',
  params:{cor:{padrao:'#d9382f'}},
  animacoes:{andar:{desc:'as rodas giram e o carro balança (contínuo; mova o elemento com faz:"mover")', loop:true, dur:3, aplicar(p, t, a){ andar(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4'], .22, t, 4*(a.velocidade != null ? a.velocidade : 1), 'carroceria'); }},
             frear:{desc:'o carro afunda na frente ao frear e as rodas param', dur:1.1, aplicar(p, t){ const k = Math.sin(Math.PI*clamp(t/1.1, 0, 1)); p.carroceria.rotation.z = RP(p.carroceria).r.z - .06*k; girarRodas(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4'], 3*(1 - suave(t/.9)), .22); }},
             bater:{desc:'bate: a frente amassa e o carro sacode', dur:1.2, aplicar(p, t){ const k = saida(t/.25); p.carroceria.scale.x = 1 - .08*k; p.carroceria.rotation.z = RP(p.carroceria).r.z + .08*k*Math.exp(-3*t)*Math.cos(t*22); tinge(p.carroceria, '#222222', .25*k); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.35, metal:.3}), mv = mat('#9fd4ee', {vidro:.5, rough:.1}), mp = mat('#1f2226'), mr = mat('#cfd5db', {tex:'metal', m:.3, metal:.6});
    const c = grupo({pai:g, nome:'carroceria'}); caixa(1.9, .38, .85, mc, {pai:c, pos:[0, .42, 0]}); caixa(1.0, .34, .8, mc, {pai:c, pos:[-.08, .78, 0]}); caixa(.98, .3, .82, mv, {pai:c, pos:[-.08, .78, 0], esc:[1.02, .9, 1.0]});
    caixa(1.0, .08, .84, mc, {pai:c, pos:[-.08, .97, 0]}); [-.3, .3].forEach(z => { caixa(.08, .1, .16, mat('#fff6c8', {brilho:.6}), {pai:c, pos:[.96, .5, z]}); caixa(.08, .1, .16, mat('#ff3b3b', {brilho:.4}), {pai:c, pos:[-.96, .5, z]}); });
    caixa(.06, .12, .5, mp, {pai:c, pos:[.96, .32, 0]});
    [[.6, .46, 1], [.6, -.46, 2], [-.6, .46, 3], [-.6, -.46, 4]].forEach(([x, z, i]) => roda(g, 'roda_'+i, x, z, .22, .14, mp, mr));
    return {obj:g, dim:[2, 1, 1], ancoras:{frente:[1, .45, 0], topo:[0, 1, 0], motorista:[-.1, .8, .2]}};
  }});

/* ---------- 42. onibus ---------- */
LIB.registrar({id:'onibus', nome:'Ônibus', lote:5, categoria:'veículos',
  descricao:'ônibus urbano olhando para +x com janelas e porta; anda e freia',
  params:{cor:{padrao:'#f2b705'}},
  animacoes:{andar:{desc:'rodas giram (contínuo)', loop:true, dur:3, aplicar(p, t, a){ andar(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4'], .3, t, 3.5*(a.velocidade != null ? a.velocidade : 1), 'carroceria'); }},
             frear:{desc:'freia com a frente baixando', dur:1.2, aplicar(p, t){ const k = Math.sin(Math.PI*clamp(t/1.2, 0, 1)); p.carroceria.rotation.z = RP(p.carroceria).r.z - .035*k; girarRodas(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4'], 3*(1 - suave(t/1)), .3); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.4, metal:.2}), mv = mat('#9fd4ee', {vidro:.55, rough:.1}), mp = mat('#1f2226'), mr = mat('#cfd5db', {tex:'metal', m:.3, metal:.6}), c = grupo({pai:g, nome:'carroceria'});
    caixa(3.2, 1.35, 1.1, mc, {pai:c, pos:[0, .95, 0]}); caixa(3.22, .08, 1.12, mat('#2f3a48'), {pai:c, pos:[0, .42, 0]});
    for(let i = 0; i < 5; i++){ caixa(.4, .42, 1.12, mv, {pai:c, pos:[-1.2 + i*.55, 1.18, 0]}); } caixa(.1, 1.0, 1.12, mv, {pai:c, pos:[1.62, 1.1, 0], esc:[1, 1, 1]});
    caixa(.5, .9, 1.12, mat('#cfe7f5', {vidro:.6}), {pai:c, pos:[1.0, .98, 0]}); caixa(.08, .12, .9, mat('#fff6c8', {brilho:.5}), {pai:c, pos:[1.62, .55, 0]});
    [[1.0, .54, 1], [1.0, -.54, 2], [-1.0, .54, 3], [-1.0, -.54, 4]].forEach(([x, z, i]) => roda(g, 'roda_'+i, x, z, .3, .2, mp, mr));
    return {obj:g, dim:[3.3, 1.7, 1.2], ancoras:{frente:[1.6, .9, 0], topo:[0, 1.65, 0]}};
  }});

/* ---------- 43. aviao ---------- */
LIB.registrar({id:'aviao', nome:'Avião', lote:5, categoria:'veículos',
  descricao:'avião a jato de passageiros olhando para +x (origem sob a fuselagem, pousado); voa balançando ou decola',
  params:{cor:{padrao:'#f4f6f8'}, faixa:{padrao:'#2f6fd0'}},
  animacoes:{voar:{desc:'balança suavemente em voo (contínuo)', loop:true, dur:4, aplicar(p, t){ pos(p.aviao, 0, .05*Math.sin(t*1.3), 0); gz(p.aviao, .015*Math.sin(t*1.1)); gx(p.aviao, .03*Math.sin(t*.9)); }},
             decolar:{desc:'acelera, levanta o nariz e sobe (args.dist = avanço em x)', dur:3, aplicar(p, t, a){ const k = suave(t/3), d = (a.dist != null ? a.dist : 4); pos(p.aviao, d*k*k, 2.2*Math.max(0, k - .35)/.65, 0); gz(p.aviao, rad(16)*suave((t - .6)/1.6)); }},
             turbulencia:{desc:'sacode forte', dur:2, aplicar(p, t){ const k = Math.max(0, 1 - t/2); pos(p.aviao, 0, .12*Math.sin(t*17)*k, 0); gz(p.aviao, .06*Math.sin(t*13)*k); gx(p.aviao, .08*Math.sin(t*11)*k); }}},
  criar(P){
    const g = grupo(), a = grupo({pai:g, nome:'aviao', pos:[0, .55, 0]}), mc = mat(P.cor, {rough:.35, metal:.15}), mb = mat(P.faixa, {rough:.4}), mv = mat('#2a3340', {rough:.2}), mm = mat('#8d98a6', {tex:'metal', m:.4, metal:.6});
    cil(.36, 3.2, mc, {pai:a, rot:[0, 0, 90], lados:14}); cone(.36, .8, mc, {pai:a, pos:[2.0, 0, 0], rot:[0, 0, -90], lados:14}); cone(.36, 1.0, mc, {pai:a, pos:[-2.0, .02, 0], rot:[0, 0, 90], lados:14, esc:[1, 1, 1]});
    cil(.365, .12, mb, {pai:a, pos:[.3, 0, 0], rot:[0, 0, 90], lados:14}); caixa(.3, .18, .5, mv, {pai:a, pos:[1.75, .12, 0]});
    [-1, 1].forEach(s => { caixa(1.0, .07, 2.3, mc, {pai:a, pos:[.1, -.05, s*1.1], rot:[s*0, s*-8, s*-6]}); cil(.14, .55, mm, {pai:a, pos:[.3, -.3, s*.8], rot:[0, 0, 90], lados:10}); caixa(.5, .06, .8, mc, {pai:a, pos:[-2.0, .08, s*.4]}); });
    caixa(.6, .8, .06, mb, {pai:a, pos:[-1.9, .55, 0], rot:[0, 0, -14]});
    for(let i = 0; i < 9; i++) caixa(.1, .09, .73, mv, {pai:a, pos:[-.9 + i*.2, .13, 0], esc:[1, 1, 1.0]});
    [[.9, 0], [-.7, 0.0]].forEach(([x]) => { cil(.04, .35, mm, {pai:g, pos:[x, .3, 0], lados:6}); const w = grupo({pai:g, pos:[x, .12, 0]}); cil(.12, .12, mat('#1f2226'), {pai:w, rot:[90, 0, 0], lados:8}); });
    return {obj:g, dim:[4, 1.5, 4.4], ancoras:{nariz:[2.4, .6, 0], cauda:[-2.3, .8, 0], topo:[0, 1.0, 0]}};
  }});

/* ---------- 44. barco ---------- */
LIB.registrar({id:'barco', nome:'Barco', lote:5, categoria:'veículos',
  descricao:'barco pequeno com cabine e chaminé olhando para +x; balança nas ondas ou afunda',
  params:{cor:{padrao:'#e34a3a'}},
  animacoes:{balancar:{desc:'balança nas ondas (contínuo); args.intensidade', loop:true, dur:4, aplicar(p, t, a){ const k = a.intensidade || 1; pos(p.barco, 0, .06*k*Math.sin(t*1.6), 0); gx(p.barco, .08*k*Math.sin(t*1.3)); gz(p.barco, .05*k*Math.sin(t*1.9 + 1)); }},
             afundar:{desc:'inclina e afunda', dur:3, aplicar(p, t){ const k = suave(t/3); pos(p.barco, 0, -1.1*k, 0); gz(p.barco, -.5*k); gx(p.barco, .2*k); }}},
  criar(P){
    const g = grupo(), b = grupo({pai:g, nome:'barco', pos:[0, .3, 0]}), mc = mat(P.cor, {rough:.45}), mw = mat('#f4f6f8'), mm = mat('#59616c', {tex:'metal', m:.4});
    caixa(2.2, .5, .9, mc, {pai:b, pos:[0, 0, 0]}); cone(.45, .6, mc, {pai:b, pos:[1.35, 0, 0], rot:[0, 0, -90], lados:4, esc:[1, 1, 1.0]}); caixa(.2, .5, .9, mc, {pai:b, pos:[-1.2, .0, 0]});
    caixa(2.24, .07, .94, mw, {pai:b, pos:[0, .27, 0]}); caixa(.9, .45, .6, mw, {pai:b, pos:[-.2, .5, 0]}); caixa(.92, .18, .62, mat('#9fd4ee', {vidro:.55}), {pai:b, pos:[-.2, .56, 0]}); caixa(1.0, .06, .7, mc, {pai:b, pos:[-.2, .76, 0]});
    cil(.08, .5, mm, {pai:b, pos:[-.5, .95, 0], lados:8}); cil(.1, .06, mat('#e34a3a'), {pai:b, pos:[-.5, 1.2, 0], lados:8});
    return {obj:g, dim:[2.8, 1.5, 1], ancoras:{convés:[0, .8, 0], proa:[1.6, .3, 0]}};
  }});

/* ---------- 45. ponte ---------- */
LIB.registrar({id:'ponte', nome:'Ponte pênsil', lote:5, categoria:'infraestrutura',
  descricao:'ponte pênsil com duas torres e cabos (eixo ao longo de x); vibra com vento e desaba no meio',
  params:{vao:{padrao:6, desc:'comprimento em m'}, cor:{padrao:'#c0392b'}},
  animacoes:{vibrar:{desc:'o tabuleiro balança com vento (contínuo)', loop:true, dur:3, aplicar(p, t){ ['tab_esq', 'tab_dir'].forEach((n, i) => { pos(p[n], 0, .06*Math.sin(t*5 + i*2), 0); gx(p[n], .03*Math.sin(t*4 + i)); }); }},
             desabar:{desc:'o tabuleiro quebra no meio e cai', dur:2.4, aplicar(p, t){ const k = suave(t/1.8); gz(p.tab_esq, -.8*k); gz(p.tab_dir, .8*k); pos(p.tab_esq, 0, -.5*k*k, 0); pos(p.tab_dir, 0, -.5*k*k, 0); treme(p.torre_esq, t, .01*Math.max(0, 1 - t/1.5)); }}},
  criar(P){
    const g = grupo(), L = P.vao, mc = mat(P.cor, {tex:'metal', m:.6, metal:.3}), mcn = mat('#2d333b'), mr = mat('#7f8891', {tex:'concreto', m:.6}), Ht = 2.2, H0 = .55;
    const te = grupo({pai:g, nome:'torre_esq', pos:[-L/2 + .6, 0, 0]}), td = grupo({pai:g, nome:'torre_dir', pos:[L/2 - .6, 0, 0]});
    [te, td].forEach(t => { [-.5, .5].forEach(z => caixa(.22, Ht, .22, mc, {pai:t, pos:[0, Ht/2, z]})); caixa(.22, .18, 1.2, mc, {pai:t, pos:[0, Ht - .1, 0]}); caixa(.22, .12, 1.2, mc, {pai:t, pos:[0, Ht*.6, 0]}); });
    [-1, 1].forEach(s => caixa(1, .2, .9, mr, {pai:g, pos:[s*(L/2 + .35 - .6) + s*.2, .1, 0]}));
    const tl = grupo({pai:g, nome:'tab_esq', pos:[-L/4, H0, 0]}), tr = grupo({pai:g, nome:'tab_dir', pos:[L/4, H0, 0]});
    [tl, tr].forEach(t => { caixa(L/2, .14, 1.0, mat('#4a525d', {tex:'concreto', m:.5}), {pai:t}); caixa(L/2, .05, .02, mat('#f2d24a'), {pai:t, pos:[0, .08, 0]}); [-.48, .48].forEach(z => caixa(L/2, .22, .04, mc, {pai:t, pos:[0, .17, z]})); });
    [-.5, .5].forEach(z => { for(let i = 0; i <= 12; i++){ const x = -L/2 + .6 + i*(L - 1.2)/12, f = (x/(L/2 - .6)), y = H0 + .3 + (Ht - H0 - .3)*Math.pow(f, 2); caixa(.02, y - H0 - .1, .02, mcn, {pai:g, pos:[x, H0 + .1 + (y - H0 - .1)/2, z]}); } for(let i = 0; i < 16; i++){ const x0 = -L/2 + .6 + i*(L - 1.2)/16, x1 = x0 + (L - 1.2)/16, y = x => H0 + .3 + (Ht - H0 - .3)*Math.pow(x/(L/2 - .6), 2), a = Math.atan2(y(x1) - y(x0), x1 - x0); caixa(Math.hypot(x1 - x0, y(x1) - y(x0)) + .02, .035, .035, mcn, {pai:g, pos:[(x0 + x1)/2, (y(x0) + y(x1))/2 + .0, z], rot:[0, 0, a*57.3]}); } });
    return {obj:g, dim:[L + 1.4, Ht + .2, 1.2], ancoras:{meio:[0, H0 + .1, 0], torre_esq:[-L/2 + .6, Ht, 0]}};
  }});

/* ---------- 46. predio ---------- */
function texJanelas(cols, rows, parede, luz){
  const c = document.createElement('canvas'); c.width = 128; c.height = 128*rows/cols*1.2; const x = c.getContext('2d'); x.fillStyle = parede; x.fillRect(0, 0, c.width, c.height);
  const cw = c.width/cols, ch = c.height/rows; for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++){ x.fillStyle = '#243447'; x.fillRect(i*cw + cw*.2, j*ch + ch*.2, cw*.6, ch*.6); }
  const c2 = document.createElement('canvas'); c2.width = c.width; c2.height = c.height; const x2 = c2.getContext('2d'); x2.fillStyle = '#000'; x2.fillRect(0, 0, c2.width, c2.height);
  for(let i = 0; i < cols; i++) for(let j = 0; j < rows; j++){ if(((i*7 + j*13) % 3) !== 0){ x2.fillStyle = luz; x2.fillRect(i*cw + cw*.2, j*ch + ch*.2, cw*.6, ch*.6); } }
  const t1 = new T3.CanvasTexture(c), t2 = new T3.CanvasTexture(c2); t1.userData = {m:1}; t2.userData = {m:1}; return [t1, t2];
}
LIB.registrar({id:'predio', nome:'Prédio', lote:5, categoria:'cidade',
  descricao:'prédio de andares com janelas (algumas acendem); treme e desaba parcialmente',
  params:{andares:{padrao:6}, cor:{padrao:'#b5a58e'}, largura:{padrao:1.6}},
  animacoes:{acender:{desc:'as janelas acendem (anoitecer)', dur:1.2, aplicar(p, t){ lz(p, suave(t/1.2)); }},
             tremer:{desc:'treme (terremoto/tempestade)', dur:2, aplicar(p, t){ treme(p.corpo, t, .03*Math.max(0, 1 - t/2)); }},
             desabar:{desc:'o topo racha e despenca', dur:2.5, aplicar(p, t){ const k = suave(t/2.2); pos(p.topo, k*.5, -k*k*1.2, 0); gz(p.topo, -.7*k); treme(p.corpo, t, .02*Math.max(0, 1 - t/1.5)); }}},
  criar(P){
    const g = grupo(), n = Math.max(2, Math.round(P.andares)), w = P.largura, h = n*.42, [t1, t2] = texJanelas(4, n, P.cor, '#ffe9a0');
    const m = new T3.MeshStandardMaterial({color:'#ffffff', map:t1, emissive:new T3.Color('#ffffff'), emissiveMap:t2, emissiveIntensity:0, roughness:.7, flatShading:true}); m.userData.e = {c:m.emissive.clone(), i:0};
    const c = grupo({pai:g, nome:'corpo'}); caixa(w, h, w, m, {pai:c, pos:[0, h/2, 0]}); caixa(w + .1, .1, w + .1, mat('#59616c', {tex:'concreto', m:.6}), {pai:c, pos:[0, .05, 0]});
    const tp = grupo({pai:g, nome:'topo', pos:[0, h, 0]}); caixa(w + .1, .1, w + .1, mat('#59616c', {tex:'concreto', m:.6}), {pai:tp, pos:[0, .05, 0]}); caixa(.3, .22, .3, mat('#8d98a6', {tex:'metal'}), {pai:tp, pos:[.2, .21, .15]}); cil(.015, .5, mat('#cfd5db'), {pai:tp, pos:[-.3, .35, -.2], lados:4});
    return {obj:g, dim:[w, h + .6, w], ancoras:{topo:[0, h + .1, 0], porta:[0, .2, w/2]}};
  }});
function lz(p, k){ p.corpo.traverse(m => { if(m.isMesh && m.material.emissiveMap) m.material.emissiveIntensity = k*1.1; }); }

/* ---------- 47. poste ---------- */
LIB.registrar({id:'poste', nome:'Poste de luz', lote:5, categoria:'cidade',
  descricao:'poste de rua com braço e lâmpada; acende, pisca e tomba',
  params:{altura:{padrao:3}},
  animacoes:{acender:{desc:'a luz acende', dur:.5, aplicar(p, t){ brilha(p.lampada, '#fff2b0', 2*suave(t/.5)); }},
             piscar:{desc:'pisca (contínuo)', loop:true, dur:2, aplicar(p, t){ brilha(p.lampada, '#fff2b0', Math.sin(t*13) > 0 ? 2 : .1); }},
             tombar:{desc:'o poste cai para o lado (vento forte); args.dir 1 ou -1', dur:1.4, aplicar(p, t, a){ gz(p.poste, -(a.dir || 1)*rad(85)*suave(t/1.4)*suave(t/1.4)); }}},
  criar(P){
    const g = grupo(), H = P.altura, c = grupo({pai:g, nome:'poste'}), mm = mat('#59616c', {tex:'metal', m:.5, metal:.5});
    cil(.1, .18, mat('#40464f', {tex:'concreto'}), {pai:c, pos:[0, .09, 0], lados:8}); cil(.07, H, mm, {pai:c, pos:[0, H/2, 0], rTopo:.05, lados:8}); caixa(.7, .05, .05, mm, {pai:c, pos:[.3, H - .05, 0]});
    const la = grupo({pai:c, nome:'lampada', pos:[.6, H - .12, 0]}); caixa(.3, .08, .16, mat('#2d333b'), {pai:la, pos:[0, .04, 0]}); caixa(.24, .05, .12, mat('#fff2b0', {brilho:.1, rough:.3}), {pai:la, pos:[0, -.02, 0]});
    return {obj:g, dim:[1.3, H, .3], ancoras:{lampada:[.6, H - .12, 0], topo:[0, H, 0]}};
  }});

/* ---------- 48. semaforo ---------- */
LIB.registrar({id:'semaforo', nome:'Semáforo', lote:5, categoria:'cidade',
  descricao:'semáforo de poste com 3 luzes (de frente para +z); alterna vermelho, amarelo e verde',
  params:{},
  animacoes:{ciclo:{desc:'alterna vermelho, amarelo e verde (contínuo)', loop:true, dur:6, aplicar(p, t){ luzes(p, Math.floor((t/2)%3)); }},
             vermelho:{desc:'fica vermelho', dur:.3, aplicar(p){ luzes(p, 0); }}, amarelo:{desc:'fica amarelo', dur:.3, aplicar(p){ luzes(p, 1); }}, verde:{desc:'fica verde', dur:.3, aplicar(p){ luzes(p, 2); }}},
  criar(P){
    const g = grupo(), mm = mat('#2d333b', {rough:.5}), cores = ['#ff3b30', '#ffcc00', '#34c759'];
    cil(.06, 2.2, mat('#59616c', {tex:'metal', m:.5}), {pai:g, pos:[0, 1.1, 0], lados:8}); cil(.12, .12, mm, {pai:g, pos:[0, .06, 0], lados:8});
    caixa(.4, 1.0, .3, mm, {pai:g, pos:[0, 2.4, 0]}); cores.forEach((c, i) => { const l = esfera(.11, mat(tom(c, -.15), {rough:.3}), {pai:g, nome:'luz_'+i, pos:[0, 2.7 - i*.3, .16], det:1}); l.userData.cor = c; caixa(.26, .03, .14, mm, {pai:g, pos:[0, 2.7 - i*.3 + .13, .18]}); });
    return {obj:g, dim:[.5, 2.95, .4], ancoras:{topo:[0, 2.95, 0]}};
  }});
function luzes(p, ativa){ for(let i = 0; i < 3; i++){ const l = p['luz_'+i]; brilha(l, l.userData.cor, i === ativa ? 2.2 : 0); } }

/* ---------- 49. caminhao ---------- */
LIB.registrar({id:'caminhao', nome:'Caminhão', lote:5, categoria:'veículos',
  descricao:'caminhão com cabine e baú olhando para +x; anda, freia e basculha a carga',
  params:{cor_cabine:{padrao:'#2f6fd0'}, cor_bau:{padrao:'#f2f2ee'}},
  animacoes:{andar:{desc:'rodas giram (contínuo)', loop:true, dur:3, aplicar(p, t, a){ andar(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4', 'roda_5', 'roda_6'], .3, t, 3*(a.velocidade != null ? a.velocidade : 1), 'cabine'); }},
             basculhar:{desc:'o baú levanta a frente para despejar a carga', dur:2.4, aplicar(p, t){ gz(p.bau, rad(32)*suave(t/1.6)*(t < 2 ? 1 : 1)); }},
             frear:{desc:'freia e a cabine abaixa a frente', dur:1.2, aplicar(p, t){ const k = Math.sin(Math.PI*clamp(t/1.2, 0, 1)); gz(p.cabine, -.04*k); girarRodas(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4', 'roda_5', 'roda_6'], 3*(1 - suave(t/1)), .3); }}},
  criar(P){
    const g = grupo(), mp = mat('#1f2226'), mr = mat('#cfd5db', {tex:'metal', m:.3, metal:.6}), cab = grupo({pai:g, nome:'cabine'}), bau = grupo({pai:g, nome:'bau', pos:[-1.85, .64, 0]});
    caixa(3.4, .12, 1.1, mat('#3a4048'), {pai:g, pos:[-.25, .58, 0]});
    caixa(.9, .95, 1.05, mat(P.cor_cabine, {rough:.4, metal:.2}), {pai:cab, pos:[1.35, 1.0, 0]}); caixa(.5, .45, 1.07, mat('#9fd4ee', {vidro:.55}), {pai:cab, pos:[1.5, 1.2, 0]}); caixa(.3, .35, 1.05, mat(P.cor_cabine), {pai:cab, pos:[1.78, .72, 0]}); caixa(.06, .12, .8, mat('#fff6c8', {brilho:.5}), {pai:cab, pos:[1.93, .68, 0]});
    caixa(2.5, 1.35, 1.12, mat(P.cor_bau, {tex:'metal', m:.6, rough:.5}), {pai:bau, pos:[1.25, .71, 0]});
    [[1.4, .5, 1], [1.4, -.5, 2], [-.2, .5, 3], [-.2, -.5, 4], [-1.1, .5, 5], [-1.1, -.5, 6]].forEach(([x, z, i]) => roda(g, 'roda_'+i, x, z, .3, .22, mp, mr));
    return {obj:g, dim:[3.6, 2.2, 1.2], ancoras:{frente:[2, .8, 0], bau:[-.6, 1.5, 0]}};
  }});

/* ---------- 50. trem ---------- */
LIB.registrar({id:'trem', nome:'Trem com trilhos', lote:5, categoria:'veículos',
  descricao:'locomotiva e um vagão sobre trilhos (olha para +x); anda e freia',
  params:{cor:{padrao:'#c0392b'}},
  animacoes:{andar:{desc:'rodas giram e o trem balança (contínuo)', loop:true, dur:3, aplicar(p, t, a){ andar(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4', 'roda_5', 'roda_6'], .22, t, 4*(a.velocidade != null ? a.velocidade : 1), 'locomotiva'); }},
             frear:{desc:'freia: a locomotiva inclina e faíscas nas rodas', dur:1.4, aplicar(p, t){ const k = Math.sin(Math.PI*clamp(t/1.4, 0, 1)); gz(p.locomotiva, -.03*k); girarRodas(p, ['roda_1', 'roda_2', 'roda_3', 'roda_4', 'roda_5', 'roda_6'], 3*(1 - suave(t/1.2)), .22); }}},
  criar(P){
    const g = grupo(), mp = mat('#1f2226'), mr = mat('#cfd5db', {tex:'metal', m:.3, metal:.6}), mt = mat('#4b4f55', {tex:'metal', m:.4}), mc = mat(P.cor, {rough:.45});
    [-.3, .3].forEach(z => caixa(5.6, .06, .06, mt, {pai:g, pos:[0, .06, z*1.0]})); for(let i = 0; i < 20; i++) caixa(.1, .04, .9, mat('#6b4a2c', {tex:'madeira', m:.5}), {pai:g, pos:[-2.7 + i*.28, .02, 0]});
    const lo = grupo({pai:g, nome:'locomotiva', pos:[1.2, 0, 0]}); caixa(1.6, .6, .68, mc, {pai:lo, pos:[0, .55, 0]}); cil(.3, 1.0, mat('#2d333b'), {pai:lo, pos:[.35, .95, 0], rot:[0, 0, 90], lados:12}); caixa(.6, .5, .7, mc, {pai:lo, pos:[-.5, 1.0, 0]}); caixa(.56, .22, .72, mat('#9fd4ee', {vidro:.55}), {pai:lo, pos:[-.5, 1.05, 0]}); cil(.08, .3, mat('#2d333b'), {pai:lo, pos:[.6, 1.35, 0], lados:8}); caixa(.08, .15, .4, mat('#fff6c8', {brilho:.5}), {pai:lo, pos:[.82, .6, 0]});
    [[.5, .3, 1], [.5, -.3, 2], [-.1, .3, 3], [-.1, -.3, 4], [-.55, .3, 5], [-.55, -.3, 6]].forEach(([x, z, i]) => roda(g, 'roda_'+i, 1.2 + x, z, .22, .1, mp, mr));
    const va = grupo({pai:g, pos:[-1.3, 0, 0]}); caixa(1.7, .8, .7, mat('#3f7fb0', {tex:'metal', m:.6, rough:.5}), {pai:va, pos:[0, .75, 0]}); for(let i = 0; i < 4; i++) caixa(.25, .25, .72, mat('#cfe7f5', {vidro:.6}), {pai:va, pos:[-.6 + i*.4, .85, 0]}); [[-.55, 1], [.55, 2]].forEach(([x]) => { [.3, -.3].forEach(z => { const w = grupo({pai:va, pos:[x, .22, z]}); cil(.2, .1, mp, {pai:w, rot:[90, 0, 0], lados:12}); }); });
    return {obj:g, dim:[5.6, 1.5, 1], ancoras:{frente:[2.2, .7, 0]}};
  }});
})();
