# Guia da biblioteca de objetos 3D (Estúdio Raio-X)

Leia isto antes de criar ou alterar qualquer objeto. O objetivo é a biblioteca crescer SEMPRE no mesmo padrão: os roteiros JSON chamam objetos e animações pelo nome, então nada pode quebrar o que já existe.

## Onde fica cada coisa
- `modulos/biblioteca/base.js`: núcleo (helpers `LIB.H`, texturas, `registrar`, `construir`, `reset`). Não mude sem necessidade.
- `modulos/biblioteca/lote1.js … lote9.js`: os 90 objetos originais (cada um começa com `LIB.registrar({id:'...'`).
- `modulos/biblioteca/meus_objetos.js`: **objetos novos vão aqui** (lote "meus"). É carregado por `index.html` e `biblioteca.html`.
- `modulos/biblioteca/CHANGELOG.md`: acrescente uma linha por mudança (data, id, o que mudou).

## Contrato de um objeto
```js
LIB.registrar({id:'casa_corte', nome:'Casa em corte', lote:'meus', categoria:'construção',
  descricao:'o que é, em uma frase (vai para o prompt da IA)',
  params:{material:{padrao:'tijolo', opcoes:['tijolo','madeira']}, cor:{padrao:'#c0392b'}, largura:{padrao:4}},
  animacoes:{
    abrir:{desc:'abre a porta', dur:1.2, aplicar(partes, t, args, grupo){ /* função PURA de t */ }},
    girar:{desc:'gira (contínua)', loop:true, dur:2, aplicar(partes, t){ ... }}
  },
  criar(P, H){ // P = params, H = helpers
    const g = H.grupo();
    H.caixa(...); // ver helpers usados nos lotes
    return {obj:g, dim:[larg, alt, prof], ancoras:{topo:[0,alt,0]}};
  }});
```
Regras:
1. O objeto fica com a base em y=0 e centrado em x/z. Unidade = metro (uma casa ~4 m, pessoa ~1,7 m).
2. Toda peça animável é um `Object3D` com `userData.parte = 'nome'` (use o parâmetro `nome` dos helpers `caixa/cil/esfera/grupo`). Nomes de partes e animações são **API pública**: nunca renomeie nem apague; só acrescente.
3. Animações são funções PURAS de `t` (segundos desde o início), relativas à pose de repouso: use `LIB.U` (`RP`, `gx`, `gy`, `gz`, `pos`, `tinge`, `brilha`, `treme`), nunca acumule estado. O motor chama `LIB.reset` a cada quadro antes. `loop:true` repete; as demais seguram a pose final.
4. Texturas: use `mat(cor, {tex:'madeira'|'tijolo'|'bloco'|'concreto'|'telha'|'grama'|'terra'|'pedra'|'agua'|'metal'|'tecido'|'piso'|'liso'})`. Canvas próprios precisam de `t.userData={m:1}`. Metal já é limitado a ≤0,22.
5. Estilo: low poly, `flatShading`, 5 a 7 cores saturadas, sem branco puro. Fica bonito na tela vertical 9:16.
6. Toda animação precisa de `desc` curta; se usa argumentos, escreva `args.nome` na `desc` (o catálogo da IA lê isso).
7. Nada de dependências externas nem imagens: tudo procedural.

## Como testar (obrigatório antes de entregar)
1. Abra `biblioteca.html` (pelo "Abrir estudio.bat"). Selecione o objeto, aperte cada animação.
2. Clique em **🔍 Verificar tudo** (topo): constrói todos os objetos e roda todas as animações em vários instantes, e acusa erro ou NaN.
3. Confira no console do navegador: nada em vermelho.
4. Escreva a linha no `CHANGELOG.md`.

## O que entregar
Os arquivos alterados (`meus_objetos.js` ou o `loteN.js` + `CHANGELOG.md`). Não reescreva arquivos inteiros sem precisar.
