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

## Plano personalizado (aba ✚ Plano)

No cadastro o Sistema pede altura, peso, meta, sexo, idade, nível de atividade, ritmo desejado,
cintura (opcional), gestação/amamentação e condições de saúde, e calcula:

| Item | Como é calculado |
|---|---|
| Metabolismo basal (TMB) | Mifflin-St Jeor |
| Gasto total | TMB × fator de atividade (1,2 a 1,725) |
| Meta calórica | Gasto total − déficit do ritmo (0,25 / 0,5 / 0,75 kg/sem; 7.700 kcal ≈ 1 kg), com déficit máximo de 25% e piso de 1.200 kcal (mulheres) / 1.500 kcal (homens) |
| Proteína | 1,6 g/kg do peso de referência (peso no IMC 25 se acima) |
| Gordura / carboidratos / fibras | ~28% das kcal / restante / 14 g por 1.000 kcal |
| Água | ~35 ml/kg (1,5–4 L), +300 ml gestação, +700 ml amamentação |
| IMC, faixa de peso saudável, cintura e cintura/altura | faixas da OMS / IDF |
| Sono, passos e atividade semanal | 7–9 h · 7–10 mil passos · 150–300 min (OMS 2020) |

Regras de segurança: menores de 18, gestantes/lactantes e IMC < 18,5 não recebem déficit calórico;
condições de saúde e IMC ≥ 35 geram alertas recomendando acompanhamento médico.
O plano é recalculado a cada novo peso, e as missões de **água, meta calórica, proteína e sono**
usam esses números. Quem já tinha um save recebe um pedido para completar a ficha de saúde.

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
