// Itens da Lojinha da Vila (promoções de lojas parceiras). VAZIO: a lojinha ainda não abriu.
// A página só mostra item com `link` em https. Imagens e vídeos são ARQUIVOS DO PRÓPRIO PORTAL (pasta lojinha/):
// nada é carregado de outros sites, para não vazar o endereço do adulto nem rodar rastreador. Vídeo só em arquivo
// próprio (nada de iframe de terceiros). Cada item já sai com o aviso de publicidade e de comissão.
//
//   { titulo: "Livro de enigmas", loja: "Amazon" | "Mercado Livre" | "Shopee" | "...", link: "https://...",
//     imagem: "lojinha/livro.webp", video: "lojinha/livro.mp4" (opcional), alt: "descrição da imagem" }
export const ITENS = [];

// Pessoa jurídica que opera a lojinha, para aparecer na página antes da abertura: { nome: "...", cnpj: "..." }
export const OPERADORA = null;
