require('dotenv').config();
const axios = require('axios');

const scenarios = [
    {
        subject: '[TESTE] Problema de Performance em Consultas de Vendas',
        category: 'Problema',
        urgency: 'Média',
        descricao: 'O cliente relatou que a tela de consulta de vendas está levando mais de 30 segundos para carregar as notas do mês atual.',
        solucao: 'Foi identificado que faltava um índice na coluna data_emissao da tabela NF_MESTRE. Índice criado e performance normalizada.'
    },
    {
        subject: '[TESTE] Rejeição de NFe: Falha no Schema XML',
        category: 'Problema',
        urgency: 'Alta',
        descricao: 'Sistema acusando erro de schema ao tentar transmitir nota fiscal de devolução para a SEFAZ.',
        solucao: 'Atualizado o arquivo de configuração de schemas da SEFAZ para a versão 4.0. Transmissão voltou a funcionar.'
    },
    {
        subject: '[TESTE] Dúvida: Como cadastrar novo usuário com perfil de Caixa',
        category: 'Dúvida',
        urgency: 'Baixa',
        descricao: 'Gerente da loja deseja saber o passo a passo para criar novos usuários para os caixas temporários.',
        solucao: 'Enviado manual de treinamento em vídeo e realizado treinamento remoto rápido pelo AnyDesk.'
    },
    {
        subject: '[TESTE] Erro Crítico: Blue Screen no Servidor de Banco',
        category: 'Problema',
        urgency: 'Urgente',
        descricao: 'Servidor apresentou Blue Screen of Death (BSOD) após atualização automática do Windows Update.',
        solucao: 'Reiniciado o servidor em modo de segurança, revertido o último update e desabilitadas atualizações automáticas.'
    },
    {
        subject: '[TESTE] Solicitação: Exportação de Inventário para CSV',
        category: 'Solicitação de serviço',
        urgency: 'Média',
        descricao: 'Contabilidade solicitou um relatório customizado do inventário contendo apenas o NCM e a quantidade em estoque.',
        solucao: 'Criada consulta SQL personalizada e exportada para planilha Excel conforme solicitado.'
    },
    {
        subject: '[TESTE] Falha de Comunicação: Impressora de Etiquetas Zebra',
        category: 'Problema',
        urgency: 'Média',
        descricao: 'Impressora Zebra no setor de expedição parou de responder após queda de raio na vizinhança.',
        solucao: 'Identificado que a porta USB do computador queimou. Trocado o cabo para a porta traseira e reinstalado o driver.'
    },
    {
        subject: '[TESTE] Erro de Integração: API de Logística (Bling)',
        category: 'Problema',
        urgency: 'Alta',
        descricao: 'Pedidos pararam de ser enviados automaticamente para a logística. Log aponta erro de Token Expirado.',
        solucao: 'Gerado novo App Token na plataforma Bling e atualizada a chave de API no ERP do cliente.'
    },
    {
        subject: '[TESTE] Sugestão: Atalho para cancelamento rápido de item',
        category: 'Sugestão',
        urgency: 'Baixa',
        descricao: 'Os operadores de caixa sugeriram a criação de um atalho de teclado (ex: F11) para cancelar o último item bipado.',
        solucao: 'Sugestão encaminhada para o setor de desenvolvimento para análise de viabilidade técnica.'
    }
];

const sharedInfo = {
    createdBy: { id: '2046946454' },
    owner: { id: '2046946454', personType: 1, profileType: 1 }, // Cambiado a profileType 1 (Agente)
    ownerTeam: 'Administradores',
    clients: [{ id: '1022823234', personType: 2, profileType: 2 }],
    origin: 9,
    type: 2
};

async function criarTickets() {
    for (const data of scenarios) {
        const payload = {
            ...sharedInfo,
            subject: data.subject,
            category: data.category,
            urgency: data.urgency,
            tags: ['Teste', data.category],
            actions: [{
                type: 2,
                origin: 9,
                status: 'Resolvido',
                description: `
                    <p><strong>Descrição:</strong> ${data.descricao}</p>
                    <p><strong>Solução:</strong> ${data.solucao}</p>
                `
            }],
            status: 'Resolvido'
        };

        try {
            const r = await axios.post(
                `https://api.movidesk.com/public/v1/tickets?token=${process.env.MOVIDESK_TOKEN}&returnAllProperties=false`,
                payload
            );
            console.log(`✅ Ticket criado: #${r.data.id} - ${data.subject}`);

            // Esperar un pouco para evitar rate limit (padrão é 6s entre reqs no seu cliente, vamos colocar 1s aqui se não for barrado)
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.log(`❌ Erro no ticket "${data.subject}":`, e.response?.data ? JSON.stringify(e.response.data) : e.message);
        }
    }
}

criarTickets();
