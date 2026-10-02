// Música de fundo calma, gerada na hora (nenhum arquivo de áudio, nenhum direito de terceiros).
// Acordes lentos e suaves com notas soltas de escala pentatônica, que nunca soam "erradas".
import { contextoAudio, ler, guardar } from "./util.js";

export const musicaLigada = () => ler("musica", true);

const ACORDES = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 53, 59]]; // Dó, Lá m, Fá, Sol
const ESCALA = [60, 62, 64, 67, 69, 72, 74, 76];
const COMPASSO = 8; // segundos por acorde
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

let ac, mestre, eco, relogio = null, proximo = 0, indice = 0;

function montarCadeia() {
  ac = contextoAudio();
  mestre = ac.createGain();
  mestre.gain.value = 0;
  const filtro = ac.createBiquadFilter();
  filtro.type = "lowpass"; filtro.frequency.value = 1400;
  eco = ac.createDelay(); eco.delayTime.value = 0.42;
  const volta = ac.createGain(); volta.gain.value = 0.32;
  eco.connect(volta).connect(eco);
  eco.connect(filtro);
  mestre.connect(filtro).connect(ac.destination);
  mestre.connect(eco);
}

function tom(freq, inicio, dur, vol, tipo = "sine", ataque = 1.2) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = tipo; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, inicio);
  g.gain.exponentialRampToValueAtTime(vol, inicio + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  o.connect(g).connect(mestre);
  o.start(inicio); o.stop(inicio + dur + 0.05);
}

function agendar() {
  while (proximo < ac.currentTime + COMPASSO) {
    const acorde = ACORDES[indice % ACORDES.length];
    for (const n of acorde) {
      tom(hz(n), proximo, COMPASSO + 1.5, 0.028);
      tom(hz(n) * 1.004, proximo, COMPASSO + 1.5, 0.018, "triangle");
    }
    const notas = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < notas; k++) {
      const quando = proximo + Math.floor(Math.random() * 14) * 0.5;
      tom(hz(ESCALA[Math.floor(Math.random() * ESCALA.length)]), quando, 2.6, 0.035, "sine", 0.02);
    }
    proximo += COMPASSO; indice++;
  }
}

export function tocar() {
  if (relogio) return;
  try {
    if (!ac) montarCadeia();
    proximo = ac.currentTime + 0.2;
    mestre.gain.cancelScheduledValues(ac.currentTime);
    mestre.gain.linearRampToValueAtTime(0.9, ac.currentTime + 3);
    agendar();
    relogio = setInterval(agendar, 2000);
  } catch {}
}

export function parar() {
  if (!relogio) return;
  clearInterval(relogio); relogio = null;
  try {
    mestre.gain.cancelScheduledValues(ac.currentTime);
    mestre.gain.setValueAtTime(mestre.gain.value, ac.currentTime);
    mestre.gain.linearRampToValueAtTime(0, ac.currentTime + 1);
  } catch {}
}

export function alternarMusica() {
  const v = !musicaLigada();
  guardar("musica", v);
  v ? tocar() : parar();
  return v;
}

// O navegador só deixa tocar som depois do primeiro toque na tela.
export function prepararMusica() {
  const comecar = () => { if (musicaLigada()) tocar(); };
  addEventListener("pointerdown", comecar, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) parar(); else if (musicaLigada() && ac) tocar();
  });
}
