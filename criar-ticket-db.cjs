require('dotenv').config();
const axios = require('axios');

const descricaoHtml = `<div style="font-family: Arial, sans-serif;">
<p><strong>Descrição:</strong></p>
<p>Cliente SUPERMERCADO COSTA NOVA entrou em contato relatando que o sistema ERP ficou completamente inacessível após uma queda de energia no servidor principal na madrugada de hoje (26/02). Ao tentar iniciar o sistema, o banco de dados retornava erro de corrupção nos índices das tabelas de movimentação fiscal (<code>NFE_SAIDA</code>, <code>ESTOQUE_MOV</code> e <code>FINANCEIRO_LANC</code>). O serviço do SQL Server apresentava estado <em>"Recovery Pending"</em> e não completava a inicialização. O cliente informou que não possuía nobreak no servidor e que a queda foi abrupta durante uma rotina de fechamento mensal.</p>

<p><strong>Versão do(s) banco(s) :</strong></p>
<p>2025.001</p>

<p><strong>Solução:</strong></p>
<ol>
  <li>Acesso remoto ao servidor do cliente via AnyDesk (ID: 458 332 109).</li>
  <li>Verificação inicial: SQL Server Management Studio confirmou status <em>"Recovery Pending"</em> no banco <code>COSTANOVA_PROD</code>.</li>
  <li>Executado <code>DBCC CHECKDB</code> com resultado de <strong>847 erros de consistência</strong> distribuídos em 3 tabelas principais.</li>
  <li>Tentativa de reparo com <code>DBCC CHECKDB (REPAIR_ALLOW_DATA_LOSS)</code> — falhou por conta de locks no filegroup primário.</li>
  <li><strong>Procedimento de restore executado:</strong>
    <ul>
      <li>Backup full de 25/02/2026 01:00 AM localizado em <code>D:\\Backups\\COSTANOVA_PROD_FULL_20260225.bak</code></li>
      <li>Backup de log de 25/02/2026 18:00 localizado em <code>D:\\Backups\\COSTANOVA_PROD_LOG_20260225_1800.trn</code></li>
      <li>Restore WITH NORECOVERY do backup full + restore do log WITH RECOVERY</li>
      <li>Banco restaurado com sucesso para o estado de 25/02/2026 18:00</li>
    </ul>
  </li>
  <li>Verificação pós-restore: <code>DBCC CHECKDB</code> retornou <strong>0 erros</strong>. Tabelas <code>NFE_SAIDA</code>, <code>ESTOQUE_MOV</code> e <code>FINANCEIRO_LANC</code> íntegras.</li>
  <li>Validação com o cliente: sistema aberto, módulos fiscal, estoque e financeiro funcionando normalmente. Perda de dados limitada ao período entre 18:00 de ontem e 06:14 de hoje (aproximadamente 12 horas de lançamentos manuais que o cliente irá reinserir).</li>
  <li><strong>Recomendação:</strong> instalação de nobreak no servidor e configuração de backup de log a cada 30 minutos para minimizar perda em futuros incidentes.</li>
</ol>

<p><strong>Observações:</strong></p>
<p>Cliente foi orientado sobre a importância de manter nobreak no servidor e backup em nuvem. Sugerida contratação do plano de backup gerenciado. O gerente do cliente (Sr. Roberto) ficou de aprovar o orçamento do nobreak até sexta-feira.</p>
</div>`;

const ticket = {
    type: 2,
    subject: 'Recuperação de Banco de Dados - Corrupção de índices após falha de energia (ALMEIDA E ALMDEIA)',
    urgency: 'Alta',
    status: 'Novo',
    origin: 9,
    category: 'Problema',
    serviceFirstLevel: 'Suporte',
    serviceSecondLevel: 'Nivel 1',
    createdBy: { id: '2046946454' },
    owner: { id: '2046946454', personType: 1, profileType: 3 },
    ownerTeam: 'Administradores',
    tags: ['Geral'],
    actions: [{
        type: 2,
        origin: 9,
        description: descricaoHtml,
        status: 'Novo'
    }],
    clients: [{
        id: '1022823234',
        personType: 2,
        profileType: 2
    }]
};

async function criar() {
    try {
        const r = await axios.post(
            'https://api.movidesk.com/public/v1/tickets?token=' + process.env.MOVIDESK_TOKEN + '&returnAllProperties=false',
            ticket
        );
        console.log('✅ TICKET CRIADO COM SUCESSO!');
        console.log('ID:', r.data.id);
        console.log('Assunto:', r.data.subject);
    } catch (e) {
        console.log('❌ ERRO:', JSON.stringify(e.response?.data || e.message, null, 2));
    }
}

criar();
