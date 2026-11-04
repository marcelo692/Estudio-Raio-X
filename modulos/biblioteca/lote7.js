/* =========================================================
   BIBLIOTECA · LOTE 7 (construção): 10 objetos
   pilha_tijolos, betoneira, escavadeira, guindaste, andaime, viga_aco, malha_vergalhao, trelica_telhado, carrinho_mao, capacete
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H, {RP, gx, gy, gz, tinge, brilha, treme, pos} = LIB.U;

/* ---------- 61. pilha_tijolos ---------- */
LIB.registrar({id:'pilha_tijolos', nome:'Parede de tijolos', lote:7, categoria:'construção',
  descricao:'trecho de parede de tijolos assentados em fiadas (cada fiada é uma parte: fiada_0, fiada_1...); constrói fiada por fiada ou desmorona',
  params:{fiadas:{padrao:6}, largura:{padrao:2}, cor:{padrao:'#b8553a'}},
  animacoes:{construir:{desc:'as fiadas descem e se assentam, uma a uma, de baixo para cima', dur:3, aplicar(p, t, a){ const n = Object.keys(p).filter(k => k.startsWith('fiada_')).length; for(let i = 0; i < n; i++){ const u = prog(t, i*.4*3/n, i*.4*3/n + .5); p['fiada_'+i].visible = u > 0; pos(p['fiada_'+i], 0, (1 - saida(u))*1.2, 0); } }},
             desmoronar:{desc:'a parede desmorona: fiadas de cima tombam primeiro', dur:2.2, aplicar(p, t){ const n = Object.keys(p).filter(k => k.startsWith('fiada_')).length; for(let i = 0; i < n; i++){ const u = prog(t, (n - 1 - i)*.15, (n - 1 - i)*.15 + .9), o = p['fiada_'+i]; pos(o, (i%2 ? 1 : -1)*u*.5*(i + 1)*.4, -u*u*(i*.18 + .1), u*.4*(i%3 - 1)); gz(o, (i%2 ? -1 : 1)*u*.6); gx(o, u*.4*(i%3 - 1)); } }},
             tremer:{desc:'treme', dur:1.2, aplicar(p, t){ const n = Object.keys(p).filter(k => k.startsWith('fiada_')).length; for(let i = 0; i < n; i++) treme(p['fiada_'+i], t, .012*Math.max(0, 1 - t/1.2)); }}},
  criar(P){
    const g = grupo(), n = Math.max(1, Math.round(P.fiadas)), W = P.largura, m = mat(P.cor, {tex:'tijolo', m:.5, rough:.9}), bh = .12, e = .14;
    for(let i = 0; i < n; i++){ const f = grupo({pai:g, nome:'fiada_'+i, pos:[0, bh*i + bh/2, 0]}); caixa(W, bh - .006, e, m, {pai:f, pos:[(i%2 ? .06 : -.06), 0, 0]}); }
    return {obj:g, dim:[W, n*bh, e], ancoras:{topo:[0, n*bh, 0], base:[0, 0, 0]}};
  }});

/* ---------- 62. betoneira ---------- */
LIB.registrar({id:'betoneira', nome:'Betoneira', lote:7, categoria:'construção',
  descricao:'betoneira de obra com tambor inclinado e rodas (boca do tambor para +x); gira misturando e despeja',
  params:{cor:{padrao:'#e07a1f'}},
  animacoes:{misturar:{desc:'o tambor gira (contínuo)', loop:true, dur:3, aplicar(p, t, a){ gy(p.tambor, t*(a.velocidade != null ? a.velocidade : 1)*2.2); }},
             despejar:{desc:'inclina o tambor e despeja o concreto', dur:2, aplicar(p, t){ gz(p.inclinacao, -rad(40)*suave(t/1.2)); gy(p.tambor, t*1.5); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.5, rough:.5}), mm = mat('#4b525c', {tex:'metal', m:.4}), mp = mat('#1f2226');
    caixa(1.1, .08, .6, mm, {pai:g, pos:[0, .5, 0]}); [-.45, .45].forEach(z => { cil(.035, .5, mm, {pai:g, pos:[0, .27, z], lados:6}); }); [[-.4, .3], [.4, .3]].forEach(([x]) => [-.34, .34].forEach(z => { const w = grupo({pai:g, pos:[x, .22, z]}); cil(.22, .1, mp, {pai:w, rot:[90, 0, 0], lados:12}); }));
    const inc = grupo({pai:g, nome:'inclinacao', pos:[0, .95, 0], rot:[0, 0, -32]}), tb = grupo({pai:inc, nome:'tambor'});
    cil(.5, .55, mc, {pai:tb, pos:[0, -.0, 0], lados:14}); cone(.5, .5, mc, {pai:tb, pos:[0, .52, 0], lados:14, esc:[1, 1, 1]}); cil(.3, .06, mat('#2d333b'), {pai:tb, pos:[0, .82, 0], lados:12}); cone(.5, .45, mc, {pai:tb, pos:[0, -.5, 0], lados:14, rot:[180, 0, 0]});
    for(let i = 0; i < 6; i++) caixa(.03, .1, .02, mat('#cfd5db'), {pai:tb, pos:[Math.cos(i*1.047)*.5, .1, Math.sin(i*1.047)*.5], rot:[0, -i*60, 0]});
    cil(.14, .3, mm, {pai:g, pos:[.2, .7, 0], lados:8}); cil(.08, .16, mp, {pai:g, pos:[-.5, .58, 0], rot:[0, 0, 90], lados:8});
    return {obj:g, dim:[1.5, 1.8, 1], ancoras:{boca:[.55, 1.6, 0], tambor:[0, .95, 0]}};
  }});

/* ---------- 63. escavadeira ---------- */
LIB.registrar({id:'escavadeira', nome:'Escavadeira', lote:7, categoria:'construção',
  descricao:'escavadeira de esteiras com cabine e braço articulado (braço para +x); escava em ciclo ou gira a torre',
  params:{cor:{padrao:'#f2b705'}},
  animacoes:{escavar:{desc:'ciclo de escavar: desce o braço, fecha a caçamba e levanta (contínuo)', loop:true, dur:4, aplicar(p, t){ const c = (t % 4)/4, u = Math.sin(c*Math.PI*2); gz(p.braco, -.35*u); gz(p.antebraco, .6*(.5 + .5*Math.sin(c*Math.PI*2 - 1))); gz(p.cacamba, .9*Math.max(0, Math.sin(c*Math.PI*2 + 1))); }},
             girar_torre:{desc:'a torre gira para despejar; args.angulo em graus (padrão 90)', dur:2, aplicar(p, t, a){ gy(p.torre, rad(a.angulo != null ? a.angulo : 90)*suave(t/2)); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.45}), mt = mat('#2a2d31', {tex:'metal', m:.3}), mm = mat('#59616c', {tex:'metal', m:.4});
    [-.45, .45].forEach(z => { caixa(1.8, .3, .32, mt, {pai:g, pos:[0, .17, z]}); for(let i = 0; i < 7; i++) caixa(.12, .06, .34, mm, {pai:g, pos:[-.75 + i*.25, .03, z]}); cil(.2, .34, mm, {pai:g, pos:[-.75, .17, z], rot:[90, 0, 0], lados:10}); cil(.2, .34, mm, {pai:g, pos:[.75, .17, z], rot:[90, 0, 0], lados:10}); });
    caixa(1.4, .15, .7, mt, {pai:g, pos:[0, .42, 0]});
    const to = grupo({pai:g, nome:'torre', pos:[0, .5, 0]}); caixa(1.3, .45, .9, mc, {pai:to, pos:[-.15, .22, 0]}); caixa(.6, .6, .7, mc, {pai:to, pos:[.2, .75, -.1]}); caixa(.52, .38, .72, mat('#9fd4ee', {vidro:.55}), {pai:to, pos:[.22, .8, -.1]}); caixa(.55, .3, .85, mat('#2d333b'), {pai:to, pos:[-.65, .5, 0]});
    const br = grupo({pai:to, nome:'braco', pos:[.6, .35, .3]}); caixa(1.3, .14, .14, mc, {pai:br, pos:[.55, .1, 0], rot:[0, 0, 30]}); 
    const ab = grupo({pai:br, nome:'antebraco', pos:[1.1, .55, 0]}); caixa(.95, .12, .12, mc, {pai:ab, pos:[.4, -.2, 0], rot:[0, 0, -50]});
    const ca = grupo({pai:ab, nome:'cacamba', pos:[.72, -.62, 0]}); caixa(.32, .24, .4, mm, {pai:ca, pos:[.08, -.1, 0]}); for(let i = -1; i <= 1; i++) cone(.04, .12, mat('#cfd5db'), {pai:ca, pos:[.26, -.2, i*.14], rot:[0, 0, 90], lados:4});
    return {obj:g, dim:[3, 2, 1.4], ancoras:{cacamba:[1.7, .4, .3], cabine:[.2, 1.4, -.1]}};
  }});

/* ---------- 64. guindaste ---------- */
LIB.registrar({id:'guindaste', nome:'Guindaste de obra', lote:7, categoria:'construção',
  descricao:'guindaste de torre com lança, contrapeso, cabo, gancho e uma carga (viga); gira a lança e sobe/desce a carga',
  params:{altura:{padrao:5}},
  animacoes:{girar_lanca:{desc:'a lança gira; args.angulo graus (padrão 80)', dur:3, aplicar(p, t, a){ gy(p.lanca, rad(a.angulo != null ? a.angulo : 80)*suave(t/3)); }},
             subir_carga:{desc:'o cabo recolhe e a carga sobe; args.dist m (padrão 1.5)', dur:2, aplicar(p, t, a){ const d = (a.dist != null ? a.dist : 1.5)*suave(t/2); carga(p, d); }},
             descer_carga:{desc:'a carga desce', dur:2, aplicar(p, t, a){ carga(p, (a.dist != null ? a.dist : 1.5)*(1 - suave(t/2))); }}},
  criar(P){
    const g = grupo(), H = P.altura, mc = mat('#f2b705', {rough:.5}), mm = mat('#59616c', {tex:'metal', m:.4}), mcn = mat('#2d333b');
    caixa(1.0, .2, 1.0, mat('#7f8891', {tex:'concreto', m:.6}), {pai:g, pos:[0, .1, 0]});
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => caixa(.07, H, .07, mc, {pai:g, pos:[a*.28, H/2 + .2, b*.28]})); for(let i = 0; i < Math.round(H/.5); i++){ caixa(.6, .04, .04, mc, {pai:g, pos:[0, .45 + i*.5, .28]}); caixa(.6, .04, .04, mc, {pai:g, pos:[0, .45 + i*.5, -.28]}); caixa(.04, .04, .6, mc, {pai:g, pos:[.28, .45 + i*.5, 0]}); caixa(.04, .04, .6, mc, {pai:g, pos:[-.28, .45 + i*.5, 0]}); }
    const l = grupo({pai:g, nome:'lanca', pos:[0, H + .2, 0]}); caixa(.5, .5, .5, mm, {pai:l, pos:[0, .25, 0]}); caixa(.5, .5, .5, mat('#9fd4ee', {vidro:.5}), {pai:l, pos:[.0, .1, .5]}); caixa(3.4, .12, .12, mc, {pai:l, pos:[1.1, .35, 0]}); caixa(3.4, .12, .12, mc, {pai:l, pos:[1.1, .55, 0]}); for(let i = 0; i < 9; i++) caixa(.05, .26, .05, mc, {pai:l, pos:[-.5 + i*.38, .45, 0], rot:[0, 0, (i%2 ? 25 : -25)]});
    caixa(.6, .5, .5, mat('#6b7078', {tex:'concreto'}), {pai:l, pos:[-.85, .35, 0]}); cone(.09, .35, mc, {pai:l, pos:[0, .95, 0], lados:4});
    const tr = grupo({pai:l, nome:'trolley', pos:[2.2, .3, 0]}); caixa(.22, .1, .3, mcn, {pai:tr});
    const cb = cil(.012, 1.5, mcn, {pai:l, nome:'cabo', pos:[2.2, .3 - .75, 0], lados:4}); cb.userData.L = 1.5;
    const gc = grupo({pai:l, nome:'gancho', pos:[2.2, .3 - 1.5, 0]}); caixa(.12, .12, .12, mcn, {pai:gc}); const vg = caixa(.9, .1, .12, mat('#b9bec6', {tex:'metal', m:.3}), {pai:gc, nome:'carga', pos:[0, -.45, 0]}); [-.3, .3].forEach(x => cil(.008, .35, mcn, {pai:gc, pos:[x*.7, -.2, 0], rot:[0, 0, x*40], lados:3}));
    return {obj:g, dim:[4.5, H + 1.2, 1], ancoras:{gancho:[2.2, H + .2 + .3 - 1.5, 0], topo:[0, H + 1, 0]}};
  }});
function carga(p, d){ const cb = p.cabo, L = cb.userData.L; cb.scale.y = (L - d)/L; cb.position.y = RP(cb).p.y + d/2; p.gancho.position.y = RP(p.gancho).p.y + d; }

/* ---------- 65. andaime ---------- */
LIB.registrar({id:'andaime', nome:'Andaime', lote:7, categoria:'construção',
  descricao:'andaime metálico de vários andares com tábuas; treme ou desaba',
  params:{andares:{padrao:3}},
  animacoes:{tremer:{desc:'treme', dur:1.4, aplicar(p, t){ treme(p.estrutura, t, .02*Math.max(0, 1 - t/1.4)); }},
             desabar:{desc:'tomba para o lado e cai', dur:2.2, aplicar(p, t){ const k = suave(t/1.6); gz(p.estrutura, -rad(75)*k*k); pos(p.estrutura, k*.6, -.1*k, 0); }}},
  criar(P){
    const g = grupo(), n = Math.max(1, Math.round(P.andares)), h = .9, c = grupo({pai:g, nome:'estrutura'}), mm = mat('#9aa3ad', {tex:'metal', m:.4}), mt = mat('#c89a5e', {tex:'madeira', m:.5});
    for(let j = 0; j < n; j++){ [-1, 1].forEach(a => [-1, 1].forEach(b => cil(.025, h, mm, {pai:c, pos:[a*.5, h*j + h/2, b*.3], lados:6}))); [-1, 1].forEach(b => { caixa(1.0, .03, .03, mm, {pai:c, pos:[0, h*j + h*.5, b*.3], rot:[0, 0, 0]}); caixa(1.12, .03, .03, mm, {pai:c, pos:[0, h*j + h*.5, b*.3], rot:[0, 0, 38]}); }); caixa(1.2, .05, .7, mt, {pai:c, pos:[0, h*(j + 1), 0]}); }
    return {obj:g, dim:[1.2, n*h + .1, .7], ancoras:{topo:[0, n*h, 0]}};
  }});

/* ---------- 66. viga_aco ---------- */
LIB.registrar({id:'viga_aco', nome:'Viga de aço (perfil I)', lote:7, categoria:'construção',
  descricao:'viga de aço em perfil I deitada ao longo de x; é içada, gira e pousa; também verga com peso',
  params:{comprimento:{padrao:2.4}, cor:{padrao:'#8a96a3'}},
  animacoes:{levantar:{desc:'sobe pendurada por cabos e fica inclinada; args.alt m (padrão 1.5)', dur:2, aplicar(p, t, a){ const k = suave(t/2); pos(p.viga, 0, (a.alt != null ? a.alt : 1.5)*k, 0); gz(p.viga, .08*k*Math.sin(t*3)); }},
             vergar:{desc:'verga no meio com o peso', dur:1.6, aplicar(p, t){ const k = suave(t/1.2); p.viga.scale.y = 1; gz(p.viga, 0); pos(p.viga, 0, -.05*k, 0); tinge(p.viga, '#c0392b', .35*k); }}},
  criar(P){
    const g = grupo(), L = P.comprimento, m = mat(P.cor, {tex:'metal', m:.5, metal:.5, rough:.45}), v = grupo({pai:g, nome:'viga', pos:[0, .17, 0]});
    caixa(L, .05, .22, m, {pai:v, pos:[0, .12, 0]}); caixa(L, .05, .22, m, {pai:v, pos:[0, -.12, 0]}); caixa(L, .24, .04, m, {pai:v});
    return {obj:g, dim:[L, .35, .3], ancoras:{centro:[0, .17, 0], ponta:[L/2, .17, 0]}};
  }});

/* ---------- 67. malha_vergalhao ---------- */
LIB.registrar({id:'malha_vergalhao', nome:'Malha de vergalhão', lote:7, categoria:'construção',
  descricao:'armação de vergalhões em grade (duas camadas) sobre calços, com laje de concreto que enche por cima',
  params:{largura:{padrao:2}, profundidade:{padrao:1.4}, cor:{padrao:'#7a4a2b'}},
  animacoes:{concretar:{desc:'o concreto sobe e cobre a armação', dur:2.5, aplicar(p, t){ const k = suave(t/2.5); p.concreto.scale.y = Math.max(.001, k); p.concreto.position.y = .11*Math.max(.001, k); }},
             tremer:{desc:'treme', dur:1, aplicar(p, t){ treme(p.malha, t, .01*Math.max(0, 1 - t)); }}},
  criar(P){
    const g = grupo(), W = P.largura, D = P.profundidade, mv = mat(P.cor, {tex:'metal', m:.3, rough:.55}), c = grupo({pai:g, nome:'malha'});
    for(let i = 0; i <= Math.round(W/.2); i++) cil(.012, D, mv, {pai:c, pos:[-W/2 + i*.2, .1, 0], rot:[90, 0, 0], lados:5}); for(let j = 0; j <= Math.round(D/.2); j++) cil(.012, W, mv, {pai:c, pos:[0, .124, -D/2 + j*.2], rot:[0, 0, 90], lados:5});
    for(let i = 0; i < 4; i++) caixa(.06, .08, .06, mat('#9aa3ad', {tex:'concreto'}), {pai:c, pos:[(i%2 ? 1 : -1)*(W/2 - .2), .04, (i < 2 ? 1 : -1)*(D/2 - .2)]});
    const co = caixa(W + .04, .22, D + .04, mat('#9c9fa4', {tex:'concreto', m:.5}), {pai:g, nome:'concreto', pos:[0, .11, 0]}); co.scale.y = .001; co.position.y = .001; 
    return {obj:g, dim:[W, .3, D], ancoras:{topo:[0, .22, 0]}};
  }});

/* ---------- 68. trelica_telhado ---------- */
LIB.registrar({id:'trelica_telhado', nome:'Estrutura de telhado', lote:7, categoria:'construção',
  descricao:'três tesouras de madeira do telhado com terças; as tesouras descem uma a uma ou o telhado voa',
  params:{largura:{padrao:3}, altura:{padrao:1.2}},
  animacoes:{montar:{desc:'as tesouras descem e se encaixam, uma a uma', dur:2.4, aplicar(p, t){ for(let i = 0; i < 3; i++){ const u = prog(t, i*.5, i*.5 + .8), o = p['tesoura_'+i]; o.visible = u > 0; pos(o, 0, (1 - saida(u))*1.5, 0); } }},
             voar:{desc:'o vento arranca e levanta a estrutura', dur:2.2, aplicar(p, t){ const k = suave(t/2); for(let i = 0; i < 3; i++){ const o = p['tesoura_'+i]; pos(o, k*(i - 1)*.6, k*k*2.2, k*.5); gz(o, k*(i + 1)*.35); gx(o, k*.4); } }}},
  criar(P){
    const g = grupo(), W = P.largura, h = P.altura, m = mat('#c89a5e', {tex:'madeira', m:.5}), ang = Math.atan2(h, W/2)*57.3, Lr = Math.hypot(W/2, h);
    for(let i = 0; i < 3; i++){ const t = grupo({pai:g, nome:'tesoura_'+i, pos:[0, 0, (i - 1)*.8]}); caixa(W, .08, .08, m, {pai:t, pos:[0, .04, 0]}); caixa(Lr, .08, .08, m, {pai:t, pos:[-W/4, h/2 + .04, 0], rot:[0, 0, ang]}); caixa(Lr, .08, .08, m, {pai:t, pos:[W/4, h/2 + .04, 0], rot:[0, 0, -ang]}); caixa(.06, h, .06, m, {pai:t, pos:[0, h/2, 0]}); caixa(Lr*.5, .05, .05, m, {pai:t, pos:[-W/6, h/3, 0], rot:[0, 0, -ang*1.8]}); caixa(Lr*.5, .05, .05, m, {pai:t, pos:[W/6, h/3, 0], rot:[0, 0, ang*1.8]}); }
    return {obj:g, dim:[W, h + .1, 1.8], ancoras:{cumeeira:[0, h, 0]}};
  }});

/* ---------- 69. carrinho_mao ---------- */
LIB.registrar({id:'carrinho_mao', nome:'Carrinho de mão', lote:7, categoria:'construção',
  descricao:'carrinho de mão de obra com areia na caçamba (roda para +x); empurra e tomba a carga',
  params:{cor:{padrao:'#2f6fd0'}},
  animacoes:{empurrar:{desc:'a roda gira (contínuo)', loop:true, dur:3, aplicar(p, t, a){ gz(p.roda, -t*3*(a.velocidade != null ? a.velocidade : 1)); pos(p.corpo, 0, .01*Math.sin(t*10), 0); }},
             tombar:{desc:'levanta os cabos e despeja a areia', dur:1.8, aplicar(p, t){ gz(p.corpo, rad(-38)*suave(t/1.2)); p.areia.scale.y = Math.max(.1, 1 - .8*suave((t - .5)/1)); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.5, rough:.5}), mm = mat('#2d333b'), mw = mat('#c89a5e', {tex:'madeira', m:.4}), c = grupo({pai:g, nome:'corpo'});
    caixa(.9, .28, .55, mc, {pai:c, pos:[-.1, .6, 0], rot:[0, 0, 10]}); const ar = esfera(.28, mat('#d9c58c', {tex:'terra', m:.5}), {pai:c, nome:'areia', pos:[-.1, .72, 0], det:1, esc:[1.2, .5, .85]});
    [-.2, .2].forEach(z => { caixa(1.2, .05, .05, mw, {pai:c, pos:[-.4, .5, z], rot:[0, 0, 8]}); caixa(.05, .35, .05, mm, {pai:c, pos:[-.5, .26, z]}); caixa(.4, .05, .05, mm, {pai:c, pos:[.55, .4, z]}); });
    const w = grupo({pai:g, nome:'roda', pos:[.58, .22, 0]}); cil(.22, .1, mat('#1f2226'), {pai:w, rot:[90, 0, 0], lados:12}); cil(.12, .12, mat('#9aa3ad'), {pai:w, rot:[90, 0, 0], lados:8});
    return {obj:g, dim:[1.8, .9, .6], ancoras:{caçamba:[-.1, .75, 0]}};
  }});

/* ---------- 70. capacete ---------- */
LIB.registrar({id:'capacete', nome:'Capacete de obra', lote:7, categoria:'segurança',
  descricao:'capacete amarelo de segurança com aba e faixas; gira, leva um impacto (rachando) ou cai',
  params:{cor:{padrao:'#f2c200'}},
  animacoes:{girar:{desc:'gira devagar (contínuo)', loop:true, dur:5, aplicar(p, t){ gy(p.corpo, t*.8); }},
             impacto:{desc:'recebe um golpe: afunda, treme e marca amassado', dur:1.2, aplicar(p, t){ const k = Math.exp(-5*t); pos(p.corpo, 0, -.05*(1 - k)*0 - .06*Math.sin(Math.min(1, t*6)*Math.PI)*k, 0); p.corpo.scale.set(1 + .06*k, 1 - .1*k, 1 + .06*k); treme(p.corpo, t, .02*k); tinge(p.corpo, '#c0392b', .4*saida(t/.2)); }},
             cair:{desc:'cai e quica', dur:1.4, aplicar(p, t){ const y = Math.abs(Math.cos(t*4))*Math.exp(-1.3*t)*1.2; pos(p.corpo, 0, y, 0); gz(p.corpo, .2*Math.sin(t*5)*Math.exp(-t)); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}), m = mat(P.cor, {rough:.35});
    const dome = new T3.Mesh(new T3.SphereGeometry(.4, 14, 8, 0, Math.PI*2, 0, Math.PI/2), m); dome.position.y = .12; dome.castShadow = true; c.add(dome);
    cil(.44, .05, m, {pai:c, pos:[0, .12, 0], lados:14}); caixa(.5, .03, .2, m, {pai:c, pos:[.4, .1, 0]}); [-.06, .06].forEach(z => caixa(.9, .03, .04, mat(tom(P.cor, -.1)), {pai:c, pos:[0, .52, z*1.0], rot:[0, 0, 0], esc:[.6, 1, 1]}));
    caixa(.5, .03, .06, mat(tom(P.cor, -.1)), {pai:c, pos:[0, .5, 0]}); cil(.1, .06, mat('#d63c3c'), {pai:c, pos:[.28, .35, 0], rot:[0, 0, 90], lados:8});
    return {obj:g, dim:[.9, .6, .9], ancoras:{topo:[0, .55, 0]}};
  }});
})();
