# CHANGELOG — MY_WAY

Histórico de mudanças do projeto SAP Investigation Tool.
Cada entrada representa um ponto de retorno (rollback point) versionado.

---

## [2026-08-11 — commit inicial] — Setup inicial do repositório

### Arquivos incluídos
- `server.js` — Servidor Node.js com RAG sobre knowledge base local
- `index.html` — Interface principal do assistente
- `GUIDE.html` — Guia de uso interno
- `package.json` — Dependências do projeto
- `.env.example` — Template de variáveis de ambiente
- `.gitignore` — Arquivos sensíveis e gerados excluídos do versionamento
- `skills/` — Skills de casos CS para o Claude Code
- `.claude/commands/changelog.md` — Skill `/changelog` para versionamento automatizado

### Mudanças de segurança
- `HAI_KEY` removida do hardcode em `server.js` → movida para `process.env.HAI_KEY` (lido de `.env`)
- `CASE_HANDLING.html` e `VIEW.html` excluídos do git por conterem chave de API
- `.env` excluído do git (contém credenciais reais)

### Ponto de retorno (rollback)
Este é o commit inicial — para voltar a este estado use:
```bash
git checkout <hash-deste-commit>
```

### Notas
Projeto rodando em Node.js na porta 3000, integrado ao Hyperspace AI local (porta 6655).
Para rodar: copie `.env.example` para `.env`, preencha `HAI_KEY`, e execute `npm start`.
