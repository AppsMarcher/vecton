# VectonPlan

SPA de planejamento financeiro da **Marcher Brasil**. Roda no browser (Vanilla JS, sem framework/bundler) sobre **Supabase** (PostgreSQL + Auth + RLS, multitenancy via `organization_id`).

> Caminho local: `C:\Users\rguimaraes\OneDrive - MARCHER BRASIL AGROINDUSTRIAL SA\Ãrea de Trabalho\VectonPlan`  
> ProduÃ§Ã£o: **https://vecton.marcher.com.br** â€” mudanÃ§as de frontend exigem deploy dos arquivos + bump do `?v=` no `index.html`.

## Stack & arquivos-chave

- `index.html` â€” shell Ãºnico da SPA; carrega ~25 scripts em ordem (a ordem importa).
- `app.js` â€” orquestrador: instancia os mÃ³dulos e contÃ©m lÃ³gica de DRE, OPEX, Headcount, Reports e Dashboard, alÃ©m dos fetches Supabase e todos os helpers de RBAC.
- `styles.css` â€” estilos globais (tema dark, tokens em `:root`).
- `supabase-config.js` â€” URL + anonKey (org "Marcher Brasil").
- `src/core/` â€” `constants.js`, `utils.js` (ex.: `normalizeCode` = sÃ³ dÃ­gitos), `storage.js`.
- `src/modules/` â€” IIFEs com namespace `window.VECTON_*`; cada `createXxxModule({deps})` recebe dependÃªncias do `app.js`.
  - `auth/authSession.js`, `navigation/navigationModule.js`, `ui/*`, `actuals/`, `budget/`, `headcount/`, `reports/` (DRE Soc/Ger, OPEX, Headcount), `dashboard/` (dashboardModule, dashboardCards, dashboardVisuals, marketTicker), `params/managementsModule.js`, `users/usersModule.js`.
- `supabase/NNN_*.sql` â€” migrations numeradas (rodar no SQL Editor).
- `supabase/functions/invite-user/index.ts` â€” Edge Function de convite (service_role).

## Modelo de acesso (RBAC) â€” **fail-closed**

PapÃ©is (`user_profiles.access_role`): `super_admin`, `admin`, `manager` (Gestor), `analyst` (Analista).

### Regras por papel
- **admin/super_admin**: enxergam tudo, sem restriÃ§Ã£o de CC ou gestÃ£o.
- **Gestor**: vÃª catÃ¡logo completo (incluindo DRE consolidado). Dados travados na prÃ³pria gestÃ£o + gestÃµes extras + CCs avulsos.
- **Analista**: nÃ£o vÃª DRE consolidado (`isConsolidatedReport`) nem Dashboard. OPEX e Headcount filtrados pela gestÃ£o/CCs permitidos.
- **Dashboard**: exibiÃ§Ã£o primÃ¡ria **sempre consolidada** (empresa toda), mesmo para Gestor. RestriÃ§Ã£o vale sÃ³ no drill-down (clique â†’ relatÃ³rio; popover "sem acesso" para outras Ã¡reas).

### Tipos de acesso extra (colunas em `user_profiles`)
| Campo | Tipo | Efeito |
|---|---|---|
| `management` | text | GestÃ£o primÃ¡ria do usuÃ¡rio |
| `extra_managements` | text[] | GestÃµes adicionais com acesso **pleno** |
| `extra_cc_ids` | uuid[] | CCs avulsos com acesso **parcial** (nÃ£o a gestÃ£o inteira) |
| `extra_report_ids` | uuid[] | RelatÃ³rios liberados individualmente |
| `extra_account_codes` | text[] | Contas contÃ¡beis liberadas individualmente |

### Helpers em `app.js`
- `getUserManagement()` / `getExtraManagements()` / `getExtraCcIds()`
- `getAllowedManagements()` â€” retorna `[primary, ...extras]` para restritos; `null` para admin.
- `getPartialManagements()` â€” `Map<mgmt, ccId[]>` das gestÃµes acessÃ­veis sÃ³ via `extra_cc_ids` (nÃ£o a gestÃ£o inteira).
- `getAllowedCcNumbers()` â€” `Set<string>` com nÃºmeros de CC permitidos (mapeia UUIDs via `state.costCenters`).
- `resolveManagementFilter()` â€” filtro ativo de gestÃ£o para OPEX/Headcount; sentinela `"__no_cc__"` quando sem gestÃ£o.
- `buildOpexCostCenterFilter()` / `buildOpexCcIdsFilter()` / `buildEffectiveOpexFilter()`
- `canSeeReport()` / `canSeeAccount()` / `isAccessRestricted()`

### Acesso parcial (management=null + extra_cc_ids)
Perfil sem gestÃ£o primÃ¡ria mas com CCs avulsos liberados:
- `getAllowedManagements()` â†’ `[]` (restrito, mas sem gestÃ£o plena).
- `getPartialManagements()` â†’ `Map { "NomeGestÃ£o" => [uuid-cc] }`.
- OPEX dropdown: exibe a gestÃ£o com sufixo "Â· parcial", dados filtrados sÃ³ pelos CCs autorizados.
- Dashboard HC: idem â€” dropdown mostra "GestÃ£o Â· parcial"; nÃºmero e drilldown refletem apenas os CCs do usuÃ¡rio.
- `resolveManagementFilter` retorna a gestÃ£o parcial como opÃ§Ã£o desbloqueada.

### Gotchas recorrentes
- Criar usuÃ¡rio de teste exige **DUAS** linhas: `organization_users` (membership â€” `is_org_member` consulta esta) **e** `user_profiles` (perfil/acesso).
- `hidden` HTML Ã© sobrescrito por `display:grid` em `.menu-stack`. Sempre usar `el.style.display = "none"` para esconder via JS.

## Performance (padrÃµes obrigatÃ³rios)

- **PaginaÃ§Ã£o por keyset** (`id=gt.${lastId}&order=id.asc`) sob Ã­ndice `(org, ano, mÃªs, id)`.
- **Busca por gestÃ£o no servidor** para perfis restritos (`fetchActuals/BudgetLedgerForManagementYear`, `hcCostSource`).
- **AgregaÃ§Ã£o server-side** no donut do dashboard: RPC `dash_opex_by_management` (migration 024).
- **DIRETRIZ**: toda otimizaÃ§Ã£o no REALIZADO deve estar 100% espelhada no BUDGET/PLANEJADO.

## Migrations (histÃ³rico recente)

| Migration | ConteÃºdo |
|---|---|
| 020 | Colunas `extra_*` em `user_profiles` |
| 022 | Ãndice `(org, ano, mÃªs, id)` em `budget_ledger_entries` |
| 023 | Mesmos Ã­ndices em `actuals_ledger_entries` e `headcount_entries` |
| 024 | RPC `dash_opex_by_management` â€” SECURITY DEFINER, agrega OPEX por gestÃ£o no servidor |
| 025 | Tabela `custom_reports` (id, org_id, created_by, label, config jsonb) â€” RLS: membros leem; sÃ³ admin escreve |

## Report Builder (`src/modules/reports/reportsBuilderModule.js`)

- MÃ³dulo IIFE (`window.VECTON_REPORTS_BUILDER`) integrado ao app.js como `reportsBuilderModule`.
- Admin vÃª botÃ£o "Novo relatÃ³rio" no catÃ¡logo â†’ builder com drag de colunas, filtros e prÃ©-visualizaÃ§Ã£o.
- RelatÃ³rios salvos em `custom_reports` (Supabase); visÃ­veis a todos os membros da org.
- Dados: `actuals_ledger_entries` via cache existente (`reportsLedgerCache`). RBAC via `getAllowedCcNumbers()`.
- Campos disponÃ­veis: `reference_year`, `reference_month`, `account_number`, `cost_center_number`, `management` (derivado client-side), `amount`, `load_type`, `branch_code`.

## Cache-busting

`index.html` usa `?v=YYYYMMDD[letra]` em todos os `<script src>` e `<link>` locais. **A cada deploy**: find & replace da versÃ£o antiga pela nova. VersÃ£o atual: `20260624n`.

> F5 normal nÃ£o invalida cache HTTP (max-age=600 no GitHub Pages). Ctrl+Shift+R limpa HTTP mas nÃ£o localStorage. Aba anÃ´nima sempre pega versÃ£o nova.

## Convite de usuÃ¡rios

- Modal "Convidar usuÃ¡rio" (ParÃ¢metros â†’ UsuÃ¡rios) â†’ Edge Function `invite-user` (service_role): cria auth user via `inviteUserByEmail` + `organization_users` + `user_profiles`. SÃ³ admin/super_admin; sÃ³ super_admin cria admin.
- Deploy da funÃ§Ã£o: `supabase functions deploy invite-user --no-verify-jwt`.
- **Definir senha**: ao clicar no link do email, `handleInviteRecoveryFlow` (authSession.js) detecta tokens no hash, exibe `#set-password-form`, faz `PUT /auth/v1/user`. Tokens limpos do hash com `history.replaceState`.
- SMTP: Office365 com `no-reply@marcher.com.br`, configurado no painel Supabase.
- Templates de email: HTML brandado, compatÃ­veis com Outlook â€” em `supabase/email-templates/`.

## Status dos bugs de acesso resolvidos

| # | Item | Status |
|---|---|---|
| 1 | Drilldown DRE SocietÃ¡rio (Real+Budget) por CC | âœ… |
| 2 | Drilldown DRE Gerencial (Real+Budget) por CC | âœ… |
| 3 | OPEX (Real+Planejado) travado na gestÃ£o + drilldown | âœ… |
| 5 | Headcount (Real+Planejado) drilldown por CC | âœ… |
| 6 | Dashboard headcount: primÃ¡rio consolidado, drill sÃ³ da gestÃ£o | âœ… |
| 7 | Dashboard donut OPEX: drill respeita gestÃ£o principal + complementares + parciais | âœ… |
| 8 | Menu ParÃ¢metros sÃ³ para super_admin/admin | âœ… |
| 9 | OPEX dropdown: exibe sÃ³ gestÃµes permitidas + parciais (sem "Marcher" para restritos) | âœ… |
| 10 | Ticker Soja/Milho: variaÃ§Ã£o % via localStorage (prev/today por data) | âœ… |

## PendÃªncias

- Validar visibilidade de "ParÃ¢metros" para Gestor RH (`mr.guima@gmail.com`) em prod.
- Testes com perfil **Analista** (2026-06-24): validar acesso parcial `management=null` + `extra_cc_ids`.

## Como continuar

MemÃ³ria detalhada: `~/.claude/projects/C--Claude/memory/project_vecton_plan.md`.
