// Colmeia Lógica — inspirado na mecânica de Hexcells (Matthew Brown, 2014); nome, arte e fases nossos.
// Cada favo tem mel ou está vazio. Um favo vazio mostra quantos vizinhos têm mel.
// Toda colmeia gerada é conferida por um resolvedor: dá para terminar só pensando, sem chutar.
import { carregarEstilo, escolhas, ler, escolhaDaCrianca, guardarEscolha, faixa, som, festa, prepararJogo, sortear, dicasEmDegraus, repetir } from "../../util.js";
import { arte, icone } from "../../arte.js";

const VIZINHOS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const chave = (q, r) => `${q},${r}`;

export const NIVEIS = [
  { id: "pequena", nome: "Pequena", raio: 2, mel: 0.35, revelar: 0.35, dificuldade: 650 },
  { id: "media", nome: "Média", raio: 3, mel: 0.36, revelar: 0.26, dificuldade: 900 },
  { id: "grande", nome: "Grande", raio: 4, mel: 0.38, revelar: 0.2, dificuldade: 1150 },
  // Gigante: gera várias e fica com a que começa com menos pistas (exige mais dedução).
  { id: "gigante", nome: "Gigante", raio: 4, mel: 0.42, revelar: 0.08, dificuldade: 1350, candidatas: 30 },
];

// Fases guiadas: 1) colmeia de 7 favos com guia; 2) pequena com guia; 3) pequena sozinho.
const GUIADAS = {
  1: { id: "guiada1", nome: "de treino", raio: 1, mel: 0.4, revelar: 0.45, dificuldade: 400 },
  2: { id: "guiada2", nome: "de treino", raio: 2, mel: 0.35, revelar: 0.35, dificuldade: 550 },
  3: { id: "guiada3", nome: "de treino", raio: 2, mel: 0.35, revelar: 0.35, dificuldade: 600 },
};

function favos(raio) {
  const lista = [];
  for (let q = -raio; q <= raio; q++)
    for (let r = -raio; r <= raio; r++)
      if (Math.abs(q + r) <= raio) lista.push({ q, r, k: chave(q, r) });
  return lista;
}
const vizinhosDe = (f, existe) => VIZINHOS.map(([dq, dr]) => chave(f.q + dq, f.r + dr)).filter((k) => existe.has(k));

// ---------- Resolvedor lógico ----------
// conhecidos: Map chave -> "mel" | "vazio". Devolve as deduções possíveis a partir daí
// (Map chave -> tipo), usando só regras que uma criança consegue seguir:
// 1) número já completo → o resto é vazio; 2) faltam tantos quantos sobram → todos mel;
// 3) um grupo dentro de outro (subconjunto); 4) contagem total de mel que falta.
export function deduzir(mapa, conhecidos) {
  const { lista, mel, viz } = mapa;
  const novos = new Map();
  const tipo = (k) => conhecidos.get(k) ?? novos.get(k);
  const restricoes = [];
  for (const f of lista) {
    if (tipo(f.k) !== "vazio") continue;
    const desconhecidos = viz.get(f.k).filter((k) => tipo(k) === undefined);
    if (!desconhecidos.length) continue;
    const jaMel = viz.get(f.k).filter((k) => tipo(k) === "mel").length;
    const total = viz.get(f.k).filter((k) => mel.has(k)).length;
    restricoes.push({ S: new Set(desconhecidos), falta: total - jaMel });
  }
  const desconhecidos = lista.filter((f) => tipo(f.k) === undefined).map((f) => f.k);
  const melConhecido = lista.filter((f) => tipo(f.k) === "mel").length;
  restricoes.push({ S: new Set(desconhecidos), falta: mel.size - melConhecido });

  const aplicar = (S, falta) => {
    if (!S.size) return;
    if (falta === 0) S.forEach((k) => novos.set(k, "vazio"));
    else if (falta === S.size) S.forEach((k) => novos.set(k, "mel"));
  };
  for (const { S, falta } of restricoes) aplicar(S, falta);
  if (novos.size) return novos;
  for (const a of restricoes) for (const b of restricoes) {
    if (a === b || a.S.size >= b.S.size) continue;
    if ([...a.S].every((k) => b.S.has(k))) {
      const resto = new Set([...b.S].filter((k) => !a.S.has(k)));
      aplicar(resto, b.falta - a.falta);
      if (novos.size) return novos;
    }
  }
  return novos;
}

function resolvivel(mapa, iniciais) {
  const conhecidos = new Map(iniciais);
  while (conhecidos.size < mapa.lista.length) {
    const d = deduzir(mapa, conhecidos);
    if (!d.size) return false;
    d.forEach((t, k) => conhecidos.set(k, t));
  }
  return true;
}

export function gerar(nivel) {
  let melhor = null;
  for (let i = 0; i < (nivel.candidatas || 1); i++) {
    const c = gerarUma(nivel);
    if (c && (!melhor || c.iniciais.size < melhor.iniciais.size)) melhor = c;
  }
  return melhor;
}

function gerarUma(nivel) {
  const lista = favos(nivel.raio);
  const existe = new Set(lista.map((f) => f.k));
  const viz = new Map(lista.map((f) => [f.k, vizinhosDe(f, existe)]));
  for (let tentativa = 0; tentativa < 300; tentativa++) {
    const mel = new Set(lista.filter(() => Math.random() < nivel.mel).map((f) => f.k));
    if (mel.size < 2 || mel.size > lista.length - 3) continue;
    const mapa = { lista, mel, viz, existe };
    const iniciais = new Map();
    const vazios = lista.filter((f) => !mel.has(f.k)).map((f) => f.k).sort(() => Math.random() - 0.5);
    const alvo = Math.max(1, Math.round(lista.length * nivel.revelar));
    while (iniciais.size < alvo && vazios.length) iniciais.set(vazios.pop(), "vazio");
    // Revela mais um favo vazio até a colmeia ficar resolvível só pensando.
    while (!resolvivel(mapa, iniciais) && vazios.length) iniciais.set(vazios.pop(), "vazio");
    if (resolvivel(mapa, iniciais) && iniciais.size <= lista.length * 0.6) return { ...mapa, iniciais };
  }
  return null;
}

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const sugerido = ctx && !guiada ? ctx.sugerir(NIVEIS, (n) => n.dificuldade) : null;
  // O tamanho que a criança escolheu vale até ela escolher outro; sem escolha, vale a sugestão do nível.
  const escolhido = guiada ? null : NIVEIS.find((n) => n.id === escolhaDaCrianca(ctx, "colmeia:nivel"));
  let nivel = guiada ? GUIADAS[guiada] : escolhido ?? sugerido ?? NIVEIS.find((n) => n.id === ler("colmeia:nivel", "pequena")) ?? NIVEIS[0];
  let modo = "mel";
  let mapa, conhecidos, enganos, fim, novo = null, marcas = [], vivo = true, repetindo = false;

  palco.innerHTML = `
    <section class="jg cm">
      ${faixa(arte("colmeia", 54), "Colmeia Lógica", { ajustes: !guiada })}
      <p class="cm-nivel" id="cm-nivel"></p>
      <div class="cm-favo-quadro"><svg id="cm-svg" role="group" aria-label="Colmeia" data-teclado=".cm-favo.oculto"></svg></div>
      <div class="cm-contas" id="cm-contas"></div>
      <p class="cm-marcando" id="cm-marcando-titulo">Ao tocar num favo, marcar como:</p>
      <div class="cm-modos" role="group" aria-labelledby="cm-marcando-titulo">
        <button type="button" class="cm-modo" data-modo="mel">${arte("gota", 30)} Tem mel</button>
        <button type="button" class="cm-modo" data-modo="vazio"><span class="cm-amostra"></span> Vazio</button>
      </div>
      <p class="aviso" id="cm-aviso" role="status" aria-live="polite"></p>
      <div class="acoes">
        <button type="button" class="botao dourado" id="cm-dica"></button>
        <button type="button" class="botao" id="cm-nova" data-nova-partida>${icone("recomecar")} Nova colmeia</button>
      </div>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#cm-aviso");
  const svg = $("#cm-svg");

  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Tamanho da colmeia</span><div id="cm-tam" data-nova-partida></div>`;
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>Cada favo tem mel ou está vazio.</li>
      <li>Um favo vazio mostra um número: quantos favos grudados nele têm mel.</li>
      <li>Escolha embaixo "Tem mel" ou "Vazio" e toque no favo.</li>
      <li>Dá sempre para descobrir pensando. Se não tiver certeza, procure outro favo. A dica mostra um favo que já dá para saber.</li></ul>`,
    imprimir: () => ({
      titulo: `Colmeia Lógica (${nivel.nome.toLowerCase()})`,
      html: `<p>Pinte os favos que têm mel. Cada número conta quantos favos grudados nele têm mel.
        Nesta colmeia há <b>${mapa.mel.size}</b> favos com mel. Dá para descobrir todos só pensando, sem chutar.</p>
        ${svgColmeia(mapa.iniciais, true)}
        <div class="quebra gabarito"><h2>Respostas (não espie antes!)</h2>
        ${svgColmeia(new Map(mapa.lista.map((f) => [f.k, mapa.mel.has(f.k) ? "mel" : "vazio"])), true)}</div>`,
    }),
    passos: () => [
      { alvo: '[data-modo="vazio"]', texto: "Escolha o que vai marcar" },
      { alvo: ".cm-favo.oculto", texto: "Depois, toque no favo" },
    ],
  });

  // ---------- Dicas em degraus: a dica aponta o número que "explica" o favo ----------
  const dicas = dicasEmDegraus(palco, {
    botao: $("#cm-dica"),
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (fim) return null;
      const d = deduzir(mapa, conhecidos);
      if (!d.size) return null;
      const [k, t] = sortear([...d.entries()]);
      // Um número revelado vizinho do favo, de preferência o que resolve sozinho.
      const numeros = mapa.viz.get(k).filter((v) => conhecidos.get(v) === "vazio");
      const explica = numeros.map((v) => {
        const vz = mapa.viz.get(v);
        const n = vz.filter((x) => mapa.mel.has(x)).length;
        const jaMel = vz.filter((x) => conhecidos.get(x) === "mel").length;
        const escondidos = vz.filter((x) => !conhecidos.has(x)).length;
        return { v, n, completo: n === jaMel, precisaTodos: n - jaMel === escondidos };
      });
      const melhor = explica.find((e) => (t === "vazio" ? e.completo : e.precisaTodos)) || explica[0];
      const regiao = melhor ? `.cm-favo[data-k="${melhor.v}"]` : null;
      let porque = "Conte quantos favos com mel ainda faltam na colmeia toda: isso resolve este aqui.";
      if (melhor?.completo && t === "vazio") porque = `O ${melhor.n} já tem todos os seus méis em volta. Então os outros vizinhos dele estão vazios.`;
      else if (melhor?.precisaTodos && t === "mel") porque = `O ${melhor.n} precisa de mel em todos os vizinhos escondidos que sobraram. Este é um deles!`;
      else if (melhor) porque = `Compare o ${melhor.n} com um número vizinho: juntos, eles mostram que este favo ${t === "mel" ? "tem mel" : "está vazio"}.`;
      return {
        pergunta: melhor ? "Procure um número que já está completo, ou que precisa de mel em todos os vizinhos que sobraram." : "Conte: quantos favos com mel ainda faltam na colmeia toda?",
        regiao,
        jogada: `.cm-favo[data-k="${k}"], .cm-modo[data-modo="${t}"]`,
        textoJogada: t === "mel" ? "Escolha \"Tem mel\" e toque no favo brilhando." : "Escolha \"Vazio\" e toque no favo brilhando.",
        porque,
      };
    },
  });

  function novaColmeia() {
    // O gerador quase sempre acha uma colmeia; se em raros casos não achar, tenta de novo e, por fim, a pequena.
    mapa = gerar(nivel) || gerar(nivel) || gerar(NIVEIS[0]);
    conhecidos = new Map(mapa.iniciais);
    enganos = 0; fim = false; novo = null; marcas = [];
    aviso.textContent = ""; aviso.className = "aviso";
    $("#cm-nivel").textContent = guiada ? "Colmeia de treino" : `Colmeia ${nivel.nome.toLowerCase()}`;
    desenhar();
  }

  // Desenha a colmeia. conhecidos: Map de favos revelados. papel: versão preto e branco.
  function svgColmeia(mostrar, papel = false) {
    const TAM = 20, W = Math.sqrt(3) * TAM;
    const pos = (f) => [W * (f.q + f.r / 2), 1.5 * TAM * f.r];
    const raio = nivel.raio;
    const largura = W * (2 * raio + 1) + 8, altura = TAM * (3 * raio + 2) + 8;
    const hex = (x, y, s) => Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${(x + s * Math.cos(a)).toFixed(2)},${(y + s * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    let h = "";
    // Fileira e posição de cada favo, de cima para baixo e da esquerda para a direita (leitor de tela).
    const lugar = new Map();
    const fileiras = [...new Set(mapa.lista.map((f) => f.r))].sort((a, b) => a - b);
    fileiras.forEach((r, i) => mapa.lista.filter((f) => f.r === r).sort((a, b) => a.q - b.q).forEach((f, j) => lugar.set(f.k, [i + 1, j + 1])));
    for (const f of mapa.lista) {
      const [x, y] = pos(f);
      const t = mostrar.get(f.k);
      const n = mapa.viz.get(f.k).filter((k) => mapa.mel.has(k)).length;
      if (papel) {
        h += `<polygon points="${hex(x, y, TAM - 1.2)}" fill="${t === "mel" ? "#bbb" : "#fff"}" stroke="#000" stroke-width="1.2"/>`;
        if (t === "vazio") h += `<text x="${x}" y="${y}" font-family="Georgia, serif" font-size="15" text-anchor="middle" dominant-baseline="central">${n}</text>`;
        continue;
      }
      const classe = t === "mel" ? "mel" : t === "vazio" ? "vazio" : "oculto";
      const extra = f.k === novo ? " nova" : "";
      const [fil, posi] = lugar.get(f.k);
      const onde = `fileira ${fil}, posição ${posi}`;
      const rotulo = t === "mel" ? `Favo com mel, ${onde}`
        : t === "vazio" ? `Favo vazio, ${onde}: ${n} ${n === 1 ? "vizinho tem" : "vizinhos têm"} mel`
        : `Favo escondido, ${onde}. Toque para marcar: ${modo === "mel" ? "tem mel" : "vazio"}`;
      h += `<g class="cm-favo ${classe}${extra}" data-k="${f.k}" ${t ? `role="img"` : `tabindex="0" role="button"`} aria-label="${rotulo}">
        <polygon points="${hex(x, y, TAM - 1.2)}"/>`;
      if (!t) h += `<polygon class="tampa" points="${hex(x, y, TAM - 6)}"/>`;
      if (t === "vazio") h += `<text x="${x}" y="${y}">${n}</text>`;
      if (t === "mel") h += `<g transform="translate(${x - 9} ${y - 9}) scale(.18)">${arte("gota", 100).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      h += `</g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-largura / 2} ${-altura / 2} ${largura} ${altura}">${h}</svg>`;
  }

  function desenhar() {
    const desenho = svgColmeia(conhecidos);
    svg.setAttribute("viewBox", desenho.match(/viewBox="([^"]+)"/)[1]);
    const h = desenho.replace(/^<svg[^>]*>|<\/svg>$/g, "");
    svg.innerHTML = h;
    const melFaltando = [...mapa.mel].filter((k) => !conhecidos.has(k)).length;
    $("#cm-contas").innerHTML = `<span>${arte("gota", 22)} Mel escondido: <b>${melFaltando}</b></span><span>Enganos: <b>${enganos}</b></span>`;
    palco.querySelectorAll(".cm-modo").forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.modo === modo)); b.disabled = repetindo; });
    $("#cm-dica").hidden = fim || repetindo;
    $("#cm-nova").disabled = repetindo;
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo; // trocar o desafio no meio da repetição misturaria tudo
    dicas.reaplicar();
  }

  function terminar() {
    fim = true;
    const placar = Math.max(0.5, (enganos === 0 ? 1 : enganos <= 2 ? 0.8 : 0.6) - dicas.usados * 0.04);
    const passos = [...marcas];
    ctx?.definirReplay?.(() => mostrarSolucao(passos));
    ctx?.registrarSolo(nivel.dificuldade, placar, `Descobriu todos os favos de uma colmeia ${nivel.nome.toLowerCase()}${enganos === 0 ? " sem nenhum engano" : ""}.`);
    som("vitoria");
    if (enganos === 0) { festa(); if (!guiada) ctx?.conquistar?.("colmeia-certeira"); }
    if (nivel.id === "gigante") ctx?.conquistar?.("colmeia-gigante");
    ctx?.fala("resolveu");
    aviso.className = "aviso certo";
    aviso.textContent = enganos === 0
      ? "Colmeia completa, sem nenhum engano!"
      : `Colmeia completa! Foram ${enganos} ${enganos > 1 ? "enganos" : "engano"}. Quer tentar outra sem errar?`;
    desenhar();
  }

  // Repete a solução da criança, favo por favo.
  async function mostrarSolucao(passos) {
    repetindo = true;
    const final = conhecidos;
    conhecidos = new Map(mapa.iniciais);
    ctx?.dizer?.("Olha como você descobriu a colmeia, favo por favo!", "feliz");
    await repetir(passos, ([k, t]) => { conhecidos.set(k, t); novo = k; desenhar(); }, { intervalo: passos.length > 30 ? 350 : 650, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false; conhecidos = final; novo = null; desenhar();
  }

  function tocar(k) {
    if (fim || repetindo || conhecidos.has(k)) return;
    const certo = mapa.mel.has(k) ? "mel" : "vazio";
    if (modo !== certo) {
      enganos += 1;
      som("erro");
      aviso.className = "aviso erro";
      aviso.textContent = modo === "mel"
        ? "Esse favo não tem mel. Olhe os números em volta e tente outro."
        : "Esse favo tem mel! Olhe os números em volta e tente outro.";
      novo = null;
      desenhar();
      return;
    }
    conhecidos.set(k, certo);
    marcas.push([k, certo]);
    novo = k;
    som(certo === "mel" ? "ponto" : "toque");
    aviso.textContent = ""; aviso.className = "aviso";
    if (conhecidos.size === mapa.lista.length) return terminar();
    desenhar();
    dicas.zerar();
  }

  const acionar = (e) => {
    const g = e.target.closest(".cm-favo.oculto");
    if (g) tocar(g.dataset.k);
  };
  svg.addEventListener("click", acionar);
  svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); acionar(e); } });
  palco.querySelectorAll(".cm-modo").forEach((b) => b.addEventListener("click", () => { modo = b.dataset.modo; som("toque"); desenhar(); }));
  $("#cm-nova").addEventListener("click", () => { som("solta"); novaColmeia(); dicas.zerar(); });
  if (!guiada) {
    escolhas(ajustes.querySelector("#cm-tam"), NIVEIS.map((n) => [n.id, n.nome]), nivel.id, (id) => {
      nivel = NIVEIS.find((n) => n.id === id); guardarEscolha(ctx, "colmeia:nivel", id); jogo.fecharAjustes(); novaColmeia(); dicas.zerar();
    });
    ajustes.querySelectorAll("#cm-tam button").forEach((b, i) => b.classList.toggle("sugerida", NIVEIS[i] === sugerido));
  }

  novaColmeia();
  setTimeout(() => {
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho. Só marque quando os números provarem.");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
