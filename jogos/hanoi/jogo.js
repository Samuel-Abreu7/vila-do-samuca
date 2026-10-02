// Torre de Hanói — Édouard Lucas, 1883.
// Toque num pino para pegar o disco de cima; toque em outro para soltar.
import { carregarEstilo, escolhas, ler, escolhaDaCrianca, guardarEscolha, visualIlustrado, abrirIlustrado, criarSprites, faixa, som, festa, prepararJogo, posicoes, mover, dicasEmDegraus, repetir } from "../../util.js";
import { arte, icone } from "../../arte.js";

const CORES = ["#ff5b61", "#ff9a3c", "#ffc83d", "#3bd67f", "#2fd1c4", "#3aa6ff", "#a879ff"];
const DIFICULDADE = { 2: 500, 3: 650, 4: 850, 5: 1050, 6: 1250, 7: 1450 };
const NOME_PINO = ["da esquerda", "do meio", "da direita"];
const NOME_COR = ["vermelho", "laranja", "amarelo", "verde", "verde-água", "azul", "roxo"];
const PLACA = ["Partida", "", "Chegada"];

// ---------- Modelo ilustrado (imagens geradas por IA, assinadas pela vila) ----------
// Cenário pintado (pátio de jardim), o Gui (galo da França) como companheiro de cena e anfitrião, e a haste
// pintada. Os discos continuam em CSS (o tamanho muda com a quantidade). Duas versões à escolha: ilustrada e leve.
const IMG = { cenario: new URL("./img/cenario.webp", import.meta.url).href, atlas: new URL("./img/atlas.webp", import.meta.url).href };
// ATLAS-INICIO (gerado por embutir-atlas.py; não editar à mão)
const ATLAS = { w: 640, h: 514 };
const RET = {"gui": [0, 0, 149, 259], "gui-feliz": [155, 0, 170, 232], "gui-preocupado": [331, 0, 168, 259], "poste": [505, 0, 45, 228], "bandeira": [0, 265, 146, 243]};
// ATLAS-FIM
const spr = criarSprites(IMG.atlas, ATLAS.w, ATLAS.h, RET);
// Fases guiadas: 1) 2 discos com guia; 2) 3 discos com guia; 3) 3 discos sozinho.
const GUIADAS = { 1: 2, 2: 3, 3: 3 };

// Próximo movimento do caminho mais curto, a partir de QUALQUER arrumação.
// Para levar os discos 1..n ao destino: se o maior (n) já está lá, cuida do resto;
// senão, os menores precisam ir antes para o pino que sobra, e então o n passa.
export function proximoMovimento(pinos, discos, destino = 2) {
  const pos = [];
  pinos.forEach((p, i) => p.forEach((d) => (pos[d] = i)));
  const primeiro = (n, alvo) => {
    if (n === 0) return null;
    if (pos[n] === alvo) return primeiro(n - 1, alvo);
    const sobra = 3 - pos[n] - alvo;
    return primeiro(n - 1, sobra) || [pos[n], alvo];
  };
  return primeiro(discos, destino);
}

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const sugerido = ctx && !guiada ? ctx.sugerir([3, 4, 5, 6, 7], (n) => DIFICULDADE[n]) : null;
  // Quantos discos a criança escolheu vale até ela escolher outro; sem escolha, vale a sugestão do nível.
  let discos = guiada ? GUIADAS[guiada] : escolhaDaCrianca(ctx, "hanoi:discos") ?? sugerido ?? ler("hanoi:discos", 3);
  let pinos, pego, movimentos, historico, vivo = true, repetindo = false;
  // A cena nasce no leve e só troca para o ilustrado se as imagens chegarem em 0,8 s (ver `abrirIlustrado` no util).
  const querIlustrado = visualIlustrado(ctx, "hanoi:visual");
  let ilustrado = false;
  // O Gui reage: contente, feliz quando a torre fica pronta, preocupado (nunca com medo) se o disco não cabe.
  let clima = "contente";
  const htmlGui = () => (ilustrado ? spr(clima === "feliz" ? "gui-feliz" : clima === "preocupado" ? "gui-preocupado" : "gui", 0.34) : arte("gui", 46));

  palco.innerHTML = `
    <section class="jg th">
      ${faixa(arte("hanoi", 54), "Torre de Hanói", { ajustes: !guiada })}
      <div class="th-templo${querIlustrado ? " carregando" : ""}">
        <button type="button" class="th-gui" aria-label="Gui, o galo. Toque para ouvir a história do jogo."></button>
        <div class="th-base" id="th-base" data-teclado=".th-pino"></div>
        <div class="th-placas" aria-hidden="true">${PLACA.map((t, i) => `<span>${t ? `${i === 2 ? arte("bandeira", 18) : ""}${t}` : ""}</span>`).join("")}</div>
      </div>
      <p class="th-estado" id="th-estado"></p>
      <p class="aviso" id="th-aviso" role="status" aria-live="polite"></p>
      <div class="acoes">
        <button type="button" class="botao dourado" id="th-dica"></button>
        <button type="button" class="botao" id="th-desfazer">${icone("desfazer")} Desfazer</button>
        <button type="button" class="botao" id="th-recomecar" data-nova-partida>${icone("recomecar")} Recomeçar</button>
      </div>
      <p class="contagem" id="th-contagem"></p>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#th-aviso");
  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Visual do jogo</span><div id="th-visual" data-nova-partida></div>
    <p class="th-dica-visual">O ilustrado tem desenhos mais ricos e precisa de internet. O leve funciona sem internet e em celular mais simples.</p>
    <span class="rotulo">Quantos discos</span><div id="th-qtd" data-nova-partida></div>`;
  escolhas(ajustes.querySelector("#th-visual"), [["ilustrado", "Ilustrado"], ["leve", "Leve"]], querIlustrado ? "ilustrado" : "leve", (v) => {
    guardarEscolha(ctx, "hanoi:visual", v);
    ctx?.reiniciar?.();
  });
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>Leve a torre inteira para o pino da direita.</li>
      <li>Toque num pino para pegar o disco de cima e em outro pino para soltá-lo.</li>
      <li>Um disco nunca pode ficar em cima de um disco menor.</li>
      <li>Mais discos, mais desafio: veja nos ajustes.</li></ul>`,
    passos: () => [
      { alvo: '.th-pino[data-i="0"]', texto: "Toque para pegar o disco de cima" },
      { alvo: '.th-pino[data-i="2"]', texto: "Toque onde quer soltar" },
    ],
  });
  const minimo = () => 2 ** discos - 1;

  // ---------- Dicas em degraus ----------
  const dicas = dicasEmDegraus(palco, {
    botao: $("#th-dica"),
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (venceu()) return null;
      const mov = proximoMovimento(pinos, discos);
      if (!mov) return null;
      const [de, para] = mov;
      // O maior disco que ainda não chegou à direita é quem manda no plano.
      let maior = discos;
      while (maior > 0 && pinos[2].includes(maior) && pinos[2].indexOf(maior) === discos - maior) maior--;
      const pinoMaior = pinos.findIndex((p) => p.includes(maior));
      const jaPegou = pego === de;
      return {
        pergunta: `Qual é o maior disco que ainda não está no lugar certo? O que precisa sair de cima dele, ou do caminho dele?`,
        regiao: `.th-pino[data-i="${pinoMaior}"]`,
        jogada: jaPegou ? `.th-pino[data-i="${para}"]` : `.th-pino[data-i="${de}"], .th-pino[data-i="${para}"]`,
        textoJogada: `Leve o disco de cima do pino ${NOME_PINO[de]} para o pino ${NOME_PINO[para]}.`,
        porque: jaPegou
          ? `Agora solte no pino ${NOME_PINO[para]}.`
          : `Leve o disco do pino ${NOME_PINO[de]} para o ${NOME_PINO[para]}. Assim o caminho do disco maior vai ficando livre.`,
      };
    },
  });

  function iniciar() {
    pinos = [Array.from({ length: discos }, (_, i) => discos - i), [], []];
    pego = null; movimentos = 0; historico = []; clima = "contente";
    aviso.textContent = ""; aviso.className = "aviso";
    desenhar();
  }

  const venceu = () => pinos[2].length === discos;

  const nomeDisco = (d) => `disco ${NOME_COR[(d - 1) % NOME_COR.length]}`;
  // Com um disco na mão: em quais pinos ele pode ser solto?
  const cabe = (i) => pego !== null && pego !== i && !(pinos[i].length && pinos[i].at(-1) < pinos[pego].at(-1));

  function rotuloPino(p, i) {
    const nome = `Pino ${NOME_PINO[i]}${PLACA[i] ? ` (${PLACA[i].toLowerCase()})` : ""}`;
    const conteudo = p.length ? `${p.length} ${p.length === 1 ? "disco" : "discos"}, em cima o ${nomeDisco(p.at(-1))}` : "vazio";
    if (pego === null) return `${nome}, ${conteudo}.${p.length ? " Toque para pegar o disco de cima." : ""}`;
    if (pego === i) return `${nome}, segurando o ${nomeDisco(p.at(-1))}. Toque para devolver.`;
    return `${nome}, ${conteudo}. ${cabe(i) ? "Pode soltar aqui." : "Não pode: o disco de cima é menor."}`;
  }

  function desenhar() {
    const base = $("#th-base");
    base.innerHTML = pinos.map((p, i) => `
      <button type="button" class="th-pino ${pego === i ? "pego" : ""} ${pego !== null && pego !== i ? (cabe(i) ? "pode" : "nao-pode") : ""}" data-i="${i}"
        aria-label="${rotuloPino(p, i)}" ${venceu() || repetindo ? "disabled" : ""}>
        <span class="th-haste${ilustrado ? " poste" : ""}"${ilustrado ? ` style="${spr.preencher("poste")}"` : ""}></span>
        ${p.map((d, k) => `<span class="th-disco ${pego === i && k === p.length - 1 ? "no-ar" : ""}"
          data-peca="d${d}" style="width:${30 + (d / Math.max(discos, 3)) * 65}%;--c:${CORES[(d - 1) % CORES.length]}"></span>`).join("")}
      </button>`).join("");
    $(".th-gui").innerHTML = htmlGui();
    $("#th-estado").innerHTML = venceu() || repetindo ? ""
      : pego === null ? "Toque num pino para pegar o disco de cima."
      : `Você pegou o <b>${nomeDisco(pinos[pego].at(-1))}</b>. Solte num pino vazio ou em cima de um disco maior.`;
    $("#th-desfazer").disabled = !historico.length || venceu() || repetindo;
    $("#th-recomecar").disabled = repetindo;
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo; // trocar o desafio no meio da repetição misturaria tudo
    $("#th-dica").hidden = venceu() || repetindo;
    if (!repetindo) $("#th-contagem").textContent = `Movimentos: ${movimentos} · menor possível: ${minimo()}`;
    dicas.reaplicar();
  }

  function tocar(i) {
    let antesMov = null, moveu = false;
    if (venceu() || repetindo) return;
    clima = "contente";
    if (pego === null) {
      if (!pinos[i].length) return;
      pego = i;
      som("toque");
      aviso.textContent = ""; aviso.className = "aviso";
    } else if (pego === i) {
      pego = null;
    } else {
      const disco = pinos[pego].at(-1);
      const topo = pinos[i].at(-1);
      if (topo !== undefined && topo < disco) {
        aviso.textContent = "Esse disco é maior. Ele não pode ficar em cima de um menor.";
        aviso.className = "aviso erro";
        som("erro");
        clima = "preocupado";
        pego = null;
      } else {
        antesMov = posicoes($("#th-base"), "[data-peca]");
        historico.push(pinos.map((p) => [...p]));
        pinos[i].push(pinos[pego].pop());
        pego = null; movimentos += 1; moveu = true;
        som("solta");
        if (venceu()) {
          som("vitoria");
          clima = "feliz";
          const perfeito = movimentos === minimo();
          if (perfeito) festa();
          const passos = [...historico.map((p) => p.map((x) => [...x])), pinos.map((p) => [...p])];
          ctx?.definirReplay?.(() => mostrarSolucao(passos));
          ctx?.registrarSolo(DIFICULDADE[discos], Math.max(0.4, (perfeito ? 1 : 0.6) - dicas.usados * 0.03),
            `Montou a torre de ${discos} discos em ${movimentos} movimentos${perfeito ? ", o mínimo possível" : ""}.`);
          if (!guiada && perfeito && dicas.usados === 0) ctx?.conquistar?.("hanoi-minimo");
          if (!guiada && discos >= 5) ctx?.conquistar?.("hanoi-5");
          if (!guiada && discos >= 7) ctx?.conquistar?.("hanoi-7");
          ctx?.fala("resolveu");
          aviso.className = "aviso certo";
          aviso.textContent = perfeito
            ? `Torre completa em ${movimentos} movimentos, o menor número possível!${discos < 7 && !guiada ? " Que tal com um disco a mais?" : ""}`
            : `Torre completa em ${movimentos} movimentos. Dá para fazer em ${minimo()}.`;
        }
      }
    }
    desenhar();
    if (antesMov) mover($("#th-base"), "[data-peca]", antesMov, { arco: 70 });
    // Depois de um movimento completo (ou de pegar o disco certo), a dica recomeça do degrau 1.
    if (moveu || pego !== null) dicas.zerar();
  }

  // Repete a solução da criança, movimento por movimento.
  async function mostrarSolucao(passos) {
    repetindo = true;
    const final = pinos.map((p) => [...p]);
    ctx?.dizer?.("Olha como você montou a torre, movimento por movimento!", "feliz");
    await repetir(passos, (estado, i) => {
      const antes = posicoes($("#th-base"), "[data-peca]");
      pinos = estado.map((p) => [...p]); pego = null;
      desenhar();
      mover($("#th-base"), "[data-peca]", antes, { arco: 70 });
      $("#th-contagem").textContent = i === 0 ? "Começo" : `Movimento ${i} de ${passos.length - 1}`;
    }, { intervalo: discos > 4 ? 600 : 900, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false; pinos = final; desenhar();
  }

  $("#th-base").addEventListener("click", (e) => {
    const b = e.target.closest(".th-pino");
    if (b) tocar(Number(b.dataset.i));
  });
  $("#th-desfazer").addEventListener("click", () => {
    if (!historico.length) return;
    pinos = historico.pop(); pego = null; movimentos -= 1; clima = "contente";
    aviso.textContent = ""; aviso.className = "aviso";
    desenhar(); dicas.zerar();
  });
  $("#th-recomecar").addEventListener("click", () => { iniciar(); dicas.zerar(); });
  if (!guiada) {
    escolhas(ajustes.querySelector("#th-qtd"), [3, 4, 5, 6, 7].map((n) => [n, String(n)]), discos, (n) => {
      jogo.fecharAjustes(); discos = n; guardarEscolha(ctx, "hanoi:discos", n); iniciar(); dicas.zerar();
    });
    // Marca a quantidade sugerida para esta criança (anel dourado, sem emoji).
    ajustes.querySelectorAll("#th-qtd button").forEach((b) => b.classList.toggle("sugerida", Number(b.textContent) === sugerido));
  }

  iniciar();
  $(".th-gui").hidden = !ctx?.historia;
  $(".th-gui").addEventListener("click", () => { som("nota", 1); jogo.abrirHistoria(); });
  if (querIlustrado) {
    abrirIlustrado([IMG.cenario, IMG.atlas], {
      vivo: () => vivo,
      aplicar: () => { ilustrado = true; $(".th-templo").classList.add("ilustrado"); desenhar(); },
      revelar: () => $(".th-templo").classList.remove("carregando"),
    });
  }
  setTimeout(() => {
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho. Lembre: primeiro liberte o disco maior.");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
