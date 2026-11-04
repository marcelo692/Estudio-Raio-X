/* =========================================================
   BIBLIOTECA · LOTE 4 (natureza e clima): 10 objetos
   nuvem, sol, raio, lago, montanha, rocha, cacto, flor, gelo, onda_mar
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H, {RP, gx, gy, gz, tinge, brilha, treme, pos} = LIB.U;

/* ---------- 31. nuvem ---------- */
LIB.registrar({id:'nuvem', nome:'Nuvem', lote:4, categoria:'clima',
  descricao:'nuvem low poly (origem na base); flutua, escurece, chove e solta trovão',
  params:{cor:{padrao:'#f4f6fa'}, tamanho:{padrao:1, desc:'escala'}},
  animacoes:{flutuar:{desc:'flutua devagar (contínuo)', loop:true, dur:5, aplicar(p, t){ pos(p.corpo, Math.sin(t*.5)*.12, Math.sin(t*.9)*.05, 0); }},
             escurecer:{desc:'fica cinza escura de tempestade', dur:1.5, aplicar(p, t){ tinge(p.corpo, '#4b5563', suave(t/1.5)*.9); }},
             chover:{desc:'chove (contínuo) e a nuvem escurece', loop:true, dur:2, aplicar(p, t){ tinge(p.corpo, '#4b5563', .75); p.gotas.children.forEach((d, i) => { const u = (t*.9 + i*.137) % 1; d.scale.setScalar(1); d.position.set(RP(d).p.x, -u*1.9 + .05, RP(d).p.z); }); }},
             trovejar:{desc:'clarão de trovão: a nuvem pisca e treme', dur:1.2, aplicar(p, t){ const f = (t < .1 || (t > .25 && t < .38)) ? 1 : 0; tinge(p.corpo, '#4b5563', .8); brilha(p.corpo, '#fff6c8', 1.4*f); treme(p.corpo, t, .015*Math.max(0, 1 - t/1.1)); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, c = grupo({pai:g, nome:'corpo', esc:s}), m = mat(P.cor, {rough:.9});
    [[0,.35,0,.34],[.4,.3,.05,.28],[-.4,.28,0,.26],[.15,.52,.05,.3],[-.15,.5,-.05,.26],[.62,.22,0,.18],[-.62,.2,0,.17]].forEach(([x, y, z, r]) => esfera(r, m, {pai:c, pos:[x, y, z], det:1, esc:[1.15, .8, 1]}));
    const go = grupo({pai:g, nome:'gotas', esc:s}); const mg = mat('#6bb7ff', {rough:.3});
    for(let i = 0; i < 14; i++) caixa(.03, .12, .03, mg, {pai:go, pos:[(i%7 - 3)*.16 + (i > 6 ? .08 : 0), -.5, ((i*37)%5 - 2)*.06], esc:.001});
    return {obj:g, dim:[1.6*s, .9*s, .8*s], ancoras:{base:[0, .1*s, 0], topo:[0, .8*s, 0]}};
  }});

/* ---------- 32. sol ---------- */
LIB.registrar({id:'sol', nome:'Sol', lote:4, categoria:'clima',
  descricao:'sol low poly com raios (origem no centro); gira os raios, pulsa e esquenta ficando vermelho',
  params:{cor:{padrao:'#ffcb2e'}, tamanho:{padrao:1}},
  animacoes:{girar:{desc:'os raios giram (contínuo)', loop:true, dur:6, aplicar(p, t){ gz(p.raios, t*.35); }},
             pulsar:{desc:'pulsa brilhando (contínuo)', loop:true, dur:2, aplicar(p, t){ const k = 1 + .06*Math.sin(t*4); p.disco.scale.setScalar(k); gz(p.raios, t*.35); brilha(p.disco, '#ffb300', .5 + .3*Math.sin(t*4)); }},
             esquentar:{desc:'fica laranja/vermelho e cresce (calor extremo)', dur:2.5, aplicar(p, t){ const k = suave(t/2.5); tinge(p.disco, '#ff3b1f', k); tinge(p.raios, '#ff6a1f', k); p.disco.scale.setScalar(1 + .25*k); gz(p.raios, t*.6); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, c = grupo({pai:g, esc:s, pos:[0, .85*s, 0]}), mc = mat(P.cor, {brilho:.5, rough:.5});
    esfera(.4, mc, {pai:c, nome:'disco', det:2});
    const ra = grupo({pai:c, nome:'raios'}), mr = mat('#ffb300', {brilho:.4}); for(let i = 0; i < 12; i++){ const a = i*30; cone(.09, .3, mr, {pai:ra, pos:[Math.cos(rad(a))*.68, Math.sin(rad(a))*.68, 0], rot:[0, 0, a - 90], lados:4}); }
    return {obj:g, dim:[1.6*s, 1.6*s, .8*s], ancoras:{centro:[0, .85*s, 0]}};
  }});

/* ---------- 33. raio ---------- */
LIB.registrar({id:'raio', nome:'Raio (relâmpago)', lote:4, categoria:'clima',
  descricao:'relâmpago em zigue-zague brilhante (a ponta de cima na origem, desce para -y); cai com clarão',
  params:{comprimento:{padrao:3}, cor:{padrao:'#fff27a'}},
  animacoes:{cair:{desc:'o raio desce rápido com clarões e some', dur:.9, aplicar(p, t){ const k = saida(t/.18), f = t < .55 ? (Math.sin(t*90) > -.2 ? 1 : .25) : Math.max(0, 1 - (t - .55)/.3); p.bolt.scale.y = Math.max(.001, k); p.bolt.scale.x = p.bolt.scale.z = 1; brilha(p.bolt, '#fff7a0', 3*f); p.bolt.visible = f > .02; }},
             piscar:{desc:'pisca (contínuo)', loop:true, dur:2, aplicar(p, t){ const f = (Math.sin(t*17) > .3) ? 1 : 0; p.bolt.visible = f > 0; brilha(p.bolt, '#fff7a0', 3*f); }}},
  criar(P){
    const g = grupo(), L = P.comprimento, b = grupo({pai:g, nome:'bolt', pos:[0, L, 0]}), mb = mat(P.cor, {brilho:2.2, rough:.2}); let x = 0, y = 0, n = 7, seg = L/n;
    for(let i = 0; i < n; i++){ const dx = (i%2 ? -1 : 1)*(.28 + .06*(i%3)); const len = Math.hypot(dx, seg), a = Math.atan2(dx, seg); caixa(.09, len*1.05, .09, mb, {pai:b, pos:[x + dx/2, -(y + seg/2), 0], rot:[0, 0, a*57.2958]}); x += dx; y += seg; }
    return {obj:g, dim:[.9, L, .2], ancoras:{ponta:[x, 0, 0], topo:[0, L, 0]}};
  }});

/* ---------- 34. lago ---------- */
LIB.registrar({id:'lago', nome:'Lago', lote:4, categoria:'natureza',
  descricao:'lago redondo com margem de areia e pedras; ondas se espalham ao cair algo',
  params:{raio:{padrao:1.6}, cor:{padrao:'#3d9bd8'}},
  animacoes:{ondular:{desc:'ondas suaves (contínuo)', loop:true, dur:4, aplicar(p, t){ p.agua.scale.y = 1 + .25*Math.sin(t*2); ondas(p, t, 1.2); }},
             respingo:{desc:'algo cai no centro e as ondas se espalham', dur:2.4, aplicar(p, t){ ondas(p, t, 1, true); p.agua.position.y = RP(p.agua).p.y + .03*Math.exp(-3*t)*Math.cos(t*20); }}},
  criar(P){
    const g = grupo(), r = P.raio; g.userData.r = r; const ma = mat('#d9c58c', {tex:'terra', m:.8}), ag = mat(P.cor, {tex:'agua', m:1.2, vidro:.88, rough:.2});
    cil(r + .35, .12, ma, {pai:g, pos:[0, .06, 0], lados:20}); cil(r, .05, mat('#2a6aa0'), {pai:g, pos:[0, .125, 0], lados:20});
    cil(r - .02, .06, ag, {pai:g, nome:'agua', pos:[0, .15, 0], lados:20});
    const on = grupo({pai:g, nome:'ondas', pos:[0, .19, 0]}); for(let i = 0; i < 3; i++){ const t = new T3.Mesh(new T3.TorusGeometry(.3, .015, 4, 24), mat('#ffffff', {rough:.4})); t.rotation.x = Math.PI/2; t.scale.setScalar(.001); on.add(t); }
    const mp = mat('#8a8f98', {tex:'pedra', m:.4}); for(let i = 0; i < 6; i++){ const a = i*1.05 + .4; esfera(.12 + (i%3)*.05, mp, {pai:g, pos:[Math.cos(a)*(r + .12), .14, Math.sin(a)*(r + .12)], det:0, esc:[1, .6, 1]}); }
    return {obj:g, dim:[(r + .35)*2, .3, (r + .35)*2], ancoras:{centro:[0, .2, 0], margem:[r, .15, 0]}};
  }});
function ondas(p, t, k, uma){ const on = p.ondas, R = on.parent.userData.r || 1.4; on.children.forEach((m, i) => { const u = uma ? clamp(t/2.2 - i*.18, 0, 1) : ((t*.3 + i/3) % 1); m.scale.setScalar(Math.max(.001, u*R*k*3.3)); m.material.opacity = 1; m.visible = u > 0 && u < 1; }); }

/* ---------- 35. montanha ---------- */
LIB.registrar({id:'montanha', nome:'Montanha', lote:4, categoria:'natureza',
  descricao:'montanha low poly de pedra com topo nevado e pico secundário; pode tremer ou soltar neve (avalanche)',
  params:{altura:{padrao:3}, base:{padrao:4, desc:'largura da base'}, neve:{padrao:'sim', opcoes:['sim','nao']}},
  animacoes:{tremer:{desc:'treme', dur:1.6, aplicar(p, t){ const k = Math.max(0, 1 - t/1.6); treme(p.corpo, t, .03*k); }},
             avalanche:{desc:'a neve do topo desliza encosta abaixo e some', dur:2.2, aplicar(p, t){ const k = suave(t/2); if(p.neve){ pos(p.neve, k*.9, -k*1.4, k*.5); p.neve.scale.setScalar(Math.max(.001, 1 - .8*k)); } treme(p.corpo, t, .01*Math.max(0, 1 - t/1.5)); }}},
  criar(P){
    const g = grupo(), H = P.altura, B = P.base, c = grupo({pai:g, nome:'corpo'}), mp = mat('#7d8591', {tex:'pedra', m:1.2, rough:.95});
    cone(B/2, H, mp, {pai:c, pos:[0, H/2, 0], lados:7}); cone(B*.3, H*.62, mp, {pai:c, pos:[B*.38, H*.31, B*.12], lados:6, rot:[0, 20, 0]});
    if(P.neve !== 'nao'){ const nv = grupo({pai:g, nome:'neve', pos:[0, H*.74, 0]}); cone(B/2*.3, H*.26, mat('#f4f8fc', {rough:.8}), {pai:nv, pos:[0, H*.13, 0], lados:7}); cone(B/2*.3 + .02, .06, mat('#e6eef6'), {pai:nv, pos:[0, 0, 0], lados:7}); }
    return {obj:g, dim:[B*1.4, H, B*.9], ancoras:{pico:[0, H, 0], base:[0, 0, B/2]}};
  }});

/* ---------- 36. rocha ---------- */
LIB.registrar({id:'rocha', nome:'Rocha', lote:4, categoria:'natureza',
  descricao:'rocha grande low poly feita de 3 pedaços; rola ou se quebra',
  params:{tamanho:{padrao:1}, cor:{padrao:'#7b7f86'}},
  animacoes:{rolar:{desc:'a rocha rola para +x (args.dist em m, padrão 3)', dur:2, aplicar(p, t, a){ const d = (a.dist != null ? a.dist : 3)*suave(t/2), r = .5*p.corpo.userData.s; pos(p.corpo, d, 0, 0); gz(p.corpo, -d/r); }},
             quebrar:{desc:'a rocha racha e os pedaços se afastam', dur:1.2, aplicar(p, t){ const k = suave(t/1.2); [['pedaco_1', -.5, .1, .2], ['pedaco_2', .5, .3, -.1], ['pedaco_3', 0, -.0, .55]].forEach(([n, x, y, z]) => { pos(p[n], x*k, y*k*.6, z*k); gx(p[n], k*(x + .3)*1.4); }); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, c = grupo({pai:g, nome:'corpo', pos:[0, .5*s, 0]}), m = mat(P.cor, {tex:'pedra', m:.8, rough:1}); c.userData.s = s;
    esfera(.5*s, m, {pai:c, nome:'pedaco_1', pos:[-.15*s, 0, 0], det:1, esc:[1.1, .95, .9]}); esfera(.42*s, m, {pai:c, nome:'pedaco_2', pos:[.28*s, .08*s, .05*s], det:1}); esfera(.34*s, m, {pai:c, nome:'pedaco_3', pos:[0, -.04*s, .3*s], det:1});
    return {obj:g, dim:[1.2*s, 1*s, 1*s], ancoras:{topo:[0, 1*s, 0]}};
  }});

/* ---------- 37. cacto ---------- */
LIB.registrar({id:'cacto', nome:'Cacto', lote:4, categoria:'natureza',
  descricao:'cacto com dois braços e flor; floresce ou murcha (seca); boa imagem de deserto e seca',
  params:{altura:{padrao:1.4}},
  animacoes:{florescer:{desc:'a flor abre e cresce', dur:1.4, aplicar(p, t){ p.flor.scale.setScalar(Math.max(.001, saida(t/1.4))); }},
             murchar:{desc:'o cacto seca e fica amarelado', dur:2.2, aplicar(p, t){ const k = suave(t/2.2); tinge(p.corpo, '#a89a4a', k*.8); p.corpo.rotation.z = RP(p.corpo).r.z + k*.12; p.flor.scale.setScalar(Math.max(.001, 1 - k)); }}},
  criar(P){
    const g = grupo(), H = P.altura, c = grupo({pai:g, nome:'corpo'}), m = mat('#4f9a56', {rough:.8});
    cil(.2, H, m, {pai:c, pos:[0, H/2, 0], rTopo:.17, lados:8}); esfera(.17, m, {pai:c, pos:[0, H, 0], det:1});
    [[-1, .5], [1, .7]].forEach(([s, y]) => { cil(.09, .32, m, {pai:c, pos:[s*.32, H*y, 0], rot:[0, 0, s*90], lados:7}); cil(.09, .45, m, {pai:c, pos:[s*.5, H*y + .22, 0], lados:7}); esfera(.09, m, {pai:c, pos:[s*.5, H*y + .45, 0], det:1}); });
    for(let i = 0; i < 14; i++){ const a = i*1.9, y = .1 + (i%7)*H/8; caixa(.015, .015, .08, mat('#f3ead0'), {pai:c, pos:[Math.cos(a)*.2, y, Math.sin(a)*.2], rot:[0, -a*57.3, 0]}); }
    const fl = grupo({pai:c, nome:'flor', pos:[0, H + .17, 0]}); for(let i = 0; i < 5; i++) caixa(.1, .1, .02, mat('#ff5fa2', {rough:.5}), {pai:fl, pos:[Math.cos(i*1.2566)*.07, .02, Math.sin(i*1.2566)*.07], rot:[40, i*72, 0]}); esfera(.04, mat('#ffd54a'), {pai:fl, det:0});
    return {obj:g, dim:[1.2, H + .4, .5], ancoras:{topo:[0, H + .2, 0]}};
  }});

/* ---------- 38. flor ---------- */
LIB.registrar({id:'flor', nome:'Flor', lote:4, categoria:'natureza',
  descricao:'flor com caule, folhas e 8 pétalas; abre, balança e murcha',
  params:{cor_petala:{padrao:'#ff5c8a'}, altura:{padrao:.9}},
  animacoes:{abrir:{desc:'o botão fechado se abre em flor', dur:1.5, aplicar(p, t){ const k = suave(t/1.5); for(let i = 0; i < 8; i++) p['petala_'+i].rotation.x = rad(-88 + 53*k); }},
             balancar:{desc:'balança ao vento (contínuo)', loop:true, dur:3, aplicar(p, t){ gz(p.caule, .08*Math.sin(t*1.6)); }},
             murchar:{desc:'as pétalas caem para baixo e escurecem', dur:2.2, aplicar(p, t){ const k = suave(t/2.2); for(let i = 0; i < 8; i++) p['petala_'+i].rotation.x = rad(-35 + 70*k); tinge(p.petalas, '#7a5a3a', k*.8); gz(p.caule, .35*k); }}},
  criar(P){
    const g = grupo(), H = P.altura, c = grupo({pai:g, nome:'caule'}), mv = mat('#3f8f46', {rough:.8});
    cil(.025, H, mv, {pai:c, pos:[0, H/2, 0], lados:6}); caixa(.22, .02, .1, mv, {pai:c, pos:[.12, H*.3, 0], rot:[0, 0, 25]}); caixa(.22, .02, .1, mv, {pai:c, pos:[-.12, H*.45, 0], rot:[0, 0, -25]});
    const pt = grupo({pai:c, nome:'petalas', pos:[0, H, 0]}); for(let i = 0; i < 8; i++){ const pe = grupo({pai:pt, rot:[0, i*45, 0]}); const b = grupo({pai:pe, nome:'petala_'+i, rot:[-35, 0, 0]}); caixa(.12, .02, .24, mat(P.cor_petala, {rough:.6}), {pai:b, pos:[0, 0, .14]}); }
    esfera(.07, mat('#ffd54a'), {pai:pt, pos:[0, .02, 0], det:1});
    return {obj:g, dim:[.6, H + .2, .6], ancoras:{topo:[0, H, 0]}};
  }});

/* ---------- 39. gelo ---------- */
LIB.registrar({id:'gelo', nome:'Bloco de gelo', lote:4, categoria:'natureza',
  descricao:'bloco de gelo translúcido com cristais menores; derrete virando poça',
  params:{tamanho:{padrao:1}},
  animacoes:{derreter:{desc:'o gelo derrete e a poça cresce', dur:3, aplicar(p, t){ const k = suave(t/3); p.bloco.scale.set(1 + .15*k, Math.max(.05, 1 - .92*k), 1 + .15*k); p.cristais.scale.setScalar(Math.max(.001, 1 - k)); p.poca.scale.setScalar(.2 + 1.6*k); }},
             tremer:{desc:'trinca e treme', dur:1, aplicar(p, t){ treme(p.bloco, t, .012*Math.max(0, 1 - t)); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, mg = mat('#bfeaff', {vidro:.62, rough:.1}), bl = grupo({pai:g, nome:'bloco', esc:s});
    caixa(.8, .7, .7, mg, {pai:bl, pos:[0, .35, 0], rot:[0, 15, 0]}); caixa(.5, .4, .5, mg, {pai:bl, pos:[.1, .75, -.05], rot:[0, -10, 0]});
    const cr = grupo({pai:g, nome:'cristais', esc:s}); [[.6, .18, .3, 30], [-.55, .2, .35, -20]].forEach(([x, y, z, r]) => { cone(.12, .45, mg, {pai:cr, pos:[x, .22, z], lados:5, rot:[0, 0, r]}); });
    const po = cil(.55, .02, mat('#8fd0f0', {vidro:.6, rough:.1}), {pai:g, nome:'poca', pos:[0, .012, 0], lados:16, esc:.2}); po.receiveShadow = true;
    return {obj:g, dim:[1.2*s, 1*s, 1.2*s], ancoras:{topo:[0, .95*s, 0]}};
  }});

/* ---------- 40. onda_mar ---------- */
LIB.registrar({id:'onda_mar', nome:'Mar com ondas', lote:4, categoria:'natureza',
  descricao:'trecho de mar com cristas de ondas 3D, serve de cenário de tempestade/furacão; as ondas sobem e descem',
  params:{largura:{padrao:5}, profundidade:{padrao:3}, cor:{padrao:'#2f86c4'}},
  animacoes:{ondular:{desc:'ondas sobem e descem (contínuo); args.intensidade 1=normal, 2=tempestade', loop:true, dur:5, aplicar(p, t, a){ const k = a.intensidade || 1; p.mar.children.forEach((o, i) => { o.position.y = RP(o).p.y + (.12*Math.sin(t*1.6 + i*.9) + .05*Math.sin(t*3.1 + i))*k; o.rotation.z = RP(o).r.z + .08*Math.sin(t*1.3 + i)*k; }); }}},
  criar(P){
    const g = grupo(), W = P.largura, D = P.profundidade, m = mat(P.cor, {tex:'agua', m:1.5, vidro:.95, rough:.25}), mm = grupo({pai:g, nome:'mar'}), n = 6;
    caixa(W, .3, D, mat('#1f5f96'), {pai:g, pos:[0, -.1, 0]});
    for(let i = 0; i < n; i++) for(let j = 0; j < 2; j++){ const w = W/n; caixa(w*.98, .22, D/2*.96, m, {pai:mm, pos:[-W/2 + w*(i + .5), .06, (j - .5)*D/2], rot:[0, 0, 0]}); }
    for(let i = 0; i < 5; i++) esfera(.16, mat('#ffffff', {rough:.8}), {pai:g, pos:[-W/2 + (i + .5)*W/5 + (i%2)*.2, .2, (i%3 - 1)*D*.25], det:0, esc:[1.3, .5, 1]});
    return {obj:g, dim:[W, .4, D], ancoras:{superficie:[0, .2, 0]}};
  }});
})();
