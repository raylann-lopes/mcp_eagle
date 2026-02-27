/**
 * servidor-mcp.ts — Configuração e registro de todas as ferramentas MCP
 * 
 * Este arquivo é responsável por:
 * 1. Criar a instância do servidor MCP (McpServer)
 * 2. Criar a instância do cliente da API Movidesk
 * 3. Registrar todas as 7 ferramentas disponíveis com seus schemas Zod
 * 
 * As ferramentas registradas são:
 * - criar_ticket: Criar novos tickets com macro de suporte
 * - consultar_ticket: Buscar ticket por ID com detalhes completos
 * - buscar_conhecimento: Pesquisar base de conhecimento para resolver problemas
 * - adicionar_interacao: Adicionar ação/interação em ticket existente
 * - listar_tickets_cliente: Listar tickets de um cliente específico
 * - alterar_status_ticket: Mudar o status de um ticket
 * - atribuir_agente: Atribuir ticket a um agente/equipe
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ClienteMovidesk } from "./cliente-movidesk/api.js";

// Importar schemas e handlers de cada ferramenta
import { schemaCriarTicket, executarCriarTicket } from "./ferramentas/criar-ticket.js";
import { schemaConsultarTicket, executarConsultarTicket } from "./ferramentas/consultar-ticket.js";
import { schemaBuscarConhecimento, executarBuscarConhecimento } from "./ferramentas/buscar-conhecimento.js";
import { schemaAdicionarInteracao, executarAdicionarInteracao } from "./ferramentas/adicionar-interacao.js";
import { schemaListarTickets, executarListarTickets } from "./ferramentas/listar-tickets.js";
import { schemaAlterarStatus, executarAlterarStatus } from "./ferramentas/alterar-status.js";
import { schemaAtribuirAgente, executarAtribuirAgente } from "./ferramentas/atribuir-agente.js";

// ============================================================
// FUNÇÃO PRINCIPAL — Criar e configurar o servidor MCP
// ============================================================

/**
 * Cria e configura o servidor MCP com todas as ferramentas registradas
 * 
 * @param token - Token de autenticação da API do Movidesk
 * @returns Instância do McpServer configurada e pronta para uso
 */
export function criarServidorMcp(token: string): McpServer {
    // Criar o cliente da API Movidesk (compartilhado por todas as ferramentas)
    const clienteApi = new ClienteMovidesk(token);

    // Criar a instância do servidor MCP com metadados
    const servidor = new McpServer({
        name: "mcp-movidesk",
        version: "1.0.0",
        description: "Servidor MCP para gerenciamento de tickets do Movidesk — Suporte técnico",
    });

    // ============================================================
    // REGISTRO DAS FERRAMENTAS
    // ============================================================

    // —— 1. CRIAR TICKET ——
    servidor.tool(
        "criar_ticket",
        "Cria um novo ticket no Movidesk com macro de suporte formatada em HTML. " +
        "Ideal para registrar atendimentos após o suporte. " +
        "Suporta macros de atendimento e escalonamento. " +
        "Ao criar um ticket, SEMPRE formate o conteúdo em HTML profissional. " +
        "A macro de atendimento segue o formato: Descrição, Versão do(s) banco(s), Solução.",
        schemaCriarTicket.shape,
        async (parametros) => {
            // Executar a criação do ticket com os parâmetros validados pelo Zod
            const resultado = await executarCriarTicket(parametros, clienteApi);

            // Retornar no formato esperado pelo MCP (conteúdo de texto)
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    // —— 2. CONSULTAR TICKET ——
    servidor.tool(
        "consultar_ticket",
        "Busca os detalhes completos de um ticket do Movidesk pelo seu ID numérico. " +
        "Retorna todas as informações incluindo status, responsável, cliente, " +
        "interações, campos personalizados e datas.",
        schemaConsultarTicket.shape,
        async (parametros) => {
            const resultado = await executarConsultarTicket(parametros, clienteApi);
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    // —— 3. BUSCAR BASE DE CONHECIMENTO ——
    servidor.tool(
        "buscar_conhecimento",
        "Pesquisa na base de conhecimento do Movidesk (tickets resolvidos/fechados) " +
        "para encontrar soluções de problemas similares. Receba a descrição do " +
        "problema, busque tickets relacionados e retorne instruções de resolução. " +
        "Funciona como uma base de conhecimento viva da equipe de suporte.",
        schemaBuscarConhecimento.shape,
        async (parametros) => {
            const resultado = await executarBuscarConhecimento(parametros, clienteApi);
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    // —— 4. ADICIONAR INTERAÇÃO ——
    servidor.tool(
        "adicionar_interacao",
        "Adiciona uma interação (comentário/ação) em um ticket existente do Movidesk. " +
        "O conteúdo é automaticamente formatado em HTML. " +
        "IMPORTANTE: Pergunte ao usuário o número do ticket. " +
        "Se não souber, pergunte o nome do cliente para buscar o ticket. " +
        "Ao encontrar, confirme o título do ticket antes de inserir a ação.",
        schemaAdicionarInteracao.shape,
        async (parametros) => {
            const resultado = await executarAdicionarInteracao(parametros, clienteApi);
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    // —— 5. LISTAR TICKETS DO CLIENTE ——
    servidor.tool(
        "listar_tickets_cliente",
        "Lista os últimos tickets de um cliente específico, filtrando por nome " +
        "(razão social), email ou documento (CPF/CNPJ). " +
        "Útil para verificar histórico e evitar duplicidade antes de criar um novo ticket.",
        schemaListarTickets.shape,
        async (parametros) => {
            const resultado = await executarListarTickets(parametros, clienteApi);
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    // —— 6. ALTERAR STATUS DO TICKET ——
    servidor.tool(
        "alterar_status_ticket",
        "Altera o status de um ticket no Movidesk. " +
        "Status disponíveis: 'Novo', 'Em atendimento', 'Parado', 'Resolvido', " +
        "'Cancelado', 'Fechado'. " +
        "Alguns status como 'Parado' e 'Cancelado' exigem justificativa obrigatória.",
        schemaAlterarStatus.shape,
        async (parametros) => {
            const resultado = await executarAlterarStatus(parametros, clienteApi);
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    // —— 7. ATRIBUIR AGENTE ——
    servidor.tool(
        "atribuir_agente",
        "Atribui um ticket a um agente ou equipe específica no Movidesk, " +
        "alterando o responsável (owner) do ticket. " +
        "Use para escalonar ou redistribuir tickets entre a equipe.",
        schemaAtribuirAgente.shape,
        async (parametros) => {
            const resultado = await executarAtribuirAgente(parametros, clienteApi);
            return {
                content: [{ type: "text" as const, text: resultado }],
            };
        }
    );

    return servidor;
}
