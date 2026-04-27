import dotenv from 'dotenv';
import User from '../models/User.js';
import VolunteerProfile from '../models/VolunteerProfile.js';
import jwt from 'jsonwebtoken';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Função com fallback caso JWT_SECRET não exista
const generateToken = (userId, userType) => {
  // Usa a variável de ambiente ou uma chave padrão (apenas para desenvolvimento)
  const secret = process.env.JWT_SECRET || 'Compatibilize2026@SuperSecretKey';
  
  return jwt.sign(
    { id: userId, userType },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { email, password, nome, idade, localizacao, habilidades, disponibilidade } = req.body;

    // Validação: idade é obrigatória
    if (!idade) {
      return res.status(400).json({ error: 'Idade é obrigatória' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const user = new User({ email, password, userType: 'volunteer' });
    await user.save();

    const profile = new VolunteerProfile({
      user: user._id,
      nome,
      idade: parseInt(idade),
      localizacao: localizacao || {},
      habilidades: habilidades || [],
      disponibilidade: disponibilidade || {},
      testCompleted: false
    });
    await profile.save();

    const token = generateToken(user._id, user.userType);

    res.status(201).json({
      message: 'Cadastro realizado com sucesso',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro ao cadastrar voluntário: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (user.userType !== userType) {
      return res.status(403).json({ error: 'Tipo de usuário incorreto' });
    }

    const token = generateToken(user._id, user.userType);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        status: user.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};