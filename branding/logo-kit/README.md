# yoinkr — logo kit v0.1 (Rota A · Site Orange)

Cores: accent #FF5A1F · ink #1E1B18 · warm paper #FFF8F4

## app-icon/
- ios-1024.png ......... App Store / Expo `"icon"`. Quadrado cheio, sem cantos (a Apple aplica a máscara).
- android-adaptive-foreground.png + android-adaptive-background.png
  Expo app.json:
    "android": { "adaptiveIcon": {
      "foregroundImage": "./assets/android-adaptive-foreground.png",
      "backgroundColor": "#FF5A1F" } }
- preview-rounded-512.png .. só referência visual, não subir pra loja.

## splash/
- splash-logo-light.png .... lockup vertical p/ fundo claro. Expo:
    "splash": { "image": "./assets/splash-logo-light.png",
                "resizeMode": "contain", "backgroundColor": "#FFF8F4" }
- splash-logo-onbrand.png .. versão toda branca p/ splash com fundo #FF5A1F.
- splash-example-1284x2778.png .. mock de como fica montado.

## favicon/ (web / PWA)
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
(favicon-16 usa traço engrossado p/ legibilidade)

## svg/ (masters — sempre editar a partir daqui)
- mark.svg (ink + ponto laranja) · mark-white.svg · mark-accent.svg · favicon.svg

## Pendências herdadas do brand doc
- Rota de cor ainda em aberto (A/B/C) — este kit é A. Regenerar é 1 comando.
- Refino da tensão ponto↔gancho antes do brand book v1.0.
- Wordmark: Manrope ExtraBold(800), tracking -2%. Fonte não incluída no kit (OFL, baixar do Google Fonts).
