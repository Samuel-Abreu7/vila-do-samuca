// Guarda o portal inteiro no aparelho para funcionar sem internet.
// Jogo novo: acrescente os arquivos dele em ARQUIVOS e suba a versão abaixo.
const CACHE = "enigmas-v46";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./catalogo.js",
  "./manifest.webmanifest",
  "./icones/icone.svg",
  "./icones/favicon.svg",
  "./icones/favicon-32.png",
  "./icones/favicon.ico",
  "./icones/apple-touch-icon.png",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./jogos/raposa/jogo.js",
  "./jogos/raposa/jogo.css",
  "./util.js",
  "./perfis.js",
  "./nivel.js",
  "./samuca.js",
  "./musica.js",
  "./arte.js",
  "./fontes/lilita-one.woff2",
  "./fontes/nunito.woff2",
  "./fontes/atkinson-400.woff2",
  "./fontes/atkinson-700.woff2",
  "./jogos/elevador/jogo.js",
  "./jogos/elevador/jogo.css",
  "./jogos/hanoi/jogo.js",
  "./jogos/hanoi/jogo.css",
  "./jogos/nim/jogo.js",
  "./jogos/nim/jogo.css",
  "./jogos/pontos/jogo.js",
  "./jogos/pontos/jogo.css",
  "./jogos/colmeia/jogo.js",
  "./jogos/colmeia/jogo.css",
  "./jogos/enigma/jogo.js",
  "./jogos/enigma/jogo.css",
  "./jogos/senha/jogo.js",
  "./jogos/senha/jogo.css",
];

// Instala a versão inteira de uma vez, pedindo cada arquivo direto à rede (cache: "reload"),
// para a cópia guardada nunca misturar arquivos de versões diferentes.
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (pega a versão nova quando há internet). Sem internet, ou se a rede demorar mais
// de 4 s (Wi-Fi conectado mas sem internet), usa a cópia guardada na instalação. A cópia só muda
// quando uma versão nova é instalada inteira: por isso as respostas da rede não são gravadas aqui.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith((async () => {
    const guardada = caches.match(e.request, { ignoreSearch: true });
    const rede = fetch(e.request);
    rede.catch(() => {}); // se a cópia guardada responder, uma falha tardia da rede não vira erro solto
    const espera = new Promise((r) => setTimeout(() => r("demorou"), 4000));
    try {
      const r = await Promise.race([rede, espera]);
      if (r !== "demorou" && r.ok) return r;
      return (await guardada) || (r === "demorou" ? await rede : r);
    } catch {
      return (await guardada) || Response.error();
    }
  })());
});
