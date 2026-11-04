/* =========================================================
   BIBLIOTECA · LOTE 6 (conceitos e ciência): 10 objetos
   moedas, cofre, cadeado, balanca, lupa, foguete, planeta_terra, satelite, becker, caixa_papelao
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H, {RP, gx, gy, gz, tinge, brilha, treme, pos} = LIB.U;

/* ---------- 51. moedas ---------- */
LIB.registrar({id:'moedas', nome:'Pilha de moedas', lote:6, categoria:'dinheiro',
  descricao:'pilha de moedas de ouro; as moedas caem uma a uma para empilhar',
  params:{quantidade:{padrao:8}, cor:{padrao:'#e6b422'}},
  animacoes:{empilhar:{desc:'as moedas caem e se empilham em sequência', dur:2.4, aplicar(p, t, a){ const n = Math.round(a.n || 8); for(let i = 0; i < 12; i++){ const m = p['moeda_'+i]; if(!m) continue; const u = prog(t, i*.18, i*.18 + .35); m.visible = u > 0; pos(m, 0, (1 - saida(u))*1.4, 0); } }},
             girar:{desc:'a moeda de cima gira em pé (contínuo)', loop:true, dur:3, aplicar(p, t){ const m = p.moeda_topo; gy(m, t*4); }}},
  criar(P){
    const g = grupo(), n = Math.min(12, Math.max(1, Math.round(P.quantidade))), m = mat(P.cor, {tex:'metal', m:.3, metal:.8, rough:.3});
    for(let i = 0; i < n; i++){ const c = cil(.3, .07, m, {pai:g, nome:'moeda_'+i, pos:[((i*37)%5 - 2)*.01, .035 + i*.075, ((i*53)%5 - 2)*.01], lados:20}); cil(.22, .075, mat(tom(P.cor, -.08), {tex:'metal', m:.3, metal:.8}), {pai:c, lados:20}); }
    const tp = grupo({pai:g, nome:'moeda_topo', pos:[.55, .3, 0]}); cil(.3, .07, m, {pai:tp, rot:[90, 0, 0], lados:20}); cil(.22, .075, mat(tom(P.cor, -.08), {tex:'metal', m:.3, metal:.8}), {pai:tp, rot:[90, 0, 0], lados:20});
    return {obj:g, dim:[1.2, n*.075 + .35, .7], ancoras:{topo:[0, n*.075 + .05, 0]}};
  }});

/* ---------- 52. cofre ---------- */
LIB.registrar({id:'cofre', nome:'Cofre', lote:6, categoria:'dinheiro',
  descricao:'cofre de aço com porta e roda de segredo (frente +z); abre, fecha e treme',
  params:{cor:{padrao:'#4a5260'}},
  animacoes:{abrir:{desc:'gira a roda e a porta abre', dur:1.8, aplicar(p, t){ gz(p.roda, -rad(300)*suave(t/.8)); gy(p.porta, rad(-110)*suave((t - .7)/1.0)); }},
             fechar:{desc:'a porta fecha', dur:1.2, aplicar(p, t){ gy(p.porta, rad(-110)*(1 - suave(t/1.0))); gz(p.roda, -rad(300)*suave((t - .8)/.4)); }},
             tremer:{desc:'treme (tentativa de arrombar)', dur:1.4, aplicar(p, t){ treme(p.corpo, t, .02*Math.max(0, 1 - t/1.4)); treme(p.porta, t, .02*Math.max(0, 1 - t/1.4)); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.6, metal:.6, rough:.4}), mi = mat('#2a2f37'), W = 1, H = 1.1, D = .8, c = grupo({pai:g, nome:'corpo'});
    caixa(W, H, .06, mi, {pai:c, pos:[0, H/2, -D/2 + .03]}); caixa(.08, H, D, mc, {pai:c, pos:[-W/2 + .04, H/2, 0]}); caixa(.08, H, D, mc, {pai:c, pos:[W/2 - .04, H/2, 0]}); caixa(W, .08, D, mc, {pai:c, pos:[0, H - .04, 0]}); caixa(W, .08, D, mc, {pai:c, pos:[0, .04, 0]});
    caixa(W - .2, .04, D - .2, mat('#6b4a2c', {tex:'madeira', m:.5}), {pai:c, pos:[0, .6, 0]}); for(let i = 0; i < 3; i++) caixa(.5, .05, .3, mat('#3f9b5b', {rough:.7}), {pai:c, pos:[-.1, .12 + i*.05, -.05]});
    const pt = grupo({pai:g, nome:'porta', pos:[-W/2, 0, D/2]}); caixa(W, H, .1, mc, {pai:pt, pos:[W/2, H/2, .05]}); caixa(W - .15, H - .15, .02, mat(tom(P.cor, .05), {tex:'metal', m:.5, metal:.6}), {pai:pt, pos:[W/2, H/2, .11]});
    const r = grupo({pai:pt, nome:'roda', pos:[W/2 + .05, H/2 + .05, .14]}); cil(.15, .06, mat('#c9a24a', {tex:'metal', m:.3, metal:.8}), {pai:r, rot:[90, 0, 0], lados:14}); for(let i = 0; i < 4; i++) caixa(.5, .04, .05, mat('#c9a24a', {tex:'metal', m:.3, metal:.8}), {pai:r, rot:[0, 0, i*45], pos:[0, 0, .03]});
    [[.12, H*.2], [.12, H*.8]].forEach(([x, y]) => cil(.04, .1, mi, {pai:pt, pos:[0, y, 0], lados:6}));
    return {obj:g, dim:[W, H, D + .8], ancoras:{interior:[0, .7, 0], porta:[-W/2, H/2, D/2]}};
  }});

/* ---------- 53. cadeado ---------- */
LIB.registrar({id:'cadeado', nome:'Cadeado', lote:6, categoria:'segurança',
  descricao:'cadeado de metal em pé de frente para +z; abre (haste sobe e gira) e trava',
  params:{cor:{padrao:'#d9a82a'}},
  animacoes:{abrir:{desc:'a haste sobe e gira abrindo', dur:1.1, aplicar(p, t){ const k = suave(t/1.1); pos(p.haste, -.0, .12*k, 0); gy(p.haste, rad(-70)*suave((t - .35)/.7)); }},
             fechar:{desc:'a haste gira e desce travando', dur:1.1, aplicar(p, t){ const k = 1 - suave(t/1.1); pos(p.haste, 0, .12*k, 0); gy(p.haste, rad(-70)*(1 - suave(t/.7))); }},
             balancar:{desc:'balança pendurado (contínuo)', loop:true, dur:3, aplicar(p, t){ gz(p.corpo, .1*Math.sin(t*2)); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.3, metal:.8, rough:.3}), ms = mat('#c9ced6', {tex:'metal', m:.3, metal:.85, rough:.25});
    const c = grupo({pai:g, nome:'corpo', pos:[0, .0, 0]}); caixa(.6, .5, .24, mc, {pai:c, pos:[0, .25, 0]}); cil(.04, .03, mat('#222'), {pai:c, pos:[0, .22, .125], rot:[90, 0, 0], lados:8}); caixa(.02, .1, .02, mat('#222'), {pai:c, pos:[0, .17, .125]});
    const h = grupo({pai:g, nome:'haste', pos:[.18, .5, 0]}); cil(.04, .26, ms, {pai:h, pos:[0, .13, 0], lados:8}); cil(.04, .36, ms, {pai:h, pos:[-.36, .13, 0], lados:8}); caixa(.4, .08, .08, ms, {pai:h, pos:[-.18, .3, 0]});
    return {obj:g, dim:[.65, .85, .3], ancoras:{topo:[0, .85, 0], fechadura:[0, .2, .13]}};
  }});

/* ---------- 54. balanca ---------- */
LIB.registrar({id:'balanca', nome:'Balança de pratos', lote:6, categoria:'conceitos',
  descricao:'balança de dois pratos para comparar coisas (esquerdo -x e direito +x); pende para um lado ou equilibra',
  params:{cor:{padrao:'#c9a24a'}},
  animacoes:{pender:{desc:'pende; args.lado = -1 (esquerda pesa mais) ou 1 (direita pesa mais)', dur:1.6, aplicar(p, t, a){ pesa(p, a.lado != null ? a.lado : 1, suave(t/1.2)); }},
             equilibrar:{desc:'oscila e se estabiliza no meio', dur:2.4, aplicar(p, t){ const k = Math.exp(-1.6*t)*Math.cos(t*7); pesa(p, 1, .3*k); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.3, metal:.8, rough:.3}), mb = mat('#3a2f27', {tex:'madeira', m:.5});
    cil(.4, .1, mb, {pai:g, pos:[0, .05, 0], lados:14}); cil(.05, 1.5, mc, {pai:g, pos:[0, .8, 0], lados:8}); esfera(.08, mc, {pai:g, pos:[0, 1.58, 0], det:1});
    const br = grupo({pai:g, nome:'braco', pos:[0, 1.45, 0]}); caixa(1.8, .06, .06, mc, {pai:br}); br.userData.L = .9;
    [-1, 1].forEach(s => { const pr = grupo({pai:g, nome:s < 0 ? 'prato_esq' : 'prato_dir', pos:[s*.9, .85, 0]}); [-1, 1].forEach(z => cil(.01, .6, mc, {pai:pr, pos:[0, .3, z*.18], lados:4, rot:[0, 0, 0]})); cil(.34, .04, mc, {pai:pr, pos:[0, 0, 0], lados:16}); cil(.1, .1, mc, {pai:pr, pos:[0, .0, 0], lados:6}); });
    return {obj:g, dim:[2.1, 1.7, .8], ancoras:{prato_esq:[-.9, .9, 0], prato_dir:[.9, .9, 0], topo:[0, 1.7, 0]}};
  }});
function pesa(p, lado, k){ const a = -lado*k*.28, L = .9; gz(p.braco, a); p.prato_esq.position.y = RP(p.prato_esq).p.y + Math.sin(-a)*L; p.prato_dir.position.y = RP(p.prato_dir).p.y + Math.sin(a)*L; p.prato_esq.position.x = RP(p.prato_esq).p.x + L*(1 - Math.cos(a)); p.prato_dir.position.x = RP(p.prato_dir).p.x - L*(1 - Math.cos(a)); }

/* ---------- 55. lupa ---------- */
LIB.registrar({id:'lupa', nome:'Lupa', lote:6, categoria:'conceitos',
  descricao:'lupa de cabo de madeira em pé (lente voltada para +z); varre de um lado para o outro e destaca algo',
  params:{cor:{padrao:'#8a5a2b'}},
  animacoes:{varrer:{desc:'balança de um lado para o outro procurando (contínuo)', loop:true, dur:4, aplicar(p, t){ pos(p.corpo, Math.sin(t*1.4)*.25, Math.sin(t*2.1)*.04, 0); gz(p.corpo, Math.sin(t*1.4)*.12); }},
             focar:{desc:'aproxima e dá um pequeno pulso na lente', dur:1.2, aplicar(p, t){ const k = suave(t/.8); pos(p.corpo, 0, 0, .3*k); p.corpo.scale.setScalar(1 + .1*Math.sin(Math.PI*clamp(t/1.2, 0, 1))); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}), mm = mat('#2d333b', {tex:'metal', m:.4, metal:.5});
    const aro = new T3.Mesh(new T3.TorusGeometry(.4, .045, 6, 24), mm); aro.position.set(0, 1.05, 0); aro.castShadow = true; c.add(aro); cil(.38, .02, mat('#cfeaff', {vidro:.35, rough:.05}), {pai:c, pos:[0, 1.05, 0], rot:[90, 0, 0], lados:24});
    cil(.045, .75, mat(P.cor, {tex:'madeira', m:.4}), {pai:c, pos:[0, .45, 0], rTopo:.06, lados:8}); cil(.07, .1, mm, {pai:c, pos:[0, .08, 0], lados:8});
    return {obj:g, dim:[.9, 1.55, .2], ancoras:{lente:[0, 1.05, .05]}};
  }});

/* ---------- 56. foguete ---------- */
LIB.registrar({id:'foguete', nome:'Foguete', lote:6, categoria:'espaço',
  descricao:'foguete em pé com nariz vermelho, janela e três aletas; acende o propulsor e decola (sobe em +y)',
  params:{cor:{padrao:'#f1f3f5'}},
  animacoes:{decolar:{desc:'propulsor acende, treme e o foguete sobe (args.altura em m, padrão 6)', dur:3, aplicar(p, t, a){ const k = prog(t, .8, 3), h = (a.altura != null ? a.altura : 6); pos(p.foguete, 0, h*k*k, 0); treme(p.foguete, t, .02*(t < .8 ? t/.8 : 1)); const f = Math.min(1, t/.5); p.chama.visible = t > .05; p.chama.scale.set(1, (1.0 + .3*Math.sin(t*40))*f*(1 + 2*k), 1); }},
             ignicao:{desc:'liga o propulsor e treme parado', dur:2, aplicar(p, t){ treme(p.foguete, t, .02); p.chama.scale.set(1, .6 + .2*Math.sin(t*40), 1); p.chama.visible = true; }}},
  criar(P){
    const g = grupo(), f = grupo({pai:g, nome:'foguete'}), mc = mat(P.cor, {rough:.35, metal:.2}), mr = mat('#d9382f', {rough:.4});
    cil(.3, 1.6, mc, {pai:f, pos:[0, 1.0, 0], lados:14}); cone(.3, .6, mr, {pai:f, pos:[0, 2.1, 0], lados:14}); cil(.2, .12, mat('#2d333b'), {pai:f, pos:[0, .22, 0], lados:12});
    cil(.16, .06, mat('#9fd4ee', {vidro:.6}), {pai:f, pos:[0, 1.5, .27], rot:[90, 0, 0], lados:12}); cil(.2, .05, mat('#59616c'), {pai:f, pos:[0, 1.5, .27], rot:[90, 0, 0], lados:12, esc:1.05});
    for(let i = 0; i < 3; i++){ const a = i*120; const fa = grupo({pai:f, rot:[0, a, 0]}); caixa(.04, .6, .36, mr, {pai:fa, pos:[0, .45, .42], rot:[8, 0, 0]}); }
    cil(.3, .05, mr, {pai:f, pos:[0, .22 + .0, 0], lados:14, esc:1}); const ch = grupo({pai:f, nome:'chama', pos:[0, .12, 0]}); cone(.2, .8, mat('#ff9a2a', {brilho:1.4, rough:.4}), {pai:ch, pos:[0, -.4, 0], rot:[180, 0, 0], lados:8}); cone(.1, .5, mat('#fff0a0', {brilho:1.6}), {pai:ch, pos:[0, -.25, 0], rot:[180, 0, 0], lados:6}); ch.visible = false;
    caixa(1.4, .08, 1.4, mat('#59616c', {tex:'concreto', m:.6}), {pai:g, pos:[0, .04, 0]});
    return {obj:g, dim:[1.4, 2.5, 1.4], ancoras:{topo:[0, 2.4, 0], propulsor:[0, .15, 0]}};
  }});

/* ---------- 57. planeta_terra ---------- */
function texTerra(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#2a6fc0'; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#4caf50'; [[40, 40, 50, 28], [70, 85, 22, 30], [130, 45, 34, 26], [150, 80, 18, 24], [200, 50, 36, 22], [215, 95, 18, 12]].forEach(([a, b, w, h]) => { x.beginPath(); x.ellipse(a, b, w, h, .3, 0, 6.283); x.fill(); });
  x.fillStyle = '#f4f8fc'; x.fillRect(0, 0, 256, 10); x.fillRect(0, 118, 256, 10);
  x.fillStyle = 'rgba(255,255,255,.7)'; [[60, 30], [120, 70], [190, 100], [20, 90]].forEach(([a, b]) => { x.beginPath(); x.ellipse(a, b, 20, 5, 0, 0, 6.283); x.fill(); });
  const t = new T3.CanvasTexture(c); t.userData = {m:1}; return t;
}
LIB.registrar({id:'planeta_terra', nome:'Planeta Terra', lote:6, categoria:'espaço',
  descricao:'globo terrestre low poly com continentes (origem no centro); gira, e a atmosfera pode brilhar',
  params:{raio:{padrao:1}},
  animacoes:{girar:{desc:'gira devagar (contínuo)', loop:true, dur:8, aplicar(p, t, a){ gy(p.globo, t*.5*(a.velocidade != null ? a.velocidade : 1)); }},
             aquecer:{desc:'o planeta esquenta e fica avermelhado', dur:3, aplicar(p, t){ tinge(p.globo, '#ff5a2a', suave(t/3)*.55); gy(p.globo, t*.3); }}},
  criar(P){
    const g = grupo(), r = P.raio, m = new T3.MeshStandardMaterial({color:'#ffffff', map:texTerra(), flatShading:true, roughness:.8}); m.userData.e = {c:m.emissive.clone(), i:0};
    const gl = new T3.Mesh(new T3.SphereGeometry(r, 18, 12), m); gl.castShadow = true; gl.userData.parte = 'globo'; gl.position.y = r; g.add(gl);
    const at = new T3.Mesh(new T3.SphereGeometry(r*1.07, 18, 12), new T3.MeshBasicMaterial({color:'#8fd0ff', transparent:true, opacity:.18, depthWrite:false})); at.position.y = r; g.add(at);
    return {obj:g, dim:[r*2.2, r*2.2, r*2.2], ancoras:{centro:[0, r, 0]}};
  }});

/* ---------- 58. satelite ---------- */
LIB.registrar({id:'satelite', nome:'Satélite', lote:6, categoria:'espaço',
  descricao:'satélite com corpo dourado, dois painéis solares e antena parabólica (origem no centro)',
  params:{},
  animacoes:{girar:{desc:'gira lentamente (contínuo)', loop:true, dur:6, aplicar(p, t){ gy(p.corpo, t*.6); }},
             orbitar:{desc:'se move em órbita circular em volta da origem (contínuo); args.raio', loop:true, dur:8, aplicar(p, t, a){ const r = a.raio != null ? a.raio : 1.4, ang = t*.8; pos(p.corpo, Math.cos(ang)*r - r, 0, Math.sin(ang)*r); gy(p.corpo, -ang); }},
             abrir_paineis:{desc:'os painéis solares se abrem', dur:1.6, aplicar(p, t){ const k = suave(t/1.6); p.painel_esq.scale.x = Math.max(.001, k); p.painel_dir.scale.x = Math.max(.001, k); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo', pos:[0, .6, 0]}), md = mat('#d4a63a', {tex:'metal', m:.3, metal:.8, rough:.35}), mp = mat('#2a4a8a', {rough:.3, metal:.3});
    caixa(.5, .5, .5, md, {pai:c}); cil(.04, .6, mat('#cfd5db'), {pai:c, pos:[0, .55, 0], lados:6}); cone(.22, .14, mat('#e8ebef', {rough:.3}), {pai:c, pos:[0, .86, 0], lados:12});
    [-1, 1].forEach(s => { caixa(.5, .04, .04, mat('#8d98a6'), {pai:c, pos:[s*.5, 0, 0]}); const pn = grupo({pai:c, nome:s < 0 ? 'painel_esq' : 'painel_dir', pos:[s*.75, 0, 0]}); const pp = grupo({pai:pn, pos:[s*.5, 0, 0]}); caixa(1.0, .03, .6, mp, {pai:pp}); for(let i = 1; i < 4; i++) caixa(.01, .035, .6, mat('#cfd5db'), {pai:pp, pos:[-.5 + i*.25, 0, 0]}); pn.userData.s = s; });
    return {obj:g, dim:[2.8, 1.0, .6], ancoras:{centro:[0, 0, 0]}};
  }});

/* ---------- 59. becker ---------- */
LIB.registrar({id:'becker', nome:'Béquer com líquido', lote:6, categoria:'ciência',
  descricao:'béquer de vidro com líquido colorido; enche, ferve com bolhas e muda de cor',
  params:{cor_liquido:{padrao:'#3fc1c9'}, nivel:{padrao:.5}},
  animacoes:{encher:{desc:'o líquido sobe até quase a boca', dur:2, aplicar(p, t, a){ liq(p, P0(p) + (.9 - P0(p))*suave(t/2)); }},
             ferver:{desc:'o líquido borbulha com bolhas subindo (contínuo)', loop:true, dur:3, aplicar(p, t){ p.bolhas.children.forEach((b, i) => { const u = (t*.7 + i*.19) % 1, top = p.liquido.userData.topo; b.scale.setScalar(.5 + .5*(1 - u)); b.position.set(RP(b).p.x + Math.sin(t*5 + i)*.03, .1 + u*(top - .1), RP(b).p.z); }); tinge(p.liquido, '#ff9a4a', .35); }},
             mudar_cor:{desc:'o líquido muda de cor (reação)', dur:1.6, aplicar(p, t, a){ tinge(p.liquido, a.cor || '#e5565b', suave(t/1.6)); }}},
  criar(P){
    const g = grupo(), r = .4, h = 1.0, vd = mat('#e4f3fb', {vidro:.25, rough:.05});
    cil(r, h, vd, {pai:g, pos:[0, h/2, 0], lados:20}); cil(r + .03, .05, vd, {pai:g, pos:[0, h, 0], lados:20});
    const li = cil(r - .03, h*.9, mat(P.cor_liquido, {vidro:.8, rough:.2}), {pai:g, nome:'liquido', pos:[0, .03 + h*.45, 0], lados:20}); li.userData.h = h*.9; li.userData.y = .03; li.userData.n0 = P.nivel; li.userData.topo = .03 + h*.9*P.nivel;
    for(let i = 1; i < 5; i++) caixa(.12, .015, .02, mat('#2a2f37'), {pai:g, pos:[r - .01, .15 + i*.15, .0], rot:[0, 90, 0]});
    const bo = grupo({pai:g, nome:'bolhas'}); for(let i = 0; i < 8; i++) esfera(.04, mat('#ffffff', {vidro:.7}), {pai:bo, pos:[((i*3)%5 - 2)*.1, .1, ((i*7)%5 - 2)*.08], det:0});
    liq({liquido:li, bolhas:bo}, P.nivel); li.userData.rest = null;
    return {obj:g, dim:[r*2.1, h + .1, r*2.1], ancoras:{boca:[0, h, 0], liquido:[0, h*.4, 0]}};
  }});
function P0(p){ return p.liquido.userData.n0; }
function liq(p, n){ const l = p.liquido; n = clamp(n, .03, 1); l.scale.y = n/Math.max(.03, 1)*1; l.scale.y = n; l.position.y = l.userData.y + l.userData.h*n/2; l.userData.topo = l.userData.y + l.userData.h*n; }

/* ---------- 60. caixa_papelao ---------- */
LIB.registrar({id:'caixa_papelao', nome:'Caixa de papelão', lote:6, categoria:'logística',
  descricao:'caixa de papelão com fita e abas que abrem; sacode e abre',
  params:{tamanho:{padrao:1}},
  animacoes:{abrir:{desc:'as abas se abrem', dur:1, aplicar(p, t){ const k = suave(t/1); gx(p.aba_frente, rad(115)*k); gx(p.aba_tras, rad(-115)*k); gz(p.aba_esq, rad(115)*k); gz(p.aba_dir, rad(-115)*k); }},
             sacudir:{desc:'sacode a caixa', dur:1.2, aplicar(p, t){ treme(p.corpo, t, .03*Math.max(0, 1 - t/1.2)); }},
             pulo:{desc:'dá um pulinho', dur:.8, aplicar(p, t){ pos(p.corpo, 0, .3*Math.sin(Math.PI*clamp(t/.8, 0, 1)), 0); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, m = mat('#c89a5e', {tex:'madeira', m:.6, rough:.9}), c = grupo({pai:g, nome:'corpo', esc:s}), w = .8, h = .6;
    caixa(w, h, w, m, {pai:c, pos:[0, h/2, 0]}); caixa(.12, .002 + h*.0, w + .005, mat('#e8d8b0'), {pai:c, pos:[0, h + .001, 0]});
    const ab = (n, x, z, rz) => { const a = grupo({pai:g, nome:n, pos:[x*s, h*s, z*s], esc:s}); return a; };
    [['aba_frente', 0, w/2, 'x', 1], ['aba_tras', 0, -w/2, 'x', -1]].forEach(([n, x, z, e, k]) => { const a = grupo({pai:g, nome:n, pos:[0, h*s, z*s]}); caixa(w*s, .02*s, .4*s, m, {pai:a, pos:[0, 0, -k*.2*s]}); });
    [['aba_esq', -w/2, 1], ['aba_dir', w/2, -1]].forEach(([n, x, k]) => { const a = grupo({pai:g, nome:n, pos:[x*s, h*s, 0]}); caixa(.4*s, .02*s, w*s, m, {pai:a, pos:[k*.2*s, 0, 0]}); });
    return {obj:g, dim:[w*s, h*s + .1, w*s], ancoras:{topo:[0, h*s, 0]}};
  }});
})();
