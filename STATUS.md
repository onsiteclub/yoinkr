# STATUS — Yoinkr · diagnóstico de viabilidade

Data: 2026-07-09 · Agente Yoinkr · Sem alterações de código ou de config Supabase nesta rodada.

---

## Inventário

**Stack:** Expo 53 / React Native 0.79 / expo-router 5 / TypeScript / Zustand / `@supabase/supabase-js` 2.x. Roda em iOS, Android e web (`club.onsite.yoinkr`). Branding rota A (Site Orange `#FF5A1F`) já aplicado no app.

**Estado geral: muito mais avançado que protótipo.** Todas as telas existem e todas leem/escrevem via um único facade ([src/data/repository.ts](src/data/repository.ts)) que já fala Supabase de verdade — não há dados mockados em memória. O comentário "chat is still mock" no topo do repository está **desatualizado**: o chat está implementado com Supabase + Realtime (INSERT stream por conversa, unread por timestamp de leitura).

| Tela | Estado |
|---|---|
| `welcome` (landing + login) | UI pronta (split desktop / coluna mobile). **Auth não ligado** — "Log in", "Create account", Apple e Google são decorativos; tudo entra como guest (sessão anônima). |
| `(tabs)/index` (feed) | Funcional: filtros tipo (All/Jobs/Workers/Tools) + trade + gate de região, contador de jobs do fim de semana, roteamento por tipo de card. |
| `post` (publicar listing) | Funcional: job/worker/tool, trade, foto com compressão no upload (≤1280px JPEG 75% → bucket `photos`), validação de título. |
| `apply/[id]` ("Yoink it") | Funcional: proposta com mensagem + rate, idempotente (unique por job+worker). |
| `applicants/[id]` | Lista candidatos e abre conversa. **Aceitar/recusar candidatura não existe** no data layer (status fica `pending` para sempre). |
| `worker/[id]` (perfil público) | Funcional: perfil, portfólio, referências (ratings), botão de mensagem. |
| `chat/[id]` + `(tabs)/messages` | Funcionais com Realtime, unread, contexto do job na conversa. Presence (online) fora do v1, decidido. |
| `setup` / `(tabs)/profile` | Funcionais: completar perfil (gate "New worker"), toggle de disponibilidade, portfólio. |
| `region` | Funcional: Ottawa live, 6 cidades "coming soon" com empty state honesto. |

**Não implementado (além do auth):** fluxo de deal/rating (as tabelas `deals`/`ratings` estavam no schema antigo, o perfil *lê* ratings, mas nada *cria* deal nem rating); geolocalização real (`distance_km` sempre null); busca do header (campo existe, não filtra); report/block (tabelas previstas, sem UI).

**Higiene:** `.env` OK e testado (não reinvestigado, conforme diretiva). **Nenhuma referência hardcoded ao banco morto `lbdaigeyekdgbnldnhdq` no código-fonte** — grep no repo só encontra a menção no próprio CLAUDE.md. Não existe `.env.example` (vale criar um com placeholders). As migrations locais (`supabase/migrations/001–004`) foram deletadas do working tree — correto, DDL não vive aqui — mas o histórico git preserva o shape, usado abaixo.

---

## Lacunas (o que bloqueia o primeiro usuário publicar um listing e trocar mensagem)

Em ordem de bloqueio:

1. **Todas as queries apontam para o schema `public`.** O repository chama `supabase.from("profiles")` etc. sem `.schema("yoinkr")`, e a subscription Realtime hardcoda `schema: "public"`. Contra o `onsite-core` (onde `public` é vazio por regra), **toda query falha hoje**. Correção no app: criar o client com `db: { schema: "yoinkr" }` + ajustar o canal Realtime — trivial, mas depende dos itens 2 e 3.
2. **O schema `yoinkr` existe mas está vazio.** Nenhuma tabela. Pedido formal na seção "Tabelas necessárias".
3. **Data API só expõe `public, graphql_public`.** Mesmo com tabelas criadas, `.schema('yoinkr')` retorna `PGRST106` até o schema ser exposto nas settings do projeto. **Registrado aqui, não alterado** (conforme diretiva). É uma ação de config do lado do `onsite-core-db`.
4. **Auth é anônimo, não a conta única do grupo.** `ensureUserId()` faz `signInAnonymously()` no boot. Isso (a) exige o provider *Anonymous sign-ins* habilitado no `onsite-core` — não verificado, não é config nossa; (b) **não cumpre ainda** "quem tem conta Onsite entra com a mesma conta". O código já prevê o upgrade (`linkIdentity`/`updateUser` preserva o `user.id`), então o caminho anon-first → conta real é viável sem perder dados. Mas login com e-mail/senha de uma conta OnSite Club existente **não funciona hoje** — o form não chama `supabase.auth.signInWithPassword`. É a pendência nº 1 do app em si.
5. **Storage:** o app sobe fotos para um bucket `photos` que precisa existir no `onsite-core` (público-leitura, escrita restrita à pasta `{uid}/` — policies no shape da antiga migration 004). Como o Storage é compartilhado pela holding, sugiro bucket `yoinkr-photos` para não colidir com outros produtos — pedido junto com as tabelas.
6. **Realtime:** a tabela de mensagens precisa entrar na publication `supabase_realtime` (era a migration 003) — parte do pedido de migration, não do app.

**Veredito de viabilidade:** o app está a **uma migration + uma config de Data API + um dia de ajustes no client** (schema no createClient, canal Realtime, login real no welcome) de um primeiro usuário publicar um listing com foto e trocar mensagem. Nada precisa ser redesenhado.

---

## Tabelas necessárias (pedido ao `onsite-core-db` — não é DDL)

Tudo no schema **`yoinkr`**, RLS em todas, dado pertence à **pessoa** (`references auth.users(id)`), nunca a organização. Shape validado pelo código atual do app (o histórico git das migrations antigas serve de referência exata para o time do core-db: `git show 32e152e:supabase/migrations/001_schema.sql` … `004_storage.sql` neste repo).

| Tabela | Colunas essenciais | Dono do dado / RLS |
|---|---|---|
| `profiles` | `id uuid PK = auth.users.id` (**adicionar FK `references auth.users(id)` — a versão antiga não tinha**), `full_name`, `trade`, `years_exp`, `region`, `available`, `trust_score`, `deals_closed`, `verified`, `created_at` | Leitura pública; insert/update só o próprio (`id = auth.uid()`). |
| `listings` | `id`, `author_id → profiles`, `type ∈ (job, tool, available)`, `trade`, `title`, `pay`, `detail`, `city`, `location`, `distance_km`, `urgent`, `photo_url`, `status ∈ (open, closed)`, `created_at` | Leitura pública (status open); escrita só o autor. Índices: created_at desc, type, city. |
| `applications` | `id`, `listing_id → listings`, `applicant_id → profiles`, `message`, `proposed_rate`, `status ∈ (pending, accepted, declined)`, `created_at`, **unique (listing_id, applicant_id)** | Vê: candidato ou autor do listing. Insert: candidato. Update de status: autor do listing (necessário para o aceite, hoje inexistente). |
| `portfolio_photos` | `id`, `profile_id → profiles`, `photo_url`, `caption`, `created_at` | Leitura pública; escrita só o dono. |
| `conversations` | `id`, `listing_id → listings (nullable)`, `participant_a`, `participant_b`, `a_last_read`, `b_last_read`, `created_at`, **unique (a, b, listing_id) nulls not distinct** | Só participantes (select/insert/update). |
| `messages` | `id`, `conversation_id → conversations`, `sender_id`, `body`, `created_at` | Só participantes da conversa; **incluir na publication `supabase_realtime`**. Índice (conversation_id, created_at). |
| `deals` | `id`, `listing_id`, `worker_id`, `hirer_id`, `state ∈ (proposed, confirmed, rated)`, `proposed_by`, `created_at` | Só as duas partes. (Fase do fluxo de rating — pode vir na 2ª migration se preferirem enxugar a 1ª.) |
| `ratings` | `id`, `deal_id`, `rater_id`, `ratee_id`, `stars 1–5`, `comment`, `created_at` | Leitura pública (são as "references" do perfil); insert só parte de um deal confirmado. |
| `reports`, `blocks` | shape da migration antiga | Insert só o próprio; leitura restrita. Baixa prioridade, mas baratas de criar juntas. |

**Storage (mesmo pedido):** bucket `yoinkr-photos`, público-leitura, 5MB, `image/jpeg|png|webp`, escrita/delete restritos à pasta `{auth.uid()}/`.

**Config (mesmo pedido, não é migration):** expor `yoinkr` na Data API do projeto (`Exposed schemas`); confirmar/decidir provider *Anonymous sign-ins* (ver Perguntas).

---

## Risco de egress (fotos no feed) — plano

Plano Free: **5GB/mês de egress**. Cada card do feed pode ter foto; sem cuidado, um feed de 30 cards × ~200KB = 6MB por carga → ~800 cargas de feed já estouram o mês.

O que **já existe**: compressão no upload (resize ≤1280px, JPEG 75% → ~150–250KB) e `expo-image` (cache em disco por padrão). O que **falta**, em ordem de impacto:

1. **Thumbnail gerado no upload** (o plano Free não tem Image Transformations do Supabase, então a variante é feita no client): salvar duas versões — `{uid}/{ts}.jpg` (1280px, para a tela de detalhe) e `{uid}/{ts}_thumb.jpg` (~480px JPEG 70%, ~30–50KB). Feed usa só o thumb. Custo por carga de feed cai ~5×.
2. **Paginação do feed:** `getListings` hoje é sem limite. Adicionar `.range()` com página de ~20 e infinite scroll — limita tanto egress de imagem quanto de REST.
3. **Cache agressivo no client:** `expo-image` com `cachePolicy="disk"` explícito nos cards; URLs são imutáveis (path com timestamp), então cache nunca invalida errado.
4. **Guard-rail:** monitorar egress no dashboard quando abrir para usuários; a ~100 usuários (meta do v1), 1–3 é suficiente para ficar folgado dentro dos 5GB.

---

## Sinergias

**Eventos para `analytics.events`** (todos com `source: 'yoinkr'`; instrumentar no repository, que já centraliza toda escrita):

| Evento | Quando |
|---|---|
| `app_open` | boot com sessão estabelecida |
| `profile_completed` | setup deixa de ser "New worker" |
| `availability_toggled` | worker liga/desliga disponível |
| `listing_published` | createListing OK (props: type, trade, has_photo, urgent) |
| `listing_closed` | status → closed |
| `application_sent` | "Yoink it" (props: has_rate) |
| `application_accepted` / `_declined` | quando o aceite existir |
| `conversation_started` | getOrCreateConversation cria (não quando reusa) |
| `message_sent` | sendMessage OK |
| `photo_uploaded` | upload OK (props: kind: listing\|portfolio, bytes) |
| `rating_left` | quando o fluxo de rating existir |
| `region_selected` | troca de região (props: region, live) — sinal de demanda para expansão |

**SQFT — regra dura (decidida): recompensa por USO apenas, nunca sobre deals, contratações ou pagamentos.** Candidatos compatíveis: completar perfil, primeira foto de portfólio, primeiro listing publicado, streak semanal de app aberto. Fora da mesa: SQFT por aplicar, ser aceito, fechar deal, receber rating — qualquer coisa que crie incentivo financeiro sobre a transação.

**Ponte OnSite Club:** o tipo `Profile` já reserva `hoursVerified` (fase 2) — horas verificadas pelo Timekeeper como sinal de confiança no perfil Yoinkr. É a sinergia mais valiosa do grupo aqui: mesma conta, reputação que atravessa apps. Não requer nada agora além de manter `auth.users.id` como identificador (já é o caso).

---

## Website & cross-links

**A Yoinkr não tem site.** Não há pasta de website no repo nem projeto web separado; o app Expo tem target web, mas isso é o app, não presença pública.

**Proposta mínima (1 página estática):**
- Landing única com o kit pronto de `branding/logo-kit/` (lockups, favicon completo, splash) e as regras do `YOINKR-BRAND.md`: wordmark `yoinkr` minúsculo em Manrope 800, corpo Figtree, uma rota de cor só (o app já roda a Rota A — Site Orange; formalizar, ver Perguntas).
- Conteúdo: hero (símbolo + "Grab work · Lend a hand"), pill "Ottawa only — for now", 3 blocos (post work / find hands / build your reputation), CTA de waitlist/e-mail enquanto o app não está nas lojas.
- Rodapé: **"yoinkr is an Onsite Inc company"** + links para as irmãs — OnSite Club (onsiteclub.ca), InvoicePass, SquareFeet Advantages — e o inverso: pedir aos sites das irmãs o link de volta no rodapé de grupo.
- Domínio: o brand book (§12.5) lista a verificação de `yoinkr.app`/`yoinkr.ca` como pendência **ainda aberta**. Alternativa imediata sem compra: `yoinkr.onsiteclub.ca` (o cookie de SSO web em `.onsiteclub.ca` passa a valer aqui de graça — argumento forte para subdomínio mesmo a longo prazo).

---

## Perguntas ao fundador

1. **Modelo de auth do v1:** manter *anon-first* (entra sem conta, vira conta real depois via `linkIdentity` — exige habilitar Anonymous sign-ins no `onsite-core`, decisão que afeta o projeto compartilhado) **ou** exigir login/signup com a conta Onsite desde o primeiro uso (mais simples, mais alinhado ao "uma conta para tudo", mais atrito)? Isso decide o que eu ligo no `welcome`.
2. **Rota de cor:** o app inteiro já roda a Rota A (Site Orange). Posso cravar A e fechar a pendência §12.1 do brand book, ou você quer testar B/C no mockup antes?
3. **Deal/rating no v1?** O aceite de candidato e o fluxo deal→rating não existem no app (só a leitura de references). Sem isso, `trust_score` e `deals_closed` ficam em 0 para todo mundo. Entra no v1 ou lança-se só com chat e o trust fica de fase 2?
4. **Domínio:** comprar `yoinkr.ca`/`.app` (verificação CIPO/lojas/@yoinkr também pendente) ou lançar como `yoinkr.onsiteclub.ca` e herdar o SSO web do grupo?
5. **Bucket:** confirmo o pedido como `yoinkr-photos` (prefixado, já que o Storage do `onsite-core` é compartilhado)? O código hoje usa `photos` — ajusto junto com o `.schema("yoinkr")`.
6. **Lista SQFT:** os quatro candidatos de uso (perfil completo, primeira foto, primeiro listing, streak semanal) podem ir para o SquareFeet como proposta formal?
