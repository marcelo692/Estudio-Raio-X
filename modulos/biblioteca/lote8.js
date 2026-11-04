/* =========================================================
   BIBLIOTECA · LOTE 8 (tecnologia e dados): 10 objetos
   servidor_rack, roteador_wifi, notebook, hd_disco, chip_cpu, antena_torre, camera_seguranca, drone, teclado, banco_dados
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H, {RP, gx, gy, gz, tinge, brilha, treme, pos} = LIB.U;
function telaMat(cor){ const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#0f1a2b'; x.fillRect(0, 0, 256, 160); x.fillStyle = cor; x.fillRect(14, 14, 228, 18); [50, 70, 90, 110].forEach((y, i) => { x.fillStyle = '#34507a'; x.fillRect(14, y, 120 + i*20, 10); }); const t = new T3.CanvasTexture(c); t.userData = {m:1}; const m = new T3.MeshStandardMaterial({color:'#fff', map:t, emissive:new T3.Color('#fff'), emissiveMap:t, emissiveIntensity:.9, roughness:.3, flatShading:true}); m.userData.e = {c:m.emissive.clone(), i:.9}; return m; }
const tela = (o, k) => o.traverse(m => { if(m.isMesh){ m.material.emissiveIntensity = .9*k; m.material.color.setScalar(.12 + .88*k); } });
const LED = ['#3fe07a', '#3fe07a', '#ffb02e', '#3fe07a'];

/* ---------- 71. servidor_rack ---------- */
LIB.registrar({id:'servidor_rack', nome:'Rack de servidores', lote:8, categoria:'tecnologia',
  descricao:'rack de servidores em pé (frente +z) com 6 unidades e luzes; piscam trabalhando, esquentam e caem (pane)',
  params:{},
  animacoes:{trabalhar:{desc:'as luzes piscam (contínuo)', loop:true, dur:3, aplicar(p, t){ for(let i = 0; i < 6; i++) brilha(p['unidade_'+i], '#3fe07a', Math.sin(t*(6 + i*1.7) + i) > 0 ? 1.8 : .2); }},
             superaquecer:{desc:'esquenta: unidades ficam vermelhas e piscam', dur:2.5, aplicar(p, t){ const k = suave(t/2); for(let i = 0; i < 6; i++){ tinge(p['unidade_'+i], '#ff3b1f', k*.8); brilha(p['unidade_'+i], '#ff3b1f', (Math.sin(t*14 + i) > 0 ? 1.8 : .3)*k); } }},
             pane:{desc:'todas as luzes apagam de uma vez', dur:.6, aplicar(p, t){ for(let i = 0; i < 6; i++) brilha(p['unidade_'+i], '#ff3b1f', t < .15 ? 2 : 0); }}},
  criar(P){
    const g = grupo(), mm = mat('#2b3038', {tex:'metal', m:.4, rough:.5}), mu = mat('#4a525d', {tex:'metal', m:.3, rough:.45});
    caixa(.9, .06, .8, mm, {pai:g, pos:[0, .03, 0]}); caixa(.9, .06, .8, mm, {pai:g, pos:[0, 2.0, 0]}); [-1, 1].forEach(a => [-1, 1].forEach(b => caixa(.06, 2, .06, mm, {pai:g, pos:[a*.42, 1.0, b*.37]})));
    for(let i = 0; i < 6; i++){ const u = grupo({pai:g, nome:'unidade_'+i, pos:[0, .25 + i*.29, .05]}); caixa(.76, .24, .66, mu, {pai:u}); caixa(.5, .1, .02, mat('#1d2127'), {pai:u, pos:[-.1, 0, .34]}); for(let k = 0; k < 3; k++) esfera(.025, mat('#3fe07a', {brilho:.1, rough:.3}), {pai:u, pos:[.22 + k*.06, 0, .34], det:0}); }
    return {obj:g, dim:[.9, 2.06, .8], ancoras:{topo:[0, 2.06, 0], frente:[0, 1, .45]}};
  }});

/* ---------- 72. roteador_wifi ---------- */
LIB.registrar({id:'roteador_wifi', nome:'Roteador Wi-Fi', lote:8, categoria:'tecnologia',
  descricao:'roteador com 3 antenas e luzes; emite ondas de sinal em arcos que se expandem',
  params:{cor:{padrao:'#e8ebef'}},
  animacoes:{transmitir:{desc:'ondas de sinal saem do roteador (contínuo)', loop:true, dur:3, aplicar(p, t){ p.ondas.children.forEach((o, i) => { const u = (t*.5 + i/3) % 1; o.scale.setScalar(Math.max(.001, .3 + u*2.6)); o.visible = true; }); brilha(p.corpo, '#3fe07a', .15); }},
             piscar:{desc:'as luzes piscam', loop:true, dur:2, aplicar(p, t){ brilha(p.luzes, '#3fe07a', Math.sin(t*12) > 0 ? 2 : .2); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.35}), c = grupo({pai:g, nome:'corpo'}); caixa(.9, .14, .5, mc, {pai:c, pos:[0, .07, 0]});
    [-.35, 0, .35].forEach((x, i) => { const a = grupo({pai:g, nome:'antena_'+i, pos:[x, .14, -.15], rot:[0, 0, (i - 1)*14]}); caixa(.05, .55, .05, mat('#2d333b'), {pai:a, pos:[0, .27, 0]}); });
    const l = grupo({pai:g, nome:'luzes'}); for(let i = 0; i < 4; i++) esfera(.025, mat(LED[i], {brilho:.8, rough:.3}), {pai:l, pos:[-.25 + i*.12, .1, .26], det:0});
    const on = grupo({pai:g, nome:'ondas', pos:[0, .75, 0]}); for(let i = 0; i < 3; i++){ const m = new T3.Mesh(new T3.TorusGeometry(.3, .018, 4, 24, Math.PI), mat('#4aa8ff', {brilho:1, rough:.3})); m.rotation.set(0, 0, 0); m.scale.setScalar(.3 + i*.8); on.add(m); }
    return {obj:g, dim:[1, 1.5, .6], ancoras:{antenas:[0, .7, -.15], topo:[0, 1.1, 0]}};
  }});

/* ---------- 73. notebook ---------- */
LIB.registrar({id:'notebook', nome:'Notebook', lote:8, categoria:'tecnologia',
  descricao:'notebook sobre a mesa (frente +z); abre a tampa, liga a tela e fecha',
  params:{cor:{padrao:'#9aa3ad'}, cor_tela:{padrao:'#4ddc9a'}},
  animacoes:{abrir:{desc:'a tampa abre e a tela acende', dur:1.4, aplicar(p, t){ const k = suave(t/1); gx(p.tampa, rad(-100)*(1 - k)); tela(p.tampa, suave((t - .8)/.5)*k); }},
             fechar:{desc:'a tampa fecha', dur:1, aplicar(p, t){ const k = suave(t/1); gx(p.tampa, rad(-100)*k); tela(p.tampa, 1 - suave(t/.3)); }},
             digitar:{desc:'as teclas piscam como se digitando (contínuo)', loop:true, dur:3, aplicar(p, t){ p.teclas.children.forEach((k, i) => { pos(k, 0, -.012*(Math.sin(t*14 + i*2.3) > .75 ? 1 : 0), 0); }); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.5, metal:.5, rough:.4}), mk = mat('#2d333b'); caixa(1.1, .06, .75, mc, {pai:g, pos:[0, .03, 0]}); caixa(.5, .01, .3, mat('#b9bec6'), {pai:g, pos:[0, .062, .22]});
    const te = grupo({pai:g, nome:'teclas'}); for(let i = 0; i < 5; i++) for(let j = 0; j < 12; j++) caixa(.065, .02, .06, mk, {pai:te, pos:[-.4 + j*.073, .07, -.28 + i*.07]});
    const ta = grupo({pai:g, nome:'tampa', pos:[0, .06, -.37], rot:[-100, 0, 0]}); caixa(1.1, .04, .75, mc, {pai:ta, pos:[0, 0, .375]}); caixa(1.0, .01, .65, telaMat(P.cor_tela), {pai:ta, pos:[0, .026, .375]});
    return {obj:g, dim:[1.1, .8, 1], ancoras:{tela:[0, .45, -.2]}};
  }});

/* ---------- 74. hd_disco ---------- */
LIB.registrar({id:'hd_disco', nome:'HD (disco rígido aberto)', lote:8, categoria:'tecnologia',
  descricao:'disco rígido aberto, deitado, mostrando o disco giratório e o braço de leitura',
  params:{},
  animacoes:{girar:{desc:'o disco gira e o braço lê (contínuo)', loop:true, dur:4, aplicar(p, t){ gy(p.disco, t*9); gy(p.braco, .25*Math.sin(t*1.7)); }},
             ler:{desc:'o braço varre o disco', dur:2, aplicar(p, t){ gy(p.disco, t*9); gy(p.braco, .5*Math.sin(t*3)*suave(t/.3)); }}},
  criar(P){
    const g = grupo(), mm = mat('#59616c', {tex:'metal', m:.4, rough:.45}); caixa(1.1, .12, .8, mm, {pai:g, pos:[0, .06, 0]}); caixa(1.0, .02, .7, mat('#2d333b'), {pai:g, pos:[0, .13, 0]});
    const d = grupo({pai:g, nome:'disco', pos:[-.1, .17, 0]}); cil(.3, .02, mat('#c9ced6', {tex:'metal', m:.3, metal:.8, rough:.25}), {pai:d, lados:24}); cil(.07, .04, mat('#2d333b'), {pai:d, lados:12}); cil(.2, .021, mat('#9aa3ad', {tex:'metal'}), {pai:d, lados:24, esc:[1, 1, 1]});
    const b = grupo({pai:g, nome:'braco', pos:[.4, .17, .25]}); caixa(.6, .02, .04, mat('#b9bec6', {tex:'metal'}), {pai:b, pos:[-.28, 0, -.1], rot:[0, 25, 0]}); cil(.04, .05, mat('#2d333b'), {pai:b, lados:8});
    return {obj:g, dim:[1.1, .2, .8], ancoras:{disco:[-.1, .2, 0]}};
  }});

/* ---------- 75. chip_cpu ---------- */
LIB.registrar({id:'chip_cpu', nome:'Chip / processador', lote:8, categoria:'tecnologia',
  descricao:'processador quadrado deitado com pinos dourados e núcleo central; processa (pulsa) ou esquenta',
  params:{cor:{padrao:'#2f6f4f'}},
  animacoes:{processar:{desc:'o núcleo pulsa em azul (contínuo)', loop:true, dur:2, aplicar(p, t){ brilha(p.nucleo, '#4aa8ff', 1 + .9*Math.sin(t*8)); }},
             esquentar:{desc:'o núcleo vai de azul a vermelho incandescente', dur:2.4, aplicar(p, t){ const k = suave(t/2.2); tinge(p.nucleo, '#ff3b1f', k); brilha(p.nucleo, '#ff5a2a', 2*k); treme(p.chip, t, .006*k); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'chip'}), mb = mat(P.cor, {rough:.5}), mo = mat('#d9b04a', {tex:'metal', m:.2, metal:.8, rough:.35});
    caixa(1.0, .1, 1.0, mb, {pai:c, pos:[0, .05, 0]}); caixa(.6, .06, .6, mat('#b9bec6', {tex:'metal', m:.3, rough:.3}), {pai:c, pos:[0, .13, 0]});
    for(let i = 0; i < 9; i++){ const o = -.4 + i*.1; [[o, .5], [o, -.5], [.5, o], [-.5, o]].forEach(([x, z]) => caixa(.04, .06, .04, mo, {pai:c, pos:[x, .0, z]})); }
    caixa(.28, .05, .28, mat('#4aa8ff', {brilho:.4, rough:.3}), {pai:c, nome:'nucleo', pos:[0, .19, 0]});
    return {obj:g, dim:[1.1, .3, 1.1], ancoras:{nucleo:[0, .22, 0]}};
  }});

/* ---------- 76. antena_torre ---------- */
LIB.registrar({id:'antena_torre', nome:'Torre de antena', lote:8, categoria:'tecnologia',
  descricao:'torre de telecomunicação treliçada com antenas e luz vermelha no topo; transmite ondas',
  params:{altura:{padrao:4}},
  animacoes:{transmitir:{desc:'ondas saem do topo (contínuo)', loop:true, dur:3, aplicar(p, t){ p.ondas.children.forEach((o, i) => { const u = (t*.5 + i/3) % 1; o.scale.setScalar(Math.max(.001, .2 + u*2)); }); brilha(p.luz, '#ff3b30', Math.sin(t*6) > 0 ? 2 : .2); }},
             balancar:{desc:'o vento balança a torre', loop:true, dur:3, aplicar(p, t, a){ gz(p.torre, .02*(a.intensidade || 1)*Math.sin(t*2)); }}},
  criar(P){
    const g = grupo(), H = P.altura, c = grupo({pai:g, nome:'torre'}), mm = mat('#c9ced6', {tex:'metal', m:.4, rough:.5});
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => caixa(.06, H, .06, mm, {pai:c, pos:[a*.3*(1), H/2, b*.3], rot:[b*-3.2, 0, a*3.2]})); for(let i = 0; i < Math.round(H/.45); i++){ const y = .3 + i*.45, w = .6*(1 - y/H*.5); [-1, 1].forEach(s => { caixa(w, .03, .03, mm, {pai:c, pos:[0, y, s*w/2]}); caixa(.03, .03, w, mm, {pai:c, pos:[s*w/2, y, 0]}); caixa(w*1.2, .03, .03, mm, {pai:c, pos:[0, y + .22, s*w/2], rot:[0, 0, 35*s]}); }); }
    [0, 120, 240].forEach(a => caixa(.12, .45, .05, mat('#f4f6f8'), {pai:c, pos:[Math.cos(rad(a))*.28, H - .4, Math.sin(rad(a))*.28], rot:[0, -a, 0]}));
    cil(.03, .4, mm, {pai:c, pos:[0, H + .2, 0], lados:6}); esfera(.07, mat('#ff3b30', {brilho:.5}), {pai:c, nome:'luz', pos:[0, H + .42, 0], det:1});
    const on = grupo({pai:g, nome:'ondas', pos:[0, H + .3, 0]}); for(let i = 0; i < 3; i++){ const m = new T3.Mesh(new T3.TorusGeometry(.3, .015, 4, 24), mat('#4aa8ff', {brilho:1})); m.rotation.x = Math.PI/2; m.scale.setScalar(.2 + i*.7); on.add(m); }
    return {obj:g, dim:[1.5, H + .8, 1.5], ancoras:{topo:[0, H + .5, 0]}};
  }});

/* ---------- 77. camera_seguranca ---------- */
LIB.registrar({id:'camera_seguranca', nome:'Câmera de segurança', lote:8, categoria:'tecnologia',
  descricao:'câmera de segurança presa num suporte de parede (lente para +x); varre de um lado para o outro e acende a luz de gravação',
  params:{},
  animacoes:{varrer:{desc:'gira devagar de um lado para o outro (contínuo)', loop:true, dur:6, aplicar(p, t){ gy(p.cabeca, Math.sin(t*.8)*.7); brilha(p.led, '#ff3b30', Math.sin(t*5) > 0 ? 2 : .2); }},
             gravar:{desc:'o led vermelho pisca', loop:true, dur:2, aplicar(p, t){ brilha(p.led, '#ff3b30', Math.sin(t*6) > 0 ? 2.2 : .1); }}},
  criar(P){
    const g = grupo(), mm = mat('#d9dde2', {rough:.4}), md = mat('#2d333b');
    caixa(.1, .6, .5, mat('#7f8891', {tex:'concreto', m:.5}), {pai:g, pos:[-.5, .3, 0]}); cil(.04, .5, md, {pai:g, pos:[-.25, .6, 0], rot:[0, 0, 90], lados:6});
    const c = grupo({pai:g, nome:'cabeca', pos:[0, .6, 0]}); cil(.12, .6, mm, {pai:c, pos:[.15, 0, 0], rot:[0, 0, 90], lados:10}); cil(.14, .08, md, {pai:c, pos:[.48, 0, 0], rot:[0, 0, 90], lados:10}); cil(.08, .04, mat('#1d4a7a', {rough:.1}), {pai:c, pos:[.52, 0, 0], rot:[0, 0, 90], lados:10}); caixa(.5, .02, .26, mm, {pai:c, pos:[.2, .13, 0]});
    esfera(.03, mat('#ff3b30', {brilho:.3}), {pai:c, nome:'led', pos:[.3, .13, .1], det:0});
    return {obj:g, dim:[1.1, .9, .6], ancoras:{lente:[.55, .6, 0]}};
  }});

/* ---------- 78. drone ---------- */
LIB.registrar({id:'drone', nome:'Drone', lote:8, categoria:'tecnologia',
  descricao:'drone de 4 hélices com câmera embaixo (origem no chão); paira, voa e cai',
  params:{cor:{padrao:'#2d333b'}},
  animacoes:{pairar:{desc:'as hélices giram e ele paira balançando (contínuo)', loop:true, dur:3, aplicar(p, t){ for(let i = 0; i < 4; i++) gy(p['helice_'+i], t*40*(i%2 ? -1 : 1)); pos(p.corpo, 0, .5 + .06*Math.sin(t*2), 0); gz(p.corpo, .03*Math.sin(t*1.7)); }},
             cair:{desc:'as hélices param e ele despenca girando', dur:1.4, aplicar(p, t){ const k = t*t; pos(p.corpo, 0, .5 - Math.min(.45, k*.5), 0); gz(p.corpo, .9*Math.min(1, t)); gx(p.corpo, .5*Math.min(1, t)); for(let i = 0; i < 4; i++) gy(p['helice_'+i], t*20*Math.max(0, 1 - t)); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo', pos:[0, .0, 0]}), mc = mat(P.cor, {rough:.4}), mw = mat('#e8ebef');
    caixa(.5, .14, .5, mc, {pai:c, pos:[0, .25, 0]}); esfera(.09, mat('#1d2630', {rough:.2}), {pai:c, pos:[.22, .15, 0], det:1}); caixa(.04, .04, .04, mat('#ff3b30', {brilho:.8}), {pai:c, pos:[-.25, .3, 0]});
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b], i) => { caixa(.55, .04, .06, mc, {pai:c, pos:[a*.3, .27, b*.3], rot:[0, a*b*-45 + (a < 0 ? 180 : 0)*0, 0]}); cil(.04, .1, mc, {pai:c, pos:[a*.5, .3, b*.5], lados:6}); const h = grupo({pai:c, nome:'helice_'+i, pos:[a*.5, .37, b*.5]}); caixa(.55, .012, .06, mw, {pai:h}); caixa(.06, .012, .55, mw, {pai:h}); });
    return {obj:g, dim:[1.5, .6, 1.5], ancoras:{camera:[.22, .15, 0], topo:[0, .5, 0]}};
  }});

/* ---------- 79. teclado ---------- */
LIB.registrar({id:'teclado', nome:'Teclado', lote:8, categoria:'tecnologia',
  descricao:'teclado de computador sobre a mesa (frente +z); as teclas afundam em sequência como se digitasse',
  params:{cor:{padrao:'#e8ebef'}},
  animacoes:{digitar:{desc:'teclas afundam em sequência (contínuo)', loop:true, dur:3, aplicar(p, t){ p.teclas.children.forEach((k, i) => { const on = Math.sin(t*13 + i*1.9) > .78; pos(k, 0, on ? -.018 : 0, 0); if(on) tinge(k, '#4aa8ff', .8); }); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.45}); caixa(1.3, .07, .45, mat('#59616c'), {pai:g, pos:[0, .035, 0]});
    const te = grupo({pai:g, nome:'teclas'}); for(let i = 0; i < 4; i++) for(let j = 0; j < 14; j++) caixa(.08, .04, .08, mc, {pai:te, pos:[-.6 + j*.092, .09, -.15 + i*.1]}); caixa(.55, .04, .08, mc, {pai:te, pos:[0, .09, .25]});
    return {obj:g, dim:[1.3, .15, .5], ancoras:{teclas:[0, .12, 0]}};
  }});

/* ---------- 80. banco_dados ---------- */
LIB.registrar({id:'banco_dados', nome:'Banco de dados (ícone 3D)', lote:8, categoria:'tecnologia',
  descricao:'pilha de 3 discos azuis (ícone de banco de dados); acende camada por camada ao gravar e treme se corrompe',
  params:{cor:{padrao:'#3b82c4'}},
  animacoes:{gravar:{desc:'as camadas acendem de baixo para cima (contínuo)', loop:true, dur:3, aplicar(p, t){ for(let i = 0; i < 3; i++) brilha(p['camada_'+i], '#8fd0ff', Math.max(0, Math.sin((t*2.2 - i*.8)*Math.PI/1.2))*1.6); }},
             corromper:{desc:'fica vermelho e treme', dur:1.8, aplicar(p, t){ const k = suave(t/1); for(let i = 0; i < 3; i++){ tinge(p['camada_'+i], '#e5565b', k); treme(p['camada_'+i], t, .02*Math.max(0, 1 - t/1.6)); } }}},
  criar(P){
    const g = grupo(), m = mat(P.cor, {rough:.35, metal:.2});
    for(let i = 0; i < 3; i++){ const c = grupo({pai:g, nome:'camada_'+i, pos:[0, .22 + i*.5, 0]}); cil(.6, .4, m, {pai:c, lados:20}); cil(.605, .04, mat(tom(P.cor, .12), {rough:.3}), {pai:c, pos:[0, .2, 0], lados:20}); cil(.605, .02, mat('#e8f4ff'), {pai:c, pos:[0, -.05, 0], lados:20}); }
    return {obj:g, dim:[1.2, 1.6, 1.2], ancoras:{topo:[0, 1.45, 0]}};
  }});
})();
