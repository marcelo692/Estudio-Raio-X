/* Gerado a partir de roteiros/exemplo-descarga.json (fonte da verdade). Não edite aqui. */
window.RAIOX_EXEMPLO = {
 "formato": "explica",
 "titulo": "Como funciona a descarga do banheiro?",
 "clima": "animada",
 "falas": [
  {
   "quem": "mascote",
   "texto": "Você aperta um botão e a descarga funciona. Mas o que acontece lá dentro?",
   "bloco": "b1",
   "acao": "curioso"
  },
  {
   "quem": "mascote",
   "texto": "Quando você aperta, o botão levanta uma tampinha lá no fundo da caixa.",
   "bloco": "b2",
   "acao": "aproximar"
  },
  {
   "quem": "mascote",
   "texto": "A água despenca pelo cano com tanta força que empurra tudo para fora do vaso.",
   "bloco": "b3",
   "acao": "arregalar"
  },
  {
   "quem": "mascote",
   "texto": "Enquanto a caixa esvazia, a boia desce junto e abre a torneira de enchimento.",
   "bloco": "b4",
   "acao": "olhar"
  },
  {
   "quem": "mascote",
   "texto": "Quando a caixa enche de novo, a boia sobe e fecha a torneira. Pronto: tudo preparado para a próxima.",
   "bloco": "b5",
   "acao": "concordar"
  }
 ],
 "animacao": {
  "ambiente": {
   "fundo": [
    "#6f9fc9",
    "#a9c8de",
    "#e6dac4",
    "#fff6e6"
   ],
   "chao": "#c9b48c"
  },
  "pecas": {
   "vaso": {
    "partes": [
     {
      "nome": "base",
      "forma": "cilindro",
      "raio": 0.3,
      "raio_topo": 0.22,
      "alt": 0.5,
      "pos": [
       0,
       0.25,
       0
      ],
      "cor": "#efe9dd"
     },
     {
      "nome": "tigela",
      "forma": "cilindro",
      "raio": 0.3,
      "raio_topo": 0.42,
      "alt": 0.24,
      "pos": [
       0,
       0.62,
       0
      ],
      "cor": "#cfe3ec",
      "vidro": 0.45
     },
     {
      "nome": "agua",
      "forma": "liquido",
      "base": "cilindro",
      "raio": 0.3,
      "alt": 0.12,
      "pos": [
       0,
       0.52,
       0
      ],
      "nivel": 0.6
     },
     {
      "nome": "assento",
      "forma": "anel",
      "raio": 0.4,
      "espessura": 0.05,
      "rot": [
       90,
       0,
       0
      ],
      "pos": [
       0,
       0.76,
       0
      ],
      "cor": "#efe9dd"
     }
    ]
   },
   "tanque": {
    "partes": [
     {
      "nome": "casca",
      "forma": "caixa",
      "tam": [
       1.0,
       0.7,
       0.34
      ],
      "cor": "#a9d6ec",
      "vidro": 0.3
     },
     {
      "nome": "agua",
      "forma": "liquido",
      "base": "caixa",
      "tam": [
       0.92,
       0.6,
       0.28
      ],
      "pos": [
       0,
       -0.3,
       0
      ],
      "nivel": 0.8
     },
     {
      "nome": "valvula",
      "forma": "cilindro",
      "raio": 0.1,
      "alt": 0.03,
      "pos": [
       -0.15,
       -0.31,
       0
      ],
      "cor": "#d94f4f"
     },
     {
      "nome": "guia",
      "forma": "caixa",
      "tam": [
       0.04,
       0.62,
       0.04
      ],
      "pos": [
       0.3,
       -0.01,
       0
      ],
      "cor": "#5d6872"
     },
     {
      "nome": "torneira",
      "forma": "cilindro",
      "raio": 0.05,
      "alt": 0.16,
      "pos": [
       0.3,
       0.3,
       0
      ],
      "cor": "#5d6872"
     },
     {
      "nome": "boia",
      "forma": "esfera",
      "raio": 0.09,
      "pos": [
       0.3,
       0.1,
       0
      ],
      "cor": "#ff9f43"
     },
     {
      "nome": "tampa",
      "forma": "caixa",
      "tam": [
       1.06,
       0.05,
       0.4
      ],
      "pos": [
       0,
       0.375,
       0
      ],
      "cor": "#efe9dd"
     },
     {
      "nome": "botao",
      "forma": "cilindro",
      "raio": 0.07,
      "alt": 0.06,
      "pos": [
       0,
       0.43,
       0
      ],
      "cor": "#d94f4f"
     }
    ],
    "ancoras": {
     "saida": [
      -0.15,
      -0.32,
      0
     ],
     "entrada": [
      0.3,
      0.38,
      0
     ]
    }
   }
  },
  "elementos": [
   {
    "id": "vaso",
    "peca": "vaso",
    "pos": [
     0,
     0,
     0.2
    ]
   },
   {
    "id": "tanque",
    "peca": "tanque",
    "pos": [
     0,
     1.55,
     -0.55
    ]
   },
   {
    "id": "cano",
    "tipo": "tubo",
    "pontos": [
     [
      -0.15,
      1.22,
      -0.55
     ],
     [
      -0.15,
      1.0,
      -0.55
     ],
     [
      -0.1,
      0.88,
      -0.35
     ],
     [
      0,
      0.85,
      -0.1
     ]
    ],
    "raio": 0.05,
    "cor": "#c5ced4",
    "vidro": 0.4
   }
  ],
  "blocos": [
   {
    "id": "b1",
    "camera": {
     "alvo": [
      0,
      1.0,
      -0.1
     ],
     "dist": 5,
     "alt": 0.6,
     "azim": 0,
     "movimento": "aproximar"
    },
    "acoes": [
     {
      "faz": "rotulo",
      "alvo": "tanque.topo",
      "texto": "DESCARGA",
      "estilo": "titulo",
      "desloc": [
       0,
       0.12
      ],
      "em": 0,
      "dur": 2.4
     },
     {
      "faz": "destacar",
      "alvo": "tanque.botao",
      "em": {
       "palavra": 3
      },
      "dur": 0.8
     }
    ]
   },
   {
    "id": "b2",
    "camera": {
     "alvo": "tanque",
     "dist": 2.6,
     "alt": 0.1,
     "azim": 25,
     "azim_fim": -10
    },
    "transicao": {
     "tipo": "fade",
     "dur": 0.3
    },
    "acoes": [
     {
      "faz": "mover",
      "alvo": "tanque.botao",
      "delta": [
       0,
       -0.05,
       0
      ],
      "em": {
       "palavra": 2
      },
      "dur": 0.2
     },
     {
      "faz": "mover",
      "alvo": "tanque.botao",
      "delta": [
       0,
       0.05,
       0
      ],
      "em": {
       "palavra": 3
      },
      "dur": 0.25
     },
     {
      "faz": "mover",
      "alvo": "tanque.valvula",
      "delta": [
       0,
       0.16,
       0
      ],
      "em": {
       "palavra": 5
      },
      "dur": 0.45
     },
     {
      "faz": "girar",
      "alvo": "tanque.valvula",
      "eixo": "z",
      "graus": 35,
      "em": {
       "palavra": 5
      },
      "dur": 0.45
     },
     {
      "faz": "rotulo",
      "alvo": "tanque.valvula",
      "texto": "TAMPINHA",
      "desloc": [
       0.0,
       0.09
      ],
      "em": {
       "palavra": 7
      }
     },
     {
      "faz": "seta",
      "alvo": "tanque.valvula",
      "dir": [
       0,
       1,
       0
      ],
      "em": {
       "palavra": 7
      },
      "tam": 0.35
     }
    ]
   },
   {
    "id": "b3",
    "camera": {
     "alvo": [
      0,
      1.0,
      -0.2
     ],
     "dist": 4.2,
     "alt": 0.5,
     "azim": -20,
     "azim_fim": 15
    },
    "acoes": [
     {
      "faz": "fluxo",
      "de": [
       -0.15,
       1.22,
       -0.55
      ],
      "via": [
       [
        -0.15,
        1.0,
        -0.55
       ],
       [
        -0.1,
        0.88,
        -0.35
       ]
      ],
      "para": [
       0,
       0.62,
       0.1
      ],
      "em": {
       "palavra": 2
      },
      "dur": 2.6,
      "qtd": 26,
      "vida": 1.2
     },
     {
      "faz": "nivel",
      "alvo": "tanque.agua",
      "para": 0.12,
      "em": {
       "palavra": 2
      },
      "dur": 5.5
     },
     {
      "faz": "mover",
      "alvo": "tanque.boia",
      "delta": [
       0,
       -0.4,
       0
      ],
      "em": {
       "palavra": 2
      },
      "dur": 5.5
     },
     {
      "faz": "nivel",
      "alvo": "vaso.agua",
      "para": 1,
      "em": {
       "palavra": 9
      },
      "dur": 0.5
     },
     {
      "faz": "nivel",
      "alvo": "vaso.agua",
      "para": 0.6,
      "em": 3.4,
      "dur": 1.2
     },
     {
      "faz": "girar_continuo",
      "alvo": "vaso.agua",
      "eixo": "y",
      "vel": 360,
      "em": {
       "palavra": 9
      },
      "dur": 2
     },
     {
      "faz": "rotulo",
      "alvo": "cano",
      "texto": "ÁGUA",
      "desloc": [
       0.13,
       0
      ],
      "em": {
       "palavra": 2
      }
     }
    ]
   },
   {
    "id": "b4",
    "camera": {
     "alvo": "tanque.boia",
     "dist": 1.8,
     "alt": 0.2,
     "azim": 20,
     "dist_fim": 1.4
    },
    "transicao": {
     "tipo": "fade",
     "dur": 0.3
    },
    "acoes": [
     {
      "faz": "seta",
      "alvo": "tanque.boia",
      "dir": [
       0,
       -1,
       0
      ],
      "em": {
       "palavra": 5
      },
      "dur": 1.6,
      "tam": 0.35
     },
     {
      "faz": "rotulo",
      "alvo": "tanque.boia",
      "texto": "BOIA",
      "desloc": [
       0.13,
       0.05
      ],
      "em": {
       "palavra": 5
      },
      "dur": 1.8
     },
     {
      "faz": "destacar",
      "alvo": "tanque.torneira",
      "em": {
       "palavra": 11
      },
      "dur": 0.7
     },
     {
      "faz": "rotulo",
      "alvo": "tanque.torneira",
      "texto": "TORNEIRA",
      "desloc": [
       0.14,
       0.06
      ],
      "em": {
       "palavra": 11
      }
     }
    ]
   },
   {
    "id": "b5",
    "camera": {
     "alvo": "tanque",
     "dist": 3.2,
     "alt": 0.3,
     "azim": -20,
     "movimento": "afastar"
    },
    "acoes": [
     {
      "faz": "nivel",
      "alvo": "tanque.agua",
      "para": 0.8,
      "em": 0,
      "dur": 3.2
     },
     {
      "faz": "mover",
      "alvo": "tanque.boia",
      "delta": [
       0,
       0.4,
       0
      ],
      "em": 0,
      "dur": 3.2
     },
     {
      "faz": "fluxo",
      "de": "tanque.entrada",
      "para": [
       0.3,
       1.5,
       -0.55
      ],
      "em": 0,
      "dur": 2.9,
      "qtd": 14,
      "tam": 0.04,
      "vida": 0.6
     },
     {
      "faz": "destacar",
      "alvo": "tanque.torneira",
      "em": {
       "palavra": 10
      },
      "dur": 0.7
     },
     {
      "faz": "rotulo",
      "alvo": "tanque.topo",
      "texto": "PRONTO!",
      "estilo": "titulo",
      "desloc": [
       0,
       0.12
      ],
      "em": {
       "palavra": 13
      }
     }
    ]
   }
  ]
 },
 "publicacao": {
  "youtube_titulo": "Como funciona a descarga do banheiro? 🚽 #shorts",
  "youtube_descricao": "O Zuco abriu a caixa da descarga para mostrar o que acontece lá dentro. Você já sabia disso? Conta aqui nos comentários.\n\nAnimação e vozes feitas com ajuda de inteligência artificial.",
  "tiktok": "O que acontece dentro da descarga quando você aperta o botão 🚽",
  "instagram": "Dá pra entender a descarga em 30 segundos.\nMarca alguém que nunca abriu a caixa.",
  "hashtags": [
   "pordentrodoobvio",
   "curiosidades",
   "comofunciona",
   "descarga",
   "zuco"
  ]
 },
 "verificar": [
  "O botão levanta uma tampa (válvula) no fundo da caixa e a água sai para o vaso.",
  "A boia desce com o nível da água e abre a torneira de enchimento; ao subir, fecha.",
  "A explicação é simplificada: na vida real o vaso usa um sifão e a água entra por dentro da louça, não por um cano externo."
 ]
};
