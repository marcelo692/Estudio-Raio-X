/* Gerado a partir de roteiros/exemplo-predio-parte*.json (fonte da verdade). Não edite aqui. */
window.RAIOX_EXEMPLO_PREDIO = [
 {
  "formato": "explica",
  "parte": 1,
  "total": 2,
  "titulo": "Por que um prédio não cai?",
  "clima": "animada",
  "plano": [
   {
    "parte": 1,
    "titulo": "Colunas e aço",
    "resumo": "Colunas, vergalhão e a primeira laje; o peso empurra o terreno."
   },
   {
    "parte": 2,
    "titulo": "Fundação e andares",
    "resumo": "Estacas na rocha, segundo andar e paredes; resumo final."
   }
  ],
  "falas": [
   {
    "quem": "mascote",
    "texto": "Um prédio pesa milhares de toneladas e não cai. Como isso é possível?",
    "bloco": "p1b1",
    "acao": "curioso"
   },
   {
    "quem": "mascote",
    "texto": "Primeiro, a gente levanta as colunas, que seguram o peso de tudo.",
    "bloco": "p1b2",
    "acao": "pulo"
   },
   {
    "quem": "mascote",
    "texto": "Mas concreto sozinho é forte para apertar, e fraquinho para esticar.",
    "bloco": "p1b3",
    "acao": "tremer"
   },
   {
    "quem": "mascote",
    "texto": "Por isso entra o vergalhão: barras de aço escondidas dentro do concreto.",
    "bloco": "p1b4",
    "acao": "espanto"
   },
   {
    "quem": "mascote",
    "texto": "Com o aço lá dentro, a coluna aguenta apertar e esticar sem rachar.",
    "bloco": "p1b5",
    "acao": "concordar"
   },
   {
    "quem": "mascote",
    "texto": "Agora precisamos de um chão para o primeiro andar, apoiado nas colunas.",
    "bloco": "p1b6",
    "acao": "olhar"
   },
   {
    "quem": "mascote",
    "texto": "O peso desse chão desce pelas colunas e vai parar lá embaixo, no terreno.",
    "bloco": "p1b7",
    "acao": "curioso"
   },
   {
    "quem": "mascote",
    "texto": "Só que todo esse peso empurra a terra para baixo. E agora?",
    "bloco": "p1b8",
    "acao": "duvida"
   }
  ],
  "animacao": {
   "ambiente": {
    "fundo": [
     "#4a86c0",
     "#86b6dc",
     "#cfdbe2",
     "#fff4dc"
    ],
    "chao": "#86ad74",
    "chao_y": -1.6
   },
   "palco": {
    "alvo": [
     -0.1,
     2.3,
     0
    ],
    "dist": 9.5,
    "alt": 1.5,
    "azim": 0
   },
   "pecas": {
    "coluna": {
     "partes": [
      {
       "nome": "concreto",
       "forma": "caixa",
       "tam": [
        0.26,
        2.6,
        0.26
       ],
       "cor": "#a9a39a",
       "vidro": 0.6
      },
      {
       "nome": "aco1",
       "forma": "cilindro",
       "raio": 0.03,
       "alt": 2.5,
       "pos": [
        -0.06,
        0,
        0
       ],
       "cor": "#e2662b"
      },
      {
       "nome": "aco2",
       "forma": "cilindro",
       "raio": 0.03,
       "alt": 2.5,
       "pos": [
        0.06,
        0,
        0
       ],
       "cor": "#e2662b"
      }
     ]
    }
   },
   "grupos": {
    "acos": [
     "c1.aco1",
     "c1.aco2",
     "c2.aco1",
     "c2.aco2",
     "c3.aco1",
     "c3.aco2",
     "c4.aco1",
     "c4.aco2"
    ],
    "predio": [
     "sapata",
     "c1",
     "c2",
     "c3",
     "c4",
     "laje1"
    ]
   },
   "elementos": [
    {
     "id": "solo",
     "tipo": "caixa",
     "tam": [
      5.5,
      1.0,
      3
     ],
     "pos": [
      -0.1,
      -0.505,
      0
     ],
     "cor": "#8e4f26",
     "vidro": 0.78,
     "contorno": "#4a2813",
     "oculto": false
    },
    {
     "id": "rocha",
     "tipo": "caixa",
     "tam": [
      5.5,
      0.6,
      3
     ],
     "pos": [
      -0.1,
      -1.3,
      0
     ],
     "cor": "#44525f",
     "oculto": false
    },
    {
     "id": "sapata",
     "tipo": "caixa",
     "tam": [
      2.0,
      0.3,
      1.4
     ],
     "pos": [
      0.8,
      0.15,
      0
     ],
     "cor": "#7d7a74",
     "oculto": false
    },
    {
     "id": "c1",
     "peca": "coluna",
     "pos": [
      0.2,
      1.6,
      0.4
     ]
    },
    {
     "id": "c2",
     "peca": "coluna",
     "pos": [
      0.2,
      1.6,
      -0.4
     ]
    },
    {
     "id": "c3",
     "peca": "coluna",
     "pos": [
      1.4,
      1.6,
      0.4
     ]
    },
    {
     "id": "c4",
     "peca": "coluna",
     "pos": [
      1.4,
      1.6,
      -0.4
     ]
    },
    {
     "id": "laje1",
     "tipo": "caixa",
     "tam": [
      1.9,
      0.2,
      1.3
     ],
     "pos": [
      0.8,
      3.0,
      0
     ],
     "cor": "#7c8aa5"
    }
   ],
   "blocos": [
    {
     "id": "p1b1",
     "camera": {
      "base": true,
      "zoom": 1.4,
      "alvo": [
       0.8,
       1.0,
       0
      ]
     },
     "acoes": [
      {
       "faz": "rotulo",
       "alvo": "sapata.topo",
       "texto": "FUNDAÇÃO",
       "desloc": [
        0.1,
        0.09
       ],
       "em": 0.8
      },
      {
       "faz": "destacar",
       "alvo": "sapata",
       "em": {
        "palavra": "pesa"
       },
       "dur": 1
      }
     ]
    },
    {
     "id": "p1b2",
     "camera": {
      "base": true,
      "zoom": 1.4,
      "alvo": [
       0.8,
       1.0,
       0
      ]
     },
     "acoes": [
      {
       "faz": "crescer",
       "alvo": "c1",
       "em": 0.6,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "c2",
       "em": 1.0,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "c3",
       "em": 1.4,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "c4",
       "em": 1.8,
       "dur": 0.8
      },
      {
       "faz": "rotulo",
       "alvo": "c4.topo",
       "texto": "COLUNAS",
       "desloc": [
        -0.05,
        0.07
       ],
       "em": 2.4
      }
     ]
    },
    {
     "id": "p1b3",
     "camera": {
      "alvo": "c1",
      "zoom": 1.9,
      "alt": 0.4
     },
     "transicao": {
      "tipo": "fade",
      "dur": 0.3
     },
     "acoes": [
      {
       "faz": "girar",
       "alvo": "c1",
       "eixo": "z",
       "graus": -5,
       "em": 1.6,
       "dur": 0.6
      },
      {
       "faz": "cor",
       "alvo": "c1.concreto",
       "para": "#d9534f",
       "em": 1.6,
       "dur": 0.5
      },
      {
       "faz": "vibrar",
       "alvo": "c1",
       "em": 1.6,
       "dur": 0.8,
       "forca": 0.04
      },
      {
       "faz": "rotulo",
       "alvo": "c1.topo",
       "texto": "RACHOU",
       "desloc": [
        0.15,
        0.0
       ],
       "em": 2.2
      }
     ]
    },
    {
     "id": "p1b4",
     "camera": {
      "alvo": "c1",
      "zoom": 1.9,
      "alt": 0.4
     },
     "acoes": [
      {
       "faz": "girar",
       "alvo": "c1",
       "eixo": "z",
       "graus": 5,
       "em": 0,
       "dur": 0.5
      },
      {
       "faz": "cor",
       "alvo": "c1.concreto",
       "para": "#a9a39a",
       "em": 0,
       "dur": 0.5
      },
      {
       "faz": "mostrar",
       "alvo": "acos",
       "em": {
        "palavra": "vergalhão"
       },
       "dur": 0.5
      },
      {
       "faz": "rotulo",
       "alvo": "c1.centro",
       "texto": "AÇO",
       "desloc": [
        0.17,
        0.16
       ],
       "em": {
        "palavra": "aço"
       }
      }
     ]
    },
    {
     "id": "p1b5",
     "camera": {
      "base": true
     },
     "transicao": {
      "tipo": "fade",
      "dur": 0.3
     },
     "acoes": [
      {
       "faz": "destacar",
       "alvo": "c1",
       "em": 0.5,
       "dur": 0.7
      },
      {
       "faz": "destacar",
       "alvo": "c2",
       "em": 0.8,
       "dur": 0.7
      },
      {
       "faz": "destacar",
       "alvo": "c3",
       "em": 1.1,
       "dur": 0.7
      },
      {
       "faz": "destacar",
       "alvo": "c4",
       "em": 1.4,
       "dur": 0.7
      },
      {
       "faz": "rotulo",
       "alvo": "c4.topo",
       "texto": "COLUNA FORTE",
       "desloc": [
        -0.05,
        0.07
       ],
       "em": 1.6
      }
     ]
    },
    {
     "id": "p1b6",
     "camera": {
      "base": true
     },
     "acoes": [
      {
       "faz": "crescer",
       "alvo": "laje1",
       "em": 0.8,
       "dur": 1.0
      },
      {
       "faz": "rotulo",
       "alvo": "laje1.dir",
       "texto": "LAJE",
       "desloc": [
        -0.1,
        0.07
       ],
       "em": 1.8
      }
     ]
    },
    {
     "id": "p1b7",
     "camera": {
      "base": true
     },
     "acoes": [
      {
       "faz": "fluxo",
       "de": "laje1.topo",
       "via": [
        [
         0.2,
         1.7,
         0.4
        ]
       ],
       "para": [
        0.2,
        0.3,
        0.4
       ],
       "dur": 2.6,
       "cor": "#ffcc33",
       "qtd": 16,
       "tam": 0.07,
       "em": 0.6
      },
      {
       "faz": "fluxo",
       "de": "laje1.topo",
       "via": [
        [
         1.4,
         1.7,
         0.4
        ]
       ],
       "para": [
        1.4,
        0.3,
        0.4
       ],
       "dur": 2.6,
       "cor": "#ffcc33",
       "qtd": 16,
       "tam": 0.07,
       "em": 0.6
      },
      {
       "faz": "rotulo",
       "alvo": "laje1.topo",
       "texto": "PESO",
       "desloc": [
        0.2,
        0.07
       ],
       "em": 0.8,
       "dur": 3
      }
     ]
    },
    {
     "id": "p1b8",
     "camera": {
      "base": true,
      "zoom": 1.3,
      "alvo": "sapata"
     },
     "acoes": [
      {
       "faz": "mover",
       "alvo": "predio",
       "delta": [
        0,
        -0.08,
        0
       ],
       "em": 0.8,
       "dur": 1.5
      },
      {
       "faz": "vibrar",
       "alvo": "sapata",
       "em": 0.8,
       "dur": 1.2
      },
      {
       "faz": "rotulo",
       "alvo": "solo.topo",
       "texto": "E O CHÃO?",
       "desloc": [
        -0.2,
        0.12
       ],
       "em": 1.4
      }
     ]
    }
   ]
  },
  "verificar": [
   "Concreto resiste bem à compressão e mal à tração; o aço (vergalhão) resolve a tração.",
   "O peso das lajes desce pelas colunas até a fundação."
  ]
 },
 {
  "parte": 2,
  "total": 2,
  "falas": [
   {
    "quem": "mascote",
    "texto": "O terreno é mole, então o prédio inteiro começa a afundar. Nada bom.",
    "bloco": "p2b1",
    "acao": "tremer"
   },
   {
    "quem": "mascote",
    "texto": "A solução é a estaca: uma haste enorme que atravessa a terra mole.",
    "bloco": "p2b2",
    "acao": "pulo"
   },
   {
    "quem": "mascote",
    "texto": "Ela desce até a rocha firme, e o peso passa a se apoiar nela.",
    "bloco": "p2b3",
    "acao": "espanto"
   },
   {
    "quem": "mascote",
    "texto": "Com a base segura, dá para subir o segundo andar, com mais colunas.",
    "bloco": "p2b4",
    "acao": "concordar"
   },
   {
    "quem": "mascote",
    "texto": "Mais um chão por cima, e o peso de cima também desce pelas colunas.",
    "bloco": "p2b5",
    "acao": "olhar"
   },
   {
    "quem": "mascote",
    "texto": "Por fim, as paredes fecham o espaço, e as janelas deixam a luz entrar.",
    "bloco": "p2b6",
    "acao": "pulo"
   },
   {
    "quem": "mascote",
    "texto": "Repare: a parede nem segura o prédio. Quem segura é a coluna com aço.",
    "bloco": "p2b7",
    "acao": "malandro"
   },
   {
    "quem": "mascote",
    "texto": "Resumindo: a estaca segura o prédio, o aço segura a coluna, e a coluna leva o peso ao chão.",
    "bloco": "p2b8",
    "acao": "piscadela"
   }
  ],
  "animacao": {
   "pecas": {
    "estacas": {
     "partes": [
      {
       "nome": "a",
       "forma": "cilindro",
       "raio": 0.1,
       "alt": 1.3,
       "pos": [
        -0.6,
        0,
        0
       ],
       "cor": "#9aa0a8"
      },
      {
       "nome": "b",
       "forma": "cilindro",
       "raio": 0.1,
       "alt": 1.3,
       "pos": [
        0,
        0,
        0
       ],
       "cor": "#9aa0a8"
      },
      {
       "nome": "c",
       "forma": "cilindro",
       "raio": 0.1,
       "alt": 1.3,
       "pos": [
        0.6,
        0,
        0
       ],
       "cor": "#9aa0a8"
      }
     ]
    },
    "paredes": {
     "partes": [
      {
       "nome": "fundo",
       "forma": "caixa",
       "tam": [
        1.9,
        2.6,
        0.08
       ],
       "cor": "#c8693a"
      },
      {
       "nome": "jan1",
       "forma": "caixa",
       "tam": [
        0.5,
        0.7,
        0.1
       ],
       "pos": [
        -0.45,
        0.2,
        0.05
       ],
       "cor": "#5db7ee",
       "brilho": 0.35
      },
      {
       "nome": "jan2",
       "forma": "caixa",
       "tam": [
        0.5,
        0.7,
        0.1
       ],
       "pos": [
        0.45,
        0.2,
        0.05
       ],
       "cor": "#5db7ee",
       "brilho": 0.35
      }
     ]
    }
   },
   "grupos": {
    "grupo_colunas": [
     "c1",
     "c2",
     "c3",
     "c4",
     "d1",
     "d2",
     "d3",
     "d4"
    ],
    "predio": [
     "sapata",
     "c1",
     "c2",
     "c3",
     "c4",
     "laje1"
    ]
   },
   "elementos": [
    {
     "id": "estacas",
     "peca": "estacas",
     "pos": [
      0.8,
      -0.65,
      0
     ]
    },
    {
     "id": "d1",
     "peca": "coluna",
     "pos": [
      0.2,
      4.4,
      0.4
     ]
    },
    {
     "id": "d2",
     "peca": "coluna",
     "pos": [
      0.2,
      4.4,
      -0.4
     ]
    },
    {
     "id": "d3",
     "peca": "coluna",
     "pos": [
      1.4,
      4.4,
      0.4
     ]
    },
    {
     "id": "d4",
     "peca": "coluna",
     "pos": [
      1.4,
      4.4,
      -0.4
     ]
    },
    {
     "id": "laje2",
     "tipo": "caixa",
     "tam": [
      1.9,
      0.2,
      1.3
     ],
     "pos": [
      0.8,
      5.8,
      0
     ],
     "cor": "#7c8aa5"
    },
    {
     "id": "paredes",
     "peca": "paredes",
     "pos": [
      0.8,
      4.4,
      -0.55
     ]
    }
   ],
   "blocos": [
    {
     "id": "p2b1",
     "camera": {
      "base": true,
      "zoom": 1.25,
      "alvo": "sapata"
     },
     "acoes": [
      {
       "faz": "mover",
       "alvo": "predio",
       "delta": [
        0,
        -0.35,
        0
       ],
       "em": 0.8,
       "dur": 2
      },
      {
       "faz": "cor",
       "alvo": "sapata",
       "para": "#d9534f",
       "em": 0.8,
       "dur": 1
      },
      {
       "faz": "rotulo",
       "alvo": "sapata.dir",
       "texto": "AFUNDANDO",
       "desloc": [
        -0.05,
        0.12
       ],
       "em": 1.2
      }
     ]
    },
    {
     "id": "p2b2",
     "camera": {
      "base": true,
      "zoom": 1.25,
      "alvo": "estacas"
     },
     "transicao": {
      "tipo": "fade",
      "dur": 0.3
     },
     "acoes": [
      {
       "faz": "mover",
       "alvo": "predio",
       "delta": [
        0,
        0.35,
        0
       ],
       "em": 2.2,
       "dur": 1.6
      },
      {
       "faz": "cor",
       "alvo": "sapata",
       "para": "#6b5a4a",
       "em": 2.2,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "estacas",
       "em": 0.5,
       "dur": 1.4
      },
      {
       "faz": "rotulo",
       "alvo": "estacas.dir",
       "texto": "ESTACAS",
       "desloc": [
        0.1,
        0.05
       ],
       "em": 1.6
      }
     ]
    },
    {
     "id": "p2b3",
     "camera": {
      "alvo": "estacas",
      "zoom": 1.5,
      "azim": 15
     },
     "acoes": [
      {
       "faz": "fluxo",
       "de": [
        0.8,
        0.2,
        0
       ],
       "para": [
        0.8,
        -1.2,
        0
       ],
       "dur": 2.4,
       "cor": "#ffcc33",
       "qtd": 14,
       "tam": 0.07,
       "em": 0.5
      },
      {
       "faz": "destacar",
       "alvo": "rocha",
       "em": {
        "palavra": "rocha"
       },
       "dur": 1
      },
      {
       "faz": "rotulo",
       "alvo": "rocha.topo",
       "texto": "ROCHA FIRME",
       "desloc": [
        0.2,
        -0.09
       ],
       "em": 1.0
      }
     ]
    },
    {
     "id": "p2b4",
     "camera": {
      "base": true,
      "zoom": 0.85,
      "alvo": [
       -0.1,
       3.2,
       0
      ]
     },
     "transicao": {
      "tipo": "fade",
      "dur": 0.3
     },
     "acoes": [
      {
       "faz": "crescer",
       "alvo": "d1",
       "em": 0.6,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "d2",
       "em": 1.0,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "d3",
       "em": 1.4,
       "dur": 0.8
      },
      {
       "faz": "crescer",
       "alvo": "d4",
       "em": 1.8,
       "dur": 0.8
      },
      {
       "faz": "rotulo",
       "alvo": "d4.topo",
       "texto": "2º ANDAR",
       "desloc": [
        -0.05,
        0.07
       ],
       "em": 2.4
      }
     ]
    },
    {
     "id": "p2b5",
     "camera": {
      "base": true,
      "zoom": 0.85,
      "alvo": [
       -0.1,
       3.2,
       0
      ]
     },
     "acoes": [
      {
       "faz": "crescer",
       "alvo": "laje2",
       "em": 0.7,
       "dur": 1.0
      },
      {
       "faz": "fluxo",
       "de": "laje2.topo",
       "via": [
        [
         0.2,
         4.4,
         0.4
        ]
       ],
       "para": [
        0.2,
        0.3,
        0.4
       ],
       "dur": 3,
       "cor": "#ffcc33",
       "qtd": 22,
       "tam": 0.07,
       "em": 1.8
      },
      {
       "faz": "fluxo",
       "de": "laje2.topo",
       "via": [
        [
         1.4,
         4.4,
         0.4
        ]
       ],
       "para": [
        1.4,
        0.3,
        0.4
       ],
       "dur": 3,
       "cor": "#ffcc33",
       "qtd": 22,
       "tam": 0.07,
       "em": 1.8
      }
     ]
    },
    {
     "id": "p2b6",
     "camera": {
      "base": true,
      "zoom": 0.85,
      "alvo": [
       -0.1,
       3.2,
       0
      ]
     },
     "acoes": [
      {
       "faz": "crescer",
       "alvo": "paredes",
       "em": 0.8,
       "dur": 1.4
      },
      {
       "faz": "destacar",
       "alvo": "paredes.jan1",
       "em": {
        "palavra": "janelas"
       },
       "dur": 0.8
      },
      {
       "faz": "destacar",
       "alvo": "paredes.jan2",
       "em": {
        "palavra": "janelas",
        "mais": 0.2
       },
       "dur": 0.8
      }
     ]
    },
    {
     "id": "p2b7",
     "camera": {
      "base": true,
      "zoom": 0.85,
      "alvo": [
       -0.1,
       3.2,
       0
      ],
      "azim": -20,
      "azim_fim": 10
     },
     "acoes": [
      {
       "faz": "esconder",
       "alvo": "paredes",
       "em": 0.4,
       "dur": 0.6
      },
      {
       "faz": "destacar",
       "alvo": "grupo_colunas",
       "em": {
        "palavra": "coluna"
       },
       "dur": 1.2
      },
      {
       "faz": "rotulo",
       "alvo": "laje1.dir",
       "texto": "QUEM SEGURA",
       "estilo": "pilula",
       "desloc": [
        -0.05,
        0.1
       ],
       "em": 1.2
      }
     ]
    },
    {
     "id": "p2b8",
     "camera": {
      "base": true,
      "zoom": 0.75,
      "alvo": [
       -0.1,
       3.0,
       0
      ],
      "movimento": "afastar"
     },
     "transicao": {
      "tipo": "fade",
      "dur": 0.4
     },
     "acoes": [
      {
       "faz": "mostrar",
       "alvo": "paredes",
       "em": 0.2,
       "dur": 0.5
      },
      {
       "faz": "destacar",
       "alvo": "estacas",
       "em": {
        "palavra": "estaca"
       },
       "dur": 1
      },
      {
       "faz": "destacar",
       "alvo": "acos",
       "em": {
        "palavra": "aço"
       },
       "dur": 1
      },
      {
       "faz": "destacar",
       "alvo": "grupo_colunas",
       "em": {
        "palavra": "coluna",
        "mais": 0.4
       },
       "dur": 1
      },
      {
       "faz": "rotulo",
       "alvo": "laje2.topo",
       "texto": "POR ISSO NÃO CAI",
       "estilo": "titulo",
       "desloc": [
        0.05,
        0.1
       ],
       "em": {
        "palavra": "Resumindo",
        "mais": 0.2
       }
      }
     ]
    }
   ]
  },
  "publicacao": {
   "youtube_titulo": "Por que um prédio não cai? 🏢 #shorts",
   "youtube_descricao": "Estaca, aço e coluna: o Zuco mostra, por dentro, o que segura um prédio em pé.\n\nAnimação e vozes feitas com ajuda de inteligência artificial.",
   "tiktok": "O prédio pesa milhares de toneladas. Por que ele não cai? 🏢",
   "instagram": "Estaca, aço e coluna: o segredo de um prédio em pé.",
   "hashtags": [
    "pordentrodoobvio",
    "curiosidades",
    "comofunciona",
    "engenharia",
    "zuco"
   ]
  },
  "verificar": [
   "Estacas transmitem a carga do prédio a uma camada de solo ou rocha mais firme.",
   "A parede de vedação normalmente não é estrutural (em alvenaria estrutural é; o exemplo simplifica)."
  ]
 }
];
