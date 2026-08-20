# /changelog — Versionar mudanças e gerar log estruturado

Ao receber `/changelog [mensagem opcional]`, execute **exatamente** os passos abaixo, na ordem. Não pule etapas. Não peça confirmação para passos não-destrutivos.

---

## 1. Verificar estado do repositório

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" status
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" diff --stat
```

Se não houver mudanças rastreáveis, informe o usuário e encerre.

---

## 2. Gerar entrada no CHANGELOG.md

Leia o histórico recente para entender o que mudou:

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" diff --name-status HEAD 2>/dev/null || git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" status --short
```

Abra `CHANGELOG.md` (crie se não existir). Adicione uma nova seção no **topo** do arquivo com este formato:

```markdown
## [YYYY-MM-DD HH:MM] — <título curto das mudanças>

### Arquivos alterados
- `arquivo.ext` — descrição do que mudou e por quê

### Ponto de retorno (rollback)
Para reverter estas mudanças:
```bash
git revert HEAD --no-edit   # ou git reset --soft HEAD~1 para desfazer sem perder arquivos
```

### Notas
<contexto adicional relevante>
```

Use a data atual em formato ISO. O título deve ser objetivo (ex: "Adiciona validação de input no server.js").

---

## 3. Atualizar whatsnew.json (dialog de novidades do app)

Leia o arquivo `whatsnew.json` para obter o build e versão atuais:

```bash
cat "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY/whatsnew.json"
```

Em seguida, escreva uma versão atualizada de `whatsnew.json` com:
- `build`: incrementado em 1
- `version`: incremento do patch (ex: `"1.0.2"` → `"1.0.3"`)
- `date`: data atual no formato `YYYY-MM-DD`
- `title`: título curto em **português** descrevendo as mudanças desta versão (max 60 chars)
- `changes`: lista de **3 a 8 itens** em **português**, cada um descrevendo uma mudança visível ao usuário — extraídos do diff/status atual. Seja específico e use linguagem de usuário (não de desenvolvedor). Exemplo: `"Modal de logs aceita múltiplos arquivos via drag & drop"`.

Formato exato do arquivo:
```json
{
  "build": <número>,
  "version": "<x.y.z>",
  "date": "<YYYY-MM-DD>",
  "title": "<título em português>",
  "changes": [
    "<mudança 1>",
    "<mudança 2>"
  ]
}
```

Salve o arquivo. Ele será incluído no commit do próximo passo.

---

## 4. Criar commit semântico

Faça stage dos arquivos relevantes **incluindo `whatsnew.json` e `CHANGELOG.md`** (nunca `git add .` cegamente — revise com `git status` primeiro):

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" add -p   # ou adicione arquivos específicos
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" add whatsnew.json CHANGELOG.md
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" status   # confirme o que está staged
```

Crie o commit com mensagem semântica:

```
<tipo>(<escopo>): <descrição curta em inglês>

<corpo opcional: o que mudou e por quê>
```

Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`.

---

## 5. Criar tag de ponto de retorno

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" tag -a "checkpoint-YYYY-MM-DD-HH" -m "<título da mudança>"
```

Use o timestamp exato do commit para a tag.

---

## 6. Fazer push para GitHub

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" push origin main
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" push origin --tags
```

Se o push falhar por divergência de histórico, **não use force push**. Informe o usuário e mostre o erro.

---

## 7. Reportar ao usuário

Ao finalizar, mostre:
- Hash do commit criado
- Tag criada
- Versão registrada no `whatsnew.json` (build + version)
- URL do commit no GitHub (formato: `https://github.com/fabriciobaril/my-way/commit/<hash>`)
- Conteúdo da entrada adicionada ao CHANGELOG.md
