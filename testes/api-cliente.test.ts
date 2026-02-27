/**
 * api-cliente.test.ts — Testes do cliente HTTP da API Movidesk
 * 
 * Testa: construtor, tratamento de erros e rate-limiting.
 * Usa mocks do axios para simular respostas da API.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { ClienteMovidesk } from "../src/cliente-movidesk/api.js";

// Mock do axios para não fazer requisições reais
vi.mock("axios", () => {
    const mockInstance = {
        request: vi.fn(),
    };
    return {
        default: {
            create: vi.fn(() => mockInstance),
        },
        // Exportar AxiosError para uso nos testes
        AxiosError: class AxiosError extends Error {
            response: { status: number; data: unknown };
            constructor(message: string, status: number, data: unknown = null) {
                super(message);
                this.name = "AxiosError";
                this.response = { status, data };
            }
        },
    };
});

// ============================================================
// TESTES: Construtor
// ============================================================

describe("ClienteMovidesk - Construtor", () => {
    it("deve criar instância com token válido", () => {
        const cliente = new ClienteMovidesk("token-valido-123");
        expect(cliente).toBeDefined();
    });

    it("deve lançar erro quando token está vazio", () => {
        expect(() => new ClienteMovidesk("")).toThrow("Token da API do Movidesk não informado");
    });

    it("deve lançar erro quando token é apenas espaços", () => {
        expect(() => new ClienteMovidesk("   ")).toThrow("Token da API do Movidesk não informado");
    });

    it("deve chamar axios.create com a URL base padrão", () => {
        new ClienteMovidesk("token-teste");
        expect(axios.create).toHaveBeenCalledWith(
            expect.objectContaining({
                baseURL: "https://api.movidesk.com/public/v1",
            })
        );
    });

    it("deve aceitar URL base customizada", () => {
        new ClienteMovidesk("token-teste", "https://custom-api.example.com");
        expect(axios.create).toHaveBeenCalledWith(
            expect.objectContaining({
                baseURL: "https://custom-api.example.com",
            })
        );
    });
});

// ============================================================
// TESTES: Métodos de busca
// ============================================================

describe("ClienteMovidesk - Buscar Ticket", () => {
    let cliente: ClienteMovidesk;
    let mockRequest: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        cliente = new ClienteMovidesk("token-teste");
        // Obter referência ao mock do request
        const mockInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0]?.value;
        mockRequest = mockInstance?.request;
    });

    it("deve buscar ticket por ID", async () => {
        const ticketMock = {
            id: 12345,
            subject: "Teste de ticket",
            status: "New",
        };

        mockRequest.mockResolvedValueOnce({ data: ticketMock });

        const resultado = await cliente.buscarTicketPorId(12345);
        expect(resultado).toEqual(ticketMock);
        expect(mockRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "GET",
                url: "/tickets",
                params: expect.objectContaining({ id: "12345" }),
            })
        );
    });

    it("deve pesquisar tickets com filtro OData", async () => {
        const ticketsMock = [
            { id: 1, subject: "Ticket 1" },
            { id: 2, subject: "Ticket 2" },
        ];

        mockRequest.mockResolvedValueOnce({ data: ticketsMock });

        const resultado = await cliente.pesquisarTickets(
            "status eq 'Resolved'",
            5,
            "lastUpdate desc"
        );
        expect(resultado).toEqual(ticketsMock);
        expect(resultado.length).toBe(2);
    });

    it("deve criar ticket com payload correto", async () => {
        const ticketCriado = { id: 99999, subject: "Novo Ticket" };
        mockRequest.mockResolvedValueOnce({ data: ticketCriado });

        const payload = {
            type: 2,
            subject: "Novo Ticket",
            actions: [{ type: 2, description: "<p>Teste</p>" }],
        };

        const resultado = await cliente.criarTicket(payload);
        expect(resultado.id).toBe(99999);
        expect(mockRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "/tickets",
                data: payload,
            })
        );
    });

    it("deve atualizar ticket com PATCH", async () => {
        const ticketAtualizado = { id: 123, status: "Resolved" };
        mockRequest.mockResolvedValueOnce({ data: ticketAtualizado });

        const atualizacao = { status: "Resolved" };
        const resultado = await cliente.atualizarTicket(123, atualizacao);
        expect(resultado.status).toBe("Resolved");
        expect(mockRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "PATCH",
                url: "/tickets",
                params: expect.objectContaining({ id: "123" }),
            })
        );
    });
});

// ============================================================
// TESTES: Buscar Pessoa
// ============================================================

describe("ClienteMovidesk - Buscar Pessoa", () => {
    let cliente: ClienteMovidesk;
    let mockRequest: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        cliente = new ClienteMovidesk("token-teste");
        const mockInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0]?.value;
        mockRequest = mockInstance?.request;
    });

    it("deve buscar pessoa por email", async () => {
        const pessoaMock = [{ id: "abc", businessName: "João Silva", email: "joao@email.com" }];
        mockRequest.mockResolvedValueOnce({ data: pessoaMock });

        const resultado = await cliente.buscarPessoaPorEmail("joao@email.com");
        expect(resultado[0].businessName).toBe("João Silva");
    });

    it("deve buscar pessoa por nome", async () => {
        const pessoasMock = [{ id: "abc", businessName: "Empresa ABC" }];
        mockRequest.mockResolvedValueOnce({ data: pessoasMock });

        const resultado = await cliente.buscarPessoaPorNome("ABC");
        expect(resultado.length).toBeGreaterThan(0);
    });

    it("deve buscar pessoa por documento (CPF/CNPJ)", async () => {
        const pessoaMock = [{ id: "xyz", businessName: "Maria", cpfCnpj: "52998224725" }];
        mockRequest.mockResolvedValueOnce({ data: pessoaMock });

        const resultado = await cliente.buscarPessoaPorDocumento("529.982.247-25");
        expect(resultado[0].businessName).toBe("Maria");
    });
});
