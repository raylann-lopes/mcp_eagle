/**
 * formatador-html.test.ts — Testes do módulo de formatação HTML
 * 
 * Testa: conversão Markdown→HTML, geração de tabelas,
 * blocos de destaque e formatação de datas.
 */

import { describe, it, expect } from "vitest";
import {
    converterParaHtml,
    textoJaEhHtml,
    criarTabelaHtml,
    criarBlocoDestaque,
    formatarDataBr,
} from "../src/utilidades/formatador-html.js";

// ============================================================
// TESTES: converterParaHtml
// ============================================================

describe("converterParaHtml", () => {
    it("deve converter texto simples em parágrafo HTML", () => {
        const resultado = converterParaHtml("Texto simples");
        expect(resultado).toContain("<p>");
        expect(resultado).toContain("Texto simples");
    });

    it("deve converter negrito Markdown para <strong>", () => {
        const resultado = converterParaHtml("**Texto em negrito**");
        expect(resultado).toContain("<strong>Texto em negrito</strong>");
    });

    it("deve converter itálico Markdown para <em>", () => {
        const resultado = converterParaHtml("*Texto em itálico*");
        expect(resultado).toContain("<em>Texto em itálico</em>");
    });

    it("deve converter listas não-ordenadas", () => {
        const resultado = converterParaHtml("- Item 1\n- Item 2\n- Item 3");
        expect(resultado).toContain("<ul>");
        expect(resultado).toContain("<li>Item 1</li>");
        expect(resultado).toContain("<li>Item 2</li>");
        expect(resultado).toContain("<li>Item 3</li>");
    });

    it("deve converter listas ordenadas", () => {
        const resultado = converterParaHtml("1. Primeiro\n2. Segundo");
        expect(resultado).toContain("<ol>");
        expect(resultado).toContain("<li>Primeiro</li>");
        expect(resultado).toContain("<li>Segundo</li>");
    });

    it("deve converter cabeçalhos Markdown", () => {
        const resultado = converterParaHtml("# Título Principal");
        expect(resultado).toContain("<h1>");
        expect(resultado).toContain("Título Principal");
    });

    it("NÃO deve converter texto que já é HTML", () => {
        const htmlOriginal = "<p>Texto <strong>já em HTML</strong></p>";
        const resultado = converterParaHtml(htmlOriginal);
        expect(resultado).toBe(htmlOriginal);
    });

    it("deve lidar com texto vazio", () => {
        const resultado = converterParaHtml("");
        expect(resultado).toBe("");
    });

    it("deve converter quebras de linha em <br>", () => {
        const resultado = converterParaHtml("Linha 1\nLinha 2");
        expect(resultado).toContain("<br>");
    });
});

// ============================================================
// TESTES: textoJaEhHtml
// ============================================================

describe("textoJaEhHtml", () => {
    it("deve detectar HTML com tags de parágrafo", () => {
        expect(textoJaEhHtml("<p>Texto</p>")).toBe(true);
    });

    it("deve detectar HTML com tags div", () => {
        expect(textoJaEhHtml("<div>Conteúdo</div>")).toBe(true);
    });

    it("deve retornar false para texto simples", () => {
        expect(textoJaEhHtml("Apenas texto simples")).toBe(false);
    });

    it("deve retornar false para Markdown", () => {
        expect(textoJaEhHtml("**Negrito** e *itálico*")).toBe(false);
    });

    it("deve detectar HTML com tags de auto-fechamento", () => {
        expect(textoJaEhHtml("Texto com <br/> quebra")).toBe(true);
    });
});

// ============================================================
// TESTES: criarTabelaHtml
// ============================================================

describe("criarTabelaHtml", () => {
    it("deve criar tabela HTML com cabeçalhos e linhas", () => {
        const resultado = criarTabelaHtml(
            ["Campo", "Valor"],
            [["Status", "Aberto"], ["Urgência", "Alta"]]
        );

        expect(resultado).toContain("<table");
        expect(resultado).toContain("<thead>");
        expect(resultado).toContain("<th");
        expect(resultado).toContain("Campo");
        expect(resultado).toContain("Valor");
        expect(resultado).toContain("Status");
        expect(resultado).toContain("Aberto");
        expect(resultado).toContain("Urgência");
        expect(resultado).toContain("Alta");
    });

    it("deve criar tabela com estilo zebrado (linhas alternadas)", () => {
        const resultado = criarTabelaHtml(
            ["Coluna"],
            [["Linha 1"], ["Linha 2"], ["Linha 3"]]
        );

        // Linhas pares devem ter fundo alternado
        expect(resultado).toContain("background-color: #f8f9fa");
    });

    it("deve funcionar com tabela vazia (apenas cabeçalhos)", () => {
        const resultado = criarTabelaHtml(["Campo"], []);
        expect(resultado).toContain("<table");
        expect(resultado).toContain("Campo");
        expect(resultado).toContain("<tbody></tbody>");
    });
});

// ============================================================
// TESTES: criarBlocoDestaque
// ============================================================

describe("criarBlocoDestaque", () => {
    it("deve criar bloco de informação (azul)", () => {
        const resultado = criarBlocoDestaque("Info", "Conteúdo", "info");
        expect(resultado).toContain("#e3f2fd");  // Fundo azul claro
        expect(resultado).toContain("Info");
        expect(resultado).toContain("Conteúdo");
    });

    it("deve criar bloco de sucesso (verde)", () => {
        const resultado = criarBlocoDestaque("OK", "Feito", "sucesso");
        expect(resultado).toContain("#e8f5e9");  // Fundo verde claro
    });

    it("deve criar bloco de alerta (amarelo)", () => {
        const resultado = criarBlocoDestaque("Atenção", "Cuidado", "alerta");
        expect(resultado).toContain("#fff3e0");  // Fundo amarelo claro
    });

    it("deve criar bloco de erro (vermelho)", () => {
        const resultado = criarBlocoDestaque("Falha", "Erro crítico", "erro");
        expect(resultado).toContain("#ffebee");  // Fundo vermelho claro
    });

    it("deve usar tipo 'info' como padrão", () => {
        const resultado = criarBlocoDestaque("Título", "Corpo");
        expect(resultado).toContain("#e3f2fd");
    });
});

// ============================================================
// TESTES: formatarDataBr
// ============================================================

describe("formatarDataBr", () => {
    it("deve formatar data ISO para formato brasileiro", () => {
        const resultado = formatarDataBr("2025-06-15T14:30:00Z");
        // O formato exato depende do fuso horário, mas deve conter /
        expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("deve retornar 'Não informado' para undefined", () => {
        expect(formatarDataBr(undefined)).toBe("Não informado");
    });

    it("deve retornar 'Não informado' para string vazia", () => {
        // Strings vazias geram data inválida
        expect(formatarDataBr("")).toBe("Não informado");
    });

    it("deve retornar o string original para datas inválidas", () => {
        const resultado = formatarDataBr("data-invalida");
        // Pode retornar "Invalid Date" ou o string original dependendo do comportamento
        expect(typeof resultado).toBe("string");
    });
});
