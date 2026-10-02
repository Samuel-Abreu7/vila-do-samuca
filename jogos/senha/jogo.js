// Senha — da brincadeira tradicional de papel e lápis "Touros e vacas" (domínio público).
// O Samuca guarda no cofre uma senha de frutas diferentes; cada tentativa recebe duas pistas:
// quantas frutas estão no lugar certo e quantas estão na senha, mas em outro lugar.
// Sem limite de tentativas (nada de "game over"). Nada de pinos coloridos nem tabuleiro de
// jogo comercial: as pistas são escritas em palavras e as figuras são frutas.
import { carregarEstilo, escolhas, faixa, som, festa, prepararJogo, sortear, dicasEmDegraus, repetir, escolhaDaCrianca, guardarEscolha } from "../../util.js";
import { arte, icone, NOME_DESENHO } from "../../arte.js";

const FRUTAS = ["maca", "banana", "uva", "laranja", "morango", "pera"];
const nomeFruta = (f) => NOME_DESENHO[f].toLowerCase();

export const NIVEIS = [
  { id: "pequeno", nome: "3 frutas de 4", tam: 3, frutas: 4, meta: 4, dificuldade: 600 },
  { id: "medio", nome: "3 frutas de 6", tam: 3, frutas: 6, meta: 5, dificuldade: 800 },
  { id: "grande", nome: "4 frutas de 6", tam: 4, frutas: 6, meta: 6, dificuldade: 1050 },
];
// Fases guiadas: 1) duas frutas de três, com guia; 2) três de quatro, com guia; 3) três de quatro, sozinho.
const GUIADAS = {
  1: { id: "g1", nome: "de treino", tam: 2, frutas: 3, meta: 3, dificuldade: 400 },
  2: { id: "g2", nome: "de treino", tam: 3, frutas: 4, meta: 4, dificuldade: 500 },
  3: { id: "g3", nome: "de treino", tam: 3, frutas: 4, meta: 4, dificuldade: 550 },
};

// ---------- Pistas e resolvedor ----------
export function pistas(senha, tentativa) {
  let lugar = 0, fora = 0;
  tentativa.forEach((f, i) => { if (senha[i] === f) lugar++; else if (senha.includes(f)) fora++; });
  return { lugar, fora };
}
// Todas as senhas possíveis (frutas diferentes) com `tam` lugares, usando as `n` primeiras frutas.
export function todas(tam, frutas) {
  const lista = [];
  const montar = (atual) => {
    if (atual.length === tam) { lista.push(atual); return; }
    for (const f of frutas) if (!atual.includes(f)) montar([...atual, f]);
  };
  montar([]);
  return lista;
}
// Senhas que combinam com todas as tentativas feitas até agora.
export const combinam = (candidatas, historico) =>
  candidatas.filter((c) => historico.every((h) => { const p = pistas(c, h.tentativa); return p.lugar === h.lugar && p.fora === h.fora; }));
// Sugestão de tentativa: uma senha que ainda combina e que, no pior caso, deixa menos senhas sobrando.
export function sugestao(candidatas, possiveis) {
  if (possiveis.length <= 2) return possiveis[0];
  let melhor = possiveis[0], nota = Infinity;
  for (const t of possiveis) {
    const grupos = new Map();
    for (const c of possiveis) { const p = pistas(c, t); const k = `${p.lugar}-${p.fora}`; grupos.set(k, (grupos.get(k) || 0) + 1); }
    const pior = Math.max(...grupos.values());
    if (pior < nota) { nota = pior; melhor = t; }
  }
  return melhor;
}

const textoPistas = ({ lugar, fora }) =>
  lugar === 0 && fora === 0 ? "Nenhuma destas frutas está no cofre."
  : [lugar ? `${lugar} no lugar certo` : "", fora ? `${fora} na senha, mas em outro lugar` : ""].filter(Boolean).join(" e ") + ".";

export const dificuldade = (n) => n.dificuldade;

export function montar(palco, ctx) {
  carregarEstilo(new URL("./jogo.css", import.meta.url));
  const guiada = ctx?.tutorial || 0;
  const sugerido = ctx && !guiada ? ctx.sugerir(NIVEIS, dificuldade) : null;
  const escolhido = guiada ? null : NIVEIS.find((n) => n.id === escolhaDaCrianca(ctx, "senha:nivel"));
  let nivel = guiada ? GUIADAS[guiada] : escolhido ?? sugerido ?? NIVEIS[0];
  let frutas, senha, candidatas, historico, atual, fim, vivo = true, repetindo = false;

  palco.innerHTML = `
    <section class="jg sn">
      ${faixa(arte("cofre", 54), "Senha", { ajustes: !guiada })}
      <p class="sn-nivel" id="sn-nivel"></p>
      <div class="sn-cofre" id="sn-cofre">
        <div class="sn-porta">
          <p class="sn-porta-titulo" id="sn-porta-titulo">Sua tentativa</p>
          <div class="sn-atual" id="sn-atual" role="group" aria-labelledby="sn-porta-titulo"></div>
          <div class="sn-macaneta" aria-hidden="true"></div>
        </div>
        <div class="sn-dentro" id="sn-dentro" hidden></div>
      </div>
      <p class="sn-escolha" id="sn-escolha-titulo">Toque nas frutas para montar a senha:</p>
      <div class="sn-bandeja" id="sn-bandeja" role="group" aria-labelledby="sn-escolha-titulo" data-teclado=".sn-fruta"></div>
      <button type="button" class="botao principal" id="sn-tentar">${icone("play")} Tentar esta senha</button>
      <p class="aviso" id="sn-aviso" role="status" aria-live="polite"></p>
      <ol class="sn-historico" id="sn-historico" aria-label="Tentativas e pistas"></ol>
      <div class="acoes">
        <button type="button" class="botao dourado" id="sn-dica"></button>
        <button type="button" class="botao" id="sn-apagar">${icone("desfazer")} Apagar</button>
      </div>
      <button type="button" class="botao" id="sn-nova" data-nova-partida>${icone("recomecar")} Nova senha</button>
      <p class="contagem" id="sn-contagem"></p>
    </section>`;

  const $ = (s) => palco.querySelector(s);
  const aviso = $("#sn-aviso");
  const ajustes = document.createElement("div");
  ajustes.innerHTML = `<span class="rotulo">Tamanho da senha</span><div id="sn-niveis" data-nova-partida></div>`;
  const jogo = prepararJogo(palco, {
    ctx, ajustes: guiada ? null : ajustes, tutorial: true,
    regras: `<ul>
      <li>O Samuca trancou no cofre uma senha de frutas. Cada fruta aparece uma vez só.</li>
      <li>Toque nas frutas para montar uma tentativa e depois em "Tentar esta senha".</li>
      <li>As pistas dizem quantas frutas estão no lugar certo e quantas estão na senha, mas em outro lugar.</li>
      <li>Pode tentar quantas vezes quiser. Use as pistas das tentativas anteriores.</li></ul>`,
    imprimir: () => papel(),
    passos: () => [
      { alvo: ".sn-fruta", texto: "Toque numa fruta" },
      { alvo: "#sn-tentar", texto: "Depois, tente a senha" },
      { alvo: "#sn-historico", texto: "As pistas aparecem aqui" },
    ],
  });

  // ---------- Dicas em degraus: o que as pistas já garantem, e uma tentativa que combina com todas ----------
  const dicas = dicasEmDegraus(palco, {
    botao: $("#sn-dica"),
    guiado: guiada === 1 || guiada === 2,
    dizer: (t) => ctx?.dizer?.(t),
    calcular() {
      if (fim) return null;
      const possiveis = combinam(candidatas, historico);
      const t = sugestao(candidatas, possiveis);
      const foraDoCofre = frutas.filter((f) => !possiveis.some((c) => c.includes(f)));
      const certos = [...Array(nivel.tam).keys()].filter((i) => possiveis.every((c) => c[i] === possiveis[0][i]));
      const lista = t.map(nomeFruta).join(", ");
      let pergunta = "Olhe as pistas das tentativas. Que frutas com certeza estão no cofre?";
      let regiao = "#sn-historico";
      if (!historico.length) { pergunta = "Ainda não tem pistas. Tente qualquer senha: a primeira tentativa serve para descobrir quais frutas estão no cofre."; regiao = "#sn-bandeja"; }
      else if (foraDoCofre.length) { pergunta = "Tem alguma fruta que com certeza não está no cofre? Olhe as tentativas com poucas pistas."; regiao = foraDoCofre.map((f) => `.sn-fruta[data-f="${f}"]`).join(", "); }
      else if (certos.length) { pergunta = `Tem algum lugar em que só uma fruta pode ficar? Compare as tentativas.`; regiao = "#sn-historico"; }
      return {
        pergunta, regiao,
        jogada: t.map((f) => `.sn-fruta[data-f="${f}"]`).join(", "),
        textoJogada: `Tente, nesta ordem: ${lista}.`,
        porque: possiveis.length === 1
          ? `Só sobrou uma senha que combina com todas as pistas: ${lista}.`
          : `Tente, nesta ordem: ${lista}. Essa senha combina com todas as pistas até agora.`,
      };
    },
  });

  function novaSenha() {
    frutas = FRUTAS.slice(0, nivel.frutas);
    candidatas = todas(nivel.tam, frutas);
    senha = sortear(candidatas);
    historico = []; atual = []; fim = false;
    aviso.textContent = ""; aviso.className = "aviso";
    $("#sn-nivel").textContent = guiada ? "Cofre de treino" : `Senha de ${nivel.nome}`;
    desenhar();
  }

  const fig = (f, tam = 40) => `<span class="sn-fig" aria-hidden="true">${arte(f, tam)}</span>`;

  function desenhar() {
    // Tentativa atual: lugares numerados; tocar num lugar cheio tira a fruta.
    $("#sn-atual").innerHTML = [...Array(nivel.tam).keys()].map((i) => {
      const f = atual[i];
      return `<button type="button" class="sn-lugar ${f ? "cheio" : ""}" data-i="${i}" ${!f || fim || repetindo ? "disabled" : ""}
        aria-label="${f ? `Lugar ${i + 1}: ${nomeFruta(f)}. Toque para tirar.` : `Lugar ${i + 1}: vazio`}">${f ? fig(f, 46) : `<span class="sn-num">${i + 1}</span>`}</button>`;
    }).join("");
    $("#sn-bandeja").innerHTML = frutas.map((f) => {
      const usada = atual.includes(f);
      return `<button type="button" class="sn-fruta ${usada ? "usada" : ""}" data-f="${f}" ${usada || atual.length >= nivel.tam || fim || repetindo ? "disabled" : ""}
        aria-label="${usada ? `${NOME_DESENHO[f]}, já está na tentativa` : `Pôr ${nomeFruta(f)}`}">${fig(f, 44)}<span class="sn-nome">${NOME_DESENHO[f]}</span></button>`;
    }).join("");
    $("#sn-historico").innerHTML = historico.map((h, n) => `
      <li class="sn-linha">
        <span class="sn-n" aria-hidden="true">${n + 1}</span>
        <span class="sn-figs">${h.tentativa.map((f) => fig(f, 30)).join("")}</span>
        <span class="so-leitor">Tentativa ${n + 1}: ${h.tentativa.map(nomeFruta).join(", ")}.</span>
        <span class="sn-pistas">${h.lugar === 0 && h.fora === 0
          ? `<span class="sn-pista zero">✕ nenhuma no cofre</span>`
          : `${h.lugar ? `<span class="sn-pista lugar">✓ ${h.lugar} no lugar certo</span>` : ""}${h.fora ? `<span class="sn-pista fora">↔ ${h.fora} em outro lugar</span>` : ""}`}</span>
      </li>`).join("");
    const cofre = $("#sn-cofre");
    cofre.classList.toggle("aberto", fim);
    $("#sn-dentro").hidden = !fim;
    $("#sn-dentro").innerHTML = fim ? `<span class="sn-dentro-titulo">A senha era:</span>${senha.map((f) => fig(f, 44)).join("")}` : "";
    $("#sn-tentar").disabled = atual.length < nivel.tam || fim || repetindo;
    $("#sn-apagar").disabled = !atual.length || fim || repetindo;
    $("#sn-nova").disabled = repetindo;
    $("#sn-dica").hidden = fim || repetindo;
    const botaoAjustes = palco.querySelector('[data-faixa="ajustes"]');
    if (botaoAjustes) botaoAjustes.disabled = repetindo;
    if (!repetindo) $("#sn-contagem").textContent = historico.length ? `Tentativas: ${historico.length}` : "";
    dicas.reaplicar();
  }

  function tentar() {
    if (atual.length < nivel.tam || fim || repetindo) return;
    const p = pistas(senha, atual);
    historico.push({ tentativa: [...atual], ...p });
    atual = [];
    if (p.lugar === nivel.tam) return terminar();
    som(p.lugar || p.fora ? "ponto" : "toque");
    aviso.className = "aviso";
    aviso.textContent = `Tentativa ${historico.length}: ${textoPistas(p)}`;
    desenhar();
    dicas.zerar();
  }

  function terminar() {
    fim = true;
    const n = historico.length;
    const passos = historico.map((h) => ({ ...h }));
    ctx?.definirReplay?.(() => mostrarPartida(passos));
    const placar = Math.max(0.5, (n <= nivel.meta ? 1 : n <= nivel.meta + 2 ? 0.8 : 0.6) - dicas.usados * 0.04);
    ctx?.registrarSolo(nivel.dificuldade, placar, `Abriu o cofre de ${nivel.tam} frutas em ${n} ${n === 1 ? "tentativa" : "tentativas"}.`);
    som("vitoria");
    if (n <= nivel.meta) festa();
    if (!guiada && nivel.tam === 4) ctx?.conquistar?.("senha-cofre");
    ctx?.fala("resolveu");
    aviso.className = "aviso certo";
    aviso.textContent = `O cofre abriu em ${n} ${n === 1 ? "tentativa" : "tentativas"}!`;
    desenhar();
  }

  // Repete as tentativas da criança, uma por uma, com as pistas de cada uma.
  async function mostrarPartida(passos) {
    repetindo = true;
    const final = historico;
    historico = []; fim = false;
    ctx?.dizer?.("Olha como você descobriu a senha, tentativa por tentativa!", "feliz");
    await repetir(passos, (h, i) => {
      historico = passos.slice(0, i + 1);
      fim = i === passos.length - 1;
      desenhar();
    }, { intervalo: 1100, vivo: () => vivo });
    if (!vivo) return;
    repetindo = false; historico = final; fim = true; desenhar();
  }

  // Versão em papel: tentativas prontas, com pistas, que levam a uma senha só.
  function papel() {
    const cand = candidatas;
    const alvo = sortear(cand);
    const hist = [];
    for (let k = 0; k < 10 && combinam(cand, hist).length > 1; k++) {
      const possiveis = combinam(cand, hist);
      const t = k === 0 ? sortear(cand.filter((c) => c !== alvo)) : sugestao(cand, possiveis.filter((c) => c !== alvo).length ? possiveis.filter((c) => c !== alvo) : possiveis);
      hist.push({ tentativa: t, ...pistas(alvo, t) });
    }
    const linha = (h, n) => `<tr><td>${n + 1}</td><td>${h.tentativa.map(nomeFruta).join(", ")}</td><td>${textoPistas(h)}</td></tr>`;
    return {
      titulo: `Senha (${nivel.nome})`,
      html: `<p>O Samuca trancou uma senha de ${nivel.tam} frutas diferentes, escolhidas entre: ${frutas.map(nomeFruta).join(", ")}.
        Cada tentativa abaixo recebeu pistas. Descubra a senha!</p>
        <table><tr><th>Nº</th><th>Tentativa</th><th>Pistas</th></tr>${hist.map(linha).join("")}</table>
        <p>A senha é: ______________________________</p>
        <div class="quebra gabarito"><h2>Resposta (não espie antes!)</h2><p>${alvo.map(nomeFruta).join(", ")}</p></div>`,
    };
  }

  $("#sn-bandeja").addEventListener("click", (e) => {
    const b = e.target.closest(".sn-fruta");
    if (!b || b.disabled || fim || repetindo || atual.length >= nivel.tam) return;
    atual.push(b.dataset.f);
    som("toque");
    desenhar();
    if (atual.length === nivel.tam) $("#sn-tentar").focus({ preventScroll: true });
  });
  $("#sn-atual").addEventListener("click", (e) => {
    const b = e.target.closest(".sn-lugar.cheio");
    if (!b || fim || repetindo) return;
    atual.splice(Number(b.dataset.i), 1);
    som("solta"); desenhar();
  });
  $("#sn-tentar").addEventListener("click", tentar);
  $("#sn-apagar").addEventListener("click", () => { if (!atual.length || fim) return; atual.pop(); som("solta"); desenhar(); });
  $("#sn-nova").addEventListener("click", () => { som("solta"); novaSenha(); dicas.zerar(); });
  if (!guiada) {
    escolhas(ajustes.querySelector("#sn-niveis"), NIVEIS.map((n) => [n.id, n.nome]), nivel.id, (id) => {
      nivel = NIVEIS.find((n) => n.id === id); guardarEscolha(ctx, "senha:nivel", id); jogo.fecharAjustes(); novaSenha(); dicas.zerar();
    });
    ajustes.querySelectorAll("#sn-niveis button").forEach((b, i) => b.classList.toggle("sugerida", NIVEIS[i] === sugerido));
  }

  novaSenha();
  setTimeout(() => {
    if (guiada === 3) ctx?.dizer?.("Agora tente sozinho. Use as pistas de cada tentativa.");
    dicas.zerar();
  }, 0);
  return () => { vivo = false; jogo.limpar(); palco.innerHTML = ""; };
}
