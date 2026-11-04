// Teste de exportação de ponta a ponta (rodar com o estúdio aberto: python servidor.py).
// Uso: node testes/exportacao.js <de_s> <ate_s>   (ex.: 8 14)   Requer: playwright e ffprobe/ffmpeg.
// Carrega o exemplo do furacão, põe uma "voz" sintética (um tom por cena), exporta o trecho e confere
// com ffprobe: codec, tamanho, 30 fps, número de quadros, duração do áudio e os silêncios entre as cenas.
const {chromium} = require('playwright'), {execSync} = require('child_process'), fs = require('fs');
(async () => {
  const de = +process.argv[2] || 8, ate = +process.argv[3] || 14;
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport:{width:1500,height:1000}});
  await p.goto('http://localhost:8766/index.html?x='+Date.now()); await p.waitForTimeout(2500);
  await p.click('#rxExemplo3'); await p.waitForTimeout(3500);
  const tl = await p.evaluate(() => window.__T.timeline.map(l => ({i:l.i, start:l.start, dur:l.dur, auto:!!l.auto})));
  await p.evaluate(() => window.__T.timeline.forEach((l, k) => { if(l.auto) return; const sr = 48000, n = Math.floor(l.dur*.9*sr), ab = new AudioBuffer({length:n, sampleRate:sr, numberOfChannels:1}), d = ab.getChannelData(0), f = 300 + k*150; for(let i = 0; i < n; i++) d[i] = Math.sin(2*Math.PI*f*i/sr)*.4; l.buf = ab; }));
  const r = await p.evaluate(async ([de, ate]) => { const o = {de, ate, sufixo:'-teste'}; await window.__T.exportVideo(o); return o.ok; }, [de, ate]);
  await b.close();
  if(!r){ console.log('FALHOU: exportação não terminou'); process.exit(1); }
  const f = fs.readdirSync('videos').filter(x => x.endsWith('-teste.mp4')).map(x => 'videos/'+x)[0];
  const j = JSON.parse(execSync('ffprobe -v error -show_streams -of json '+f)).streams, v = j.find(s => s.codec_type === 'video'), a = j.find(s => s.codec_type === 'audio');
  const esperado = Math.ceil((Math.min(ate, 1e9) - de)*30), ok = [];
  const chk = (nome, cond, info) => { ok.push(cond); console.log((cond ? 'OK   ' : 'FALHA')+' '+nome+' '+info); };
  chk('vídeo 1080x1920 30fps', v.width === 1080 && v.height === 1920 && v.r_frame_rate === '30/1', v.codec_name+' '+v.width+'x'+v.height+' '+v.r_frame_rate);
  chk('quadros', Math.abs(+v.nb_frames - esperado) <= 1, v.nb_frames+' (esperado '+esperado+')');
  chk('áudio presente', !!a, a ? a.codec_name+' '+a.duration+'s' : 'sem trilha');
  if(a){ chk('duração do áudio ≈ vídeo', Math.abs(+a.duration - +v.duration) < .2, a.duration+' vs '+v.duration);
    const out = execSync('ffmpeg -v info -i '+f+' -vn -af silencedetect=n=-50dB:d=0.1 -f null - 2>&1 || true').toString(), sil = [...out.matchAll(/silence_(start|end): ([0-9.]+)/g)].map(m => [m[1], +m[2]]);
    tl.filter(l => !l.auto).forEach((l, k, arr) => { const prox = arr[k+1]; if(!prox || l.start+l.dur*.9 < de || prox.start > ate) return;
      const fim = l.start + l.dur*.9 - de, ini = prox.start - de, s0 = sil.find(s => s[0] === 'start' && Math.abs(s[1]-fim) < .15), s1 = sil.find(s => s[0] === 'end' && Math.abs(s[1]-ini) < .15);
      chk('sincronia da voz, cena '+(l.i+1)+' → '+(prox.i+1), !!(s0 && s1), 'fim da voz esperado '+fim.toFixed(2)+'s / início da próxima '+ini.toFixed(2)+'s; achado '+(s0 ? s0[1] : '–')+' / '+(s1 ? s1[1] : '–')); }); }
  process.exit(ok.every(Boolean) ? 0 : 1);
})();
