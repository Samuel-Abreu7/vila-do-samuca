// Nim — jogo antigo; estratégia vencedora descrita por Charles Bouton em 1901.
// Na sua vez, tire quantos palitos quiser de UMA fileira.
import { carregarEstilo, escolhas, ler, sortear, esperar, faixa, som, festa, prepararJogo, voar, dicasEmDegraus, repetir, esc, escolhaDaCrianca, guardarEscolha, visualIlustrado, abrirIlustrado, criarSprites } from "../../util.js";
import { arte, avatar, icone } from "../../arte.js";

const TAMANHOS = { pequeno: [1, 3, 5], medio: [3, 4, 5], grande: [2, 5, 6, 7] };
// Fases guiadas: 1) duas fileiras com guia; 2) três fileiras com guia; 3) sozinho.
const GUIADAS = { 1: [1, 2], 2: [2, 3, 1], 3: [1, 3, 5] };

// Melhor jogada, ou null se a posição está perdida (qualquer jogada serve).
export function melhorJogada(fileiras, ultimoPerde) {
  const grandes = fileiras.filter((n) => n > 1).length;
  if (ultimoPerde && grandes <= 1) {
    // Fim de jogo da versão "último perde": deixar um número ímpar de fileiras com 1 palito.
    const i = fileiras.findIndex((n) => n > 1);
    const unos = fileiras.filter((n) => n === 1).length;
    if (i === -1) return unos % 2 === 0 ? [fileiras.findIndex((n) => n === 1), 1] : null;
    return [i, unos % 2 === 1 ? fileiras[i] : fileiras[i] - 1];
  }
  const soma = fileiras.reduce((a, n) => a ^ n, 0);
  if (soma === 0) return null;
  const i = fileiras.findIndex((n) => (n ^ soma) < n);
  return [i, fileiras[i] - (fileiras[i] ^ soma)];
}

function qualquerJogada(fileiras) {
  const opcoes = [];
  fileiras.forEach((n, i) => { for (let q = 1; q <= n; q++) opcoes.push([i, q]); });
  return sortear(opcoes);
}

// forca: chance (0 a 1) de fazer a melhor jogada em cada lance.
export function jogadaComputador(fileiras, ultimoPerde, forca) {
  return (Math.random() < forca && melhorJogada(fileiras, ultimoPerde)) || qualquerJogada(fileiras);
}

const SEM_PERFIL = [{ id: "visitante", apelido: "Azul", avatar: "🔵" }, { id: "visitante", apelido: "Vermelho", avatar: "🔴" }];

// ---------- Modelo ilustrado (imagens geradas por IA, assinadas pela vila) ----------
// Acampamento pintado de noite, palitos de bambu pintados (os de cabeça vermelha lembravam fósforos) e o Tito,
// o panda da China, que fica feliz quando a criança vence e preocupado, sem bronca, quando perde.
const IMG = { cenario: new URL("./img/cenario.webp", import.meta.url).href, atlas: new URL("./img/atlas.webp", import.meta.url).href };
// ATLAS-INICIO (gerado por embutir-atlas.py; não editar à mão)
const ATLAS = { w: 640, h: 507 };
const RET = {"tito": [2, 0, 181, 282], "tito-feliz": [192, 0, 227, 280], "tito-preocupado": [425, 0, 175, 280], "bambu": [0, 288, 59, 213], "fogueira": [65, 288, 145, 176]};
// ATLAS-FIM
const spr = criarSprites(IMG.atlas, ATLAS.w, ATLAS.h, RET);

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const jogadores = ctx?.jogadores?.length === 2 ? ctx.jogadores : SEM_PERFIL;
  const samuca = jogadores[1].samuca ? jogadores[1] : null;
  const cfg = {
    tamanho: escolhaDaCrianca(ctx, "nim:tamanho") ?? ler("nim:tamanho", "pequeno"),
    ultimoPerde: guiada ? false : escolhaDaCrianca(ctx, "nim:ultimoPerde") ?? ler("nim:ultimoPerde", false),
  };
  // Número da partida: a jogada que o Samuca estava pensando não cai numa partida nova.
  let partida = 0;
  let fileiras, vez, marcado, fim, pensando, dicasRestantes, vitorias = [0, 0], lances = [];
  let vivo = true, repetindo = false;
  // A cena nasce no leve e só troca para o ilustrado se as imagens chegarem em 0,8 s (ver `abrirIlustrado` no util).
  const querIlustrado = visualIlustrado(ctx, "nim:visual");
  let ilustrado = false, clima = "contente", dicasIniciais = 0;
  const htmlTito = () => (ilustrado ? spr(clima === "feliz" ? "tito-feliz" : clima === "preocupado" ? "tito-preocupado" : "tito", 0.33) : arte("tito", 46));

  palco.innerHTML = `
    <section class="jg nim">
      ${faixa(arte("nim", 54), "Nim", { ajustes: !guiada })}
      <div class="placar" id="nim-placar"></div>
      <p class="nim-regra" id="nim-regra"></p>
      <div class="nim-acampamento${querIlustrado ? " carregando" : ""}">
        <button type="button" class="nim-tito" aria-label="Tito, o panda. Toque para ouvir a história do jogo."></button>
        <div class="nim-mesa" id="nim-mesa" data-teclado=".nim-palito"></div>
        <p class="nim-previa" id="nim-previa" aria-live="polite"></p>
        <span class="nim-fogueira">${arte("fogueira", 64)}</span>
      </div>
      <p class="aviso" id="nim-aviso" role="status" aria-live="polite"></p>
      <div class="acoes">
        <button type="button" class="botao principal" id="nim-tirar">Tirar</button>
        <button type="button" class="botao dourado" id="nim-dica"></button>
      </div>
      <button type="button" class="botao" id="nim-nova" data-nova-partida>${icone("recomecar")} Nova partida</button>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#nim-aviso");
  const nome = (k) => esc(jogadores[k].apelido); // vai para innerHTML: sempre escapado
  const humano = (k) => !jogadores[k].samuca;

  const ajustes = document.createElement("div");
  ajustes.className = "nim-cfg";
  ajustes.innerHTML = `
    <div><span class="rotulo">Visual do jogo</span><div id="nim-visual" data-nova-partida></div>
      <p class="nim-dica-visual">O ilustrado tem desenhos mais ricos e precisa de internet. O leve funciona sem internet e em celular mais simples.</p></div>
    <div><span class="rotulo">Tamanho</span><div id="nim-tam" data-nova-partida></div></div>
    <div><span class="rotulo">Quem tira o último palito</span><div id="nim-fim" data-nova-partida></div></div>`;
  escolhas(ajustes.querySelector("#nim-visual"), [["ilustrado", "Ilustrado"], ["leve", "Leve"]], querIlustrado ? "ilustrado" : "leve", (v) => {
    guardarEscolha(ctx, "nim:visual", v);
    ctx?.reiniciar?.();
  });
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>Na sua vez, tire quantos palitos quiser, mas de uma fileira só.</li>
      <li>Toque num palito: ele e todos os que estão à direita dele ficam marcados. Depois toque em "Tirar".</li>
      <li>Nos ajustes você escolhe se quem tira o último palito ganha ou perde.</li>
      <li>Existe um jeito de sempre ganhar. Consegue descobrir?</li></ul>`,
    passos: () => {
      const p = [...palco.querySelectorAll(".nim-palito")].at(-1);
      return [{ alvo: p, texto: "Toque num palito" }, { alvo: "#nim-tirar", texto: "Depois, toque em Tirar" }];
    },
  });

  // ---------- Dicas em degraus (contra o Samuca: 2 por partida; entre crianças: a vantagem combinada) ----------
  const botaoDica = $("#nim-dica");
  const dicas = dicasEmDegraus(palco, {
    botao: botaoDica,
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (fim || pensando || !humano(vez)) return null;
      const melhor = melhorJogada(fileiras, cfg.ultimoPerde);
      if (!melhor) {
        const [i, q] = [fileiras.findIndex((n) => n > 0), 1];
        return {
          pergunta: "Esta posição está difícil: qualquer jogada deixa uma chance para o outro. Qual tira menos?",
          regiao: `.nim-fileira[data-i="${i}"]`,
          jogada: `.nim-palito[data-i="${i}"][data-k="${fileiras[i] - q}"]`,
          textoJogada: "Tire só um e espere o outro errar.", porque: "Tire só um palito. Às vezes é preciso esperar o outro errar.",
        };
      }
      const [i, q] = melhor;
      const iguais = fileiras.filter((n) => n > 0).length === 2;
      const alvos = Array.from({ length: q }, (_, k) => `.nim-palito[data-i="${i}"][data-k="${fileiras[i] - 1 - k}"]`).join(", ");
      return {
        pergunta: iguais ? "Consegue deixar as duas fileiras com o mesmo tanto para o outro?" : "Que jogada deixa o outro sem uma boa saída? Pense em deixar tudo \"em pares\".",
        regiao: `.nim-fileira[data-i="${i}"]`,
        jogada: alvos,
        textoJogada: `Tire ${q} da fileira ${i + 1}.`,
        porque: iguais
          ? `Tire ${q} da fileira ${i + 1}: com as fileiras iguais, você pode sempre copiar o que o outro fizer.`
          : `Tire ${q} da fileira ${i + 1}: assim o outro fica sem boa jogada.`,
      };
    },
  });
  // Cada dica completa gasta uma do estoque; a pergunta (1º degrau) já conta.
  botaoDica.addEventListener("click", () => { if (dicas.degrau === 1) { dicasRestantes[vez] -= 1; } atualizarBotaoDica(); }, { capture: false });
  function atualizarBotaoDica() {
    const bloqueado = fim || pensando || !humano(vez) || repetindo;
    botaoDica.hidden = bloqueado || (dicasRestantes[vez] <= 0 && dicas.degrau === 0 && !guiada);
  }

  function nova() {
    partida += 1;
    fileiras = [...(guiada ? GUIADAS[guiada] : TAMANHOS[cfg.tamanho])];
    vez = guiada ? 0 : ctx?.comeca ?? 0; marcado = null; fim = false; pensando = false;
    const combinadas = ctx?.dicas ?? [0, 0];
    dicasRestantes = samuca ? [Math.max(2, combinadas[0]), 0] : [...combinadas];
    dicasIniciais = dicasRestantes[0]; clima = "contente";
    lances = [[...fileiras]];
    aviso.textContent = ""; aviso.className = "aviso";
    $("#nim-regra").innerHTML = `<span>Regra desta partida:</span> quem tirar o último palito <b>${cfg.ultimoPerde ? "perde" : "ganha"}</b>.`;
    desenhar();
    dicas.zerar();
    if (!humano(vez)) vezDoSamuca();
  }

  function desenhar() {
    $("#nim-placar").innerHTML = [0, 1].map((k) => `
      <div class="j${k + 1} ${vez === k && !fim ? "vez" : ""}"><span>${avatar(jogadores[k].avatar, 30)} ${nome(k)}</span><span>${vitorias[k]}</span></div>`).join("");
    const bloqueado = fim || pensando || !humano(vez) || repetindo;
    const palitos = (q) => `${q} ${q === 1 ? "palito" : "palitos"}`;
    $("#nim-mesa").innerHTML = fileiras.map((n, i) => `
      <div class="nim-fileira ${marcado && marcado[0] === i ? "escolhida" : ""}" data-i="${i}" role="group" aria-label="Fileira ${i + 1}: ${palitos(n)}">
        <span class="nim-num" aria-hidden="true">${i + 1}</span>
        <span class="nim-palitos">
        ${Array.from({ length: n }, (_, k) => {
          const m = marcado && marcado[0] === i && k >= n - marcado[1];
          return `<button type="button" class="nim-palito ${m ? "marcado" : ""}" data-i="${i}" data-k="${k}"${ilustrado ? ` style="${spr.preencher("bambu")}"` : ""}
            aria-label="Palito ${k + 1} da fileira ${i + 1}${m ? ", marcado para tirar" : `. Toque para marcar ${n - k === 1 ? "só este" : `este e os da direita (${n - k})`}`}" ${bloqueado ? "disabled" : ""}></button>`;
        }).join("")}
        ${n === 0 ? `<span class="nim-vazia">vazia</span>` : ""}
        </span>
      </div>`).join("");
    // Antes de confirmar, a criança vê o que vai acontecer.
    let previa = "";
    if (marcado && !pensando && !fim) {
      const [i, q] = marcado, ficam = fileiras[i] - q;
      const acaba = fileiras.every((n, j) => (j === i ? ficam : n) === 0);
      previa = acaba
        ? `Tirando ${palitos(q)}, a mesa fica vazia: ${humano(vez) ? "você tira" : `${nome(vez)} tira`} o último e <b>${cfg.ultimoPerde ? "perde" : "ganha"}</b>.`
        : `Tirando ${palitos(q)} da fileira ${i + 1}, ${ficam === 0 ? "ela fica vazia" : `${ficam === 1 ? "fica" : "ficam"} ${palitos(ficam)} nela`}.`;
    } else if (!bloqueado) previa = "Toque num palito: ele e os da direita ficam marcados.";
    $("#nim-previa").innerHTML = previa;
    $("#nim-tirar").disabled = !marcado || bloqueado;
    $("#nim-tirar").textContent = marcado ? `Tirar ${marcado[1]} da fileira ${marcado[0] + 1}` : "Tirar";
    $("#nim-nova").disabled = repetindo;
    $(".nim-tito").innerHTML = htmlTito();
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo; // trocar o tamanho no meio da repetição misturaria as partidas
    atualizarBotaoDica();
    if (!fim && !pensando && !repetindo) {
      aviso.className = "aviso";
      aviso.textContent = `Vez de ${jogadores[vez].apelido}.`;
    }
    dicas.reaplicar();
  }

  function terminar(vencedor) {
    vitorias[vencedor] += 1;
    fim = true;
    const passos = lances.map((l) => [...l]);
    ctx?.definirReplay?.(() => mostrarPartida(passos));
    ctx?.registrarDuelo?.(vencedor);
    const perdeuProSamuca = samuca && vencedor === 1;
    som(perdeuProSamuca ? "derrota" : "vitoria");
    clima = perdeuProSamuca ? "preocupado" : "feliz";
    if (!perdeuProSamuca) {
      festa();
      if (!guiada && samuca && dicasRestantes[0] === dicasIniciais) ctx?.conquistar?.("nim-sem-dica", 0);
      if (!guiada && samuca) ctx?.conquistar?.("nim-samuca", 0);
      if (!guiada && cfg.ultimoPerde) ctx?.conquistar?.("nim-perde", vencedor);
    }
    if (samuca && !guiada) ctx.fala(vencedor === 1 ? "ganhei" : "perdi");
    aviso.className = perdeuProSamuca ? "aviso" : "aviso certo";
    aviso.textContent = perdeuProSamuca ? `O ${jogadores[1].apelido} ganhou desta vez. Revanche?` : `${jogadores[vencedor].apelido} ganhou!`;
    desenhar();
  }

  async function vezDoSamuca() {
    const p = partida;
    pensando = true;
    if (!guiada) ctx?.fala("pensando");
    aviso.className = "aviso"; aviso.textContent = `${jogadores[vez].apelido} está pensando…`;
    desenhar();
    await esperar(1000);
    if (!vivo || p !== partida) return;
    // Nas fases guiadas o Samuca joga fraquinho: o importante é aprender.
    marcado = jogadaComputador(fileiras, cfg.ultimoPerde, guiada ? 0 : samuca.forca);
    desenhar();
    await esperar(700);
    if (!vivo || p !== partida) return;
    pensando = false;
    tirar(...marcado);
  }

  async function tirar(i, q) {
    const p = partida;
    pensando = true;
    await voar(palco.querySelectorAll(".nim-palito.marcado"));
    if (!vivo || p !== partida) return;
    pensando = false;
    fileiras[i] -= q;
    marcado = null;
    lances.push([...fileiras]);
    if (fileiras.every((n) => n === 0)) return terminar(cfg.ultimoPerde ? 1 - vez : vez);
    vez = 1 - vez;
    som("solta");
    desenhar();
    dicas.zerar();
    if (!humano(vez)) vezDoSamuca();
  }

  // Repete a partida inteira, lance por lance (dos dois jogadores).
  async function mostrarPartida(passos) {
    repetindo = true;
    ctx?.dizer?.("Vamos rever a partida, lance por lance!", "feliz");
    await repetir(passos, (estado, i) => {
      fileiras = [...estado]; marcado = null;
      desenhar();
      aviso.className = "aviso"; aviso.textContent = i === 0 ? "Começo da partida" : `Lance ${i} de ${passos.length - 1}`;
    }, { intervalo: 1200, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false; desenhar();
  }

  $("#nim-mesa").addEventListener("click", (e) => {
    const b = e.target.closest(".nim-palito");
    if (!b || fim || pensando || repetindo) return;
    const i = Number(b.dataset.i), k = Number(b.dataset.k);
    marcado = [i, fileiras[i] - k];
    som("toque");
    desenhar();
  });
  $("#nim-tirar").addEventListener("click", () => { if (marcado && !pensando) tirar(...marcado); });
  $("#nim-nova").addEventListener("click", nova);

  if (!guiada) {
    escolhas(ajustes.querySelector("#nim-tam"), [["pequeno", "1-3-5"], ["medio", "3-4-5"], ["grande", "2-5-6-7"]], cfg.tamanho,
      (v) => { cfg.tamanho = v; guardarEscolha(ctx, "nim:tamanho", v); jogo.fecharAjustes(); nova(); });
    escolhas(ajustes.querySelector("#nim-fim"), [[false, "ganha"], [true, "perde"]], cfg.ultimoPerde,
      (v) => { cfg.ultimoPerde = v; guardarEscolha(ctx, "nim:ultimoPerde", v); jogo.fecharAjustes(); nova(); });
  }

  $(".nim-tito").hidden = !ctx?.historia;
  $(".nim-tito").addEventListener("click", () => { som("nota", 1); jogo.abrirHistoria(); });
  if (querIlustrado) {
    abrirIlustrado([IMG.cenario, IMG.atlas], {
      vivo: () => vivo,
      aplicar: () => { ilustrado = true; $(".nim-acampamento").classList.add("ilustrado"); if (fileiras) desenhar(); },
      revelar: () => $(".nim-acampamento").classList.remove("carregando"),
    });
  }
  setTimeout(() => {
    nova();
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho: deixe o outro sem boa saída.");
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
