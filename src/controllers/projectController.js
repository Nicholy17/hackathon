import Project from '../models/Project.js';
import User from '../models/User.js';
import VolunteerProfile from '../models/VolunteerProfile.js';

// Criar novo projeto (admin) - VERSÃO CORRIGIDA
export const criarProjeto = async (req, res) => {
  try {
    console.log('📝 Dados recebidos:', req.body);
    
    const {
      titulo,
      descricao,
      tipo,
      local,
      localCompleto,
      horarios,
      responsavel,
      instrucoes,
      beneficios,
      contatoEmergencia,
      vagasTotais,
      dataInicio,
      dataFim
    } = req.body;

    // Validar campos obrigatórios
    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    if (!descricao) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }
    if (!tipo) {
      return res.status(400).json({ error: 'Tipo é obrigatório' });
    }
    if (!vagasTotais || vagasTotais < 1) {
      return res.status(400).json({ error: 'Número de vagas inválido' });
    }
    
    // Validar e converter datas
    let dataInicioObj = null;
    let dataFimObj = null;
    
    if (dataInicio && dataInicio !== '') {
      dataInicioObj = new Date(dataInicio);
      if (isNaN(dataInicioObj.getTime())) {
        return res.status(400).json({ error: 'Data de início inválida' });
      }
    } else {
      dataInicioObj = new Date(); // Data atual como fallback
    }
    
    if (dataFim && dataFim !== '') {
      dataFimObj = new Date(dataFim);
      if (isNaN(dataFimObj.getTime())) {
        return res.status(400).json({ error: 'Data de término inválida' });
      }
    }
    
    const projeto = new Project({
      titulo: titulo,
      descricao: descricao,
      tipo: tipo,
      local: local || {},
      localCompleto: localCompleto || {},
      horarios: horarios || {},
      responsavel: responsavel || {},
      instrucoes: instrucoes || {},
      beneficios: beneficios || {},
      contatoEmergencia: contatoEmergencia || {},
      vagasTotais: parseInt(vagasTotais),
      vagasPreenchidas: 0,
      dataInicio: dataInicioObj,
      dataFim: dataFimObj,
      status: 'aberto',
      criadoPor: req.user.id
    });

    await projeto.save();
    
    console.log('✅ Projeto criado com sucesso:', projeto._id);

    res.status(201).json({
      message: 'Projeto criado com sucesso',
      projeto
    });
  } catch (error) {
    console.error('❌ Erro ao criar projeto:', error);
    res.status(500).json({ error: 'Erro ao criar projeto', detalhe: error.message });
  }
};

// Listar todos os projetos (admin/public) - VERSÃO CORRIGIDA
export const listarProjetos = async (req, res) => {
  try {
    const { status, tipo } = req.query;
    let filtro = {};

    if (status) filtro.status = status;
    if (tipo) filtro.tipo = tipo;

    const projetos = await Project.find(filtro).sort('-createdAt');
    
    // Para cada projeto, buscar os dados dos voluntários
    const projetosComDados = await Promise.all(projetos.map(async (projeto) => {
      const voluntariosComDados = [];
      
      for (const vol of (projeto.voluntarios || [])) {
        if (vol.voluntarioId) {
          const perfil = await VolunteerProfile.findOne({ user: vol.voluntarioId }).populate('user', 'email');
          if (perfil) {
            voluntariosComDados.push({
              ...vol.toObject(),
              voluntarioId: perfil
            });
          } else {
            voluntariosComDados.push(vol);
          }
        } else {
          voluntariosComDados.push(vol);
        }
      }
      
      return {
        ...projeto.toObject(),
        voluntarios: voluntariosComDados
      };
    }));
    
    res.json(projetosComDados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar projetos' });
  }
};

// Buscar projeto por ID
export const buscarProjeto = async (req, res) => {
  try {
    const { id } = req.params;
    const projeto = await Project.findById(id)
      .populate('voluntarios.voluntarioId', 'email')
      .populate('criadoPor', 'email');

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    res.json(projeto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar projeto' });
  }
};

// Candidatar-se a um projeto (voluntário) - VERSÃO CORRIGIDA
export const candidatarProjeto = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('📝 Usuário tentando se candidatar:', userId);
    
    // Buscar o perfil do voluntário
    const perfil = await VolunteerProfile.findOne({ user: userId });
    
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil de voluntário não encontrado' });
    }
    
    console.log('📝 Perfil do voluntário encontrado:', perfil._id);
    
    // Buscar o projeto
    const projeto = await Project.findById(id);
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Verificar se o projeto está aberto
    if (projeto.status !== 'aberto') {
      return res.status(400).json({ error: 'Projeto não está aceitando candidaturas' });
    }

    // Verificar vagas
    if (projeto.vagasPreenchidas >= projeto.vagasTotais) {
      return res.status(400).json({ error: 'Limite de vagas atingido' });
    }

    // Verificar se já está inscrito
    const jaInscrito = projeto.voluntarios.some(
      v => v.voluntarioId && v.voluntarioId.toString() === perfil._id.toString()
    );
    
    if (jaInscrito) {
      return res.status(400).json({ error: 'Você já está inscrito neste projeto' });
    }

    // Adicionar voluntário com status 'pending' (pendente)
    projeto.voluntarios.push({
      voluntarioId: perfil._id,
      dataCandidatura: new Date(),
      dataInscricao: new Date(),
      status: 'pending'  // IMPORTANTE: começa como pending, NÃO rejected
    });

    await projeto.save();
    
    console.log('✅ Candidatura realizada com sucesso! Status: pending');

    res.json({
      message: 'Candidatura realizada com sucesso! Aguarde a aprovação do administrador.',
      projeto: {
        id: projeto._id,
        titulo: projeto.titulo,
        vagasDisponiveis: projeto.vagasTotais - projeto.vagasPreenchidas,
        status: projeto.status
      }
    });
  } catch (error) {
    console.error('❌ Erro ao candidatar-se:', error);
    res.status(500).json({ error: 'Erro ao candidatar-se', detalhe: error.message });
  }
};

// Buscar projetos que o voluntário está inscrito
export const meusProjetos = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Buscando projetos para usuário ID:', userId);
    
    // Buscar o perfil do voluntário
    const volunteerProfile = await VolunteerProfile.findOne({ user: userId });
    
    if (!volunteerProfile) {
      console.log('⚠️ Perfil de voluntário não encontrado');
      return res.json([]);
    }
    
    console.log('📋 Perfil encontrado:', volunteerProfile._id);
    
    // Buscar projetos onde o voluntário está inscrito
    const projetosInscrito = await Project.find({
      'voluntarios.voluntarioId': volunteerProfile._id
    });
    
    console.log(`📋 Projetos encontrados: ${projetosInscrito.length}`);
    
    if (projetosInscrito.length === 0) {
      return res.json([]);
    }
    
    const meusProjetosFormatados = projetosInscrito.map(projeto => {
      const minhaInscricao = projeto.voluntarios.find(
        v => v.voluntarioId && v.voluntarioId.toString() === volunteerProfile._id.toString()
      );
      
      // Pegar o status EXATO do banco
      const statusReal = minhaInscricao?.status || 'pending';
      
      console.log(`Projeto: ${projeto.titulo}, Status no banco: ${statusReal}`);
      
      return {
        _id: projeto._id,
        titulo: projeto.titulo || 'Projeto sem título',
        descricao: projeto.descricao || '',
        tipo: projeto.tipo || '',
        local: projeto.local || { cidade: 'Local não informado' },
        minhaInscricao: {
          status: statusReal,  // Retorna o status exato do banco
          dataCandidatura: minhaInscricao?.dataCandidatura || minhaInscricao?.dataInscricao || new Date()
        }
      };
    });
    
    res.json(meusProjetosFormatados);
  } catch (error) {
    console.error('❌ Erro ao buscar seus projetos:', error);
    res.status(500).json({ error: 'Erro ao buscar seus projetos', detalhe: error.message });
  }
};

// Aprovar/Rejeitar candidato (admin)
export const avaliarCandidato = async (req, res) => {
  try {
    const { id, voluntarioId } = req.params;
    const { status } = req.body;

    const projeto = await Project.findById(id);
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const voluntario = projeto.voluntarios.find(
      v => v.voluntarioId.toString() === voluntarioId
    );
    if (!voluntario) {
      return res.status(404).json({ error: 'Voluntário não encontrado no projeto' });
    }

    voluntario.status = status;

    if (status === 'aprovado') {
      projeto.vagasPreenchidas++;
      
      const perfil = await VolunteerProfile.findOne({ user: voluntarioId });
      if (perfil) {
        perfil.projetos.push(projeto._id);
        await perfil.save();
      }
    }

    if (projeto.vagasPreenchidas >= projeto.vagasTotais) {
      projeto.status = 'fechado';
    }

    projeto.updatedAt = new Date();
    await projeto.save();

    res.json({
      message: `Candidato ${status} com sucesso`,
      projeto: {
        id: projeto._id,
        vagasDisponiveis: projeto.vagasTotais - projeto.vagasPreenchidas,
        status: projeto.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao avaliar candidato' });
  }
};

// Concluir projeto (admin)
export const concluirProjeto = async (req, res) => {
  try {
    const { id } = req.params;

    const projeto = await Project.findById(id);
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    projeto.status = 'concluido';
    projeto.dataFim = new Date();
    projeto.updatedAt = new Date();

    for (const voluntario of projeto.voluntarios) {
      if (voluntario.status === 'aprovado') {
        const perfil = await VolunteerProfile.findOne({ user: voluntario.voluntarioId });
        if (perfil) {
          perfil.projetos = perfil.projetos.filter(p => p.toString() !== projeto._id.toString());
          perfil.projetosAnteriores.push(projeto._id);
          await perfil.save();
        }
      }
    }

    await projeto.save();

    res.json({ message: 'Projeto concluído com sucesso', progetto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao concluir projeto' });
  }
};

// Dashboard de projetos (admin)
export const dashboardProjetos = async (req, res) => {
  try {
    const totalProjetos = await Project.countDocuments();
    const projetosAbertos = await Project.countDocuments({ status: 'aberto' });
    const projetosAndamento = await Project.countDocuments({ status: 'em_andamento' });
    const projetosConcluidos = await Project.countDocuments({ status: 'concluido' });
    
    const projetosPorTipo = await Project.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]);

    const candidaturasPendentes = await Project.aggregate([
      { $unwind: '$voluntarios' },
      { $match: { 'voluntarios.status': 'pendente' } },
      { $count: 'total' }
    ]);

    res.json({
      total_projetos: totalProjetos,
      projetos_abertos: projetosAbertos,
      projetos_andamento: projetosAndamento,
      projetos_concluidos: projetosConcluidos,
      projetos_por_tipo: projetosPorTipo,
      candidaturas_pendentes: candidaturasPendentes[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
};

// Buscar voluntários com filtro de status
export const listarVoluntariosPorStatus = async (req, res) => {
  try {
    const { status } = req.query;
    let filtro = {};
    
    if (status && status !== 'todos') {
      filtro['testResult.status'] = status;
    }
    
    const voluntarios = await VolunteerProfile.find(filtro)
      .populate('user', 'email status')
      .populate({
        path: 'user',
        populate: { path: 'testResult', model: 'TestResult' }
      });
    
    res.json(voluntarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar voluntários' });
  }
};

// ========== NOVAS FUNÇÕES PARA O MODAL DE CANDIDATOS ==========

// Listar projetos com informações completas dos candidatos
export const listarProjetosCompleto = async (req, res) => {
  try {
    const { status, tipo } = req.query;
    let filtro = {};

    if (status) filtro.status = status;
    if (tipo) filtro.tipo = tipo;

    const projetos = await Project.find(filtro)
      .populate({
        path: 'voluntarios.voluntarioId',
        model: 'VolunteerProfile',
        select: 'nome user habilidades localizacao telefone',
        populate: {
          path: 'user',
          model: 'User',
          select: 'email'
        }
      })
      .sort('-createdAt');

    // Importar TestResult dinamicamente
    let TestResult = null;
    try {
      const module = await import('../models/TestResult.js');
      TestResult = module.default;
    } catch (err) {
      console.log('⚠️ TestResult model não encontrado, continuando sem...');
    }

    // Buscar resultados de teste para cada voluntário em cada projeto
    const projetosCompletos = await Promise.all(projetos.map(async (projeto) => {
      const voluntariosCompleto = await Promise.all((projeto.voluntarios || []).map(async (vol) => {
        const voluntario = vol.voluntarioId;
        let testResult = null;
        
        if (TestResult && voluntario && voluntario._id) {
          testResult = await TestResult.findOne({ volunteer: voluntario._id }).sort({ createdAt: -1 });
        }
        
        // Determinar status correto (priorizar o status do projeto se existir)
        const statusVoluntario = vol.status || 'pending';
        
        return {
          voluntarioId: voluntario ? {
            _id: voluntario._id,
            nome: voluntario.nome || 'Não informado',
            email: voluntario.user?.email || voluntario.email || '',
            habilidades: voluntario.habilidades || [],
            localizacao: voluntario.localizacao || { cidade: '' },
            telefone: voluntario.telefone || '',
            testResult: testResult ? {
              score: testResult.score || null,
              perfil: testResult.perfil || null,
              status: testResult.status || 'pending'
            } : {
              score: null,
              perfil: null,
              status: statusVoluntario
            }
          } : null,
          status: statusVoluntario,
          dataCandidatura: vol.dataCandidatura || vol.dataInscricao || new Date()
        };
      }));

      return {
        _id: projeto._id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        tipo: projeto.tipo,
        status: projeto.status,
        local: projeto.local || { cidade: '' },
        vagasTotais: projeto.vagasTotais,
        vagasPreenchidas: projeto.vagasPreenchidas || 0,
        voluntarios: voluntariosCompleto,
        dataInicio: projeto.dataInicio,
        dataFim: projeto.dataFim
      };
    }));

    res.json(projetosCompletos);
  } catch (error) {
    console.error('❌ Erro ao listar projetos completos:', error);
    res.status(500).json({ error: 'Erro ao listar projetos', detalhe: error.message });
  }
};

// Buscar projeto por ID com detalhes completos dos candidatos (VERSÃO CORRIGIDA)
export const buscarProjetoComCandidatos = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Buscando projeto ID:', id);
    
    // Buscar o projeto
    const projeto = await Project.findById(id);
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    console.log('📋 Projeto encontrado:', projeto.titulo);
    console.log('📋 Voluntários no projeto:', projeto.voluntarios?.length || 0);
    
    // Array para armazenar voluntários com dados completos
    const voluntariosCompleto = [];
    
    // Para cada voluntário, buscar os dados do perfil
    for (const voluntarioInscricao of (projeto.voluntarios || [])) {
      const volunteerId = voluntarioInscricao.voluntarioId;
      
      if (!volunteerId) {
        console.log('⚠️ Voluntário sem ID encontrado');
        continue;
      }
      
      console.log('🔍 Buscando perfil do voluntário ID:', volunteerId);
      
      // Buscar o perfil do voluntário
      const perfil = await VolunteerProfile.findById(volunteerId)
        .populate('user', 'email');
      
      if (!perfil) {
        console.log('⚠️ Perfil não encontrado para ID:', volunteerId);
        // Tentar buscar como user ID
        const perfilPorUser = await VolunteerProfile.findOne({ user: volunteerId })
          .populate('user', 'email');
        
        if (perfilPorUser) {
          console.log('✅ Encontrado via user ID:', perfilPorUser.nome);
          
          // Buscar resultado do teste
          let testResult = null;
          try {
            const TestResult = (await import('../models/TestResult.js')).default;
            testResult = await TestResult.findOne({ volunteer: perfilPorUser._id });
          } catch (err) {
            console.log('Erro ao buscar TestResult:', err.message);
          }
          
          voluntariosCompleto.push({
            voluntarioId: {
              _id: perfilPorUser._id,
              nome: perfilPorUser.nome || 'Voluntário',
              email: perfilPorUser.user?.email || '',
              habilidades: perfilPorUser.habilidades || [],
              localizacao: perfilPorUser.localizacao || { cidade: '' },
              telefone: perfilPorUser.telefone || '',
              testResult: testResult ? {
                score: testResult.score,
                perfil: testResult.perfil,
                status: testResult.status
              } : {
                score: null,
                perfil: null,
                status: voluntarioInscricao.status || 'pending'
              }
            },
            status: voluntarioInscricao.status || 'pending',
            dataCandidatura: voluntarioInscricao.dataCandidatura || new Date()
          });
        }
        continue;
      }
      
      console.log('✅ Perfil encontrado:', perfil.nome);
      console.log('📧 Email:', perfil.user?.email);
      
      // Buscar resultado do teste
      let testResult = null;
      try {
        const TestResult = (await import('../models/TestResult.js')).default;
        testResult = await TestResult.findOne({ volunteer: perfil._id });
        console.log('📊 TestResult:', testResult ? `Score: ${testResult.score}` : 'Não encontrado');
      } catch (err) {
        console.log('Erro ao buscar TestResult:', err.message);
      }
      
      // Normalizar status
      let statusNormalizado = voluntarioInscricao.status || 'pending';
      if (statusNormalizado === 'aprovado') statusNormalizado = 'approved';
      if (statusNormalizado === 'rejeitado') statusNormalizado = 'rejected';
      if (statusNormalizado === 'pendente') statusNormalizado = 'pending';
      
      voluntariosCompleto.push({
        voluntarioId: {
          _id: perfil._id,
          nome: perfil.nome || 'Voluntário',
          email: perfil.user?.email || '',
          habilidades: perfil.habilidades || [],
          localizacao: perfil.localizacao || { cidade: '' },
          telefone: perfil.telefone || '',
          testResult: testResult ? {
            score: testResult.score,
            perfil: testResult.perfil,
            status: testResult.status
          } : {
            score: null,
            perfil: null,
            status: statusNormalizado
          }
        },
        status: statusNormalizado,
        dataCandidatura: voluntarioInscricao.dataCandidatura || new Date()
      });
    }
    
    console.log(`✅ Total de voluntários processados: ${voluntariosCompleto.length}`);
    
    const response = {
      _id: projeto._id,
      titulo: projeto.titulo,
      descricao: projeto.descricao,
      tipo: projeto.tipo,
      status: projeto.status,
      local: projeto.local || { cidade: '' },
      vagasTotais: projeto.vagasTotais,
      vagasPreenchidas: projeto.vagasPreenchidas || 0,
      voluntarios: voluntariosCompleto,
      dataInicio: projeto.dataInicio,
      dataFim: projeto.dataFim
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Erro ao buscar projeto com candidatos:', error);
    res.status(500).json({ error: 'Erro ao buscar projeto', detalhe: error.message });
  }
};

// Atualizar status do voluntário no projeto (para aprovar/reprovar)
export const atualizarStatusVoluntario = async (req, res) => {
  try {
    const { projetoId, volunteerId } = req.params;
    const { status } = req.body;

    // Validar status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use: pending, approved ou rejected' });
    }

    console.log(`📝 Atualizando voluntário ${volunteerId} no projeto ${projetoId} para status: ${status}`);

    // Buscar o projeto
    const projeto = await Project.findById(projetoId);
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Encontrar o voluntário no projeto
    const voluntarioIndex = projeto.voluntarios.findIndex(
      v => v.voluntarioId && v.voluntarioId.toString() === volunteerId
    );

    if (voluntarioIndex === -1) {
      return res.status(404).json({ error: 'Voluntário não encontrado neste projeto' });
    }

    const statusAnterior = projeto.voluntarios[voluntarioIndex].status;
    
    // Atualizar status
    projeto.voluntarios[voluntarioIndex].status = status;
    
    // Atualizar contagem de vagas preenchidas
    if (status === 'approved' && statusAnterior !== 'approved') {
      projeto.vagasPreenchidas = (projeto.vagasPreenchidas || 0) + 1;
    } else if (status !== 'approved' && statusAnterior === 'approved') {
      projeto.vagasPreenchidas = Math.max(0, (projeto.vagasPreenchidas || 0) - 1);
    }

    projeto.updatedAt = new Date();
    await projeto.save();

    // Também atualizar o testResult do voluntário se existir
    try {
      const module = await import('../models/TestResult.js');
      const TestResult = module.default;
      
      await TestResult.findOneAndUpdate(
        { volunteer: volunteerId },
        { status: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending' },
        { new: true, upsert: true }
      );
      console.log(`✅ TestResult atualizado para voluntário ${volunteerId}`);
    } catch (err) {
      console.log('⚠️ TestResult model não encontrado, status não sincronizado com testResult');
    }

    console.log(`✅ Status atualizado com sucesso!`);

    res.json({ 
      message: `Status atualizado para ${status === 'approved' ? 'Aprovado' : status === 'rejected' ? 'Reprovado' : 'Pendente'}`,
      voluntario: projeto.voluntarios[voluntarioIndex],
      vagasDisponiveis: projeto.vagasTotais - projeto.vagasPreenchidas
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status do voluntário:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do voluntário', detalhe: error.message });
  }
};