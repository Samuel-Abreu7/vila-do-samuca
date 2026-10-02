// Catálogo de jogos. `pronto: true` faz o jogo aparecer na tela inicial.
// A curadoria completa (aprovados, propostas e marca própria) está em pesquisa/curadoria-jogos.html.

// Filtro por interesse no mapa da vila (escolha da criança; os jogos de fora só ficam apagados).
export const INTERESSES = [
  ["tudo", "Tudo"], ["planejar", "Planejar passos"], ["espaco", "Espaço e formas"],
  ["numeros", "Números"], ["deduzir", "Deduzir"], ["duelo", "Jogar a dois"],
];
// Ícone de cada filtro (em ICONES, no arte.js): ajuda quem ainda não lê.
export const ICONE_INTERESSE = { tudo: "casa", planejar: "passos", espaco: "formas", numeros: "numeros", deduzir: "lupa", duelo: "dupla" };
// Rótulo curto do filtro na tela do celular (o nome inteiro fica no leitor de tela e na tela larga).
export const CURTO_INTERESSE = { planejar: "Passos", espaco: "Formas", duelo: "A dois" };

// Carimbos para enfeitar as páginas do diário (sempre os mesmos, nada sorteado).
export const CARIMBOS = ["estrela", "lua", "flor", "gota", "bandeira", "balao", "trofeu", "maca", "lupa", "chave"];

// Cada família é uma região do mapa da vila. Coordenadas na escala do desenho do mapa:
// x de 0 a 100, y de 0 a 160. "lugares" são onde os jogos aparecem, na ordem em que ficam prontos.
export const FAMILIAS = {
  trav: { nome: "Vale das Travessias", rotulo: { x: 50, y: 80 }, lugares: [[18, 92], [50, 100], [82, 92], [32, 116], [68, 116]] },
  grade: { nome: "Bairro da Torre", rotulo: { x: 76, y: 6 }, lugares: [[72, 28], [88, 38], [58, 36]] },
  deduz: { nome: "Floresta das Pistas", rotulo: { x: 24, y: 6 }, lugares: [[17, 29], [43, 46], [17, 54]] },
  dupla: { nome: "Praça dos Duelos", rotulo: { x: 50, y: 120 }, lugares: [[24, 142], [76, 142], [50, 148]] },
};

// Conquistas da estante: poucas, sempre as mesmas, nunca sorteadas nem comparadas entre primos.
export const CONQUISTAS = [
  { id: "raposa-perfeita", jogo: "raposa", nome: "Travessia perfeita", como: "Levar todos em só 7 travessias." },
  { id: "raposa-pensou", jogo: "raposa", nome: "Pensou antes de remar", como: "Levar todos sem deixar ninguém em apuros nenhuma vez." },
  { id: "elevador-impossivel", jogo: "elevador", nome: "Detetive do impossível", como: "Descobrir uma fase sem solução." },
  { id: "elevador-direto", jogo: "elevador", nome: "Direto ao andar", como: "Chegar com o menor número de apertos, sem pedir dica." },
  { id: "elevador-topo", jogo: "elevador", nome: "Até o último andar", como: "Resolver a fase 12 do elevador." },
  { id: "hanoi-5", jogo: "hanoi", nome: "Torre de cinco", como: "Montar a torre com 5 discos." },
  { id: "hanoi-minimo", jogo: "hanoi", nome: "Passo certo", como: "Montar a torre no menor número de movimentos, sem pedir dica." },
  { id: "hanoi-7", jogo: "hanoi", nome: "Mestre da torre", como: "Montar a torre com 7 discos." },
  { id: "nim-sem-dica", jogo: "nim", nome: "Pensou sozinho", como: "Vencer o Samuca sem pedir dica." },
  { id: "nim-samuca", jogo: "nim", nome: "Venceu a coruja", como: "Ganhar do Samuca no Nim." },
  { id: "nim-perde", jogo: "nim", nome: "Pensou ao contrário", como: "Ganhar no Nim com a regra \"quem tira o último perde\"." },
  { id: "pontos-samuca", jogo: "pontos", nome: "Dono do jardim", como: "Ganhar do Samuca em Pontos e caixinhas." },
  { id: "colmeia-certeira", jogo: "colmeia", nome: "Abelha certeira", como: "Resolver uma colmeia sem nenhum engano." },
  { id: "colmeia-gigante", jogo: "colmeia", nome: "Colmeia gigante", como: "Resolver a colmeia gigante." },
  { id: "pontos-cuidado", jogo: "pontos", nome: "Sem entregar", como: "Terminar uma partida sem fazer o terceiro lado de uma caixinha quando havia outra jogada segura." },
  { id: "pontos-tres", jogo: "pontos", nome: "Três de uma vez", como: "Fechar 3 caixinhas na mesma vez de jogar." },
  { id: "enigma-caso", jogo: "enigma", nome: "Caso resolvido", como: "Desvendar um enigma de lógica sem nenhum engano." },
  { id: "senha-cofre", jogo: "senha", nome: "Cofre aberto", como: "Abrir um cofre de 4 frutas." },
];

export const JOGOS = [
  {
    id: "raposa",
    objetivo: "Leve todos para a outra margem. Quem vai primeiro?",
    direito: "dp", // domínio público: Alcuíno de York, séc. VIII
    interesses: ["planejar"],
    curiosidade: "Este enigma tem mais de 1.200 anos. Ele está num livro de desafios atribuído a Alcuíno de York, professor na corte de Carlos Magno, por volta do ano 800. No original, o barqueiro levava um lobo, uma cabra e um maço de couves.",
    // História narrada pelo anfitrião (texto conferido em fonte em 02/10/2026: Wikipédia "Alcuin",
    // "Propositiones ad Acuendos Juvenes" e "Wolf, goat and cabbage problem"; MacTutor, St Andrews).
    // audio: arquivo de voz de IA, quando existir (origem e licença registradas em DECISOES.md).
    historia: {
      anfitriao: "bento", quem: "Bento, o texugo", titulo: "O rio de Alcuíno", convite: "A história do Bento", audio: "jogos/raposa/historia.mp3",
      paginas: [
        "Olá! Eu sou o Bento, um texugo da Inglaterra. Venho de uma cidade antiga chamada York.",
        "Há mais de mil e duzentos anos, em York, vivia um professor chamado Alcuíno. Ele adorava ensinar.",
        "Um dia, o rei Carlos Magno o convidou para ensinar na escola do seu palácio, do outro lado do mar.",
        "Conta-se que Alcuíno juntou desafios num livro de nome comprido: Problemas para Aguçar os Jovens. Ele sabia que pensar também é brincar.",
        "Num desses desafios, um barqueiro precisa atravessar um rio com um lobo, uma cabra e um maço de couves. Aqui na vila, eles viraram uma raposa, um cordeiro e uma couve.",
        "O barco é pequeno, e ninguém pode ficar em apuros. Você ajuda o barqueiro? Pense com calma: o rio espera por você.",
      ],
    },
    proximo: "barco", proximoConvite: "Quer atravessar outro rio?",
    paises: ["Reino Unido", "França"],
    segredo: ["Descubra quem é o encrenqueiro: o cordeiro briga com a raposa E com a couve. Por isso ele é quem mais precisa de cuidado.", "O barco não serve só para ir: ele também pode trazer alguém de volta.", "Às vezes é preciso dar um passo para trás para depois avançar. Quem poderia voltar no barco?"],
    treina: "Planejar vários passos à frente e testar hipóteses sem medo de errar.",
    foraDaTela: "Use três objetos da casa (uma pelúcia, um brinquedo e uma fruta) e uma toalha como rio. Quem faz o barqueiro?",
    arte: "raposa",
    tipo: "solo",
    cor: "laranja",
    familia: "trav",
    nome: "Raposa, cordeiro e couve",
    resumo: "Leve todos para o outro lado do rio sem deixar ninguém em apuros.",
    idade: 7,
    pronto: true,
  },
  {
    id: "elevador",
    objetivo: "Chegue ao andar da bandeirinha usando só os dois botões.",
    direito: "dp", // domínio público: tradição de problemas aritméticos; fases nossas
    interesses: ["planejar", "numeros"],
    curiosidade: "Em 1852, o americano Elisha Otis inventou um freio de segurança para elevadores: se o cabo arrebentasse, a cabine ficava presa nos trilhos. Em 1854, ele mostrou o freio funcionando numa grande feira em Nova York.",
    // História narrada pelo Tomé (texto conferido em fonte em 02/10/2026: Wikipédia "Elisha Otis" e "New York
    // Crystal Palace", Museu Nacional de Inventores dos EUA, CultureNow). Cortar o cabo foi de propósito, e a
    // plataforma desceu só alguns centímetros; o texto conta isso sem dramatizar.
    historia: {
      anfitriao: "tome", quem: "Tomé, o bisão", titulo: "O elevador que não cai", convite: "A história do Tomé", audio: "jogos/elevador/historia.mp3",
      paginas: [
        "Oi! Eu sou o Tomé, um bisão dos Estados Unidos. Eu adoro prédios bem altos e a vista lá de cima.",
        "Antigamente, subir de andar não era nada fácil. Já existiam elevadores, mas as pessoas tinham medo deles: se o cabo arrebentasse, a cabine podia cair.",
        "Um inventor chamado Elisha Otis teve uma ideia: um freio de segurança. Se o cabo arrebentasse, o freio prendia a cabine nos trilhos, e ela ficava parada.",
        "Em mil oitocentos e cinquenta e quatro, numa grande feira em Nova York, ele fez um teste na frente de todo mundo. A plataforma subiu bem alto, o cabo foi cortado de propósito, e o freio funcionou: ela só desceu alguns centímetros e parou.",
        "Com elevadores mais confiáveis, os prédios puderam crescer cada vez mais para cima.",
        "Agora é a sua vez de ser o engenheiro. Só há dois botões: um sobe, o outro desce. Pense com calma e leve o elevador até a bandeira.",
      ],
    },
    proximo: "hanoi", proximoConvite: "Quer mover uma torre de discos?",
    paises: [],
    paises: [],
    segredo: ["Pense ao contrário: de qual andar dá para chegar ao alvo com um só aperto?", "Cada aperto sobe ou desce sempre o mesmo tanto. Então só alguns andares são alcançáveis.", "Se os dois botões andam de números pares (2 e 4, por exemplo), você só visita andares pares. Se o alvo é ímpar, não dá!"],
    treina: "Fazer contas de cabeça e perceber quando algo é impossível.",
    foraDaTela: "Desenhe um prédio no papel e use uma tampinha como elevador. Invente botões novos para alguém da família resolver.",
    arte: "elevador",
    tipo: "solo",
    cor: "azul",
    familia: "trav",
    nome: "Elevador de botões",
    resumo: "Só dois botões: um sobe, outro desce. Chegue ao andar certo.",
    idade: 7,
    pronto: true,
  },
  {
    id: "hanoi",
    objetivo: "Leve a torre inteira para o pino da direita, um disco por vez.",
    direito: "dp", // domínio público: Édouard Lucas, 1883
    interesses: ["planejar", "espaco"],
    curiosidade: "O francês Édouard Lucas inventou a Torre em 1883 e criou ele mesmo a lenda de monges que moveriam 64 discos de ouro. A lenda é de mentirinha, mas a conta é de verdade: com 64 discos seriam mais de 18 quintilhões de movimentos, e nenhuma vida inteira daria conta!",
    // História narrada pelo Gui (texto conferido em fonte em 02/10/2026: Wikipédia "Tower of Hanoi" e "Édouard Lucas",
    // MacTutor St Andrews). A lenda do templo foi inventada pelo próprio Lucas; o fim do mundo, que faz parte dela,
    // ficou de fora, para não assustar os pequenos.
    historia: {
      anfitriao: "gui", quem: "Gui, o galo", titulo: "A lenda que o Lucas inventou", convite: "A história do Gui", audio: "jogos/hanoi/historia.mp3",
      paginas: [
        "Oi! Eu sou o Gui, um galo da França. Lá tem muitos mestres da matemática, e eu adoro brincar com os jogos deles.",
        "Em mil oitocentos e oitenta e três, um matemático francês chamado Édouard Lucas inventou este brinquedo: a Torre de Hanói.",
        "Ele queria que o jogo parecesse mágico. Por isso, assinou com um nome de mentirinha, N. Claus de Siam, que é o nome dele embaralhado.",
        "E contou uma lenda: num templo distante, monges movem sessenta e quatro discos de ouro, um de cada vez, sem pôr disco grande em cima de pequeno.",
        "Essa lenda foi inventada pelo próprio Lucas, mas a conta é de verdade: com sessenta e quatro discos, seriam mais de dezoito quintilhões de movimentos. Nenhuma vida inteira daria conta!",
        "Com poucos discos é bem mais fácil. Cada disco a mais dobra o trabalho, mais um movimento. Vamos começar com calma?",
      ],
    },
    proximo: "pontos", proximoConvite: "Quer jogar outro jogo do Lucas?",
    paises: ["França"],
    segredo: ["Olhe primeiro para o disco maior: ele só consegue ir para o pino da direita quando todos os outros estiverem juntos no pino do meio.", "Então o problema grande vira um menor: levar a torre de cima para o meio. E esse, de novo, vira um menor ainda.", "O menor disco se move a cada duas jogadas, sempre girando no mesmo sentido.", "Cada disco a mais dobra o trabalho, mais um: 3 discos são 7 movimentos, 4 são 15, 5 são 31."],
    treina: "Dividir um problema grande em partes menores e enxergar padrões.",
    foraDaTela: "Empilhe três potes, tampas ou livros de tamanhos diferentes e mude a torre de lugar, com as mesmas regras.",
    arte: "hanoi",
    tipo: "solo",
    cor: "roxo",
    familia: "trav",
    nome: "Torre de Hanói",
    resumo: "Mude a torre de lugar, um disco por vez, sem pôr grande sobre pequeno.",
    idade: 7,
    pronto: true,
  },
  {
    id: "nim",
    objetivo: "Na sua vez, tire palitos de uma fileira só. Veja antes a regra do último palito.",
    direito: "dp", // domínio público: jogo antigo; teoria de Bouton, 1901
    interesses: ["duelo", "numeros"],
    curiosidade: "Em 1951, numa exposição na Inglaterra, uma máquina chamada Nimrod jogava Nim contra o público. Foi um dos primeiros computadores construídos para jogar.",
    // História narrada pelo Tito (texto conferido em fonte em 02/10/2026: Wikipédia "Nim" e "Charles L. Bouton",
    // "Nimrod (computer)"). A origem chinesa é só uma possibilidade; o texto diz isso.
    historia: {
      anfitriao: "tito", quem: "Tito, o panda", titulo: "O jogo dos palitos", convite: "A história do Tito", audio: "jogos/nim/historia.mp3",
      paginas: [
        "Oi! Eu sou o Tito, um panda da China. Eu adoro bambu e adoro jogos de pensar.",
        "Este jogo se chama Nim, e é muito antigo. Algumas pessoas acham que ele veio da China, de uma brincadeira de tirar pedrinhas, mas ninguém tem certeza.",
        "Em mil novecentos e um, um professor americano chamado Charles Bouton descobriu como sempre ganhar. Foi ele quem deu ao jogo o nome Nim.",
        "Dizem que Nim vem de uma palavra alemã que quer dizer tire. Combina, não é? No jogo, a gente tira palitos.",
        "Em mil novecentos e cinquenta e um, numa feira na Inglaterra, uma máquina chamada Nimrod jogava Nim contra as pessoas. Foi um dos primeiros computadores feitos para jogar.",
        "Aqui na vila, os palitos viram bambu. Será que você descobre o jeito de sempre ganhar? Pense com calma.",
      ],
    },
    proximo: "pontos", proximoConvite: "Quer jogar Pontos e caixinhas?",
    paises: ["China"],
    segredo: ["Com duas fileiras iguais, quem joga depois pode sempre copiar: o que o outro tirar de uma, você tira da outra.", "Com mais fileiras, o truque é deixar tudo \"em pares\" para o outro. Os mais velhos podem aprender a conta secreta: somar em binário sem \"vai um\".", "Na regra \"quem tira o último perde\", joga-se igual até o fim, e só na última hora você muda o plano."],
    treina: "Pensar no que o outro vai fazer e descobrir uma estratégia que sempre vence.",
    foraDaTela: "Faça fileiras com palitos de picolé, feijões ou tampinhas e jogue com alguém da família.",
    arte: "nim",
    tipo: "duelo",
    cor: "vermelho",
    familia: "dupla",
    nome: "Nim",
    resumo: "Tire palitos de uma fileira. Quem pega o último? Você decide a regra.",
    idade: 8,
    pronto: true,
  },
  {
    id: "pontos",
    objetivo: "Ligue dois pontos vizinhos. Fechou uma caixinha? Ela é sua e você joga de novo.",
    direito: "dp", // domínio público: Édouard Lucas, 1889
    interesses: ["duelo", "espaco"],
    curiosidade: "Pontos e caixinhas foi descrito em 1889 por Édouard Lucas, o mesmo matemático francês que inventou a Torre de Hanói. Ele chamava o jogo de pipopipette, e ele ganhou muitos outros nomes pelo mundo.",
    // História narrada pelo Gui (texto conferido em fonte em 02/10/2026: Wikipédia "Dots and boxes" e "Édouard Lucas").
    historia: {
      anfitriao: "gui", quem: "Gui, o galo", titulo: "O jogo de papel e lápis", convite: "A história do Gui", audio: "jogos/pontos/historia.mp3",
      paginas: [
        "Oi de novo! Eu sou o Gui, o galo da França. Hoje vou contar a história de outro jogo do Édouard Lucas.",
        "Em mil oitocentos e oitenta e nove, ele escreveu sobre um jogo de papel e lápis que chamou de pipopipette. É um nome que parece de brincadeira, não é?",
        "Para jogar, só precisa de uma folha cheia de pontos e de um lápis. Cada pessoa liga dois pontos vizinhos, uma linha por vez.",
        "Quando alguém fecha uma caixinha, ela fica sendo dessa pessoa, que joga de novo.",
        "O segredo é não fazer o terceiro lado de uma caixinha. Se fizer, o outro fecha a caixinha e leva o ponto.",
        "O jogo ficou tão popular que ganhou muitos nomes pelo mundo. Aqui na vila, as caixinhas viram canteiros de flores. Boa partida!",
      ],
    },
    proximo: "nim", proximoConvite: "Quer um duelo de palitos?",
    paises: ["França"],
    segredo: ["Nunca faça o terceiro lado de uma caixinha: ele entrega o ponto para o outro.", "No fim, sobram corredores de caixinhas. Quem precisar abrir um corredor entrega todas as caixinhas dele.", "Às vezes vale sacrificar duas caixinhas para obrigar o outro a abrir um corredor maior."],
    treina: "Antecipar consequências e evitar armadilhas.",
    foraDaTela: "Só precisa de uma folha, lápis e duas cores. Desenhe os pontos e jogue em dupla.",
    arte: "pontos",
    tipo: "duelo",
    cor: "verde",
    familia: "dupla",
    nome: "Pontos e caixinhas",
    resumo: "Ligue os pontos e feche caixinhas. Cuidado com o terceiro lado!",
    idade: 7,
    pronto: true,
  },
  {
    id: "colmeia",
    objetivo: "Descubra onde tem mel. Cada número conta quantos vizinhos têm mel.",
    direito: "mp", // marca própria: inspirado em Hexcells (Matthew Brown, 2014); nome, arte, fases e gerador nossos
    interesses: ["deduzir"],
    curiosidade: "As abelhas fazem favos de seis lados porque o hexágono cobre o espaço sem deixar buracos gastando pouca cera. Em 1999, o matemático Thomas Hales provou que é a forma mais econômica.",
    paises: [],
    segredo: ["Procure um número que já está completo: se ele diz 2 e já tem 2 méis em volta, todos os outros vizinhos estão vazios.", "Procure um número que precisa de todos: se ele diz 3 e só sobram 3 vizinhos escondidos, todos têm mel.", "Compare dois números vizinhos: o que um sabe sobre os vizinhos em comum ajuda o outro.", "Não chute. Se não tiver certeza sobre um favo, procure outro lugar da colmeia."],
    treina: "Deduzir com certeza: só marcar um favo quando os números provarem.",
    foraDaTela: "Toque no botão \"?\" e depois em \"Imprimir este desafio\" para resolver a colmeia com lápis.",
    arte: "colmeia",
    tipo: "solo",
    cor: "laranja",
    familia: "grade",
    nome: "Colmeia Lógica",
    resumo: "Descubra onde tem mel. Os números contam os vizinhos com mel. Sem chutar!",
    idade: 7,
    pronto: true,
  },
  {
    id: "enigma",
    objetivo: "Use as pistas para descobrir quem tem cada coisa. Marque ✕ onde não pode ser e ✓ onde é.",
    direito: "dp", // domínio público: enigma de pistas tradicional (o mais famoso, Life International, 1962)
    interesses: ["deduzir"],
    curiosidade: "Em dezembro de 1962, a revista Life International publicou um enigma de lógica cheio de pistas. Centenas de leitores do mundo todo mandaram a resposta certa. Muita gente diz que foi Einstein quem inventou esse enigma, mas não há nenhuma prova disso.",
    paises: [],
    segredo: ["Comece pelas pistas que dizem \"não\": cada ✕ tira uma possibilidade.", "Quando uma linha só tem uma casa vazia, a resposta está nela.", "Se alguém já tem um ✓ numa tabela, ninguém mais pode ter a mesma coisa.", "Uma pista que fala de duas coisas (\"quem tem o gato brinca com a bola\") liga duas tabelas: o que vale numa, vale na outra."],
    treina: "Ler com atenção, juntar as pistas e descartar o que não pode ser.",
    foraDaTela: "Invente um enigma para a família: três pessoas, três sobremesas e duas pistas. Quem descobre primeiro?",
    arte: "lupa",
    tipo: "solo",
    cor: "verde",
    familia: "deduz",
    nome: "Enigma de lógica em grade",
    resumo: "Junte as pistas e descubra quem tem cada coisa.",
    idade: 9,
    pronto: true,
  },
  {
    id: "senha",
    objetivo: "Descubra a senha de frutas no cofre do Samuca. As pistas dizem quantas estão no lugar certo.",
    direito: "dp", // domínio público: brincadeira tradicional de papel e lápis "Touros e vacas"
    interesses: ["deduzir"],
    curiosidade: "A Senha vem de uma brincadeira antiga de papel e lápis chamada Touros e vacas: o touro é um número no lugar certo, e a vaca, um número certo fora do lugar. Ela é mais antiga que os jogos de tabuleiro vendidos em loja com a mesma ideia e, nos anos 1970, virou um dos primeiros jogos de computador.",
    paises: [],
    segredo: ["A primeira tentativa serve para descobrir quais frutas estão no cofre.", "Se uma tentativa não tem nenhuma fruta no cofre, todas aquelas frutas estão fora.", "Mude uma coisa de cada vez: troque uma fruta de lugar e veja o que acontece com as pistas."],
    treina: "Testar ideias, tirar conclusões de cada pista e lembrar o que já se sabe.",
    foraDaTela: "Esconda três objetos da casa em fila atrás de um livro. A outra pessoa tenta adivinhar a ordem, e você diz quantos estão no lugar certo.",
    arte: "cofre",
    tipo: "solo",
    cor: "roxo",
    familia: "deduz",
    nome: "Senha",
    resumo: "Descubra a senha do Samuca pelas pistas.",
    idade: 8,
    pronto: true,
  },
];

// direito: "dp" (domínio público) ou "mp" (marca própria: tem dono; o jogo usa só a versão
// do portal aprovada na curadoria, com nome, fases e arte nossos). Regra no CLAUDE.md.
// A fila de implementação fica no CLAUDE.md ("Plano das ondas").
