// Enigma de lógica em grade — tradição dos enigmas de pistas (o mais famoso saiu na revista
// Life International em 1962). Domínio público; pessoas, pistas, arte e enigmas são nossos.
// As pessoas são os apelidos das crianças da família. Cada enigma é gerado na hora e conferido
// por um resolvedor que só usa raciocínios que uma criança consegue seguir: então tem uma
// resposta só, e dá para chegar nela pensando, sem chutar.
import { carregarEstilo, escolhas, faixa, som, festa, prepararJogo, dicasEmDegraus, repetir, esc, escolhaDaCrianca, guardarEscolha, botaoOuvir } from "../../util.js";
import { arte, icone } from "../../arte.js";
import { criancas } from "../../perfis.js";

// Cada categoria tem um verbo, para as pistas soarem como frases de verdade.
const CATEGORIAS = [
  { id: "bicho", nome: "Bicho", verbo: "tem", nao: "não tem", itens: [
    { id: "gato", art: "o gato" }, { id: "cachorro", art: "o cachorro" }, { id: "sapo", art: "o sapo" },
    { id: "panda", art: "o panda" }, { id: "polvo", art: "o polvo" }, { id: "abelha", art: "a abelha" }] },
  { id: "brinquedo", nome: "Brinquedo", verbo: "brinca com", nao: "não brinca com", itens: [
    { id: "bola", art: "a bola" }, { id: "balao", art: "o balão" }, { id: "violao", art: "o violão" },
    { id: "carro", art: "o carro" }, { id: "foguete", art: "o foguete" }] },
  { id: "cor", nome: "Cor favorita", verbo: "prefere", nao: "não prefere", itens: [
    { id: "azul", art: "o azul", cor: "#3aa6ff" }, { id: "vermelho", art: "o vermelho", cor: "#ff5b61" },
    { id: "amarelo", art: "o amarelo", cor: "#ffc83d" }, { id: "verde", art: "o verde", cor: "#3bd67f" },
    { id: "roxo", art: "o roxo", cor: "#a879ff" }] },
];
const nomeItem = (it) => it.art.replace(/^(o|a) /, "");
const RESERVA = ["Pipoca", "Faísca", "Bolota", "Tico", "Nina", "Juba", "Pingo"];

// "Aprenda a jogar" em 5 níveis: cresce o número de pessoas, de tabelas e o tipo de pista.
export const NIVEIS = [
  { id: 1, nome: "Nível 1", pessoas: 3, cats: 1, tipos: ["nao", "tem"], dificuldade: 550 },
  { id: 2, nome: "Nível 2", pessoas: 3, cats: 2, tipos: ["nao", "tem", "liga"], dificuldade: 700 },
  { id: 3, nome: "Nível 3", pessoas: 4, cats: 2, tipos: ["nao", "tem", "liga", "desliga"], dificuldade: 850 },
  { id: 4, nome: "Nível 4", pessoas: 4, cats: 3, tipos: ["nao", "liga", "desliga", "ou"], dificuldade: 1050 },
  { id: 5, nome: "Nível 5", pessoas: 5, cats: 3, tipos: ["nao", "liga", "desliga", "ou"], dificuldade: 1250 },
];
// Fases guiadas: 1) duas pessoas e uma pista; 2) três pessoas; 3) duas tabelas, sozinho.
const GUIADAS = {
  1: { id: "g1", nome: "de treino", pessoas: 2, cats: 1, tipos: ["nao"], dificuldade: 400 },
  2: { id: "g2", nome: "de treino", pessoas: 3, cats: 1, tipos: ["nao", "tem"], dificuldade: 500 },
  3: { id: "g3", nome: "de treino", pessoas: 3, cats: 2, tipos: ["nao", "tem", "liga"], dificuldade: 600 },
};

const embaralhar = (lista) => { const l = [...lista]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };

// ---------- Texto das pistas ----------
export function textoPista(pz, k) {
  const q = pz.pistas[k], P = pz.pessoas, C = pz.cats;
  const it = (c, i) => C[c].itens[i].art;
  switch (q.t) {
    case "tem": return `${P[q.p]} ${C[q.c].verbo} ${it(q.c, q.i)}.`;
    case "nao": return `${P[q.p]} ${C[q.c].nao} ${it(q.c, q.i)}.`;
    case "ou": return `${P[q.p]} ${C[q.c].verbo} ${it(q.c, q.i)} ou ${it(q.c, q.j)}.`;
    case "liga": return `Quem ${C[q.c].verbo} ${it(q.c, q.i)} ${C[q.c2].verbo} ${it(q.c2, q.i2)}.`;
    case "desliga": return `Quem ${C[q.c].verbo} ${it(q.c, q.i)} ${C[q.c2].nao} ${it(q.c2, q.i2)}.`;
  }
  return "";
}

// ---------- Resolvedor ----------
// est[c][p][i]: 1 (sim), -1 (não), 0 (ainda não se sabe). Devolve a PRÓXIMA dedução, com o
// motivo em palavras, na ordem em que uma criança costuma pensar: pistas diretas, depois linha
// e coluna de cada tabela, depois as pistas que juntam duas tabelas.
export function proximo(pz, est) {
  const C = pz.cats, P = pz.pessoas, n = P.length;
  const vazio = (c, p, i) => est[c][p][i] === 0;
  const achou = (c, p, i, v, regra, extra = {}) => ({ c, p, i, v, regra, ...extra });
  const verbo = (c) => C[c].verbo;
  const it = (c, i) => C[c].itens[i].art;

  // 1. Pistas diretas.
  for (let k = 0; k < pz.pistas.length; k++) {
    const q = pz.pistas[k];
    if (q.t === "tem" && vazio(q.c, q.p, q.i)) return achou(q.c, q.p, q.i, 1, "pista", { k, porque: `A pista ${k + 1} diz: ${textoPista(pz, k)}` });
    if (q.t === "nao" && vazio(q.c, q.p, q.i)) return achou(q.c, q.p, q.i, -1, "pista", { k, porque: `A pista ${k + 1} diz: ${textoPista(pz, k)}` });
    if (q.t === "ou") {
      for (let j = 0; j < n; j++) if (j !== q.i && j !== q.j && vazio(q.c, q.p, j))
        return achou(q.c, q.p, j, -1, "pista", { k, porque: `Pela pista ${k + 1}, ${P[q.p]} ${verbo(q.c)} ${it(q.c, q.i)} ou ${it(q.c, q.j)}. Então não é ${it(q.c, j)}.` });
    }
  }
  // 2. Linha e coluna de cada tabela.
  for (let c = 0; c < C.length; c++) {
    for (let p = 0; p < n; p++) {
      const sim = est[c][p].indexOf(1);
      if (sim >= 0) { for (let i = 0; i < n; i++) if (vazio(c, p, i)) return achou(c, p, i, -1, "linha", { porque: `${P[p]} já ${verbo(c)} ${it(c, sim)}. Cada pessoa tem uma coisa só nessa tabela.` }); }
      else {
        const livres = [...Array(n).keys()].filter((i) => vazio(c, p, i));
        if (livres.length === 1) return achou(c, p, livres[0], 1, "linha", { porque: `Para ${P[p]} só sobrou ${it(c, livres[0])}.` });
      }
    }
    for (let i = 0; i < n; i++) {
      const dono = [...Array(n).keys()].find((p) => est[c][p][i] === 1);
      if (dono !== undefined) { for (let p = 0; p < n; p++) if (vazio(c, p, i)) return achou(c, p, i, -1, "coluna", { porque: `${P[dono]} já ${verbo(c)} ${it(c, i)}. Ninguém mais pode.` }); }
      else {
        const livres = [...Array(n).keys()].filter((p) => vazio(c, p, i));
        if (livres.length === 1) return achou(c, livres[0], i, 1, "coluna", { porque: `Só ${P[livres[0]]} ainda pode ${verbo(c)} ${it(c, i)}.` });
      }
    }
  }
  // 3. "Ou" com uma das duas já descartada; pistas que juntam duas tabelas.
  for (let k = 0; k < pz.pistas.length; k++) {
    const q = pz.pistas[k];
    if (q.t === "ou") {
      if (est[q.c][q.p][q.i] === -1 && vazio(q.c, q.p, q.j)) return achou(q.c, q.p, q.j, 1, "pista", { k, porque: `Pela pista ${k + 1} é ${it(q.c, q.i)} ou ${it(q.c, q.j)}, e não é ${it(q.c, q.i)}. Então é ${it(q.c, q.j)}.` });
      if (est[q.c][q.p][q.j] === -1 && vazio(q.c, q.p, q.i)) return achou(q.c, q.p, q.i, 1, "pista", { k, porque: `Pela pista ${k + 1} é ${it(q.c, q.i)} ou ${it(q.c, q.j)}, e não é ${it(q.c, q.j)}. Então é ${it(q.c, q.i)}.` });
    }
    if (q.t === "liga" || q.t === "desliga") {
      for (let p = 0; p < n; p++) {
        const a = est[q.c][p][q.i], b = est[q.c2][p][q.i2];
        const diz = `A pista ${k + 1} diz: ${textoPista(pz, k)}`;
        if (q.t === "liga") {
          if (a === 1 && vazio(q.c2, p, q.i2)) return achou(q.c2, p, q.i2, 1, "liga", { k, porque: `${diz} ${P[p]} ${verbo(q.c)} ${it(q.c, q.i)}, então ${verbo(q.c2)} ${it(q.c2, q.i2)}.` });
          if (b === 1 && vazio(q.c, p, q.i)) return achou(q.c, p, q.i, 1, "liga", { k, porque: `${diz} ${P[p]} ${verbo(q.c2)} ${it(q.c2, q.i2)}, então ${verbo(q.c)} ${it(q.c, q.i)}.` });
          if (a === -1 && vazio(q.c2, p, q.i2)) return achou(q.c2, p, q.i2, -1, "liga", { k, porque: `${diz} ${P[p]} ${C[q.c].nao} ${it(q.c, q.i)}, então também ${C[q.c2].nao} ${it(q.c2, q.i2)}.` });
          if (b === -1 && vazio(q.c, p, q.i)) return achou(q.c, p, q.i, -1, "liga", { k, porque: `${diz} ${P[p]} ${C[q.c2].nao} ${it(q.c2, q.i2)}, então também ${C[q.c].nao} ${it(q.c, q.i)}.` });
        } else {
          if (a === 1 && vazio(q.c2, p, q.i2)) return achou(q.c2, p, q.i2, -1, "liga", { k, porque: `${diz} ${P[p]} ${verbo(q.c)} ${it(q.c, q.i)}, então ${C[q.c2].nao} ${it(q.c2, q.i2)}.` });
          if (b === 1 && vazio(q.c, p, q.i)) return achou(q.c, p, q.i, -1, "liga", { k, porque: `${diz} ${P[p]} ${verbo(q.c2)} ${it(q.c2, q.i2)}, então ${C[q.c].nao} ${it(q.c, q.i)}.` });
        }
      }
    }
  }
  return null;
}

const estadoVazio = (pz) => pz.cats.map(() => pz.pessoas.map(() => pz.pessoas.map(() => 0)));
// Resolve do zero só com o resolvedor. true = chega à resposta inteira (então ela é única).
function resolvivel(pz) {
  const est = estadoVazio(pz);
  for (let d = proximo(pz, est); d; d = proximo(pz, est)) est[d.c][d.p][d.i] = d.v;
  return est.every((tab, c) => tab.every((linha, p) => linha[pz.sol[c][p]] === 1));
}

// ---------- Gerador ----------
export function gerar(cfg, nomes) {
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const n = cfg.pessoas;
    const cats = embaralhar(CATEGORIAS).slice(0, cfg.cats).map((c) => ({ ...c, itens: embaralhar(c.itens).slice(0, n) }));
    const sol = cats.map(() => embaralhar([...Array(n).keys()])); // sol[c][p] = item da pessoa p
    const dono = (c, i) => sol[c].indexOf(i);
    const todas = [];
    for (let c = 0; c < cats.length; c++) for (let p = 0; p < n; p++) {
      todas.push({ t: "tem", c, p, i: sol[c][p] });
      for (let i = 0; i < n; i++) if (i !== sol[c][p]) {
        todas.push({ t: "nao", c, p, i });
        todas.push(Math.random() < 0.5 ? { t: "ou", c, p, i: sol[c][p], j: i } : { t: "ou", c, p, i, j: sol[c][p] });
      }
    }
    for (let c = 0; c < cats.length; c++) for (let c2 = c + 1; c2 < cats.length; c2++) for (let i = 0; i < n; i++) for (let i2 = 0; i2 < n; i2++)
      todas.push(dono(c, i) === dono(c2, i2) ? { t: "liga", c, i, c2, i2 } : { t: "desliga", c, i, c2, i2 });
    const pool = embaralhar(todas.filter((q) => cfg.tipos.includes(q.t)));
    // Junta pistas até o resolvedor chegar à resposta; no máximo uma pista "tem" (senão fica fácil demais).
    const pz = { pessoas: nomes.slice(0, n), cats, sol, pistas: [] };
    let tens = 0;
    for (const q of pool) {
      if (q.t === "tem" && tens >= 1) continue;
      pz.pistas.push(q); if (q.t === "tem") tens++;
      if (resolvivel(pz)) break;
    }
    if (!resolvivel(pz)) continue;
    // Tira as pistas que sobram: fica só o necessário.
    for (const q of embaralhar([...pz.pistas])) {
      const sem = { ...pz, pistas: pz.pistas.filter((x) => x !== q) };
      if (resolvivel(sem)) pz.pistas = sem.pistas;
    }
    // Pistas que dizem "não" primeiro, as que juntam tabelas por último: lê-se do mais fácil ao mais difícil.
    const ordem = { tem: 0, nao: 1, ou: 2, liga: 3, desliga: 4 };
    pz.pistas.sort((a, b) => ordem[a.t] - ordem[b.t]);
    return pz;
  }
  return null;
}

// Apelidos da família (quem está jogando primeiro), completados com nomes de reserva.
function nomesDaFamilia(ctx) {
  const eu = ctx?.jogadores?.[0];
  const meu = eu && eu.id !== "visitante" ? [eu.apelido] : [];
  const outros = embaralhar(criancas().map((c) => c.apelido).filter((a) => !meu.includes(a)));
  const lista = [...meu, ...outros];
  for (const r of embaralhar(RESERVA)) if (!lista.includes(r)) lista.push(r);
  return lista;
}

export const dificuldade = (n) => n.dificuldade;

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const sugerido = ctx && !guiada ? ctx.sugerir(NIVEIS, dificuldade) : null;
  const escolhido = guiada ? null : NIVEIS.find((n) => n.id === escolhaDaCrianca(ctx, "enigma:nivel"));
  let nivel = guiada ? GUIADAS[guiada] : escolhido ?? sugerido ?? NIVEIS[0];
  let modo = "nao";
  let pz, est, enganos, fim, marcas = [], riscadas = new Set(), vivo = true, repetindo = false;

  palco.innerHTML = `
    <section class="jg en">
      ${faixa(arte("lupa", 54), "Enigma de lógica em grade", { ajustes: !guiada })}
      <p class="en-nivel" id="en-nivel"></p>
      <div class="en-caderno">
        <div class="en-pistas-caixa">
          <p class="en-titulo" id="en-titulo">Pistas <span class="en-titulo-nota">(toque numa pista para riscar)</span></p>
          <ol class="en-pistas" id="en-pistas"></ol>
        </div>
        <div class="en-tabelas" id="en-tabelas" data-teclado=".en-cel"></div>
      </div>
      <p class="en-marcando" id="en-marcando-titulo">Ao tocar numa casa da tabela, marcar:</p>
      <div class="en-modos" role="group" aria-labelledby="en-marcando-titulo">
        <button type="button" class="en-modo" data-modo="nao"><span class="en-simbolo nao" aria-hidden="true">✕</span> Não</button>
        <button type="button" class="en-modo" data-modo="sim"><span class="en-simbolo sim" aria-hidden="true">✓</span> Sim</button>
      </div>
      <p class="aviso" id="en-aviso" role="status" aria-live="polite"></p>
      <div class="acoes">
        <button type="button" class="botao dourado" id="en-dica"></button>
        <button type="button" class="botao" id="en-desfazer">${icone("desfazer")} Desfazer</button>
      </div>
      <button type="button" class="botao" id="en-novo" data-nova-partida>${icone("recomecar")} Novo enigma</button>
      <p class="contagem" id="en-contagem"></p>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#en-aviso");
  // As pistas são o texto mais importante do jogo: botão Ouvir que lê todas, numeradas.
  $("#en-titulo").append(botaoOuvir(() => pz.pistas.map((_, k) => `Pista ${k + 1}. ${textoPista(pz, k)}`).join(" "), "Ouvir as pistas"));

  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Aprenda a jogar: escolha o nível</span><div id="en-niveis" data-nova-partida></div>`;
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>Cada pessoa tem uma coisa de cada tabela, e cada coisa é de uma pessoa só.</li>
      <li>Leia as pistas. Escolha embaixo "Não" (✕) ou "Sim" (✓) e toque na casa da tabela.</li>
      <li>Quando alguém já tem um ✓ numa tabela, o resto da linha e da coluna é ✕.</li>
      <li>Toque numa pista para riscar a que você já usou.</li>
      <li>Dá sempre para descobrir pensando, sem chutar. A dica mostra a próxima casa que já dá para saber.</li></ul>`,
    imprimir: () => ({
      titulo: `Enigma de lógica (${nivel.nome.toLowerCase()})`,
      html: `<p>Use as pistas para descobrir quem tem cada coisa. Marque ✕ onde não pode ser e ✓ onde é.</p>
        <ol>${pz.pistas.map((_, k) => `<li>${esc(textoPista(pz, k))}</li>`).join("")}</ol>
        ${tabelasPapel(false)}
        <div class="quebra gabarito"><h2>Respostas (não espie antes!)</h2>${tabelasPapel(true)}</div>`,
    }),
    passos: () => [
      { alvo: "#en-pistas li", texto: "Leia uma pista" },
      { alvo: '[data-modo="nao"]', texto: "Escolha ✕ ou ✓" },
      { alvo: ".en-cel", texto: "Toque na casa da tabela" },
    ],
  });

  // ---------- Dicas em degraus: a próxima casa que o resolvedor consegue saber ----------
  const nomeCasa = (d) => `${pz.pessoas[d.p]} e ${nomeItem(pz.cats[d.c].itens[d.i])}`;
  const dicas = dicasEmDegraus(palco, {
    botao: $("#en-dica"),
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (fim) return null;
      const d = proximo(pz, est);
      if (!d) return null;
      const P = pz.pessoas, C = pz.cats;
      const pergunta = d.regra === "pista" ? `Releia a pista ${d.k + 1}. O que ela diz sobre ${P[d.p]}?`
        : d.regra === "linha" ? `Olhe a linha de ${P[d.p]} na tabela "${C[d.c].nome}". O que ainda pode ser?`
        : d.regra === "coluna" ? `Olhe a coluna "${nomeItem(C[d.c].itens[d.i])}" na tabela "${C[d.c].nome}". Quem ainda pode ser?`
        : `A pista ${d.k + 1} junta duas tabelas. Compare as linhas de ${P[d.p]} nas duas.`;
      const regiao = d.k !== undefined ? `.en-pistas li[data-pista="${d.k}"]`
        : d.regra === "linha" ? `.en-cel[data-c="${d.c}"][data-p="${d.p}"]`
        : `.en-cel[data-c="${d.c}"][data-i="${d.i}"]`;
      return {
        pergunta, regiao,
        jogada: `.en-cel[data-c="${d.c}"][data-p="${d.p}"][data-i="${d.i}"], .en-modo[data-modo="${d.v > 0 ? "sim" : "nao"}"]`,
        textoJogada: `Marque ${d.v > 0 ? "✓" : "✕"} em ${nomeCasa(d)}.`,
        porque: `${d.porque} Marque ${d.v > 0 ? "✓" : "✕"} em ${nomeCasa(d)}.`,
      };
    },
  });

  function novoEnigma() {
    pz = gerar(nivel, nomesDaFamilia(ctx)) || gerar(NIVEIS[0], nomesDaFamilia(ctx));
    est = estadoVazio(pz);
    enganos = 0; fim = false; marcas = []; riscadas = new Set();
    aviso.textContent = ""; aviso.className = "aviso";
    $("#en-nivel").textContent = guiada ? "Enigma de treino" : `${nivel.nome} de 5`;
    desenhar();
  }

  const desenhoItem = (it) => it.cor
    ? `<span class="en-cor" style="background:${it.cor}" aria-hidden="true"></span>`
    : `<span class="en-figura" aria-hidden="true">${arte(it.id, 30)}</span>`;

  function desenhar() {
    $("#en-pistas").innerHTML = pz.pistas.map((_, k) =>
      `<li data-pista="${k}"><button type="button" class="en-pista ${riscadas.has(k) ? "riscada" : ""}" aria-pressed="${riscadas.has(k)}">${esc(textoPista(pz, k))}</button></li>`).join("");
    $("#en-tabelas").innerHTML = pz.cats.map((cat, c) => `
      <table class="en-tabela">
        <caption>${esc(cat.nome)}</caption>
        <thead><tr><th scope="col"><span class="so-leitor">Pessoa</span></th>${cat.itens.map((it) => `<th scope="col">${desenhoItem(it)}<span class="en-item">${esc(nomeItem(it))}</span></th>`).join("")}</tr></thead>
        <tbody>${pz.pessoas.map((nome, p) => `<tr><th scope="row">${esc(nome)}</th>${cat.itens.map((it, i) => {
          const v = est[c][p][i];
          const estado = v === 1 ? "sim" : v === -1 ? "não" : "ainda não marcado";
          return `<td><button type="button" class="en-cel ${v === 1 ? "sim" : v === -1 ? "nao" : ""}" data-c="${c}" data-p="${p}" data-i="${i}"
            aria-label="${esc(`${nome} e ${nomeItem(it)}, tabela ${cat.nome}: ${estado}`)}" ${fim || repetindo ? "disabled" : ""}>${v === 1 ? "✓" : v === -1 ? "✕" : ""}</button></td>`;
        }).join("")}</tr>`).join("")}</tbody>
      </table>`).join("");
    palco.querySelectorAll(".en-modo").forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.modo === modo)); b.disabled = repetindo; });
    $("#en-desfazer").disabled = fim || repetindo || !marcas.length;
    $("#en-novo").disabled = repetindo;
    $("#en-dica").hidden = fim || repetindo;
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo;
    if (!repetindo) $("#en-contagem").textContent = enganos ? `Enganos: ${enganos}` : "";
    dicas.reaplicar();
  }

  // Versão em papel: tabelas em preto e branco (com as respostas, para o gabarito).
  function tabelasPapel(resposta) {
    return pz.cats.map((cat, c) => `<table><caption>${esc(cat.nome)}</caption>
      <tr><th></th>${cat.itens.map((it) => `<th>${esc(nomeItem(it))}</th>`).join("")}</tr>
      ${pz.pessoas.map((nome, p) => `<tr><th>${esc(nome)}</th>${cat.itens.map((_, i) => `<td>${resposta ? (pz.sol[c][p] === i ? "✓" : "✕") : "&nbsp;"}</td>`).join("")}</tr>`).join("")}
      </table>`).join("");
  }

  const completo = () => pz.sol.every((s, c) => s.every((i, p) => est[c][p][i] === 1));

  function terminar() {
    fim = true;
    const passos = [...marcas];
    ctx?.definirReplay?.(() => mostrarSolucao(passos));
    const placar = Math.max(0.5, (enganos === 0 ? 1 : enganos <= 2 ? 0.8 : 0.6) - dicas.usados * 0.04);
    ctx?.registrarSolo(nivel.dificuldade, placar,
      `Desvendou um enigma de ${pz.pessoas.length} pessoas e ${pz.cats.length === 1 ? "uma tabela" : `${pz.cats.length} tabelas`}${enganos === 0 ? " sem nenhum engano" : ""}.`);
    som("vitoria");
    if (enganos === 0) { festa(); if (!guiada) ctx?.conquistar?.("enigma-caso"); }
    ctx?.fala("resolveu");
    aviso.className = "aviso certo";
    aviso.textContent = enganos === 0 ? "Caso resolvido, sem nenhum engano!" : `Caso resolvido! Foram ${enganos} ${enganos > 1 ? "enganos" : "engano"}.`;
    desenhar();
  }

  // Repete as marcas da criança, uma por uma.
  async function mostrarSolucao(passos) {
    repetindo = true;
    const final = est;
    est = estadoVazio(pz);
    ctx?.dizer?.("Olha como você desvendou o caso, marca por marca!", "feliz");
    await repetir(passos, ([c, p, i, v]) => { est[c][p][i] = v; desenhar(); }, { intervalo: passos.length > 30 ? 350 : 600, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false; est = final; desenhar();
  }

  function marcar(c, p, i) {
    if (fim || repetindo) return;
    const v = modo === "sim" ? 1 : -1;
    if (est[c][p][i] === v) { // tocar de novo na mesma marca apaga
      est[c][p][i] = 0; marcas = marcas.filter((m) => !(m[0] === c && m[1] === p && m[2] === i));
      som("solta"); desenhar(); dicas.zerar(); return;
    }
    const certo = (pz.sol[c][p] === i) === (v === 1);
    if (!certo) {
      enganos += 1;
      som("erro");
      aviso.className = "aviso erro";
      aviso.textContent = `Isso não bate com as pistas. Releia o que elas dizem sobre ${pz.pessoas[p]}.`;
      desenhar();
      return;
    }
    est[c][p][i] = v;
    marcas.push([c, p, i, v]);
    som(v === 1 ? "ponto" : "toque");
    aviso.textContent = ""; aviso.className = "aviso";
    if (completo()) return terminar();
    desenhar();
    dicas.zerar();
  }

  $("#en-tabelas").addEventListener("click", (e) => {
    const b = e.target.closest(".en-cel");
    if (b) marcar(Number(b.dataset.c), Number(b.dataset.p), Number(b.dataset.i));
  });
  $("#en-pistas").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-pista]");
    if (!li) return;
    const k = Number(li.dataset.pista);
    riscadas.has(k) ? riscadas.delete(k) : riscadas.add(k);
    som("toque"); desenhar();
  });
  palco.querySelectorAll(".en-modo").forEach((b) => b.addEventListener("click", () => { modo = b.dataset.modo; som("toque"); desenhar(); }));
  $("#en-desfazer").addEventListener("click", () => {
    if (fim || !marcas.length) return;
    const [c, p, i] = marcas.pop();
    est[c][p][i] = 0; som("solta");
    aviso.textContent = ""; aviso.className = "aviso";
    desenhar(); dicas.zerar();
  });
  $("#en-novo").addEventListener("click", () => { som("solta"); novoEnigma(); dicas.zerar(); });
  if (!guiada) {
    escolhas(ajustes.querySelector("#en-niveis"), NIVEIS.map((n) => [n.id, n.nome]), nivel.id, (id) => {
      nivel = NIVEIS.find((n) => n.id === id); guardarEscolha(ctx, "enigma:nivel", id); jogo.fecharAjustes(); novoEnigma(); dicas.zerar();
    });
    ajustes.querySelectorAll("#en-niveis button").forEach((b, i) => b.classList.toggle("sugerida", NIVEIS[i] === sugerido));
  }

  novoEnigma();
  setTimeout(() => {
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho. Comece pelas pistas que dizem \"não\".");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
