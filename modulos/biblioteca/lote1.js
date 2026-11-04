/* =========================================================
   BIBLIOTECA · LOTE 1 (cenário e construção): 10 objetos
   terreno_corte, casa_corte, sofa, mesa, arvore, palmeira, janela, porta, pilar_concreto, pessoa
   ========================================================= */
(function(){
'use strict';
const LIB = window.RAIOX_LIB, {T3, rad, clamp, mat, caixa, cil, cone, esfera, grupo, repouso, suave, saida, prog, tom} = LIB.H;
const A = (partes, n) => partes[n];
const sacode = (partes, nomes, t, dur, amp) => { const k = Math.max(0, 1 - t/dur)*amp; nomes.forEach((n, i) => { const o = partes[n]; if(o){ o.position.x += Math.sin(t*58 + i*1.7)*k; o.position.y += Math.sin(t*47 + i)*k*.5; } }); };
const tinge = (o, hex, k) => o.traverse(m => { if(m.isMesh){ if(!m.material.userData.cor0) m.material.userData.cor0 = m.material.color.clone(); m.material.color.copy(m.material.userData.cor0).lerp(new T3.Color(hex), k); } });

/* ---------- parede com abertura (janela ou porta) ---------- */
function parede(len, h, e, matl, ab, opt){
  const g = grupo(opt);
  const peca = (x0, x1, y0, y1) => { if(x1 - x0 > .001 && y1 - y0 > .001) caixa(x1 - x0, y1 - y0, e, matl, {pai:g, pos:[(x0 + x1)/2 - len/2, (y0 + y1)/2, 0]}); };
  if(!ab){ peca(0, len, 0, h); return g; }
  const x0 = len/2 + ab.x - ab.w/2, x1 = x0 + ab.w, y0 = ab.y, y1 = ab.y + ab.h;
  peca(0, x0, 0, h); peca(x1, len, 0, h); peca(x0, x1, y1, h); peca(x0, x1, 0, y0);
  return g;
}

/* ---------- 1. terreno_corte ---------- */
LIB.registrar({id:'terreno_corte', nome:'Terreno em corte', lote:1, categoria:'cenário',
  descricao:'bloco de terreno visto em corte (grama, terra e rocha); a superfície fica em y=0 para apoiar construções',
  params:{largura:{padrao:6, desc:'largura em m'}, profundidade:{padrao:3, desc:'profundidade em m'}, alt_terra:{padrao:1.2, desc:'espessura da terra'}, alt_rocha:{padrao:.6, desc:'espessura da rocha'}, cor_grama:{padrao:'#5fa84a'}},
  animacoes:{tremer:{desc:'terremoto: treme as camadas', dur:2, aplicar(p, t){ sacode(p, ['grama','terra','rocha'], t, 2, .05); }}},
  criar(P){
    const g = grupo(), L = P.largura, D = P.profundidade, aT = P.alt_terra, aR = P.alt_rocha;
    caixa(L, .16, D, mat(P.cor_grama, {tex:'grama', m:1}), {pai:g, nome:'grama', pos:[0, -.08, 0]});
    caixa(L, aT, D, mat('#8a5a36', {tex:'terra', m:1.2}), {pai:g, nome:'terra', pos:[0, -.16 - aT/2, 0]});
    caixa(L, aR, D, mat('#6f7782', {tex:'pedra', m:1.5}), {pai:g, nome:'rocha', pos:[0, -.16 - aT - aR/2, 0]});
    return {obj:g, dim:[L, .16 + aT + aR, D], ancoras:{topo:[0,0,0], frente:[0,-.5,D/2], base:[0, -(.16 + aT + aR), 0], rocha_topo:[0, -.16 - aT, D/2]}};
  }});

/* ---------- 2. casa_corte ---------- */
const MAT_PAREDE = {madeira:['madeira', '#d9c89c', .8], bloco:['bloco', '#8e99a6', 1.2], concreto:['concreto', '#aaa9a3', 1.2], tijolo:['tijolo', '#b4573b', 1]};
LIB.registrar({id:'casa_corte', nome:'Casa em corte', lote:1, categoria:'construção',
  descricao:'casa aberta na frente (vista em corte) com piso, telhado de duas águas, janela e porta; dá para ver o interior',
  params:{material:{padrao:'madeira', opcoes:['madeira','bloco','concreto','tijolo'], desc:'material das paredes'}, largura:{padrao:4}, profundidade:{padrao:3}, altura:{padrao:2.4}, cor_telha:{padrao:'#c0482a'}, cor_parede:{padrao:'', desc:'opcional: sobrescreve a cor do material'}},
  animacoes:{
    abrir_porta:{desc:'a porta abre', dur:1.1, aplicar(p, t){ p.porta.rotation.y = p.porta.userData.rest.r.y + rad(-110)*suave(t/1.1); }},
    fechar_porta:{desc:'a porta fecha', dur:1.1, aplicar(p, t){ p.porta.rotation.y = p.porta.userData.rest.r.y + rad(-110)*(1 - suave(t/1.1)); }},
    quebrar_vidro:{desc:'o vidro da janela estoura', dur:.6, aplicar(p, t){ const k = suave(prog(t, .08, .3)); p.vidro.scale.setScalar(1 - k*.999); p.vidro.rotation.z += k*.4; }},
    voar_telhado:{desc:'o vento arranca o telhado', dur:3, aplicar(p, t){ const r = p.telhado.userData.rest, a = saida(t/3); p.telhado.position.set(r.p.x + 2.4*a, r.p.y + 4.2*a, r.p.z); p.telhado.rotation.z = r.r.z + rad(40)*a; p.telhado.rotation.x = r.r.x + rad(12)*a; }},
    tremer:{desc:'terremoto', dur:2, aplicar(p, t){ sacode(p, ['fundacao','piso','parede_fundo','parede_dir','parede_esq','empena_dir','empena_esq','telhado'], t, 2, .05); }}},
  criar(P){
    const g = grupo(), w = P.largura, d = P.profundidade, h = P.altura, e = .14, rise = .95;
    const [tx, cor, m] = MAT_PAREDE[P.material] || MAT_PAREDE.madeira, mw = mat(P.cor_parede || cor, {tex:tx, m});
    caixa(w + .4, .24, d + .4, mat('#9a9a96', {tex:'concreto', m:1.2}), {pai:g, nome:'fundacao', pos:[0, -.12, 0]});
    caixa(w - e*2, .05, d - e, mat('#d6d3cc', {tex:'piso', m:.7}), {pai:g, nome:'piso', pos:[0, .025, -e/2]});
    const y0 = .05;
    parede(w, h, e, mw, null, {pai:g, nome:'parede_fundo', pos:[0, y0, -d/2 + e/2]});
    parede(d, h, e, mw, {x:0, y:.95, w:1.0, h:.95}, {pai:g, nome:'parede_dir', pos:[w/2 - e/2, y0, 0], rot:[0, -90, 0]});
    parede(d, h, e, mw, {x:0, y:0, w:.92, h:2.0}, {pai:g, nome:'parede_esq', pos:[-w/2 + e/2, y0, 0], rot:[0, -90, 0]});
    // janela (vidro + moldura) na parede direita
    const br = mat('#f1f1ee', {rough:.6});
    caixa(.03, .95, 1.0, mat('#8fd0f0', {vidro:.38, rough:.15}), {pai:g, nome:'vidro', pos:[w/2 - e/2, y0 + .95 + .475, 0]});
    [[.04,.06,1.1,0,.95 - .03],[.04,.06,1.1,0,.95 + .95 + .03],[.04,1.07,.06,-.53,.95 + .475],[.04,1.07,.06,.53,.95 + .475]].forEach(a => caixa(a[0] + .06, a[1], a[2], br, {pai:g, pos:[w/2 - e/2, y0 + a[4], a[3]]}));
    // porta na parede esquerda (pivô na dobradiça)
    const piv = grupo({pai:g, nome:'porta', pos:[-w/2 + e/2, y0, -.46]});
    caixa(.06, 1.98, .9, mat('#7a4a28', {tex:'madeira', m:.6}), {pai:piv, pos:[0, .99, .46]});
    esfera(.04, mat('#d9b45a', {metal:.6, rough:.4}), {pai:piv, pos:[.05, 1.0, .82]});
    // empenas (triângulos) nas laterais
    const sh = new T3.Shape(); sh.moveTo(-d/2, 0); sh.lineTo(d/2, 0); sh.lineTo(0, rise); sh.closePath();
    [[1,'empena_dir'],[-1,'empena_esq']].forEach(([s, n]) => { const geo = new T3.ExtrudeGeometry(sh, {depth:e, bevelEnabled:false}); geo.translate(0, 0, -e/2); const me = new T3.Mesh(geo, mw); me.castShadow = me.receiveShadow = true; me.rotation.y = Math.PI/2; me.position.set(s*(w/2 - e/2), y0 + h, 0); me.name = n; me.userData.parte = n; g.add(me); });
    // telhado (duas águas) + caibros aparentes
    const tel = grupo({pai:g, nome:'telhado', pos:[0, y0 + h, 0]}), ov = .35, sl = rise/(d/2), Lp = Math.hypot(d/2 + ov, sl*(d/2 + ov)), ang = Math.atan(sl);
    const mt = mat(P.cor_telha, {tex:'telha', m:.8, rough:.7}), mc = mat('#6b4426', {tex:'madeira', m:.5});
    [1,-1].forEach(s => {
      const cz = s*(d/2 + ov)/2, cy = rise - sl*(d/2 + ov)/2;
      caixa(w + .7, .08, Lp, mt, {pai:tel, pos:[0, cy + .04, cz], rot:[s*ang*57.2958, 0, 0]});
      for(let i = 0; i < 6; i++) caixa(.08, .1, Lp, mc, {pai:tel, pos:[-w/2 + .15 + i*(w - .3)/5, cy - .06, cz], rot:[s*ang*57.2958, 0, 0]});
    });
    caixa(w + .75, .12, .14, mc, {pai:tel, pos:[0, rise + .04, 0]});
    return {obj:g, dim:[w + .7, h + rise + .05, d + .7], ancoras:{topo:[0, y0 + h + rise, 0], interior:[0, .6, 0], janela:[w/2, y0 + 1.4, 0], porta:[-w/2, y0 + 1, 0], telhado:[0, y0 + h + rise, 0], frente:[0, 1, d/2]}};
  }});

/* ---------- 3. sofa ---------- */
LIB.registrar({id:'sofa', nome:'Sofá', lote:1, categoria:'móveis',
  descricao:'sofá de tecido com almofadas', params:{cor:{padrao:'#2f5fb5'}, largura:{padrao:1.8}},
  animacoes:{sentar:{desc:'as almofadas afundam como se alguém sentasse', dur:.9, aplicar(p, t){ const k = Math.sin(Math.PI*clamp(t/.9, 0, 1)); ['almofada_esq','almofada_dir'].forEach(n => { p[n].scale.y = 1 - .45*k; p[n].position.y = p[n].userData.rest.p.y - .05*k; }); }},
            tremer:{desc:'treme', dur:1.2, aplicar(p, t){ sacode(p, ['base','encosto','braco_esq','braco_dir'], t, 1.2, .03); }}},
  criar(P){
    const g = grupo(), w = P.largura, tc = mat(P.cor, {tex:'tecido', m:.5}), ta = mat(tom(P.cor, .06), {tex:'tecido', m:.5});
    caixa(w, .26, .82, tc, {pai:g, nome:'base', pos:[0, .22, 0]});
    caixa(w, .52, .2, tc, {pai:g, nome:'encosto', pos:[0, .6, -.31]});
    caixa(.2, .46, .82, tc, {pai:g, nome:'braco_esq', pos:[-w/2 + .1, .5, 0]});
    caixa(.2, .46, .82, tc, {pai:g, nome:'braco_dir', pos:[w/2 - .1, .5, 0]});
    const aw = (w - .4)/2 - .02; [-1, 1].forEach(s => caixa(aw, .16, .6, ta, {pai:g, nome:s < 0 ? 'almofada_esq' : 'almofada_dir', pos:[s*(aw/2 + .02), .43, .08]}));
    const pe = mat('#2b2b2b'); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a, b]) => cil(.04, .1, pe, {pai:g, pos:[a*(w/2 - .1), .05, b*.32], lados:8}));
    return {obj:g, dim:[w, .86, .82], ancoras:{topo:[0, .86, 0], assento:[0, .52, .08], frente:[0, .3, .41]}};
  }});

/* ---------- 4. mesa ---------- */
LIB.registrar({id:'mesa', nome:'Mesa de centro', lote:1, categoria:'móveis',
  descricao:'mesa baixa de madeira com quatro pernas', params:{largura:{padrao:1}, profundidade:{padrao:.6}, altura:{padrao:.5}, cor:{padrao:'#8a5a2b'}},
  animacoes:{tombar:{desc:'a mesa tomba de lado', dur:1.3, aplicar(p, t){ const k = suave(t/1.3), r = p.corpo.userData.rest; p.corpo.rotation.z = r.r.z + rad(-84)*k; p.corpo.position.y = r.p.y + .05*Math.sin(Math.PI*k); }},
             tremer:{desc:'treme', dur:1.2, aplicar(p, t){ sacode(p, ['corpo'], t, 1.2, .03); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}), w = P.largura, d = P.profundidade, h = P.altura, mm = mat(P.cor, {tex:'madeira', m:.6});
    caixa(w, .06, d, mm, {pai:c, nome:'tampo', pos:[0, h - .03, 0]});
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a, b], i) => caixa(.06, h - .06, .06, mm, {pai:c, nome:'perna_'+(i + 1), pos:[a*(w/2 - .06), (h - .06)/2, b*(d/2 - .06)]}));
    caixa(w - .2, .04, .04, mm, {pai:c, pos:[0, .14, -(d/2 - .06)]}); caixa(w - .2, .04, .04, mm, {pai:c, pos:[0, .14, d/2 - .06]});
    return {obj:g, dim:[w, h, d], ancoras:{topo:[0, h, 0], centro:[0, h/2, 0]}};
  }});

/* ---------- 5. arvore ---------- */
const balanco = (o, t, a, f, ph) => { o.rotation.z = o.userData.rest.r.z + a*(Math.sin(t*f*6.283 + (ph||0)) + .35*Math.sin(t*f*2.3*6.283)); };
LIB.registrar({id:'arvore', nome:'Árvore', lote:1, categoria:'natureza',
  descricao:'árvore low poly (pinheiro ou copa redonda) que balança com o vento',
  params:{tipo:{padrao:'redonda', opcoes:['redonda','pinheiro']}, altura:{padrao:2.6}, cor_copa:{padrao:'#3f9650'}},
  animacoes:{balancar:{desc:'balança com vento leve (contínuo); args.intensidade 1=normal', loop:true, dur:4, aplicar(p, t, a){ balanco(p.corpo, t, .035*(a.intensidade || 1), .4); }},
             curvar:{desc:'vento forte: a árvore se curva e sacode', dur:3, aplicar(p, t, a){ const k = suave(t/1.2); p.corpo.rotation.z = p.corpo.userData.rest.r.z - rad(22)*k + .03*Math.sin(t*14)*k; }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}), H = P.altura, th = H*.4, mt = mat('#6b4a2c', {tex:'madeira', m:.5}), mf = mat(P.cor_copa, {rough:.9});
    cil(.11, th, mt, {pai:c, nome:'tronco', pos:[0, th/2, 0], rTopo:.07, lados:8});
    const cp = grupo({pai:c, nome:'copa', pos:[0, 0, 0]});
    if(P.tipo === 'pinheiro'){ [[.62,.9,.3],[.5,.85,.62],[.36,.8,.95]].forEach(([r, hh, k]) => cone(r*H/2.6, hh*H/2.6, mf, {pai:cp, pos:[0, th*.7 + k*H*.62, 0], lados:7})); }
    else { [[0,.78,0,.62],[.28,.6,.1,.44],[-.26,.64,-.08,.46],[.05,1.0,.02,.4]].forEach(([x, y, z, r]) => esfera(r*H/2.6, mf, {pai:cp, pos:[x*H/2.6, th + y*H/2.6 - .15, z*H/2.6], det:1})); }
    return {obj:g, dim:[1.4*H/2.6, H, 1.4*H/2.6], ancoras:{topo:[0, H, 0], base:[0, 0, 0], copa:[0, th + .4, 0]}};
  }});

/* ---------- 6. palmeira ---------- */
LIB.registrar({id:'palmeira', nome:'Palmeira', lote:1, categoria:'natureza',
  descricao:'palmeira com tronco curvo e folhas que balançam; boa para cenas de praia e tempestade',
  params:{altura:{padrao:3.2}, cor_folha:{padrao:'#3d9a3e'}},
  animacoes:{balancar:{desc:'balança com vento (contínuo); args.intensidade 1=normal', loop:true, dur:4, aplicar(p, t, a){ const k = a.intensidade || 1; balanco(p.corpo, t, .03*k, .45); p.folhas.children.forEach((f, i) => { f.rotation.x = f.userData.rest.r.x + .08*k*Math.sin(t*3 + i); }); }},
             curvar_vento:{desc:'vento de furacão: tronco e folhas vergam', dur:3, aplicar(p, t){ const k = suave(t/1.2); p.corpo.rotation.z = p.corpo.userData.rest.r.z - rad(24)*k + .04*Math.sin(t*16)*k; p.folhas.children.forEach((f, i) => { f.rotation.x = f.userData.rest.r.x + (.35 + .12*Math.sin(t*13 + i))*k; }); }}},
  criar(P){
    const g = grupo(), c = grupo({pai:g, nome:'corpo'}), H = P.altura, n = 7, mt = mat('#8a6a42', {tex:'madeira', m:.4}), mf = mat(P.cor_folha, {rough:.8});
    const tr = grupo({pai:c, nome:'tronco'}); let x = 0, y = 0; const seg = H*.82/n;
    for(let i = 0; i < n; i++){ const dx = .045*(i + 1), a = Math.atan2(dx, seg); cil(.15 - i*.011, Math.hypot(dx, seg)*1.22, mt, {pai:tr, pos:[x + dx/2, y + seg/2, 0], rot:[0, 0, -a*57.2958], rTopo:.14 - i*.011, lados:8}); x += dx; y += seg; }
    const fo = grupo({pai:c, nome:'folhas', pos:[x, y, 0]});
    for(let i = 0; i < 8; i++){ const f = grupo({pai:fo, rot:[0, i*45, 0]}), b = grupo({pai:f, rot:[-18, 0, 0]}); caixa(.22, .035, 1.0, mf, {pai:b, pos:[0, 0, .5]}); const b2 = grupo({pai:b, pos:[0, 0, 1.0], rot:[28, 0, 0]}); caixa(.16, .03, .8, mf, {pai:b2, pos:[0, 0, .4]}); repouso(f); }
    [[.12, -.06, .1],[-.1, -.08, .06],[.02, -.1, -.12]].forEach(([a, b2, d]) => esfera(.09, mat('#6b4a1f'), {pai:fo, pos:[a, b2, d], det:0}));
    return {obj:g, dim:[2.4, H, 2.4], ancoras:{topo:[x, y + .3, 0], base:[0, 0, 0]}};
  }});

/* ---------- 7. janela ---------- */
LIB.registrar({id:'janela', nome:'Janela com persiana', lote:1, categoria:'construção',
  descricao:'janela dentro de um trecho de parede, com vidro, persiana de aço e rachaduras; para mostrar vidro anti-impacto e persiana',
  params:{largura:{padrao:1}, altura:{padrao:1.2}, persiana:{padrao:'sim', opcoes:['sim','nao']}},
  animacoes:{
    fechar_persiana:{desc:'a persiana desce e fecha', dur:1.3, aplicar(p, t){ p.persiana.scale.y = Math.max(.001, saida(t/1.3)); }},
    abrir_persiana:{desc:'a persiana sobe', dur:1.3, aplicar(p, t){ p.persiana.scale.y = Math.max(.001, 1 - saida(t/1.3)); }},
    rachar:{desc:'o vidro racha', dur:.9, aplicar(p, t){ p.rachaduras.scale.setScalar(Math.max(.001, saida(t/.5))); p.rachaduras.visible = t > .03; }},
    quebrar:{desc:'o vidro quebra de vez', dur:.6, aplicar(p, t){ p.rachaduras.scale.setScalar(1); const k = suave(prog(t, .08, .3)); p.vidro.scale.setScalar(Math.max(.001, 1 - k)); p.rachaduras.visible = k < .2; }}},
  criar(P){
    const g = grupo(), w = P.largura, h = P.altura, e = .16, WW = w + 1.2, HH = h + 1.2, sill = .55;
    parede(WW, HH, e, mat('#d9c89c', {tex:'madeira', m:.8}), {x:0, y:sill, w, h}, {pai:g, nome:'parede', pos:[0, 0, 0]});
    const br = mat('#f1f1ee', {rough:.6}), z = .02;
    const mold = grupo({pai:g, nome:'moldura'});
    caixa(w + .12, .06, .22, br, {pai:mold, pos:[0, sill - .03, .03]}); caixa(w + .12, .06, .12, br, {pai:mold, pos:[0, sill + h + .03, 0]});
    caixa(.06, h, .12, br, {pai:mold, pos:[-w/2 - .03, sill + h/2, 0]}); caixa(.06, h, .12, br, {pai:mold, pos:[w/2 + .03, sill + h/2, 0]});
    caixa(.03, h, .03, br, {pai:mold, pos:[0, sill + h/2, z]}); caixa(w, .03, .03, br, {pai:mold, pos:[0, sill + h*.5, z]});
    caixa(w, h, .03, mat('#8fd0f0', {vidro:.38, rough:.15}), {pai:g, nome:'vidro', pos:[0, sill + h/2, 0]});
    const rc = grupo({pai:g, nome:'rachaduras', pos:[0, sill + h/2, .04]}), dk = mat('#233138');
    [[0,0,.9,40],[0,0,.7,-25],[0,0,.55,95],[.1,.05,.5,150],[-.1,-.05,.45,-70]].forEach(([x, y, l, a]) => caixa(l*Math.min(w, h)*.5, .012, .006, dk, {pai:rc, pos:[x*w*.4 + Math.cos(rad(a))*l*.12, y*h*.4 + Math.sin(rad(a))*l*.12, 0], rot:[0, 0, a]}));
    rc.visible = false;
    if(P.persiana !== 'nao'){
      const pp = grupo({pai:g, nome:'persiana', pos:[0, sill + h, .12]}), ms = mat('#8892a0', {tex:'metal', m:.3, metal:.5, rough:.45});
      caixa(w + .1, h, .03, ms, {pai:pp, pos:[0, -h/2, 0]});
      caixa(w + .2, .16, .2, mat('#6f7886', {tex:'metal', m:.4, metal:.5}), {pai:g, nome:'caixa_persiana', pos:[0, sill + h + .08, .12]});
      pp.scale.y = .001;
    }
    return {obj:g, dim:[WW, HH, e + .3], ancoras:{centro:[0, sill + h/2, .1], topo:[0, sill + h, .1], persiana:[0, sill + h*.6, .16], vidro:[0, sill + h/2, .1]}};
  }});

/* ---------- 8. porta ---------- */
LIB.registrar({id:'porta', nome:'Porta', lote:1, categoria:'construção',
  descricao:'porta com batente: de madeira, de metal ou de garagem (que sobe)',
  params:{material:{padrao:'madeira', opcoes:['madeira','metal','garagem']}, largura:{padrao:.95}, altura:{padrao:2.1}},
  animacoes:{abrir:{desc:'a porta abre (a de garagem sobe)', dur:1.2, aplicar(p, t, a, g){ const k = suave(t/1.2), f = p.folha; if(f.userData.garagem) f.scale.y = Math.max(.1, 1 - .9*k); else f.rotation.y = f.userData.rest.r.y - rad(105)*k; }},
             fechar:{desc:'a porta fecha', dur:1.2, aplicar(p, t){ const k = 1 - suave(t/1.2), f = p.folha; if(f.userData.garagem) f.scale.y = Math.max(.1, 1 - .9*k); else f.rotation.y = f.userData.rest.r.y - rad(105)*k; }}},
  criar(P){
    const g = grupo(), w = P.material === 'garagem' ? Math.max(P.largura, 2.4) : P.largura, h = P.altura, bt = mat('#e7e3da', {rough:.6});
    const bat = grupo({pai:g, nome:'batente'});
    caixa(.08, h, .14, bt, {pai:bat, pos:[-w/2 - .04, h/2, 0]}); caixa(.08, h, .14, bt, {pai:bat, pos:[w/2 + .04, h/2, 0]}); caixa(w + .16, .08, .14, bt, {pai:bat, pos:[0, h + .04, 0]});
    if(P.material === 'garagem'){
      const f = grupo({pai:g, nome:'folha', pos:[0, h, 0]}), mm = mat('#d8dde3', {tex:'metal', m:.5, metal:.35, rough:.5}); f.userData.garagem = true;
      const n = 4; for(let i = 0; i < n; i++) caixa(w - .04, h/n - .02, .06, mm, {pai:f, pos:[0, -(i + .5)*h/n, 0]});
    } else {
      const f = grupo({pai:g, nome:'folha', pos:[-w/2, 0, -.03]});
      caixa(w - .02, h - .02, .06, P.material === 'metal' ? mat('#7d8794', {tex:'metal', m:.5, metal:.45, rough:.45}) : mat('#7a4a28', {tex:'madeira', m:.6}), {pai:f, pos:[w/2, h/2, 0]});
      esfera(.045, mat('#d9b45a', {metal:.6, rough:.4}), {pai:f, nome:'macaneta', pos:[w - .12, h*.47, .06], det:1});
    }
    return {obj:g, dim:[w + .2, h + .1, .2], ancoras:{centro:[0, h/2, 0], topo:[0, h, 0], macaneta:[w/2 - .12, h*.47, .1]}};
  }});

/* ---------- 9. pilar_concreto ---------- */
LIB.registrar({id:'pilar_concreto', nome:'Pilar de concreto armado', lote:1, categoria:'construção',
  descricao:'pilar de concreto cortado ao meio mostrando vergalhões e estribos de aço por dentro; sobre uma sapata',
  params:{altura:{padrao:2.6}, largura:{padrao:.36}},
  animacoes:{encher:{desc:'o concreto sobe e enche a forma', dur:2.6, aplicar(p, t){ p.concreto.scale.y = Math.max(.001, saida(t/2.6)); }},
             rachar:{desc:'o concreto racha e fica vermelho (carga demais)', dur:1.4, aplicar(p, t){ const k = suave(t/.8); tinge(p.concreto, '#e0584a', k*.75); p.concreto.rotation.z = p.concreto.userData.rest.r.z + .02*k*Math.sin(t*40); }},
             tremer:{desc:'treme', dur:1.2, aplicar(p, t){ sacode(p, ['concreto','aco','estribos'], t, 1.2, .025); }}},
  criar(P){
    const g = grupo(), h = P.altura, w = P.largura, e = .07, mc = mat('#a9a9a3', {tex:'concreto', m:.7});
    caixa(w*2.4, .18, w*2.4, mat('#8f8f8a', {tex:'concreto', m:1}), {pai:g, nome:'sapata', pos:[0, .09, 0]});
    const co = grupo({pai:g, nome:'concreto', pos:[0, .18, 0]});
    caixa(w, h, e, mc, {pai:co, pos:[0, h/2, -w/2 + e/2]}); caixa(e, h, w, mc, {pai:co, pos:[-w/2 + e/2, h/2, 0]}); caixa(e, h, w, mc, {pai:co, pos:[w/2 - e/2, h/2, 0]});
    const ma = mat('#d9722c', {metal:.5, rough:.45}), ac = grupo({pai:g, nome:'aco', pos:[0, .18, 0]}), o = w/2 - e - .04;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a, b]) => cil(.022, h + .1, ma, {pai:ac, pos:[a*o, h/2, b*o], lados:8}));
    const es = grupo({pai:g, nome:'estribos', pos:[0, .18, 0]}), me = mat('#c4c8cf', {metal:.5, rough:.45});
    for(let y = .2; y < h; y += .32){ caixa(o*2, .014, .014, me, {pai:es, pos:[0, y, -o]}); caixa(o*2, .014, .014, me, {pai:es, pos:[0, y, o]}); caixa(.014, .014, o*2, me, {pai:es, pos:[-o, y, 0]}); caixa(.014, .014, o*2, me, {pai:es, pos:[o, y, 0]}); }
    return {obj:g, dim:[w*2.4, h + .18, w*2.4], ancoras:{topo:[0, h + .18, 0], base:[0, 0, 0], centro:[0, h/2 + .18, 0], aco:[0, h/2 + .18, w/2 - e]}};
  }});

/* ---------- 10. pessoa ---------- */
LIB.registrar({id:'pessoa', nome:'Pessoa (personagem cartoon)', lote:1, categoria:'personagens',
  descricao:'personagem humano cartoon de cabeça grande, olha para +z (para a câmera); serve de narrador, vítima, engenheiro, etc.',
  params:{roupa:{padrao:'#232b3b'}, calca:{padrao:'#2a2f3a'}, pele:{padrao:'#f0c8a0'}, cabelo:{padrao:'#2a1a10'}, estilo_cabelo:{padrao:'curto', opcoes:['curto','comprido','careca']}, oculos:{padrao:'nao', opcoes:['sim','nao']}, altura:{padrao:1.7}},
  animacoes:{
    acenar:{desc:'acena com a mão direita', dur:2, aplicar(p, t){ const k = suave(prog(t, 0, .35))*(1 - suave(prog(t, 1.7, 2))); p.braco_dir.rotation.z = p.braco_dir.userData.rest.r.z - rad(150)*k + Math.sin(t*11)*.3*k; }},
    andar:{desc:'anda no lugar (contínuo)', loop:true, dur:1, aplicar(p, t){ const s = Math.sin(t*7); p.perna_esq.rotation.x = s*.55; p.perna_dir.rotation.x = -s*.55; p.braco_esq.rotation.x = -s*.45; p.braco_dir.rotation.x = s*.45; p.corpo.position.y = p.corpo.userData.rest.p.y + Math.abs(Math.cos(t*7))*.03; }},
    espanto:{desc:'dá um pulo de susto com os braços para cima', dur:1.2, aplicar(p, t){ const k = Math.sin(Math.PI*clamp(t/.6, 0, 1))*(t < .6 ? 1 : 0); p.corpo.position.y = p.corpo.userData.rest.p.y + .25*k; const b = suave(prog(t, 0, .2))*(1 - suave(prog(t, .8, 1.2))); p.braco_esq.rotation.z = rad(130)*b; p.braco_dir.rotation.z = -rad(130)*b; p.olhos.scale.setScalar(1 + .3*b); }},
    apontar:{desc:'aponta para frente com o braço direito', dur:1.1, aplicar(p, t){ p.braco_dir.rotation.x = -rad(85)*suave(t/.5); }}},
  criar(P){
    const g = grupo(), k = P.altura/1.7, c = grupo({pai:g, nome:'corpo', esc:k}), mp = mat(P.pele, {rough:.7}), mr = mat(P.roupa, {tex:'tecido', m:.4}), mc = mat(P.calca, {tex:'tecido', m:.4}), mh = mat(P.cabelo, {rough:.9}), sap = mat('#1c1c1c', {rough:.6});
    caixa(.5, .62, .3, mr, {pai:c, nome:'torso', pos:[0, 1.1, 0]});
    [[-1,'esq'],[1,'dir']].forEach(([s, n]) => {
      const b = grupo({pai:c, nome:'braco_'+n, pos:[s*.34, 1.38, 0]}); cil(.07, .5, mr, {pai:b, pos:[0, -.25, 0], lados:8}); esfera(.075, mp, {pai:b, pos:[0, -.54, 0], det:1});
      const pe = grupo({pai:c, nome:'perna_'+n, pos:[s*.13, .8, 0]}); cil(.09, .7, mc, {pai:pe, pos:[0, -.35, 0], lados:8}); caixa(.16, .09, .26, sap, {pai:pe, pos:[0, -.73, .04]});
    });
    const ca = grupo({pai:c, nome:'cabeca', pos:[0, 1.66, 0]});
    esfera(.29, mp, {pai:ca, pos:[0, 0, 0], det:2});
    esfera(.04, mp, {pai:ca, pos:[0, -.03, .29], det:1});
    const ol = grupo({pai:ca, nome:'olhos', pos:[0, .05, .24]});
    [-1, 1].forEach(s => { esfera(.062, mat('#ffffff', {rough:.3}), {pai:ol, pos:[s*.1, 0, .03], det:1}); esfera(.03, mat('#14110f', {rough:.3}), {pai:ol, pos:[s*.1, -.005, .085], det:1}); });
    caixa(.11, .018, .02, mat('#6b2f2f'), {pai:ca, pos:[0, -.14, .27]});
    if(P.estilo_cabelo !== 'careca'){ const ha = esfera(.31, mh, {pai:ca, nome:'cabelo', pos:[0, .07, -.02], det:2}); ha.scale.set(1, .72, 1.02); if(P.estilo_cabelo === 'comprido') caixa(.5, .5, .12, mh, {pai:ha, pos:[0, -.32, -.2]}); }
    if(P.oculos === 'sim'){ const mo = mat('#111', {rough:.4}); [-1, 1].forEach(s => { const r = new T3.Mesh(new T3.TorusGeometry(.075, .012, 6, 14), mo); r.position.set(s*.1, .05, .29); ca.add(r); }); caixa(.07, .012, .012, mo, {pai:ca, pos:[0, .06, .295]}); }
    return {obj:g, dim:[.9*k, 1.95*k, .4*k], ancoras:{cabeca:[0, 1.66*k, 0], topo:[0, 2.0*k, 0], peito:[0, 1.2*k, .15*k], mao_dir:[.34*k, .85*k, 0]}};
  }});
})();
