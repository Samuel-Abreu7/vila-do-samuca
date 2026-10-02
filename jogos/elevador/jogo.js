// Elevador de botões: só dois botões (sobe X, desce Y). Chegue ao andar pedido.
// Algumas fases são impossíveis de propósito; a criança pode dizer "não dá".
import { carregarEstilo, ler, escolhaDaCrianca, guardarEscolha, escolhas, visualIlustrado, abrirIlustrado, criarSprites, faixa, som, festa, prepararJogo, posicoes, mover, dicasEmDegraus, repetir } from "../../util.js";
import { arte, icone } from "../../arte.js";

const FASES = [
  { topo: 8, inicio: 0, alvo: 4, sobe: 2, desce: 1 },
  { topo: 8, inicio: 0, alvo: 5, sobe: 2, desce: 1 },
  { topo: 10, inicio: 0, alvo: 7, sobe: 5, desce: 3 },
  { topo: 10, inicio: 0, alvo: 1, sobe: 5, desce: 3 },
  { topo: 10, inicio: 0, alvo: 3, sobe: 4, desce: 2 },
  { topo: 12, inicio: 0, alvo: 8, sobe: 7, desce: 3 },
  { topo: 12, inicio: 0, alvo: 10, sobe: 6, desce: 4 },
  { topo: 12, inicio: 0, alvo: 5, sobe: 6, desce: 4 },
  { topo: 15, inicio: 0, alvo: 11, sobe: 7, desce: 5 },
  { topo: 13, inicio: 0, alvo: 1, sobe: 8, desce: 5 },
  { topo: 9, inicio: 0, alvo: 6, sobe: 7, desce: 4 },
  { topo: 15, inicio: 3, alvo: 14, sobe: 9, desce: 5 },
];

// Fases guiadas: 1) andar de 1 em 1; 2) dois botões diferentes; 3) uma impossível, para aprender o "Não dá!".
const GUIADAS = [
  { topo: 4, inicio: 0, alvo: 3, sobe: 1, desce: 1 },
  { topo: 6, inicio: 0, alvo: 5, sobe: 2, desce: 1 },
  { topo: 6, inicio: 0, alvo: 3, sobe: 2, desce: 4 },
];

// Caminho mais curto (lista de andares, do atual até o alvo). null = impossível.
export function caminho({ topo, alvo, sobe, desce }, de) {
  const antes = new Map([[de, null]]);
  const fila = [de];
  while (fila.length) {
    const a = fila.shift();
    if (a === alvo) {
      const lista = [];
      for (let x = a; x !== null; x = antes.get(x)) lista.unshift(x);
      return lista;
    }
    for (const b of [a + sobe, a - desce]) {
      if (b >= 0 && b <= topo && !antes.has(b)) { antes.set(b, a); fila.push(b); }
    }
  }
  return null;
}

// Menor número de apertos (busca em largura). null = impossível.
export function menorCaminho({ topo, inicio, alvo, sobe, desce }) {
  const dist = new Map([[inicio, 0]]);
  const fila = [inicio];
  while (fila.length) {
    const a = fila.shift();
    if (a === alvo) return dist.get(a);
    for (const b of [a + sobe, a - desce]) {
      if (b >= 0 && b <= topo && !dist.has(b)) { dist.set(b, dist.get(a) + 1); fila.push(b); }
    }
  }
  return null;
}

const nomeAndar = (n) => (n === 0 ? "Térreo" : `${n}º`);
const noAndar = (n) => (n === 0 ? "no térreo" : `no ${n}º andar`);
const aoAndar = (n) => (n === 0 ? "ao térreo" : `ao ${n}º andar`);
const andares = (n) => `${n} ${n === 1 ? "andar" : "andares"}`;

// Cabine desenhada aqui: caixa com duas portas e uma luz em cima.
const CABINE = `<svg viewBox="0 0 44 36" width="44" height="36" aria-hidden="true">
  <rect x="2" y="3" width="40" height="31" rx="6" fill="#f3d58c" stroke="#6b4a1a" stroke-width="2.5"/>
  <rect x="7" y="9" width="14" height="22" rx="2" fill="#a9cdea" stroke="#6b4a1a" stroke-width="1.6"/>
  <rect x="23" y="9" width="14" height="22" rx="2" fill="#a9cdea" stroke="#6b4a1a" stroke-width="1.6"/>
  <path d="M10 12 L14 12 M26 12 L30 12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  <circle cx="22" cy="6" r="2" fill="#ffd23d" stroke="#6b4a1a" stroke-width="1"/></svg>`;

// ---------- Modelo ilustrado (imagens geradas por IA, assinadas pela vila) ----------
// Duas versões à escolha: a ilustrada (cenário pintado e um atlas com a cabine, a raposa passageira, janelas,
// porta e bandeira) e a leve (desenhos em código, sem internet e em celular fraco). O atlas guarda o retângulo
// exato de cada figura [x, y, largura, altura]; `spr` recorta por ele na escala pedida (px por px do atlas).
// Sem internet (ou imagem lenta), o jogo cai sozinho no modelo leve.
const IMG = { cenario: new URL("./img/cenario.webp", import.meta.url).href, atlas: new URL("./img/atlas.webp", import.meta.url).href };
const ATLAS = { w: 864, h: 432 };
const RET = {"cabine": [33, 4, 149, 208], "cabine-feliz": [255, 4, 137, 196], "cabine-preocupada": [471, 4, 138, 202], "tome": [697, 16, 118, 183], "janela": [50, 249, 116, 150], "janela-acesa": [269, 239, 109, 170], "bandeira": [489, 252, 101, 144], "porta": [691, 234, 133, 180]};
const spr = criarSprites(IMG.atlas, ATLAS.w, ATLAS.h, RET);

// Dificuldade de cada fase na mesma escala do nível das crianças.
export const dificuldade = (f) => { const m = menorCaminho(f); return m === null ? 1150 : 600 + 65 * m; };

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const LISTA = guiada ? [GUIADAS[guiada - 1]] : FASES;
  const sugerida = ctx && !guiada ? FASES.indexOf(ctx.sugerir(FASES, dificuldade)) : -1;
  // A fase escolhida pela criança nos ajustes vale até ela escolher outra; sem escolha, vale a sugerida pelo nível.
  const escolhida = guiada ? null : escolhaDaCrianca(ctx, "elevador:fase");
  let fase = guiada ? 0 : escolhida !== null ? Math.min(escolhida, FASES.length - 1) : sugerida >= 0 ? sugerida : 0;
  let andar, apertos, fim, historico, vivo = true, repetindo = false;
  // A cena nasce no leve e só troca para o ilustrado se as imagens chegarem em 0,8 s (ver `abrirIlustrado` no util).
  const querIlustrado = visualIlustrado(ctx, "elevador:visual");
  let ilustrado = false;
  // Passageira (a raposa): contente, feliz ao chegar, preocupada (nunca com medo) quando a criança aperta
  // "Não dá!" numa fase que tem jeito, ou se ficar sem saída. Volta a ficar contente no próximo toque.
  let duvida = false;
  const preso = () => !fim && !repetindo && caminho(f(), andar) === null && caminho(f(), f().inicio) !== null;
  const humor = () => (andar === f().alvo ? "feliz" : duvida || preso() ? "preocupada" : "contente");
  const NOME_CABINE = { contente: "cabine", feliz: "cabine-feliz", preocupada: "cabine-preocupada" };
  const bandeira = (tamLeve, kIlu) => (ilustrado ? spr("bandeira", kIlu) : arte("bandeira", tamLeve));
  const botaoTome = () => (ilustrado ? spr("tome", 0.3) : arte("tome", 46));

  palco.innerHTML = `
    <section class="jg el">
      ${faixa(arte("elevador", 54), "Elevador de botões", { ajustes: !guiada })}
      <p class="el-fase-atual" id="el-fase-atual"></p>
      <p class="el-rota" id="el-rota"></p>
      <div class="el-cena${querIlustrado ? " carregando" : ""}">
        <button type="button" class="el-tome" aria-label="Tomé, o bisão. Toque para ouvir a história do jogo.">${botaoTome()}</button>
        <div class="el-corpo">
          <div class="el-predio-moldura"><ol class="el-predio" id="el-predio" aria-label="Prédio"></ol></div>
          <div class="el-painel">
            <p class="el-visor" id="el-visor" aria-hidden="true"></p>
            <button type="button" class="el-tecla" id="el-sobe"></button>
            <button type="button" class="el-tecla" id="el-desce"></button>
            <p class="contagem" id="el-contagem"></p>
          </div>
        </div>
      </div>
      <p class="aviso" id="el-aviso" role="status" aria-live="polite"></p>
      <div class="acoes">
        <button type="button" class="botao dourado" id="el-dica"></button>
        <button type="button" class="botao" id="el-desfazer">${icone("desfazer")} Desfazer</button>
        <button type="button" class="botao" id="el-naoda">Não dá!</button>
        <button type="button" class="botao" id="el-recomecar" data-nova-partida>${icone("recomecar")} Recomeçar</button>
      </div>
      <button type="button" class="botao principal" id="el-proxima" data-nova-partida hidden>Próxima fase ${icone("play")}</button>
    </section>`;

  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Visual do jogo</span><div id="el-visual" class="escolhas" data-nova-partida></div>
    <p class="el-dica-visual">O ilustrado tem desenhos mais ricos e precisa de internet. O leve funciona sem internet e em celular mais simples.</p>
    <span class="rotulo">Escolher fase</span><div id="el-fases" class="escolhas el-fases" data-nova-partida></div>`;
  escolhas(ajustes.querySelector("#el-visual"), [["ilustrado", "Ilustrado"], ["leve", "Leve"]], querIlustrado ? "ilustrado" : "leve", (v) => {
    guardarEscolha(ctx, "elevador:visual", v);
    ctx?.reiniciar?.();
  });
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>Este elevador só tem dois botões: um sobe, o outro desce, sempre o mesmo número de andares.</li>
      <li>Leve o elevador até o andar da bandeira, apertando o menos possível.</li>
      <li>Às vezes não tem jeito. Se descobrir que é impossível, toque em "Não dá!".</li>
      <li>Outras fases ficam no botão de ajustes.</li></ul>`,
    imprimir: () => ({
      titulo: "Elevador de botões",
      html: `<p>Cada elevador só tem dois botões: um sobe, o outro desce, sempre o mesmo número de andares.
        Descubra quantos apertos, no mínimo, levam ao andar pedido. Cuidado: algumas fases são impossíveis!
        Não dá para passar do último andar nem descer abaixo do térreo.</p>
        <table><tr><th>Fase</th><th>Prédio</th><th>Sai do</th><th>Botões</th><th>Chegar ao</th><th>Seus apertos</th></tr>
        ${FASES.map((f, i) => `<tr><td>${i + 1}</td><td>térreo ao ${f.topo}º</td><td>${nomeAndar(f.inicio)}</td>
          <td>sobe ${f.sobe} · desce ${f.desce}</td><td>${nomeAndar(f.alvo)}</td><td>&nbsp;</td></tr>`).join("")}</table>
        <div class="quebra"><h2>Respostas (não espie antes!)</h2>
        <table><tr><th>Fase</th><th>Menor número de apertos</th></tr>
        ${FASES.map((f, i) => { const m = menorCaminho(f); return `<tr><td>${i + 1}</td><td>${m === null ? "impossível" : m}</td></tr>`; }).join("")}</table></div>`,
    }),
    passos: () => [
      { alvo: "#el-sobe", texto: "Este botão sobe" },
      { alvo: "#el-desce", texto: "Este desce" },
      { alvo: ".el-predio li.alvo", texto: "Chegue ao andar da bandeira" },
    ],
  });

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#el-aviso");
  const f = () => LISTA[fase];
  const nomeBotao = (andarNovo) => (andarNovo > andar ? `sobe ${f().sobe}` : `desce ${f().desce}`);

  // ---------- Dicas em degraus: pensar de trás para a frente ----------
  const dicas = dicasEmDegraus(palco, {
    botao: $("#el-dica"),
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (fim) return null;
      const daqui = caminho(f(), andar);
      if (!daqui) {
        if (!caminho(f(), f().inicio)) {
          return {
            pergunta: "Os andares em que você consegue parar têm algo em comum? Olhe bem para os números.",
            regiao: ".el-predio li.alvo", jogada: "#el-naoda",
            textoJogada: "Com esses botões, o andar da bandeira nunca aparece. Toque em Não dá!",
            porque: "Com esses dois botões, só dá para parar em alguns andares, e o da bandeira não é um deles. Toque em Não dá!",
          };
        }
        return { pergunta: "Parece que você ficou preso num andar sem saída. Que tal voltar um aperto?", jogada: "#el-desfazer", textoJogada: "Toque em Desfazer.", porque: "Desse andar não dá para chegar. Toque em Desfazer." };
      }
      const [, proximo] = daqui;
      const penultimo = daqui[daqui.length - 2];
      const botao = proximo > andar ? "#el-sobe" : "#el-desce";
      return {
        pergunta: daqui.length > 2
          ? `De qual andar dá para chegar ao ${nomeAndar(f().alvo)} com um só aperto?`
          : `Olhe para o andar da bandeira. Qual botão leva até lá?`,
        regiao: `.el-predio li[data-n="${penultimo}"]`,
        jogada: botao,
        textoJogada: `Aperte "${nomeBotao(proximo)}".`,
        porque: `Aperte "${nomeBotao(proximo)}": assim você vai para o ${nomeAndar(proximo)}, que está no caminho mais curto.`,
      };
    },
  });

  function iniciar(n) {
    fase = n;
    // Quem escolheu a fase segue dali (inclusive com "Próxima fase"); quem não escolheu segue o nível.
    if (!guiada && escolhaDaCrianca(ctx, "elevador:fase") !== null) guardarEscolha(ctx, "elevador:fase", fase);
    andar = f().inicio; apertos = 0; fim = false; historico = []; duvida = false;
    aviso.textContent = ""; aviso.className = "aviso";
    $("#el-proxima").hidden = true;
    $("#el-fase-atual").textContent = guiada ? "" : `Fase ${fase + 1} de ${FASES.length}`; // na fase guiada, a barra do app já mostra o progresso
    ajustes.querySelector("#el-fases").innerHTML = FASES.map((_, i) =>
      `<button type="button" aria-pressed="${i === fase}" data-i="${i}" class="${i === sugerida ? "sugerida" : ""}">${i + 1}</button>`).join("");
    desenhar();
  }

  function desenhar() {
    const fa = f();
    // Prédios mais altos têm andares mais baixos no modelo ilustrado, para a cabine e a bandeira caberem juntas na tela.
    const ah = fa.topo <= 9 ? 52 : fa.topo <= 12 ? 46 : 40, e = ah / 52;
    $("#el-predio").style.setProperty("--ah", `${ah}px`);
    $("#el-predio").style.setProperty("--e", String(e));
    const linhas = [];
    for (let n = fa.topo; n >= 0; n--) {
      const estado = [n === andar && `o elevador está aqui, com a raposa ${humor()}${humor() === "preocupada" ? (preso() ? " (sem saída: toque em Desfazer)" : " (tem jeito, sim: continue tentando)") : ""}`, n === fa.alvo && "andar da bandeira"].filter(Boolean).join(", ");
      linhas.push(`<li data-n="${n}" class="${n === andar ? "aqui" : ""} ${n === fa.alvo ? "alvo" : ""} ${n === 0 ? "terreo" : ""}">
        <span class="num">${nomeAndar(n)}</span>
        <span class="poco">${n === andar ? `<span class="cabine-peca" data-peca="cabine">${ilustrado ? spr(NOME_CABINE[humor()], 0.32 * e) : CABINE}</span>` : ""}</span>
        <span class="janelas" aria-hidden="true">${ilustrado
          ? [0, 1, 2].map((k) => (n === 0 && k === 1 ? spr("porta", 0.19 * e) : spr(n === andar ? "janela-acesa" : "janela", 0.165 * e))).join("")
          : "<i></i><i></i><i></i>"}</span>
        <span class="bandeira">${n === fa.alvo ? bandeira(26, 0.2 * e) : ""}</span>
        ${estado ? `<span class="so-leitor">: ${estado}</span>` : ""}</li>`);
    }
    $("#el-predio").innerHTML = linhas.join("");
    $("#el-rota").innerHTML = andar === fa.alvo
      ? `${bandeira(22, 0.16)} Chegou ${aoAndar(fa.alvo)}!`
      : `<span>Está ${noAndar(andar)}</span> <span class="el-rota-alvo">${bandeira(22, 0.16)} Chegar ${aoAndar(fa.alvo)}</span>`;
    $("#el-visor").textContent = nomeAndar(andar);
    const sobe = $("#el-sobe"), desce = $("#el-desce");
    const semCima = andar + fa.sobe > fa.topo, semBaixo = andar - fa.desce < 0;
    sobe.innerHTML = `<span class="seta">▲</span><b>${fa.sobe}</b><small>${semCima ? "sem andar" : "sobe"}</small>`;
    desce.innerHTML = `<span class="seta">▼</span><b>${fa.desce}</b><small>${semBaixo ? "sem andar" : "desce"}</small>`;
    sobe.setAttribute("aria-label", `Subir ${andares(fa.sobe)}` + (semCima ? ". Não dá: passaria do último andar." : ""));
    desce.setAttribute("aria-label", `Descer ${andares(fa.desce)}` + (semBaixo ? ". Não dá: ficaria abaixo do térreo." : ""));
    sobe.classList.toggle("sem-andar", semCima);
    desce.classList.toggle("sem-andar", semBaixo);
    sobe.disabled = fim || repetindo || semCima;
    desce.disabled = fim || repetindo || semBaixo;
    $("#el-naoda").disabled = fim || repetindo;
    $("#el-desfazer").disabled = fim || repetindo || !historico.length;
    // Sem saída: o Desfazer ganha destaque (é o caminho de volta, sem bronca).
    $("#el-desfazer").classList.toggle("dourado", preso());
    $("#el-recomecar").disabled = repetindo;
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo; // trocar o desafio no meio da repetição misturaria tudo
    $("#el-dica").hidden = fim || repetindo;
    if (!repetindo) $("#el-contagem").textContent = `Apertos: ${apertos}`;
    dicas.reaplicar();
  }

  function terminar(texto, certo, perfeito, placar) {
    fim = true;
    if (certo) {
      const trajeto = [...historico, andar];
      if (trajeto.length > 1) ctx?.definirReplay?.(() => mostrarSolucao(trajeto));
      ctx?.registrarSolo(dificuldade(f()), Math.max(0.4, (placar ?? 1) - dicas.usados * 0.05),
        menorCaminho(f()) === null ? `Descobriu que a fase ${fase + 1} era impossível e explicou com o "Não dá!".` : `Levou o elevador ${f().alvo === 0 ? "ao térreo" : `ao ${nomeAndar(f().alvo)} andar`} com ${apertos} apertos (fase ${fase + 1}).`);
      ctx?.fala("resolveu");
      if (!guiada && menorCaminho(f()) === null) ctx?.conquistar?.("elevador-impossivel");
      if (!guiada && perfeito && dicas.usados === 0 && menorCaminho(f()) !== null) ctx?.conquistar?.("elevador-direto");
      if (!guiada && fase === FASES.length - 1) ctx?.conquistar?.("elevador-topo");
    }
    som(certo ? "vitoria" : "erro");
    if (perfeito) festa();
    aviso.textContent = texto;
    aviso.className = "aviso " + (certo ? "certo" : "erro");
    $("#el-proxima").hidden = guiada || !certo || fase === FASES.length - 1;
    desenhar();
  }

  // Repete o trajeto da criança, andar por andar.
  async function mostrarSolucao(trajeto) {
    repetindo = true;
    const final = andar;
    ctx?.dizer?.("Olha o caminho que você fez, aperto por aperto!", "feliz");
    await repetir(trajeto, (n, i) => {
      const antes = posicoes($("#el-predio"), "[data-peca]");
      andar = n; desenhar();
      mover($("#el-predio"), "[data-peca]", antes, { duracao: 500 });
      $("#el-contagem").textContent = i === 0 ? "Começo" : `Aperto ${i}`;
    }, { intervalo: 1000, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false; andar = final; desenhar();
  }

  function apertar(delta) {
    if (fim) return;
    duvida = false;
    const antes = posicoes($("#el-predio"), "[data-peca]");
    historico.push(andar);
    andar += delta; apertos += 1;
    if (andar === f().alvo) {
      const minimo = menorCaminho(f());
      terminar(apertos === minimo
        ? `Chegou com ${apertos} apertos. Impossível fazer com menos!`
        : `Chegou com ${apertos} apertos. Dá para chegar com ${minimo}. Quer tentar de novo?`, true, apertos === minimo, apertos === minimo ? 1 : 0.6);
    } else {
      som("nota", andar);
      aviso.textContent = ""; aviso.className = "aviso";
      desenhar();
      if (preso()) {
        aviso.textContent = "Hmm, daqui não dá para chegar ao andar da bandeira. Tudo bem: errar faz parte de pensar. Toque em Desfazer e o elevador volta.";
        aviso.className = "aviso erro";
      }
    }
    mover($("#el-predio"), "[data-peca]", antes, { duracao: 500 });
    dicas.zerar();
  }

  $("#el-sobe").addEventListener("click", () => apertar(f().sobe));
  $("#el-desce").addEventListener("click", () => apertar(-f().desce));
  $("#el-recomecar").addEventListener("click", () => { iniciar(fase); dicas.zerar(); });
  $("#el-desfazer").addEventListener("click", () => {
    if (fim || !historico.length) return;
    duvida = false;
    const antes = posicoes($("#el-predio"), "[data-peca]");
    andar = historico.pop(); apertos -= 1; som("solta");
    aviso.textContent = ""; aviso.className = "aviso";
    desenhar(); dicas.zerar();
    mover($("#el-predio"), "[data-peca]", antes, { duracao: 500 });
  });
  $("#el-proxima").addEventListener("click", () => { iniciar(fase + 1); dicas.zerar(); });
  ajustes.querySelector("#el-fases").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) { guardarEscolha(ctx, "elevador:fase", Number(b.dataset.i)); iniciar(Number(b.dataset.i)); jogo.fecharAjustes(); dicas.zerar(); }
  });
  $("#el-naoda").addEventListener("click", () => {
    const minimo = menorCaminho(f());
    if (minimo === null) terminar("Isso mesmo: nesta fase não tem jeito de chegar lá. Consegue explicar por quê?", true, true);
    else {
      som("erro"); duvida = true; desenhar();
      aviso.textContent = "Tem jeito, sim! Tudo bem errar: continue tentando."; aviso.className = "aviso erro";
    }
  });

  $(".el-tome").hidden = !ctx?.historia;
  $(".el-tome").addEventListener("click", () => { som("nota", 1); jogo.abrirHistoria(); });
  if (querIlustrado) {
    abrirIlustrado([IMG.cenario, IMG.atlas], {
      vivo: () => vivo,
      aplicar: () => {
        ilustrado = true;
        $(".el-cena").classList.add("ilustrado");
        $(".el-tome").innerHTML = botaoTome();
        desenhar();
      },
      revelar: () => $(".el-cena").classList.remove("carregando"),
    });
  }
  iniciar(fase);
  setTimeout(() => {
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho. Desconfie: será que dá para chegar lá?");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
