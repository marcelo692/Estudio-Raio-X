/* =========================================================
   BIBLIOTECA · LOTE 3 (casa e eletrônicos): 10 objetos
   lampada, tomada, fio, monitor, celular, bateria, geladeira, ventilador, relogio, chave_inglesa
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H;
const RP = o => o.userData.rest;
const gz = (o, a) => { o.rotation.z = RP(o).r.z + a; };
const gy = (o, a) => { o.rotation.y = RP(o).r.y + a; };
const tinge = (o, hex, k) => o.traverse(m => { if(m.isMesh){ if(!m.material.userData.cor0) m.material.userData.cor0 = m.material.color.clone(); m.material.color.copy(m.material.userData.cor0).lerp(new T3.Color(hex), k); } });
const brilha = (o, hex, k) => o.traverse(m => { if(m.isMesh && m.material.emissive){ m.material.emissive.set(hex); m.material.emissiveIntensity = k; } });
const treme = (o, t, amp) => { const r = RP(o); o.position.x = r.p.x + Math.sin(t*61)*amp; o.position.y = r.p.y + Math.sin(t*53 + 1)*amp*.6; };
const luz = (t, quando) => t >= quando;
function telaCanvas(tipo, cor){
  const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#0f1a2b'; x.fillRect(0, 0, 256, 160);
  if(tipo === 'grafico'){ x.strokeStyle = '#2b3d5a'; x.lineWidth = 1; for(let i = 1; i < 5; i++){ x.beginPath(); x.moveTo(0, i*32); x.lineTo(256, i*32); x.stroke(); }
    x.strokeStyle = cor; x.lineWidth = 4; x.beginPath(); [20,60,40,90,70,110,100,130].forEach((v, i) => { const px = 10 + i*34, py = 150 - v; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke();
    x.fillStyle = cor; for(let i = 0; i < 4; i++) x.fillRect(14 + i*20, 150 - [30,50,40,70][i], 14, [30,50,40,70][i]); }
  else { x.fillStyle = cor; x.fillRect(16, 16, 224, 22); [60, 84, 108].forEach(y => { x.fillStyle = '#34507a'; x.fillRect(16, y, 160, 12); }); x.fillStyle = cor; x.beginPath(); x.arc(206, 98, 28, 0, 6.283); x.fill(); }
  const t = new T3.CanvasTexture(c); t.userData = {m:1}; return t;
}
function matTela(tipo, cor){ const m = new T3.MeshStandardMaterial({color:'#ffffff', roughness:.3, flatShading:true}); m.map = telaCanvas(tipo, cor); m.emissive = new T3.Color('#ffffff'); m.emissiveMap = m.map; m.emissiveIntensity = .9; m.userData.e = {c:m.emissive.clone(), i:m.emissiveIntensity}; return m; }

/* ---------- 21. lampada ---------- */
LIB.registrar({id:'lampada', nome:'Lâmpada', lote:3, categoria:'eletrônicos',
  descricao:'lâmpada incandescente com rosca de metal, em pé (a base fica no chão); acende, pisca e queima',
  params:{cor_luz:{padrao:'#ffd45a'}},
  animacoes:{acender:{desc:'acende com brilho amarelo', dur:.8, aplicar(p, t, a){ ac(p, a, suave(t/.8)); }},
             piscar:{desc:'pisca (contínuo)', loop:true, dur:2, aplicar(p, t, a){ ac(p, a, (Math.sin(t*14) > 0 ? 1 : .15)); }},
             queimar:{desc:'estoura de brilho e apaga escurecendo', dur:1.4, aplicar(p, t, a){ const k = t < .35 ? suave(t/.35)*2.2 : Math.max(0, 2.2 - (t - .35)*3); ac(p, a, k); if(t > .8) tinge(p.bulbo, '#2a2420', suave((t - .8)/.5)*.8); }}},
  criar(P){
    const g = grupo(), mv = mat('#fdf6d8', {vidro:.55, rough:.1}), mm = mat('#b9bec6', {tex:'metal', m:.3, metal:.7, rough:.35}), mp = mat('#2b2b2b');
    cil(.09, .22, mm, {pai:g, nome:'rosca', pos:[0, .11, 0], lados:12}); for(let i = 0; i < 4; i++) cil(.1, .02, mm, {pai:g, pos:[0, .05 + i*.05, 0], lados:12}); cil(.07, .04, mp, {pai:g, pos:[0, -.0, 0], lados:10});
    cil(.08, .1, mat('#f2f2ee', {rough:.5}), {pai:g, pos:[0, .27, 0], rTopo:.12, lados:12});
    esfera(.24, mv, {pai:g, nome:'bulbo', pos:[0, .5, 0], det:2});
    const f = grupo({pai:g, nome:'filamento', pos:[0, .45, 0]}); const mf = mat('#ff9a2a', {brilho:0}); cil(.012, .22, mm, {pai:f, pos:[-.04, .02, 0], lados:5}); cil(.012, .22, mm, {pai:f, pos:[.04, .02, 0], lados:5}); caixa(.1, .02, .02, mf, {pai:f, pos:[0, .14, 0]});
    return {obj:g, dim:[.5, .76, .5], ancoras:{bulbo:[0, .5, 0], topo:[0, .76, 0]}};
  }});
function ac(p, a, k){ const cor = (a && a.cor) || '#ffcf4a'; brilha(p.bulbo, cor, 1.4*k); brilha(p.filamento, '#ff9a2a', 2.2*k); p.bulbo.traverse(m => { if(m.isMesh && k > 0){ m.material.opacity = Math.min(1, .55 + .3*k); } }); }

/* ---------- 22. tomada ---------- */
LIB.registrar({id:'tomada', nome:'Tomada com plugue', lote:3, categoria:'eletrônicos',
  descricao:'tomada de parede (padrão brasileiro, vista de frente voltada para +z) e plugue; conecta, desconecta e dá curto-circuito',
  params:{cor:{padrao:'#f1f1ee'}},
  animacoes:{ligar:{desc:'o plugue encaixa na tomada', dur:1, aplicar(p, t){ p.plugue.position.z = RP(p.plugue).p.z - .38*suave(t/1)*1; }},
             desligar:{desc:'o plugue sai da tomada', dur:1, aplicar(p, t){ p.plugue.position.z = RP(p.plugue).p.z - .38*(1 - suave(t/1)); }},
             curto_circuito:{desc:'faísca e queima: a tomada escurece e solta faíscas', dur:1.6, aplicar(p, t){ const k = (Math.sin(t*50) > 0 ? 1 : .2)*Math.max(0, 1 - t/1.4); p.faisca.scale.setScalar(.001 + 1.2*k); brilha(p.faisca, '#ffb12a', 3*k); tinge(p.placa, '#2a2420', suave(t/1.2)*.8); treme(p.plugue, t, .006*k); }}},
  criar(P){
    const g = grupo(), mp = mat(P.cor, {rough:.55}), mb = mat('#22262b');
    caixa(.5, .5, .05, mp, {pai:g, nome:'placa', pos:[0, .45, 0]}); caixa(.38, .38, .02, mat(tom(P.cor, -.04)), {pai:g, pos:[0, .45, .03]});
    [[-.08, .05], [.08, .05]].forEach(([x]) => caixa(.045, .08, .02, mb, {pai:g, pos:[x, .45, .045]})); caixa(.045, .02, .02, mb, {pai:g, pos:[0, .35, .045]});
    const pl = grupo({pai:g, nome:'plugue', pos:[0, .45, .5]}); caixa(.3, .3, .2, mat('#2b2f36', {rough:.6}), {pai:pl, pos:[0, 0, .1]}); [-.08, .08].forEach(x => caixa(.035, .09, .3, mat('#c9ced6', {tex:'metal', m:.2, metal:.7}), {pai:pl, pos:[x, 0, -.12]})); cil(.06, .3, mat('#202327'), {pai:pl, pos:[0, 0, .3], rot:[90, 0, 0], lados:8});
    const fa = grupo({pai:g, nome:'faisca', pos:[0, .45, .1], esc:.001}); const mf = mat('#ffd24a', {brilho:0}); for(let i = 0; i < 6; i++) caixa(.02, .22, .02, mf, {pai:fa, rot:[0, 0, i*60]});
    return {obj:g, dim:[.5, .7, .55], ancoras:{furos:[0, .45, .05], plugue:[0, .45, .5]}};
  }});

/* ---------- 23. fio ---------- */
LIB.registrar({id:'fio', nome:'Cabo elétrico com corrente', lote:3, categoria:'eletrônicos',
  descricao:'cabo elétrico curvo com plugues nas pontas e pulsos de energia que correm por ele; mostra o caminho da eletricidade',
  params:{comprimento:{padrao:2}, cor:{padrao:'#e2b429'}, cor_pulso:{padrao:'#7fd4ff'}},
  animacoes:{energizar:{desc:'pulsos de energia percorrem o cabo (contínuo); args.velocidade', loop:true, dur:3, aplicar(p, t, a){ const v = a.velocidade != null ? a.velocidade : 1, n = p.pulsos.children.length, c = p.pulsos.userData.curva; p.pulsos.children.forEach((d, i) => { d.position.copy(c.getPoint(((i/n) + t*.3*v) % 1)); d.position.y += .0; }); }},
             sobrecarregar:{desc:'o cabo esquenta e fica vermelho', dur:2.2, aplicar(p, t){ const k = suave(t/1.8); tinge(p.cabo, '#ff3b1f', k*.9); brilha(p.cabo, '#ff3b1f', k*.8); }}},
  criar(P){
    const g = grupo(), L = P.comprimento, c = new T3.CatmullRomCurve3([new T3.Vector3(-L/2, .1, 0), new T3.Vector3(-L/4, .35, .25), new T3.Vector3(0, .12, -.2), new T3.Vector3(L/4, .4, .15), new T3.Vector3(L/2, .1, 0)]);
    const mc = mat(P.cor, {rough:.5, brilho:0}); const cabo = new T3.Mesh(new T3.TubeGeometry(c, 40, .04, 6, false), mc); cabo.castShadow = true; cabo.userData.parte = 'cabo'; g.add(cabo);
    [-1, 1].forEach(s => { const pl = grupo({pai:g, pos:[s*(L/2 + .12), .1, 0]}); caixa(.24, .16, .16, mat('#2b2f36'), {pai:pl}); [-.04, .04].forEach(z => caixa(.12, .03, .03, mat('#c9ced6', {tex:'metal', m:.2, metal:.7}), {pai:pl, pos:[s*.17, 0, z*1.6]})); });
    const pu = grupo({pai:g, nome:'pulsos'}); pu.userData.curva = c; const mp = mat(P.cor_pulso, {brilho:1.2, rough:.3}); for(let i = 0; i < 6; i++) esfera(.07, mp, {pai:pu, pos:c.getPoint(i/6).toArray(), det:1});
    return {obj:g, dim:[L + .6, .6, .6], ancoras:{inicio:[-L/2 - .25, .1, 0], fim:[L/2 + .25, .1, 0]}};
  }});

/* ---------- 24. monitor ---------- */
LIB.registrar({id:'monitor', nome:'Monitor / tela', lote:3, categoria:'eletrônicos',
  descricao:'monitor de computador em pé de frente para +z, com tela que pode mostrar um gráfico ou uma janela; liga e desliga',
  params:{tela:{padrao:'grafico', opcoes:['grafico','janela']}, cor_tela:{padrao:'#4ddc9a'}},
  animacoes:{ligar:{desc:'a tela acende', dur:.7, aplicar(p, t){ tl(p, suave(t/.7)); }},
             desligar:{desc:'a tela apaga', dur:.5, aplicar(p, t){ tl(p, 1 - suave(t/.5)); }},
             travar:{desc:'a tela pisca e fica vermelha (erro)', dur:1.6, aplicar(p, t){ tl(p, Math.sin(t*20) > 0 ? 1 : .5); tinge(p.tela, '#ff2a2a', suave(t/.8)*.7); }}},
  criar(P){
    const g = grupo(), mb = mat('#252a31', {rough:.5}), mt = matTela(P.tela, P.cor_tela);
    cil(.28, .05, mb, {pai:g, pos:[0, .025, -.05], lados:16}); caixa(.12, .36, .06, mb, {pai:g, pos:[0, .22, -.08]});
    caixa(1.2, .72, .06, mb, {pai:g, nome:'moldura', pos:[0, .86, 0]}); caixa(1.1, .62, .02, mt, {pai:g, nome:'tela', pos:[0, .86, .035]});
    p0(g); return {obj:g, dim:[1.2, 1.22, .3], ancoras:{tela:[0, .86, .05], topo:[0, 1.22, 0]}};
  }});
function p0(){} function tl(p, k){ p.tela.traverse(m => { if(m.isMesh){ m.material.emissiveIntensity = .9*k; m.material.color.setScalar(.12 + .88*k); } }); }

/* ---------- 25. celular ---------- */
LIB.registrar({id:'celular', nome:'Celular', lote:3, categoria:'eletrônicos',
  descricao:'smartphone em pé de frente para +z (de pé no chão, apoiado), tela acende, vibra ao receber chamada',
  params:{cor:{padrao:'#1f2430'}, cor_tela:{padrao:'#5aa8ff'}},
  animacoes:{ligar:{desc:'a tela acende', dur:.6, aplicar(p, t){ tl(p, suave(t/.6)); }},
             vibrar:{desc:'vibra e a tela pisca (chamada)', dur:2, loop:true, aplicar(p, t){ tl(p, 1); treme(p.corpo, t, .012); treme(p.tela, t, .012); }}},
  criar(P){
    const g = grupo(), mb = mat(P.cor, {rough:.4, metal:.2}), mt = matTela('janela', P.cor_tela);
    caixa(.5, .98, .07, mb, {pai:g, nome:'corpo', pos:[0, .55, 0]}); caixa(.44, .88, .02, mt, {pai:g, nome:'tela', pos:[0, .55, .04]});
    cil(.025, .02, mat('#0b0d12'), {pai:g, pos:[0, .92, .052], rot:[90, 0, 0], lados:8});
    caixa(.34, .06, .22, mat('#3a3f4b'), {pai:g, pos:[0, .03, -.1], rot:[-20, 0, 0]}); g.rotation.x = rad(-8); g.position.y = 0;
    return {obj:g, dim:[.5, 1.04, .3], ancoras:{tela:[0, .55, .05]}};
  }});

/* ---------- 26. bateria ---------- */
LIB.registrar({id:'bateria', nome:'Bateria / pilha', lote:3, categoria:'eletrônicos',
  descricao:'bateria cilíndrica em pé com polo positivo em cima e 4 barras de nível; carrega, descarrega e superaquece',
  params:{cor:{padrao:'#e07a1f'}},
  animacoes:{carregar:{desc:'as 4 barras acendem em verde, uma a uma', dur:2.4, aplicar(p, t){ barras(p, t/2.4*4, '#35d07f'); }},
             descarregar:{desc:'as barras apagam, ficando vermelhas no fim', dur:2.4, aplicar(p, t){ barras(p, 4 - t/2.4*4, t > 1.8 ? '#ff4a3a' : '#35d07f'); }},
             superaquecer:{desc:'incha, fica vermelha e treme', dur:2, aplicar(p, t){ const k = suave(t/1.6); tinge(p.corpo, '#ff3b1f', k*.8); p.corpo.scale.set(1 + .12*k, 1 + .05*k, 1 + .12*k); treme(p.corpo, t, .01*k); barras(p, 4, '#ff4a3a'); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.4, metal:.35, rough:.45}), mg = mat('#b9bec6', {tex:'metal', m:.3, metal:.7});
    cil(.28, 1.1, mc, {pai:g, nome:'corpo', pos:[0, .55, 0], lados:16}); cil(.12, .1, mg, {pai:g, pos:[0, 1.15, 0], lados:10}); cil(.29, .06, mat('#2b2f36'), {pai:g, pos:[0, .03, 0], lados:16}); cil(.29, .05, mat('#2b2f36'), {pai:g, pos:[0, 1.08, 0], lados:16});
    for(let i = 0; i < 4; i++) caixa(.2, .12, .02, mat('#2a2f37', {rough:.5}), {pai:g, nome:'barra_'+(i + 1), pos:[0, .22 + i*.19, .285]});
    return {obj:g, dim:[.6, 1.2, .6], ancoras:{positivo:[0, 1.2, 0], negativo:[0, 0, 0], nivel:[0, .6, .3]}};
  }});
function barras(p, n, cor){ for(let i = 0; i < 4; i++){ const k = clamp(n - i, 0, 1), b = p['barra_'+(i + 1)]; brilha(b, cor, 1.6*k); tinge(b, cor, k); } }

/* ---------- 27. geladeira ---------- */
LIB.registrar({id:'geladeira', nome:'Geladeira', lote:3, categoria:'eletrodomésticos',
  descricao:'geladeira de duas portas, frente para +z; porta de baixo abre mostrando prateleiras e luz; vibra',
  params:{cor:{padrao:'#e8ebef'}},
  animacoes:{abrir_porta:{desc:'a porta de baixo abre e a luz interna acende', dur:1.1, aplicar(p, t){ const k = suave(t/1.1); gy(p.porta, rad(-105)*k); brilha(p.luz, '#fff3c0', 1.6*k); }},
             fechar_porta:{desc:'a porta de baixo fecha', dur:.9, aplicar(p, t){ const k = 1 - suave(t/.9); gy(p.porta, rad(-105)*k); brilha(p.luz, '#fff3c0', 1.6*k); }},
             vibrar:{desc:'vibra (compressor ligado), contínuo', loop:true, dur:2, aplicar(p, t){ treme(p.corpo, t, .004); }}},
  criar(P){
    const g = grupo(), mb = mat(P.cor, {rough:.35, metal:.15}), mi = mat('#d8e4ee', {rough:.6}), mm = mat('#9aa3ad', {tex:'metal', m:.3, metal:.6}), W = .8, D = .75, Hh = 1.7;
    const co = grupo({pai:g, nome:'corpo'}); caixa(W, Hh, .05, mb, {pai:co, pos:[0, Hh/2, -D/2 + .025]}); caixa(.05, Hh, D, mb, {pai:co, pos:[-W/2 + .025, Hh/2, 0]}); caixa(.05, Hh, D, mb, {pai:co, pos:[W/2 - .025, Hh/2, 0]}); caixa(W, .05, D, mb, {pai:co, pos:[0, Hh - .025, 0]}); caixa(W, .05, D, mb, {pai:co, pos:[0, .025, 0]});
    caixa(W - .1, .04, D - .1, mi, {pai:co, pos:[0, .55, 0]}); caixa(W - .1, .04, D - .1, mi, {pai:co, pos:[0, .9, 0]}); caixa(W - .1, .04, D - .1, mi, {pai:co, pos:[0, .3, 0]});
    caixa(.1, .06, .02, mat('#fff3c0', {brilho:0}), {pai:g, nome:'luz', pos:[0, 1.1, -D/2 + .07]});
    [[.2, .3, .15], [-.2, .65, .12]].forEach(([x, y, r], i) => esfera(r, mat(['#d9503a', '#e0b32e'][i], {rough:.6}), {pai:g, pos:[x, y + r + .02, -.05], det:1}));
    caixa(W - .02, .05, .05, mb, {pai:g, pos:[0, 1.2, D/2 - .02]}); const pt = grupo({pai:g, nome:'porta', pos:[-W/2, 0, D/2]}); caixa(W, 1.05, .06, mb, {pai:pt, pos:[W/2, .6, .03]}); caixa(.03, .5, .04, mm, {pai:pt, pos:[W - .08, .75, .08]});
    caixa(W, .55, .06, mb, {pai:g, nome:'porta_cima', pos:[0, 1.45, D/2 + .03]}); caixa(.03, .3, .04, mm, {pai:g, pos:[W/2 - .08, 1.35, D/2 + .08]});
    cil(.04, .1, mat('#2b2f36'), {pai:g, pos:[-.3, 0, .2]});
    return {obj:g, dim:[W, Hh, D + .8], ancoras:{interior:[0, .7, 0], porta:[-W/2, .6, D/2]}};
  }});

/* ---------- 28. ventilador ---------- */
LIB.registrar({id:'ventilador', nome:'Ventilador', lote:3, categoria:'eletrodomésticos',
  descricao:'ventilador de mesa de frente para +z; hélice gira e a cabeça oscila de um lado para o outro',
  params:{cor:{padrao:'#2f9bd6'}},
  animacoes:{ligar:{desc:'hélice gira e a cabeça oscila (contínuo); args.velocidade', loop:true, dur:3, aplicar(p, t, a){ const v = a.velocidade != null ? a.velocidade : 1, k = saida(t/.8); gz(p.helice, -t*22*v*k); gy(p.cabeca, Math.sin(t*.9)*rad(38)); }},
             parar:{desc:'hélice desacelera até parar', dur:1.8, aplicar(p, t){ const k = clamp(t/1.8, 0, 1); gz(p.helice, -(1 - Math.pow(1 - k, 2))*18); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {rough:.4, metal:.2}), mg = mat('#2b2f36', {rough:.5}), mm = mat('#cfd5db', {tex:'metal', m:.3, metal:.6});
    cil(.3, .06, mg, {pai:g, pos:[0, .03, 0], lados:16}); cil(.05, .75, mm, {pai:g, pos:[0, .43, 0], lados:8});
    const cab = grupo({pai:g, nome:'cabeca', pos:[0, .85, 0]}); cil(.13, .35, mc, {pai:cab, pos:[0, 0, -.15], rot:[90, 0, 0], lados:12});
    const gr = new T3.Mesh(new T3.TorusGeometry(.36, .018, 5, 20), mm); gr.position.z = .1; cab.add(gr); const gr2 = gr.clone(); gr2.position.z = -.02; cab.add(gr2); for(let i = 0; i < 6; i++){ caixa(.015, .72, .015, mm, {pai:cab, pos:[0, 0, .04], rot:[0, 0, i*30]}); }
    const hel = grupo({pai:g, nome:'helice', pos:[0, .85, .08]}); cil(.07, .08, mg, {pai:hel, rot:[90, 0, 0], lados:10}); for(let i = 0; i < 3; i++){ const pa = grupo({pai:hel, rot:[0, 0, i*120]}); caixa(.16, .3, .015, mat('#b8c4cf', {rough:.4}), {pai:pa, pos:[0, .2, 0], rot:[0, 18, 0]}); }
    return {obj:g, dim:[.8, 1.25, .5], ancoras:{vento:[0, .85, .5], topo:[0, 1.25, 0]}};
  }});

/* ---------- 29. relogio ---------- */
LIB.registrar({id:'relogio', nome:'Relógio de parede', lote:3, categoria:'casa',
  descricao:'relógio redondo de frente para +z (a borda de baixo fica em y=0), com ponteiros de hora, minuto e segundo',
  params:{hora:{padrao:3, desc:'hora inicial (0-12)'}, minuto:{padrao:0, desc:'minuto inicial'}, cor:{padrao:'#7a4a28'}},
  animacoes:{correr:{desc:'o tempo passa rápido; args.velocidade = minutos por segundo do vídeo (padrão 20)', loop:true, dur:6, aplicar(p, t, a){ const m = t*(a.velocidade != null ? a.velocidade : 20); gz(p.ponteiro_min, -m*6*Math.PI/180); gz(p.ponteiro_hora, -m*.5*Math.PI/180); gz(p.ponteiro_seg, -m*360*Math.PI/180); }},
             tic:{desc:'só o ponteiro de segundos marcha', loop:true, dur:6, aplicar(p, t){ gz(p.ponteiro_seg, -Math.floor(t)*6*Math.PI/180); }}},
  criar(P){
    const g = grupo(), R = .45, c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#f7f3e8'; x.beginPath(); x.arc(128, 128, 126, 0, 6.283); x.fill(); x.fillStyle = '#2b2b2b'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for(let i = 1; i <= 12; i++){ const a = i/12*Math.PI*2 - Math.PI/2; x.fillText(String(i), 128 + Math.cos(a)*98, 128 + Math.sin(a)*98); }
    const mf = new T3.MeshStandardMaterial({map:new T3.CanvasTexture(c), roughness:.6}); const face = new T3.Mesh(new T3.CircleGeometry(R*.95, 32), mf); face.position.set(0, R + .01, .06); g.add(face);
    const aro = new T3.Mesh(new T3.TorusGeometry(R, .05, 6, 28), mat(P.cor, {tex:'madeira', m:.5})); aro.position.set(0, R + .01, .04); aro.castShadow = true; g.add(aro); cil(R, .06, mat(P.cor, {tex:'madeira', m:.5}), {pai:g, pos:[0, R + .01, .01], rot:[90, 0, 0], lados:24});
    const ponteiro = (nome, len, w, cor, ang, z) => { const h = grupo({pai:g, nome, pos:[0, R + .01, z]}); caixa(w, len, .012, mat(cor), {pai:h, pos:[0, len/2 - .04, 0]}); h.rotation.z = -ang*Math.PI/180; return h; };
    ponteiro('ponteiro_hora', R*.5, .035, '#1d1d1d', (P.hora%12)*30 + P.minuto*.5, .075); ponteiro('ponteiro_min', R*.75, .025, '#1d1d1d', P.minuto*6, .085); ponteiro('ponteiro_seg', R*.82, .01, '#d63c3c', 0, .095);
    cil(.03, .03, mat('#d63c3c'), {pai:g, pos:[0, R + .01, .1], rot:[90, 0, 0], lados:8});
    return {obj:g, dim:[R*2 + .1, R*2 + .1, .15], ancoras:{centro:[0, R, .1]}};
  }});

/* ---------- 30. chave_inglesa ---------- */
LIB.registrar({id:'chave_inglesa', nome:'Chave inglesa', lote:3, categoria:'ferramentas',
  descricao:'chave inglesa de aço deitada no chão (cabo para -x, boca para +x); gira em arco como se apertasse e abre/fecha a boca',
  params:{cor:{padrao:'#aab4c0'}, tamanho:{padrao:1}},
  animacoes:{apertar:{desc:'gira em arco como se apertasse um parafuso', dur:1.4, aplicar(p, t){ p.corpo.rotation.y = RP(p.corpo).r.y + rad(35)*Math.sin(Math.PI*clamp(t/1.4, 0, 1)); }},
             abrir_boca:{desc:'a boca se abre e fecha (ajuste)', dur:1.2, aplicar(p, t){ p.mandibula.position.z = RP(p.mandibula).p.z + .11*Math.sin(Math.PI*clamp(t/1.2, 0, 1)); p.parafuso.rotation.x = RP(p.parafuso).r.x + 6*Math.sin(Math.PI*clamp(t/1.2, 0, 1)); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, c = grupo({pai:g, nome:'corpo', esc:s}), mm = mat(P.cor, {tex:'metal', m:.4, metal:.75, rough:.3}), mc = mat('#c9532f', {rough:.6});
    const y = .06;
    caixa(1.0, .1, .17, mm, {pai:c, nome:'cabo', pos:[-.1, y, 0]}); caixa(.5, .1, .2, mc, {pai:c, pos:[-.5, y, 0]}); caixa(.12, .1, .24, mm, {pai:c, pos:[-.98, y, 0]});
    caixa(.46, .1, .5, mm, {pai:c, nome:'cabeca', pos:[.6, y, 0]});
    caixa(.46, .12, .17, mm, {pai:c, nome:'mandibula_fixa', pos:[.74, y, .17]});
    caixa(.46, .12, .17, mm, {pai:c, nome:'mandibula', pos:[.74, y, -.17]});
    cil(.07, .14, mat('#6b7580', {tex:'metal', m:.3, metal:.6}), {pai:c, nome:'parafuso', pos:[.47, y + .02, -.03], lados:10});
    return {obj:g, dim:[1.7*s, .22*s, .6*s], ancoras:{boca:[.85*s, y, 0], cabo:[-.8*s, y, 0]}};
  }});
})();
