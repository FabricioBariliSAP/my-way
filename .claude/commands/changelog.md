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

## 3. Criar commit semântico

Faça stage apenas dos arquivos relevantes (nunca `git add .` cegamente — revise com `git status` primeiro):

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" add -p   # ou adicione arquivos específicos
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" status   # confirme o que está staged
```

Crie o commit com mensagem semântica:

```
<tipo>(<escopo>): <descrição curta em inglês>

<corpo opcional: o que mudou e por quê>
```

Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`.

Exemplo:
```
feat(server): move HAI_KEY to environment variable

Hardcoded key replaced with process.env.HAI_KEY.
Added .env.example and .gitignore to prevent accidental exposure.
```

---

## 4. Criar tag de ponto de retorno

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" tag -a "checkpoint-YYYY-MM-DD-HH" -m "<título da mudança>"
```

Use o timestamp exato do commit para a tag.

---

## 5. Fazer push para GitHub

```bash
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" push origin main
git -C "c:/Users/I742960/PROJETOS/AI AGENTS/MY_WAY" push origin --tags
```

Se o push falhar por divergência de histórico, **não use force push**. Informe o usuário e mostre o erro.

---

## 6. Reportar ao usuário

Ao finalizar, mostre:
- Hash do commit criado
- Tag criada
- URL do commit no GitHub (formato: `https://github.com/fabriciobaril/my-way/commit/<hash>`)
- Conteúdo da entrada adicionada ao CHANGELOG.md
