# MY WAY — Manual do Utilizador
### Ferramenta de Investigação SAP com Assistência de IA

---

## Índice

1. [O que é o MY WAY](#1-o-que-é-o-my-way)
2. [Requisitos e Instalação](#2-requisitos-e-instalação)
3. [Iniciando a Ferramenta](#3-iniciando-a-ferramenta)
4. [Interface Principal](#4-interface-principal)
5. [Gerenciando Cases](#5-gerenciando-cases)
6. [Preenchendo os Metadados do Case](#6-preenchendo-os-metadados-do-case)
7. [Steps de Investigação](#7-steps-de-investigação)
8. [Tipos de Bloco de Conteúdo](#8-tipos-de-bloco-de-conteúdo)
9. [Assistente de IA — Sugestão de Steps](#9-assistente-de-ia--sugestão-de-steps)
10. [KBAs Referenciadas](#10-kbas-referenciadas)
11. [Export e Import](#11-export-e-import)
12. [Aba AI Assist — Análise Completa](#12-aba-ai-assist--análise-completa)
13. [Aba KBA — Rascunho de KBA](#13-aba-kba--rascunho-de-kba)
14. [Knowledge Base (RAG)](#14-knowledge-base-rag)
15. [Configuração de Prompts](#15-configuração-de-prompts)
16. [Criptografia de Estado](#16-criptografia-de-estado)
17. [Arquivo .env — Configuração](#17-arquivo-env--configuração)
18. [Perguntas Frequentes](#18-perguntas-frequentes)

---

## 1. O que é o MY WAY

O MY WAY é uma ferramenta local de investigação de suporte SAP que:

- Organiza investigações em **steps** estruturados com tipos de achado
- Usa **IA local** (via Hyperspace) para sugerir próximos passos baseado em contexto
- Mantém uma **base de conhecimento** (RAG) com casos passados e guias de KBA
- Permite **anexar KBAs** do SAP for Me para uso como contexto de análise
- Gera **rascunhos de KBA**, relatórios e documentação de resolução
- Salva estados de forma **criptografada** no servidor local

---

## 2. Requisitos e Instalação

| Requisito | Versão mínima |
|---|---|
| Node.js | 18+ |
| Hyperspace (Hyper AI local proxy) | Rodando em `localhost:6655` |
| Navegador | Chrome, Edge ou Firefox modernos |

### Instalação

```bash
# 1. Clone ou baixe o repositório
cd my-way

# 2. Instale dependências
npm install

# 3. Configure o .env (copie o exemplo)
cp .env.example .env
# Edite .env com sua HAI_KEY do Hyperspace

# 4. Inicie o servidor
node server.js
# ou
npm start
```

Abra `http://localhost:3000` no navegador.

---

## 3. Iniciando a Ferramenta

Ao abrir o `CASE_HANDLING.html` via `http://localhost:3000`:

1. **Novo case**: clique em **＋ Start Investigation** na área central
2. **Case existente**: clique no botão **Cases** na barra superior para listar e abrir um case salvo
3. **Importar**: clique em **Import** para carregar um arquivo `.zip` ou `.xml` exportado anteriormente

---

## 4. Interface Principal

```
┌─────────────────────────────────────────────────────────────┐
│  [Prompts] [View] [Import] [Cases] [Save] [Resolved] [Export]│  ← Barra superior
├──────────────┬──────────────────────────────────────────────┤
│ SIDEBAR      │  ÁREA PRINCIPAL                              │
│              │                                              │
│ ▼ Case       │  Step selecionado                           │
│   Metadados  │  (editor de blocos de conteúdo)             │
│              │                                              │
│ 📎 KBAs      │                                              │
│              │                                              │
│ Steps        │                                              │
│ ─────────    │                                              │
│ ▶ Step 1     │                                              │
│ ▶ Step 2     │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Barra superior — botões:**

| Botão | Função |
|---|---|
| **Prompts** | Abre o painel de configuração e contexto dos prompts de IA |
| **View** | Abre a visualização em formato de relatório |
| **Import** | Importa case de arquivo ZIP ou XML |
| **Cases** | Lista e gerencia todos os cases salvos |
| **Save** | Salva o case atual (localStorage ou servidor) |
| **Case Resolved** | Marca o case como resolvido e prepara documentação final |
| **Export / Generate** | Abre o modal de export com abas: AI, KBA, Mensagem, Package, etc. |

---

## 5. Gerenciando Cases

### Criar um novo case
1. Clique em **＋ Step** na sidebar para começar um case em branco, ou
2. Clique em **＋ Start Investigation** na área central

### Salvar
- Clique em **Save** na barra superior, ou pressione **Ctrl+S**
- O case é salvo no `localStorage` do navegador com a chave `sap_case_<caseId>`
- Se o armazenamento local estiver cheio, o dado é enviado ao servidor via `/api/save-state`

### Abrir case existente
1. Clique em **Cases** → lista todos os cases salvos
2. Clique no case desejado para carregá-lo
3. Casos também podem ser abertos diretamente via URL: `?case=CS1234567`

### Excluir case
No painel **Cases**, cada item tem um botão de exclusão (ícone de lixeira).

---

## 6. Preenchendo os Metadados do Case

Na sidebar, preencha os campos:

| Campo | Descrição |
|---|---|
| **Case ID** | Número do case SAP (ex: `CS20260012663452`) |
| **Customer** | Nome do cliente (anonimizado antes de enviar à IA) |
| **Environment** | Tipo de ambiente (PRD, TST, DEV, SBOX) |
| **DB Type** | Banco de dados (HANA, Oracle, etc.) |
| **Architecture** | Tipo de arquitetura (Hyperscalers, Legacy, etc.) |
| **Affects Version** | Versão do produto afetada (ex: `2311`) |
| **Symptom** | Descrição do sintoma que o cliente reportou |
| **Steps to Reproduce** | Passos numerados para reproduzir o problema |

> **Dica:** Use Enter no campo Symptom para adicionar bullets automáticos. Use números no campo Steps to Reproduce para auto-numerar.

---

## 7. Steps de Investigação

### Adicionar um step
- Clique em **＋ Step** na sidebar
- Ou clique em **🤖** para obter sugestões automáticas da IA

### Tipos de achado (Finding Type)

| Tipo | Ícone | Uso |
|---|---|---|
| **Info** | ℹ️ | Observação neutra, coleta de dado |
| **Clue** | 🔎 | Indício relevante, pista de investigação |
| **Highlight** | ⚡ | Ponto de atenção, achado importante |
| **Root Cause** | 🎯 | Causa raiz identificada |

### Editar um step
1. Clique no step na sidebar → abre o editor na área principal
2. Edite o título no campo superior
3. Mude o tipo de achado no seletor de tipo
4. Adicione blocos de conteúdo com os botões abaixo do editor

### Reordenar e agrupar
- **Grupos**: clique em **＋ Grupo** para criar um grupo temático e arraste steps para dentro
- **Links entre steps**: use `@S1`, `@S2`... no texto para criar referências cruzadas

---

## 8. Tipos de Bloco de Conteúdo

Dentro de cada step, você pode adicionar diferentes tipos de bloco:

| Bloco | Descrição |
|---|---|
| **Texto** | Anotações livres, observações, markdown |
| **SQL Query** | Consulta SQL executada (formatação de código) |
| **SQL Result** | Resultado da query (tabela ou texto raw) |
| **Log** | Trecho de log do sistema |
| **Imagem** | Screenshot ou imagem (PNG/JPG, máx 2 MB) |
| **Video** | Link para vídeo de evidência |
| **Tabela** | Dados tabulares |
| **Attachment** | Arquivo anexado como evidência |

### Mention de steps
No texto, digite `@` seguido do shortId do step (ex: `@S3`) para criar uma referência clicável ao step.

---

## 9. Assistente de IA — Sugestão de Steps

Clique no botão **🤖** na barra de steps da sidebar para abrir o painel de sugestões.

### Como funciona
1. O case atual (anonimizado) é enviado ao servidor
2. O servidor consulta a base RAG para buscar casos similares e guias relevantes
3. A IA (Hyperspace) gera 3–5 sugestões de próximos steps
4. Cada sugestão tem: título, tipo de achado, justificativa e orientação de execução

### Aceitar / rejeitar sugestões
- Clique em **✓ Adicionar** para aceitar um step sugerido
- Clique em **✕** para rejeitar (o step rejeitado não volta a ser sugerido)
- Clique em **Regenerar** para pedir novas sugestões

### Fontes RAG exibidas
Abaixo das sugestões, são exibidas as fontes da base de conhecimento que influenciaram a resposta (com percentual de similaridade).

---

## 10. KBAs Referenciadas

Na sidebar, abaixo de **Steps to Reproduce**, existe o painel **📎 KBAs Referenciadas**.

### Adicionar uma KBA
1. Digite o número da KBA no campo (ex: `3516395`)
2. Pressione **Enter** ou clique em **＋ Add**
3. O servidor tenta buscar o conteúdo em `https://me.sap.com/notes/{número}/E`

### Comportamento da busca
- **Se o conteúdo for público**: título e texto são carregados automaticamente
- **Se autenticação for necessária** (caso mais comum): uma textarea aparece para você colar o conteúdo manualmente
  1. Clique no link para abrir a KBA no SAP for Me
  2. Copie o texto relevante (sintoma, causa, resolução)
  3. Cole na textarea que aparece

### Impacto na IA
O conteúdo de todas as KBAs anexadas é incluído no contexto enviado à IA ao clicar em 🤖. A IA lê e considera o conteúdo das KBAs para formular os steps sugeridos.

### Remover uma KBA
Clique no botão **✕** ao lado da KBA desejada.

---

## 11. Export e Import

### Exportar case

Clique em **Export / Generate** → modal com as abas:

| Aba | Conteúdo |
|---|---|
| **AI Assist** | Análise completa gerada pela IA (Research, Cause, Solution) |
| **Internal** | Texto formatado para uso interno (Pulse/ServiceNow) |
| **External** | Comunicação formatada para envio ao cliente |
| **KBA** | Rascunho de KBA preenchido pela IA |
| **Message** | Mensagem para o cliente baseada na investigação |
| **Incident** | Registro de incidente / handover |
| **Package** | Export ZIP com XML do case + imagens |
| **Guide** | Relatório completo da investigação em Markdown |

### Exportar como ZIP
Na aba **Package**, clique em **Export ZIP** para baixar um arquivo com:
- `case.xml` — dados completos do case
- `attachments/` — imagens e arquivos anexados

### Importar
Clique em **Import** na barra superior:
- Selecione um `.zip` exportado ou um `.xml` de case SAP
- O case é carregado automaticamente com todos os steps e imagens

---

## 12. Aba AI Assist — Análise Completa

Na aba **AI Assist** do modal de export, clique em **Gerar Análise** para receber:

- **Internal Research**: Onde buscar informações internamente (KB, Jira, ServiceNow)
- **External Research**: KBAs e documentação SAP for Me relevantes
- **Cause**: Análise da causa raiz baseada nos steps
- **Solution / Workaround**: Passos de resolução ou workaround

O resultado pode ser copiado diretamente para o Pulse/ServiceNow.

---

## 13. Aba KBA — Rascunho de KBA

Na aba **KBA** do modal de export:

1. Clique em **AI Auto-Fill KBA** para que a IA preencha automaticamente:
   - Symptom
   - Steps to Reproduce
   - Cause
   - Resolution/Solution

2. Revise e ajuste o conteúdo gerado
3. Clique em **Save KBA** para salvar no estado do case

> O rascunho de KBA segue as regras do guia `kba_creation_skill.md` presente na pasta `knowledge/`.

---

## 14. Knowledge Base (RAG)

A base de conhecimento local usa embeddings para encontrar casos e guias similares.

### Pasta `knowledge/`
Coloque aqui qualquer arquivo `.md`, `.txt`, `.xml` ou `.zip` que queira indexar:

```
knowledge/
├── kba_creation_skill.md         ← Guia de criação de KBA
├── internal_research_skill.md    ← Guia de pesquisa interna
├── external_research_skill.md    ← Guia de pesquisa externa
├── cause_and_solution_skill.md   ← Guia de causa e solução
└── (seus arquivos de conhecimento)
```

### Indexar a base
1. Adicione arquivos na pasta `knowledge/`
2. No modal Export → aba **Package** → clique em **Re-index**
3. Ou faça uma chamada `POST /api/rag-index`

### Contribuir com um case
Quando um case é resolvido, clique em **Contribute to KB** para que o case seja indexado automaticamente.

### Verificar status
O painel de configuração de prompts mostra quais documentos estão disponíveis e quais estão indexados.

---

## 15. Configuração de Prompts

Clique em **Prompts** na barra superior para personalizar os prompts enviados à IA.

### Prompts disponíveis

| Prompt | Uso |
|---|---|
| **AI Assist — Análise Completa** | Modal Export → aba AI Assist |
| **AI Assist — Internal Research** | Seção específica de pesquisa interna |
| **AI Assist — External Research** | Seção específica de pesquisa externa |
| **AI Assist — Cause** | Análise de causa raiz |
| **AI Assist — Solution** | Formulação da resolução |
| **RAG Suggest** | Sugestão de steps (botão 🤖 na sidebar) |
| **KBA Fill** | Auto-preenchimento do rascunho de KBA |

### Contexto de cada prompt
Cada prompt tem um painel **⚙ Contexto & Sources** onde você configura:
- **Informações do case incluídas**: metadados, sintoma, steps, SQL/logs
- **Documentos do knowledge base**: quais arquivos da pasta `knowledge/` incluir como contexto

### Resetar prompt
Clique em **↺ Reset** para restaurar o texto padrão de qualquer prompt.

---

## 16. Criptografia de Estado

Quando o armazenamento local está cheio, o estado do case é salvo no servidor de forma **criptografada** com AES-256-GCM.

- A chave de criptografia é definida em `ENCRYPTION_KEY` no arquivo `.env`
- Sem essa chave, os dados criptografados não podem ser lidos
- **Importante**: configure uma chave forte e a guarde com segurança

```env
ENCRYPTION_KEY=minha-chave-forte-aqui
```

Os estados salvos ficam em `data/case_<id>.enc`.

---

## 17. Arquivo .env — Configuração

```env
# Endereço do proxy Hyperspace local
AI_HOST=http://localhost:6655

# Chave de API do Hyperspace
HAI_KEY=sua-chave-aqui

# Porta do servidor MY WAY
PORT=3000

# Chave de criptografia para estados salvos no servidor
ENCRYPTION_KEY=sua-chave-forte-aqui
```

> **Segurança**: nunca commite o arquivo `.env` no repositório. Ele está no `.gitignore`.

---

## 18. Perguntas Frequentes

**A IA não responde / erro 401**
- Verifique se o Hyperspace está rodando em `localhost:6655`
- Confirme que `HAI_KEY` no `.env` está correto
- Reinicie o servidor `node server.js` após alterar o `.env`

**"Nenhum documento indexado"**
- A lista de fontes é lida diretamente das pastas `knowledge/` e `skills/`
- Para usar os documentos na IA, clique em **Re-index** para gerar os embeddings

**KBA não carrega automaticamente**
- O SAP for Me (`me.sap.com`) requer autenticação
- Abra a KBA no navegador, copie o texto e cole na textarea que aparece

**O case não salva**
- Se aparecer erro de quota, o estado será enviado ao servidor automaticamente
- Certifique-se de que o servidor está rodando

**Como ver o relatório completo do case?**
- Clique em **View** na barra superior para abrir a visualização em relatório
- Ou acesse a aba **Guide** no modal de export

---

*MY WAY — SAP Investigation Tool | Desenvolvido para uso interno de suporte SAP*
