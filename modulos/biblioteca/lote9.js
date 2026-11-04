/* =========================================================
   BIBLIOTECA · LOTE 9 (cotidiano e economia): 10 objetos
   carrinho_compras, cartao_credito, notas_dinheiro, grafico_barras, ampulheta, livro, xicara, garrafa, escada, guarda_chuva
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H, {RP, gx, gy, gz, tinge, brilha, treme, pos} = LIB.U;

/* ---------- 81. carrinho_compras ---------- */
LIB.registrar({id:'carrinho_compras', nome:'Carrinho de compras', lote:9, categoria:'economia',
  descricao:'carrinho de supermercado de arame com 4 rodas (frente +x); enche de produtos e anda',
  params:{},
  animacoes:{encher:{desc:'produtos coloridos caem dentro, um a um', dur:2.4, aplicar(p, t){ for(let i = 0; i < 5; i++){ const u = prog(t, i*.4, i*.4 + .5), o = p['item_'+i]; o.visible = u > 0; pos(o, 0, (1 - saida(u))*1.2, 0); } }},
             empurrar:{desc:'as rodas giram (contínuo)', loop:true, dur:3, aplicar(p, t){ for(let i = 0; i < 4; i++) gz(p['roda_'+i], -t*5); }}},
  criar(P){
    const g = grupo(), mm = mat('#c9ced6', {tex:'metal', m:.3, rough:.35}), mp = mat('#d63c3c');
    caixa(1.0, .04, .6, mm, {pai:g, pos:[0, .38, 0]}); [-.3, .3].forEach(z => { caixa(1.0, .04, .03, mm, {pai:g, pos:[0, .7, z], rot:[0, 0, 0]}); for(let i = 0; i < 6; i++) caixa(.02, .32, .02, mm, {pai:g, pos:[-.45 + i*.18, .55, z]}); }); [-.5, .5].forEach(x => { caixa(.03, .32, .6, mm, {pai:g, pos:[x, .55, 0]}); }); caixa(.03, .04, .6, mm, {pai:g, pos:[-.5, .72, 0]}); caixa(.04, .04, .6, mp, {pai:g, pos:[-.65, .9, 0]}); [-.3, .3].forEach(z => caixa(.2, .02, .02, mm, {pai:g, pos:[-.58, .8, z], rot:[0, 0, 40]}));
    [[.38, .22, 0], [.38, -.22, 1], [-.38, .22, 2], [-.38, -.22, 3]].forEach(([x, z, i]) => { const w = grupo({pai:g, nome:'roda_'+i, pos:[x, .08, z]}); cil(.08, .05, mat('#1f2226'), {pai:w, rot:[90, 0, 0], lados:10}); });
    ['#e5565b', '#3fb86a', '#f2b705', '#4aa8ff', '#b76bd6'].forEach((c, i) => caixa(.2, .24 + (i%2)*.06, .16, mat(c, {rough:.6}), {pai:g, nome:'item_'+i, pos:[-.3 + (i%3)*.28, .52 + (i%2)*.03, (i%2 ? .12 : -.12)]}));
    return {obj:g, dim:[1.4, 1, .65], ancoras:{cesto:[0, .6, 0]}};
  }});

/* ---------- 82. cartao_credito ---------- */
function texCartao(cor){ const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = cor; x.fillRect(0, 0, 256, 160); x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.arc(200, 40, 90, 0, 6.283); x.fill(); x.fillStyle = '#d9b04a'; x.fillRect(24, 54, 44, 34); x.fillStyle = '#ffffff'; for(let i = 0; i < 4; i++) x.fillRect(24 + i*52, 110, 38, 8); const t = new T3.CanvasTexture(c); t.userData = {m:1}; return t; }
LIB.registrar({id:'cartao_credito', nome:'Cartão de crédito', lote:9, categoria:'economia',
  descricao:'cartão de crédito em pé de frente para +z com chip e números (sem dados reais); gira e desliza (passar)',
  params:{cor:{padrao:'#2f5fb5'}},
  animacoes:{girar:{desc:'gira mostrando o verso (contínuo)', loop:true, dur:4, aplicar(p, t){ gy(p.cartao, t*1.4); }},
             passar:{desc:'desliza para o lado como numa maquininha', dur:1, aplicar(p, t){ pos(p.cartao, -.6 + 1.2*suave(t/1), 0, 0); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'cartao', pos:[0, .5, 0]}); const m = new T3.MeshStandardMaterial({color:'#fff', map:texCartao(P.cor), roughness:.35, flatShading:true}); m.userData.e = {c:m.emissive.clone(), i:0};
    caixa(.86, .54, .02, m, {pai:c}); caixa(.86, .54, .02, mat(tom(P.cor, -.08), {rough:.35}), {pai:c, pos:[0, 0, -.021]}); caixa(.86, .1, .005, mat('#1d2127'), {pai:c, pos:[0, .12, -.034]});
    caixa(.5, .05, .4, mat('#59616c'), {pai:g, pos:[0, .025, 0]});
    return {obj:g, dim:[.9, .8, .5], ancoras:{centro:[0, .5, 0]}};
  }});

/* ---------- 83. notas_dinheiro ---------- */
LIB.registrar({id:'notas_dinheiro', nome:'Maço de dinheiro', lote:9, categoria:'economia',
  descricao:'maço de notas verdes presas por uma cinta (sem valores reais); as notas se espalham em leque ou voam',
  params:{cor:{padrao:'#4f9a5a'}},
  animacoes:{espalhar:{desc:'as notas abrem em leque', dur:1.4, aplicar(p, t){ const k = suave(t/1.2); for(let i = 0; i < 6; i++){ const o = p['nota_'+i]; gy(o, (i - 2.5)*.18*k); pos(o, 0, 0, 0); } }},
             voar:{desc:'as notas sobem e voam balançando', dur:2.5, aplicar(p, t){ const k = suave(t/2); for(let i = 0; i < 6; i++){ const o = p['nota_'+i]; pos(o, (i - 2.5)*.35*k, k*(1 + i*.18) + .08*Math.sin(t*5 + i), (i%2 - .5)*.5*k); gz(o, k*(i - 2.5)*.35); gx(o, .5*k*Math.sin(t*3 + i)); } }}},
  criar(P){
    const g = grupo(), m = mat(P.cor, {rough:.7}), mb = mat(tom(P.cor, .18), {rough:.7});
    for(let i = 0; i < 6; i++){ const o = grupo({pai:g, nome:'nota_'+i, pos:[0, .04 + i*.07, 0]}); caixa(.9, .05, .45, m, {pai:o}); caixa(.7, .052, .3, mb, {pai:o}); cil(.08, .054, mat(tom(P.cor, .3)), {pai:o, lados:10}); }
    caixa(.14, .5, .5, mat('#e8d8b0'), {pai:g, nome:'cinta', pos:[0, .22, 0], esc:[1, 1, 1]});
    return {obj:g, dim:[.95, .5, .5], ancoras:{topo:[0, .45, 0]}};
  }});

/* ---------- 84. grafico_barras ---------- */
LIB.registrar({id:'grafico_barras', nome:'Gráfico de barras 3D', lote:9, categoria:'economia',
  descricao:'5 barras 3D coloridas sobre uma base; params v1..v5 são as alturas (0 a 3); as barras crescem em sequência ou caem',
  params:{v1:{padrao:.8}, v2:{padrao:1.3}, v3:{padrao:1.0}, v4:{padrao:1.9}, v5:{padrao:2.6}},
  animacoes:{crescer:{desc:'as barras sobem do zero até o valor, uma a uma', dur:2.4, aplicar(p, t){ for(let i = 0; i < 5; i++) barra(p['barra_'+i], saida(prog(t, i*.25, i*.25 + .9))); }},
             despencar:{desc:'as barras desabam para perto do zero', dur:1.6, aplicar(p, t){ for(let i = 0; i < 5; i++) barra(p['barra_'+i], 1 - .85*saida(prog(t, i*.1, i*.1 + .8))); }}},
  criar(P){
    const g = grupo(), cores = ['#4aa8ff', '#3fb86a', '#f2b705', '#e07a1f', '#e5565b'];
    caixa(3.2, .1, 1, mat('#59616c', {tex:'concreto', m:.6}), {pai:g, pos:[0, .05, 0]});
    for(let i = 0; i < 5; i++){ const h = Math.max(.1, P['v'+(i + 1)]), b = grupo({pai:g, nome:'barra_'+i, pos:[-1.2 + i*.6, .1, 0]}); b.userData.h = h; caixa(.42, 1, .42, mat(cores[i], {rough:.4}), {pai:b, pos:[0, .5, 0]}); b.scale.y = h; }
    return {obj:g, dim:[3.2, 3.1, 1], ancoras:{topo:[1.2, 2.7, 0]}};
  }});
function barra(b, k){ const h = b.userData.h; b.scale.y = Math.max(.02, h*k); }

/* ---------- 85. ampulheta ---------- */
LIB.registrar({id:'ampulheta', nome:'Ampulheta', lote:9, categoria:'conceitos',
  descricao:'ampulheta de vidro com areia e moldura de madeira; a areia escorre (tempo passando) e ela vira',
  params:{cor_areia:{padrao:'#e8c15a'}},
  animacoes:{passar:{desc:'a areia desce de cima para baixo', dur:4, aplicar(p, t){ const k = clamp(t/4, 0, 1); p.areia_cima.scale.y = Math.max(.02, 1 - k); p.areia_baixo.scale.y = Math.max(.02, .1 + .9*k); p.fio.scale.y = k < 1 ? 1 : .001; }},
             virar:{desc:'gira 180° ficando de cabeça para baixo', dur:1.2, aplicar(p, t){ gz(p.corpo, Math.PI*suave(t/1.2)); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo', pos:[0, .9, 0]}), vd = mat('#dff0fa', {vidro:.28, rough:.05}), mw = mat('#6b4a2c', {tex:'madeira', m:.4});
    cone(.4, .8, vd, {pai:c, pos:[0, .4, 0], rot:[180, 0, 0], lados:14}); cone(.4, .8, vd, {pai:c, pos:[0, -.4, 0], lados:14}); cil(.5, .08, mw, {pai:c, pos:[0, .84, 0], lados:14}); cil(.5, .08, mw, {pai:c, pos:[0, -.84, 0], lados:14});
    [0, 120, 240].forEach(a => cil(.03, 1.7, mw, {pai:c, pos:[Math.cos(rad(a))*.46, 0, Math.sin(rad(a))*.46], lados:6}));
    const ac = cone(.34, .6, mat(P.cor_areia, {rough:.9}), {pai:c, nome:'areia_cima', pos:[0, .32, 0], rot:[180, 0, 0], lados:14}); const ab = cone(.34, .6, mat(P.cor_areia, {rough:.9}), {pai:c, nome:'areia_baixo', pos:[0, -.7, 0], lados:14}); ab.scale.y = .1;
    cil(.012, .8, mat(P.cor_areia), {pai:c, nome:'fio', pos:[0, -.1, 0], lados:4});
    return {obj:g, dim:[1.05, 1.9, 1.05], ancoras:{centro:[0, .9, 0]}};
  }});

/* ---------- 86. livro ---------- */
LIB.registrar({id:'livro', nome:'Livro', lote:9, categoria:'cotidiano',
  descricao:'livro de capa dura deitado (lombada para -x); a capa abre mostrando as páginas e fecha',
  params:{cor:{padrao:'#2f5fb5'}},
  animacoes:{abrir:{desc:'a capa abre', dur:1.2, aplicar(p, t){ gz(p.capa, -Math.PI*.92*suave(t/1.2)); }},
             fechar:{desc:'a capa fecha', dur:1, aplicar(p, t){ gz(p.capa, -Math.PI*.92*(1 - suave(t/1))); }},
             folhear:{desc:'as páginas viram uma a uma (contínuo)', loop:true, dur:3, aplicar(p, t){ gz(p.capa, -Math.PI*.92); for(let i = 0; i < 4; i++){ const u = ((t*.7 + i*.25) % 1); gz(p['pagina_'+i], -Math.PI*suave(u)); } }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.55}), mp = mat('#f4efe0', {rough:.9});
    caixa(.06, .12, .9, mc, {pai:g, pos:[-.5, .06, 0]}); caixa(1.0, .03, .9, mc, {pai:g, pos:[0, .015, 0]}); caixa(.94, .07, .84, mp, {pai:g, pos:[.02, .065, 0]});
    for(let i = 0; i < 4; i++){ const pg = grupo({pai:g, nome:'pagina_'+i, pos:[-.48, .1 + i*.004, 0]}); caixa(.88, .004, .82, mp, {pai:pg, pos:[.44, 0, 0]}); }
    const c = grupo({pai:g, nome:'capa', pos:[-.5, .125, 0]}); caixa(1.0, .03, .9, mc, {pai:c, pos:[.5, 0, 0]}); caixa(.5, .005, .3, mat('#d9b04a'), {pai:c, pos:[.5, .018, 0]});
    return {obj:g, dim:[1.05, .2, .95], ancoras:{capa:[0, .15, 0]}};
  }});

/* ---------- 87. xicara ---------- */
LIB.registrar({id:'xicara', nome:'Xícara de café', lote:9, categoria:'cotidiano',
  descricao:'xícara com pires e café; solta vapor ou tomba derramando',
  params:{cor:{padrao:'#f4f6f8'}},
  animacoes:{vapor:{desc:'fumacinhas sobem (contínuo)', loop:true, dur:3, aplicar(p, t){ p.vapor.children.forEach((s, i) => { const u = (t*.45 + i/4) % 1; s.visible = true; s.scale.setScalar(.4 + u*.8); pos(s, Math.sin(t*2 + i)*.05, u*.5, 0); }); }},
             tombar:{desc:'a xícara tomba e o café derrama', dur:1.4, aplicar(p, t){ const k = suave(t/.8); gz(p.xicara, rad(-88)*k); pos(p.xicara, .1*k, -.03*k, 0); p.cafe.visible = false; p.mancha.scale.setScalar(Math.max(.001, saida((t - .4)/.8)*1.4)); }}},
  criar(P){
    const g = grupo(), m = mat(P.cor, {rough:.3});
    cil(.5, .05, m, {pai:g, pos:[0, .025, 0], rTopo:.44, lados:18}); const x = grupo({pai:g, nome:'xicara', pos:[0, .05, 0]}); cil(.3, .36, m, {pai:x, pos:[0, .18, 0], rTopo:.33, lados:16}); cil(.27, .02, mat('#5a3420', {rough:.2}), {pai:x, nome:'cafe', pos:[0, .33, 0], lados:16});
    const al = new T3.Mesh(new T3.TorusGeometry(.12, .035, 6, 12, Math.PI), m); al.position.set(.34, .2, 0); al.rotation.z = -Math.PI/2; al.castShadow = true; x.add(al);
    const v = grupo({pai:g, nome:'vapor', pos:[0, .48, 0]}); for(let i = 0; i < 4; i++) esfera(.07, mat('#ffffff', {vidro:.5}), {pai:v, pos:[0, i*.12, 0], det:0});
    const ma = cil(.3, .004, mat('#5a3420', {rough:.2}), {pai:g, nome:'mancha', pos:[.35, .056, 0], lados:14}); ma.scale.setScalar(.001);
    return {obj:g, dim:[1.0, .9, 1.0], ancoras:{topo:[0, .4, 0]}};
  }});

/* ---------- 88. garrafa ---------- */
LIB.registrar({id:'garrafa', nome:'Garrafa', lote:9, categoria:'cotidiano',
  descricao:'garrafa de vidro com líquido, rolha e rótulo; enche, esvazia, inclina para servir',
  params:{cor_liquido:{padrao:'#d9a421'}, nivel:{padrao:.7}},
  animacoes:{esvaziar:{desc:'o líquido desce quase a zero', dur:2, aplicar(p, t){ niv(p, P0(p)*(1 - suave(t/2)) + .03); }},
             encher:{desc:'o líquido sobe até quase cheio', dur:2, aplicar(p, t){ niv(p, P0(p) + (.95 - P0(p))*suave(t/2)); }},
             servir:{desc:'inclina a garrafa para o lado como servindo', dur:1.6, aplicar(p, t){ gz(p.corpo, rad(-75)*suave(t/1.2)); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}), vd = mat('#6bbf8a', {vidro:.45, rough:.1});
    cil(.28, .9, vd, {pai:c, pos:[0, .45, 0], lados:14}); cone(.28, .3, vd, {pai:c, pos:[0, 1.05, 0], lados:14, rTopo:.1}); cil(.1, .35, vd, {pai:c, pos:[0, 1.28, 0], lados:12}); cil(.09, .1, mat('#c89a5e', {tex:'madeira', m:.2}), {pai:c, pos:[0, 1.5, 0], lados:10});
    const li = cil(.25, .8, mat(P.cor_liquido, {vidro:.8, rough:.2}), {pai:c, nome:'liquido', pos:[0, .43, 0], lados:14}); li.userData.h = .8; li.userData.y = .03; li.userData.n0 = P.nivel; niv({liquido:li}, P.nivel); li.userData.rest = null;
    caixa(.2, .3, .005, mat('#f4efe0'), {pai:c, pos:[0, .45, .285]}); 
    return {obj:g, dim:[.6, 1.6, .6], ancoras:{boca:[0, 1.5, 0]}};
  }});
function P0(p){ return p.liquido.userData.n0; }
function niv(p, n){ const l = p.liquido; n = clamp(n, .03, 1); l.scale.y = n; l.position.y = l.userData.y + l.userData.h*n/2; }

/* ---------- 89. escada ---------- */
LIB.registrar({id:'escada', nome:'Escada de mão', lote:9, categoria:'construção',
  descricao:'escada de mão encostada (inclinada) com degraus; tomba para trás ou treme',
  params:{degraus:{padrao:7}},
  animacoes:{tombar:{desc:'escorrega e tomba para trás', dur:1.6, aplicar(p, t){ const k = suave(t/1.4); gx(p.escada, -rad(70)*k*k); }},
             tremer:{desc:'treme', dur:1.2, aplicar(p, t){ treme(p.escada, t, .015*Math.max(0, 1 - t/1.2)); }}},
  criar(P){
    const g = grupo(), n = Math.max(3, Math.round(P.degraus)), H = n*.3 + .3, e = grupo({pai:g, nome:'escada', rot:[-12, 0, 0]}), m = mat('#c89a5e', {tex:'madeira', m:.5});
    [-.25, .25].forEach(x => caixa(.06, H, .06, m, {pai:e, pos:[x, H/2, 0]})); for(let i = 0; i < n; i++) caixa(.5, .05, .06, m, {pai:e, pos:[0, .25 + i*.3, 0]});
    return {obj:g, dim:[.6, H, .6], ancoras:{topo:[0, H, -.2]}};
  }});

/* ---------- 90. guarda_chuva ---------- */
LIB.registrar({id:'guarda_chuva', nome:'Guarda-chuva', lote:9, categoria:'clima',
  descricao:'guarda-chuva aberto em pé com cabo curvo; fecha, abre e vira do avesso com vento forte',
  params:{cor:{padrao:'#d63c3c'}},
  animacoes:{fechar:{desc:'fecha a cúpula', dur:1, aplicar(p, t){ const k = suave(t/1); p.cupula.scale.set(1 - .8*k, 1 + .25*k, 1 - .8*k); }},
             abrir:{desc:'abre a cúpula', dur:1, aplicar(p, t){ const k = 1 - suave(t/1); p.cupula.scale.set(1 - .8*k, 1 + .25*k, 1 - .8*k); }},
             inverter:{desc:'o vento vira a cúpula do avesso e sacode', dur:1.4, aplicar(p, t){ const k = suave(t/.5); p.cupula.scale.y = 1 - 1.9*k; treme(p.cupula, t, .03*k); gz(p.corpo, .25*k*Math.sin(t*14)); }},
             balancar:{desc:'balança ao vento (contínuo)', loop:true, dur:3, aplicar(p, t){ gz(p.corpo, .08*Math.sin(t*2.2)); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}); cil(.02, 1.4, mat('#2d333b'), {pai:c, pos:[0, .7, 0], lados:6});
    const cu = grupo({pai:c, nome:'cupula', pos:[0, 1.0, 0]}); for(let i = 0; i < 8; i++){ const a = i*45; const seg = new T3.Mesh(new T3.ConeGeometry(.9, .45, 8, 1, true, rad(a), rad(45)), mat(i%2 ? P.cor : '#f4f6f8', {rough:.7})); seg.material.side = T3.DoubleSide; seg.position.y = .22; seg.castShadow = true; cu.add(seg); }
    cil(.03, .3, mat('#2d333b'), {pai:c, pos:[0, 1.5, 0], lados:6}); 
    const cb = new T3.Mesh(new T3.TorusGeometry(.1, .025, 6, 10, Math.PI), mat('#8a5a2b', {tex:'madeira', m:.2})); cb.position.set(.1, 0, 0); cb.rotation.z = Math.PI; cb.castShadow = true; c.add(cb);
    return {obj:g, dim:[1.8, 1.6, 1.8], ancoras:{topo:[0, 1.5, 0]}};
  }});
})();
