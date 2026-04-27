import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';

// Importar rotas
import { authRoutes, adminRoutes, testRoutes, volunteerRoutes, projectRoutes } from './src/routes/index.js';

// Importar axios para chamadas API
import axios from 'axios';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Remover aviso do ngrok
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Garantir UTF-8 para todos os responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// ========== ROTA PRINCIPAL - SERVE O FRONTEND ==========
app.get("/", (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// ========== CONECTAR AO MONGODB ==========
await connectDB();

// ========== ROTAS DA API ==========
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projetos', projectRoutes);

// ========== ROTA DE INFORMAÇÕES DA API ==========
app.get("/api/info", (req, res) => {
  res.json({
    message: "Plataforma de Voluntários - API",
    version: "1.0.0",
    pais_foco: "Brasil",
    periodo_desastres: "Últimos 15 dias",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login"
      },
      volunteer: {
        profile: "GET /api/volunteer/profile",
        updateProfile: "PUT /api/volunteer/profile"
      },
      test: {
        questions: "GET /api/test/questions",
        submit: "POST /api/test/submit",
        result: "GET /api/test/result"
      },
      admin: {
        volunteers: "GET /api/admin/volunteers",
        dashboard: "GET /api/admin/dashboard"
      },
      desastres: {
        consultar: "GET /desastres"
      }
    }
  });
});

// ========== FUNÇÕES DE DESASTRE ==========

// Função para verificar se coordenada está no Brasil
function isInBrasil(lat, lon) {
  return (
    lat >= -33.75 && // Sul (Rio Grande do Sul)
    lat <= 5.27 &&   // Norte (Roraima)
    lon >= -73.98 && // Oeste (Acre)
    lon <= -34.79    // Leste (Paraíba)
  );
}

async function getToken() {
  const response = await axios.post(
    "https://iam.cloud.ibm.com/identity/token",
    new URLSearchParams({
      apikey: process.env.IBM_API_KEY,
      grant_type: "urn:ibm:params:oauth:grant-type:apikey"
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );
  return response.data.access_token;
}

async function analisarDesastres(dados) {
  const token = await getToken();

  const response = await axios.post(
    "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29",
    {
      input: `Analise esses desastres naturais e situações de vulnerabilidade social no BRASIL e classifique o nível de risco para a população (baixo, médio ou alto). Depois dê uma recomendação resumida: ${JSON.stringify(dados)}`,
      model_id: "ibm/granite-3-8b-instruct",
      project_id: process.env.PROJECT_ID,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        min_new_tokens: 20
      }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  return {
    analise: response.data.results[0]?.generated_text || "Sem resposta da IA",
    modelo: "ibm/granite-3-8b-instruct"
  };
}

// Função para buscar INCÊNDIOS no Brasil (apenas últimos 15 dias)
async function buscarIncendiosBrasil() {
  try {
    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);
    
    const response = await axios.get(
      `https://eonet.gsfc.nasa.gov/api/v3/events?api_key=${process.env.NASA_API_KEY}`
    );

    const eventos = response.data.events;
    const incendios = eventos
      .filter((evento) =>
        evento.categories.some((cat) => cat.title === "Wildfires")
      )
      .filter((evento) => {
        const coords = evento.geometry[0]?.coordinates;
        if (!coords) return false;
        const [lon, lat] = coords;
        return isInBrasil(lat, lon);
      })
      .filter((evento) => {
        const dataEvento = new Date(evento.geometry[0]?.date);
        return dataEvento >= quinzeDiasAtras;
      })
      .map((evento) => ({
        tipo: "incendio",
        titulo: evento.title,
        data: new Date(evento.geometry[0]?.date).toLocaleString('pt-BR'),
        coordenadas: evento.geometry[0]?.coordinates,
        status: "ATIVO",
        categoria: "desastre_natural"
      }))
      .sort((a, b) => new Date(b.data) - new Date(a.data));

    return incendios.slice(0, 5);
  } catch (error) {
    console.error("Erro na NASA:", error.message);
    return [];
  }
}

// Função para buscar VULNERABILIDADE SOCIAL
async function buscarVulnerabilidadeSocial() {
  try {
    const vagasSociais = [
      {
        tipo: "vulnerabilidade_social",
        titulo: "Distribuição de alimentos - Comunidade Paraisópolis",
        descricao: "Ajuda na organização e distribuição de cestas básicas",
        local: "São Paulo - SP",
        vagas: 8,
        data_inicio: "2026-04-20",
        data_fim: "2026-05-20",
        status: "VAGAS_ABERTAS",
        categoria: "acao_social"
      },
      {
        tipo: "vulnerabilidade_social",
        titulo: "Acolhimento em abrigo - Enchentes no RS",
        descricao: "Apoio emocional e acolhimento para famílias desabrigadas",
        local: "Porto Alegre - RS",
        vagas: 5,
        data_inicio: "2026-04-15",
        data_fim: "2026-05-15",
        status: "VAGAS_ABERTAS",
        categoria: "acao_social"
      },
      {
        tipo: "vulnerabilidade_social",
        titulo: "Campanha de agasalho - Região Sul",
        descricao: "Arrecadação e triagem de roupas e cobertores",
        local: "Curitiba - PR",
        vagas: 10,
        data_inicio: "2026-04-01",
        data_fim: "2026-05-30",
        status: "VAGAS_ABERTAS",
        categoria: "acao_social"
      }
    ];
    
    const hoje = new Date();
    const vagasAtivas = vagasSociais.filter(vaga => {
      const dataFim = new Date(vaga.data_fim);
      return dataFim >= hoje && vaga.status === "VAGAS_ABERTAS";
    });
    
    return vagasAtivas;
  } catch (error) {
    console.error("Erro ao buscar vulnerabilidade social:", error.message);
    return [];
  }
}

// ========== ROTA DE DESASTRES ==========
app.get("/desastres", async (req, res) => {
  try {
    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);
    
    const terremotos = await axios.get(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
    );

    const dadosTerremotos = terremotos.data.features
      .filter(item => {
        const [lon, lat] = item.geometry.coordinates;
        const dataEvento = new Date(item.properties.time);
        return isInBrasil(lat, lon) && 
               item.properties.mag > 2.5 && 
               dataEvento >= quinzeDiasAtras;
      })
      .map((item) => ({
        tipo: "terremoto",
        lugar: item.properties.place,
        magnitude: item.properties.mag,
        profundidade: item.geometry.coordinates[2],
        tempo: new Date(item.properties.time).toLocaleString('pt-BR'),
        status: "ATIVO",
        categoria: "desastre_natural"
      }))
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 5);

    const incendios = await buscarIncendiosBrasil();

    let inundacoes = [];
    try {
      const cemadenResponse = await axios.get(
        "https://alertas2.cemaden.gov.br/api/alertas/ultimos",
        { timeout: 5000 }
      );
      
      if (cemadenResponse.data && cemadenResponse.data.alertas) {
        inundacoes = cemadenResponse.data.alertas
          .filter(alerta => 
            (alerta.tipo === "INUNDACAO" || alerta.tipo === "ENCHENTE") &&
            alerta.pais === "Brasil"
          )
          .filter(alerta => {
            const dataAlerta = new Date(alerta.data);
            return dataAlerta >= quinzeDiasAtras;
          })
          .slice(0, 3)
          .map(alerta => ({
            tipo: "inundacao",
            local: `${alerta.cidade} - ${alerta.estado}`,
            risco: alerta.nivel_risco || "Médio",
            data: new Date(alerta.data).toLocaleString('pt-BR'),
            status: "ATIVO",
            categoria: "desastre_natural"
          }));
      }
    } catch (error) {
      console.log("API CEMADEN indisponível no momento");
    }

    const vulnerabilidadeSocial = await buscarVulnerabilidadeSocial();
    const todosEventos = [...dadosTerremotos, ...incendios, ...inundacoes, ...vulnerabilidadeSocial];

    if (todosEventos.length === 0) {
      return res.json({
        pais: "Brasil",
        data_consulta: new Date().toLocaleString('pt-BR'),
        timestamp: new Date().toISOString(),
        periodo_desastres: "Últimos 15 dias",
        mensagem: "Nenhum desastre natural ativo registrado no Brasil nos últimos 15 dias",
        vulnerabilidade_social: [],
        recomendacao: "Monitore a Defesa Civil do seu estado. Em caso de emergência, ligue 199 ou 193"
      });
    }

    const desastresNaturais = todosEventos.filter(e => e.categoria === "desastre_natural");
    const acoesSociais = todosEventos.filter(e => e.categoria === "acao_social");

    let analise = null;
    if (desastresNaturais.length > 0) {
      analise = await analisarDesastres(desastresNaturais);
    }

    res.json({
      pais: "Brasil",
      data_consulta: new Date().toLocaleString('pt-BR'),
      timestamp: new Date().toISOString(),
      periodo_desastres: "Últimos 15 dias",
      total_desastres: desastresNaturais.length,
      total_acoes_sociais: acoesSociais.length,
      distribuicao: {
        terremotos: dadosTerremotos.length,
        incendios: incendios.length,
        inundacoes: inundacoes.length,
        vulnerabilidade_social: acoesSociais.length
      },
      desastres_ativos: desastresNaturais,
      oportunidades_sociais: acoesSociais,
      analise_ia: analise?.analise || "Nenhum desastre natural ativo no período",
      modelo_utilizado: analise?.modelo || "N/A",
      recomendacao: "Para desastres: ligue 199 (Defesa Civil) ou 193 (Bombeiros). Para ações sociais: candidate-se através da plataforma."
    });

  } catch (error) {
    console.error("ERRO NA ROTA:", {
      mensagem: error.message,
      detalhe: error.response?.data
    });
    
    res.status(500).json({
      erro: "Falha ao processar requisição",
      detalhes: error.message
    });
  }
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/info`);
  console.log(`📡 Desastres: http://localhost:${PORT}/desastres`);
});