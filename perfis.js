// Perfis da família: apelido fictício, avatar, idade, PIN embaralhado e nível por jogo.
// Hoje os dados ficam no aparelho (localStorage). Quando o Firebase entrar, só este
// arquivo muda: o resto do portal continua chamando as mesmas funções.
import { ler, guardar } from "./util.js";

export const AVATARES = ["🦁", "🐯", "🐼", "🐸", "🐙", "🦄", "🐲", "🦖", "🐬", "🦈", "🐝", "🦋", "🚀", "⚽", "🎸", "🌵"];
export const FIGURAS = ["🐶", "🐱", "🍎", "🍌", "⭐", "🌙", "⚽", "🚗", "🎈"];

// Completa campos que faltem (cópia de segurança antiga ou editada): o resto do portal pode
// contar com eles sem conferir.
function arrumar(f) {
  const criancas = (Array.isArray(f?.criancas) ? f.criancas : []).filter((c) => c && typeof c.id === "string" && c.id);
  for (const c of criancas) {
    c.apelido = String(c.apelido ?? "Jogador").slice(0, 14);
    c.idade = Number.isFinite(Number(c.idade)) ? Number(c.idade) : 9;
    if (c.niveis === null || typeof c.niveis !== "object") c.niveis = {};
    if (c.pinHash === undefined) c.pinHash = null;
  }
  return { ...f, criancas, senhaPainel: f?.senhaPainel ?? null };
}
let familia = arrumar(ler("familia", { criancas: [], senhaPainel: null }));
const salvar = () => guardar("familia", familia);
// Outra aba ou o app instalado gravou: relê, para uma não apagar o que a outra salvou.
addEventListener("storage", (e) => { if (e.key === "enigmas:familia") familia = arrumar(ler("familia", familia)); });

// Tempo de uso de dias passados não serve para nada: apaga ao abrir.
try {
  const d = new Date(), hoje = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  Object.keys(localStorage).filter((k) => k.startsWith("enigmas:uso:") && !k.endsWith(":" + hoje)).forEach((k) => localStorage.removeItem(k));
} catch {}

export async function embaralhar(texto, sal) {
  const dados = new TextEncoder().encode(`${sal}:${texto}`);
  const h = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const criancas = () => familia.criancas;
export const crianca = (id) => familia.criancas.find((c) => c.id === id) || null;
export const temPainel = () => !!familia.senhaPainel;

export async function criarCrianca({ apelido, avatar, idade, pinTipo, pin }) {
  const id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const c = { id, apelido, avatar, idade, pinTipo, pinHash: await embaralhar(pin, id), niveis: {}, criadoEm: Date.now() };
  familia.criancas.push(c);
  salvar();
  return c;
}

export async function conferirPin(id, pin) {
  const c = crianca(id);
  return !!c && c.pinHash !== null && c.pinHash === await embaralhar(pin, id);
}

export async function trocarPin(id, pinTipo, pin) {
  const c = crianca(id);
  c.pinTipo = pinTipo;
  c.pinHash = await embaralhar(pin, id);
  salvar();
}

export function zerarPin(id) { crianca(id).pinHash = null; salvar(); }
export function removerCrianca(id) {
  familia.criancas = familia.criancas.filter((c) => c.id !== id);
  if (ativaId() === id) sair();
  salvar();
  // Leva junto o que fica guardado à parte: tempo de uso, primeira vez, fases guiadas,
  // jeito das regras, filtro, vista, escolhas dos ajustes e erros de segredo.
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("enigmas:") && k.split(":").includes(id)).forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export async function definirSenhaPainel(senha) { familia.senhaPainel = await embaralhar(senha, "painel"); salvar(); }
export async function conferirSenhaPainel(senha) { return familia.senhaPainel === await embaralhar(senha, "painel"); }

// ---------- Quem está jogando neste aparelho ----------
export const ativaId = () => ler("ativa", null);
export const ativa = () => crianca(ativaId());
export function entrar(id) { guardar("ativa", id); }
export function sair() { guardar("ativa", null); }

// ---------- Nível ----------
export function registroDoJogo(id, jogo) {
  const c = crianca(id);
  return c ? c.niveis[jogo] : undefined;
}
export function gravarNivel(id, jogo, dados) {
  const c = crianca(id);
  if (!c) return;
  c.niveis[jogo] = { ...(c.niveis[jogo] || {}), ...dados };
  salvar();
}

// ---------- Conquistas (estante pessoal) ----------
// Devolve true se a conquista é nova para essa criança.
export function conquistar(id, conquista) {
  const c = crianca(id);
  if (!c) return false;
  c.conquistas ??= {};
  if (c.conquistas[conquista]) return false;
  c.conquistas[conquista] = Date.now();
  salvar();
  return true;
}
export const conquistas = (id) => crianca(id)?.conquistas || {};

// ---------- Diário de bordo: uma página por jogo resolvido (registro, nada trancado) ----------
export const paginas = (id) => crianca(id)?.diario || {};
export function anotarPagina(id, jogo, resumo) {
  const c = crianca(id);
  if (!c) return;
  c.diario ??= {};
  const pag = c.diario[jogo] || { primeira: Date.now(), vezes: 0, carimbos: [] };
  pag.ultima = Date.now();
  pag.vezes += 1;
  pag.resumo = resumo;
  c.diario[jogo] = pag;
  salvar();
}
export function gravarCarimbos(id, jogo, carimbos) {
  const c = crianca(id);
  if (!c?.diario?.[jogo]) return;
  c.diario[jogo].carimbos = carimbos;
  salvar();
}

// ---------- Opinião da criança sobre cada jogo (só no aparelho; sem texto livre, só escolhas) ----------
// gosto: "gostei" | "meio" | "nao"; nivel: "facil" | "certo" | "dificil". A última resposta vale.
export const GOSTOS = ["gostei", "meio", "nao"];
export const NIVEIS = ["facil", "certo", "dificil"];
export const opinioes = (id) => crianca(id)?.opinioes || {};
export function opinar(id, jogo, campo, valor) {
  const c = crianca(id);
  if (!c || !(campo === "gosto" ? GOSTOS : NIVEIS).includes(valor)) return;
  c.opinioes ??= {};
  c.opinioes[jogo] = { ...(c.opinioes[jogo] || {}), [campo]: valor, quando: Date.now() };
  salvar();
}

// ---------- Preferências de cada criança (som, música, vibração, animações, contraste, letra fácil, vila calma) ----------
export const PREFERENCIAS_PADRAO = { som: true, musica: true, vibrar: true, lento: false, contraste: false, letra: false, calma: false };
export function preferencias(id) {
  return { ...PREFERENCIAS_PADRAO, ...(crianca(id)?.prefs || {}) };
}
export function gravarPreferencia(id, chave, valor) {
  const c = crianca(id);
  if (!c) return;
  c.prefs = { ...(c.prefs || {}), [chave]: valor };
  salvar();
}

// ---------- Primeira vez em cada jogo (para a mãozinha demonstrar) ----------
export function primeiraVez(id, jogo) {
  const chave = `visto:${id}:${jogo}`;
  if (ler(chave, false)) return false;
  guardar(chave, true);
  return true;
}

// ---------- Backup (painel do avô) ----------
export const exportar = () => JSON.stringify(familia);
export function importar(texto) {
  const f = JSON.parse(texto);
  if (!Array.isArray(f?.criancas)) throw new Error("formato");
  familia = arrumar(f);
  salvar();
}
