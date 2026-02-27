import { randomUUID } from "node:crypto";
import express, { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { criarServidorMcp } from "./servidor-mcp.js";

// ─── Validação de variáveis de ambiente ──────────────────────────────────────

function validateEnvironment(): void {
    if (!process.env.MOVIDESK_TOKEN) {
        console.error(
            "❌ ERRO FATAL: A variável de ambiente MOVIDESK_TOKEN não está definida."
        );
        console.error(
            '   Configure-a antes de iniciar o servidor:'
        );
        console.error(
            '   export MOVIDESK_TOKEN="seu-token-aqui"'
        );
        process.exit(1);
    }
    console.error("✅ MOVIDESK_TOKEN configurado.");
}

// ─── Inicialização do servidor HTTP ──────────────────────────────────────────

async function main(): Promise<void> {
    validateEnvironment();

    const PORT = parseInt(process.env.MCP_PORT || "3000", 10);

    // Express app pré-configurado para MCP (aceita 0.0.0.0 para Docker)
    const app = createMcpExpressApp({ host: "0.0.0.0" });

    // Mapa de transportes por session ID
    const transports: Record<string, StreamableHTTPServerTransport> = {};

    // ── POST /mcp ────────────────────────────────────────────────────────────
    app.post("/mcp", async (req: Request, res: Response) => {
        try {
            const sessionId = req.headers["mcp-session-id"] as string | undefined;
            let transport: StreamableHTTPServerTransport;

            if (sessionId && transports[sessionId]) {
                // Sessão existente
                transport = transports[sessionId];
            } else if (!sessionId && isInitializeRequest(req.body)) {
                // Nova inicialização
                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: (sid: string) => {
                        console.log(`✅ Sessão iniciada: ${sid}`);
                        transports[sid] = transport;
                    },
                });

                transport.onclose = () => {
                    const sid = transport.sessionId;
                    if (sid && transports[sid]) {
                        console.log(`🔌 Sessão encerrada: ${sid}`);
                        delete transports[sid];
                    }
                };

                // Instancia o nosso servidor MCP do Mcp_Eagle passando o token
                const server = criarServidorMcp(process.env.MOVIDESK_TOKEN!);
                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
                return;
            } else {
                res.status(400).json({
                    jsonrpc: "2.0",
                    error: {
                        code: -32000,
                        message: "Bad Request: sessão inválida ou requisição não é de inicialização.",
                    },
                    id: null,
                });
                return;
            }

            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error("❌ Erro no POST /mcp:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: "2.0",
                    error: { code: -32603, message: "Internal server error" },
                    id: null,
                });
            }
        }
    });

    // ── GET /mcp (SSE stream) ────────────────────────────────────────────────
    app.get("/mcp", async (req: Request, res: Response) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            res.status(400).send("Invalid or missing session ID");
            return;
        }
        await transports[sessionId].handleRequest(req, res);
    });

    // ── DELETE /mcp (encerrar sessão) ────────────────────────────────────────
    app.delete("/mcp", async (req: Request, res: Response) => {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !transports[sessionId]) {
            res.status(400).send("Invalid or missing session ID");
            return;
        }
        try {
            await transports[sessionId].handleRequest(req, res);
        } catch (error) {
            console.error("❌ Erro no DELETE /mcp:", error);
            if (!res.headersSent) {
                res.status(500).send("Erro ao encerrar sessão");
            }
        }
    });

    // ── Health check ─────────────────────────────────────────────────────────
    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok", server: "movidesk-mcp", version: "1.0.0" });
    });

    // ── Start ────────────────────────────────────────────────────────────────
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor MCP Movidesk (HTTP) rodando em http://0.0.0.0:${PORT}/mcp`);
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    process.on("SIGINT", async () => {
        console.log("Encerrando servidor...");
        for (const sid in transports) {
            try {
                await transports[sid].close();
                delete transports[sid];
            } catch { /* ignore */ }
        }
        process.exit(0);
    });
}

main().catch((error) => {
    console.error("❌ Erro fatal ao iniciar o servidor HTTP MCP:", error);
    process.exit(1);
});
