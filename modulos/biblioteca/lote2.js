/* =========================================================
   BIBLIOTECA · LOTE 2 (mecânica e fluidos): 10 objetos
   engrenagem, motor, turbina, valvula, bomba, tubo_curvo, caixa_dagua, gerador, polia, mola
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, suave, saida, prog, tom} = LIB.H;
const RP = o => o.userData.rest;
const gz = (o, a) => { o.rotation.z = RP(o).r.z + a; };
const gx = (o, a) => { o.rotation.x = RP(o).r.x + a; };
const gy = (o, a) => { o.rotation.y = RP(o).r.y + a; };
const tinge = (o, hex, k) => o.traverse(m => { if(m.isMesh){ if(!m.material.userData.cor0) m.material.userData.cor0 = m.material.color.clone(); m.material.color.copy(m.material.userData.cor0).lerp(new T3.Color(hex), k); } });
const brilha = (o, hex, k) => o.traverse(m => { if(m.isMesh && m.material.emissive){ m.material.emissive.set(hex); m.material.emissiveIntensity = k; } });
const sacode = (o, t, dur, amp) => { const k = Math.max(0, 1 - t/dur)*amp, r = RP(o); o.position.x = r.p.x + Math.sin(t*58)*k; o.position.y = r.p.y + Math.sin(t*47 + 1)*k*.5; };
const treme = (o, t, amp) => { const r = RP(o); o.position.x = r.p.x + Math.sin(t*61)*amp; o.position.y = r.p.y + Math.sin(t*53 + 1)*amp*.6; };
const V = {desc:'velocidade (1 = normal)'};

/* ---------- 11. engrenagem ---------- */
LIB.registrar({id:'engrenagem', nome:'Engrenagem', lote:2, categoria:'mecânica',
  descricao:'engrenagem de metal em pé (eixo para a câmera); gira e pode travar. Use duas lado a lado com sentidos opostos',
  params:{dentes:{padrao:12, desc:'número de dentes'}, raio:{padrao:.5, desc:'raio em m'}, cor:{padrao:'#8d98a6'}},
  animacoes:{girar:{desc:'gira continuamente; args.velocidade (negativo = sentido contrário)', loop:true, dur:4, aplicar(p, t, a){ gz(p.roda, t*1.5*(a.velocidade != null ? a.velocidade : 1)); }},
             travar:{desc:'gira e trava de repente, tremendo', dur:1.6, aplicar(p, t){ const k = saida(t/.7); gz(p.roda, 1.2*k); if(t > .7) treme(p.roda, t, .012*Math.max(0, 1 - (t - .7)/.9)); tinge(p.roda, '#e5565b', suave((t - .7)/.4)*.6); }}},
  criar(P){
    const g = grupo(), r = P.raio, n = Math.max(6, Math.round(P.dentes)), m = mat(P.cor, {tex:'metal', m:.5, metal:.5, rough:.5}), e = .16;
    const roda = grupo({pai:g, nome:'roda', pos:[0, r*1.12, 0]});
    cil(r*.86, e, m, {pai:roda, rot:[90, 0, 0], lados:24});
    for(let i = 0; i < n; i++){ const a = i/n*Math.PI*2; caixa(r*.2, r*.26, e, m, {pai:roda, pos:[Math.cos(a)*r*.96, Math.sin(a)*r*.96, 0], rot:[0, 0, a*180/Math.PI + 90]}); }
    cil(r*.3, e + .04, mat('#4a525d', {tex:'metal', m:.5, metal:.6}), {pai:roda, rot:[90, 0, 0], lados:16});
    cil(r*.12, e + .08, mat('#222831'), {pai:roda, rot:[90, 0, 0], lados:10});
    for(let i = 0; i < 4; i++){ const a = i/4*Math.PI*2 + .4; cil(r*.1, e + .02, mat('#2e343d'), {pai:roda, pos:[Math.cos(a)*r*.58, Math.sin(a)*r*.58, 0], rot:[90, 0, 0], lados:10}); }
    return {obj:g, dim:[r*2.2, r*2.24, e + .1], ancoras:{centro:[0, r*1.12, 0], topo:[0, r*2.24, 0]}};
  }});

/* ---------- 12. motor ---------- */
LIB.registrar({id:'motor', nome:'Motor elétrico', lote:2, categoria:'mecânica',
  descricao:'motor elétrico com carcaça aletada, eixo e ventoinha (eixo ao longo de x)',
  params:{cor:{padrao:'#2f6fb0'}, tamanho:{padrao:1, desc:'escala geral'}},
  animacoes:{ligar:{desc:'liga: eixo e ventoinha giram e a carcaça vibra levemente (contínuo)', loop:true, dur:3, aplicar(p, t, a){ const v = a.velocidade != null ? a.velocidade : 1, k = saida(t/.8); gx(p.eixo, t*14*v*k); gx(p.ventoinha, t*14*v*k); treme(p.carcaca, t, .004*k); }},
             superaquecer:{desc:'esquenta: carcaça fica vermelha e vibra forte', dur:3, aplicar(p, t){ const k = suave(t/2.2); gx(p.eixo, t*18); gx(p.ventoinha, t*18); treme(p.carcaca, t, .012 + .01*k); tinge(p.carcaca, '#ff3b1f', k*.85); }}},
  criar(P){
    const g = grupo(), s = P.tamanho, c = grupo({pai:g, esc:s}), mc = mat(P.cor, {tex:'metal', m:.6, metal:.4, rough:.55}), mg = mat('#9aa3ad', {tex:'metal', m:.5, metal:.6, rough:.45});
    caixa(1.1, .08, .6, mat('#353b44', {tex:'metal', m:.6}), {pai:c, pos:[0, .04, 0]});
    const car = grupo({pai:c, nome:'carcaca', pos:[0, .43, 0]});
    cil(.3, .8, mc, {pai:car, rot:[0, 0, 90], lados:14});
    for(let i = 0; i < 6; i++) cil(.335, .035, mc, {pai:car, pos:[-.3 + i*.12, 0, 0], rot:[0, 0, 90], lados:14});
    caixa(.34, .12, .3, mat('#cfd5db', {tex:'metal', m:.5}), {pai:car, pos:[.05, .34, 0]});
    caixa(.16, .1, .16, mat('#d9a441', {tex:'metal', m:.5}), {pai:car, pos:[.05, .45, 0]});
    cil(.31, .06, mg, {pai:car, pos:[.43, 0, 0], rot:[0, 0, 90], lados:14});
    cil(.045, .55, mg, {pai:c, nome:'eixo', pos:[.72, .43, 0], rot:[0, 0, 90], lados:8});
    const v = grupo({pai:c, nome:'ventoinha', pos:[-.5, .43, 0]}); cil(.07, .1, mg, {pai:v, rot:[0, 0, 90], lados:8}); for(let i = 0; i < 4; i++){ const a = i*90; caixa(.03, .5, .13, mat('#bfc7cf', {tex:'metal', m:.5}), {pai:v, pos:[0, Math.cos(rad(a))*.18, Math.sin(rad(a))*.18], rot:[a, 0, 0]}); }
    return {obj:g, dim:[1.6*s, .8*s, .6*s], ancoras:{eixo:[.95*s, .43*s, 0], topo:[0, .8*s, 0]}};
  }});

/* ---------- 13. turbina ---------- */
LIB.registrar({id:'turbina', nome:'Turbina eólica', lote:2, categoria:'energia',
  descricao:'turbina eólica de 3 pás (rotor virado para +z); gira com o vento, trava ou quebra',
  params:{altura:{padrao:4}, cor:{padrao:'#f1f3f5'}},
  animacoes:{girar:{desc:'gira (contínuo); args.velocidade 1=normal, 3=vento forte', loop:true, dur:4, aplicar(p, t, a){ gz(p.rotor, -t*2.4*(a.velocidade != null ? a.velocidade : 1)); }},
             parar:{desc:'freia até parar', dur:2, aplicar(p, t){ gz(p.rotor, -(1 - Math.pow(1 - clamp(t/2, 0, 1), 2))*4.8); }},
             quebrar:{desc:'uma pá se solta e o rotor desmorona', dur:2.5, aplicar(p, t){ const k = suave(t/1.6); gz(p.rotor, -t*6*(1 - k)); gx(p.rotor, rad(25)*k); p.rotor.position.y -= .6*k*k; }}},
  criar(P){
    const g = grupo(), H = P.altura, mb = mat(P.cor, {rough:.5});
    const torre = cil(.2, H, mb, {pai:g, rTopo:.11, pos:[0, H/2, 0], lados:12, nome:'torre'});
    const nac = grupo({pai:g, nome:'nacele', pos:[0, H + .12, 0]}); caixa(.3, .26, .6, mb, {pai:nac, pos:[0, 0, -.05]});
    const rot = grupo({pai:g, nome:'rotor', pos:[0, H + .12, .38]}); cone(.13, .26, mat('#cfd5da'), {pai:rot, rot:[90, 0, 0], lados:10, pos:[0, 0, .1]});
    for(let i = 0; i < 3; i++){ const a = i*120; const pa = grupo({pai:rot, rot:[0, 0, a]}); caixa(.08, 1.5, .02, mb, {pai:pa, pos:[0, .85, 0], rot:[0, 14, 0]}); }
    return {obj:g, dim:[3.2, H + 1, 1], ancoras:{topo:[0, H + .12, 0], rotor:[0, H + .12, .4]}};
  }});

/* ---------- 14. valvula ---------- */
LIB.registrar({id:'valvula', nome:'Válvula de registro', lote:2, categoria:'fluidos',
  descricao:'válvula de volante num cano horizontal; abre e fecha o fluxo',
  params:{cor:{padrao:'#b8452e'}, cano:{padrao:'#9aa3ad'}},
  animacoes:{fechar:{desc:'gira o volante e fecha (haste desce)', dur:1.4, aplicar(p, t){ const k = suave(t/1.4); gy(p.volante, rad(-540)*k); p.haste.position.y = RP(p.haste).p.y - .16*k; p.volante.position.y = RP(p.volante).p.y - .16*k; }},
             abrir:{desc:'gira o volante e abre', dur:1.4, aplicar(p, t){ const k = 1 - suave(t/1.4); gy(p.volante, rad(-540)*k); p.haste.position.y = RP(p.haste).p.y - .16*k; p.volante.position.y = RP(p.volante).p.y - .16*k; }}},
  criar(P){
    const g = grupo(), mc = mat(P.cano, {tex:'metal', m:.5, metal:.5, rough:.5}), mv = mat(P.cor, {tex:'metal', m:.5, metal:.3, rough:.5}), mm = mat('#c9a24a', {tex:'metal', m:.4, metal:.6});
    cil(.14, 1.6, mc, {pai:g, nome:'cano', pos:[0, .3, 0], rot:[0, 0, 90], lados:14});
    [-.7, .7].forEach(x => cil(.19, .1, mc, {pai:g, pos:[x, .3, 0], rot:[0, 0, 90], lados:14}));
    esfera(.26, mm, {pai:g, nome:'corpo', pos:[0, .3, 0], det:1}); cil(.13, .3, mm, {pai:g, pos:[0, .52, 0], lados:10});
    cil(.035, .3, mc, {pai:g, nome:'haste', pos:[0, .78, 0], lados:8});
    const vol = grupo({pai:g, nome:'volante', pos:[0, .95, 0]}); const ar = new T3.Mesh(new T3.TorusGeometry(.2, .03, 6, 14), mv); ar.rotation.x = Math.PI/2; ar.castShadow = true; vol.add(ar);
    for(let i = 0; i < 3; i++) caixa(.4, .03, .03, mv, {pai:vol, rot:[0, i*60, 0]});
    return {obj:g, dim:[1.6, 1.2, .5], ancoras:{entrada:[-.8, .3, 0], saida:[.8, .3, 0], volante:[0, .95, 0]}};
  }});

/* ---------- 15. bomba ---------- */
LIB.registrar({id:'bomba', nome:'Bomba d\'água', lote:2, categoria:'fluidos',
  descricao:'bomba centrífuga com motor, entrada à esquerda e saída para cima; vibra ao trabalhar',
  params:{cor:{padrao:'#2f8f6a'}},
  animacoes:{bombear:{desc:'trabalhando: vibra e a hélice interna gira (contínuo)', loop:true, dur:3, aplicar(p, t){ treme(p.corpo, t, .006); treme(p.motor, t, .006); gz(p.rotor, t*16); }},
             falhar:{desc:'engasga, vibra forte e para', dur:2.4, aplicar(p, t){ const k = Math.max(0, 1 - t/2.4); treme(p.corpo, t, .02*k); treme(p.motor, t, .02*k); gz(p.rotor, 12*Math.sqrt(t)); tinge(p.motor, '#e5565b', suave(t/1.5)*.6); }}},
  criar(P){
    const g = grupo(), mc = mat(P.cor, {tex:'metal', m:.6, metal:.35, rough:.5}), mg = mat('#9aa3ad', {tex:'metal', m:.5, metal:.55}), md = mat('#2d333b');
    caixa(1.5, .08, .6, md, {pai:g, pos:[0, .04, 0]});
    const motor = grupo({pai:g, nome:'motor', pos:[.38, .42, 0]}); cil(.27, .65, mc, {pai:motor, rot:[0, 0, 90], lados:14}); for(let i = 0; i < 4; i++) cil(.3, .03, mc, {pai:motor, pos:[-.2 + i*.13, 0, 0], rot:[0, 0, 90], lados:14});
    const corpo = grupo({pai:g, nome:'corpo', pos:[-.35, .45, 0]}); cil(.34, .24, mg, {pai:corpo, rot:[90, 0, 0], lados:16});
    const rot = grupo({pai:g, nome:'rotor', pos:[-.35, .45, .15]}); cil(.2, .03, mat('#cfd5db', {tex:'metal'}), {pai:rot, rot:[90, 0, 0], lados:12}); for(let i = 0; i < 5; i++) caixa(.04, .17, .02, mat('#6b7580'), {pai:rot, pos:[Math.cos(i*1.2566)*.1, Math.sin(i*1.2566)*.1, .02], rot:[0, 0, i*72]});
    cil(.1, .5, mg, {pai:g, nome:'tubo_saida', pos:[-.35, .9, 0], lados:10}); cil(.14, .06, mg, {pai:g, pos:[-.35, 1.15, 0], lados:10});
    cil(.1, .4, mg, {pai:g, nome:'tubo_entrada', pos:[-.78, .45, 0], rot:[0, 0, 90], lados:10}); cil(.14, .06, mg, {pai:g, pos:[-.98, .45, 0], rot:[0, 0, 90], lados:10});
    return {obj:g, dim:[1.5, 1.2, .6], ancoras:{entrada:[-1, .45, 0], saida:[-.35, 1.2, 0]}};
  }});

/* ---------- 16. tubo_curvo ---------- */
LIB.registrar({id:'tubo_curvo', nome:'Tubo em L com fluxo', lote:2, categoria:'fluidos',
  descricao:'cano em L (horizontal e depois sobe) com gotas de fluido que correm dentro; serve para mostrar caminho de água, gás ou fio',
  params:{comprimento:{padrao:1.6}, cor:{padrao:'#8d98a6'}, cor_fluido:{padrao:'#3fa7ff'}},
  animacoes:{fluir:{desc:'o fluido corre pelo cano (contínuo); args.velocidade', loop:true, dur:3, aplicar(p, t, a){ const v = a.velocidade != null ? a.velocidade : 1, L = p.fluido.userData.L, n = p.fluido.children.length; p.fluido.children.forEach((d, i) => { const u = (((i/n) + t*.25*v) % 1)*2*L, r = p.fluido.userData.r; if(u < L) d.position.set(-L/2 + u, r, 0); else d.position.set(L/2, r + (u - L), 0); }); }},
             vazar:{desc:'o cano racha na curva e o fluido jorra', dur:2, aplicar(p, t){ const k = suave(t/.6); p.fluido.children.forEach((d, i) => { d.position.z += k*Math.sin(i*1.7)*.12; }); tinge(p.cano, '#6b4a2c', k*.4); }}},
  criar(P){
    const g = grupo(), L = P.comprimento, r = .13, mc = mat(P.cor, {tex:'metal', m:.5, metal:.5, rough:.5}), cano = grupo({pai:g, nome:'cano'});
    cil(r, L, mc, {pai:cano, pos:[0, r, 0], rot:[0, 0, 90], lados:12}); cil(r, L, mc, {pai:cano, pos:[L/2, r + L/2, 0], lados:12}); esfera(r*1.25, mc, {pai:cano, pos:[L/2, r, 0], det:1});
    [-L/2, L/2].forEach((x, i) => cil(r*1.3, .07, mc, {pai:cano, pos:i ? [L/2, r + L, 0] : [x, r, 0], rot:i ? [0, 0, 0] : [0, 0, 90], lados:12}));
    const fl = grupo({pai:g, nome:'fluido'}); fl.userData.L = L; fl.userData.r = r; const mf = mat(P.cor_fluido, {brilho:.5, rough:.3});
    for(let i = 0; i < 8; i++) esfera(r*.55, mf, {pai:fl, pos:[-L/2 + i/8*L, r, 0], det:1});
    return {obj:g, dim:[L + .3, L + .3, .4], ancoras:{inicio:[-L/2, r, 0], curva:[L/2, r, 0], fim:[L/2, r + L, 0]}};
  }});

/* ---------- 17. caixa_dagua ---------- */
LIB.registrar({id:'caixa_dagua', nome:'Caixa d\'água', lote:2, categoria:'fluidos',
  descricao:'caixa d\'água cilíndrica em torre, com parede translúcida e água visível; enche e esvazia',
  params:{cor:{padrao:'#3b82c4'}, nivel:{padrao:.6, desc:'nível inicial 0..1'}},
  animacoes:{encher:{desc:'o nível sobe até cheio', dur:2.5, aplicar(p, t, a){ const k = suave(t/2.5), n = P0(p) + (1 - P0(p))*k; nivel(p, n); }},
             esvaziar:{desc:'o nível desce até quase vazio', dur:2.5, aplicar(p, t){ const k = suave(t/2.5), n = P0(p)*(1 - k) + .05*k; nivel(p, n); }}},
  criar(P){
    const g = grupo(), R = .7, h = 1.1, y0 = 1.5, mp = mat('#8a8f96', {tex:'concreto', m:.5});
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a, b]) => cil(.07, y0, mp, {pai:g, pos:[a*.5, y0/2, b*.5], lados:8}));
    caixa(1.3, .08, .08, mp, {pai:g, pos:[0, .7, .5]}); caixa(1.3, .08, .08, mp, {pai:g, pos:[0, .7, -.5]});
    const tq = grupo({pai:g, nome:'tanque', pos:[0, y0, 0]}); cil(R, h, mat(P.cor, {vidro:.38, rough:.2}), {pai:tq, pos:[0, h/2, 0], lados:20}); cil(R + .01, .06, mat('#2d5f95'), {pai:tq, pos:[0, .03, 0], lados:20});
    const ag = cil(R - .04, h - .1, mat('#4db4ff', {tex:'agua', m:1, vidro:.8}), {pai:g, nome:'agua', pos:[0, y0 + .08 + (h - .1)/2, 0], lados:20});
    ag.userData.h = h - .1; ag.userData.y = y0 + .08;
    cil(R + .03, .08, mat('#2d5f95'), {pai:tq, nome:'tampa', pos:[0, h + .02, 0], lados:20}); cil(.07, .4, mat('#9aa3ad', {tex:'metal'}), {pai:g, pos:[R*.5, y0 - .15, 0], lados:8});
    nivel({agua:ag}, P.nivel); ag.userData.rest = null; ag.userData.n0 = P.nivel;
    return {obj:g, dim:[1.5, y0 + h + .1, 1.5], ancoras:{topo:[0, y0 + h, 0], saida:[R*.5, y0 - .35, 0], agua:[0, y0 + h*.5, 0]}};
  }});
function P0(p){ return p.agua.userData.n0; }
function nivel(p, n){ const a = p.agua; n = clamp(n, .02, 1); a.scale.y = n; a.position.y = a.userData.y + a.userData.h*n/2; }

/* ---------- 18. gerador ---------- */
LIB.registrar({id:'gerador', nome:'Gerador (ímã e bobina)', lote:2, categoria:'energia',
  descricao:'gerador didático em corte: ímã (vermelho/azul) gira dentro de bobinas de cobre e acende; mostra como se produz eletricidade',
  params:{},
  animacoes:{girar:{desc:'o ímã gira e as bobinas brilham (contínuo); args.velocidade', loop:true, dur:4, aplicar(p, t, a){ const v = a.velocidade != null ? a.velocidade : 1, ang = t*5*v; gx(p.rotor, ang); gx(p.manivela, ang); brilha(p.bobina, '#ffd54a', .35 + .35*Math.abs(Math.sin(ang))); }},
             parar:{desc:'o ímã desacelera e a luz apaga', dur:1.8, aplicar(p, t){ const k = clamp(t/1.8, 0, 1), ang = (1 - Math.pow(1 - k, 2))*8; gx(p.rotor, ang); gx(p.manivela, ang); brilha(p.bobina, '#ffd54a', .6*(1 - k)); }}},
  criar(P){
    const g = grupo(), mm = mat('#454c56', {tex:'metal', m:.6, metal:.4}), mcu = mat('#c4763a', {tex:'metal', m:.3, metal:.7, rough:.4, brilho:0});
    caixa(1.5, .1, .8, mm, {pai:g, pos:[0, .05, 0]}); [-.55, .55].forEach(x => caixa(.12, .9, .12, mm, {pai:g, pos:[x, .55, -.3]}));
    const bob = grupo({pai:g, nome:'bobina', pos:[0, .65, 0]});
    [-.35, .35].forEach(x => { const b = cil(.38, .3, mcu, {pai:bob, pos:[x, 0, 0], rot:[0, 0, 90], lados:16}); cil(.3, .32, mat('#1f242b'), {pai:bob, pos:[x, 0, 0], rot:[0, 0, 90], lados:16}); });
    const rot = grupo({pai:g, nome:'rotor', pos:[0, .65, 0]}); caixa(.9, .22, .22, mat('#d63c3c', {rough:.5}), {pai:rot, pos:[0, .11, 0]}); caixa(.9, .22, .22, mat('#3c6fd6', {rough:.5}), {pai:rot, pos:[0, -.11, 0]}); cil(.04, 1.5, mat('#9aa3ad', {tex:'metal'}), {pai:rot, rot:[0, 0, 90], lados:8});
    const man = grupo({pai:g, nome:'manivela', pos:[.78, .65, 0]}); caixa(.05, .5, .05, mm, {pai:man, pos:[0, .22, 0]}); cil(.05, .16, mat('#c9a24a'), {pai:man, pos:[0, .5, .09], rot:[90, 0, 0], lados:8});
    return {obj:g, dim:[1.7, 1.1, .8], ancoras:{bobina:[0, .65, 0], saida:[-.78, .65, 0]}};
  }});

/* ---------- 19. polia ---------- */
LIB.registrar({id:'polia', nome:'Polia com peso', lote:2, categoria:'mecânica',
  descricao:'polia fixa num suporte: de um lado a corda tem um peso, do outro uma alça para puxar; mostra como puxar para baixo levanta o peso',
  params:{raio:{padrao:.28}, altura:{padrao:2}},
  animacoes:{puxar:{desc:'puxa a corda para baixo (args.dist em m, padrão .8) e o peso sobe', dur:2, aplicar(p, t, a){ puxa(p, suave(t/2)*(a.dist != null ? a.dist : .8)); }},
             soltar:{desc:'solta a corda e o peso desce', dur:1.2, aplicar(p, t, a){ puxa(p, (1 - saida(t/1.2))*(a.dist != null ? a.dist : .8)); }}},
  criar(P){
    const g = grupo(), r = P.raio, Hh = P.altura, mm = mat('#59616c', {tex:'metal', m:.5, metal:.5}), mc = mat('#c9a96a', {tex:'tecido', m:.3}), mr = mat('#8d98a6', {tex:'metal', m:.5, metal:.5});
    caixa(1.2, .1, .8, mm, {pai:g, pos:[0, .05, 0]}); cil(.06, Hh, mm, {pai:g, pos:[-.5, Hh/2, 0], lados:8}); caixa(1.1, .08, .08, mm, {pai:g, pos:[-.5 + .55 - .03, Hh, 0]});
    const cx = 0, cy = Hh - .35;
    const roda = grupo({pai:g, nome:'roda', pos:[cx, cy, 0]}); const tor = new T3.Mesh(new T3.TorusGeometry(r, .05, 6, 18), mr); tor.castShadow = true; roda.add(tor); cil(r*.9, .06, mr, {pai:roda, rot:[90, 0, 0], lados:16}); for(let i = 0; i < 3; i++) caixa(r*1.9, .04, .08, mm, {pai:roda, rot:[0, 0, i*60]});
    caixa(.04, .35, .04, mm, {pai:g, pos:[cx, Hh - .17, 0]});
    const Ls = 1.0, Lr = .9; g.userData.pol = {r, cy, Ls, Lr};
    const ce = cil(.015, Ls, mc, {pai:g, nome:'corda_peso', pos:[cx - r, cy - Ls/2, 0], lados:5}); ce.userData.L = Ls;
    const cd = cil(.015, Lr, mc, {pai:g, nome:'corda_mao', pos:[cx + r, cy - Lr/2, 0], lados:5}); cd.userData.L = Lr;
    caixa(.34, .34, .34, mat('#6b7078', {tex:'bloco', m:.5}), {pai:g, nome:'peso', pos:[cx - r, cy - Ls - .17, 0]});
    cil(.05, .24, mat('#d9a441'), {pai:g, nome:'alca', pos:[cx + r, cy - Lr - .02, 0], rot:[0, 0, 90], lados:8});
    return {obj:g, dim:[1.2, Hh + .1, .8], ancoras:{peso:[cx - r, cy - Ls - .17, 0], alca:[cx + r, cy - Lr, 0], topo:[cx, Hh, 0]}};
  }});
function puxa(p, d){
  const pl = p.roda.parent.userData.pol, rp = RP(p.corda_peso), rm = RP(p.corda_mao);
  gz(p.roda, d/pl.r);
  p.peso.position.y = RP(p.peso).p.y + d;
  p.corda_peso.scale.y = (pl.Ls - d)/pl.Ls; p.corda_peso.position.y = pl.cy - (pl.Ls - d)/2;
  p.corda_mao.scale.y = (pl.Lr + d)/pl.Lr; p.corda_mao.position.y = pl.cy - (pl.Lr + d)/2;
  p.alca.position.y = RP(p.alca).p.y - d;
}

/* ---------- 20. mola ---------- */
LIB.registrar({id:'mola', nome:'Mola com bloco', lote:2, categoria:'mecânica',
  descricao:'mola helicoidal em pé sobre uma base, com bloco em cima; comprime, estica e oscila',
  params:{cor:{padrao:'#c9ced6'}, altura:{padrao:1}},
  animacoes:{comprimir:{desc:'o bloco empurra a mola para baixo e ela comprime', dur:1.2, aplicar(p, t){ mola(p, 1 - .55*suave(t/1.2)); }},
             oscilar:{desc:'sobe e desce como mola (contínuo)', loop:true, dur:3, aplicar(p, t){ mola(p, 1 + .25*Math.sin(t*7)); }},
             quicar:{desc:'comprime e solta, balançando até parar', dur:2.4, aplicar(p, t){ mola(p, 1 - .5*Math.exp(-1.6*t)*Math.cos(t*9)); }}},
  criar(P){
    const g = grupo(), L = P.altura, mb = mat('#59616c', {tex:'metal', m:.5, metal:.5}), ms = mat(P.cor, {tex:'metal', m:.3, metal:.7, rough:.35});
    caixa(.9, .1, .9, mb, {pai:g, pos:[0, .05, 0]});
    const pts = [], voltas = 7, rr = .22; for(let i = 0; i <= voltas*24; i++){ const a = i/24*Math.PI*2; pts.push(new T3.Vector3(Math.cos(a)*rr, i/(voltas*24)*L, Math.sin(a)*rr)); }
    const geo = new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), voltas*24*2, .035, 6, false); const mo = new T3.Mesh(geo, ms); mo.castShadow = true; mo.position.y = .1; mo.userData.parte = 'mola'; g.add(mo);
    const t = caixa(.7, .2, .7, mat('#d9a441', {tex:'metal', m:.4}), {pai:g, nome:'bloco', pos:[0, .1 + L + .12, 0]}); t.userData.L = L;
    return {obj:g, dim:[.9, L + .45, .9], ancoras:{topo:[0, L + .32, 0]}};
  }});
function mola(p, s){ p.mola.scale.y = s; const L = p.bloco.userData.L; p.bloco.position.y = RP(p.bloco).p.y - L*(1 - s); }
})();
