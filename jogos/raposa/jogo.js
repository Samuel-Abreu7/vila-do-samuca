// Raposa, cordeiro e couve — Alcuíno de York, séc. VIII.
// O barqueiro atravessa o rio levando no máximo um passageiro.
// Não pode ficar sozinho, sem o barqueiro: raposa com cordeiro, cordeiro com couve.
import { carregarEstilo, faixa, som, festa, prepararJogo, posicoes, mover, dicasEmDegraus, repetir } from "../../util.js";
import { arte, icone } from "../../arte.js";

const TODOS = [
  { id: "raposa", nome: "Raposa" },
  { id: "cordeiro", nome: "Cordeiro" },
  { id: "couve", nome: "Couve" },
];
const PERIGOS = [
  { a: "raposa", b: "cordeiro", texto: "A raposa ficou sozinha com o cordeiro, e o cordeiro levou um baita susto!" },
  { a: "cordeiro", b: "couve", texto: "O cordeiro ficou sozinho com a couve e comeu tudinho!" },
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

// ---------- Cenário (desenhos parados, no traço da vila) ----------
const ARVORE = `<svg class="rp-arvore" viewBox="0 0 60 80" aria-hidden="true"><rect x="26" y="44" width="8" height="30" rx="3" fill="#7a4a24"/>
  <circle cx="30" cy="30" r="22" fill="#2f9e3a"/><circle cx="20" cy="36" r="13" fill="#2a8f35"/><circle cx="40" cy="34" r="14" fill="#38ad44"/>
  <circle cx="24" cy="22" r="6" fill="#5cc95a" opacity=".7"/></svg>`;
const ARBUSTO = `<svg class="rp-arbusto" viewBox="0 0 60 34" aria-hidden="true"><ellipse cx="30" cy="30" rx="28" ry="5" fill="rgba(0,0,0,.12)"/>
  <circle cx="18" cy="20" r="11" fill="#2a8f35"/><circle cx="32" cy="16" r="13" fill="#38ad44"/><circle cx="45" cy="21" r="10" fill="#2f9e3a"/>
  <circle cx="28" cy="12" r="2.4" fill="#ff7ac8"/><circle cx="40" cy="18" r="2.2" fill="#ffc83d"/></svg>`;
const CAIS = `<svg class="rp-cais" viewBox="0 0 120 30" aria-hidden="true"><rect x="8" y="22" width="8" height="8" fill="#6b3f1c"/><rect x="104" y="22" width="8" height="8" fill="#6b3f1c"/>
  <rect x="0" y="6" width="120" height="18" rx="3" fill="#c98b4f"/><path d="M24 6v18M48 6v18M72 6v18M96 6v18" stroke="#8a5424" stroke-width="2"/></svg>`;
const CENARIO_CIMA = `${ARVORE}${ARBUSTO.replace('class="rp-arbusto"', 'class="rp-arbusto direita"')}<span class="rp-areia"></span>${CAIS}`;
const CENARIO_BAIXO = `<span class="rp-areia"></span>${CAIS}${ARBUSTO}`;
const RIO = `<svg class="rp-ondas" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true">
  <path d="M20 40 q12 -6 24 0 M120 64 q12 -6 24 0 M230 30 q12 -6 24 0 M60 120 q12 -6 24 0 M190 140 q12 -6 24 0 M250 96 q12 -6 24 0 M30 170 q12 -6 24 0"
    stroke="#bfe6ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/></svg>`;
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
  let problema = null;
  let vivo = true, repetindo = false;

  palco.innerHTML = `
    <section class="jg rp">
      ${faixa(arte("raposa", 54), "Raposa, cordeiro e couve")}
      <div class="rp-cena" data-teclado=".rp-peca">
        <div class="rp-margem" data-lado="cima" role="group" aria-label="Margem de partida">
          <span class="rp-placa">Partida</span>${CENARIO_CIMA}
          <span class="rp-aqui" aria-hidden="true">O barco está aqui</span>
          <div class="rp-gente"></div>
        </div>
        <div class="rp-rio">${RIO}<div class="rp-barco" id="rp-barco"></div></div>
        <div class="rp-margem" data-lado="baixo" role="group" aria-label="Margem da bandeira, a chegada">
          <span class="rp-placa">Chegada</span>${CENARIO_BAIXO}
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

  const jogo = prepararJogo(palco, {
    ctx, tutorial: true,
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
    b.innerHTML = `<span class="rp-figura">${arte(p.id, ondeEsta === "barco" ? 52 : 62)}</span><span class="rp-nome">${p.nome}</span>`;
    b.disabled = repetindo || !(!problema && !venceu() && (ondeEsta === "barco" || estado.lado[p.id] === estado.barco));
    b.className = `rp-peca ${ondeEsta === "barco" ? "no-barco" : b.disabled ? "longe" : "pode"}`;
    b.setAttribute("aria-label", ondeEsta === "barco" ? `${p.nome}, no barco. Toque para descer.`
      : b.disabled ? `${p.nome}, na outra margem, longe do barco.` : `${p.nome}. Toque para subir no barco.`);
    b.addEventListener("click", () => {
      const antes = posicoes(cena, "[data-peca]");
      estado.carga = estado.carga === p.id ? null : p.id;
      som(estado.carga ? "toque" : "solta");
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
    barco.innerHTML = `${CASCO}<span class="rp-barqueiro" role="img" aria-label="Barqueiro">${arte("barqueiro", 56)}</span>`;
    if (estado.carga) barco.appendChild(peca(PERSONAGENS.find((p) => p.id === estado.carga), "barco"));
    barco.dataset.lado = estado.barco;

    const fim = venceu();
    $("#rp-atravessar").disabled = !!problema || fim || repetindo;
    // O botão diz o que vai acontecer antes do toque.
    $("#rp-atravessar").innerHTML = `${icone("play")} ${estado.carga ? `Atravessar com ${artigo[estado.carga]}` : "Atravessar sozinho"}`;
    // Depois de vencer, Desfazer fica desligado: senão a mesma vitória contaria de novo no nível e no diário.
    $("#rp-desfazer").disabled = historico.length === 0 || repetindo || fim;
    $("#rp-recomecar").disabled = repetindo;
    $("#rp-dica").hidden = fim || repetindo;
    $("#rp-contagem").textContent = `Travessias: ${estado.travessias}`;

    if (problema) {
      aviso.className = "aviso erro";
      aviso.textContent = `Opa! ${problema} Toque em Desfazer e tente outro caminho.`;
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
    desenhar();
    mover(cena, "[data-peca]", antes, { duracao: 700 });
    if (problema) som("erro");
    else if (venceu()) {
      som("vitoria");
      const perfeito = estado.travessias === MINIMO;
      if (perfeito) { festa(); if (!fase) ctx?.conquistar?.("raposa-perfeita"); }
      // Guarda a solução para "Mostrar como eu fiz".
      const passos = [...historico.map((e) => structuredClone(e)), structuredClone(estado)];
      ctx?.definirReplay?.(() => mostrarSolucao(passos));
      ctx?.registrarSolo(900, perfeito ? Math.max(0.5, 1 - dicas.usados * 0.05) : 0.7,
        `Levou todos para o outro lado em ${estado.travessias} travessias${perfeito ? ", o menor número possível" : ""}.`);
      ctx?.fala("resolveu");
    } else som("solta");
    dicas.zerar();
  }

  // Repete a solução da criança, viagem por viagem, em câmera lenta.
  async function mostrarSolucao(passos) {
    repetindo = true;
    const final = structuredClone(estado);
    ctx?.dizer?.("Olha só como foi, viagem por viagem!", "feliz");
    await repetir(passos, (e, i) => {
      const antes = posicoes(cena, "[data-peca]");
      estado = structuredClone(e); problema = null;
      desenhar();
      mover(cena, "[data-peca]", antes, { duracao: 700 });
      $("#rp-contagem").textContent = i === 0 ? "Começo" : `Viagem ${i} de ${passos.length - 1}`;
    }, { intervalo: 1300, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false;
    estado = final;
    desenhar();
  }

  function limpar() { problema = null; aviso.textContent = ""; aviso.className = "aviso"; desenhar(); dicas.zerar(); }
  $("#rp-atravessar").addEventListener("click", atravessar);
  $("#rp-desfazer").addEventListener("click", () => {
    if (!historico.length) return;
    estado = historico.pop(); som("solta"); limpar();
  });
  $("#rp-recomecar").addEventListener("click", () => {
    estado = estadoInicial(); historico = []; som("solta"); limpar();
  });

  desenhar();
  // O balão do Samuca entra logo depois de montar; por isso a primeira fala espera um instante.
  setTimeout(() => {
    if (fase === 3) ctx?.dizer?.("Agora tente sozinho. Se precisar, a dica está aqui embaixo.");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
