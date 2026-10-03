// Depoimentos de adultos que AUTORIZARAM a publicação (com nome, idade, cidade e UF). Fica vazio até chegar o
// primeiro. Cada item só aparece se tiver `autorizadoEm` (data da autorização recebida) e `idade` de 18 ou mais.
// Publicar elogios, ideias e problemas, nesta ordem de chegada (nada de escolher só os elogios). Nada de dado de
// criança no texto: tirar nome, idade ou foto de criança antes de colocar aqui, sem mudar o sentido.
// Formato: { tipo: "Elogio" | "Ideia" | "Problema" | "Dúvida", jogo: "nome do jogo" ou "" (o portal),
//            texto: "...", nome: "...", idade: 62, cidade: "...", uf: "PE", autorizadoEm: "2026-10-02",
//            resposta: "o que a família fez a respeito" (opcional) }
export const DEPOIMENTOS = [];
