# VectonPlan

SPA de planejamento financeiro da **Marcher Brasil**. Roda no browser (Vanilla JS, sem framework/bundler) sobre **Supabase** (PostgreSQL + Auth + RLS, multitenancy via `organization_id`).

> Caminho local: `C:\Users\rguimaraes\OneDrive - MARCHER BRASIL AGROINDUSTRIAL SA\Área de Trabalho\VectonPlan`

## Stack & arquivos-chave
- `index.html` — shell único da SPA; carrega ~25 scripts em ordem (a ordem importa).
- `app.js` — orquestrador (~5.500 linhas): instancia os módulos e contém lógica de DRE, OPEX, Headcount, Reports e Dashboard, além dos fetches Supabase.
- `styles.css` — estilos globais (tema dark, tokens em `:root`).
- `supabase-config.js` — URL + anonKey (org "Marcher Brasil").
- `src/core/` — `constants.js`, `utils.js` (ex.: `normalizeCode` = só dígitos), `storage.js`.
- `src/modules/` — IIFEs com namespace `window.VECTON_*`; cada `createXxxModule({deps})` recebe dependências do `app.js`.
  - `auth/authSession.js`, `navigation/navigationModule.js`, `ui/*`, `actuals/`, `budget/`, `headcount/`, `reports/` (DRE Soc/Ger/DFs, OPEX, Headcount), `dashboard/`, `params/managementsModule.js`, `users/usersModule.js`.
- `supabase/NNN_*.sql` — migrations numeradas (rodar no SQL Editor).

## Modelo de acesso (RBAC) — **fail-closed**
Papéis (`user_profiles.access_role`): `super_admin`, `admin`, `manager` (Gestor), `analyst` (Analista).
- **admin/super_admin**: enxergam tudo (`getAllowedCcNumbers()`/`resolveManagementFilter` retornam "sem restrição").
- **Gestor/Analista**: SEMPRE travados na própria gestão. Gestão sem CCs → relatório **vazio** (nunca "todas"). Sentinela `"__no_cc__"` quando o perfil não tem gestão.
- **Dashboard**: exibição primária é **consolidada (empresa)** mesmo para Gestor; a restrição por gestão vale só no **drill-down** (clique → relatório, popover de "sem acesso" se for outra área).
- Catálogo de relatórios: Gestor vê tudo; Analista não vê DRE consolidado (`canSeeReport`/`isConsolidatedReport`). `extra_report_ids` é concessão adicional.
- Helpers em `app.js`: `getAllowedCcNumbers()`, `canSeeReport()`, `canSeeAccount()`, `isAccessRestricted()`, `resolveManagementFilter()` (compartilhado por OPEX Real/Budget e Headcount).
- Criar usuário de teste exige **DUAS** linhas: `organization_users` (membership — `is_org_member` consulta esta) **e** `user_profiles` (perfil/acesso).

## Performance (padrões obrigatórios)
- **Paginação por keyset** (`id=gt.${lastId}&order=id.asc`) em vez de offset profundo, sob filtro `(org, ano, mês)`. Exige índice terminando em `id`.
- **Busca por gestão no servidor** para perfis restritos (`fetchActuals/BudgetLedgerForManagementYear`) em vez de baixar o ano inteiro e filtrar no cliente. Mesmo padrão no Headcount (`hcCostSource`).
- **Agregação server-side** no donut do dashboard: RPC `dash_opex_by_management` (migration 024) devolve ~10 linhas em vez de centenas de milhares.
- **DIRETRIZ**: toda otimização do REALIZADO deve estar 100% espelhada no BUDGET/PLANEJADO.

### Migrations recentes
- `022_budget_ledger_drilldown_index.sql` — índice `(org, ano, mês, id)` em `budget_ledger_entries`.
- `023_ledger_drilldown_indexes.sql` — mesmos índices em `actuals_ledger_entries` e `headcount_entries`.
- `024_dash_opex_by_management.sql` — função RPC de agregação do OPEX por gestão (SECURITY DEFINER, gated por `is_org_member`).

## Melhorias de UX desta sessão
- **Login → app**: ao logar, entra no app já com **overlay de blur + spinner** (`showAppLoading`/`hideAppLoading`) até o BD responder — sem flash do perfil anterior.
- **Início**: sempre no **Dashboard**, no **último mês com dados** (batch de realizado aplicado mais recente).
- **Campo de senha**: olhinho único de mostrar/ocultar (fica azul quando visível).
- **Parâmetros → Gestões**: drilldown expansível dos CCs de cada gestão (com nota de que a vinculação é definida no cadastro de Centros de Custo — só leitura ali).
- **Relatórios**: números tabulares, negativos em vermelho-suave, skeleton de loading, cards coloridos, edição inline de label/subtítulo (admin), reordenar.

## Status dos bugs de acesso (lista do cliente)
| # | Item | Status |
|---|---|---|
| 1 | Drilldown DRE Societário (Real+Budget) por CC | ✅ |
| 2 | Drilldown DRE Gerencial (Real+Budget) por CC | ✅ |
| 3 | OPEX (Real+Planejado) travado na gestão + drilldown | ✅ |
| 5 | Headcount (Real+Planejado) drilldown por CC | ✅ |
| 6 | Dashboard headcount: primário consolidado, drill só da gestão | ✅ |
| 7 | Dashboard donut: drill respeita gestão (popover sem acesso) | ✅ |
| 8 | Menu Parâmetros só para super_admin/admin | ✅ — `navigationModule` usa `style.display` (não `hidden`, que era sobrescrito por `.menu-stack{display:grid}`). Também esconde Dashboard (analista) e Usuários/Perfis |

> ⚠️ **Gotcha recorrente:** o atributo HTML `hidden` é sobrescrito por qualquer regra CSS de `display` na classe do elemento (mesma especificidade, autor > user-agent). Para esconder via JS, use `el.style.display = "none"`, não `el.hidden = true`.

## Convite de usuários (Edge Function + definir senha)
- Botão "Convidar usuário" (Parâmetros → Usuários) abre modal → chama a Edge Function `supabase/functions/invite-user` (service_role: cria auth user via `inviteUserByEmail` + `organization_users` + `user_profiles`). Só admin/super_admin; só super_admin cria admin.
- Deploy: `supabase functions deploy invite-user --no-verify-jwt` (CORS: validamos o JWT/role manualmente dentro).
- Frontend chama via `callEdgeFunction()` (app.js → `/functions/v1/<nome>` com token do usuário).
- **Definir senha**: ao clicar no link do email, o app detecta os tokens no hash (`handleInviteRecoveryFlow` em authSession), mostra o form `#set-password-form` e faz `PUT /auth/v1/user`. Requer Site URL/Redirect URLs configurados (`http://vecton.marcher.com.br` + `/**`).
- App publicado em **http://vecton.marcher.com.br** → mudanças de frontend exigem **deploy** dos arquivos.
- Lista de usuários agora tem **snapshot** (não mostra "Carregando" toda vez; atualiza em background).

## Como continuar
- Memória detalhada da sessão: `~/.claude/projects/C--Claude/memory/project_vecton_plan.md`.
- Usuário de teste atual: `mr.guima@gmail.com` (Gestor de "Recursos Humanos").
- Próximo: validar **#8** com o Gestor RH (confirmar que Parâmetros não aparece) e seguir a lista.
