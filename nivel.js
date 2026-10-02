// Nível por jogo, no estilo Elo (o ranking do xadrez). As crianças nunca veem o número.
// Referências: 600 = começando, 1000 = firme, 1400+ = craque.
import { registroDoJogo, gravarNivel, crianca } from "./perfis.js";

const VISITANTE = "visitante";

// Nota inicial pela idade informada: 5 anos → 580, 7 anos → 700, 15 anos → 1180.
export const notaInicial = (idade) => 700 + (Math.max(5, Math.min(15, idade || 9)) - 7) * 60;

export function nota(id, jogo) {
  if (!id || id === VISITANTE) return 900;
  const r = registroDoJogo(id, jogo);
  return r?.nota ?? notaInicial(crianca(id)?.idade);
}
export const partidas = (id, jogo) => registroDoJogo(id, jogo)?.partidas ?? 0;

// Chance esperada de A vencer B.
export const esperado = (a, b) => 1 / (1 + 10 ** ((b - a) / 400));

// placar: 1 = venceu com folga, 0 = perdeu; valores no meio contam como meia vitória.
export function atualizar(id, jogo, notaAdversario, placar) {
  if (!id || id === VISITANTE) return;
  const atual = nota(id, jogo), n = partidas(id, jogo);
  const k = n < 10 ? 40 : 20; // aprende rápido no começo, estabiliza depois
  gravarNivel(id, jogo, {
    nota: Math.round(atual + k * (placar - esperado(atual, notaAdversario))),
    partidas: n + 1,
    ultimaVez: Date.now(),
  });
}

// Escolhe, entre opções com dificuldade conhecida, a mais próxima de "um pouco acima" da criança.
export function sugerir(id, jogo, opcoes, dificuldade) {
  const alvo = nota(id, jogo) + 60;
  return opcoes.reduce((m, o) => (Math.abs(dificuldade(o) - alvo) < Math.abs(dificuldade(m) - alvo) ? o : m));
}

// ---------- Samuca ----------
// Joga cerca de 110 pontos abaixo da criança: ela ganha ~65% das partidas.
export const notaSamuca = (id, jogo) => nota(id, jogo) - 110;
// Chance de o Samuca fazer a jogada certa em cada lance (o resto é jogada comum).
export const forcaSamuca = (notaS) => Math.max(0.05, Math.min(1, (notaS - 450) / 1000));

// ---------- Vantagem entre duas crianças ----------
// Quem está atrás começa e ganha dicas do Samuca; a diferença de nível é compensada.
export function vantagem(idA, idB, jogo) {
  const a = nota(idA, jogo), b = nota(idB, jogo);
  const dif = Math.abs(a - b);
  const maisNovo = a <= b ? 0 : 1; // índice de quem está atrás (0 = A, 1 = B)
  if (dif < 60) return { equilibrada: true, comeca: null, dicas: [0, 0], atras: null };
  const dicas = [0, 0];
  dicas[maisNovo] = Math.min(3, Math.floor(dif / 120));
  return { equilibrada: false, comeca: maisNovo, dicas, atras: maisNovo };
}
// Nota "efetiva" de quem recebeu ajuda, para o resultado não inflar.
export const bonusVantagem = (dicas, comecou) => dicas * 90 + (comecou ? 30 : 0);
