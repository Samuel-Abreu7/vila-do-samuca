// Samuca, a coruja: o Portal jogando como "mais uma criança".
// Tem humores (feliz, pensando, surpreso, sonolento) e bate as asas quando a criança vence.
import { sortear, botaoOuvir } from "./util.js";

export const NOME = "Samuca";

const OLHOS = {
  normal: `<circle class="olho" cx="37" cy="43" r="6" fill="#1b1f3a"/><circle class="olho" cx="63" cy="43" r="6" fill="#1b1f3a"/>
           <circle cx="39" cy="40" r="2" fill="#fff"/><circle cx="65" cy="40" r="2" fill="#fff"/>`,
  feliz: `<path d="M28 45 q7 -9 14 0 M58 45 q7 -9 14 0" stroke="#1b1f3a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  pensando: `<circle class="olho" cx="39" cy="37" r="6" fill="#1b1f3a"/><circle class="olho" cx="65" cy="37" r="6" fill="#1b1f3a"/>
             <circle cx="41" cy="35" r="2" fill="#fff"/><circle cx="67" cy="35" r="2" fill="#fff"/>`,
  surpreso: `<circle cx="35" cy="42" r="8" fill="#1b1f3a"/><circle cx="65" cy="42" r="8" fill="#1b1f3a"/>
             <circle cx="37" cy="39" r="2.5" fill="#fff"/><circle cx="67" cy="39" r="2.5" fill="#fff"/>`,
  sonolento: `<path d="M27 44 q8 5 16 0 M57 44 q8 5 16 0" stroke="#1b1f3a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  dormindo: `<path d="M27 44 q8 5 16 0 M57 44 q8 5 16 0" stroke="#1b1f3a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};
const BICO = {
  normal: `<path d="M45 52 L55 52 L50 61 Z" fill="#ff9a3c" stroke="#c85f0f" stroke-width="1.5" stroke-linejoin="round"/>`,
  surpreso: `<path d="M45 52 L55 52 L50 58 Z" fill="#ff9a3c" stroke="#c85f0f" stroke-width="1.5"/><ellipse cx="50" cy="63" rx="4" ry="4.5" fill="#6b2a10"/>`,
};
const EXTRA = {
  pensando: `<g fill="#fff" opacity=".9"><circle cx="86" cy="18" r="6"/><circle cx="78" cy="30" r="3.5"/></g>`,
  dormindo: `<path d="M24 26 Q36 -6 78 10 Q66 20 76 30 Q50 22 24 26 Z" fill="#5b8fce"/><circle cx="80" cy="12" r="6" fill="#fff"/>
    <text x="80" y="44" font-family="Lilita One, sans-serif" font-size="14" fill="#fff">z</text><text x="88" y="34" font-family="Lilita One, sans-serif" font-size="10" fill="#fff">z</text>`,
  sonolento: `<text x="76" y="22" font-family="Lilita One, sans-serif" font-size="16" fill="#fff">z</text><text x="86" y="12" font-family="Lilita One, sans-serif" font-size="11" fill="#fff">z</text>`,
};

export const retrato = (tam = 72, humor = "normal") => `
<svg class="samuca humor-${humor}" width="${tam}" height="${tam}" viewBox="0 0 100 100" aria-hidden="true">
  <path d="M22 30 L30 8 L40 26 Z M78 30 L70 8 L60 26 Z" fill="#7a4a24"/>
  <g class="asa asa-e"><path d="M18 58 q-10 16 4 30 q6 -14 2 -30 Z" fill="#7a4a24"/></g>
  <g class="asa asa-d"><path d="M82 58 q10 16 -4 30 q-6 -14 -2 -30 Z" fill="#7a4a24"/></g>
  <ellipse cx="50" cy="58" rx="34" ry="37" fill="#9a6232"/>
  <ellipse cx="50" cy="70" rx="21" ry="21" fill="#e9c58f"/>
  <path d="M39 64 q4 4 8 0 M49 72 q4 4 8 0 M43 80 q4 4 8 0 M54 62 q4 4 8 0" stroke="#c49a5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="35" cy="42" r="15" fill="#ffc83d"/><circle cx="65" cy="42" r="15" fill="#ffc83d"/>
  <circle cx="35" cy="42" r="11" fill="#fff"/><circle cx="65" cy="42" r="11" fill="#fff"/>
  ${OLHOS[humor] || OLHOS.normal}
  ${BICO[humor] || BICO.normal}
  ${humor === "feliz" ? `<circle cx="24" cy="56" r="5" fill="#ff8a8e" opacity=".6"/><circle cx="76" cy="56" r="5" fill="#ff8a8e" opacity=".6"/>` : ""}
  ${EXTRA[humor] || ""}
</svg>`;

const FALAS = {
  oi: ["Oi, {nome}! Bora pensar?", "E aí, {nome}? Hoje eu tô afiado!", "{nome}! Estava te esperando."],
  pensando: ["Hmm, deixa eu pensar…", "Humm… essa é boa.", "Calma, tô calculando…"],
  ganhei: ["Essa foi apertada! Revanche?", "Ganhei esta, mas você está ficando fera nisso.", "Ufa! Quase você me pegou."],
  perdi: ["Uau, você me pegou!", "Não acredito! Mandou muito bem.", "Tá bom, tá bom… você venceu. Mais uma?"],
  dica: ["Psiu… que tal esta aqui?", "Se eu fosse você, olharia esta.", "Dica de coruja: esta!"],
  resolveu: ["Resolveu! Eu sabia que você conseguia.", "Isso aí! Cabeça de coruja!", "Muito bem pensado!"],
  tarde: ["Uaaah… já está ficando tarde. Mais uma e depois descansar?", "Até coruja precisa dormir às vezes… que tal parar logo?"],
  conquista: ["Nova conquista na sua estante!", "Olha só! Isso vai para a sua estante."],
  quase: ["Faltam uns 10 minutinhos de jogo hoje. Dá para mais uma partida calma.", "Estou ficando com sono… só mais um pouquinho hoje."],
  dormir: ["Uaaah… hoje já deu. Boa noite! Amanhã tem mais.", "Minhas penas estão pedindo cama. Até amanhã!"],
  pausa: ["Já faz um tempinho que a gente joga. Que tal uma pausa?", "Minhas penas estão pedindo um descanso. Bora dar uma pausa?"],
};
const HUMOR = { oi: "feliz", pensando: "pensando", ganhei: "feliz", perdi: "surpreso", dica: "normal", resolveu: "feliz", tarde: "sonolento", conquista: "feliz", pausa: "sonolento", quase: "sonolento", dormir: "dormindo" };

export const fala = (tipo, nome = "") => sortear(FALAS[tipo]).replace("{nome}", nome);
export const humorDe = (tipo) => HUMOR[tipo] || "normal";
export const tardeDaNoite = () => { const h = new Date().getHours(); return h >= 21 || h < 6; };

// Balão com o Samuca falando.
export function balao(texto, humor = "normal") {
  const el = document.createElement("div");
  el.className = "balao-samuca";
  el.innerHTML = `<span class="rosto">${retrato(56, humor)}</span><p></p>`;
  el.querySelector("p").textContent = texto;
  el.append(botaoOuvir(() => el.querySelector("p").textContent, "Ouvir o Samuca"));
  return el;
}

// Fala um texto específico (dicas, fases guiadas, repetição da solução).
export function dizerTexto(el, texto, humor = "normal") {
  if (!el || !texto) return;
  el.querySelector("p").textContent = texto;
  el.querySelector(".rosto").innerHTML = retrato(56, humor);
  el.classList.remove("falou"); void el.offsetWidth; el.classList.add("falou");
}

// Só é chamado em resposta a um toque da criança: o Samuca nunca fala ou muda sozinho.
export function dizer(el, tipo, nome = "") {
  if (!el) return;
  el.querySelector("p").textContent = fala(tipo, nome);
  el.querySelector(".rosto").innerHTML = retrato(56, humorDe(tipo));
  el.classList.remove("falou", "comemora"); void el.offsetWidth;
  el.classList.add("falou");
  if (tipo === "perdi" || tipo === "resolveu" || tipo === "conquista") el.classList.add("comemora");
}
