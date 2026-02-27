/**
 * validacoes.test.ts — Testes do módulo de validações
 * 
 * Testa: validação de email, CPF, CNPJ, documentos,
 * status, urgência e campos obrigatórios.
 */

import { describe, it, expect } from "vitest";
import {
    validarEmail,
    validarCpf,
    validarCnpj,
    validarDocumento,
    validarEObterStatus,
    validarEObterUrgencia,
    validarCamposObrigatorios,
    listarStatusValidos,
    limparDocumento,
} from "../src/utilidades/validacoes.js";

// ============================================================
// TESTES: validarEmail
// ============================================================

describe("validarEmail", () => {
    it("deve aceitar email válido simples", () => {
        expect(validarEmail("usuario@empresa.com")).toBe(true);
    });

    it("deve aceitar email com subdomínio", () => {
        expect(validarEmail("user@sub.dominio.com.br")).toBe(true);
    });

    it("deve rejeitar email sem @", () => {
        expect(validarEmail("userempressa.com")).toBe(false);
    });

    it("deve rejeitar email sem domínio", () => {
        expect(validarEmail("user@")).toBe(false);
    });

    it("deve rejeitar string vazia", () => {
        expect(validarEmail("")).toBe(false);
    });

    it("deve rejeitar email com espaço", () => {
        expect(validarEmail("user @empresa.com")).toBe(false);
    });
});

// ============================================================
// TESTES: validarCpf
// ============================================================

describe("validarCpf", () => {
    it("deve aceitar CPF válido sem formatação", () => {
        // CPF válido: 52998224725
        expect(validarCpf("52998224725")).toBe(true);
    });

    it("deve aceitar CPF válido com formatação", () => {
        expect(validarCpf("529.982.247-25")).toBe(true);
    });

    it("deve rejeitar CPF com todos os dígitos iguais", () => {
        expect(validarCpf("111.111.111-11")).toBe(false);
        expect(validarCpf("000.000.000-00")).toBe(false);
        expect(validarCpf("999.999.999-99")).toBe(false);
    });

    it("deve rejeitar CPF com tamanho incorreto", () => {
        expect(validarCpf("1234")).toBe(false);
        expect(validarCpf("123456789012")).toBe(false);
    });

    it("deve rejeitar CPF com dígitos verificadores inválidos", () => {
        expect(validarCpf("529.982.247-99")).toBe(false);
    });
});

// ============================================================
// TESTES: validarCnpj
// ============================================================

describe("validarCnpj", () => {
    it("deve aceitar CNPJ válido sem formatação", () => {
        // CNPJ válido: 11222333000181
        expect(validarCnpj("11222333000181")).toBe(true);
    });

    it("deve aceitar CNPJ válido com formatação", () => {
        expect(validarCnpj("11.222.333/0001-81")).toBe(true);
    });

    it("deve rejeitar CNPJ com todos os dígitos iguais", () => {
        expect(validarCnpj("11.111.111/1111-11")).toBe(false);
    });

    it("deve rejeitar CNPJ com tamanho incorreto", () => {
        expect(validarCnpj("1234")).toBe(false);
    });

    it("deve rejeitar CNPJ com dígitos verificadores inválidos", () => {
        expect(validarCnpj("11.222.333/0001-99")).toBe(false);
    });
});

// ============================================================
// TESTES: validarDocumento
// ============================================================

describe("validarDocumento", () => {
    it("deve identificar e validar CPF", () => {
        const resultado = validarDocumento("529.982.247-25");
        expect(resultado.tipo).toBe("cpf");
        expect(resultado.valido).toBe(true);
    });

    it("deve identificar e validar CNPJ", () => {
        const resultado = validarDocumento("11.222.333/0001-81");
        expect(resultado.tipo).toBe("cnpj");
        expect(resultado.valido).toBe(true);
    });

    it("deve retornar desconhecido para documentos com tamanho inválido", () => {
        const resultado = validarDocumento("12345");
        expect(resultado.tipo).toBe("desconhecido");
        expect(resultado.valido).toBe(false);
    });
});

// ============================================================
// TESTES: validarEObterStatus
// ============================================================

describe("validarEObterStatus", () => {
    it("deve converter 'Novo' para 'New'", () => {
        expect(validarEObterStatus("Novo")).toBe("New");
    });

    it("deve converter 'Em atendimento' para 'InAttendance'", () => {
        expect(validarEObterStatus("Em atendimento")).toBe("InAttendance");
    });

    it("deve converter 'Resolvido' para 'Resolved'", () => {
        expect(validarEObterStatus("Resolvido")).toBe("Resolved");
    });

    it("deve retornar null para status inválido", () => {
        expect(validarEObterStatus("StatusInexistente")).toBeNull();
    });
});

// ============================================================
// TESTES: validarEObterUrgencia
// ============================================================

describe("validarEObterUrgencia", () => {
    it("deve converter 'Baixa' para 'Low'", () => {
        expect(validarEObterUrgencia("Baixa")).toBe("Low");
    });

    it("deve converter 'Urgente' para 'Urgent'", () => {
        expect(validarEObterUrgencia("Urgente")).toBe("Urgent");
    });

    it("deve retornar null para urgência inválida", () => {
        expect(validarEObterUrgencia("Inexistente")).toBeNull();
    });
});

// ============================================================
// TESTES: validarCamposObrigatorios
// ============================================================

describe("validarCamposObrigatorios", () => {
    it("deve retornar válido quando todos os campos estão preenchidos", () => {
        const resultado = validarCamposObrigatorios(
            { nome: "João", email: "joao@email.com" },
            ["nome", "email"]
        );
        expect(resultado.valido).toBe(true);
        expect(resultado.camposFaltantes).toEqual([]);
    });

    it("deve retornar inválido quando campos estão faltando", () => {
        const resultado = validarCamposObrigatorios(
            { nome: "João" },
            ["nome", "email"]
        );
        expect(resultado.valido).toBe(false);
        expect(resultado.camposFaltantes).toContain("email");
    });

    it("deve rejeitar campos com value string vazia", () => {
        const resultado = validarCamposObrigatorios(
            { nome: "", email: "email@test.com" },
            ["nome", "email"]
        );
        expect(resultado.valido).toBe(false);
        expect(resultado.camposFaltantes).toContain("nome");
    });

    it("deve rejeitar campos com value null", () => {
        const resultado = validarCamposObrigatorios(
            { nome: null },
            ["nome"]
        );
        expect(resultado.valido).toBe(false);
    });

    it("deve rejeitar campos com value undefined", () => {
        const resultado = validarCamposObrigatorios(
            { nome: undefined },
            ["nome"]
        );
        expect(resultado.valido).toBe(false);
    });

    it("deve rejeitar campos contendo apenas espaços", () => {
        const resultado = validarCamposObrigatorios(
            { nome: "   " },
            ["nome"]
        );
        expect(resultado.valido).toBe(false);
    });
});

// ============================================================
// TESTES: listarStatusValidos
// ============================================================

describe("listarStatusValidos", () => {
    it("deve retornar lista com todos os status em português", () => {
        const status = listarStatusValidos();
        expect(status).toContain("Novo");
        expect(status).toContain("Em atendimento");
        expect(status).toContain("Parado");
        expect(status).toContain("Cancelado");
        expect(status).toContain("Resolvido");
        expect(status).toContain("Fechado");
    });

    it("deve retornar exatamente 6 status", () => {
        expect(listarStatusValidos().length).toBe(6);
    });
});

// ============================================================
// TESTES: limparDocumento
// ============================================================

describe("limparDocumento", () => {
    it("deve remover pontos, traços e barras de CPF", () => {
        expect(limparDocumento("529.982.247-25")).toBe("52998224725");
    });

    it("deve remover pontos, traços e barras de CNPJ", () => {
        expect(limparDocumento("11.222.333/0001-81")).toBe("11222333000181");
    });

    it("deve manter string sem formatação inalterada", () => {
        expect(limparDocumento("52998224725")).toBe("52998224725");
    });
});
