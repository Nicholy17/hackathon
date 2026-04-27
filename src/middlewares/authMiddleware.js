import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔐 Middleware - Token recebido:', token ? token.substring(0, 50) + '...' : 'Nenhum');
    console.log('🔐 JWT_SECRET carregado:', process.env.JWT_SECRET ? 'Sim' : 'Não');
    
    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const secret = process.env.JWT_SECRET || 'Compatibilize2026@SuperSecretKey';
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token decodificado:', decoded);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', decoded.id);
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      userType: user.userType
    };
    
    console.log('✅ Usuário autenticado:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    res.status(401).json({ error: 'Token inválido: ' + error.message });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
};