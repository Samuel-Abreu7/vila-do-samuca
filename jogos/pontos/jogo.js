// Pontos e caixinhas — Édouard Lucas, 1889.
// Ligue dois pontos vizinhos. Quem fecha uma caixinha ganha o ponto e joga de novo.
import { carregarEstilo, escolhas, ler, sortear, esperar, faixa, som, festa, prepararJogo, dicasEmDegraus, repetir, esc, escolhaDaCrianca, guardarEscolha } from "../../util.js";
import { arte, avatar, icone } from "../../arte.js";

const PASSO = 60, MARGEM = 20;
// Fases guiadas: 1) 2×2 com guia; 2) 3×3 com guia; 3) 3×3 sozinho.
const GUIADAS = { 1: 2, 2: 3, 3: 3 };

// Linha: {t:"h"|"v", r, c}. Chave "h-r-c".
const chave = (l) => `${l.t}-${l.r}-${l.c}`;

function todasLinhas(n) {
  const ls = [];
  for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) ls.push({ t: "h", r, c });
  for (let r = 0; r < n; r++) for (let c = 0; c <= n; c++) ls.push({ t: "v", r, c });
  return ls;
}
const ladosDaCaixa = (r, c) => [`h-${r}-${c}`, `h-${r + 1}-${c}`, `v-${r}-${c}`, `v-${r}-${c + 1}`];
function caixasVizinhas(l, n) {
  const cx = l.t === "h" ? [[l.r - 1, l.c], [l.r, l.c]] : [[l.r, l.c - 1], [l.r, l.c]];
  return cx.filter(([r, c]) => r >= 0 && c >= 0 && r < n && c < n);
}
const contarLados = (feitas, r, c) => ladosDaCaixa(r, c).filter((k) => feitas.has(k)).length;
const linhaDeChave = (k) => { const [t, r, c] = k.split("-"); return { t, r: Number(r), c: Number(c) }; };

// Jogada boa: fecha caixinha se der; senão, a que entrega menos caixinhas ao adversário.
export function melhorJogada(n, feitas) {
  const livres = todasLinhas(n).filter((l) => !feitas.has(chave(l)));
  if (!livres.length) return null;
  const fecha = livres.filter((l) => caixasVizinhas(l, n).some(([r, c]) => contarLados(feitas, r, c) === 3));
  if (fecha.length) return sortear(fecha);
  const entrega = (l) => caixasVizinhas(l, n).filter(([r, c]) => contarLados(feitas, r, c) === 2).length;
  const menor = Math.min(...livres.map(entrega));
  return sortear(livres.filter((l) => entrega(l) === menor));
}

// forca: chance (0 a 1) de fazer a jogada boa em cada lance.
export function jogadaComputador(n, feitas, forca) {
  if (Math.random() < forca) return melhorJogada(n, feitas);
  return sortear(todasLinhas(n).filter((l) => !feitas.has(chave(l))));
}

const SEM_PERFIL = [{ id: "visitante", apelido: "Azul", avatar: "🔵" }, { id: "visitante", apelido: "Vermelho", avatar: "🔴" }];

// Flores dos canteiros: azul para quem joga primeiro, vermelha para o outro (forma diferente também).
const FLOR = [
  `<g fill="#9fd3ff"><circle cx="50" cy="26" r="16"/><circle cx="74" cy="50" r="16"/><circle cx="50" cy="74" r="16"/><circle cx="26" cy="50" r="16"/></g><circle cx="50" cy="50" r="13" fill="#ffc83d"/>`,
  `<path d="M50 10 L61 38 L90 40 L67 58 L75 88 L50 71 L25 88 L33 58 L10 40 L39 38 Z" fill="#ffb3b6"/><circle cx="50" cy="52" r="12" fill="#ffc83d"/>`,
];

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const jogadores = ctx?.jogadores?.length === 2 ? ctx.jogadores : SEM_PERFIL;
  const samuca = jogadores[1].samuca ? jogadores[1] : null;
  const cfg = { n: guiada ? GUIADAS[guiada] : escolhaDaCrianca(ctx, "pontos:n") ?? ler("pontos:n", 3) };
  // Número da partida: a jogada que o Samuca estava pensando não cai numa partida nova.
  let partida = 0;
  let feitas, donos, pontos, vez, fim, pensando, dicasRestantes, novas = new Set(), ultimaLinha = null, seguidas = 0, fechouAgora = 0;
  let ordem = [], vivo = true, repetindo = false;

  palco.innerHTML = `
    <section class="jg pc">
      ${faixa(arte("pontos", 54), "Pontos e caixinhas", { ajustes: !guiada })}
      <div class="placar" id="pc-placar"></div>
      <div class="pc-tabuleiro"><svg id="pc-svg" role="group" aria-label="Tabuleiro" data-teclado=".pc-alvo"></svg></div>
      <p class="aviso" id="pc-aviso" role="status" aria-live="polite"></p>
      <div class="acoes">
        <button type="button" class="botao dourado" id="pc-dica"></button>
        <button type="button" class="botao" id="pc-nova" data-nova-partida>${icone("recomecar")} Nova partida</button>
      </div>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#pc-aviso");
  const svg = $("#pc-svg");
  const apelido = (k) => jogadores[k].apelido; // para textContent
  const nome = (k) => esc(apelido(k)); // vai para innerHTML ou atributo: sempre escapado
  const humano = (k) => !jogadores[k].samuca;

  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Tamanho do jardim</span><div id="pc-tam" data-nova-partida></div>`;
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>Na sua vez, toque entre dois pontos vizinhos para fazer uma cerquinha.</li>
      <li>Fechou um canteiro? Ele é seu, floresce, e você joga de novo.</li>
      <li>Cuidado com o terceiro lado: ele entrega o canteiro para o outro.</li></ul>`,
    passos: () => [{ alvo: ".pc-alvo", texto: "Toque entre dois pontos" }],
  });

  // ---------- Dicas em degraus (contra o Samuca: 2 por partida; entre crianças: a vantagem combinada) ----------
  const botaoDica = $("#pc-dica");
  const dicas = dicasEmDegraus(palco, {
    botao: botaoDica,
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (fim || pensando || !humano(vez)) return null;
      const l = melhorJogada(cfg.n, feitas);
      if (!l) return null;
      const k = chave(l);
      const vizinhas = caixasVizinhas(l, cfg.n);
      const fecha = vizinhas.some(([r, c]) => contarLados(feitas, r, c) === 3);
      const entrega = vizinhas.some(([r, c]) => contarLados(feitas, r, c) === 2);
      return {
        pergunta: fecha ? "Tem alguma caixinha com três lados prontos?" : "Qual cerquinha NÃO faz o terceiro lado de nenhuma caixinha?",
        regiao: vizinhas.map(([r, c]) => `.pc-area[data-caixa="${r}-${c}"]`).join(", "),
        jogada: `.pc-alvo[data-k="${k}"]`,
        textoJogada: fecha ? "Feche esta caixinha: ela é sua." : "Trace a cerquinha que está brilhando.",
        porque: fecha
          ? "Feche a caixinha: ela vira sua e você joga de novo."
          : entrega
            ? "Todas as cerquinhas entregam alguma coisa. Esta é a que entrega menos."
            : "Trace esta: ela não dá o terceiro lado para ninguém.",
      };
    },
  });
  // Cada dica completa gasta uma do estoque; a pergunta (1º degrau) já conta.
  botaoDica.addEventListener("click", () => { if (dicas.degrau === 1) dicasRestantes[vez] -= 1; atualizarBotaoDica(); });
  function atualizarBotaoDica() {
    const bloqueado = fim || pensando || !humano(vez) || repetindo;
    botaoDica.hidden = bloqueado || (dicasRestantes[vez] <= 0 && dicas.degrau === 0 && !guiada);
  }

  function nova() {
    partida += 1;
    feitas = new Map(); // chave -> jogador que traçou
    donos = new Map();  // "r-c" -> jogador
    pontos = [0, 0]; vez = guiada ? 0 : ctx?.comeca ?? 0; fim = false; pensando = false; ultimaLinha = null; seguidas = 0; fechouAgora = 0;
    ordem = [];
    const combinadas = ctx?.dicas ?? [0, 0];
    dicasRestantes = samuca ? [Math.max(2, combinadas[0]), 0] : [...combinadas];
    desenhar();
    dicas.zerar();
    if (!humano(vez)) vezDoSamuca();
  }

  function desenhar() {
    const n = cfg.n, tam = n * PASSO + 2 * MARGEM;
    svg.setAttribute("viewBox", `0 0 ${tam} ${tam}`);
    const x = (c) => MARGEM + c * PASSO, y = (r) => MARGEM + r * PASSO;
    const podeTocar = !fim && !pensando && humano(vez) && !repetindo;
    let h = "";
    // Área de cada canteiro (invisível; a dica usa para mostrar a região).
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      h += `<g class="pc-area" data-caixa="${r}-${c}"><rect x="${x(c) + 4}" y="${y(r) + 4}" width="${PASSO - 8}" height="${PASSO - 8}" rx="6" fill="none" stroke="none"/></g>`;
    }
    for (const [k, j] of donos) {
      const [r, c] = k.split("-").map(Number);
      h += `<rect class="pc-caixa dono${j} ${novas.has(k) ? "nova" : ""}" x="${x(c) + 3}" y="${y(r) + 3}" width="${PASSO - 6}" height="${PASSO - 6}" rx="6" role="img" aria-label="Caixinha da fileira ${r + 1}, coluna ${c + 1}: de ${nome(j)}"/>
            <g class="pc-flor ${novas.has(k) ? "nova" : ""}" transform="translate(${x(c) + 12} ${y(r) + 12}) scale(.36)">${FLOR[j]}</g>`;
    }
    for (const l of todasLinhas(n)) {
      const k = chave(l);
      const [x1, y1, x2, y2] = l.t === "h" ? [x(l.c), y(l.r), x(l.c + 1), y(l.r)] : [x(l.c), y(l.r), x(l.c), y(l.r + 1)];
      if (feitas.has(k)) {
        h += `<line pathLength="1" class="pc-linha dono${feitas.get(k)} ${k === ultimaLinha ? "nova" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      } else if (!fim) {
        // Área de toque em losango: os losangos de todas as linhas cobrem o jardim sem se sobrepor,
        // então cada toque pertence a uma linha só, e a área é bem maior que a linha.
        const meio = PASSO / 2;
        const alvo = l.t === "h"
          ? `${x1},${y1} ${x1 + meio},${y1 - meio} ${x2},${y2} ${x1 + meio},${y1 + meio}`
          : `${x1},${y1} ${x1 + meio},${y1 + meio} ${x2},${y2} ${x1 - meio},${y1 + meio}`;
        h += `<g class="pc-livre"><line class="pc-guia" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
              <line class="pc-candidata" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
              ${podeTocar ? `<polygon class="pc-alvo" points="${alvo}" data-k="${k}" tabindex="0" role="button" aria-label="${l.t === "h" ? `Linha deitada na fileira ${l.r + 1}, entre os pontos ${l.c + 1} e ${l.c + 2}` : `Linha em pé na coluna ${l.c + 1}, entre as fileiras ${l.r + 1} e ${l.r + 2}`}"/>` : ""}</g>`;
      }
    }
    for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) h += `<circle class="pc-ponto" cx="${x(c)}" cy="${y(r)}" r="6"/>`;
    svg.innerHTML = h;

    $("#pc-placar").innerHTML = [0, 1].map((k) => `
      <div class="j${k + 1} ${vez === k && !fim ? "vez" : ""}"><span>${avatar(jogadores[k].avatar, 30)} ${nome(k)}</span><span>${pontos[k]}</span></div>`).join("");
    $("#pc-nova").disabled = repetindo;
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo; // trocar o tamanho no meio da repetição misturaria os jardins
    atualizarBotaoDica();
    if (!repetindo) {
      if (fim) {
        const perdeuProSamuca = samuca && pontos[1] > pontos[0];
        aviso.className = perdeuProSamuca || pontos[0] === pontos[1] ? "aviso" : "aviso certo";
        aviso.textContent = pontos[0] === pontos[1] ? "Empate!"
          : perdeuProSamuca ? `O ${apelido(1)} ganhou desta vez. Revanche?`
          : `${apelido(pontos[0] > pontos[1] ? 0 : 1)} ganhou!`;
      } else {
        aviso.className = "aviso";
        aviso.textContent = pensando ? `${apelido(vez)} está pensando…`
          : fechouAgora ? `${apelido(vez)} fechou ${fechouAgora > 1 ? `${fechouAgora} caixinhas` : "uma caixinha"} e joga de novo.`
          : `Vez de ${apelido(vez)}.`;
      }
    }
    dicas.reaplicar();
  }

  function terminar() {
    fim = true;
    const vencedor = pontos[0] === pontos[1] ? null : pontos[0] > pontos[1] ? 0 : 1;
    const passos = [...ordem];
    ctx?.definirReplay?.(() => mostrarPartida(passos));
    ctx?.registrarDuelo?.(vencedor);
    const perdeuProSamuca = samuca && vencedor === 1;
    setTimeout(() => som(perdeuProSamuca ? "derrota" : "vitoria"), 200);
    if (vencedor !== null && !perdeuProSamuca) { festa(); if (!guiada && samuca) ctx?.conquistar?.("pontos-samuca", 0); }
    if (samuca && !guiada) ctx.fala(vencedor === 1 ? "ganhei" : "perdi");
  }

  async function vezDoSamuca() {
    const p = partida;
    pensando = true; if (!guiada) ctx?.fala("pensando"); desenhar();
    await esperar(800);
    if (!vivo || p !== partida) return;
    pensando = false;
    // Nas fases guiadas o Samuca joga fraquinho: o importante é aprender.
    tracar(chave(jogadaComputador(cfg.n, feitas, guiada ? 0.2 : samuca.forca)));
  }

  // aplicar: false durante a repetição (só atualiza o tabuleiro, sem som, conquista nem vez do Samuca).
  function tracar(k, { aplicar = true } = {}) {
    if (feitas.has(k) || (fim && aplicar)) return;
    const l = linhaDeChave(k);
    feitas.set(k, vez);
    ultimaLinha = k;
    let fechou = 0;
    novas = new Set();
    for (const [br, bc] of caixasVizinhas(l, cfg.n)) {
      if (contarLados(feitas, br, bc) === 4) { donos.set(`${br}-${bc}`, vez); novas.add(`${br}-${bc}`); fechou++; }
    }
    pontos[vez] += fechou;
    if (!aplicar) { if (!fechou) vez = 1 - vez; return; }
    fechouAgora = fechou;
    ordem.push(k);
    som(fechou ? "ponto" : "toque");
    seguidas = fechou ? seguidas + fechou : 0;
    if (!guiada && seguidas >= 3 && humano(vez)) ctx?.conquistar?.("pontos-tres", vez);
    if (donos.size === cfg.n * cfg.n) terminar();
    else if (!fechou) { vez = 1 - vez; seguidas = 0; }
    desenhar();
    dicas.zerar();
    if (!fim && !humano(vez)) vezDoSamuca();
  }

  // Repete a partida, cerquinha por cerquinha.
  async function mostrarPartida(passos) {
    repetindo = true;
    const salvo = { feitas, donos, pontos, vez };
    feitas = new Map(); donos = new Map(); pontos = [0, 0]; vez = guiada ? 0 : ctx?.comeca ?? 0;
    ctx?.dizer?.("Vamos rever a partida, cerquinha por cerquinha!", "feliz");
    await repetir(passos, (k, i) => {
      tracar(k, { aplicar: false });
      desenhar();
      aviso.className = "aviso"; aviso.textContent = `Lance ${i + 1} de ${passos.length}`;
    }, { intervalo: cfg.n > 3 ? 500 : 800, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false;
    ({ feitas, donos, pontos, vez } = salvo);
    novas = new Set();
    desenhar();
  }

  const acionar = (e) => {
    const alvo = e.target.closest(".pc-alvo");
    if (alvo && !pensando && !repetindo) tracar(alvo.dataset.k);
  };
  svg.addEventListener("click", acionar);
  svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); acionar(e); } });
  $("#pc-nova").addEventListener("click", nova);
  if (!guiada) {
    escolhas(ajustes.querySelector("#pc-tam"), [[3, "3×3"], [4, "4×4"], [5, "5×5"]], cfg.n,
      (v) => { cfg.n = v; guardarEscolha(ctx, "pontos:n", v); jogo.fecharAjustes(); nova(); });
  }

  setTimeout(() => {
    nova();
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho. Cuidado com o terceiro lado!");
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
