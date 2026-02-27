/**
 * ferramentas.test.ts — Testes das ferramentas MCP (handlers)
 * 
 * Testa cada uma das 7 ferramentas com mocks da API Movidesk.
 * Cobre cenários de sucesso, falha e validação de entrada.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Importar as funções de execução das ferramentas
import { executarCriarTicket } from "../src/ferramentas/criar-ticket.js";
import { executarConsultarTicket } from "../src/ferramentas/consultar-ticket.js";
import { executarBuscarConhecimento } from "../src/ferramentas/buscar-conhecimento.js";
import { executarAdicionarInteracao } from "../src/ferramentas/adicionar-interacao.js";
import { executarListarTickets } from "../src/ferramentas/listar-tickets.js";
import { executarAlterarStatus } from "../src/ferramentas/alterar-status.js";
import { executarAtribuirAgente } from "../src/ferramentas/atribuir-agente.js";
import { ClienteMovidesk } from "../src/cliente-movidesk/api.js";

// ============================================================
// MOCK — ClienteMovidesk falso para testes
// ============================================================

// Criar um mock completo do ClienteMovidesk
function criarClienteMock() {
    return {
        criarTicket: vi.fn(),
        buscarTicketPorId: vi.fn(),
        atualizarTicket: vi.fn(),
        pesquisarTickets: vi.fn(),
        buscarPessoaPorEmail: vi.fn(),
        buscarPessoaPorNome: vi.fn(),
        buscarPessoaPorDocumento: vi.fn(),
        buscarPessoaPorId: vi.fn(),
    } as unknown as ClienteMovidesk;
}

// ============================================================
// TESTES: criar_ticket
// ============================================================

describe("criar_ticket", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve criar ticket com sucesso usando macro de atendimento", async () => {
        // Simular resposta de sucesso da API
        (clienteMock.criarTicket as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Problema no login do sistema",
            status: "New",
        });

        const resultado = await executarCriarTicket(
            {
                assunto: "Problema no login do sistema",
                descricao: "Cliente não consegue acessar o sistema ERP",
                emailCliente: "cliente@empresa.com",
                urgencia: "Média",
                tipoMacro: "atendimento",
                nomeAtendente: "João Silva",
                canalAtendimento: "Telefone",
            },
            clienteMock
        );

        expect(resultado).toContain("✅");
        expect(resultado).toContain("#12345");
        expect(resultado).toContain("Problema no login do sistema");
    });

    it("deve criar ticket sem macro", async () => {
        (clienteMock.criarTicket as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 99999,
            subject: "Ticket simples",
            status: "New",
        });

        const resultado = await executarCriarTicket(
            {
                assunto: "Ticket simples",
                descricao: "Descrição simples do ticket sem macro",
                emailCliente: "user@test.com",
                urgencia: "Baixa",
                tipoMacro: "nenhuma",
            },
            clienteMock
        );

        expect(resultado).toContain("✅");
        expect(resultado).toContain("#99999");
    });

    it("deve exigir campos de escalonamento quando macro é 'escalonamento'", async () => {
        const resultado = await executarCriarTicket(
            {
                assunto: "Ticket Escalonado",
                descricao: "Problema grave que precisa de escalonamento",
                emailCliente: "user@test.com",
                urgencia: "Alta",
                tipoMacro: "escalonamento",
                // Faltam tentativasResolucao e motivoEscalonamento
            },
            clienteMock
        );

        expect(resultado).toContain("❌");
        expect(resultado).toContain("escalonamento");
    });

    it("deve tratar erro da API ao criar ticket", async () => {
        (clienteMock.criarTicket as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
            codigo: 400,
            mensagem: "❌ Requisição inválida. Verifique os dados enviados.",
            detalhes: "Campo 'subject' inválido",
        });

        const resultado = await executarCriarTicket(
            {
                assunto: "Ticket com erro",
                descricao: "Teste de erro na API",
                emailCliente: "user@test.com",
                urgencia: "Baixa",
                tipoMacro: "nenhuma",
            },
            clienteMock
        );

        expect(resultado).toContain("❌");
    });
});

// ============================================================
// TESTES: consultar_ticket
// ============================================================

describe("consultar_ticket", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve retornar detalhes do ticket encontrado", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Problema no sistema",
            status: "InAttendance",
            urgency: "High",
            category: "Suporte",
            createdDate: "2025-06-15T10:00:00Z",
            lastUpdate: "2025-06-15T14:00:00Z",
            actionCount: 3,
            clients: [{ businessName: "Empresa ABC", email: "contato@abc.com" }],
            owner: { businessName: "João Silva", email: "joao@suporte.com" },
            actions: [],
        });

        const resultado = await executarConsultarTicket(
            { ticketId: 12345 },
            clienteMock
        );

        expect(resultado).toContain("#12345");
        expect(resultado).toContain("Problema no sistema");
        expect(resultado).toContain("Em atendimento");  // Tradução do status
        expect(resultado).toContain("Empresa ABC");
        expect(resultado).toContain("João Silva");
    });

    it("deve informar quando ticket não é encontrado", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

        const resultado = await executarConsultarTicket(
            { ticketId: 99999 },
            clienteMock
        );

        expect(resultado).toContain("❌");
        expect(resultado).toContain("99999");
        expect(resultado).toContain("não encontrado");
    });
});

// ============================================================
// TESTES: buscar_conhecimento
// ============================================================

describe("buscar_conhecimento", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve retornar soluções encontradas", async () => {
        (clienteMock.pesquisarTickets as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
            {
                id: 100,
                subject: "Erro de login no ERP",
                status: "Resolved",
                category: "Suporte",
                createdDate: "2025-01-01T00:00:00Z",
                resolvedIn: "2025-01-02T00:00:00Z",
                actions: [
                    {
                        description: "Solução: Limpar o cache do navegador e tentar novamente.",
                        type: 2,
                        createdDate: "2025-01-02T00:00:00Z",
                        isDeleted: false,
                    },
                ],
            },
        ]);

        const resultado = await executarBuscarConhecimento(
            {
                descricaoProblema: "Login não funciona no ERP do cliente",
                quantidadeResultados: 5,
                incluirInteracoes: true,
            },
            clienteMock
        );

        expect(resultado).toContain("Base de Conhecimento");
        expect(resultado).toContain("Erro de login no ERP");
        expect(resultado).toContain("Limpar o cache");
    });

    it("deve informar quando nenhum resultado é encontrado", async () => {
        // Primeira busca: sem resultados
        (clienteMock.pesquisarTickets as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce([])    // Busca principal
            .mockResolvedValueOnce([]);   // Busca alternativa

        const resultado = await executarBuscarConhecimento(
            {
                descricaoProblema: "Problema totalmente novo e inexistente",
                quantidadeResultados: 5,
                incluirInteracoes: true,
            },
            clienteMock
        );

        expect(resultado).toContain("Nenhuma solução encontrada");
    });

    it("deve rejeitar descrição muito curta", async () => {
        const resultado = await executarBuscarConhecimento(
            {
                descricaoProblema: "de a o", // Apenas stop words
                quantidadeResultados: 5,
                incluirInteracoes: true,
            },
            clienteMock
        );

        expect(resultado).toContain("❌");
    });
});

// ============================================================
// TESTES: adicionar_interacao
// ============================================================

describe("adicionar_interacao", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve adicionar interação com sucesso", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Ticket de teste",
            status: "InAttendance",
        });
        (clienteMock.atualizarTicket as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

        const resultado = await executarAdicionarInteracao(
            {
                ticketId: 12345,
                conteudo: "Atualização: problema resolvido após reiniciar o serviço",
                publico: true,
                nomeAutor: "Maria",
            },
            clienteMock
        );

        expect(resultado).toContain("✅");
        expect(resultado).toContain("#12345");
        expect(resultado).toContain("Ticket de teste");
        expect(resultado).toContain("Pública");
    });

    it("deve informar erro quando ticket não existe", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            new Error("Não encontrado")
        );

        const resultado = await executarAdicionarInteracao(
            {
                ticketId: 99999,
                conteudo: "Tentando adicionar em ticket inexistente",
                publico: true,
            },
            clienteMock
        );

        expect(resultado).toContain("❌");
        expect(resultado).toContain("não encontrado");
    });
});

// ============================================================
// TESTES: listar_tickets_cliente
// ============================================================

describe("listar_tickets_cliente", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve listar tickets de um cliente por nome", async () => {
        (clienteMock.pesquisarTickets as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
            { id: 1, subject: "Ticket 1", status: "New", urgency: "Low", lastUpdate: "2025-01-01T00:00:00Z" },
            { id: 2, subject: "Ticket 2", status: "Resolved", urgency: "High", lastUpdate: "2025-02-01T00:00:00Z" },
        ]);

        const resultado = await executarListarTickets(
            { nomeCliente: "Empresa ABC", quantidade: 10 },
            clienteMock
        );

        expect(resultado).toContain("Empresa ABC");
        expect(resultado).toContain("Ticket 1");
        expect(resultado).toContain("Ticket 2");
        expect(resultado).toContain("2 ticket(s)");
    });

    it("deve exigir pelo menos um critério de busca", async () => {
        const resultado = await executarListarTickets(
            { quantidade: 10 },
            clienteMock
        );

        expect(resultado).toContain("❌");
        expect(resultado).toContain("Informe pelo menos um critério");
    });

    it("deve informar quando nenhum ticket é encontrado para o cliente", async () => {
        (clienteMock.pesquisarTickets as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

        const resultado = await executarListarTickets(
            { nomeCliente: "Cliente Fantasma", quantidade: 10 },
            clienteMock
        );

        expect(resultado).toContain("Nenhum ticket encontrado");
    });
});

// ============================================================
// TESTES: alterar_status_ticket
// ============================================================

describe("alterar_status_ticket", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve alterar status com sucesso", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Ticket para resolver",
            status: "InAttendance",
        });
        (clienteMock.atualizarTicket as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

        const resultado = await executarAlterarStatus(
            { ticketId: 12345, novoStatus: "Resolvido" },
            clienteMock
        );

        expect(resultado).toContain("✅");
        expect(resultado).toContain("Resolvido");
        expect(resultado).toContain("Em atendimento"); // Status anterior
    });

    it("deve rejeitar status inválido", async () => {
        const resultado = await executarAlterarStatus(
            { ticketId: 12345, novoStatus: "StatusFalso" },
            clienteMock
        );

        expect(resultado).toContain("❌");
        expect(resultado).toContain("não é válido");
    });

    it("deve exigir justificativa para status 'Parado'", async () => {
        const resultado = await executarAlterarStatus(
            { ticketId: 12345, novoStatus: "Parado" },
            clienteMock
        );

        expect(resultado).toContain("⚠️");
        expect(resultado).toContain("justificativa");
    });

    it("deve exigir justificativa para status 'Cancelado'", async () => {
        const resultado = await executarAlterarStatus(
            { ticketId: 12345, novoStatus: "Cancelado" },
            clienteMock
        );

        expect(resultado).toContain("⚠️");
        expect(resultado).toContain("justificativa");
    });

    it("deve informar quando ticket já está no status desejado", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Ticket já resolvido",
            status: "Resolved",
        });

        const resultado = await executarAlterarStatus(
            { ticketId: 12345, novoStatus: "Resolvido" },
            clienteMock
        );

        expect(resultado).toContain("já está com o status");
    });
});

// ============================================================
// TESTES: atribuir_agente
// ============================================================

describe("atribuir_agente", () => {
    let clienteMock: ClienteMovidesk;

    beforeEach(() => {
        clienteMock = criarClienteMock();
    });

    it("deve atribuir agente com sucesso", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Ticket para atribuir",
            owner: { id: "agente-antigo", businessName: "João" },
        });
        (clienteMock.atualizarTicket as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

        const resultado = await executarAtribuirAgente(
            {
                ticketId: 12345,
                agenteId: "agente-novo",
                nomeAgente: "Maria",
            },
            clienteMock
        );

        expect(resultado).toContain("✅");
        expect(resultado).toContain("Maria");       // Novo responsável
        expect(resultado).toContain("João");        // Responsável anterior
    });

    it("deve informar quando ticket já está atribuído ao mesmo agente", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Ticket",
            owner: { id: "mesmo-agente", businessName: "João" },
        });

        const resultado = await executarAtribuirAgente(
            { ticketId: 12345, agenteId: "mesmo-agente" },
            clienteMock
        );

        expect(resultado).toContain("já está atribuído");
    });

    it("deve tratar ticket sem responsável anterior", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            id: 12345,
            subject: "Sem responsável",
            owner: null,
        });
        (clienteMock.atualizarTicket as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

        const resultado = await executarAtribuirAgente(
            { ticketId: 12345, agenteId: "novo-agente", nomeAgente: "Carlos" },
            clienteMock
        );

        expect(resultado).toContain("✅");
        expect(resultado).toContain("Ninguém");  // Sem responsável anterior
    });

    it("deve tratar erro quando ticket não existe", async () => {
        (clienteMock.buscarTicketPorId as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            new Error("Não encontrado")
        );

        const resultado = await executarAtribuirAgente(
            { ticketId: 99999, agenteId: "agente" },
            clienteMock
        );

        expect(resultado).toContain("❌");
        expect(resultado).toContain("não encontrado");
    });
});
