// Ajudantes compartilhados pelos jogos.
import { arte, icone } from "./arte.js";

// Devolve uma promessa que resolve quando o estilo carregou (ou falhou), para o app esperar antes
// de mostrar o jogo: em celular simples, sem isso o jogo aparece um instante sem forma.
export function carregarEstilo(url) {
  const href = new URL(url).href;
  const existente = [...document.querySelectorAll("link[rel=stylesheet]")].find((l) => l.href === href);
  if (existente) return existente.sheet ? Promise.resolve() : new Promise((r) => { existente.addEventListener("load", r, { once: true }); existente.addEventListener("error", r, { once: true }); });
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  const pronto = new Promise((r) => { link.onload = r; link.onerror = r; });
  document.head.appendChild(link);
  return pronto;
}

// Botões de escolha única (tipo "pílula"). opcoes: [[valor, rótulo], ...]
export function escolhas(el, opcoes, atual, aoMudar) {
  el.classList.add("escolhas");
  el.innerHTML = "";
  for (const [valor, rotulo] of opcoes) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = rotulo;
    b.setAttribute("aria-pressed", String(valor === atual));
    b.addEventListener("click", () => {
      el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      aoMudar(valor);
    });
    el.appendChild(b);
  }
}

// Progresso guardado só no aparelho. Falha em silêncio (modo anônimo, armazenamento bloqueado).
export function ler(chave, padrao) {
  try { const v = localStorage.getItem("enigmas:" + chave); return v === null ? padrao : JSON.parse(v); }
  catch { return padrao; }
}
export function guardar(chave, valor) {
  try { localStorage.setItem("enigmas:" + chave, JSON.stringify(valor)); } catch {}
}

export const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];

// Escapa texto que vem de fora (apelido, valores de cópia de segurança) antes de ir para innerHTML.
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Escolha manual da criança nos ajustes (fase, discos, tamanho): vale até ela mudar de novo.
// Fica por criança, para dois primos no mesmo celular não trocarem a escolha um do outro.
const chaveEscolha = (ctx, nome) => `escolha:${ctx?.jogadores?.[0]?.id || "visitante"}:${nome}`;
// Jogos com modelo ilustrado: a escolha da criança vale; sem escolha, ilustrado, menos em celular fraco.
export const visualIlustrado = (ctx, chave) => (escolhaDaCrianca(ctx, chave) ?? (document.body.classList.contains("leve") ? "leve" : "ilustrado")) === "ilustrado";
// Sprites de um atlas: cada figura é um retângulo [x, y, largura, altura] do arquivo de imagem, e `k` é a
// escala (px de tela por px do atlas). Tudo vai inline (inclusive a imagem), para dois jogos nunca se
// confundirem: os estilos dos jogos ficam na página depois de visitados.
export function criarSprites(url, largura, altura, retangulos) {
  // ky: escala na vertical, se for diferente da horizontal (ex.: esticar uma haste).
  const sprite = (nome, k, extra = "", ky = k) => {
    const [x, y, w, h] = retangulos[nome];
    return `<span class="spr ${extra}" style="width:${(w * k).toFixed(1)}px;height:${(h * ky).toFixed(1)}px;background-image:url('${url}');background-size:${(largura * k).toFixed(1)}px ${(altura * ky).toFixed(1)}px;background-position:${(-x * k).toFixed(1)}px ${(-y * ky).toFixed(1)}px" aria-hidden="true"></span>`;
  };
  // Estilo inline para um elemento QUALQUER mostrar o recorte esticado até preencher a caixa dele.
  sprite.preencher = (nome) => {
    const [x, y, w, h] = retangulos[nome];
    return `background-image:url('${url}');background-repeat:no-repeat;background-size:${(largura / w * 100).toFixed(2)}% ${(altura / h * 100).toFixed(2)}%;background-position:${(x / (largura - w) * 100).toFixed(2)}% ${(y / (altura - h) * 100).toFixed(2)}%`;
  };
  return sprite;
}

// Abre o modelo ilustrado sem espera nem susto. A cena nasce no modelo leve e escondida (classe "carregando")
// por até `ms` (0,8 s). Se as imagens chegam nesse tempo, `aplicar()` troca para o ilustrado ainda escondida e
// `revelar()` mostra; se não chegam (internet lenta ou sem internet), `revelar()` mostra o leve e ele fica assim
// nesta partida: nada muda sozinho no meio do jogo. As imagens continuam baixando, e a próxima abertura já vem
// ilustrada. `vivo()` diz se o jogo ainda está na tela.
export function abrirIlustrado(urls, { aplicar, revelar, ms = 800, vivo = () => true }) {
  const baixar = (url) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(true); i.onerror = () => ok(false); i.src = url; });
  const tudo = Promise.all(urls.map(baixar)).then((r) => r.every(Boolean));
  Promise.race([tudo, new Promise((ok) => setTimeout(() => ok(false), ms))]).then((ok) => {
    if (!vivo()) return;
    if (ok) aplicar();
    revelar();
  });
}
export const escolhaDaCrianca = (ctx, nome) => ler(chaveEscolha(ctx, nome), null);
export const guardarEscolha = (ctx, nome, valor) => guardar(chaveEscolha(ctx, nome), valor);
export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Sons sintetizados (nenhum arquivo de áudio) ----------
let audio = null;
export const somLigado = () => ler("som", true);
export function alternarSom() { const v = !somLigado(); guardar("som", v); return v; }

// Um único contexto de áudio para efeitos e música.
export function contextoAudio() {
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  return audio;
}

// Timbre de piano simples: fundamental + harmônicos com queda rápida.
function piano(freq, inicio, dur = 1.2, vol = 0.14) {
  const t = audio.currentTime + inicio;
  for (const [mult, peso] of [[1, 1], [2, 0.35], [3, 0.12]]) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = "sine"; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * peso, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur / mult);
    o.connect(g).connect(audio.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
}
// Mesma escala (pentatônica de Dó) da música de fundo: tudo soa junto, nada desafina.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
let passoMelodia = 0;

// tipo "nota": a nota própria de um personagem (grau da escala pentatônica da música).
export function som(tipo, grau = 0) {
  if (!somLigado()) return;
  try {
    contextoAudio();
    vibrar(tipo);
    if (tipo === "toque") { piano(PENTA[passoMelodia % 5], 0, 0.6, 0.1); passoMelodia++; }
    else if (tipo === "nota") piano(PENTA[grau % 5], 0, 0.7, 0.1);
    else if (tipo === "solta") piano(PENTA[0] / 2 * 1.5, 0, 0.5, 0.08);
    else if (tipo === "ponto") { piano(PENTA[2], 0, 0.6); piano(PENTA[4], 0.1, 0.8); }
    else if (tipo === "erro") { piano(329.63, 0, 0.7, 0.08); piano(261.63, 0.18, 0.9, 0.08); }
    else if (tipo === "vitoria") [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => piano(f, i * 0.14, i === 3 ? 1.6 : 0.8, 0.12));
    else if (tipo === "derrota") [392, 329.63, 261.63].forEach((f, i) => piano(f, i * 0.18, 0.9, 0.08));
  } catch {}
}

// ---------- Confete de vitória: poucos pedaços, cores suaves, some sozinho em 2 s ----------
export function festa() {
  if (semMovimento()) return;
  const c = document.createElement("canvas");
  c.className = "confete";
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  const cores = ["#ffe08a", "#9fd3ff", "#ffb3b6", "#a8ecc5", "#d4c2ff"];
  const pedacos = Array.from({ length: 40 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 9 - 3,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6, h: 10 + Math.random() * 8, cor: cores[(Math.random() * cores.length) | 0],
  }));
  const t0 = performance.now();
  (function quadro(t) {
    const passou = t - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pedacos) {
      p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - passou / 2200);
      ctx.fillStyle = p.cor; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (passou < 2200) requestAnimationFrame(quadro); else c.remove();
  })(t0);
}

// ---------- Vibração (vai junto com o botão de som) ----------
const VIBRA = { toque: 8, solta: 6, ponto: [12, 40, 12], erro: [30, 50, 30], vitoria: [20, 60, 20, 60, 50], derrota: 40 };
function vibrar(tipo) {
  if (!ler("vibrar", true)) return;
  try { if (navigator.vibrate && VIBRA[tipo]) navigator.vibrate(VIBRA[tipo]); } catch {}
}
// Modo leve (celular antigo) e animações lentas (acessibilidade) vêm de classes no <body>.
export const modoLeve = () => document.body.classList.contains("leve");
export const fatorLento = () => (document.body.classList.contains("lento") ? 1.8 : 1);

export const semMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches || modoLeve();

// ---------- Movimento de peças (técnica FLIP) ----------
// Antes de redesenhar: const antes = posicoes(raiz, "[data-peca]").
// Depois de redesenhar: mover(raiz, "[data-peca]", antes, { arco: 70 }).
export function posicoes(raiz, seletor) {
  const m = new Map();
  raiz.querySelectorAll(seletor).forEach((el) => m.set(el.dataset.peca, el.getBoundingClientRect()));
  return m;
}
export function mover(raiz, seletor, antes, { arco = 0, duracao = 420 } = {}) {
  if (semMovimento()) return;
  raiz.querySelectorAll(seletor).forEach((el) => {
    const r0 = antes.get(el.dataset.peca);
    if (!r0) return;
    const r1 = el.getBoundingClientRect();
    const dx = r0.left - r1.left, dy = r0.top - r1.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    const quadros = arco
      ? [{ transform: `translate(${dx}px, ${dy}px)` },
         { transform: `translate(${dx / 2}px, ${Math.min(dy, 0) - arco}px) rotate(${dx > 0 ? -8 : 8}deg)`, offset: 0.5 },
         { transform: "translate(0, 0)" }]
      : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }];
    el.animate(quadros, { duration: duracao * fatorLento(), easing: "cubic-bezier(.3, .7, .3, 1)" });
  });
}
// Faz elementos saírem voando antes de sumir. Resolve quando termina.
export function voar(elementos) {
  if (semMovimento() || !elementos.length) return Promise.resolve();
  // Nunca espera mais que 1,2 s: com o app em segundo plano o navegador pausa animações.
  return Promise.race([esperar(1200), Promise.all([...elementos].map((el, i) => el.animate(
    [{ transform: "none", opacity: 1 },
     { transform: `translate(${(i % 2 ? 1 : -1) * (30 + i * 12)}px, -140px) rotate(${(i % 2 ? 1 : -1) * 70}deg)`, opacity: 0 }],
    { duration: 480, delay: i * 50, easing: "cubic-bezier(.4, 0, .8, .6)", fill: "forwards" }).finished))]);
}

// ---------- Mãozinha que demonstra a jogada ----------
// passos: [{ alvo: seletor ou elemento, texto? }]. Não mexe no jogo; só mostra onde tocar.
export function demonstrar(raiz, passos, maoSvg) {
  if (!passos.length) return;
  const capa = document.createElement("div");
  capa.className = "demo";
  capa.innerHTML = `<div class="demo-mao">${maoSvg}</div><p class="demo-texto"></p><span class="demo-pular">Toque para pular</span>`;
  document.body.appendChild(capa);
  const mao = capa.querySelector(".demo-mao"), texto = capa.querySelector(".demo-texto");
  let vivo = true, alvoAtual = null;
  const fim = () => { vivo = false; capa.remove(); alvoAtual?.classList.remove("demo-alvo"); pararDemo = null; };
  pararDemo?.();
  pararDemo = fim;
  capa.addEventListener("pointerdown", fim);
  (async () => {
    for (let volta = 0; volta < 2 && vivo; volta++) {
      for (const p of passos) {
        if (!vivo) return;
        const alvo = typeof p.alvo === "string" ? raiz.querySelector(p.alvo) : p.alvo;
        if (!alvo) continue;
        alvo.scrollIntoView({ block: "center", behavior: semMovimento() ? "auto" : "smooth" });
        await esperar(350);
        if (!vivo) return;
        const r = alvo.getBoundingClientRect();
        mao.style.left = `${r.left + r.width / 2 - 8}px`;
        mao.style.top = `${r.top + r.height / 2 - 4}px`;
        texto.textContent = p.texto || "";
        await esperar(650);
        if (!vivo) return;
        mao.classList.remove("toca"); void mao.offsetWidth; mao.classList.add("toca");
        alvoAtual = alvo; alvo.classList.add("demo-alvo");
        await esperar(900);
        alvo.classList.remove("demo-alvo");
      }
    }
    if (!vivo) return;
    fim();
    window.scrollTo({ top: 0, behavior: "smooth" });
  })();
}
// A demonstração em curso (se houver) para quando o jogo é desmontado: nada rola a tela depois.
let pararDemo = null;
export const pararDemonstracao = () => pararDemo?.();

// ---------- Faixa de título do jogo, com botões de ajuda e de ajustes ----------
export const faixa = (emblema, titulo, { ajustes = false } = {}) => `
  <div class="faixa">
    <span class="emblema" aria-hidden="true">${emblema}</span><h1>${titulo}</h1>
    <span class="faixa-botoes">
      <button type="button" class="faixa-botao" data-faixa="ajuda" aria-label="Como jogar">?</button>
      ${ajustes ? `<button type="button" class="faixa-botao" data-faixa="ajustes" aria-label="Ajustes">${icone("ajustes", 24)}</button>` : ""}
    </span>
  </div>`;

// Painel que sobe de baixo, com os ajustes do jogo (tamanho, regra etc.).
export function folha(titulo, conteudo) {
  const d = document.createElement("dialog");
  d.className = "folha";
  d.innerHTML = `<div class="folha-topo"><strong>${titulo}</strong><button type="button" class="folha-fechar" aria-label="Fechar">✕</button></div>`;
  d.appendChild(conteudo);
  document.body.appendChild(d);
  d.querySelector(".folha-fechar").addEventListener("click", () => d.close());
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  return d;
}


// ---------- Ouvir: a voz em português do próprio Android lê o texto ----------
// Só fala quando a criança toca no botão (regra: nada acontece sem ela agir).
export const podeFalar = () => "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
export function falar(texto) {
  if (!podeFalar() || !texto?.trim()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/\s+/g, " ").trim());
    u.lang = "pt-BR";
    const voz = speechSynthesis.getVoices().find((v) => v.lang?.replace("_", "-").toLowerCase().startsWith("pt-br"));
    if (voz) u.voice = voz;
    u.rate = 0.92; u.pitch = 1.08;
    speechSynthesis.speak(u);
  } catch {}
}
export const pararFala = () => { try { podeFalar() && speechSynthesis.cancel(); } catch {} };
// Botão pequeno que lê o texto de um elemento (lido na hora do toque, então acompanha mudanças).
export function botaoOuvir(obterTexto, rotulo = "Ouvir") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ouvir";
  b.setAttribute("aria-label", rotulo);
  b.innerHTML = icone("som", 20);
  b.hidden = !podeFalar();
  b.addEventListener("click", (e) => { e.stopPropagation(); falar(obterTexto()); });
  return b;
}

// ---------- Imprimir: uma folha limpa, preto e branco, para resolver no papel ----------
export function imprimir(titulo, conteudo) {
  document.querySelector(".impressao")?.remove();
  const area = document.createElement("div");
  area.className = "impressao";
  area.innerHTML = `<h1>${titulo}</h1>${conteudo}<p class="impressao-rodape">Vila do Samuca · para resolver no papel, sem pressa</p>`;
  document.body.appendChild(area);
  document.body.classList.add("imprimindo");
  const fim = () => { area.remove(); document.body.classList.remove("imprimindo"); removeEventListener("afterprint", fim); };
  addEventListener("afterprint", fim);
  window.print();
}

// ---------- Dicas em degraus ----------
// 1º toque: uma pergunta que orienta. 2º: destaca a região. 3º: destaca a jogada.
// O jogo informa `calcular()` → { pergunta, regiao: seletor, jogada: seletor, textoJogada, porque }
// e chama `zerar()` depois de cada lance e `reaplicar()` depois de redesenhar.
// No modo guiado (fases de aprender), depois de cada lance a jogada já aparece com o "porquê".
// Regra de conforto: nada aparece antes de a criança agir. Ao abrir a fase, a tela fica parada;
// o destaque só começa depois do primeiro toque dela no jogo (lance, Dica ou Recomeçar).
export function dicasEmDegraus(palco, { botao, calcular, dizer, guiado = false }) {
  let degrau = 0, atual = null, usados = 0, agiu = false;
  const marcarAcao = (e) => { if (!e.target.closest?.(".faixa, .folha")) agiu = true; };
  const area = palco.querySelector(".jg") || palco; // some junto com o jogo: nada se acumula entre partidas
  area.addEventListener("click", marcarAcao, { capture: true });
  area.addEventListener("keydown", marcarAcao, { capture: true });
  const limparMarcas = () => palco.querySelectorAll(".dica-regiao, .dica-jogada").forEach((e) => e.classList.remove("dica-regiao", "dica-jogada"));
  const marcar = () => {
    limparMarcas();
    if (!atual) return;
    if (degrau >= 2 && atual.regiao) palco.querySelectorAll(atual.regiao).forEach((e) => e.classList.add("dica-regiao"));
    if (degrau >= 3 && atual.jogada) palco.querySelectorAll(atual.jogada).forEach((e) => { e.classList.remove("dica-regiao"); e.classList.add("dica-jogada"); });
  };
  const rotular = () => {
    if (!botao) return;
    botao.innerHTML = `${icone("dica")} ${degrau === 0 ? "Dica" : degrau < 3 ? `Mais uma dica (${degrau}/3)` : "Dica completa"}`;
    botao.disabled = degrau >= 3;
  };
  const api = {
    proxima() {
      if (degrau === 0) { atual = calcular(); if (!atual) return 0; }
      if (degrau >= 3) return 3;
      degrau += 1; usados += 1;
      if (degrau === 1) dizer?.(atual.pergunta);
      if (degrau === 3) dizer?.(atual.textoJogada || atual.pergunta);
      marcar(); rotular(); som("ponto");
      return degrau;
    },
    // Depois de cada lance. No modo guiado, já mostra o próximo passo com a explicação.
    zerar() {
      degrau = 0; atual = null; limparMarcas(); rotular();
      if (guiado && agiu) {
        atual = calcular();
        if (atual) { degrau = 3; marcar(); rotular(); dizer?.(atual.porque || atual.textoJogada || atual.pergunta); }
      }
    },
    reaplicar: marcar,
    get usados() { return usados; },
    get degrau() { return degrau; },
  };
  botao?.addEventListener("click", () => api.proxima());
  rotular();
  return api;
}

// ---------- Teclado nos tabuleiros ----------
// container[data-teclado="seletor"]: as setas andam até a peça mais próxima naquela direção, e
// o foco não se perde quando o jogo redesenha o tabuleiro depois de um lance (volta para a
// mesma peça ou, se ela sumiu, para a mais próxima de onde estava).
export function tecladoNoTabuleiro(container) {
  const seletor = container.dataset.teclado;
  const pecas = () => [...container.querySelectorAll(seletor)].filter((e) => !e.disabled && e.getClientRects().length);
  const centro = (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const chave = (e) => [e.dataset.k, e.dataset.i, e.getAttribute("aria-label")?.split(/[.,:]/)[0]].join("|");
  let ultima = null, dentro = false;
  const lembrar = (e) => {
    const p = e.target.closest?.(seletor);
    if (p && container.contains(p)) ultima = { chave: chave(p), centro: centro(p) };
  };
  // "dentro": a última coisa que a criança focou ou tocou foi uma peça deste tabuleiro.
  const conferir = (e) => { dentro = container.contains(e.target); if (dentro) lembrar(e); };
  document.addEventListener("focusin", conferir);
  document.addEventListener("pointerdown", conferir, { capture: true });
  container.addEventListener("click", (e) => { if (e.target.closest?.(seletor)) { dentro = true; lembrar(e); } }, { capture: true });
  const observador = new MutationObserver(() => {
    if (!container.isConnected || !dentro || !ultima) return;
    const ativo = document.activeElement;
    if (ativo && ativo !== document.body && ativo.isConnected) return;
    const lista = pecas();
    if (!lista.length) return;
    const igual = lista.find((e) => chave(e) === ultima.chave);
    const [x, y] = ultima.centro;
    (igual || lista.sort((a, b) => Math.hypot(...centro(a).map((v, k) => v - [x, y][k])) - Math.hypot(...centro(b).map((v, k) => v - [x, y][k])))[0])
      .focus({ preventScroll: true });
  });
  observador.observe(container, { childList: true, subtree: true });
  container.addEventListener("keydown", (e) => {
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    const atual = e.target.closest?.(seletor);
    if (atual) { dentro = true; lembrar(e); }
    if (!dir || !atual) return;
    e.preventDefault();
    const [x, y] = centro(atual);
    let melhor = null, nota = Infinity;
    for (const p of pecas()) {
      if (p === atual) continue;
      const [px, py] = centro(p), dx = px - x, dy = py - y;
      const frente = dx * dir[0] + dy * dir[1];
      if (frente <= 2) continue;
      const lado = Math.abs(dx * dir[1] + dy * dir[0]);
      const n = frente + lado * 2.5;
      if (n < nota) { nota = n; melhor = p; }
    }
    if (melhor) { melhor.focus(); ultima = { chave: chave(melhor), centro: centro(melhor) }; }
  });
  return () => {
    observador.disconnect();
    document.removeEventListener("focusin", conferir);
    document.removeEventListener("pointerdown", conferir, { capture: true });
  };
}

// ---------- Repetir a solução em câmera lenta ("Mostrar para o avô") ----------
// passos: lista de estados; aplicar(estado, i) redesenha o jogo naquele estado.
export async function repetir(passos, aplicar, { intervalo = 900, vivo = () => true } = {}) {
  for (let i = 0; i < passos.length; i++) {
    if (!vivo()) return;
    aplicar(passos[i], i);
    await esperar(intervalo * (document.body.classList.contains("lento") ? 1.5 : 1));
  }
}

// Liga os botões da faixa (? e ⚙) e o convite da primeira vez. Nada dispara sozinho:
// a mãozinha só aparece quando a criança toca em "Ver como joga".
// regras: HTML de uma <ul>; ajustes: elemento com os controles (ou null);
// passos: função que devolve os passos da demonstração. Devolve uma função de limpeza.
// imprimir: função opcional que devolve { titulo, html } do desafio atual, para o papel.
export function prepararJogo(palco, { regras, ajustes = null, passos = () => [], ctx = null, imprimir: paraImprimir = null, tutorial = false }) {
  const mao = arte("mao", 56);
  const verComoJoga = () => demonstrar(palco, passos(), mao);

  // Regras aos poucos: uma por vez, com "Regra 2 de 4", para quem tem até 9 anos; a lista
  // inteira de uma vez a partir dos 10. A criança pode trocar, e a escolha fica guardada.
  const itens = (() => { const t = document.createElement("div"); t.innerHTML = regras; return [...t.querySelectorAll("li")].map((li) => li.innerHTML); })();
  const quem = ctx?.jogadores?.[0];
  const chaveModo = `regrasModo:${quem?.id || "visitante"}`;
  let modo = itens.length ? ler(chaveModo, (quem?.idade ?? 9) <= 9 ? "passo" : "todas") : "todas";
  let atual = 0;
  const podeGuiar = tutorial && ctx?.iniciarTutorial;
  const guiadasFeitas = !!ctx?.guiadasFeitas?.();

  const corpoAjuda = document.createElement("div");
  corpoAjuda.className = "folha-corpo";
  const historia = ctx?.historia;
  corpoAjuda.innerHTML = `${ctx?.treina ? `<p class="treina"><b>O que você treina:</b> ${ctx.treina}</p>` : ""}
    ${historia ? `<button type="button" class="botao" data-historia>${arte(historia.anfitriao, 30)} ${historia.convite}</button>` : ""}
    ${podeGuiar ? `<div class="aprender">
      <p>${guiadasFeitas ? "Você já fez as fases guiadas. Quer repetir?" : "Aprenda jogando: 3 fases curtas, com o Samuca mostrando cada passo."}</p>
      <button type="button" class="botao ${guiadasFeitas ? "" : "dourado"}" data-guiadas>${guiadasFeitas ? "✓ Refazer as 3 fases guiadas" : "Aprender em 3 fases"}</button></div>` : ""}
    <div class="regras" data-modo="${modo}">
      <div class="regras-lista">${regras}</div>
      <div class="regras-um" aria-live="polite">
        <p class="regras-num"></p><p class="regras-texto"></p>
        <div class="regras-pontos" aria-hidden="true">${itens.map(() => "<i></i>").join("")}</div>
        <div class="regras-nav"><button type="button" class="botao" data-ant>${icone("voltar", 18)} Anterior</button><button type="button" class="botao dourado" data-prox></button></div>
      </div>
    </div>
    <button type="button" class="regras-trocar" data-modo-troca></button>
    <div class="acoes"><button type="button" class="botao" data-ouvir>${icone("som")} Ouvir</button><button type="button" class="botao" data-ver>Ver como joga</button></div>
    ${ctx?.segredo?.length ? `<button type="button" class="botao" data-segredo>${icone("dica")} Como pensar: o segredo do jogo</button>` : ""}
    ${paraImprimir ? `<button type="button" class="botao" data-imprimir>${icone("imprimir")} Imprimir este desafio</button>` : ""}`;
  const dAjuda = folha("Como jogar", corpoAjuda);
  const caixaRegras = corpoAjuda.querySelector(".regras");
  const trocar = corpoAjuda.querySelector("[data-modo-troca]");
  trocar.hidden = !itens.length;
  function mostrarRegra() {
    caixaRegras.dataset.modo = modo;
    trocar.textContent = modo === "passo" ? "Ver todas as regras de uma vez" : "Ver uma regra de cada vez";
    corpoAjuda.querySelector(".regras-num").textContent = `Regra ${atual + 1} de ${itens.length}`;
    corpoAjuda.querySelector(".regras-texto").innerHTML = itens[atual] || "";
    corpoAjuda.querySelectorAll(".regras-pontos i").forEach((p, k) => p.classList.toggle("feito", k <= atual));
    corpoAjuda.querySelector("[data-ant]").disabled = atual === 0;
    corpoAjuda.querySelector("[data-prox]").innerHTML = atual < itens.length - 1 ? `Próxima ${icone("play", 16)}` : "Entendi!";
  }
  corpoAjuda.querySelector("[data-ant]").addEventListener("click", () => { pararFala(); atual = Math.max(0, atual - 1); som("toque"); mostrarRegra(); });
  corpoAjuda.querySelector("[data-prox]").addEventListener("click", () => {
    pararFala();
    if (atual < itens.length - 1) { atual += 1; som("toque"); mostrarRegra(); } else dAjuda.close();
  });
  trocar.addEventListener("click", () => { modo = modo === "passo" ? "todas" : "passo"; guardar(chaveModo, modo); pararFala(); mostrarRegra(); });
  mostrarRegra();
  corpoAjuda.querySelector("[data-ver]").addEventListener("click", () => { pararFala(); dAjuda.close(); verComoJoga(); });
  const ouvirRegras = corpoAjuda.querySelector("[data-ouvir]");
  ouvirRegras.hidden = !podeFalar();
  // Ouvir lê só a regra da tela (uma por vez) ou a lista inteira.
  ouvirRegras.addEventListener("click", () => falar(modo === "passo"
    ? `${corpoAjuda.querySelector(".regras-num").textContent}. ${corpoAjuda.querySelector(".regras-texto").innerText}`
    : corpoAjuda.querySelector(".regras-lista").innerText));
  dAjuda.addEventListener("close", pararFala);
  const abrirAjuda = () => { atual = 0; mostrarRegra(); dAjuda.showModal(); };
  // O segredo: o raciocínio por trás do jogo, em passos, com voz. Explica o jeito de pensar, não dá a resposta.
  let dSegredo = null;
  if (ctx?.segredo?.length) {
    const corpo = document.createElement("div");
    corpo.className = "folha-corpo";
    corpo.innerHTML = `<ol class="segredo">${ctx.segredo.map((p) => `<li>${p}</li>`).join("")}</ol>
      <button type="button" class="botao" data-ouvir-segredo>${icone("som")} Ouvir</button>`;
    dSegredo = folha("Como pensar", corpo);
    const ouvir = corpo.querySelector("[data-ouvir-segredo]");
    ouvir.hidden = !podeFalar();
    ouvir.addEventListener("click", () => falar(corpo.querySelector(".segredo").innerText));
    dSegredo.addEventListener("close", pararFala);
    corpoAjuda.querySelector("[data-segredo]").addEventListener("click", () => { dAjuda.close(); dSegredo.showModal(); });
  }
  // História narrada pelo anfitrião do jogo: oferecida na primeira vez e sempre no "?", nunca
  // toca sozinha, e tem "Pular". Usa o áudio gravado (voz de IA, origem registrada) quando existe;
  // sem ele, ou sem internet, a voz do próprio Android lê o mesmo texto.
  let dHistoria = null, audio = null;
  const pararHistoria = () => { try { audio?.pause(); } catch {} audio = null; pararFala(); };
  if (historia) {
    const corpo = document.createElement("div");
    corpo.className = "folha-corpo historia";
    corpo.innerHTML = `<div class="historia-quem">${arte(historia.anfitriao, 88)}<p>${historia.quem}</p></div>
      <div class="acoes"><button type="button" class="botao dourado" data-tocar>${icone("som")} Ouvir a história</button>
      <button type="button" class="botao" data-pular>Pular</button></div>
      <div class="historia-texto">${historia.paginas.map((t) => `<p>${t}</p>`).join("")}</div>`;
    dHistoria = folha(historia.titulo, corpo);
    const tocar = corpo.querySelector("[data-tocar]");
    tocar.hidden = !historia.audio && !podeFalar();
    tocar.addEventListener("click", () => {
      pararHistoria();
      const texto = corpo.querySelector(".historia-texto").innerText;
      if (!historia.audio) return falar(texto);
      audio = new Audio(new URL(historia.audio, location.href).href);
      audio.play().catch(() => falar(texto));
    });
    corpo.querySelector("[data-pular]").addEventListener("click", () => dHistoria.close());
    dHistoria.addEventListener("close", pararHistoria);
    corpoAjuda.querySelector("[data-historia]").addEventListener("click", () => { dAjuda.close(); dHistoria.showModal(); });
  }
  const abrirHistoria = () => dHistoria?.showModal();

  corpoAjuda.querySelector("[data-guiadas]")?.addEventListener("click", () => { dAjuda.close(); ctx.iniciarTutorial(); });
  corpoAjuda.querySelector("[data-imprimir]")?.addEventListener("click", () => {
    const { titulo, html } = paraImprimir();
    dAjuda.close();
    imprimir(titulo, html);
  });

  const soltarTeclado = [...palco.querySelectorAll("[data-teclado]")].map(tecladoNoTabuleiro);

  // Limite do dia: a partida em curso termina normalmente, mas nenhuma partida nova começa.
  // Os jogos marcam com data-nova-partida os botões que recomeçam (Recomeçar, Nova partida,
  // Próxima fase, escolhas dos ajustes); com o tempo acabado, eles levam à tela do Samuca dormindo.
  const guardaDoLimite = (e) => {
    if (!e.target.closest?.("[data-nova-partida]") || !ctx?.limiteAcabou?.()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    ctx.dormir();
  };
  document.addEventListener("click", guardaDoLimite, true);

  // Avisos da partida ganham um botão de ouvir ao lado.
  palco.querySelectorAll(".aviso").forEach((aviso) => {
    const linha = document.createElement("div");
    linha.className = "aviso-linha";
    aviso.replaceWith(linha);
    linha.append(aviso, botaoOuvir(() => aviso.textContent, "Ouvir o aviso"));
  });

  const dAjustes = ajustes ? folha("Ajustes", ajustes) : null;
  palco.querySelector('[data-faixa="ajuda"]')?.addEventListener("click", abrirAjuda);
  palco.querySelector('[data-faixa="ajustes"]')?.addEventListener("click", () => dAjustes?.showModal());

  let convite = null;
  if (!ctx?.tutorial && ctx?.primeiraVez?.()) {
    convite = document.createElement("div");
    convite.className = "convite-demo";
    convite.innerHTML = `<p>Primeira vez aqui?</p>
      ${podeGuiar ? `<button type="button" class="botao dourado" data-c="guiar">Aprender em 3 fases</button>` : ""}
      <button type="button" class="botao ${podeGuiar ? "" : "dourado"}" data-c="ver">Ver como joga</button>
      ${historia ? `<button type="button" class="botao" data-c="historia">${arte(historia.anfitriao, 26)} Ouvir a história</button>` : ""}
      <button type="button" class="botao" data-c="fechar" aria-label="Fechar">✕</button>`;
    convite.querySelector('[data-c="guiar"]')?.addEventListener("click", () => { convite.remove(); ctx.iniciarTutorial(); });
    convite.querySelector('[data-c="ver"]').addEventListener("click", () => { convite.remove(); verComoJoga(); });
    convite.querySelector('[data-c="historia"]')?.addEventListener("click", () => { convite.remove(); abrirHistoria(); });
    convite.querySelector('[data-c="fechar"]').addEventListener("click", () => convite.remove());
    palco.querySelector(".faixa")?.after(convite);
    // Começou a jogar: o convite sai de cena (tela limpa).
    (palco.querySelector(".jg") || palco).addEventListener("click", (e) => {
      if (convite.isConnected && !convite.contains(e.target) && !e.target.closest(".faixa")) convite.remove();
    }, { capture: true });
  }
  return {
    fecharAjustes: () => dAjustes?.close(),
    abrirHistoria,
    limpar() {
      soltarTeclado.forEach((f) => f()); document.removeEventListener("click", guardaDoLimite, true);
      pararHistoria(); pararDemonstracao(); dAjuda.remove(); dAjustes?.remove(); dSegredo?.remove(); dHistoria?.remove();
    },
  };
}
