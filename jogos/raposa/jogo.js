// Raposa, cordeiro e couve — Alcuíno de York, séc. VIII.
// O barqueiro atravessa o rio levando no máximo um passageiro.
// Não pode ficar sozinho, sem o barqueiro: raposa com cordeiro, cordeiro com couve.
import { carregarEstilo, faixa, som, festa, prepararJogo, posicoes, mover, dicasEmDegraus, repetir, semMovimento, fatorLento, guardarEscolha, escolhas, visualIlustrado, abrirIlustrado, criarSprites } from "../../util.js";
import { arte, icone } from "../../arte.js";

// nota: grau da escala da música (cada bicho tem a sua nota de piano ao ser tocado).
const TODOS = [
  { id: "raposa", nome: "Raposa", nota: 0 },
  { id: "cordeiro", nome: "Cordeiro", nota: 2 },
  { id: "couve", nome: "Couve", nota: 4 },
];
// Rosto de cada um: feliz quando chegou, preocupado quando ficou em apuros.
const HUMOR = { feliz: { raposa: "raposa-feliz", cordeiro: "cordeiro-feliz", couve: "couve-feliz" },
  preocupado: { cordeiro: "cordeiro-preocupado", couve: "couve-preocupada" } };
const PERIGOS = [
  { a: "raposa", b: "cordeiro", vitima: "cordeiro", texto: "A raposa ficou sozinha com o cordeiro, e o cordeiro levou um baita susto!" },
  { a: "cordeiro", b: "couve", vitima: "couve", texto: "O cordeiro ficou sozinho com a couve e comeu tudinho!" },
];
const outro = (lado) => (lado === "cima" ? "baixo" : "cima");
const artigo = { raposa: "a raposa", cordeiro: "o cordeiro", couve: "a couve" };

// Fases guiadas: 1) só cordeiro e couve, com guia; 2) os três, com guia; 3) os três, sozinho.
const FASES_GUIADAS = { 1: ["cordeiro", "couve"], 2: ["raposa", "cordeiro", "couve"], 3: ["raposa", "cordeiro", "couve"] };

// ---------- Resolvedor: menor sequência de viagens a partir de qualquer situação segura ----------
const chaveEstado = (lado, barco, ids) => ids.map((id) => lado[id][0]).join("") + barco[0];
function seguro(lado, barco, ids) {
  const sozinhos = ids.filter((id) => lado[id] !== barco);
  return !PERIGOS.some((p) => sozinhos.includes(p.a) && sozinhos.includes(p.b));
}
// Devolve a lista de cargas (id ou null = sozinho) até todos chegarem embaixo, ou null.
export function resolver(lado, barco, ids) {
  const inicio = { lado: { ...lado }, barco, caminho: [] };
  const vistos = new Set([chaveEstado(lado, barco, ids)]);
  const fila = [inicio];
  while (fila.length) {
    const e = fila.shift();
    if (ids.every((id) => e.lado[id] === "baixo") && e.barco === "baixo") return e.caminho;
    for (const carga of [null, ...ids.filter((id) => e.lado[id] === e.barco)]) {
      const lado2 = { ...e.lado };
      const barco2 = outro(e.barco);
      if (carga) lado2[carga] = barco2;
      if (!seguro(lado2, barco2, ids)) continue;
      const k = chaveEstado(lado2, barco2, ids);
      if (vistos.has(k)) continue;
      vistos.add(k);
      fila.push({ lado: lado2, barco: barco2, caminho: [...e.caminho, carga] });
    }
  }
  return null;
}

// ---------- Modelo ilustrado (imagens geradas por IA, assinadas pela vila) ----------
// Duas versões do jogo à escolha: a ilustrada (um cenário pintado e um atlas com os personagens) e a
// leve (desenhos em código: sem internet e em celular fraco). Cada figura do atlas é uma célula da
// grade 5×3: [coluna, linha]. Se as imagens não carregarem (sem internet), cai sozinho no leve.
const IMG = { cenario: new URL("./img/cenario.webp", import.meta.url).href, atlas: new URL("./img/atlas.webp", import.meta.url).href };
const RET = {"raposa": [0, 0, 216, 216], "raposa-feliz": [216, 0, 216, 216], "cordeiro": [432, 0, 216, 216], "cordeiro-feliz": [648, 0, 216, 216], "cordeiro-preocupado": [864, 0, 216, 216], "couve": [0, 216, 216, 216], "couve-feliz": [216, 216, 216, 216], "couve-preocupada": [432, 216, 216, 216], "bento": [648, 216, 216, 216], "barqueiro-acena": [864, 216, 216, 216], "barqueiro-remando": [0, 432, 432, 216], "barco-vazio": [432, 432, 432, 216]};
const SPRITE = RET;
const sprite = criarSprites(IMG.atlas, 1080, 648, RET);
// tam = tamanho da célula de 216 px na tela; as figuras largas (barco) já têm o retângulo de 2 células
const spr = (nome, tam, extra = "") => sprite(nome, tam / 216, extra.replace("larga", "").trim());

// ---------- Cenário (desenhos parados, no traço da vila) ----------
const ARVORE = `<svg class="rp-arvore" viewBox="0 0 60 80" aria-hidden="true"><rect x="26" y="44" width="8" height="30" rx="3" fill="#7a4a24"/>
  <circle cx="30" cy="30" r="22" fill="#2f9e3a"/><circle cx="20" cy="36" r="13" fill="#2a8f35"/><circle cx="40" cy="34" r="14" fill="#38ad44"/>
  <circle cx="24" cy="22" r="6" fill="#5cc95a" opacity=".7"/></svg>`;
const ARBUSTO = `<svg class="rp-arbusto" viewBox="0 0 60 34" aria-hidden="true"><ellipse cx="30" cy="30" rx="28" ry="5" fill="rgba(0,0,0,.12)"/>
  <circle cx="18" cy="20" r="11" fill="#2a8f35"/><circle cx="32" cy="16" r="13" fill="#38ad44"/><circle cx="45" cy="21" r="10" fill="#2f9e3a"/>
  <circle cx="28" cy="12" r="2.4" fill="#ff7ac8"/><circle cx="40" cy="18" r="2.2" fill="#ffc83d"/></svg>`;
const CAIS = `<svg class="rp-cais" viewBox="0 0 120 30" aria-hidden="true"><rect x="8" y="22" width="8" height="8" fill="#6b3f1c"/><rect x="104" y="22" width="8" height="8" fill="#6b3f1c"/>
  <rect x="0" y="6" width="120" height="18" rx="3" fill="#c98b4f"/><path d="M24 6v18M48 6v18M72 6v18M96 6v18" stroke="#8a5424" stroke-width="2"/></svg>`;
const MORROS = `<svg class="rp-morros" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 40 Q40 6 90 24 Q130 4 180 22 Q230 2 300 26 V40 Z" fill="#8fdc8a" opacity=".6"/></svg>`;
const CENARIO_CIMA = `${MORROS}${ARVORE}<span class="rp-areia"></span>${CAIS}`;
const CENARIO_BAIXO = `<span class="rp-areia"></span>${CAIS}${ARBUSTO}`;
const RIO = `<svg class="rp-ondas" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
  <path d="M20 40 q12 -6 24 0 M120 64 q12 -6 24 0 M230 30 q12 -6 24 0 M60 120 q12 -6 24 0 M190 140 q12 -6 24 0 M250 96 q12 -6 24 0 M30 170 q12 -6 24 0"
    stroke="#bfe6ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/></svg>`;
// Juncos e vitórias-régias, parados, nas beiradas do rio (longe do caminho do barco).
const BEIRA_RIO = `<svg class="rp-junco esquerda" viewBox="0 0 40 60" aria-hidden="true"><path d="M10 60 Q8 30 12 6 M20 60 Q20 34 24 14 M30 60 Q32 38 28 22" stroke="#2f7d3a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="9" y="8" width="6" height="16" rx="3" fill="#7a4a24"/><rect x="21" y="16" width="6" height="14" rx="3" fill="#8a5424"/></svg>
  <svg class="rp-junco direita" viewBox="0 0 40 60" aria-hidden="true"><path d="M12 60 Q10 36 14 16 M24 60 Q26 30 22 8 M32 60 Q30 40 34 26" stroke="#2f7d3a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="19" y="10" width="6" height="16" rx="3" fill="#7a4a24"/></svg>
  <svg class="rp-vitoria um" viewBox="0 0 40 24" aria-hidden="true"><path d="M20 12 L38 9 A19 11 0 1 1 30 3 Z" fill="#4caf50"/><path d="M20 12 L36 8" stroke="#2e7d32" stroke-width="1.5"/><circle cx="12" cy="9" r="3.4" fill="#ffd1e6"/><circle cx="12" cy="9" r="1.4" fill="#ffc83d"/></svg>
  <svg class="rp-vitoria dois" viewBox="0 0 40 24" aria-hidden="true"><path d="M20 12 L2 9 A19 11 0 1 0 10 3 Z" fill="#43a047"/><path d="M20 12 L4 8" stroke="#2e7d32" stroke-width="1.5"/></svg>`;
// Remos: só se mexem durante a travessia, uma remada por vez, e param quando o barco encosta.
const REMOS = `<svg class="rp-remo esquerdo" viewBox="0 0 20 70" aria-hidden="true"><rect x="8" y="0" width="4" height="50" rx="2" fill="#7a4a24"/><ellipse cx="10" cy="58" rx="7" ry="12" fill="#c98b4f" stroke="#7a4a24" stroke-width="2"/></svg>
  <svg class="rp-remo direito" viewBox="0 0 20 70" aria-hidden="true"><rect x="8" y="0" width="4" height="50" rx="2" fill="#7a4a24"/><ellipse cx="10" cy="58" rx="7" ry="12" fill="#c98b4f" stroke="#7a4a24" stroke-width="2"/></svg>`;
const CASCO = `<svg class="rp-casco" viewBox="0 0 220 90" preserveAspectRatio="none" aria-hidden="true">
  <path d="M4 30 H216 L196 82 Q190 88 182 88 H38 Q30 88 24 82 Z" fill="#a9682f"/>
  <path d="M4 30 H216 L211 44 H9 Z" fill="#c98b4f"/><path d="M14 58 H206 M20 72 H200" stroke="#7a4a24" stroke-width="3"/>
  <rect x="2" y="24" width="216" height="8" rx="4" fill="#8a5424"/></svg>`;

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const fase = ctx?.tutorial || 0;
  const ids = FASES_GUIADAS[fase] || TODOS.map((p) => p.id);
  const PERSONAGENS = TODOS.filter((p) => ids.includes(p.id));
  const MINIMO = resolver(Object.fromEntries(ids.map((id) => [id, "cima"])), "cima", ids).length;
  const estadoInicial = () => ({ lado: Object.fromEntries(ids.map((id) => [id, "cima"])), barco: "cima", carga: null, travessias: 0 });
  let estado = estadoInicial();
  let historico = [];
  let problema = null, vitima = null, erros = 0;
  let vivo = true, repetindo = false;
  // Visual: a escolha da criança vale; sem escolha, ilustrado, menos em celular fraco (modo leve). A cena nasce
  // no leve e só troca para o ilustrado se as imagens chegarem em 0,8 s (ver `abrirIlustrado` no util).
  const querIlustrado = visualIlustrado(ctx, "raposa:visual");
  let ilustrado = false;
  // figura: sprite no ilustrado; desenho em código no leve (tamanhos: leve, ilustrado)
  const figura = (nome, tamLeve, tamIlu) => (ilustrado && SPRITE[nome] ? spr(nome, tamIlu) : arte(nome, tamLeve));
  const htmlCombinados = () => `<span aria-hidden="true">Sozinhos, não:</span>
        ${PERIGOS.filter((x) => ids.includes(x.a) && ids.includes(x.b)).map((x) =>
          `<span class="rp-par" aria-hidden="true">${figura(x.a, 30, 44)}<b>✕</b>${figura(x.b, 30, 44)}</span>`).join("")}`;

  palco.innerHTML = `
    <section class="jg rp">
      ${faixa(arte("raposa", 54), "Raposa, cordeiro e couve", { ajustes: !fase })}
      <div class="rp-combinados" role="note" aria-label="Sem o barqueiro, não podem ficar sozinhos: ${PERIGOS.filter((x) => ids.includes(x.a) && ids.includes(x.b)).map((x) => `${artigo[x.a]} com ${artigo[x.b]}`).join("; ")}.">
        ${htmlCombinados()}
      </div>
      <div class="rp-cena${querIlustrado ? " carregando" : ""}" data-teclado=".rp-peca">
        <div class="rp-margem" data-lado="cima" role="group" aria-label="Margem de partida">
          <span class="rp-placa">Partida</span>${CENARIO_CIMA}
          <button type="button" class="rp-bento" aria-label="Bento, o texugo. Toque para ouvir a história do jogo.">${figura("bento", 46, 58)}</button>
          <span class="rp-aqui" aria-hidden="true">O barco está aqui</span>
          <div class="rp-gente"></div>
        </div>
        <div class="rp-rio">${RIO}${BEIRA_RIO}<div class="rp-barco" id="rp-barco"></div></div>
        <div class="rp-margem" data-lado="baixo" role="group" aria-label="Margem da bandeira, a chegada">
          <span class="rp-placa" id="rp-chegada"></span>${CENARIO_BAIXO}
          <span class="rp-aqui" aria-hidden="true">O barco está aqui</span>
          <span class="rp-meta">${arte("bandeira", 40)}</span>
          <div class="rp-gente"></div>
        </div>
      </div>
      <p class="aviso" id="rp-aviso" role="status" aria-live="polite"></p>
      <button type="button" class="botao principal" id="rp-atravessar">${icone("play")} Atravessar</button>
      <div class="acoes">
        <button type="button" class="botao dourado" id="rp-dica"></button>
        <button type="button" class="botao" id="rp-desfazer">${icone("desfazer")} Desfazer</button>
        <button type="button" class="botao" id="rp-recomecar" data-nova-partida>${icone("recomecar")} Recomeçar</button>
      </div>
      <p class="contagem" id="rp-contagem"></p>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const cena = $(".rp-cena");
  const margens = { cima: $('[data-lado="cima"]'), baixo: $('[data-lado="baixo"]') };
  const barco = $("#rp-barco");
  const aviso = $("#rp-aviso");

  // Ajustes: o visual (ilustrado ou leve). Trocar recomeça a partida, por isso passa pelo guarda do limite.
  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Visual do jogo</span><div id="rp-visual" class="escolhas" data-nova-partida></div>
    <p class="rp-dica-visual">O ilustrado tem desenhos mais ricos e precisa de internet. O leve funciona sem internet e em celular mais simples.</p>`;
  escolhas(ajustes.querySelector("#rp-visual"), [["ilustrado", "Ilustrado"], ["leve", "Leve"]], querIlustrado ? "ilustrado" : "leve", (v) => {
    guardarEscolha(ctx, "raposa:visual", v);
    ctx?.reiniciar?.();
  });

  const jogo = prepararJogo(palco, {
    ctx, tutorial: true, ajustes: fase ? null : ajustes,
    regras: `<ul>
      <li>Leve todos para a margem da bandeira, lá embaixo.</li>
      <li>O barco leva o barqueiro e <b>mais um</b>. Toque em quem vai junto.</li>
      <li>Sem o barqueiro por perto, a raposa não fica com o cordeiro, e o cordeiro não fica com a couve.</li>
      <li>Errou? Toque em Desfazer. Sem pressa.</li></ul>`,
    imprimir: () => ({
      titulo: "Raposa, cordeiro e couve",
      html: `<div style="display:flex;gap:12pt;justify-content:center">${arte("raposa", 70)}${arte("cordeiro", 70)}${arte("couve", 70)}</div>
        <p>Um barqueiro precisa levar uma raposa, um cordeiro e uma couve para o outro lado do rio.
        O barco é pequeno: cabe o barqueiro e <b>só mais um</b>.</p>
        <p>Se ficarem sozinhos, sem o barqueiro, a raposa assusta o cordeiro, e o cordeiro come a couve.
        Como levar todos, sem nenhum problema? Dá para fazer em 7 travessias.</p>
        <p>Desenhe o rio e use três papeizinhos para testar suas ideias.</p>
        <div class="quebra"><h2>Resposta (não espie antes!)</h2><ol>
          <li>Leva o cordeiro.</li><li>Volta sozinho.</li><li>Leva a raposa.</li><li>Volta trazendo o cordeiro.</li>
          <li>Leva a couve (a raposa não come couve).</li><li>Volta sozinho.</li><li>Leva o cordeiro de novo.</li></ol>
          <p>Também funciona trocando a raposa pela couve nos passos 3 e 5.</p></div>`,
    }),
    passos: () => [
      { alvo: '[data-peca="cordeiro"]', texto: "Toque em quem vai no barco" },
      { alvo: "#rp-atravessar", texto: "Depois, toque em Atravessar" },
    ],
  });

  // ---------- Dicas em degraus ----------
  function proximaViagem() {
    const caminho = resolver(estado.lado, estado.barco, ids);
    return caminho && caminho.length ? caminho[0] : undefined;
  }
  const dicas = dicasEmDegraus(palco, {
    botao: $("#rp-dica"),
    guiado: fase === 1 || fase === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (problema) return { pergunta: "Primeiro, toque em Desfazer para voltar um passo.", jogada: "#rp-desfazer", textoJogada: "Toque em Desfazer.", porque: "Opa, deu problema. Toque em Desfazer." };
      if (venceu()) return null;
      const m = proximaViagem();
      if (m === undefined) return null;
      const lado = `.rp-margem[data-lado="${estado.barco}"], #rp-barco`;
      const vazio = estado.lado; // só para legibilidade
      const primeiraViagem = Object.values(vazio).every((l) => l === "cima") && estado.barco === "cima";
      const jaNoBarco = estado.carga === m;
      if (m === null) {
        return {
          pergunta: "Precisa mesmo levar alguém nesta viagem?", regiao: lado,
          jogada: estado.carga ? `[data-peca="${estado.carga}"]` : "#rp-atravessar",
          textoJogada: estado.carga ? "Tire do barco e atravesse sozinho." : "Atravesse sozinho.",
          porque: estado.carga ? "Desta vez o barqueiro vai sozinho: tire do barco quem está nele." : "Volte sozinho: do outro lado ninguém corre perigo.",
        };
      }
      const voltando = estado.barco === "baixo";
      let pergunta = "Quem pode ficar do outro lado sem perigo?";
      let porque = `Leve ${artigo[m]}.`;
      if (m === "cordeiro" && primeiraViagem) { pergunta = "Quem é o encrenqueiro que não pode ficar sozinho com ninguém?"; porque = "Leve o cordeiro primeiro: quem fica para trás pode ficar junto sem problema."; }
      else if (m === "cordeiro" && voltando) { pergunta = "E se alguém fizesse o caminho de volta no barco?"; porque = "Traga o cordeiro de volta! Assim ele não fica sozinho com quem ele não pode."; }
      else if (m === "cordeiro") { pergunta = "Quem ainda falta do outro lado?"; porque = "Agora busque o cordeiro. Todo mundo vai estar do outro lado!"; }
      else if (ids.includes("cordeiro")) { porque = `Leve ${artigo[m]}. Mas lá ela vai encontrar o cordeiro… então, na volta, traga o cordeiro com você.`; }
      return {
        pergunta, regiao: lado,
        jogada: jaNoBarco ? "#rp-atravessar" : `[data-peca="${m}"]`,
        textoJogada: jaNoBarco ? "Agora é só atravessar." : `Leve ${artigo[m]} e atravesse.`,
        porque: jaNoBarco ? "Isso. Agora toque em Atravessar." : porque,
      };
    },
  });

  function peca(p, ondeEsta) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.peca = p.id;
    const humor = vitima === p.id ? HUMOR.preocupado[p.id] : ondeEsta === "baixo" ? HUMOR.feliz[p.id] : null;
    b.innerHTML = `<span class="rp-figura">${figura(humor || p.id, ondeEsta === "barco" ? 52 : 62, ondeEsta === "barco" ? 84 : 100)}${vitima === p.id ? '<span class="rp-susto" aria-hidden="true">!</span>' : ""}</span><span class="rp-nome">${p.nome}</span>`;
    b.disabled = repetindo || !(!problema && !venceu() && (ondeEsta === "barco" || estado.lado[p.id] === estado.barco));
    b.className = `rp-peca ${ondeEsta === "barco" ? "no-barco" : b.disabled ? "longe" : "pode"}`;
    b.setAttribute("aria-label", ondeEsta === "barco" ? `${p.nome}, no barco. Toque para descer.`
      : vitima === p.id ? `${p.nome}, em perigo.` : b.disabled ? `${p.nome}, na outra margem, longe do barco.` : `${p.nome}. Toque para subir no barco.`);
    b.addEventListener("click", () => {
      const antes = posicoes(cena, "[data-peca]");
      estado.carga = estado.carga === p.id ? null : p.id;
      som(estado.carga ? "nota" : "solta", p.nota);
      aviso.textContent = ""; aviso.className = "aviso";
      desenhar();
      mover(cena, "[data-peca]", antes, { arco: 40 });
      dicas.zerar();
    });
    return b;
  }

  const venceu = () => Object.values(estado.lado).every((l) => l === "baixo") && estado.barco === "baixo";

  function desenhar() {
    for (const lado of ["cima", "baixo"]) {
      const m = margens[lado];
      const gente = m.querySelector(".rp-gente");
      gente.replaceChildren();
      for (const p of PERSONAGENS) {
        if (estado.lado[p.id] === lado && estado.carga !== p.id) gente.appendChild(peca(p, lado));
      }
      m.classList.toggle("com-barco", estado.barco === lado);
    }
    barco.innerHTML = ilustrado
      ? (venceu()
        ? `<span class="spr-barqueiro-acena" role="img" aria-label="Barqueiro acenando">${spr("barqueiro-acena", 110)}</span>${spr("barco-vazio", 150, "larga spr-barco")}`
        : `<span class="spr-barco-inteiro" role="img" aria-label="Barqueiro remando no barco">${spr("barqueiro-remando", 150, "larga spr-barco")}</span>`)
      : `${CASCO}${REMOS}<span class="rp-barqueiro" role="img" aria-label="Barqueiro">${arte(venceu() ? "barqueiro-feliz" : "barqueiro", 56)}</span>`;
    // Lugar vago desenhado: "cabe mais um" sem precisar ler a regra.
    if (!estado.carga && !venceu()) barco.insertAdjacentHTML("beforeend", `<span class="rp-vago" aria-hidden="true">+1</span>`);
    // Placa da chegada: quantos já chegaram, com as figurinhas (✓ em quem chegou, não só a cor).
    const chegaram = PERSONAGENS.filter((p) => estado.lado[p.id] === "baixo" && estado.carga !== p.id);
    $("#rp-chegada").innerHTML = `Chegada <span class="rp-chegaram">${PERSONAGENS.map((p) =>
      `<span class="rp-mini ${chegaram.includes(p) ? "chegou" : ""}">${figura(p.id, 24, 34)}</span>`).join("")}</span>
      <span class="so-leitor">${chegaram.length} de ${PERSONAGENS.length} chegaram</span><b aria-hidden="true">${chegaram.length} de ${PERSONAGENS.length}</b>`;
    if (estado.carga) barco.appendChild(peca(PERSONAGENS.find((p) => p.id === estado.carga), "barco"));
    barco.dataset.lado = estado.barco;

    const fim = venceu();
    $("#rp-atravessar").disabled = !!problema || fim || repetindo;
    // O botão diz o que vai acontecer antes do toque.
    $("#rp-atravessar").innerHTML = `${icone("play")} ${estado.carga ? `Atravessar com ${artigo[estado.carga]}` : "Atravessar sozinho"}`;
    // Depois de vencer, Desfazer fica desligado: senão a mesma vitória contaria de novo no nível e no diário.
    $("#rp-desfazer").disabled = historico.length === 0 || repetindo || fim;
    // Errou: o Desfazer ganha destaque (é o caminho de volta, sem bronca).
    $("#rp-desfazer").classList.toggle("dourado", !!problema);
    $("#rp-recomecar").disabled = repetindo;
    $("#rp-dica").hidden = fim || repetindo;
    $("#rp-contagem").textContent = `Travessias: ${estado.travessias}`;

    if (problema) {
      aviso.className = "aviso erro";
      aviso.textContent = `Opa! ${problema} Tudo bem: errar faz parte de pensar. Toque em Desfazer e o barco volta.`;
    } else if (fim && !repetindo) {
      aviso.className = "aviso certo";
      aviso.textContent = estado.travessias === MINIMO
        ? `Todos do outro lado, em ${MINIMO} travessias. Esse é o menor número possível!`
        : `Todos do outro lado, em ${estado.travessias} travessias. Dá para fazer em ${MINIMO}. Quer tentar?`;
    }
    dicas.reaplicar();
  }

  function atravessar() {
    const antes = posicoes(cena, "[data-peca]");
    historico.push(structuredClone(estado));
    const saida = estado.barco;
    estado.barco = outro(saida);
    if (estado.carga) estado.lado[estado.carga] = estado.barco;
    estado.carga = null;
    estado.travessias += 1;

    const ficaram = PERSONAGENS.filter((p) => estado.lado[p.id] === saida).map((p) => p.id);
    const perigo = PERIGOS.find((x) => ficaram.includes(x.a) && ficaram.includes(x.b));
    problema = perigo ? perigo.texto : null;
    vitima = perigo ? perigo.vitima : null;
    const levou = historico.at(-1).carga;
    remar(saida);
    desenhar();
    mover(cena, "[data-peca]", antes, { duracao: 700 });
    if (levou && estado.barco === "baixo" && !problema) pular([levou], 700);
    if (problema) { som("erro"); erros += 1; }
    else if (venceu()) {
      som("vitoria");
      const perfeito = estado.travessias === MINIMO;
      if (perfeito) { festa(); if (!fase) ctx?.conquistar?.("raposa-perfeita"); }
      if (!erros && !fase) ctx?.conquistar?.("raposa-pensou");
      pular(ids, 1000);
      // Guarda a solução para "Mostrar como eu fiz".
      const passos = [...historico.map((e) => structuredClone(e)), structuredClone(estado)];
      ctx?.definirReplay?.(() => mostrarSolucao(passos));
      ctx?.registrarSolo(900, perfeito ? Math.max(0.5, 1 - dicas.usados * 0.05) : 0.7,
        `Levou todos para o outro lado em ${estado.travessias} travessias${perfeito ? ", o menor número possível" : ""}.`);
      ctx?.fala("resolveu");
    } else som("solta");
    dicas.zerar();
  }

  // Remada e rastro na água: só durante a travessia (resposta ao toque), e param sozinhos.
  function remar(saida) {
    if (semMovimento()) return;
    const f = fatorLento(), duracao = 700 * f;
    barco.style.transitionDuration = `${duracao}ms`;
    requestAnimationFrame(() => barco.querySelectorAll(".rp-remo").forEach((r, i) => r.animate(
      [{ rotate: "0deg" }, { rotate: `${i ? -28 : 28}deg` }, { rotate: "0deg" }],
      { duration: duracao / 3, iterations: 3, easing: "ease-in-out" })));
    // Barco ilustrado: um balanço leve, só durante a travessia.
    barco.querySelector(".spr-barco")?.animate([{ rotate: "0deg" }, { rotate: "-2.5deg" }, { rotate: "2.5deg" }, { rotate: "0deg" }],
      { duration: duracao / 1.5, iterations: 1.5, easing: "ease-in-out" });
    const rio = $(".rp-rio");
    const topo = saida === "cima" ? 30 : rio.clientHeight - 40;
    for (let i = 0; i < 3; i++) {
      const onda = document.createElement("span");
      onda.className = "rp-rastro";
      onda.style.top = `${topo + (saida === "cima" ? 1 : -1) * i * 16}px`;
      rio.appendChild(onda);
      onda.animate([{ opacity: 0, scale: ".6 .6" }, { opacity: .7, scale: "1 1", offset: .3 }, { opacity: 0, scale: "1.5 1.2" }],
        { duration: 900 * f, delay: i * 180 * f, fill: "both" }).finished.then(() => onda.remove(), () => onda.remove());
    }
  }
  // Pulinho de quem chegou: uma vez, depois que o barco encosta.
  function pular(quem, atraso) {
    if (semMovimento()) return;
    const f = fatorLento();
    quem.forEach((id, i) => cena.querySelector(`[data-peca="${id}"] .rp-figura`)?.animate(
      [{ translate: "0 0" }, { translate: "0 -14px", offset: .4 }, { translate: "0 0" }],
      { duration: 420 * f, delay: (atraso + i * 140) * f, easing: "ease-out" }));
  }

  // Repete a solução da criança, viagem por viagem, em câmera lenta.
  async function mostrarSolucao(passos) {
    repetindo = true;
    const final = structuredClone(estado);
    ctx?.dizer?.("Olha só como foi, viagem por viagem!", "feliz");
    await repetir(passos, (e, i) => {
      const antes = posicoes(cena, "[data-peca]");
      if (e.barco !== estado.barco) remar(estado.barco);
      estado = structuredClone(e); problema = null; vitima = null;
      desenhar();
      mover(cena, "[data-peca]", antes, { duracao: 700 });
      $("#rp-contagem").textContent = i === 0 ? "Começo" : `Viagem ${i} de ${passos.length - 1}`;
    }, { intervalo: 1300, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false;
    estado = final;
    desenhar();
  }

  function limpar() { problema = null; vitima = null; aviso.textContent = ""; aviso.className = "aviso"; desenhar(); dicas.zerar(); }
  $("#rp-atravessar").addEventListener("click", atravessar);
  $("#rp-desfazer").addEventListener("click", () => {
    if (!historico.length) return;
    const antes = posicoes(cena, "[data-peca]");
    const anterior = historico.pop();
    if (anterior.barco !== estado.barco) remar(estado.barco);
    estado = anterior; som("solta"); limpar();
    mover(cena, "[data-peca]", antes, { duracao: 700 });
  });
  $("#rp-recomecar").addEventListener("click", () => {
    estado = estadoInicial(); historico = []; erros = 0; som("solta"); limpar();
  });

  $(".rp-bento").hidden = !ctx?.historia;
  if (querIlustrado) {
    abrirIlustrado([IMG.cenario, IMG.atlas], {
      vivo: () => vivo,
      aplicar: () => {
        ilustrado = true;
        cena.classList.add("ilustrado");
        palco.querySelector(".rp-combinados").innerHTML = htmlCombinados();
        $(".rp-bento").innerHTML = figura("bento", 46, 58);
        desenhar();
      },
      revelar: () => cena.classList.remove("carregando"),
    });
  }
  $(".rp-bento").addEventListener("click", () => { som("nota", 1); jogo.abrirHistoria(); });
  desenhar();
  // O balão do Samuca entra logo depois de montar; por isso a primeira fala espera um instante.
  setTimeout(() => {
    if (fase === 3) ctx?.dizer?.("Agora tente sozinho. Se precisar, a dica está aqui embaixo.");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
