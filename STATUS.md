# STATUS — Yoinkr · pivô framing implementado

Data: 2026-07-18 · Substitui o diagnóstico de 2026-07-09 (visão multi-trade, morta).

---

## A visão (decidida pelo founder, 2026-07-18)

"LinkedIn + Uber, específico para framing." Ottawa, só framing — o UX diz isso, sem rótulo.

- **4 categorias:** Framer, Roof framer, Backframer, General labour. Vaga tem UMA; pessoa tem VÁRIAS (checkboxes no perfil).
- **Preço estruturado:** qualquer categoria trabalha por hora; $/sqft e preço fechado só para as três skilled. General labour é hourly-only (check no banco).
- **Reputação estilo Uber, às cegas:** os dois lados avaliam após o deal; a nota fica oculta até o outro avaliar (ou 14 dias). Média só aparece com 3+ avaliações — regra vive na view `profile_stats`, não no client. **Sem linha de corte automática no MVP.**
- **Indicações (vouches):** endosso nominal de outro profissional, com categoria — separado das estrelas, nunca entra na média. 1 por par (voucher, vouchee).
- **Calote:** report tipado `non_payment` ligado ao deal; founder analisa manualmente no dashboard (tabela `reports`, sem leitura pelo client).
- **Ciclo:** post → Yoink → aceite (nasce o deal `agreed`) → `done` → avaliação dupla → `rated`.
- Ferramentas continuam como tipo secundário no feed.

## O que está pronto no código (este repo)

Tudo tipado e `tsc --noEmit` limpo. Anon-auth, chat Realtime, fotos e navegação intactos.

- `src/data/categories.ts` substituiu `trades.ts` (categorias + `payLabel`).
- `repository.ts`: pay estruturado, stats batch via `profile_stats`, aceitar/recusar → deal, `markDealDone`, `rateDeal` (double-blind aware), vouches, `reportUser`.
- Telas: `setup` (checkboxes + preferências, agora também é o editar perfil), `post` (categoria dita o modelo de preço), feed/filtros por categoria, `applicants` (Accept/Decline), `chat` (banner do deal: Mark done → Rate ★ → Rated; report de calote), `worker/[id]` (seção "Vouched by" + botão Vouch), `profile` (trust honesto + Edit).
- Cards: preço "$2.10/sqft · 1.850 sqft"; `TrustInline` degrada: ★média → "N closed" → NEW.

## Para ligar (founder, nesta ordem)

1. **Aplicar a migration** `20260718100000_yoinkr_framing_pivot.sql` (já escrita em `onsite-core-db`):
   `cd c:\Dev\onsite-core-db` → `npx supabase login` (ou `$env:SUPABASE_DB_PASSWORD="…"`) → `npx supabase db push`
   *(sem ela o app quebra: o client já espera `categories`/`pay_model`/`profile_stats`)*
2. **Reseedar:** `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/seed_yoinkr.mjs` (seed novo já no shape do pivô, com vouches e 3+ ratings).
3. Smoke test em dois devices: post job → yoink → accept → chat → mark done → rate dos dois lados → conferir reveal + média.

## Moderação de chat (FEITO 2026-07-21, testado e2e)

Pipeline assíncrono: INSERT em `yoinkr.messages` → trigger pg_net → Edge Function `moderate-message` → Claude Haiku classifica (`phone_share`, `sensitive_info`, `harassment`, `sexual`, `scam`, `csam`) → grava em `yoinkr.message_flags` (sem leitura pelo client; founder revisa no dashboard, `severity high` primeiro). **Telefone é flag + nudge no app, nunca bloqueio** (decisão de negócio: framing é ofício de telefone; o ativo é reputação, não comissão). CSAM em flag high = dever legal de reporte ao Cybertip.ca (lei federal de reporte obrigatório). Chave Anthropic vive como secret do projeto. Aviso de transparência no topo de toda conversa (PIPEDA). Falta: página formal de Privacy Policy + Terms antes de abrir além dos testers.

## Aberto (decisões/trabalho futuro)

- ~~Auth real no `welcome`~~ **FEITO e REFEITO para a fase de testers (2026-07-20):** o modelo agora é **ver sem cadastro, interagir com conta**. Não existe mais sessão anônima automática — navegar (feed, vagas, perfis, referências, indicações) é sessionless via anon key; qualquer interação (post, yoink, mensagem, vouch, avaliação, perfil) passa por `requireAccount()` e manda o guest para o `welcome?gate=1`, que abre direto no signup. **`mailer_autoconfirm` foi LIGADO no onsite-core** (via management API) para cadastro instantâneo sem e-mail — decisão da fase de teste, afeta o projeto compartilhado; reavaliar antes do lançamento (religar confirmação + SMTP próprio). Migration `20260720120000` deu `grant select` de `applications` ao role `anon` (RLS continua escondendo as linhas; só destrava o embed do feed). Testado vivo: signup retorna sessão na hora, browse guest 200 em todos os caminhos, escrita de guest 401. Apple/Google seguem desligados; botões "coming soon".
- Deal só nasce de application em **job**; contratar a partir de um anúncio de worker (`available`) ainda não gera deal — o hirer precisa postar o job. Aceitável no MVP, revisar depois.
- Egress de fotos (plano de thumbnails + paginação do feed) — plano de 2026-07-09 segue válido, não implementado.
- Eventos `analytics.events` (source `yoinkr`) — lista de 2026-07-09 segue válida, não instrumentada.
- SQFT (recompensa por uso, nunca por transação) e site (yoinkr.onsiteclub.ca vs domínio próprio) — decisões de 2026-07-09 seguem de pé, sem trabalho novo.
