'use strict';

/* =========================================================
   Cálculos de saúde do Sistema
   Fórmulas e referências:
   - Taxa metabólica basal: Mifflin-St Jeor (1990)
   - Gasto total: TMB × fator de atividade (FAO/OMS)
   - IMC e faixas: Organização Mundial da Saúde
   - Cintura: OMS / IDF (risco aumentado e muito aumentado)
   - Relação cintura/altura: < 0,5 (Ashwell)
   - Água: ~35 ml por kg de peso; EFSA para gestação/lactação
   - Proteína: 1,6 g/kg do peso de referência durante déficit (ISSN)
   - Gordura: ~28% das calorias; fibras: 14 g por 1000 kcal
   - Atividade física: OMS 2020 (150–300 min/semana + força 2×)
   - Sono: National Sleep Foundation / AASM (adultos 7–9 h)
   Valores são estimativas populacionais, não prescrição médica.
   ========================================================= */

const ACTIVITY = {
  sedentario: { f: 1.2, label: 'Sedentário — trabalho sentado, quase sem exercício' },
  leve: { f: 1.375, label: 'Levemente ativo — exercício leve 1 a 3×/semana' },
  moderado: { f: 1.55, label: 'Moderadamente ativo — exercício 3 a 5×/semana' },
  alto: { f: 1.725, label: 'Muito ativo — exercício 6 a 7×/semana ou trabalho físico' },
};

const PACE = {
  suave: { kg: 0.25, label: 'Suave — ~0,25 kg por semana' },
  recomendado: { kg: 0.5, label: 'Recomendado — ~0,5 kg por semana' },
  acelerado: { kg: 0.75, label: 'Acelerado — ~0,75 kg por semana' },
};

const KCAL_PER_KG = 7700;

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Abaixo do peso', level: 1 };
  if (bmi < 25) return { label: 'Peso saudável', level: 0 };
  if (bmi < 30) return { label: 'Sobrepeso', level: 1 };
  if (bmi < 35) return { label: 'Obesidade grau I', level: 2 };
  if (bmi < 40) return { label: 'Obesidade grau II', level: 2 };
  return { label: 'Obesidade grau III', level: 3 };
}

function waistRisk(sex, waist) {
  const [elev, high] = sex === 'M' ? [94, 102] : [80, 88];
  if (waist >= high) return { label: 'Risco muito aumentado', level: 2, elev, high };
  if (waist >= elev) return { label: 'Risco aumentado', level: 1, elev, high };
  return { label: 'Adequada', level: 0, elev, high };
}

const round10 = (n) => Math.round(n / 10) * 10;

function healthProfileComplete(p) {
  return !!(p && p.sex && p.age && p.activity && p.pace);
}

function computePlan(p, weight) {
  const hM = p.height / 100;
  const bmi = weight / (hM * hM);
  const cat = bmiCategory(bmi);
  const healthyMin = 18.5 * hM * hM;
  const healthyMax = 24.9 * hM * hM;

  const bmr = 10 * weight + 6.25 * p.height - 5 * p.age + (p.sex === 'M' ? 5 : -161);
  const act = ACTIVITY[p.activity] || ACTIVITY.sedentario;
  const tdee = bmr * act.f;

  const minor = p.age < 18;
  const pregnant = p.pregnancy === 'gestante' || p.pregnancy === 'lactante';
  const restricted = minor || pregnant || bmi < 18.5;
  const floorKcal = p.sex === 'M' ? 1500 : 1200;

  const wanted = (PACE[p.pace] || PACE.recomendado).kg * KCAL_PER_KG / 7;
  const capped = Math.min(wanted, tdee * 0.25); // déficit máximo de 25% do gasto
  let kcal = restricted ? tdee : Math.max(floorKcal, tdee - capped);
  kcal = round10(kcal);
  if (p.pregnancy === 'gestante') kcal = round10(tdee + 300);
  if (p.pregnancy === 'lactante') kcal = round10(tdee + 400);
  const deficit = Math.max(0, Math.round(tdee - kcal));
  const pacePerWeek = (deficit * 7) / KCAL_PER_KG;

  // proteína pelo peso de referência (peso no IMC 25 quando acima disso)
  const refWeight = bmi > 25 ? 25 * hM * hM : weight;
  const protein = Math.round(refWeight * (restricted ? 1.2 : 1.6));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = Math.max(25, Math.round((kcal / 1000) * 14));

  let waterMl = Math.min(4000, Math.max(1500, weight * 35));
  if (p.pregnancy === 'gestante') waterMl += 300;
  if (p.pregnancy === 'lactante') waterMl += 700;
  waterMl = Math.round(waterMl / 100) * 100;
  const waterCups = Math.ceil(waterMl / 250);

  let sleep = '7 a 9 horas';
  if (p.age < 18) sleep = '8 a 10 horas';
  else if (p.age >= 65) sleep = '7 a 8 horas';

  const toGoal = Math.max(0, weight - p.goalWeight);
  const weeks = pacePerWeek > 0 ? toGoal / pacePerWeek : null;
  let goalDate = null;
  if (weeks != null && toGoal > 0) {
    goalDate = new Date();
    goalDate.setDate(goalDate.getDate() + Math.ceil(weeks * 7));
  }

  let waist = null;
  if (p.waist) {
    waist = { cm: p.waist, risk: waistRisk(p.sex, p.waist), whtr: p.waist / p.height };
  }

  const warnings = [];
  if (minor) warnings.push('Menores de 18 anos não devem fazer dieta com déficit calórico sem acompanhamento de pediatra ou nutricionista. O plano usa calorias de manutenção e foca em hábitos.');
  if (pregnant) warnings.push('Na gestação e na amamentação não se recomenda déficit calórico. O plano usa calorias de manutenção com acréscimo, e qualquer exercício deve ser liberado pelo seu obstetra.');
  if (bmi < 18.5) warnings.push('Seu IMC está abaixo da faixa saudável. O Sistema não vai sugerir déficit calórico. Procure um profissional de saúde.');
  if (p.conditions) warnings.push('Você informou uma condição de saúde. Metas de calorias, água e proteína podem precisar de ajuste (doenças renais ou cardíacas, por exemplo, podem exigir restringir líquidos ou proteína). Confirme estes números com seu médico antes de seguir.');
  if (bmi >= 35) warnings.push('Com IMC acima de 35, prefira exercícios de baixo impacto (caminhada, bicicleta, hidroginástica) e comece no modo Iniciante. Acompanhamento médico é especialmente recomendado.');
  if (!restricted && tdee - capped < floorKcal) warnings.push(`Seu déficit foi limitado ao mínimo seguro de ${floorKcal} kcal/dia, então o ritmo será mais lento que o escolhido. Não coma menos que isso sem acompanhamento.`);
  if (p.goalWeight < healthyMin) warnings.push(`Sua meta está abaixo da faixa saudável para sua altura (mínimo ~${healthyMin.toFixed(1)} kg). Considere revisar.`);

  return {
    bmi, cat, healthyMin, healthyMax,
    bmr: Math.round(bmr), tdee: Math.round(tdee), activityLabel: act.label,
    kcal, deficit, pacePerWeek, restricted, floorKcal,
    protein, fat, carbs, fiber,
    waterMl, waterCups, sleep,
    toGoal, weeks, goalDate,
    waist, warnings,
  };
}
