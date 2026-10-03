// Desenhos próprios do portal, no mesmo traço do Samuca: formas chapadas, cantos redondos,
// sombra suave embaixo. Substituem os emojis, que mudam de cara de um celular para outro.
// Uso: arte("raposa", 64) devolve um <svg> pronto para inserir no HTML.

const sombra = `<ellipse cx="50" cy="94" rx="30" ry="4" fill="rgba(0,0,0,.18)"/>`;
const olhos = (y = 46, dx = 13, r = 7, cor = "#1b1f3a") => `
  <circle cx="${50 - dx}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${50 + dx}" cy="${y}" r="${r}" fill="#fff"/>
  <circle cx="${50 - dx + 1}" cy="${y + 1}" r="${r * 0.55}" fill="${cor}"/><circle cx="${50 + dx + 1}" cy="${y + 1}" r="${r * 0.55}" fill="${cor}"/>
  <circle cx="${50 - dx + 2.5}" cy="${y - 1.5}" r="${r * 0.2}" fill="#fff"/><circle cx="${50 + dx + 2.5}" cy="${y - 1.5}" r="${r * 0.2}" fill="#fff"/>`;
const sorriso = (y = 64, l = 8, cor = "#1b1f3a") => `<path d="M${50 - l} ${y} q${l} ${l * 0.8} ${l * 2} 0" stroke="${cor}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
const bochechas = (y = 58) => `<circle cx="28" cy="${y}" r="5" fill="#ff8a8e" opacity=".55"/><circle cx="72" cy="${y}" r="5" fill="#ff8a8e" opacity=".55"/>`;

const DESENHOS = {
  // ---------- Cofre das Frutas: frutas (cada uma com formato próprio, não só cor), cofre e chave ----------
  uva: `${sombra}<path d="M50 20 q2 -10 10 -14" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M54 14 q14 -6 20 4 q-12 6 -20 -4 Z" fill="#3fbf6a"/>
    ${[[38, 30], [62, 30], [50, 42], [28, 46], [72, 46], [40, 58], [60, 58], [50, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#8a4fd6" stroke="#5e2fa8" stroke-width="2"/>`).join("")}
    <circle cx="35" cy="26" r="3" fill="#fff" opacity=".45"/>`,
  laranja: `${sombra}<circle cx="50" cy="54" r="34" fill="#ff9a3c" stroke="#d96f12" stroke-width="3"/>
    ${[[38, 46], [56, 40], [62, 60], [44, 66], [50, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#d96f12"/>`).join("")}
    <path d="M50 20 l0 -8" stroke="#7a4a24" stroke-width="4" stroke-linecap="round"/><path d="M52 16 q12 -10 22 -2 q-10 10 -22 2 Z" fill="#3fbf6a"/>
    <ellipse cx="36" cy="40" rx="6" ry="9" fill="#fff" opacity=".35"/>`,
  morango: `${sombra}<path d="M50 90 Q20 70 18 44 Q18 28 34 26 Q44 25 50 30 Q56 25 66 26 Q82 28 82 44 Q80 70 50 90 Z" fill="#ff4d6d" stroke="#c42a48" stroke-width="2"/>
    ${[[36, 42], [50, 44], [64, 42], [42, 56], [58, 56], [50, 68], [36, 60], [64, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.6" fill="#ffe08a"/>`).join("")}
    <path d="M30 28 L40 16 L46 26 L50 12 L54 26 L60 16 L70 28 Q50 36 30 28 Z" fill="#3fbf6a" stroke="#2a8a4a" stroke-width="2" stroke-linejoin="round"/>`,
  pera: `${sombra}<path d="M50 22 Q38 22 38 38 Q38 48 30 58 Q22 70 30 82 Q40 92 50 90 Q60 92 70 82 Q78 70 70 58 Q62 48 62 38 Q62 22 50 22 Z" fill="#a8d84a" stroke="#7aa82a" stroke-width="3"/>
    <path d="M50 22 q0 -10 6 -14" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M54 12 q12 -6 18 2 q-10 8 -18 -2 Z" fill="#3fbf6a"/>
    <ellipse cx="40" cy="62" rx="5" ry="10" fill="#fff" opacity=".35"/>`,
  cofre: `${sombra}<rect x="12" y="14" width="76" height="72" rx="10" fill="#5d6690" stroke="#3d4466" stroke-width="4"/>
    <rect x="20" y="22" width="60" height="56" rx="6" fill="#7c86b4"/>
    <circle cx="50" cy="50" r="17" fill="#c9d2e8" stroke="#3d4466" stroke-width="4"/><circle cx="50" cy="50" r="5" fill="#3d4466"/>
    ${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M50 50 L${(50 + 14 * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(50 + 14 * Math.sin(a * Math.PI / 180)).toFixed(1)}" stroke="#3d4466" stroke-width="2.5"/>`).join("")}
    <rect x="72" y="40" width="6" height="20" rx="3" fill="#ffc83d"/><rect x="18" y="84" width="12" height="6" rx="2" fill="#3d4466"/><rect x="70" y="84" width="12" height="6" rx="2" fill="#3d4466"/>`,
  chave: `${sombra}<circle cx="32" cy="44" r="18" fill="#ffc83d" stroke="#c7880a" stroke-width="4"/><circle cx="32" cy="44" r="7" fill="#fff6dc"/>
    <path d="M48 44 H86 M74 44 v12 M84 44 v9" stroke="#c7880a" stroke-width="9" stroke-linecap="round"/>
    <path d="M48 44 H86 M74 44 v12 M84 44 v9" stroke="#ffc83d" stroke-width="4" stroke-linecap="round"/>`,

  // ---------- Enigma de lógica em grade ----------
  lupa: `${sombra}<path d="M60 60 L84 84" stroke="#6b3f1c" stroke-width="14" stroke-linecap="round"/>
    <path d="M60 60 L84 84" stroke="#b9773f" stroke-width="6" stroke-linecap="round"/>
    <circle cx="42" cy="42" r="27" fill="#d6efff" stroke="#3a2a6e" stroke-width="9"/>
    <path d="M27 37 a16 16 0 0 1 14 -13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="48" cy="50" r="4" fill="#8fbfe0"/><circle cx="40" cy="54" r="2.5" fill="#8fbfe0"/>`,
  // ---------- Raposa, cordeiro e couve ----------
  raposa: `${sombra}
    <path d="M18 14 L36 40 L20 46 Z M82 14 L64 40 L80 46 Z" fill="#e8742a"/><path d="M22 22 L32 40 L24 42 Z M78 22 L68 40 L76 42 Z" fill="#3a2418"/>
    <path d="M14 44 Q50 10 86 44 Q84 80 50 90 Q16 80 14 44 Z" fill="#ff8c3a"/>
    <path d="M24 60 Q50 96 76 60 Q64 70 50 70 Q36 70 24 60 Z" fill="#fff4e6"/>
    ${olhos(48, 15, 7)}<ellipse cx="50" cy="70" rx="5" ry="3.5" fill="#1b1f3a"/>`,
  cordeiro: `${sombra}
    <g fill="#fff"><circle cx="30" cy="36" r="14"/><circle cx="50" cy="28" r="15"/><circle cx="70" cy="36" r="14"/><circle cx="24" cy="56" r="13"/><circle cx="76" cy="56" r="13"/><circle cx="50" cy="74" r="16"/></g>
    <g fill="#e3e8f5"><circle cx="34" cy="76" r="10"/><circle cx="66" cy="76" r="10"/></g>
    <ellipse cx="22" cy="48" rx="10" ry="5" fill="#5b4a44" transform="rotate(-25 22 48)"/><ellipse cx="78" cy="48" rx="10" ry="5" fill="#5b4a44" transform="rotate(25 78 48)"/>
    <ellipse cx="50" cy="56" rx="19" ry="22" fill="#5b4a44"/>${olhos(52, 8, 5.5)}<ellipse cx="50" cy="68" rx="4" ry="2.5" fill="#2a1f1c"/>`,
  couve: `${sombra}
    <circle cx="50" cy="56" r="34" fill="#3aa856"/><circle cx="32" cy="44" r="18" fill="#56c46c"/><circle cx="68" cy="44" r="18" fill="#56c46c"/><circle cx="50" cy="34" r="18" fill="#6fd67f"/>
    <path d="M50 88 L50 40 M50 60 L32 46 M50 60 L68 46 M50 74 L34 64 M50 74 L66 64" stroke="#d8f5c8" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${olhos(60, 11, 5.5)}<path d="M46 72 h8" stroke="#1b1f3a" stroke-width="3" stroke-linecap="round"/>`,
  barqueiro: `${sombra}
    <path d="M20 90 Q22 66 50 64 Q78 66 80 90 Z" fill="#3a6fd1"/>
    <circle cx="50" cy="48" r="22" fill="#f2c29a"/>${olhos(48, 8, 4.5)}${sorriso(57, 6)}
    <ellipse cx="50" cy="30" rx="36" ry="8" fill="#e8c14a"/><path d="M30 30 Q32 10 50 10 Q68 10 70 30 Z" fill="#f5d565"/><rect x="31" y="24" width="38" height="5" fill="#c0392b"/>`,

  // ---------- Avatares (os valores antigos em emoji continuam valendo; ver AVATAR_DE) ----------
  leao: `${sombra}<circle cx="50" cy="52" r="40" fill="#c8741e"/><g fill="#e08a2a"><circle cx="20" cy="40" r="10"/><circle cx="80" cy="40" r="10"/><circle cx="18" cy="64" r="10"/><circle cx="82" cy="64" r="10"/><circle cx="50" cy="14" r="10"/><circle cx="30" cy="20" r="10"/><circle cx="70" cy="20" r="10"/></g>
    <circle cx="50" cy="54" r="28" fill="#ffc35c"/>${olhos(48, 11, 6)}<ellipse cx="50" cy="64" rx="9" ry="6" fill="#fff0d0"/><path d="M46 60 h8 l-4 4 z" fill="#3a2418"/>${sorriso(68, 5)}`,
  tigre: `${sombra}<circle cx="24" cy="24" r="10" fill="#ff9a3c"/><circle cx="76" cy="24" r="10" fill="#ff9a3c"/><circle cx="50" cy="54" r="36" fill="#ff9a3c"/>
    <path d="M50 18 v12 M36 22 l4 10 M64 22 l-4 10 M16 52 h12 M84 52 h-12 M18 64 h10 M82 64 h-10" stroke="#3a2418" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="50" cy="66" rx="16" ry="12" fill="#fff4e6"/>${olhos(48, 13, 6.5)}<path d="M45 62 h10 l-5 5 z" fill="#e0508a"/>`,
  panda: `${sombra}<circle cx="22" cy="24" r="12" fill="#1b1f3a"/><circle cx="78" cy="24" r="12" fill="#1b1f3a"/><circle cx="50" cy="54" r="38" fill="#fff"/>
    <ellipse cx="35" cy="50" rx="10" ry="12" fill="#1b1f3a" transform="rotate(-20 35 50)"/><ellipse cx="65" cy="50" rx="10" ry="12" fill="#1b1f3a" transform="rotate(20 65 50)"/>
    <circle cx="36" cy="50" r="4" fill="#fff"/><circle cx="64" cy="50" r="4" fill="#fff"/><ellipse cx="50" cy="66" rx="6" ry="4" fill="#1b1f3a"/>${bochechas(64)}`,
  sapo: `${sombra}<ellipse cx="50" cy="62" rx="40" ry="30" fill="#4cc25a"/><circle cx="30" cy="34" r="15" fill="#4cc25a"/><circle cx="70" cy="34" r="15" fill="#4cc25a"/>
    ${olhos(34, 20, 9)}<path d="M26 64 q24 18 48 0" stroke="#1d6b2c" stroke-width="4" fill="none" stroke-linecap="round"/>${bochechas(68)}`,
  polvo: `${sombra}<path d="M18 60 Q14 16 50 14 Q86 16 82 60 Z" fill="#b76cff"/>
    <g stroke="#b76cff" stroke-width="10" stroke-linecap="round" fill="none"><path d="M24 60 q-6 18 4 26"/><path d="M40 62 q-4 18 2 26"/><path d="M60 62 q4 18 -2 26"/><path d="M76 60 q6 18 -4 26"/></g>
    ${olhos(42, 13, 7)}${sorriso(54, 6)}`,
  unicornio: `${sombra}<path d="M50 4 L56 30 L44 30 Z" fill="#ffc83d"/><path d="M26 30 L22 12 L38 24 Z M74 30 L78 12 L62 24 Z" fill="#fff"/>
    <circle cx="50" cy="54" r="34" fill="#fff"/><path d="M20 40 Q10 60 24 80 Q20 60 30 44 Z" fill="#ff7ac8"/><path d="M26 34 Q14 44 18 62 Q24 48 34 40 Z" fill="#8f7bff"/>
    ${olhos(50, 12, 6)}${bochechas(62)}${sorriso(66, 5)}`,
  dragao: `${sombra}<path d="M26 26 L30 6 L40 22 Z M74 26 L70 6 L60 22 Z" fill="#ffc83d"/><circle cx="50" cy="52" r="36" fill="#2fbf8f"/>
    <ellipse cx="50" cy="70" rx="22" ry="14" fill="#8ce0c0"/><circle cx="42" cy="68" r="2.5" fill="#1b1f3a"/><circle cx="58" cy="68" r="2.5" fill="#1b1f3a"/>${olhos(44, 13, 7)}`,
  dino: `${sombra}<path d="M50 14 l8 -8 l4 10 l10 -4 l0 10 l10 2 l-6 8 Z" fill="#ff9a3c"/><ellipse cx="50" cy="56" rx="38" ry="34" fill="#6fd06a"/>
    <ellipse cx="50" cy="72" rx="26" ry="12" fill="#b9f0a4"/>${olhos(46, 14, 7)}<path d="M36 74 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4" stroke="#fff" stroke-width="3" fill="none"/>`,
  golfinho: `${sombra}<path d="M50 10 Q58 22 54 28 Q86 32 88 60 Q86 88 50 88 Q14 88 12 60 Q14 32 46 28 Z" fill="#4aa8ff"/>
    <ellipse cx="50" cy="70" rx="24" ry="14" fill="#cfe8ff"/>${olhos(52, 16, 6)}${sorriso(72, 8)}`,
  tubarao: `${sombra}<path d="M50 4 L62 30 L40 30 Z" fill="#6f86a8"/><ellipse cx="50" cy="58" rx="38" ry="32" fill="#8aa0c0"/><ellipse cx="50" cy="72" rx="26" ry="14" fill="#fff"/>
    ${olhos(48, 16, 6)}<path d="M32 70 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 l4 -5" stroke="#8aa0c0" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`,
  abelha: `${sombra}<ellipse cx="26" cy="30" rx="14" ry="10" fill="#dff3ff" opacity=".9"/><ellipse cx="74" cy="30" rx="14" ry="10" fill="#dff3ff" opacity=".9"/>
    <circle cx="50" cy="56" r="34" fill="#ffc83d"/><path d="M18 50 h64 M17 66 h66" stroke="#1b1f3a" stroke-width="8"/><path d="M40 20 q-4 -10 -10 -12 M60 20 q4 -10 10 -12" stroke="#1b1f3a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="36" cy="40" r="5" fill="#1b1f3a"/><circle cx="64" cy="40" r="5" fill="#1b1f3a"/>`,
  borboleta: `${sombra}<path d="M50 50 Q20 6 10 34 Q6 56 50 54 Z M50 50 Q80 6 90 34 Q94 56 50 54 Z" fill="#ff7ac8"/>
    <path d="M50 54 Q20 60 22 82 Q36 90 50 60 Z M50 54 Q80 60 78 82 Q64 90 50 60 Z" fill="#8f7bff"/><circle cx="28" cy="34" r="6" fill="#ffc83d"/><circle cx="72" cy="34" r="6" fill="#ffc83d"/>
    <rect x="46" y="30" width="8" height="50" rx="4" fill="#3a2418"/><path d="M48 32 q-6 -14 -12 -16 M52 32 q6 -14 12 -16" stroke="#3a2418" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  foguete: `${sombra}<path d="M50 6 Q72 26 70 64 L30 64 Q28 26 50 6 Z" fill="#eef2ff"/><path d="M50 6 Q62 16 66 30 L34 30 Q38 16 50 6 Z" fill="#ff5b61"/>
    <circle cx="50" cy="44" r="9" fill="#3aa6ff" stroke="#8aa0c0" stroke-width="3"/><path d="M30 50 L16 72 L32 66 Z M70 50 L84 72 L68 66 Z" fill="#ff5b61"/>
    <path d="M38 66 Q50 96 62 66 Z" fill="#ffc83d"/><path d="M44 66 Q50 84 56 66 Z" fill="#ff9a3c"/>`,
  bola: `${sombra}<circle cx="50" cy="50" r="38" fill="#fff"/><path d="M50 32 l14 10 l-5 16 h-18 l-5 -16 Z" fill="#1b1f3a"/>
    <path d="M50 32 v-19 M64 42 l17 -6 M59 58 l10 15 M41 58 l-10 15 M36 42 l-17 -6" stroke="#1b1f3a" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="#c9d2e8" stroke-width="3"/>`,
  violao: `${sombra}<rect x="46" y="4" width="8" height="46" rx="3" fill="#7a4a24"/><rect x="42" y="2" width="16" height="10" rx="3" fill="#3a2418"/>
    <path d="M50 38 Q28 38 30 56 Q18 64 26 80 Q36 94 50 90 Q64 94 74 80 Q82 64 70 56 Q72 38 50 38 Z" fill="#e08a2a"/><circle cx="50" cy="66" r="8" fill="#3a2418"/>
    <path d="M47 12 v70 M50 12 v70 M53 12 v70" stroke="#fff4e6" stroke-width="1"/>`,
  cacto: `${sombra}<rect x="20" y="78" width="60" height="14" rx="4" fill="#e0508a"/><rect x="38" y="16" width="24" height="64" rx="12" fill="#3fbf6a"/>
    <path d="M38 52 h-10 a8 8 0 0 1 -8 -8 v-12" stroke="#3fbf6a" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M62 44 h10 a8 8 0 0 0 8 -8 v-8" stroke="#3fbf6a" stroke-width="12" fill="none" stroke-linecap="round"/>
    ${olhos(40, 6, 4.5)}${sorriso(52, 4)}<circle cx="50" cy="12" r="6" fill="#ff7ac8"/>`,

  // ---------- Figuras do segredo (PIN) ----------
  cachorro: `${sombra}<ellipse cx="20" cy="44" rx="10" ry="20" fill="#7a4a24"/><ellipse cx="80" cy="44" rx="10" ry="20" fill="#7a4a24"/><circle cx="50" cy="52" r="32" fill="#d9a066"/>
    <ellipse cx="50" cy="66" rx="14" ry="10" fill="#fff4e6"/>${olhos(46, 12, 6)}<ellipse cx="50" cy="62" rx="6" ry="4" fill="#1b1f3a"/>`,
  gato: `${sombra}<path d="M20 44 L24 10 L44 30 Z M80 44 L76 10 L56 30 Z" fill="#8aa0c0"/><circle cx="50" cy="54" r="32" fill="#a9bbd6"/>
    ${olhos(50, 12, 6.5)}<path d="M46 62 h8 l-4 4 z" fill="#ff7ac8"/><path d="M20 60 h16 M20 68 h16 M80 60 h-16 M80 68 h-16" stroke="#6f86a8" stroke-width="2"/>`,
  maca: `${sombra}<path d="M50 28 Q30 16 18 34 Q8 58 26 80 Q38 94 50 84 Q62 94 74 80 Q92 58 82 34 Q70 16 50 28 Z" fill="#ff4d55"/>
    <path d="M50 28 q0 -14 8 -20" stroke="#7a4a24" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M54 18 q14 -8 22 2 q-12 8 -22 -2 Z" fill="#3fbf6a"/><ellipse cx="34" cy="44" rx="6" ry="10" fill="#fff" opacity=".4"/>`,
  banana: `${sombra}<path d="M20 30 Q24 80 80 78 Q86 74 82 70 Q40 66 32 26 Q26 20 20 30 Z" fill="#ffd84a"/><path d="M22 28 l-4 -8 l8 2 Z M80 72 l8 6" stroke="#7a4a24" stroke-width="5" stroke-linecap="round"/>`,
  estrela: `${sombra}<path d="M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36 Z" fill="#ffc83d" stroke="#e8a800" stroke-width="3" stroke-linejoin="round"/>`,
  lua: `${sombra}<path d="M62 10 A40 40 0 1 0 88 66 A32 32 0 1 1 62 10 Z" fill="#fff0a8"/><circle cx="40" cy="60" r="4" fill="#e8d67a"/><circle cx="30" cy="40" r="3" fill="#e8d67a"/>`,
  carro: `${sombra}<path d="M12 64 Q12 48 26 46 L34 30 Q38 24 46 24 L64 24 Q72 24 76 32 L82 46 Q92 48 90 64 Z" fill="#ff5b61"/>
    <path d="M38 32 L34 44 H50 V30 H42 Q40 30 38 32 Z M56 30 V44 H74 L70 34 Q68 30 64 30 Z" fill="#cfe8ff"/><circle cx="30" cy="68" r="10" fill="#1b1f3a"/><circle cx="72" cy="68" r="10" fill="#1b1f3a"/><circle cx="30" cy="68" r="4" fill="#c9d2e8"/><circle cx="72" cy="68" r="4" fill="#c9d2e8"/>`,
  balao: `<path d="M50 70 q-4 14 4 26" stroke="#8aa0c0" stroke-width="2" fill="none"/><ellipse cx="50" cy="40" rx="28" ry="34" fill="#3aa6ff"/><path d="M46 74 h8 l-4 -6 Z" fill="#1a64c9"/><ellipse cx="38" cy="28" rx="6" ry="10" fill="#fff" opacity=".45"/>`,

  // ---------- Emblemas dos jogos ----------
  elevador: `${sombra}<rect x="18" y="10" width="64" height="80" rx="8" fill="#8aa0c0"/><rect x="24" y="20" width="52" height="64" rx="4" fill="#3a4a6a"/>
    <rect x="26" y="22" width="23" height="60" fill="#c9d2e8"/><rect x="51" y="22" width="23" height="60" fill="#c9d2e8"/><path d="M40 6 l10 -4 l10 4 Z" fill="#ffc83d"/>
    <path d="M36 44 l6 -8 l6 8 Z" fill="#3aa856"/><path d="M52 58 l6 8 l6 -8 Z" fill="#ff5b61"/>`,
  hanoi: `${sombra}<rect x="46" y="12" width="8" height="74" rx="4" fill="#9a6232"/><rect x="12" y="84" width="76" height="8" rx="4" fill="#7a4a24"/>
    <rect x="16" y="68" width="68" height="15" rx="7.5" fill="#a879ff"/><rect x="24" y="52" width="52" height="15" rx="7.5" fill="#3aa6ff"/><rect x="32" y="36" width="36" height="15" rx="7.5" fill="#3bd67f"/><rect x="38" y="20" width="24" height="15" rx="7.5" fill="#ffc83d"/>`,
  nim: `${sombra}${[20, 34, 48, 62, 76].map((x, i) => `<g transform="rotate(${(i - 2) * 8} ${x} 80)"><rect x="${x - 4}" y="${22 + Math.abs(i - 2) * 4}" width="8" height="${60 - Math.abs(i - 2) * 4}" rx="4" fill="#8fcf6a"/><path d="M${x - 4} ${40 + Math.abs(i - 2) * 4} h8 M${x - 4} ${58 + Math.abs(i - 2) * 4} h8" stroke="#4f8a3b" stroke-width="2.5" stroke-linecap="round"/></g>`).join("")}`,
  pontos: `${sombra}<rect x="10" y="10" width="80" height="80" rx="12" fill="#2f2790"/><rect x="18" y="18" width="30" height="30" rx="4" fill="#3aa6ff" opacity=".7"/>
    <path d="M18 18 h30 v30 h-30 Z" stroke="#3aa6ff" stroke-width="5" fill="none"/><path d="M48 48 h30 M78 48 v30" stroke="#ff5b61" stroke-width="5" stroke-linecap="round"/>
    ${[18, 48, 78].map((y) => [18, 48, 78].map((x) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff"/>`).join("")).join("")}`,

  samuca: `<path d="M22 30 L30 8 L40 26 Z M78 30 L70 8 L60 26 Z" fill="#7a4a24"/><ellipse cx="50" cy="58" rx="34" ry="37" fill="#9a6232"/><ellipse cx="50" cy="70" rx="21" ry="21" fill="#e9c58f"/>
    <circle cx="35" cy="42" r="15" fill="#ffc83d"/><circle cx="65" cy="42" r="15" fill="#ffc83d"/><circle cx="35" cy="42" r="11" fill="#fff"/><circle cx="65" cy="42" r="11" fill="#fff"/>
    <circle cx="37" cy="43" r="6" fill="#1b1f3a"/><circle cx="63" cy="43" r="6" fill="#1b1f3a"/><path d="M45 52 L55 52 L50 61 Z" fill="#ff9a3c"/>`,

  colmeia: `${sombra}${[[50, 28], [30, 40], [70, 40], [30, 64], [70, 64], [50, 76], [50, 52]].map(([x, y], i) =>
      `<path d="M${x} ${y - 13} l11 6.5 v13 l-11 6.5 l-11 -6.5 v-13 Z" fill="${[1, 4, 6].includes(i) ? "#e8a43a" : "#f6d98a"}" stroke="#b9822a" stroke-width="2.5" stroke-linejoin="round"/>`).join("")}
    <g transform="translate(58 6) scale(.36)"><ellipse cx="26" cy="30" rx="14" ry="10" fill="#dff3ff"/><ellipse cx="74" cy="30" rx="14" ry="10" fill="#dff3ff"/><circle cx="50" cy="56" r="30" fill="#ffc83d"/><path d="M22 50 h56 M21 66 h58" stroke="#1b1f3a" stroke-width="8"/><circle cx="38" cy="42" r="5" fill="#1b1f3a"/><circle cx="62" cy="42" r="5" fill="#1b1f3a"/></g>`,
  gota: `<path d="M50 8 Q78 44 78 62 A28 28 0 0 1 22 62 Q22 44 50 8 Z" fill="#e8a43a" stroke="#b9822a" stroke-width="5"/><ellipse cx="40" cy="58" rx="6" ry="11" fill="#fff" opacity=".45"/>`,

  diario: `${sombra}<rect x="18" y="10" width="64" height="80" rx="6" fill="#8a5424"/><rect x="24" y="14" width="56" height="72" rx="4" fill="#f3e7c9"/>
    <rect x="18" y="10" width="10" height="80" rx="4" fill="#6b3f1c"/><path d="M36 30 h34 M36 42 h34 M36 54 h24" stroke="#c9a46a" stroke-width="4" stroke-linecap="round"/>
    <path d="M62 64 l6 12 l6 -12 Z" fill="#ff5b61"/><circle cx="68" cy="62" r="7" fill="#ffc83d" stroke="#e8a800" stroke-width="2"/>`,

  // ---------- Cenário ----------
  bandeira: `<rect x="22" y="10" width="6" height="84" rx="3" fill="#7a4a24"/><path d="M28 12 Q52 4 58 16 Q66 28 88 20 L88 52 Q66 60 58 48 Q52 36 28 44 Z" fill="#ff5b61"/>`,
  fogueira: `<path d="M20 88 L80 72 M20 72 L80 88" stroke="#7a4a24" stroke-width="10" stroke-linecap="round"/><path d="M50 12 Q76 40 70 62 Q64 80 50 80 Q36 80 30 62 Q26 44 42 30 Q44 44 50 46 Q48 30 50 12 Z" fill="#ff9a3c"/><path d="M50 40 Q64 56 60 68 Q56 78 50 78 Q44 78 40 68 Q38 58 50 40 Z" fill="#ffd84a"/>`,
  flor: `<circle cx="50" cy="30" r="12" fill="#ff7ac8"/><circle cx="68" cy="44" r="12" fill="#ff7ac8"/><circle cx="62" cy="64" r="12" fill="#ff7ac8"/><circle cx="38" cy="64" r="12" fill="#ff7ac8"/><circle cx="32" cy="44" r="12" fill="#ff7ac8"/><circle cx="50" cy="50" r="11" fill="#ffc83d"/>`,
  trofeu: `${sombra}<path d="M28 14 H72 V36 Q72 60 50 62 Q28 60 28 36 Z" fill="#ffc83d"/><path d="M28 20 H14 Q12 44 32 46 M72 20 H86 Q88 44 68 46" stroke="#e8a800" stroke-width="5" fill="none"/>
    <rect x="44" y="60" width="12" height="14" fill="#e8a800"/><rect x="30" y="74" width="40" height="12" rx="4" fill="#9a6232"/><path d="M40 22 v24" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>`,
  mao: `<path d="M38 50 V16 a7 7 0 0 1 14 0 V44 V36 a7 7 0 0 1 14 0 V48 V42 a7 7 0 0 1 14 0 V70 Q80 94 56 94 Q40 94 30 80 L16 60 a7 7 0 0 1 11 -9 L38 62 Z" fill="#fff" stroke="#1b1f3a" stroke-width="4" stroke-linejoin="round"/>`,
};

// ---------- Humores dos personagens da Raposa (01/10/2026) ----------
// Mesmo desenho, com rosto diferente: feliz (chegou) e preocupado (ficou em apuros). Nunca medo
// nem choro: a preocupação é gentil, e some quando a criança toca em Desfazer.
const sobrancelhas = (y, dx, cor = "#1b1f3a") => `<path d="M${50 - dx - 6} ${y + 3} L${50 - dx + 5} ${y - 2} M${50 + dx + 6} ${y + 3} L${50 + dx - 5} ${y - 2}" stroke="${cor}" stroke-width="3" stroke-linecap="round"/>`;
const bocaO = (x, y, cor) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="3.6" fill="${cor}"/>`;
DESENHOS["raposa-feliz"] = DESENHOS.raposa + sorriso(75, 6) + bochechas(62);
DESENHOS["cordeiro-feliz"] = DESENHOS.cordeiro + sorriso(72, 5, "#f6e7dd");
DESENHOS["cordeiro-preocupado"] = DESENHOS.cordeiro + sobrancelhas(43, 8, "#f6e7dd") + bocaO(50, 75, "#f6e7dd");
DESENHOS["couve-feliz"] = DESENHOS.couve.replace(/<path d="M46 72 h8"[^>]*\/>/, "") + sorriso(70, 6) + bochechas(68);
DESENHOS["couve-preocupada"] = DESENHOS.couve.replace(/<path d="M46 72 h8"[^>]*\/>/, "") + sobrancelhas(51, 11) + bocaO(50, 74, "#1b1f3a");
DESENHOS["barqueiro-feliz"] = DESENHOS.barqueiro + `<path d="M74 74 Q84 64 88 50" stroke="#3a6fd1" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="88" cy="46" r="6.5" fill="#f2c29a"/>`;
// Tomé, o bisão: anfitrião dos Estados Unidos (a história do elevador). Gentil, de juba felpuda; sem
// chapéu nem roupa de vaqueiro, para não cair em estereótipo.
DESENHOS.tome = `${sombra}
    <ellipse cx="50" cy="78" rx="30" ry="17" fill="#6b3f1c"/>
    <path d="M24 32 Q12 22 22 16 Q27 24 33 30 Z M76 32 Q88 22 78 16 Q73 24 67 30 Z" fill="#f0dcae" stroke="#b08850" stroke-width="2"/>
    <circle cx="50" cy="46" r="33" fill="#5a3216"/><circle cx="30" cy="40" r="9" fill="#6b3f1c"/><circle cx="70" cy="40" r="9" fill="#6b3f1c"/><circle cx="50" cy="22" r="10" fill="#6b3f1c"/>
    <ellipse cx="50" cy="54" rx="22" ry="21" fill="#9a6232"/><ellipse cx="50" cy="64" rx="12" ry="9" fill="#e9c58f"/>
    ${olhos(50, 10, 5)}<ellipse cx="50" cy="61" rx="4.5" ry="3" fill="#2a1f1c"/>${sorriso(69, 5)}`;
// Gui, o galo (França), Tito, o panda (China), Zuzu, a abelha, e Bia, a tartaruga: anfitriões dos outros jogos.
// Sem chapéu, boina nem roupa típica: nada de estereótipo de país.
DESENHOS.gui = `${sombra}
    <path d="M68 62 Q94 50 90 84 Q80 74 68 78 Z" fill="#2f9e6b"/>
    <ellipse cx="50" cy="68" rx="26" ry="23" fill="#c8581f"/><ellipse cx="50" cy="74" rx="15" ry="13" fill="#f6dba0"/>
    <path d="M38 26 Q33 12 42 14 Q46 4 52 14 Q62 10 60 26 Z" fill="#e63a2e"/>
    <circle cx="50" cy="42" r="20" fill="#e0752e"/>${olhos(40, 8, 5)}
    <path d="M43 49 L57 49 L50 58 Z" fill="#ffc93d"/><ellipse cx="50" cy="60" rx="4.5" ry="5.5" fill="#e63a2e"/>
    <path d="M40 91 h9 M54 91 h9" stroke="#ffb13d" stroke-width="4" stroke-linecap="round"/>`;
DESENHOS.tito = `${sombra}
    <ellipse cx="50" cy="72" rx="28" ry="21" fill="#f6f6f2"/>
    <circle cx="25" cy="62" r="11" fill="#2b2b33"/><circle cx="75" cy="62" r="11" fill="#2b2b33"/>
    <rect x="76" y="38" width="6" height="52" rx="3" fill="#6fcf6a"/><path d="M82 52 q10 -4 12 -12 q-10 0 -12 12 Z" fill="#4caf50"/>
    <circle cx="28" cy="18" r="9" fill="#2b2b33"/><circle cx="72" cy="18" r="9" fill="#2b2b33"/><circle cx="50" cy="38" r="26" fill="#fff"/>
    <ellipse cx="38" cy="37" rx="8" ry="10" fill="#2b2b33" transform="rotate(-20 38 37)"/><ellipse cx="62" cy="37" rx="8" ry="10" fill="#2b2b33" transform="rotate(20 62 37)"/>
    <circle cx="39" cy="37" r="3.2" fill="#fff"/><circle cx="61" cy="37" r="3.2" fill="#fff"/>
    <ellipse cx="50" cy="48" rx="5" ry="3.4" fill="#2b2b33"/>${sorriso(54, 5)}`;
DESENHOS.zuzu = `${sombra}
    <ellipse cx="25" cy="48" rx="13" ry="8" fill="#cfeaf5" transform="rotate(-25 25 48)"/><ellipse cx="75" cy="48" rx="13" ry="8" fill="#cfeaf5" transform="rotate(25 75 48)"/>
    <ellipse cx="50" cy="66" rx="24" ry="25" fill="#ffd23d"/>
    <path d="M30 60 q20 6 40 0 M27 72 q23 6 46 0" stroke="#2b2b33" stroke-width="7" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="38" r="18" fill="#ffd23d"/>
    <path d="M42 22 Q38 10 30 10 M58 22 Q62 10 70 10" stroke="#2b2b33" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="30" cy="10" r="3" fill="#2b2b33"/><circle cx="70" cy="10" r="3" fill="#2b2b33"/>
    ${olhos(37, 7, 4.5)}${sorriso(46, 5)}`;
DESENHOS.bia = `${sombra}
    <ellipse cx="50" cy="68" rx="32" ry="23" fill="#4f8a4b"/>
    <path d="M50 50 l12 7 v13 l-12 7 l-12 -7 v-13 z" fill="#6aa65a"/><path d="M30 62 l8 -5 M70 62 l-8 -5 M34 80 l8 -3 M66 80 l-8 -3" stroke="#3d6e3a" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="32" cy="89" rx="9" ry="5" fill="#8fd16e"/><ellipse cx="68" cy="89" rx="9" ry="5" fill="#8fd16e"/>
    <circle cx="50" cy="36" r="17" fill="#8fd16e"/>${olhos(35, 7, 4.5)}${sorriso(44, 5)}
    <circle cx="82" cy="62" r="5" fill="#ffd23d" stroke="#b8860b" stroke-width="1.5"/><rect x="81" y="66" width="3" height="14" fill="#ffd23d"/><rect x="84" y="73" width="5" height="3" fill="#ffd23d"/>`;
// Bento, o texugo: anfitrião do Reino Unido (Alcuíno era de York). Calmo e curioso, gosta de
// mapas antigos. Sem chapéu-coco, chá ou outro estereótipo de país.
DESENHOS.bento = `${sombra}
    <ellipse cx="50" cy="76" rx="30" ry="18" fill="#8a8f99"/>
    <circle cx="25" cy="30" r="9" fill="#2b2b33"/><circle cx="75" cy="30" r="9" fill="#2b2b33"/><circle cx="25" cy="30" r="4.5" fill="#f4f1ea"/><circle cx="75" cy="30" r="4.5" fill="#f4f1ea"/>
    <ellipse cx="50" cy="46" rx="29" ry="25" fill="#f4f1ea"/>
    <path d="M36 22 Q30 40 33 62 Q38 66 42 60 Q40 42 44 23 Z M64 22 Q70 40 67 62 Q62 66 58 60 Q60 42 56 23 Z" fill="#2b2b33"/>
    <circle cx="38" cy="47" r="5" fill="#fff"/><circle cx="62" cy="47" r="5" fill="#fff"/><circle cx="38.6" cy="47.6" r="2.8" fill="#1b1f3a"/><circle cx="62.6" cy="47.6" r="2.8" fill="#1b1f3a"/>
    <ellipse cx="50" cy="60" rx="6" ry="4" fill="#2b2b33"/>${sorriso(66, 5)}
    <rect x="34" y="78" width="32" height="12" rx="6" fill="#f0dcae" stroke="#a9682f" stroke-width="2"/><path d="M40 84 h8 M52 82 l4 4 l4 -4" stroke="#a9682f" stroke-width="2" fill="none" stroke-linecap="round"/>`;

export const arte = (nome, tam = 48, classe = "") =>
  `<svg class="arte ${classe}" width="${tam}" height="${tam}" viewBox="0 0 100 100" aria-hidden="true">${DESENHOS[nome] || DESENHOS.estrela}</svg>`;

// Perfis antigos guardaram o avatar como emoji; o valor continua o mesmo, só o desenho muda.
export const AVATAR_DE = {
  "🦁": "leao", "🐯": "tigre", "🐼": "panda", "🐸": "sapo", "🐙": "polvo", "🦄": "unicornio", "🐲": "dragao", "🦖": "dino",
  "🐬": "golfinho", "🦈": "tubarao", "🐝": "abelha", "🦋": "borboleta", "🚀": "foguete", "⚽": "bola", "🎸": "violao", "🌵": "cacto",
  // figuras do segredo
  "🐶": "cachorro", "🐱": "gato", "🍎": "maca", "🍌": "banana", "⭐": "estrela", "🌙": "lua", "🚗": "carro", "🎈": "balao",
  // outros
  "🦉": "samuca", "🙂": "sapo", "🔵": "golfinho", "🔴": "maca",
};
// Nomes em português, para o leitor de tela (avatares e carimbos).
export const NOME_DESENHO = {
  leao: "Leão", tigre: "Tigre", panda: "Panda", sapo: "Sapo", polvo: "Polvo", unicornio: "Unicórnio", dragao: "Dragão", dino: "Dinossauro",
  golfinho: "Golfinho", tubarao: "Tubarão", abelha: "Abelha", borboleta: "Borboleta", foguete: "Foguete", bola: "Bola", violao: "Violão", cacto: "Cacto",
  cachorro: "Cachorro", gato: "Gato", maca: "Maçã", banana: "Banana", estrela: "Estrela", lua: "Lua", carro: "Carro", balao: "Balão",
  bento: "Bento, o texugo", tome: "Tomé, o bisão", gui: "Gui, o galo", tito: "Tito, o panda", zuzu: "Zuzu, a abelha", bia: "Bia, a tartaruga", flor: "Flor", gota: "Gota", bandeira: "Bandeira", trofeu: "Troféu", samuca: "Samuca", lupa: "Lupa", chave: "Chave", cofre: "Cofre", uva: "Uva", laranja: "Laranja", morango: "Morango", pera: "Pera",
};
export const nomeDoAvatar = (valor) => NOME_DESENHO[AVATAR_DE[valor]] || "Personagem";
// Valor desconhecido (por exemplo, de uma cópia de segurança editada) entra escapado.
export const avatar = (valor, tam = 48) => AVATAR_DE[valor] ? arte(AVATAR_DE[valor], tam)
  : `<span class="emoji">${String(valor ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</span>`;

// ---------- Ícones de interface (traço branco) ----------
const ICONES = {
  loja: `<path d="M5 11v9h14v-9" fill="none"/><path d="M3.5 4h17l1 5a3 3 0 0 1-5.7 1.3 3 3 0 0 1-5.6 0A3 3 0 0 1 2.5 9Z" fill="none"/><path d="M10 20v-5h4v5" fill="none"/>`,
  som: `<path d="M4 9v6h4l5 4V5L8 9Z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" fill="none"/>`,
  mudo: `<path d="M4 9v6h4l5 4V5L8 9Z"/><path d="M17 9l5 6M22 9l-5 6" fill="none"/>`,
  musica: `<path d="M9 18V5l11-2v13" fill="none"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>`,
  voltar: `<path d="M15 5l-7 7 7 7" fill="none"/>`,
  dica: `<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="none"/>`,
  desfazer: `<path d="M9 14L4 9l5-5" fill="none"/><path d="M4 9h11a5 5 0 0 1 0 10h-3" fill="none"/>`,
  recomecar: `<path d="M3 12a9 9 0 1 0 3-6.7L3 8" fill="none"/><path d="M3 3v5h5" fill="none"/>`,
  ajustes: `<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" fill="none"/><circle cx="16" cy="6" r="2.2" fill="none"/><circle cx="10" cy="12" r="2.2" fill="none"/><circle cx="18" cy="18" r="2.2" fill="none"/>`,
  ajuda: `<circle cx="12" cy="12" r="9.5" fill="none"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" fill="none"/><circle cx="12" cy="17.5" r=".8"/>`,
  estante: `<path d="M3 4h18M3 12h18M3 20h18M5 4v16M19 4v16" fill="none"/><rect x="7" y="6" width="3" height="6"/><rect x="11" y="7" width="3" height="5"/><rect x="8" y="14" width="4" height="6"/>`,
  trocar: `<path d="M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12" fill="none"/>`,
  play: `<path d="M7 4l13 8-13 8Z"/>`,
  imprimir: `<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3" fill="none"/><rect x="7" y="14" width="10" height="7" fill="none"/>`,
  // Filtros do mapa e troca de vista
  casa: `<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5" fill="none"/><path d="M10 20v-5h4v5" fill="none"/>`,
  passos: `<path d="M4 20h5v-5h5v-5h5V5" fill="none"/><path d="M15 5h4v4" fill="none"/>`,
  formas: `<path d="M7 3l5 8H2Z" fill="none"/><rect x="13" y="12" width="8" height="8" rx="1" fill="none"/><circle cx="6.5" cy="17" r="3.5" fill="none"/>`,
  numeros: `<path d="M5 8h6M8 5v6M14 8h6M5 16h6M14 14.5h6M14 17.5h6" fill="none"/>`,
  lupa: `<circle cx="10" cy="10" r="6" fill="none"/><path d="M14.5 14.5L20 20" fill="none"/>`,
  dupla: `<circle cx="8" cy="7.5" r="3"/><circle cx="16" cy="7.5" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M10.5 20a5.5 5.5 0 0 1 11 0" fill="none"/>`,
  sozinho: `<circle cx="12" cy="7.5" r="3.2"/><path d="M6 20a6 6 0 0 1 12 0" fill="none"/>`,
  mapa: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" fill="none"/><path d="M9 4v14M15 6v14" fill="none"/>`,
  lista: `<path d="M9 6h12M9 12h12M9 18h12" fill="none"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>`,
};
export const icone = (nome, tam = 22) =>
  `<svg class="icone" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome]}</svg>`;
