# Fit Game — emagreça subindo de nível

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

## Academia (aba ⚔ Treino)

- Escolha os **dias da semana** e sua **experiência**. O app gera a divisão automaticamente:
  2× corpo inteiro A/B · 3× corpo inteiro A/B/C (iniciante) ou Empurrar/Puxar/Pernas ·
  4× Superiores/Inferiores · 5× Sup/Inf + Empurrar/Puxar/Pernas · 6× Empurrar/Puxar/Pernas ×2.
- Séries, repetições e descanso por nível (iniciante 3×12 · intermediário 3×10 · avançado 4×8–10),
  com cardio final (baixo impacto se o perfil de saúde pedir).
- **Check-in** de presença (+20 XP), registro de **carga** e **séries** com cronômetro de descanso,
  sugestão de progressão de carga, **finalizar treino** (+60 XP) e **recordes pessoais** (+25 XP).
- **Metas**: presença na semana e no mês, **Semana Perfeita** (+150 XP), sequência de semanas,
  histórico e 8 conquistas novas.
- Nos dias de academia, a Missão Diária troca flexões/abdominais/agachamentos por
  "Treino na academia".

## Relatório de evolução

Em **Status**, **Peso** ou **Config** → *Relatório*. Escolha o período (30 dias, 90 dias ou tudo) e:
- **Salvar PDF**: abre a impressão do celular/computador → "Salvar como PDF".
- **Baixar arquivo**: relatório em HTML para guardar e abrir/imprimir depois.
- **Planilha**: CSV dia a dia (peso, missão diária, presença, treino, séries, duração) que abre no Excel/Google Sheets.
- **Compartilhar**: resumo em texto para mandar para alguém.

Conteúdo: peso inicial/atual, variação, IMC, ritmo semanal, % da meta, cintura, gráfico de peso, média
semanal, missões e sequências, presença na academia, evolução de cargas por exercício, treinos
realizados, conquistas do período e plano atual.

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

## Como abrir no celular

1. **Hospede o app** (escolha uma):
   - **GitHub Pages**: o repositório é privado, e Pages em repositório privado exige GitHub Pro.
     Se deixar o repositório público (nenhum dado pessoal fica no código, o progresso fica só no
     celular): *Settings → Pages → Deploy from a branch* → escolha a branch e `/ (root)`.
   - **Netlify / Vercel / Cloudflare Pages** (grátis, aceitam repositório privado): conecte o
     repositório, sem comando de build, pasta de publicação `/`.
2. **Instale como app** (abra o link e faça isso *antes* de se cadastrar):
   - **iPhone (Safari)**: botão Compartilhar → *Adicionar à Tela de Início*.
   - **Android (Chrome)**: menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
3. Abra sempre pelo ícone. Funciona offline.

Para testar no computador: `python3 -m http.server` nesta pasta e abra `http://localhost:8000`.

### Onde fica salvo o progresso

- No próprio aparelho (localStorage). Nada é enviado para servidor.
- **iPhone**: o app da tela de início tem armazenamento separado do Safari, por isso cadastre-se
  já abrindo pelo ícone.
- O progresso se perde se você limpar os dados do navegador/site, desinstalar o app ou trocar de
  celular. Use **Config → Exportar backup** (o app lembra a cada 7 dias) e **Importar** para restaurar.

## Aviso

Este jogo é motivacional e não substitui orientação médica ou nutricional. Consulte um
profissional antes de começar, principalmente se tiver alguma condição de saúde. Perda saudável:
~0,5 a 1 kg por semana.
