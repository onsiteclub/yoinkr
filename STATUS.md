# STATUS — Yoinkr · pivô framing implementado

Data: 2026-07-18 · Substitui o diagnóstico de 2026-07-09 (visão multi-trade, morta).

---

## Backlog de correções (FEITO 2026-07-22) — para ligar

Sete itens do backlog do founder implementados (`tsc` limpo). **Passos do founder, nesta ordem:**

1. ~~Aplicar a migration `20260722100000_yoinkr_profile_nickname.sql`~~ **FEITO 2026-07-22** (push autorizado pelo founder; verificado vivo — select de `nickname` e o join do feed respondem 200).
2. ~~Template "Magic Link" precisa de SMTP próprio~~ **FEITO 2026-07-22** (via Management API, autorizado pelo founder): o onsite-core agora envia auth email por SMTP do Resend (`smtp.resend.com:465`, conta que o onsite-shop já usava, remetente `Onsite <contact@onsiteclub.ca>` — domínio já verificado), e o template Magic Link tem o código `{{ .Token }}` + link de fallback (subject "Your sign-in code"). Vale para o projeto compartilhado inteiro: TODOS os auth emails da holding (recovery, magic link) saem por aí agora — upgrade sobre o mailer embutido (limite de 2/h). `mailer_autoconfirm` continua ligado. Falta só o teste vivo: Profile → "Get the verified badge" → "Email me the code".

O que entrou:

- **Meus Anúncios + edição**: `/my-ads` (link no Profile) lista tudo que postei com status; tocar abre `/post?edit=<id>` — o mesmo form, prefilled, salvando via `updateListing` (RLS `listings_update` já permitia; faltava só o app). "Edit" no card do feed agora abre o anúncio certo (antes abria form em branco).
- **Yoink → chat (modelo FB Marketplace)**: yoinkar cria/abre a conversa do anúncio e manda a proposta como primeira mensagem — aparece na Tab Message dos dois lados; a Tab Message também escuta Realtime (`subscribeToInbox`) enquanto aberta.
- **Cards do feed**: descrição saiu do card (vive nas telas do anúncio), espaçamento 11→18.
- **Ad slots**: `AdSlot` genérico + `houseAds.ts` (shop OnSite, InvoicePass, Timekeeper), 1 a cada 3 posts, rotação por slot. Anunciante real depois = trocar a fonte em `houseAds.ts`; feed não muda.
- **Verificação opcional de email**: card no Profile → `/verify` → código OTP → `verified=true` (badge ✓ + recovery confiável). Não bloqueia nada; autoconfirm continua ligado. *Nota: `verified` é gravado pelo client (a RLS de update de perfil já permitia — buraco pré-existente); endurecer com trigger server-side antes do lançamento. Email "conta criada" no signup precisa de SMTP próprio/edge function — não feito.*
- **Nickname**: campo no setup; quando setado é o nome público em feed/chat/anúncios/vouches (`publicName`); o nome real fica só na edição.
- **Ícones do "+"**: emojis 🏗️/👷 → SVGs da marca (`PostChoiceIcons.tsx`, megafone/capacete, Char + Site Orange).

---

## Modo teste com bots + telemetria (FEITO 2026-07-22)

Fase de testers reais aberta. Tudo documentado em **TESTING.md** (coleta, purga, aviso ao tester). Resumo:

- **Telemetria**: `analytics.events` exposto no PostgREST e instrumentado no app (20 eventos de jornada, fire-and-forget, client só escreve). Descarte: `delete from analytics.events where app='yoinkr'`.
- **Frota de bots (blind test)**: 5 personas (3 workers, 2 hirers) + 4 anúncios; quem é bot só existe em `yoinkr.bots` (sem policy de leitura). Triggers pg_net → edge functions `bot-reply` (responde na persona, aceita yoink quando a conversa fecha) e `bot-engage` (engaja anúncio novo de humano; avalia deal done). Migration `20260722120000_yoinkr_bot_fleet.sql` aplicada; functions deployadas; smoke test vivo OK (Junior Silva yoinkou o job real de strapping com contra-proposta).
- **Purga da frota**: `delete from auth.users where email like '%@bot.yoinkr.test'`.
- **Email de mensagem nova (Kijiji model)**: trigger em `messages` → function `notify-message` → Resend. Throttle 30 min/conversa, skip se o destinatário leu a thread há <3 min, bots nunca recebem. Testado vivo. CTA "Reply on Yoinkr" espera o secret `APP_URL` (domínio em aberto). Push nativo = fase 2 (EAS + FCM/APNs; Expo Go não suporta).

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
2. ~~Reseedar~~ **SEED PURGADO 2026-07-22** (pedido do founder): os 5 usuários `*@seed.yoinkr.test` foram deletados via SQL (cascade levou 6 listings, ratings, vouches, portfólio e 1 application). Restaram só as 2 contas reais e seus 2 anúncios. O script `scripts/seed_yoinkr.mjs` continua no repo se um dia quiser demo data de volta.
3. Smoke test em dois devices: post job → yoink → accept → chat → mark done → rate dos dois lados → conferir reveal + média.

## Moderação de chat (FEITO 2026-07-21, testado e2e)

Pipeline assíncrono: INSERT em `yoinkr.messages` → trigger pg_net → Edge Function `moderate-message` → Claude Haiku classifica (`phone_share`, `sensitive_info`, `harassment`, `sexual`, `scam`, `csam`) → grava em `yoinkr.message_flags` (sem leitura pelo client; founder revisa no dashboard, `severity high` primeiro). **Telefone é flag + nudge no app, nunca bloqueio** (decisão de negócio: framing é ofício de telefone; o ativo é reputação, não comissão). CSAM em flag high = dever legal de reporte ao Cybertip.ca (lei federal de reporte obrigatório). Chave Anthropic vive como secret do projeto. Aviso de transparência no topo de toda conversa (PIPEDA). Falta: página formal de Privacy Policy + Terms antes de abrir além dos testers.

## Aberto (decisões/trabalho futuro)

- ~~Auth real no `welcome`~~ **FEITO e REFEITO para a fase de testers (2026-07-20):** o modelo agora é **ver sem cadastro, interagir com conta**. Não existe mais sessão anônima automática — navegar (feed, vagas, perfis, referências, indicações) é sessionless via anon key; qualquer interação (post, yoink, mensagem, vouch, avaliação, perfil) passa por `requireAccount()` e manda o guest para o `welcome?gate=1`, que abre direto no signup. **`mailer_autoconfirm` foi LIGADO no onsite-core** (via management API) para cadastro instantâneo sem e-mail — decisão da fase de teste, afeta o projeto compartilhado; reavaliar antes do lançamento (religar confirmação + SMTP próprio). Migration `20260720120000` deu `grant select` de `applications` ao role `anon` (RLS continua escondendo as linhas; só destrava o embed do feed). Testado vivo: signup retorna sessão na hora, browse guest 200 em todos os caminhos, escrita de guest 401. Apple/Google seguem desligados; botões "coming soon".
- Deal só nasce de application em **job**; contratar a partir de um anúncio de worker (`available`) ainda não gera deal — o hirer precisa postar o job. Aceitável no MVP, revisar depois.
- Egress de fotos (plano de thumbnails + paginação do feed) — plano de 2026-07-09 segue válido, não implementado.
- Eventos `analytics.events` (source `yoinkr`) — lista de 2026-07-09 segue válida, não instrumentada.
- SQFT (recompensa por uso, nunca por transação) e site (yoinkr.onsiteclub.ca vs domínio próprio) — decisões de 2026-07-09 seguem de pé, sem trabalho novo.
