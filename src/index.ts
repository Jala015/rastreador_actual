import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import api from "@actual-app/api";
import { Eta } from 'eta'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const eta = new Eta({ views: path.join(__dirname, '../views') })

app.get('/', async (c) => {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1
  const dia = now.getDate();
  const diasDoMes = diasDoMesAtual();
  const dias_faltando = diasDoMes - dia;

  let budget_data = await getBudget(mes, ano);


  if (!budget_data) {
    return c.html(eta.render('error', {
      message: 'Erro ao obter dados do orçamento. Verifique as configurações do Actual.'
    }))
  }


  let poupado = 0;
  if (
    budget_data &&
    typeof budget_data === 'object' &&
    Array.isArray((budget_data as any).categoryGroups)
  ) {
    poupado =
      (budget_data as any).categoryGroups
        .find((group: any) => group.id === '9375bc52-e6df-4fd3-8dc0-77f859afc7bb')
        ?.categories.find((category: any) => category.id === 'be140a14-d3f5-4746-be80-0c3776cec629')
        ?.budgeted || 0;
  }

  //cálculos para gráfico dos dias
  let total_orcado = ((budget_data.totalBudgeted) / -100) - poupado / 100;
  let total_gasto = budget_data.totalSpent / -100;
  let orcamento_sobrando = total_orcado - total_gasto;
  let orcamento_sobrando_por_dia = orcamento_sobrando / dias_faltando;

  // para gerar barras de categorias

  let categorias = budget_data.categoryGroups.flatMap((group: any) => group?.categories.filter((category: any) => typeof category.budgeted === 'number' && typeof category.spent === 'number').filter((category: any) => category.budgeted !== 0 || category.balance !== 0).map((category: any) => ({
    nome: category.name,
    sobrando: category.balance / 100,
    porcentagem: 1 - Math.min(1, (category.balance! / 100) / (category.budgeted! / 100)),
  }))
  );


  return c.html(eta.render('index', {
    dia: dia,
    mes: mes,
    ano: ano,
    total_dias: diasDoMes,
    orcado: total_orcado,
    gasto: total_gasto,
    categorias: categorias,
    orcamento_sobrando_por_dia: orcamento_sobrando_por_dia.toFixed(2)
  }))
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


async function getBudget(mes: number, ano: number) {
  try {

    await api.init({
      dataDir: "./actual-data",
      serverURL: process.env.ACTUAL_URL,
      password: process.env.ACTUAL_PASSWORD,
    });

    await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_CODE);

    let budget = await api.getBudgetMonth(`${ano}-${String(mes).padStart(2, '0')}`);

    await api.shutdown();

    return budget
  } catch (error) {
    console.error(error)
  }

}


function diasDoMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth(); // 0 = Janeiro, 11 = Dezembro

  // Criamos uma data no dia 0 do próximo mês → isso retorna o último dia do mês atual
  return new Date(ano, mes + 1, 0).getDate();
}
