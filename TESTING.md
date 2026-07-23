# Yoinkr — modo teste (fase de testers, 2026-07-22)

O que está ligado durante o teste com pessoas reais, o que é coletado, como se
descarta, e como funciona a frota de bots. Este arquivo É a documentação que o
founder pediu: tudo aqui foi desenhado para ser descartável com um SQL.

## 1. Coleta de logs (analytics)

**O quê:** eventos de jornada em `analytics.events` (projeto onsite-core), app
`yoinkr`. Cada evento: nome, `user_id` (null para guest), metadata (JSON com
sessão aleatória por abertura do app, plataforma, e campos do evento — nunca
conteúdo de mensagem, nunca email/nome).

**Eventos instrumentados:** `app_open`, `signup`, `login`, `setup_saved`,
`feed_view`, `listing_action`, `yoink_sent`, `post_published`, `post_edited`,
`chat_opened`, `message_sent`, `accept`, `decline`, `deal_done`,
`rating_sent`, `verify_started`, `verify_done`, `my_ads_view`,
`worker_profile_view`, `ad_tap`.

**Quem lê:** só o founder, no SQL Editor (RLS: client escreve, ninguém lê).

**Além disso, já existia:** conteúdo de chat fica em `yoinkr.messages`
(necessário para o app funcionar) e passa pela moderação automática
(`message_flags`). Aviso de transparência já aparece no topo de toda conversa.

**Descarte total dos logs do teste (um SQL):**
```sql
delete from analytics.events where app = 'yoinkr';
```

## 2. Frota de bots (teste às cegas)

**Design:** 5 personas são perfis normais no app — 3 trabalhadores (Marc T.,
Junior Silva, Kev Nguyen) e 2 empreiteiros (Beaudoin & Sons, Ottawa South
Builders) — com 4 anúncios no feed. Quem é bot está APENAS na tabela
`yoinkr.bots` (sem policy de leitura: o client não tem como descobrir).
Definições e personas: `onsite-core-db/scripts/seed_yoinkr_bots.mjs`.

**Como agem (edge functions `bot-reply` e `bot-engage`, Claude com a chave já
secreta no projeto):**
- Tester manda mensagem a um bot → o bot responde na persona, com delay
  humano (8–23s) e debounce (várias mensagens seguidas = uma resposta).
- Tester posta job/oferta → um bot compatível engaja em ~20–60s (yoink com
  proposta no job; mensagem na oferta) — todo tester tem contraparte.
- Bot empreiteiro aceita um yoink quando a conversa "fecha" (2–3 trocas) →
  nasce o deal, igual ao fluxo do app.
- Deal com bot marcado done → o bot avalia (4–5★) → o double-blind revela.

**Guardrails no prompt:** nunca marca encontro real, telefone ou pagamento;
nunca pede dado pessoal; deal é sempre "in-app only". Se perguntarem "você é
bot?", desconversa UMA vez; se insistirem, admite que é da equipe de teste do
app (o blind sobrevive à conversa casual sem virar mentira sustentada).

**Purga total da frota (um SQL — cascade leva perfis, anúncios, conversas,
applications, deals e ratings dos bots):**
```sql
delete from auth.users where email like '%@bot.yoinkr.test';
```
Depois, opcional: dropar triggers + tabela via migration de rollback.

## 3. Consentimento — leitura honesta (não é parecer jurídico)

- PIPEDA se aplica a coleta de dado pessoal mesmo em fase de teste; "é só
  teste" não é isenção. O que salva é que (a) os testers foram convidados e
  sabem que é teste, (b) o que se coleta é telemetria de uso padrão + chat
  necessário ao produto, (c) há aviso de transparência no chat.
- **Recomendação barata que fecha o assunto:** mandar aos testers (WhatsApp
  serve) uma linha assim antes de começar —
  *"Durante o teste, registramos como você usa o app (telas, toques,
  conversas) para melhorar o produto, e parte da atividade no app pode ser
  simulada. Dados do teste serão apagados ao final."*
  Com isso, a atividade simulada (bots) também fica coberta — o blind
  continua (ninguém sabe QUEM é simulado).
- **Fase 2 (metadados com consentimento):** quando quiser coletar além da
  telemetria (device, localização fina, contatos etc.), aí sim: tabela
  própria + tela de consentimento opt-in no app. Não construído ainda — de
  propósito.

## 4. O que NÃO está ligado

- Nenhum email é disparado ao tester além dos de auth (código/reset).
- Bots não iniciam conversa do nada — só reagem (mensagem recebida, anúncio
  novo, deal done).
- Bots não conversam entre si (guard no trigger).
