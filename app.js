import { FAMILIAS, JOGOS, CONQUISTAS, INTERESSES, ICONE_INTERESSE, CURTO_INTERESSE, CARIMBOS } from "./catalogo.js";
import { somLigado, alternarSom, som, escolhas, botaoOuvir, pararFala, ler, guardar, esc, carregarEstilo } from "./util.js";
import * as P from "./perfis.js";
import * as N from "./nivel.js";
import * as S from "./samuca.js";
import { arte, avatar, icone, nomeDoAvatar, NOME_DESENHO } from "./arte.js";
import { musicaLigada, alternarMusica, prepararMusica, parar as pararMusica } from "./musica.js";

const palco = document.getElementById("palco");
const voltar = document.getElementById("voltar");
const quem = document.getElementById("quem");
let desmontar = null;

voltar.innerHTML = `${icone("voltar")}<span class="voltar-texto">Voltar</span>`;
voltar.addEventListener("click", () => { som("solta"); location.hash = "#/"; });

const botaoSom = document.getElementById("som");
function mostrarSom() {
  const ligado = somLigado();
  botaoSom.innerHTML = icone(ligado ? "som" : "mudo");
  botaoSom.setAttribute("aria-label", ligado ? "Som e vibração ligados. Toque para desligar." : "Som e vibração desligados. Toque para ligar.");
}
botaoSom.addEventListener("click", () => { lembrarPreferencia("som", alternarSom()); mostrarSom(); som("toque"); });
mostrarSom();

const botaoMusica = document.getElementById("musica");
botaoMusica.innerHTML = icone("musica");
function mostrarMusica() {
  const ligada = musicaLigada();
  botaoMusica.classList.toggle("desligado", !ligada);
  botaoMusica.setAttribute("aria-label", ligada ? "Música ligada. Toque para desligar." : "Música desligada. Toque para ligar.");
}
botaoMusica.addEventListener("click", (e) => { e.stopPropagation(); lembrarPreferencia("musica", alternarMusica()); mostrarMusica(); });
mostrarMusica();
prepararMusica();

// ---------------------------------------------------------------- Adulto logado
// "Logar" na Vila é um adulto digitar a senha da família (a do painel). Enquanto vale, a Lojinha da Vila
// aparece; fora disso ela não existe para quem joga. A sessão dura 5 minutos, acaba quando uma criança
// escolhe o seu personagem (ou o Visitante) e quando o app vai para o segundo plano. Fica no sessionStorage.
const ADULTO_MIN = 5;
const adultoAtivo = () => { try { return Number(sessionStorage.getItem("enigmas:adultoAte") || 0) > Date.now(); } catch { return false; } };
const liberarAdulto = () => { try { sessionStorage.setItem("enigmas:adultoAte", String(Date.now() + ADULTO_MIN * 60000)); } catch {} };
const encerrarAdulto = () => { try { sessionStorage.removeItem("enigmas:adultoAte"); } catch {} };
const entrarJogador = (id) => { encerrarAdulto(); P.entrar(id); };
document.addEventListener("visibilitychange", () => { if (document.hidden) encerrarAdulto(); });

// ---------------------------------------------------------------- Preferências e modo leve
// Som, música, vibração, animações lentas, alto contraste, letra fácil e vila calma são de cada criança (ficam no perfil).
// O modo leve é do aparelho: automático em celular fraco, ou forçado no painel.
function celularFraco() {
  const nucleos = navigator.hardwareConcurrency || 8, memoria = navigator.deviceMemory || 8;
  return nucleos <= 4 || memoria <= 2;
}
function aplicarPreferencias() {
  const id = P.ativaId();
  const pref = id && id !== "visitante" ? P.preferencias(id) : { ...P.PREFERENCIAS_PADRAO, ...ler("prefsVisitante", {}) };
  guardar("som", pref.som); guardar("musica", pref.musica); guardar("vibrar", pref.vibrar);
  document.body.classList.toggle("lento", !!pref.lento);
  document.body.classList.toggle("contraste", !!pref.contraste);
  document.body.classList.toggle("letra-facil", !!pref.letra);
  document.body.classList.toggle("vila-calma", !!pref.calma);
  const leve = ler("modoLeve", "auto");
  document.body.classList.toggle("leve", leve === "sim" || (leve === "auto" && celularFraco()));
  if (!pref.musica) pararMusica();
  mostrarSom(); mostrarMusica();
}
function lembrarPreferencia(chave, valor) {
  const id = P.ativaId();
  if (id && id !== "visitante") P.gravarPreferencia(id, chave, valor);
  else guardar("prefsVisitante", { ...ler("prefsVisitante", {}), [chave]: valor });
}

const corDoJogo = (j) => `--cor-jogo: var(--${j.cor}); --cor-jogo-escura: var(--${j.cor}-escuro); --cor-jogo-profunda: var(--${j.cor}-profundo);`;
const VISITANTE = { id: "visitante", apelido: "Visitante", avatar: "🙂", idade: 9 };
const jogadorAtivo = () => (P.ativaId() === "visitante" ? VISITANTE : P.ativa());

function mostrarQuem() {
  const j = jogadorAtivo();
  quem.hidden = !j;
  if (j) {
    quem.innerHTML = `${avatar(j.avatar, 32)}<span class="quem-nome">${esc(j.apelido)}</span>`;
    quem.setAttribute("aria-label", `${j.apelido}. Toque para trocar de jogador.`);
  }
}
quem.addEventListener("click", () => { som("solta"); P.sair(); location.hash = "#/"; rota(); });

// ---------------------------------------------------------------- PIN
// Teclado de PIN: 3 figuras (menores) ou 4 dígitos. Chama aoConcluir(pin).
function tecladoPin(el, tipo, titulo, aoConcluir) {
  const tamanho = tipo === "figuras" ? 3 : 4;
  const teclas = tipo === "figuras" ? P.FIGURAS : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
  let entrada = [];
  el.innerHTML = `
    <div class="pin">
      <p class="pin-titulo">${titulo}</p>
      <div class="pin-casas" aria-live="polite"></div>
      <div class="pin-teclas ${tipo}"></div>
      ${tipo === "figuras" ? `<button type="button" class="botao pin-apagar">${icone("desfazer")} Apagar</button>` : ""}
    </div>`;
  const tituloPin = el.querySelector(".pin-titulo");
  tituloPin.append(botaoOuvir(() => tituloPin.textContent, "Ouvir"));
  const casas = el.querySelector(".pin-casas");
  const desenhar = () => {
    casas.innerHTML = Array.from({ length: tamanho }, (_, i) =>
      `<span class="${entrada[i] ? "cheia" : ""}">${entrada[i] ? (tipo === "figuras" ? avatar(entrada[i], 36) : "●") : ""}</span>`).join("");
  };
  const concluir = () => { if (entrada.length === tamanho) { const pin = entrada.join(""); entrada = []; desenhar(); aoConcluir(pin); } };
  const caixa = el.querySelector(".pin-teclas");
  for (const t of teclas) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "pin-tecla";
    b.innerHTML = tipo === "figuras" ? avatar(t, 46) : t;
    b.setAttribute("aria-label", t === "⌫" ? "Apagar" : t === "✓" ? "Confirmar" : t);
    b.addEventListener("click", () => {
      som("toque");
      if (t === "⌫") entrada.pop();
      else if (t === "✓") return concluir();
      else if (entrada.length < tamanho) entrada.push(t);
      desenhar();
      if (tipo === "figuras" && entrada.length === tamanho) setTimeout(concluir, 150);
    });
    caixa.appendChild(b);
  }
  el.querySelector(".pin-apagar")?.addEventListener("click", () => { entrada.pop(); desenhar(); });
  desenhar();
}

// Pede o PIN de uma criança (ou cria um novo, se foi zerado). Resolve true quando confere.
function pedirPin(el, c, titulo) {
  return new Promise((resolver) => {
    if (c.pinHash === null) {
      const tipo = c.idade <= 9 ? "figuras" : "digitos";
      let primeiro = null;
      const passo = (msg) => tecladoPin(el, tipo, msg, async (pin) => {
        if (!primeiro) { primeiro = pin; passo("Repita o segredo novo"); }
        else if (pin === primeiro) { await P.trocarPin(c.id, tipo, pin); resolver(true); }
        else { primeiro = null; som("erro"); passo("Não bateu. Escolha o segredo de novo"); }
      });
      passo(`${esc(c.apelido)}, escolha um segredo novo`);
      return;
    }
    // Depois de 3 erros seguidos, uma pausa que cresce (5 s, 10 s, 20 s… até 5 min), sem
    // contador na tela: só "espere um pouquinho". Assim um primo não descobre o segredo do outro.
    const chaveErros = `pinErros:${c.id}`;
    const tentar = (msg) => tecladoPin(el, c.pinTipo, msg, async (pin) => {
      const erros = ler(chaveErros, { n: 0, ate: 0 });
      if (Date.now() < erros.ate) { som("erro"); return tentar("Espere um pouquinho e tente de novo"); }
      if (await P.conferirPin(c.id, pin)) { guardar(chaveErros, { n: 0, ate: 0 }); resolver(true); return; }
      const n = erros.n + 1;
      guardar(chaveErros, { n, ate: n >= 3 ? Date.now() + Math.min(300000, 5000 * 2 ** (n - 3)) : 0 });
      som("erro");
      tentar(n >= 3 ? "Não é esse. Espere um pouquinho e tente de novo" : "Não é esse. Tente de novo");
    });
    tentar(titulo);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ---------------------------------------------------------------- Entrada e novo jogador
function telaEntrar() {
  const lista = P.criancas();
  palco.innerHTML = `
    <section class="boas-vindas">
      <div class="samuca-grande">${S.retrato(120, "feliz")}</div>
      <h1 class="titulo-jogo">Quem vai jogar?</h1>
      <p id="entrar-dica">Toque no seu personagem.</p>
    </section>
    <div class="avatares" id="lista"></div>
    <div id="pin-area"></div>
    <div class="acoes">
      <a class="botao principal" href="#/novo">+ Novo jogador</a>
      <button type="button" class="botao" id="visitante">Visitante</button>
    </div>
    <p class="rodape"><a href="#/painel">Painel da família</a> · <a href="#/cuidados">Para pais e avós</a>${adultoAtivo()
      ? ` · <a class="rodape-loja" href="#/lojinha" aria-label="Lojinha da Vila, só para adultos">${icone("loja", 18)} Lojinha</a>` : ""}</p>`;
  palco.querySelector("#entrar-dica").append(botaoOuvir(() => "Quem vai jogar? Toque no seu personagem.", "Ouvir"));
  const caixa = palco.querySelector("#lista");
  if (!lista.length) caixa.innerHTML = `<p class="vazio">Ainda não tem ninguém aqui. Crie o primeiro jogador!</p>`;
  for (const c of lista) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "avatar-cartao";
    b.innerHTML = `<span class="avatar">${avatar(c.avatar, 64)}</span><strong>${esc(c.apelido)}</strong>`;
    b.addEventListener("click", async () => {
      som("toque");
      caixa.querySelectorAll(".avatar-cartao").forEach((x) => x.classList.toggle("escolhido", x === b));
      const ok = await pedirPin(palco.querySelector("#pin-area"), c, `Oi, ${esc(c.apelido)}! Qual é o seu segredo?`);
      if (ok) { som("ponto"); entrarJogador(c.id); rota(); }
    });
    caixa.appendChild(b);
  }
  palco.querySelector("#visitante").addEventListener("click", async () => {
    // Quando o tempo de alguma criança acabou hoje, o Visitante pede a senha da família
    // (senão "Trocar de jogador" → Visitante viraria mais uma hora de jogo).
    const alguemAcabou = P.criancas().some((c) => esgotado(c.id));
    if (alguemAcabou && P.temPainel() && !(await pedirSenhaFamilia(palco.querySelector("#pin-area"),
      "O tempo de jogo de hoje acabou. Para entrar como Visitante, um adulto digita a senha da família."))) return;
    entrarJogador("visitante"); rota();
  });
}

// Pede a senha da família num espaço da tela. Resolve true quando confere.
function pedirSenhaFamilia(el, texto) {
  return new Promise((resolver) => {
    el.innerHTML = `<div class="pin"><p class="pin-titulo">${texto}</p>
      <input id="senha-familia" class="campo" type="password" inputmode="numeric" autocomplete="off" aria-label="Senha da família">
      <button type="button" class="botao principal" id="senha-ok">Continuar</button>
      <p class="aviso erro" id="senha-erro" hidden></p></div>`;
    el.querySelector("#senha-ok").addEventListener("click", async () => {
      if (await P.conferirSenhaPainel(el.querySelector("#senha-familia").value)) { liberarAdulto(); el.innerHTML = ""; resolver(true); }
      else { const e = el.querySelector("#senha-erro"); e.hidden = false; e.textContent = "Senha errada."; }
    });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// Criar jogador pede a senha do painel (senão um perfil novo "zeraria" o limite do dia).
let novoLiberado = false;
// Na primeira abertura ainda não há senha: o adulto cria a senha da família antes do primeiro
// jogador (ela também abre o painel). Sem isso, qualquer criança criaria perfis à vontade.
function telaSenhaNovo() {
  const criar = !P.temPainel();
  palco.innerHTML = `
    <section class="jg">
      <div class="faixa" style="--cor-jogo:var(--verde);--cor-jogo-escura:var(--verde-escuro);--cor-jogo-profunda:var(--verde-profundo)">
        <span class="emblema">${S.retrato(56, "feliz")}</span><h1>Novo jogador</h1></div>
      <p class="sala-resumo">${criar
        ? "Primeira vez aqui: um adulto cria a senha da família. Ela serve para criar jogadores e para abrir o painel."
        : "Peça para um adulto digitar a senha da família."}</p>
      <input id="senha" class="campo" type="password" inputmode="numeric" autocomplete="off" aria-label="${criar ? "Senha nova da família" : "Senha da família"}">
      ${criar ? `<input id="senha2" class="campo" type="password" inputmode="numeric" autocomplete="off" aria-label="Repita a senha">` : ""}
      <button type="button" class="botao principal" id="ok">Continuar</button>
      <p class="aviso erro" id="erro" hidden></p>
    </section>`;
  palco.querySelector("#ok").addEventListener("click", async () => {
    const s = palco.querySelector("#senha").value, e = palco.querySelector("#erro");
    const falhar = (t) => { e.hidden = false; e.textContent = t; };
    if (criar) {
      if (s.length < 4) return falhar("Use pelo menos 4 caracteres.");
      if (s !== palco.querySelector("#senha2").value) return falhar("As duas senhas não batem.");
      await P.definirSenhaPainel(s); novoLiberado = true; liberarAdulto(); rota();
    } else if (await P.conferirSenhaPainel(s)) { novoLiberado = true; liberarAdulto(); rota(); }
    else falhar("Senha errada.");
  });
}

function telaNovo() {
  novoLiberado = false;
  const novo = { apelido: "", avatar: P.AVATARES[0], idade: 9 };
  palco.innerHTML = `
    <section class="jg">
      <div class="faixa" style="--cor-jogo:var(--verde);--cor-jogo-escura:var(--verde-escuro);--cor-jogo-profunda:var(--verde-profundo)">
        <span class="emblema">${S.retrato(56, "feliz")}</span><h1>Novo jogador</h1></div>
      <div class="painel-bloco">
        <label class="rotulo" for="apelido">Apelido de jogo (invente um!)</label>
        <input id="apelido" class="campo" maxlength="14" autocomplete="off" placeholder="Ex.: Raio Azul">
        <p class="nota">Não use o nome de verdade.</p>
      </div>
      <div class="painel-bloco"><span class="rotulo">Personagem</span><div class="avatares mini" id="avatares"></div></div>
      <div class="painel-bloco"><span class="rotulo">Quantos anos você tem?</span><div id="idade"></div></div>
      <div id="pin-area"></div>
      <button type="button" class="botao principal" id="continuar">Continuar</button>
      <p class="aviso erro" id="erro" hidden></p>
    </section>`;
  const av = palco.querySelector("#avatares");
  const desenharAvatares = () => {
    av.innerHTML = P.AVATARES.map((a) => `<button type="button" class="avatar-mini ${a === novo.avatar ? "escolhido" : ""}" data-a="${a}" aria-label="Personagem: ${nomeDoAvatar(a)}" aria-pressed="${a === novo.avatar}">${avatar(a, 44)}</button>`).join("");
  };
  av.addEventListener("click", (e) => { const b = e.target.closest("[data-a]"); if (b) { novo.avatar = b.dataset.a; som("toque"); desenharAvatares(); } });
  desenharAvatares();
  escolhas(palco.querySelector("#idade"), [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => [n, String(n)]), novo.idade, (v) => { novo.idade = v; });

  palco.querySelector("#continuar").addEventListener("click", () => {
    const erro = palco.querySelector("#erro");
    novo.apelido = palco.querySelector("#apelido").value.trim();
    if (novo.apelido.length < 2) { erro.hidden = false; erro.textContent = "Escreva um apelido com pelo menos 2 letras."; return; }
    if (P.criancas().some((c) => c.apelido.toLowerCase() === novo.apelido.toLowerCase())) {
      erro.hidden = false; erro.textContent = "Já tem alguém com esse apelido. Invente outro!"; return;
    }
    erro.hidden = true;
    palco.querySelector("#continuar").hidden = true;
    const tipo = novo.idade <= 9 ? "figuras" : "digitos";
    const area = palco.querySelector("#pin-area");
    let primeiro = null;
    const passo = (msg) => tecladoPin(area, tipo, msg, async (pin) => {
      if (!primeiro) { primeiro = pin; passo("Agora repita o segredo"); return; }
      if (pin !== primeiro) { primeiro = null; som("erro"); passo("Não bateu. Escolha o segredo de novo"); return; }
      const c = await P.criarCrianca({ ...novo, pinTipo: tipo, pin });
      som("vitoria");
      entrarJogador(c.id);
      location.hash = "#/";
    });
    passo(tipo === "figuras" ? "Escolha 3 figuras como seu segredo" : "Escolha 4 números como seu segredo");
    area.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

// ---------------------------------------------------------------- Mapa da vila
// Jogos sugeridos: primeiro os que combinam com a idade e ainda não foram jogados,
// depois os que faz mais tempo que não joga. Um solo e um de dupla, para variar.
function paraVoce(j) {
  const prontos = JOGOS.filter((g) => g.pronto);
  const reg = (g) => (j.id === "visitante" ? undefined : P.registroDoJogo(j.id, g.id));
  const pontuar = (g) => {
    const r = reg(g);
    if (!r) return (j.idade >= g.idade ? 2e13 : 1e13) + g.idade;
    return 1e13 - (r.ultimaVez || 0) / 1000;
  };
  const melhor = (tipo) => prontos.filter((g) => g.tipo === tipo).sort((a, b) => pontuar(b) - pontuar(a))[0];
  return [melhor("solo"), melhor("duelo")].filter(Boolean);
}

const FUNDO_MAPA = `
<svg class="mapa-fundo" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="grama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5cc95a"/><stop offset="1" stop-color="#2f9e3a"/></linearGradient>
    <linearGradient id="agua" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2fa8e8"/><stop offset="1" stop-color="#1b6fc4"/></linearGradient>
  </defs>
  <rect width="100" height="160" fill="url(#grama)"/>
  <g fill="#1f7a3a">${[[6, 14], [14, 8], [26, 12], [38, 16], [8, 42], [4, 28], [44, 40], [28, 44], [42, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/><circle cx="${x + 3}" cy="${y - 3}" r="4" fill="#2a9a4a"/>`).join("")}</g>
  <g>${[[62, 10, 10], [78, 6, 14], [92, 14, 10], [58, 44, 8], [94, 42, 10]].map(([x, y, h]) => `<rect x="${x - 3}" y="${y}" width="6" height="${h}" fill="#c8b8e8"/><path d="M${x - 4} ${y} l4 -5 l4 5 Z" fill="#a879ff"/>`).join("")}</g>
  <path d="M0 62 Q25 54 50 64 T100 60 L100 76 Q75 82 50 74 T0 78 Z" fill="url(#agua)"/>
  <path d="M8 66 q6 -2 12 0 M60 70 q6 -2 12 0 M34 72 q5 -2 10 0" stroke="#bfe6ff" stroke-width=".8" fill="none" opacity=".7"/>
  <rect x="45" y="60" width="10" height="20" rx="2" fill="#c98b4f"/><path d="M45 62 h10 M45 66 h10 M45 70 h10 M45 74 h10 M45 78 h10" stroke="#8a5424" stroke-width=".7"/>
  <path d="M50 160 L50 80 M50 60 L50 48 Q40 40 26 34 M50 48 Q62 38 72 30" stroke="#e9d3a0" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="140" rx="44" ry="18" fill="#c98b4f"/><ellipse cx="50" cy="140" rx="38" ry="14" fill="#e9d3a0"/>
  <path d="M12 134 A44 18 0 0 1 88 134" stroke="#ff5b61" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/><path d="M12 146 A44 18 0 0 0 88 146" stroke="#3aa6ff" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/>
  <g fill="#ffc83d">${[[20, 100], [80, 104], [12, 118], [88, 90], [70, 116], [30, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join("")}</g>
  <g fill="#ff7ac8">${[[24, 104], [84, 98], [16, 92], [74, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join("")}</g>
</svg>`;

function inicio() {
  const j = jogadorAtivo();
  const prontos = JOGOS.filter((g) => g.pronto);
  const sugeridos = new Set(paraVoce(j).map((g) => g.id));
  const tarde = S.tardeDaNoite();
  const lugares = [], rotulos = [];
  const pos = (x, y) => `left:${x}%;top:${(y * 100) / 160}%`;
  for (const [chave, fam] of Object.entries(FAMILIAS)) {
    const jogos = prontos.filter((g) => g.familia === chave);
    rotulos.push(`<span class="mapa-rotulo" style="${pos(fam.rotulo.x, fam.rotulo.y)}">${fam.nome}</span>`);
    if (!jogos.length) {
      const [x, y] = fam.lugares[0];
      lugares.push(`<span class="mapa-obra" style="${pos(x, y)}"><span>Em construção</span></span>`);
    }
    jogos.forEach((g, k) => {
      const [x, y] = fam.lugares[k] || fam.lugares.at(-1);
      lugares.push(`
        <a class="mapa-lugar ${sugeridos.has(g.id) ? "sugerido" : ""}" href="#/jogo/${g.id}" style="${pos(x, y)};${corDoJogo(g)}">
          ${sugeridos.has(g.id) ? `<span class="mapa-selo">para você</span>` : ""}
          <span class="mapa-base">${arte(g.arte, 54)}</span>
          <span class="mapa-nome">${g.nome}</span>
        </a>`);
    });
  }
  // Lista em cartões, por região: a alternativa ao mapa (e, em tela larga, ao lado dele).
  const cartoes = Object.entries(FAMILIAS).map(([chave, fam]) => {
    const jogos = prontos.filter((g) => g.familia === chave);
    return `<section class="regiao" aria-labelledby="regiao-${chave}">
      <h2 class="regiao-nome" id="regiao-${chave}">${fam.nome}</h2>
      ${jogos.length ? jogos.map((g) => `
        <a class="cartao-jogo ${sugeridos.has(g.id) ? "sugerido" : ""}" href="#/jogo/${g.id}" style="${corDoJogo(g)}">
          <span class="mapa-base">${arte(g.arte, 44)}</span>
          <span class="cartao-jogo-texto">
            <strong>${g.nome}</strong>
            <small>${g.objetivo || ""}</small>
            <span class="cartao-jogo-tipo">${icone(g.tipo === "duelo" ? "dupla" : "sozinho", 16)} ${g.tipo === "duelo" ? "A dois ou contra o Samuca" : "Sozinho"}</span>
          </span>
          ${sugeridos.has(g.id) ? `<span class="mapa-selo">para você</span>` : ""}
        </a>`).join("") : `<p class="regiao-obra">Em construção: novos jogos chegam aqui.</p>`}
    </section>`;
  }).join("");
  const interesse = ler(`interesse:${j.id}`, "tudo");
  const vista = ler(`vista:${j.id}`, "mapa");
  palco.innerHTML = `
    <section class="saudacao">
      ${S.retrato(64, tarde ? "sonolento" : "feliz")}
      <div class="saudacao-texto"><h1 class="titulo-jogo">Oi, ${esc(j.apelido)}!</h1>
        <p>${tarde ? S.fala("tarde") : "Toque num lugar da vila para jogar."}</p></div>
      ${j.id === "visitante" ? "" : `<a class="estante-botao" href="#/diario" aria-label="Meu diário">${arte("diario", 40)}<span>Diário</span></a>`}
    </section>
    <div class="interesses" role="group" aria-label="O que você quer treinar hoje?">${INTERESSES.map(([v, r]) =>
      `<button type="button" class="interesse" data-i="${v}" aria-pressed="${interesse === v}" aria-label="${r}">${icone(ICONE_INTERESSE[v], 18)} ${CURTO_INTERESSE[v] ? `<span class="longo">${r}</span><span class="curto" aria-hidden="true">${CURTO_INTERESSE[v]}</span>` : r}</button>`).join("")}</div>
    <div class="vistas" role="group" aria-label="Ver os jogos">
      <button type="button" class="vista" data-v="mapa" aria-pressed="${vista === "mapa"}">${icone("mapa", 18)} Mapa</button>
      <button type="button" class="vista" data-v="lista" aria-pressed="${vista === "lista"}">${icone("lista", 18)} Lista</button>
    </div>
    <div class="vila vista-${vista}">
      <section class="mapa" aria-label="Mapa da vila">
        ${FUNDO_MAPA}
        ${rotulos.join("")}
        ${lugares.join("")}
      </section>
      <div class="lista-jogos" aria-label="Jogos da vila em lista">${cartoes}</div>
    </div>
    <p class="em-breve">A vila cresce: novos lugares chegam aos poucos.</p>
    <a class="botao cuidados-botao" href="#/cuidados">Para pais e avós: como cuidamos das crianças</a>`;
  // Filtro por interesse: os jogos de fora ficam apagados (continuam tocáveis; nada some nem tranca).
  const aplicarInteresse = (v) => {
    palco.querySelectorAll(".mapa-lugar, .cartao-jogo").forEach((l) => {
      const g = JOGOS.find((x) => l.getAttribute("href") === `#/jogo/${x.id}`);
      l.classList.toggle("fora-do-interesse", v !== "tudo" && !(g?.interesses || []).includes(v));
    });
    palco.querySelectorAll(".interesse").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.i === v));
      if (b.dataset.i === v) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  };
  palco.querySelectorAll(".interesse").forEach((b) => b.addEventListener("click", () => {
    som("toque"); guardar(`interesse:${j.id}`, b.dataset.i); aplicarInteresse(b.dataset.i);
  }));
  aplicarInteresse(interesse);
  // Mapa ou lista (no celular; em tela larga os dois aparecem lado a lado). Guardado por criança.
  palco.querySelectorAll(".vista").forEach((b) => b.addEventListener("click", () => {
    som("toque"); guardar(`vista:${j.id}`, b.dataset.v);
    palco.querySelector(".vila").className = `vila vista-${b.dataset.v}`;
    palco.querySelectorAll(".vista").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
}

// ---------------------------------------------------------------- Para pais e avós
// Página para os adultos: os cuidados do portal, em linguagem simples. Abre sem entrar como
// criança. Cada frase descreve uma regra que o portal já cumpre (ver CLAUDE.md); ao mudar uma
// regra, mudar aqui também.
const CUIDADOS = [
  { icone: "casa", titulo: "Feito para pensar, não para prender", itens: [
    "Quem joga nunca paga nada. Os jogos não têm anúncios, não têm compras e não pedem dinheiro, e nada é vendido para as crianças.",
    "Para ajudar a pagar o portal vai existir uma página só para adultos, a Lojinha da Vila. Ela só aparece depois que um adulto entra com a senha da família, some quando uma criança escolhe o seu personagem e nunca aparece dentro de um jogo ou no mapa. Hoje ela ainda não tem nenhum produto nem link.",
    "Sem moedas, baús, prêmios sorteados ou sequência de dias seguidos. Nada que faça a criança voltar por obrigação.",
    "Sem notificações. O portal nunca chama a criança.",
    "Sem ranking e sem comparar uma criança com outra: o nível de cada um nunca aparece na tela.",
    "Nada fica trancado como recompensa. Todos os jogos estão abertos desde o início.",
    "Cada partida termina de forma natural, com \"Jogar de novo\" e \"Voltar para a vila\" do mesmo tamanho, e uma ideia para brincar fora da tela.",
  ] },
  { icone: "som", titulo: "Calmo e sem sustos", itens: [
    "Nada se mexe sozinho: nenhuma animação em repetição, nenhum personagem que aparece de repente. A tela só responde ao toque da criança.",
    "Sem terror, sem violência, sem monstros que perseguem e sem \"fim de jogo\". Errar só mostra o que aconteceu, e dá para desfazer quantas vezes quiser.",
    "Sem cronômetro e sem pressa: aqui ninguém ganha por ser rápido.",
    "Sons de piano suaves, na mesma escala da música, nunca bipe ou buzina. Música, som e vibração têm botão para desligar.",
    "Cores vivas no mapa da vila e cores calmas dentro dos jogos, onde a criança passa o tempo pensando.",
    "Nada que possa virar provocação: nenhum jogo fala do corpo das pessoas (peso, altura, aparência), e nenhum personagem é \"o lento\", \"a fraca\" ou alvo de piada por quem é.",
    "O Samuca, a coruja, fala pouco, com frases curtas e gentis. Quando a criança erra, ele explica a regra, sem bronca.",
  ] },
  { icone: "passos", titulo: "Tempo de tela com equilíbrio", itens: [
    "De segunda a sexta, cada criança tem um limite por dia (1 hora, ajustável no painel). Sábado e domingo ficam livres.",
    "O limite nunca corta uma partida no meio: o Samuca avisa 10 minutos antes, deixa terminar e depois vai dormir até o dia seguinte.",
    "Depois de 30 minutos, o Samuca sugere uma pausa, sempre no fim de uma partida.",
    "Depois das 21h, o Samuca aparece com sono e sugere descansar.",
    "Criar jogador novo e entrar como Visitante quando o tempo acabou pedem a senha da família.",
  ] },
  { icone: "lupa", titulo: "Privacidade das crianças", itens: [
    "Só apelido inventado, personagem desenhado e idade. Nada de nome real, foto ou dado que identifique a criança.",
    "Cada criança entra com um segredo (figuras ou números), guardado embaralhado.",
    "No fim de uma partida, a criança pode, se quiser, tocar numa carinha (gostei, mais ou menos, não gostei) e em como achou a dificuldade. É só escolher, sem escrever nada, e quem vê é só o adulto, no Painel da família. Não muda o nível dela nem dá prêmio.",
    "Você, adulto, pode mandar a sua própria opinião mais abaixo nesta página: sobre o portal, ou sobre um jogo que você mesmo jogou. O portal não guarda o que você escreve: você compartilha ou copia o texto e manda para a pessoa da família que cuida do portal. Se quiser, pode autorizar a publicação do seu depoimento com nome, idade, cidade e UF; sem a autorização, nada disso é enviado.",
    "Tudo fica guardado só neste celular. Antes de qualquer nuvem, a família faz uma revisão de proteção de dados (LGPD).",
  ] },
  { icone: "dupla", titulo: "Para todas as idades e jeitos de aprender", itens: [
    "Feito para crianças de 5 a 15 anos, e para quem ainda não lê: todo texto importante tem o botão Ouvir.",
    "Regras uma de cada vez para os menores, três fases guiadas para aprender jogando, e dicas que ensinam a pensar em vez de dar a resposta.",
    "A dificuldade se ajusta a cada criança, sem trilha fixa por idade: irmãos, primos e amigos de idades diferentes jogam juntos, e quem tem mais experiência dá vantagem ao outro.",
    "Contra a coruja, o Samuca joga para a criança ganhar na maior parte das vezes, sem deixar isso aparente.",
    "No painel, para cada criança: animações mais lentas.",
    "Também pensado para quem usa teclado ou o leitor de tela do Android.",
    "Feito para celulares simples ou antigos, que costumam ser os das crianças: desenhos leves e um modo leve que liga sozinho quando o celular é mais fraco.",
  ] },
  { icone: "sozinho", titulo: "Crianças neurodivergentes", itens: [
    "O portal foi pensado também para crianças neurodivergentes (por exemplo, autistas, com TDAH ou com dislexia). Cada criança é diferente: as opções do painel são escolhidas para cada uma.",
    "Previsível: as regras nunca mudam no meio da partida, e o Samuca fala de forma curta e literal, sem ironia nem duplo sentido. Não há disputa online com desconhecidos.",
    "Sem sobrecarga: nada se mexe nem toca sozinho, não há sons fortes nem pressa. Som, música e vibração desligam separadamente, e as animações podem ficar mais lentas.",
    "Sem frustração em cadeia: dá para desfazer quantas vezes quiser, o erro é explicado com calma, a dica vem aos poucos e as partidas são curtas.",
    "O alto contraste ajuda quem enxerga pouco, mas pode incomodar quem é sensível à luz e ao brilho. Por isso ele vem desligado e é escolhido para cada criança; dentro dos jogos, as cores já são suaves.",
    "Para quem se incomoda com cor e brilho, a opção Vila calma (no painel, para cada criança) deixa também o mapa da vila, os menus e os botões em tons suaves, sem brilho em volta.",
  ] },
  { icone: "lista", titulo: "Cores e leitura fáceis para todos", itens: [
    "Os textos têm contraste conferido pela norma de acessibilidade (WCAG): letra clara só sobre fundo escuro, letra escura só sobre fundo claro.",
    "Nenhuma informação depende só da cor, pensando em quem não enxerga bem algumas cores (daltonismo): sempre há também forma, símbolo ou palavra, como ✓ e ✕, favos com contorno diferente e frutas com formatos diferentes.",
    "Opção de alto contraste no painel, para cada criança.",
    "Letra fácil de ler, para quem tem dislexia ou se cansa ao ler: uma letra em que b e d, I, l e 1 não se confundem, com mais espaço entre letras, palavras e linhas. Liga no painel, para cada criança.",
    "Escolhemos espaço maior em vez de uma letra \"especial para dislexia\" porque os estudos com crianças disléxicas mostraram ganho com o espaçamento, e não com essas letras.",
    "Textos curtos, regras uma de cada vez para os menores e botão Ouvir em todo texto importante.",
  ] },
  { icone: "formas", titulo: "Cuidado na escolha dos jogos", itens: [
    "São jogos de raciocínio clássicos, alguns com séculos de história. Cada um diz o que treina: planejar, deduzir, espaço e formas, números ou jogar a dois.",
    "Toda curiosidade e todo fato histórico são conferidos em fonte antes de entrar.",
    "Jogo com dono (marca registrada ou produto comercial) só entra numa versão nossa, com nome, desenhos e fases próprios.",
    "Os desenhos e as ilustrações foram criados para o portal, com ajuda de inteligência artificial, no mesmo traço do Samuca. Os arquivos da marca e as ilustrações levam credenciais de conteúdo (C2PA), que registram essa origem, e toda imagem que vem de fora tem a origem conferida antes de entrar.",
    "Cada jogo tem um amigo do Samuca que conta a história dele (o Bento, o Tomé, o Gui, o Tito, a Zuzu e a Bia). As histórias são narradas por vozes de inteligência artificial, que não imitam nenhuma pessoa, e os fatos são conferidos em fonte antes de entrar. Elas só tocam quando a criança pede, têm o botão Pular e, sem internet, quem lê é a voz do próprio celular.",
    "Todos os jogos têm dois modelos: o ilustrado, mais rico, que precisa de internet, e o leve, que funciona sem internet e em celular mais simples. Em celular simples, ou se a internet estiver lenta, o jogo abre sozinho no modelo leve. A criança ou um adulto escolhe nos ajustes.",
    "Jogos de origem indígena citam a origem com respeito.",
  ] },
];

// Opinião dos adultos (diferente da das crianças: texto livre, escrito por um adulto e mandado por ele). O portal não
// tem servidor nem guarda nada disso: o texto é montado aqui e o adulto o compartilha ou copia, sem endereço embutido.
function resumoOpinioes() {
  const cs = P.criancas();
  const linhas = JOGOS.filter((g) => g.pronto).map((g) => {
    const todas = cs.map((c) => P.opinioes(c.id)[g.id]).filter(Boolean);
    if (!todas.length) return null;
    const n = (campo, v) => todas.filter((o) => o[campo] === v).length;
    return `${g.nome}: ${n("gosto", "gostei")} gostei, ${n("gosto", "meio")} mais ou menos, ${n("gosto", "nao")} não gostei; dificuldade: ${n("nivel", "facil")} fácil, ${n("nivel", "certo")} no ponto certo, ${n("nivel", "dificil")} difícil`;
  }).filter(Boolean);
  return {
    texto: linhas.join("\n"),
    html: linhas.length ? `<ul class="opiniao-resumo">${linhas.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : `<p class="vazio">Ainda ninguém respondeu.</p>`,
  };
}
function formularioPais() {
  // Só se opina sobre um jogo que se jogou de verdade: a lista traz apenas os jogos terminados neste celular
  // (`jogou:<jogo>`, gravado ao registrar o resultado) e ainda pede a confirmação de que o adulto mesmo jogou.
  const jogados = JOGOS.filter((g) => g.pronto && ler(`jogou:${g.id}`, null));
  const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  return `<section class="cuidados-bloco" id="opiniao">
    <h2>Sua opinião, pai, mãe, avó ou avô</h2>
    <p>Conte o que achou: um elogio, um problema, uma ideia. <b>Não escreva nome, foto ou dado de criança.</b>
    O portal não guarda nada do que você escrever: o texto fica só neste aparelho até você compartilhar ou copiar e mandar para a pessoa da família que cuida do portal.</p>
    <label class="rotulo" for="op-tipo">Que tipo de mensagem?</label>
    <select id="op-tipo" class="campo"><option>Elogio</option><option>Problema</option><option>Ideia</option><option>Dúvida</option></select>
    <label class="rotulo" for="op-jogo">Sobre o quê?</label>
    <select id="op-jogo" class="campo"><option value="">O portal, a vila em geral</option>${jogados.map((g) => `<option>${esc(g.nome)}</option>`).join("")}</select>
    <p class="nota">${jogados.length ? "Aparecem aqui só os jogos que foram terminados neste celular." : "Para opinar sobre um jogo, jogue-o até o fim neste celular. Antes disso, a opinião é sobre o portal."}</p>
    <label class="opiniao-check" id="op-joguei-linha" hidden><input type="checkbox" id="op-joguei"> Eu mesmo joguei este jogo (opinião sobre um jogo só vale de quem jogou).</label>
    <label class="rotulo" for="op-texto">Sua mensagem</label>
    <textarea id="op-texto" class="campo" rows="5" maxlength="1500" placeholder="Escreva aqui"></textarea>
    <label class="opiniao-check"><input type="checkbox" id="op-resumo"> Incluir o resumo do que as crianças deste celular acharam dos jogos (sem nomes)</label>
    <fieldset class="opiniao-pub"><legend>Depoimento público (opcional)</legend>
      <label class="opiniao-check"><input type="checkbox" id="op-autoriza"> <span>Autorizo a Vila do Samuca a publicar o meu depoimento, junto com o meu nome, idade, cidade e UF, no site e em materiais de divulgação do portal. Posso pedir a retirada a qualquer momento.</span></label>
      <div id="op-pub-campos" hidden>
        <p class="nota">Use os <b>seus</b> dados de adulto, nunca os de uma criança. Sem a autorização acima, nada disto é enviado.</p>
        <label class="rotulo" for="op-nome">Seu nome</label><input id="op-nome" class="campo" maxlength="60" autocomplete="name">
        <label class="rotulo" for="op-idade">Sua idade</label><input id="op-idade" class="campo" type="number" inputmode="numeric" min="18" max="120">
        <label class="rotulo" for="op-cidade">Cidade</label><input id="op-cidade" class="campo" maxlength="60" autocomplete="address-level2">
        <label class="rotulo" for="op-uf">UF</label>
        <select id="op-uf" class="campo"><option value="">Escolha</option>${UFS.map((u) => `<option>${u}</option>`).join("")}</select>
      </div></fieldset>
    <div class="acoes"><button type="button" class="botao principal" id="op-enviar">Compartilhar</button><button type="button" class="botao" id="op-copiar">Copiar</button></div>
    <p class="nota" id="op-msg" role="status"></p></section>`;
}
function ligarFormularioPais() {
  const q = (s) => palco.querySelector(s);
  const erro = (m, alvo) => { q("#op-msg").textContent = m; q(alvo)?.focus(); return null; };
  q("#op-jogo").addEventListener("change", () => { q("#op-joguei-linha").hidden = !q("#op-jogo").value; });
  q("#op-autoriza").addEventListener("change", () => { q("#op-pub-campos").hidden = !q("#op-autoriza").checked; });
  const montar = () => {
    const t = q("#op-texto").value.trim();
    if (!t) return erro("Escreva a mensagem primeiro.", "#op-texto");
    const jogo = q("#op-jogo").value;
    if (jogo && !q("#op-joguei").checked) return erro("Para opinar sobre um jogo, confirme que você mesmo jogou. Se não jogou, escolha \"O portal\".", "#op-joguei");
    const resumo = q("#op-resumo").checked ? resumoOpinioes().texto : "";
    let pub = "Autorização de publicação: NÃO. Não publicar o depoimento.";
    if (q("#op-autoriza").checked) {
      const nome = q("#op-nome").value.trim(), idade = Number(q("#op-idade").value), cidade = q("#op-cidade").value.trim(), uf = q("#op-uf").value;
      if (!nome) return erro("Para autorizar a publicação, escreva o seu nome.", "#op-nome");
      if (!Number.isInteger(idade) || idade < 18 || idade > 120) return erro("Escreva a sua idade (de adulto, 18 ou mais).", "#op-idade");
      if (!cidade) return erro("Escreva a sua cidade.", "#op-cidade");
      if (!uf) return erro("Escolha a UF.", "#op-uf");
      pub = `Autorização de publicação: SIM, dada em ${new Date().toLocaleString("pt-BR")}. Pode ser retirada a qualquer momento.\nNome: ${nome}\nIdade: ${idade}\nCidade/UF: ${cidade}/${uf}`;
    }
    return `Vila do Samuca, opinião de adulto\nTipo: ${q("#op-tipo").value}\nSobre: ${jogo ? `o jogo ${jogo} (o adulto confirmou que jogou)` : "o portal, a vila em geral"}\n\n${t}${resumo ? `\n\nResumo das crianças (sem nomes):\n${resumo}` : ""}\n\n${pub}`;
  };
  q("#op-copiar").addEventListener("click", async () => {
    const m = montar(); if (!m) return;
    try { await navigator.clipboard.writeText(m); q("#op-msg").textContent = "Copiado. Cole numa conversa com a pessoa da família que cuida do portal."; }
    catch { q("#op-msg").textContent = "Não consegui copiar. Selecione o texto da mensagem e copie."; }
  });
  q("#op-enviar").addEventListener("click", async () => {
    const m = montar(); if (!m) return;
    if (!navigator.share) { q("#op-copiar").click(); return; }
    try { await navigator.share({ title: "Vila do Samuca: opinião", text: m }); q("#op-msg").textContent = "Pronto. Obrigado!"; } catch {}
  });
}

function telaCuidados() {
  palco.innerHTML = `
    <section class="jg cuidados">
      <div class="faixa" style="--cor-jogo:var(--verde);--cor-jogo-escura:var(--verde-escuro);--cor-jogo-profunda:var(--verde-profundo)">
        <span class="emblema">${S.retrato(56, "feliz")}</span><h1>Para pais e avós</h1></div>
      <p class="cuidados-intro">A Vila do Samuca é um portal de jogos de raciocínio feito pela família para os irmãos, netos, primos e amigos próximos:
        um lugar para as crianças brincarem, pensarem e aprenderem com segurança. Estes são os cuidados que guiam cada jogo,
        cada tela e cada som.</p>
      ${CUIDADOS.map((b) => `
        <section class="cuidados-bloco">
          <h2>${icone(b.icone, 24)} ${b.titulo}</h2>
          <ul>${b.itens.map((t) => `<li>${t}</li>`).join("")}</ul>
        </section>`).join("")}
      <p class="cuidados-intro">Os ajustes ficam no <a href="#/painel">Painel da família</a>, protegido pela senha da família.</p>
      ${formularioPais()}
      <a class="botao" href="#/">Voltar para a vila</a>
    </section>`;
  ligarFormularioPais();
  const intro = palco.querySelector(".cuidados-intro");
  intro.append(botaoOuvir(() => palco.querySelector(".cuidados").innerText.replace(/Voltar para a vila/g, ""), "Ouvir a página"));
}

// ---------------------------------------------------------------- Lojinha da Vila (só para adultos)
// Regras do dono (02/10/2026): o portal nunca cobra acesso nem vende nada a quem joga, e não faz nenhuma transação
// financeira. A lojinha só existe com um adulto logado (senha da família, ver "Adulto logado"), mostra imagem ou
// vídeo de promoção, e quem toca é levado para fora, ao site da loja parceira, onde compra. Sem script nem imagem de
// outros sites: as imagens e vídeos são arquivos do próprio portal. Os itens ficam em `lojinha-itens.js` (hoje vazio).
async function telaLojinha() {
  palco.innerHTML = `
    <section class="jg cuidados">
      <div class="faixa" style="--cor-jogo:var(--ouro);--cor-jogo-escura:#8a5a00;--cor-jogo-profunda:#5e3d00">
        <span class="emblema">${icone("loja", 34)}</span><h1>Lojinha da Vila</h1></div>
      <div id="lojinha-area"></div>
    </section>`;
  const area = palco.querySelector("#lojinha-area");
  const conteudo = async () => {
    liberarAdulto();
    let itens = [], operadora = null;
    try { ({ ITENS: itens, OPERADORA: operadora } = await import("./lojinha-itens.js")); } catch {}
    if (!location.hash.startsWith("#/lojinha")) return;
    const seguro = (u) => typeof u === "string" && /^https:\/\//.test(u);
    const vitrine = itens.filter((it) => seguro(it.link)).map((it) => `
      <article class="loja-item">
        <a class="loja-midia" href="${esc(it.link)}" target="_blank" rel="sponsored noopener noreferrer" aria-label="${esc(it.titulo)}, em ${esc(it.loja)} (abre o site da loja)">
          ${it.video ? `<video src="${esc(it.video)}" poster="${esc(it.imagem || "")}" preload="none" muted playsinline aria-label="${esc(it.alt || it.titulo)}"></video>`
            : `<img src="${esc(it.imagem)}" alt="${esc(it.alt || it.titulo)}" loading="lazy" referrerpolicy="no-referrer">`}</a>
        <p class="loja-nome">${esc(it.titulo)}</p>
        <p class="loja-aviso"><b>Publicidade.</b> Recebemos uma comissão se você comprar, sem custo a mais para você. A compra é feita no site de ${esc(it.loja)}, fora da Vila.</p>
        <a class="botao dourado" href="${esc(it.link)}" target="_blank" rel="sponsored noopener noreferrer">Ver em ${esc(it.loja)}</a>
      </article>`).join("");
    area.innerHTML = `
      <p class="cuidados-intro">Esta página é para adultos: pais, avós e professores. Os jogos nunca vendem nada, e quem joga nunca paga nada.</p>
      ${vitrine ? `<div class="loja-grade">${vitrine}</div>` : `<section class="cuidados-bloco"><h2>${icone("loja", 24)} Situação de hoje</h2><ul>
        <li><b>A lojinha ainda não abriu.</b> Não há promoções, nem links de lojas.</li>
        <li>Esta página não coleta nenhum dado e não carrega nada de outros sites.</li></ul></section>`}
      <section class="cuidados-bloco"><h2>Como a lojinha funciona</h2><ul>
        <li>Ela só aparece quando um adulto entra com a senha da família. Some em 5 minutos, quando uma criança escolhe o seu personagem e quando o app vai para o segundo plano.</li>
        <li>Nunca aparece dentro de um jogo, no mapa da vila, no fim de uma partida ou para uma criança.</li>
        <li>O portal não faz nenhuma venda nem pagamento. Mostra uma imagem ou um vídeo de promoção; se um adulto tocar, vai para o site da loja parceira, fora da Vila, e compra lá.</li>
        <li>Cada promoção avisa que o portal recebe uma comissão por indicação, sem custo a mais para quem compra.</li>
        <li>Os produtos são para adultos. Nada dirigido a criança.</li>
        <li>${operadora ? `Operada por ${esc(operadora.nome)}, CNPJ ${esc(operadora.cnpj)}.` : "A pessoa jurídica que opera a lojinha será informada aqui antes da abertura."}</li></ul></section>
      <section class="cuidados-bloco"><h2>Para onde vai o dinheiro</h2><ul>
        <li>A ideia é cobrir primeiro os custos do portal e da própria lojinha.</li>
        <li>O que sobrar seria usado em benefício dos alunos da Escola Municipal Dr. José de Abreu Santos, em itens indicados pelo corpo docente.</li>
        <li><b>Isso ainda é uma intenção:</b> falta combinar com a escola e a prefeitura, e só será dito como certo aqui depois de combinado.</li></ul></section>
      <div class="acoes"><button type="button" class="botao" id="sair-adulto">Sair do modo adulto</button><a class="botao" href="#/">Voltar para a vila</a></div>`;
    area.querySelector(".cuidados-intro").append(botaoOuvir(() => area.innerText.replace(/Sair do modo adulto|Voltar para a vila/g, ""), "Ouvir a página"));
    area.querySelector("#sair-adulto").addEventListener("click", () => { encerrarAdulto(); location.hash = "#/"; rota(); });
  };
  if (!P.temPainel()) {
    area.innerHTML = `<p class="cuidados-texto">Esta página é para adultos. Crie primeiro a senha da família no <a href="#/painel">Painel da família</a>.</p>
      <a class="botao" href="#/">Voltar para a vila</a>`;
    return;
  }
  if (adultoAtivo()) return conteudo();
  // Sem adulto logado: pede a senha da família (a mesma do painel).
  pedirSenhaFamilia(area, "Página para adultos. Digite a senha da família.").then((ok) => { if (ok && location.hash.startsWith("#/lojinha")) conteudo(); });
}

// ---------------------------------------------------------------- Diário de bordo e estante
// O diário REGISTRA o que a criança fez: uma página por jogo resolvido, com o resumo, uma
// curiosidade verdadeira e carimbos para enfeitar. Nada trancado, nenhuma contagem do que falta.
const dataCurta = (t) => new Date(t).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

function telaDiario(aba = "paginas") {
  const j = jogadorAtivo();
  if (!j || j.id === "visitante") { location.hash = "#/"; return; }
  palco.innerHTML = `
    <section class="jg">
      <div class="faixa" style="--cor-jogo:var(--laranja);--cor-jogo-escura:var(--laranja-escuro);--cor-jogo-profunda:var(--laranja-profundo)"><span class="emblema">${arte("diario", 54)}</span><h1>Diário de ${esc(j.apelido)}</h1></div>
      <div class="abas" role="tablist">
        <a role="tab" class="aba" href="#/diario" aria-selected="${aba === "paginas"}">Páginas</a>
        <a role="tab" class="aba" href="#/estante" aria-selected="${aba === "estante"}">Conquistas</a>
      </div>
      <div id="conteudo-diario"></div>
    </section>`;
  const caixa = palco.querySelector("#conteudo-diario");
  if (aba === "estante") return desenharEstante(caixa, j);
  const pags = P.paginas(j.id);
  const lista = JOGOS.filter((g) => pags[g.id]).sort((a, b) => pags[b.id].ultima - pags[a.id].ultima);
  if (!lista.length) {
    caixa.innerHTML = `<p class="sala-resumo">Seu diário começa quando você resolver um desafio. Cada jogo ganha uma página, com o que você fez e uma curiosidade.</p>`;
    return;
  }
  for (const g of lista) caixa.appendChild(paginaDoDiario(j, g, pags[g.id]));
}

function paginaDoDiario(j, g, pag) {
  const art = document.createElement("article");
  art.className = "pagina";
  art.innerHTML = `
    <header class="pagina-topo">${arte(g.arte, 44)}<div><h2>${g.nome}</h2>
      <small>Primeira vez: ${dataCurta(pag.primeira)} · última: ${dataCurta(pag.ultima)} · ${pag.vezes} ${pag.vezes > 1 ? "vezes" : "vez"}</small></div></header>
    <p class="pagina-resumo">${esc(pag.resumo || "")}</p>
    ${g.curiosidade ? `<p class="pagina-curiosidade"><b>Você sabia?</b> <span>${g.curiosidade}</span></p>` : ""}
    <div class="pagina-carimbos" aria-label="Espaço para carimbos"></div>
    <div class="bandeja" role="group" aria-label="Carimbos">${CARIMBOS.map((c) => `<button type="button" class="carimbo-botao" data-c="${c}" aria-label="Pôr carimbo: ${NOME_DESENHO[c] || c}">${arte(c, 32)}</button>`).join("")}</div>
    <p class="nota">Toque num carimbo para pôr na página. Arraste para mudar de lugar. Para tirar, toque nele e depois em "Tirar este carimbo" (ou arraste para fora).</p>
    <button type="button" class="botao" data-tirar hidden>Tirar este carimbo</button>`;
  const cur = art.querySelector(".pagina-curiosidade");
  cur?.append(botaoOuvir(() => "Você sabia? " + cur.querySelector("span").textContent, "Ouvir"));
  const area = art.querySelector(".pagina-carimbos");
  let carimbos = [...(pag.carimbos || [])];
  let escolhido = null;
  const salvar = () => P.gravarCarimbos(j.id, g.id, carimbos);
  const tirar = art.querySelector("[data-tirar]");
  const desenhar = (focar = null) => {
    area.innerHTML = carimbos.map((c, i) => `<span class="carimbo ${i === escolhido ? "escolhido" : ""}" data-i="${i}" tabindex="0" role="button"
      aria-label="Carimbo ${NOME_DESENHO[c.nome] || c.nome}. Setas mudam de lugar, Delete tira." style="left:${c.x}%;top:${c.y}%;rotate:${c.r}deg">${arte(c.nome, 44)}</span>`).join("");
    tirar.hidden = escolhido === null;
    if (focar !== null) area.querySelector(`[data-i="${focar}"]`)?.focus();
  };
  const tirarCarimbo = (i) => { carimbos.splice(i, 1); escolhido = null; som("solta"); salvar(); desenhar(); };
  tirar.addEventListener("click", () => { if (escolhido !== null) tirarCarimbo(escolhido); });
  area.addEventListener("keydown", (e) => {
    const el = e.target.closest(".carimbo");
    if (!el) return;
    const i = Number(el.dataset.i), passo = 5;
    const mov = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
    if (mov) {
      e.preventDefault();
      carimbos[i] = { ...carimbos[i], x: Math.max(0, Math.min(100, carimbos[i].x + mov[0])), y: Math.max(0, Math.min(100, carimbos[i].y + mov[1])) };
      salvar(); desenhar(i);
    } else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); tirarCarimbo(i); }
  });
  art.querySelector(".bandeja").addEventListener("click", (e) => {
    const b = e.target.closest(".carimbo-botao");
    if (!b || carimbos.length >= 12) return;
    som("toque");
    const n = carimbos.length;
    carimbos.push({ nome: b.dataset.c, x: 12 + ((n * 23) % 76), y: 20 + ((n * 37) % 60), r: ((n * 17) % 30) - 15 });
    salvar(); desenhar();
  });
  // Arrastar com o dedo (pointer events). Soltar fora da área tira o carimbo.
  area.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(".carimbo");
    if (!el) return;
    e.preventDefault();
    const i = Number(el.dataset.i);
    el.setPointerCapture(e.pointerId);
    const caixaArea = area.getBoundingClientRect();
    const inicio = [e.clientX, e.clientY];
    const mover = (ev) => {
      el.style.left = `${((ev.clientX - caixaArea.left) / caixaArea.width) * 100}%`;
      el.style.top = `${((ev.clientY - caixaArea.top) / caixaArea.height) * 100}%`;
    };
    const soltar = (ev) => {
      el.removeEventListener("pointermove", mover);
      // Toque sem arrastar: escolhe o carimbo (aparece "Tirar este carimbo"). Não depende de arrastar.
      if (Math.hypot(ev.clientX - inicio[0], ev.clientY - inicio[1]) < 6) { escolhido = escolhido === i ? null : i; som("toque"); desenhar(); return; }
      const x = ((ev.clientX - caixaArea.left) / caixaArea.width) * 100, y = ((ev.clientY - caixaArea.top) / caixaArea.height) * 100;
      if (x < -5 || x > 105 || y < -10 || y > 110) { carimbos.splice(i, 1); som("solta"); }
      else { carimbos[i] = { ...carimbos[i], x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }; }
      salvar(); desenhar();
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerup", soltar, { once: true });
  });
  desenhar();
  return art;
}

function desenharEstante(caixa, j) {
  const minhas = P.conquistas(j.id);
  const jogoDe = (id) => JOGOS.find((g) => g.id === id);
  caixa.innerHTML = `
      <p class="sala-resumo">Cada conquista mostra algo que você aprendeu a fazer. As que faltam dizem como chegar lá.</p>
      <div class="estante">
        ${CONQUISTAS.filter((c) => jogoDe(c.jogo)?.pronto).map((c) => `
          <div class="trofeu ${minhas[c.id] ? "tem" : ""}">
            <span class="trofeu-arte">${arte(minhas[c.id] ? "trofeu" : jogoDe(c.jogo).arte, 56)}</span>
            <strong>${c.nome}</strong>
            <small>${minhas[c.id] ? jogoDe(c.jogo).nome : c.como}</small>
          </div>`).join("")}
      </div>`;
}

// ---------------------------------------------------------------- Limite em dias úteis
// De segunda a sexta, cada criança tem um tempo máximo por dia (padrão 1 hora). Conta o tempo
// com o app na tela e alguém entrado. Quando acaba, a partida em curso termina normalmente e
// então o Samuca vai dormir. Sábado, domingo e dias liberados no painel ficam sem limite.
// Hoje fica no aparelho; com o Firebase, o tempo passa a somar entre os celulares.
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const diaUtil = () => { const d = new Date().getDay(); return d >= 1 && d <= 5; };
const minutosLimite = () => ler("limiteUteisMin", 60);
const liberadoHoje = () => ler("liberado", "") === hoje();
const limiteDeHoje = () => (diaUtil() && !liberadoHoje() && minutosLimite() ? minutosLimite() * 60000 : null);
const usoHoje = (id) => ler(`uso:${id}:${hoje()}`, 0);
const esgotado = (id) => { const l = limiteDeHoje(); return !!id && l !== null && usoHoje(id) >= l; };
let marcaUso = Date.now();
const avisados = new Set(); // "criança:dia" que já ouviram o aviso dos 10 minutos
function contarUso() {
  const agora = Date.now(), passou = agora - marcaUso;
  marcaUso = agora;
  const id = P.ativaId();
  if (!id || document.hidden || passou > 60000) return;
  guardar(`uso:${id}:${hoje()}`, usoHoje(id) + passou);
}
setInterval(contarUso, 15000);
document.addEventListener("visibilitychange", () => { if (document.hidden) contarUso(); else marcaUso = Date.now(); });

// Chamado no fim de cada partida: avisa quando faltam 10 minutos e manda dormir quando acaba.
function conferirLimite(ctx) {
  contarUso();
  const id = P.ativaId(), limite = limiteDeHoje();
  if (!limite) return false;
  if (esgotado(id)) {
    setTimeout(() => {
      if (!ctx.samuca?.isConnected) return;
      ctx.fala("dormir");
      const cartao = document.createElement("div");
      cartao.className = "pausa-card";
      cartao.innerHTML = `<p>O tempo de jogo de hoje acabou. Amanhã a vila abre de novo!</p>
        <button type="button" class="botao principal" data-dormir>Boa noite, Samuca</button>`;
      cartao.querySelector("[data-dormir]").addEventListener("click", () => { location.hash = "#/dormindo"; });
      ctx.samuca.after(cartao);
      cartao.querySelector(".botao")?.focus({ preventScroll: true }); // teclado e leitor de tela seguem para o cartão
      cartao.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 2200);
    return true;
  }
  if (!avisados.has(`${id}:${hoje()}`) && limite - usoHoje(id) <= 10 * 60000) {
    avisados.add(`${id}:${hoje()}`);
    setTimeout(() => ctx.fala("quase"), 2200);
  }
  return false; // o aviso é só a fala do Samuca: o cartão de fim (ou a pausa) continua aparecendo
}

function telaDormindo() {
  const sexta = new Date().getDay() === 5;
  palco.innerHTML = `
    <section class="descanso">
      ${S.retrato(150, "dormindo")}
      <h1 class="titulo-jogo">O Samuca foi dormir</h1>
      <p id="dormindo-texto">Em dia de escola, o tempo de jogo é curtinho. Hoje já deu!
        ${sexta ? "Amanhã é sábado: a vila fica aberta o dia todo." : "Amanhã a vila abre de novo."}</p>
      <button type="button" class="botao" id="trocar">Trocar de jogador</button>
    </section>`;
  const t = palco.querySelector("#dormindo-texto");
  t.append(botaoOuvir(() => "O Samuca foi dormir. " + t.textContent, "Ouvir"));
  palco.querySelector("#trocar").addEventListener("click", () => { P.sair(); location.hash = "#/"; rota(); });
}

// ---------------------------------------------------------------- Fim de partida
// Um ponto de parada claro: duas opções do mesmo tamanho e uma ideia para brincar fora da tela.
// Nada começa sozinho. Só aparece se o limite do dia e a pausa sugerida não tiverem falado antes.
// Opinião da criança sobre o jogo: opcional, só escolhas (nada de texto livre, para ela não escrever nome nem dado),
// nunca trava o "Jogar de novo", não muda o nível nem dá prêmio, e só os adultos veem o resumo no painel.
const CARINHAS = {
  gostei: `<circle cx="12" cy="12" r="10"/><path d="M7.5 14c1 2.2 2.6 3.2 4.5 3.2s3.5-1 4.5-3.2"/><circle cx="8.6" cy="9.5" r=".9"/><circle cx="15.4" cy="9.5" r=".9"/>`,
  meio: `<circle cx="12" cy="12" r="10"/><path d="M8 15.5h8"/><circle cx="8.6" cy="9.5" r=".9"/><circle cx="15.4" cy="9.5" r=".9"/>`,
  nao: `<circle cx="12" cy="12" r="10"/><path d="M8 16c1-1.2 2.4-1.8 4-1.8s3 .6 4 1.8"/><circle cx="8.6" cy="9.5" r=".9"/><circle cx="15.4" cy="9.5" r=".9"/>`,
};
const ROTULO_GOSTO = { gostei: "Gostei", meio: "Mais ou menos", nao: "Não gostei" };
const ROTULO_NIVEL = { facil: "Fácil", certo: "No ponto certo", dificil: "Difícil" };
function blocoOpiniao(id, jogo) {
  const atual = P.opinioes(id)[jogo] || {};
  const botao = (campo, v, rotulo, desenho) => `<button type="button" class="opiniao-botao" data-campo="${campo}" data-v="${v}" aria-pressed="${atual[campo] === v}">
    ${desenho ? `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${desenho}</svg>` : ""}<span>${rotulo}</span></button>`;
  return `<div class="fim-opiniao" role="group" aria-label="Sua opinião sobre este jogo">
    <p class="fim-opiniao-titulo"><b>Como foi este jogo?</b> <small>Se quiser, toque. Só os adultos da família veem.</small></p>
    <div class="opiniao-linha">${P.GOSTOS.map((v) => botao("gosto", v, ROTULO_GOSTO[v], CARINHAS[v])).join("")}</div>
    <p class="fim-opiniao-titulo"><b>E a dificuldade?</b></p>
    <div class="opiniao-linha">${P.NIVEIS.map((v) => botao("nivel", v, ROTULO_NIVEL[v])).join("")}</div>
    <p class="nota" role="status" data-opiniao-msg></p></div>`;
}
function ligarOpiniao(cartao, id, jogo) {
  const caixa = cartao.querySelector(".fim-opiniao");
  if (!caixa) return;
  caixa.querySelector(".fim-opiniao-titulo").append(botaoOuvir(() => "Como foi este jogo? Gostei, mais ou menos, ou não gostei. E a dificuldade? Fácil, no ponto certo ou difícil. Se quiser, toque. Só os adultos da família veem.", "Ouvir"));
  caixa.querySelectorAll(".opiniao-botao").forEach((b) => b.addEventListener("click", () => {
    som("toque");
    P.opinar(id, jogo, b.dataset.campo, b.dataset.v);
    caixa.querySelectorAll(`[data-campo="${b.dataset.campo}"]`).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    caixa.querySelector("[data-opiniao-msg]").textContent = "Obrigado! O Samuca anotou.";
  }));
}

function mostrarFim(ctx) {
  setTimeout(() => {
    if (!ctx.samuca?.isConnected || palco.querySelector(".pausa-card, .fim-card")) return;
    const jogo = JOGOS.find((g) => g.id === ctx.jogo);
    // Convite para um jogo parecido (só um convite: o outro jogo já está aberto no mapa, nada é liberado).
    const proximo = jogo?.proximo && JOGOS.find((g) => g.id === jogo.proximo && g.pronto);
    const cartao = document.createElement("div");
    cartao.className = "fim-card";
    cartao.innerHTML = `
      <p class="fim-titulo">Fim de partida</p>
      ${jogo?.curiosidade ? `<p class="fim-sabia"><b>Você sabia?</b> <span>${jogo.curiosidade}</span></p>` : ""}
      ${jogo?.foraDaTela ? `<p class="fim-fora"><b>Brinque fora da tela:</b> <span>${jogo.foraDaTela}</span></p>` : ""}
      ${proximo ? `<a class="botao" href="#/jogo/${proximo.id}">${arte(proximo.arte, 28)} ${jogo.proximoConvite}</a>` : ""}
      ${ctx.replay ? `<button type="button" class="botao dourado" data-mostrar>Mostrar como eu fiz</button>` : ""}
      <div class="acoes"><button type="button" class="botao principal" data-denovo>Jogar de novo</button>
      <a class="botao" href="#/">Voltar para a vila</a></div>
      ${P.crianca(P.ativaId()) ? blocoOpiniao(P.ativaId(), ctx.jogo) : ""}`;
    cartao.querySelector("[data-denovo]").addEventListener("click", () => { som("solta"); ctx.reiniciar(); });
    cartao.querySelector("[data-mostrar]")?.addEventListener("click", async (e) => {
      const botao = e.currentTarget; // depois do await, e.currentTarget já não existe
      botao.disabled = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
      await ctx.replay();
      botao.disabled = false;
    });
    const sabia = cartao.querySelector(".fim-sabia");
    sabia?.append(botaoOuvir(() => "Você sabia? " + sabia.querySelector("span").textContent, "Ouvir"));
    const fora = cartao.querySelector(".fim-fora");
    fora?.append(botaoOuvir(() => "Brinque fora da tela. " + fora.querySelector("span").textContent, "Ouvir"));
    ligarOpiniao(cartao, P.ativaId(), ctx.jogo);
    ctx.samuca.after(cartao);
    cartao.querySelector(".botao")?.focus({ preventScroll: true }); // teclado e leitor de tela seguem para o cartão
  }, 1800);
}

// ---------------------------------------------------------------- Fases guiadas
function fimDeFaseGuiada(ctx) {
  setTimeout(() => {
    if (!ctx.samuca?.isConnected) return;
    const ultima = ctx.tutorial >= 3;
    if (ultima) guardar(`guiadas:${ctx.jogadores[0].id}:${ctx.jogo}`, true);
    ctx.dizer(ultima ? "Pronto! Você já sabe jogar. Agora é com você." : `Muito bem! Fase guiada ${ctx.tutorial} de 3 concluída.`, "feliz");
    const cartao = document.createElement("div");
    cartao.className = "fim-card";
    cartao.innerHTML = `<p class="fim-titulo">${ultima ? "Aprendeu!" : `Fase guiada ${ctx.tutorial} de 3`}</p>
      <button type="button" class="botao principal" data-seguir>${ultima ? "Jogar de verdade" : "Próxima fase guiada"}</button>`;
    cartao.querySelector("[data-seguir]").addEventListener("click", () => {
      som("solta");
      ultima ? ctx.reiniciar() : ctx.iniciarTutorial(ctx.tutorial + 1);
    });
    ctx.samuca.after(cartao);
    cartao.querySelector(".botao")?.focus({ preventScroll: true }); // teclado e leitor de tela seguem para o cartão
  }, 1500);
}

// ---------------------------------------------------------------- Pausa sugerida
// Conta só o tempo com o app na tela. A sugestão aparece apenas no FIM de uma partida,
// nunca interrompendo (regra: nada acontece sem a criança agir). O painel ajusta o limite.
let inicioVisivel = Date.now(), tempoAcumulado = 0, ultimaPausa = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) tempoAcumulado += Date.now() - inicioVisivel;
  else inicioVisivel = Date.now();
});
const tempoDeTela = () => tempoAcumulado + (document.hidden ? 0 : Date.now() - inicioVisivel);
const minutosParaPausa = () => ler("pausaMin", 30);

function talvezSugerirPausa(ctx) {
  const limite = minutosParaPausa();
  if (!limite || tempoDeTela() - ultimaPausa < limite * 60000) return false;
  ultimaPausa = tempoDeTela();
  setTimeout(() => {
    if (!ctx.samuca?.isConnected) return;
    ctx.fala("pausa");
    const cartao = document.createElement("div");
    cartao.className = "pausa-card";
    cartao.innerHTML = `<p>Seus olhos e sua cabeça trabalharam bastante. Uma pausa ajuda a pensar melhor depois.</p>
      <div class="acoes"><button type="button" class="botao principal" data-descansar>Vou descansar</button>
      <button type="button" class="botao" data-mais>Continuar jogando</button></div>`;
    cartao.querySelector("[data-descansar]").addEventListener("click", () => { location.hash = "#/descanso"; });
    cartao.querySelector("[data-mais]").addEventListener("click", () => cartao.remove());
    ctx.samuca.after(cartao);
    cartao.querySelector(".botao")?.focus({ preventScroll: true }); // teclado e leitor de tela seguem para o cartão
    cartao.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 2200);
  return true;
}

function telaDescanso() {
  palco.innerHTML = `
    <section class="descanso">
      ${S.retrato(140, "sonolento")}
      <h1 class="titulo-jogo">Hora de uma pausa</h1>
      <p id="descanso-texto">Beba água, olhe pela janela, estique o corpo. A vila fica aqui esperando por você.</p>
      <a class="botao" href="#/">Voltar para a vila</a>
    </section>`;
  const t = palco.querySelector("#descanso-texto");
  t.append(botaoOuvir(() => "Hora de uma pausa. " + t.textContent, "Ouvir"));
}

// ---------------------------------------------------------------- Sala do jogo
function avisoConquista(texto) {
  const el = document.createElement("div");
  el.className = "aviso-conquista";
  el.innerHTML = `${arte("trofeu", 40)}<span>${esc(texto)}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("sai"), 3200);
  setTimeout(() => el.remove(), 3800);
}

function contexto(jogo, jogadores, extra = {}) {
  const [a, b] = jogadores;
  const ctx = {
    jogo: jogo.id, jogadores, comeca: 0, dicas: [0, 0], ...extra,
    sugerir: (opcoes, dificuldade) => N.sugerir(a.id, jogo.id, opcoes, dificuldade),
    samuca: null,
    fala(tipo) { if (ctx.samuca) S.dizer(ctx.samuca, tipo, a.apelido); },
    registrarSolo(dificuldade, placar, resumo) {
      if (ctx.tutorial) return fimDeFaseGuiada(ctx);
      guardar(`jogou:${jogo.id}`, Date.now());
      N.atualizar(a.id, jogo.id, dificuldade, placar);
      if (a.id !== "visitante") P.anotarPagina(a.id, jogo.id, resumo || "Resolveu o desafio.");
      conferirLimite(ctx) || talvezSugerirPausa(ctx) || mostrarFim(ctx);
    },
    // vencedor: 0, 1 ou null (empate)
    registrarDuelo(vencedor) {
      if (ctx.tutorial) return fimDeFaseGuiada(ctx);
      guardar(`jogou:${jogo.id}`, Date.now());
      // No diário de cada criança: contra quem jogou e como foi (nunca "perdeu"; "jogou com").
      jogadores.forEach((x, k) => {
        if (x.samuca || x.id === "visitante") return;
        const outro = jogadores[1 - k].apelido;
        P.anotarPagina(x.id, jogo.id, vencedor === null ? `Empatou com ${outro}.` : vencedor === k ? `Ganhou de ${outro}.` : `Jogou com ${outro}.`);
      });
      conferirLimite(ctx) || talvezSugerirPausa(ctx) || mostrarFim(ctx);
      const placarA = vencedor === null ? 0.5 : vencedor === 0 ? 1 : 0;
      if (b.samuca) { N.atualizar(a.id, jogo.id, b.nota, placarA); return; }
      const bonus = (k) => N.bonusVantagem(ctx.dicas[k], ctx.comeca === k);
      const na = N.nota(a.id, jogo.id) + bonus(0), nb = N.nota(b.id, jogo.id) + bonus(1);
      N.atualizar(a.id, jogo.id, nb - bonus(0), placarA);
      N.atualizar(b.id, jogo.id, na - bonus(1), 1 - placarA);
    },
    // k: índice do jogador que conquistou (0 por padrão)
    conquistar(id, k = 0) {
      const quemFoi = jogadores[k];
      if (!quemFoi || quemFoi.samuca || quemFoi.id === "visitante") return;
      if (P.conquistar(quemFoi.id, id)) {
        const c = CONQUISTAS.find((x) => x.id === id);
        setTimeout(() => { avisoConquista(`${quemFoi.apelido}: ${c?.nome || "nova conquista"}!`); ctx.fala("conquista"); }, 1400);
      }
    },
    primeiraVez: () => a.id !== "visitante" && P.primeiraVez(a.id, jogo.id),
    limiteAcabou: () => { contarUso(); return esgotado(a.id); },
    dormir: () => { location.hash = "#/dormindo"; },
    guiadasFeitas: () => ler(`guiadas:${a.id}:${jogo.id}`, false),
    treina: jogo.treina,
    segredo: jogo.segredo,
    historia: jogo.historia,
    tutorial: extra.tutorial || 0,
    dizer(texto, humor) { if (ctx.samuca) S.dizerTexto(ctx.samuca, texto, humor); },
    reiniciar: () => iniciarJogo(jogo, contexto(jogo, jogadores, { ...extra, tutorial: 0 })),
    iniciarTutorial: (fase = 1) => iniciarJogo(jogo, contexto(jogo, jogadores, { ...extra, tutorial: fase })),
    replay: null,
    definirReplay(fn) { ctx.replay = fn; },
  };
  return ctx;
}

async function iniciarJogo(jogo, ctx) {
  // Recomeçar, Jogar de novo e as fases guiadas passam por aqui: com o tempo do dia acabado,
  // nenhuma partida nova começa.
  if (esgotado(P.ativaId())) { location.hash = "#/dormindo"; return; }
  const endereco = location.hash;
  let modulo;
  try {
    modulo = await import(`./jogos/${jogo.id}/jogo.js`);
    // Espera o estilo do jogo (no máximo 3 s), para não mostrar o tabuleiro sem forma.
    await Promise.race([carregarEstilo(new URL(`./jogos/${jogo.id}/jogo.css`, location.href)), new Promise((r) => setTimeout(r, 3000))]);
  }
  catch {
    if (location.hash !== endereco) return;
    palco.innerHTML = `<section class="descanso">${S.retrato(120, "pensando")}
      <h1 class="titulo-jogo">Esse jogo não abriu</h1>
      <p>${jogo.offline === false
        ? "Este jogo precisa de internet. Ligue o Wi-Fi e tente de novo."
        : "Ele ainda não foi guardado neste celular. Ligue a internet, abra o jogo uma vez e depois ele funciona sem internet."}</p>
      <a class="botao" href="#/">Voltar para a vila</a></section>`;
    return;
  }
  // A criança pode ter voltado enquanto o jogo carregava: não monta por cima de outra tela.
  if (location.hash !== endereco) return;
  if (desmontar) { desmontar(); desmontar = null; }
  palco.innerHTML = "";
  desmontar = modulo.montar(palco, ctx) || null;
  ctx.samuca = S.balao(ctx.tutorial ? "Faça a primeira jogada. Se quiser ajuda, toque em Dica. Depois, eu mostro cada passo com um brilho dourado." : (jogo.objetivo || S.fala("oi", ctx.jogadores[0].apelido)), "feliz");
  palco.querySelector(".faixa")?.after(ctx.samuca);
  // Fase guiada: barra com o progresso (1, 2, 3) e um jeito claro de sair para o jogo normal.
  if (ctx.tutorial) {
    const barra = document.createElement("div");
    barra.className = "guiada-barra";
    barra.innerHTML = `<span class="guiada-rotulo">Fase guiada <b>${ctx.tutorial}</b> de 3</span>
      <span class="guiada-pontos" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${n < ctx.tutorial ? "feito" : n === ctx.tutorial ? "agora" : ""}"></i>`).join("")}</span>
      <button type="button" class="botao" data-sair>Sair</button>`;
    barra.querySelector("[data-sair]").addEventListener("click", () => { som("solta"); ctx.reiniciar(); });
    palco.querySelector(".faixa")?.after(barra);
  }
  window.scrollTo(0, 0);
}

function sala(jogo) {
  const eu = jogadorAtivo();
  palco.innerHTML = `
    <section class="jg">
      <div class="faixa"><span class="emblema" aria-hidden="true">${arte(jogo.arte, 54)}</span><h1>${jogo.nome}</h1></div>
      <p class="sala-resumo">${jogo.resumo}</p>
      ${jogo.treina ? `<p class="treina"><b>O que você treina:</b> ${jogo.treina}</p>` : ""}
      <div id="opcoes" class="sala-opcoes"></div>
      <div id="pin-area"></div>
    </section>`;
  if (jogo.tipo !== "duelo") {
    iniciarJogo(jogo, contexto(jogo, [eu]));
    return;
  }
  const notaS = N.notaSamuca(eu.id, jogo.id);
  const samuca = { id: "samuca", apelido: S.NOME, avatar: "🦉", samuca: true, nota: notaS, forca: N.forcaSamuca(notaS) };
  palco.querySelector("#opcoes").innerHTML = `
    <button type="button" class="opcao opcao-samuca" id="contra-samuca">
      ${S.retrato(64, "feliz")}<span><strong>Contra o ${S.NOME}</strong><small>A coruja joga do seu jeito.</small></span>
    </button>
    <p class="rotulo">Com outra criança, neste celular</p>
    <div class="avatares" id="outros"></div>
    <p class="nota">Jogar cada um no seu celular ainda não está disponível. Por enquanto, joguem juntos neste celular.</p>`;
  palco.querySelector("#contra-samuca").addEventListener("click", () => {
    som("toque");
    iniciarJogo(jogo, contexto(jogo, [eu, samuca], { comeca: Math.random() < 0.5 ? 0 : 1 }));
  });
  const outros = P.criancas().filter((c) => c.id !== eu.id);
  const caixa = palco.querySelector("#outros");
  if (!outros.length) caixa.innerHTML = `<p class="vazio">Quando outra criança criar o jogador dela, ela aparece aqui.</p>`;
  for (const c of outros) {
    const v = eu.id === "visitante" ? { equilibrada: true, dicas: [0, 0], comeca: null } : N.vantagem(eu.id, c.id, jogo.id);
    const quemAtras = v.atras === 0 ? eu : c;
    const texto = v.equilibrada ? "Partida equilibrada"
      : `${esc(quemAtras.apelido)} começa${v.dicas[v.atras] ? ` e ganha ${v.dicas[v.atras]} ${v.dicas[v.atras] > 1 ? "dicas" : "dica"}` : ""}`;
    const b = document.createElement("button");
    b.type = "button"; b.className = "avatar-cartao";
    b.innerHTML = `<span class="avatar">${avatar(c.avatar, 56)}</span><strong>${esc(c.apelido)}</strong><small>${texto}</small>`;
    b.addEventListener("click", async () => {
      som("toque");
      caixa.querySelectorAll(".avatar-cartao").forEach((x) => x.classList.toggle("escolhido", x === b));
      const ok = await pedirPin(palco.querySelector("#pin-area"), c, `${esc(c.apelido)}, digite o seu segredo`);
      if (!ok) return;
      const comeca = v.comeca ?? (Math.random() < 0.5 ? 0 : 1);
      iniciarJogo(jogo, contexto(jogo, [eu, c], { comeca, dicas: v.dicas }));
    });
    caixa.appendChild(b);
  }
}

// ---------------------------------------------------------------- Painel do avô
function telaPainel() {
  palco.innerHTML = `
    <section class="jg">
      <div class="faixa" style="--cor-jogo:var(--linha);--cor-jogo-escura:var(--cartao-2);--cor-jogo-profunda:var(--cartao)"><span class="emblema">${icone("ajustes", 34)}</span><h1>Painel da família</h1></div>
      <div id="corpo" class="painel-bloco"></div>
    </section>`;
  const corpo = palco.querySelector("#corpo");
  const pedirSenha = (criar) => {
    corpo.innerHTML = `
      <label class="rotulo" for="senha">${criar ? "Crie a senha do painel (só para adultos)" : "Senha do painel"}</label>
      <input id="senha" class="campo" type="password" inputmode="numeric" autocomplete="off">
      ${criar ? `<label class="rotulo" for="senha2">Repita a senha</label><input id="senha2" class="campo" type="password" inputmode="numeric" autocomplete="off">` : ""}
      <button type="button" class="botao principal" id="ok">Entrar</button>
      <p class="aviso erro" id="erro" hidden></p>`;
    corpo.querySelector("#ok").addEventListener("click", async () => {
      const s = corpo.querySelector("#senha").value, erro = corpo.querySelector("#erro");
      if (criar) {
        if (s.length < 4) { erro.hidden = false; erro.textContent = "Use pelo menos 4 caracteres."; return; }
        if (s !== corpo.querySelector("#senha2").value) { erro.hidden = false; erro.textContent = "As duas senhas não batem."; return; }
        await P.definirSenhaPainel(s); painelAberto();
      } else if (await P.conferirSenhaPainel(s)) painelAberto();
      else { erro.hidden = false; erro.textContent = "Senha errada."; }
    });
  };
  const painelAberto = () => {
    const jogos = JOGOS.filter((g) => g.pronto);
    liberarAdulto();
    corpo.innerHTML = `
      <a class="botao dourado painel-loja" href="#/lojinha">${icone("loja", 24)} Lojinha da Vila</a>
      <p class="nota">Os números abaixo são o nível de cada criança em cada jogo (600 começando, 1000 firme, 1400 craque).
      As crianças não veem esses números.</p>
      <div class="painel-bloco"><span class="rotulo">Tempo máximo por dia, de segunda a sexta</span><div id="limite-min"></div>
        <p class="nota">Sábado e domingo ficam livres. Quando acaba, a partida em curso termina e o Samuca vai dormir.</p>
        <button type="button" class="botao" id="liberar">${liberadoHoje() ? "Hoje está liberado" : "Liberar hoje (feriado, férias)"}</button></div>
      <div class="painel-bloco"><span class="rotulo">Sugerir uma pausa depois de</span><div id="pausa-min"></div>
        <p class="nota">O Samuca só sugere no fim de uma partida, nunca no meio.</p></div>
      <div class="painel-bloco"><span class="rotulo">Modo leve neste celular</span><div id="modo-leve"></div>
        <p class="nota">Desliga transições, confete e sombras para celulares antigos. "Automático" liga sozinho em aparelho fraco.</p></div>
      <div id="criancas" class="painel-lista"></div>
      <details class="regras"><summary>O que as crianças acharam dos jogos</summary>
        <div id="opinioes">${resumoOpinioes().html}</div>
        <p class="nota">Cada criança responde, se quiser, no fim da partida, só escolhendo (sem escrever). Isso fica só neste celular e não muda o nível dela.
        Para mandar a sua opinião, ou este resumo sem nomes, use a página <a href="#/cuidados">Para pais e avós</a>.</p>
      </details>
      <details class="regras"><summary>Cópia de segurança</summary>
        <p class="nota">Copie este texto e guarde. Para restaurar, cole-o de volta e toque em Restaurar.</p>
        <textarea id="backup" class="campo" rows="5"></textarea>
        <div class="acoes"><button type="button" class="botao" id="copiar">Copiar</button><button type="button" class="botao" id="restaurar">Restaurar</button></div>
        <p class="nota" id="backup-msg" role="status"></p>
      </details>`;
    const desenhar = () => {
      const lista = corpo.querySelector("#criancas");
      const cs = P.criancas();
      lista.innerHTML = cs.length ? "" : `<p class="vazio">Nenhuma criança cadastrada ainda.</p>`;
      for (const c of cs) {
        const bloco = document.createElement("div");
        bloco.className = "painel-crianca";
        bloco.innerHTML = `
          <div class="painel-topo">${avatar(c.avatar, 40)}<strong>${esc(c.apelido)}</strong><small>${c.idade} anos · ${c.pinHash ? "segredo ativo" : "vai criar segredo novo"} · ${Object.keys(c.conquistas || {}).length} conquistas · hoje: ${Math.round(usoHoje(c.id) / 60000)} min</small></div>
          <div class="painel-niveis">${jogos.map((g) => `
            <div title="${g.treina || ""}"><span class="painel-jogo">${arte(g.arte, 24)} ${g.nome}</span>
              <span class="ajuste"><button type="button" data-j="${g.id}" data-d="-100" aria-label="Baixar nível em ${g.nome}">−</button>
              <b>${N.nota(c.id, g.id)}</b><small>${N.partidas(c.id, g.id)} partidas</small>
              <button type="button" data-j="${g.id}" data-d="100" aria-label="Subir nível em ${g.nome}">+</button></span></div>`).join("")}</div>
          <div class="painel-prefs">${[["som", "Som"], ["vibrar", "Vibração"], ["musica", "Música"], ["lento", "Animações lentas"], ["contraste", "Alto contraste"], ["letra", "Letra fácil de ler"], ["calma", "Vila calma"]].map(([k, r]) =>
            `<button type="button" class="pref" data-pref="${k}" aria-pressed="${P.preferencias(c.id)[k]}">${r}</button>`).join("")}</div>
          <div class="acoes">
            <button type="button" class="botao" data-acao="pin">Zerar segredo</button>
            <button type="button" class="botao" data-acao="remover">Remover</button>
          </div>`;
        bloco.addEventListener("click", (e) => {
          const t = e.target.closest("button");
          if (!t) return;
          if (t.dataset.pref) {
            P.gravarPreferencia(c.id, t.dataset.pref, !P.preferencias(c.id)[t.dataset.pref]);
            if (c.id === P.ativaId()) aplicarPreferencias();
            desenhar(); return;
          }
          if (t.dataset.j) {
            P.gravarNivel(c.id, t.dataset.j, { nota: N.nota(c.id, t.dataset.j) + Number(t.dataset.d), partidas: N.partidas(c.id, t.dataset.j) });
            desenhar();
          } else if (t.dataset.acao === "pin") {
            P.zerarPin(c.id); desenhar();
          } else if (t.dataset.acao === "remover") {
            if (t.dataset.confirmar) { P.removerCrianca(c.id); desenhar(); }
            else { t.dataset.confirmar = "1"; t.textContent = "Toque de novo para remover"; t.classList.add("perigo"); }
          }
        });
        lista.appendChild(bloco);
      }
      corpo.querySelector("#backup").value = P.exportar();
    };
    desenhar();
    escolhas(corpo.querySelector("#modo-leve"), [["auto", "Automático"], ["sim", "Ligado"], ["nao", "Desligado"]],
      ler("modoLeve", "auto"), (v) => { guardar("modoLeve", v); aplicarPreferencias(); });
    escolhas(corpo.querySelector("#limite-min"), [[30, "30 min"], [60, "1 hora"], [90, "1h30"], [120, "2 horas"], [0, "Sem limite"]],
      minutosLimite(), (v) => guardar("limiteUteisMin", v));
    const liberar = corpo.querySelector("#liberar");
    liberar.disabled = liberadoHoje();
    liberar.addEventListener("click", () => { guardar("liberado", hoje()); liberar.textContent = "Hoje está liberado"; liberar.disabled = true; });
    escolhas(corpo.querySelector("#pausa-min"), [[20, "20 min"], [30, "30 min"], [45, "45 min"], [0, "Nunca"]],
      minutosParaPausa(), (v) => guardar("pausaMin", v));
    corpo.querySelector("#copiar").addEventListener("click", async () => {
      const t = corpo.querySelector("#backup"), msg = corpo.querySelector("#backup-msg");
      try { await navigator.clipboard.writeText(t.value); msg.textContent = "Copiado."; }
      catch { t.select(); msg.textContent = "Texto selecionado. Use Copiar do celular."; }
    });
    corpo.querySelector("#restaurar").addEventListener("click", () => {
      const msg = corpo.querySelector("#backup-msg");
      try { P.importar(corpo.querySelector("#backup").value); desenhar(); msg.textContent = "Restaurado."; }
      catch { msg.textContent = "Esse texto não é uma cópia de segurança válida."; }
    });
  };
  pedirSenha(!P.temPainel());
}

// ---------------------------------------------------------------- Rotas
function trocarTela(desenhar) {
  // Garante que a tela nova é desenhada uma única vez, com ou sem transição.
  let feito = false;
  const uma = () => { if (!feito) { feito = true; desenhar(); } };
  if (!document.startViewTransition || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("leve")) return uma();
  const t = document.startViewTransition(uma);
  // Trocar de tela muito rápido cancela a transição anterior; isso é esperado, não é erro.
  for (const p of [t.ready, t.finished, t.updateCallbackDone]) p.catch(() => {});
  // Se o navegador segurar a transição (app em segundo plano, por exemplo), desenha assim mesmo.
  setTimeout(uma, 400);
}

function rota() {
  pararFala();
  aplicarPreferencias();
  if (desmontar) { desmontar(); desmontar = null; }
  trocarTela(() => {
    // Lido aqui dentro (e não antes): se duas trocas de tela se atropelarem, vale o endereço atual.
    const h = location.hash;
    const m = h.match(/^#\/jogo\/([\w-]+)/);
    voltar.hidden = h === "" || h === "#/";
    palco.removeAttribute("style");
    window.scrollTo(0, 0);
    mostrarQuem();
    if (h.startsWith("#/painel")) return telaPainel();
    if (h.startsWith("#/cuidados")) return telaCuidados();
    if (h.startsWith("#/lojinha")) return telaLojinha();
    if (h.startsWith("#/novo")) return novoLiberado ? telaNovo() : telaSenhaNovo();
    if (!jogadorAtivo()) { voltar.hidden = true; return telaEntrar(); }
    if (h.startsWith("#/dormindo") || esgotado(P.ativaId())) { voltar.hidden = true; return telaDormindo(); }
    if (h.startsWith("#/estante")) return telaDiario("estante");
    if (h.startsWith("#/diario")) return telaDiario("paginas");
    if (h.startsWith("#/descanso")) return telaDescanso();
    if (m) {
      const jogo = JOGOS.find((g) => g.id === m[1] && g.pronto);
      if (!jogo) { location.hash = "#/"; return; }
      palco.setAttribute("style", corDoJogo(jogo));
      return sala(jogo);
    }
    inicio();
  });
}

window.addEventListener("hashchange", rota);
rota();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
