# O Sistema — emagreça subindo de nível

Um app web no estilo "Sistema" de anime de caçadores: você é o **Jogador**, recebe uma
**Missão Diária** todos os dias e fica mais forte (de verdade) a cada nível.

## Como jogar

- **Missão Diária** (reseta à meia-noite): flexões, abdominais, agachamentos, caminhada/corrida,
  hidratação, alimentação limpa e sono. Cada missão concluída dá **+15 XP**; completar todas dá
  um bônus que cresce com a sua sequência de dias.
- **As metas crescem com o seu nível** — quanto mais forte você fica, mais o Sistema exige
  (até 100 repetições e 10 km). Escolha a dificuldade em *Config* (Iniciante = metade).
- **Missão de Penalidade**: se você não completar a diária, a sequência zera e aparece uma
  penalidade. Até concluí-la, todo XP ganho cai pela metade.
- **Masmorra Semanal**: complete a diária em 5 dos 7 dias da semana → **+300 XP**.
- **Peso**: registre o peso (+10 XP por dia) e ganhe **+100 XP por kg** abaixo do seu menor peso.
  Gráfico com linha de meta, histórico e IMC.
- **Níveis, ranks e classes**: E → D (nv 10) → C (20) → B (30) → A (45) → S (60).
  Cada nível dá 3 pontos para distribuir em FOR, AGI, VIT, PER e INT.
- **Conquistas e títulos**: 16 conquistas; toque numa desbloqueada para equipar o título.

## Como abrir

É só HTML/CSS/JS, sem instalação. Opções:

1. **GitHub Pages (recomendado p/ celular)**: no GitHub, *Settings → Pages → Deploy from a branch*,
   escolha a branch e a pasta `/ (root)`. Abra o link no celular e use
   *"Adicionar à tela inicial"* — vira um app que funciona offline.
2. **Local**: `python3 -m http.server` nesta pasta e abra `http://localhost:8000`.

Os dados ficam salvos só no aparelho (localStorage). Use **Config → Exportar backup** de vez em quando.

## Aviso

Este jogo é motivacional e não substitui orientação médica ou nutricional. Consulte um
profissional antes de começar, principalmente se tiver alguma condição de saúde. Perda saudável:
~0,5 a 1 kg por semana.
