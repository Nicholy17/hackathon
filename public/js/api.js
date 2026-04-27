// API.js - Conexão com o backend
const API_BASE_URL = window.location.origin + '/api';

// ==================== FUNÇÕES DE AUTENTICAÇÃO ====================
async function apiLogin(email, password, userType) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userType })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro no login');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

async function apiRegister(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro no cadastro');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } catch (error) {
    console.error('Erro no cadastro:', error);
    throw error;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// ==================== FUNÇÕES DO VOLUNTÁRIO ====================
async function apiGetProfile() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/volunteer/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Erro ao buscar perfil');
  return response.json();
}

async function apiUpdateProfile(profileData) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/volunteer/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) throw new Error('Erro ao atualizar perfil');
  return response.json();
}

async function apiGetTestQuestions() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/test/questions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Erro ao buscar perguntas');
  return response.json();
}

async function apiSubmitTest(responses) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/test/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ responses })
  });
  
  if (!response.ok) throw new Error('Erro ao enviar teste');
  return response.json();
}

async function apiGetTestResult() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/test/result`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Erro ao buscar resultado');
  return response.json();
}

// ==================== FUNÇÕES DE PROJETOS ====================
async function apiGetProjetos(filtros = {}) {
  const token = getToken();
  const params = new URLSearchParams(filtros).toString();
  const url = params ? `${API_BASE_URL}/projetos?${params}` : `${API_BASE_URL}/projetos`;
  
  const response = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  
  if (!response.ok) throw new Error('Erro ao buscar projetos');
  return response.json();
}

async function apiCandidatarProjeto(projetoId) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/projetos/${projetoId}/candidatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Erro ao candidatar');
  return response.json();
}

// ==================== FUNÇÕES DE ADMIN ====================
async function apiAdminDashboard() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Erro ao buscar dashboard');
  return response.json();
}

async function apiAdminVoluntarios() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/admin/volunteers`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Erro ao buscar voluntários');
  return response.json();
}

async function apiCriarProjeto(projetoData) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/projetos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(projetoData)
  });
  
  if (!response.ok) throw new Error('Erro ao criar projeto');
  return response.json();
}

// Exportar funções (para uso no HTML)
window.api = {
  login: apiLogin,
  register: apiRegister,
  logout: logout,
  getUser: getUser,
  getProfile: apiGetProfile,
  updateProfile: apiUpdateProfile,
  getTestQuestions: apiGetTestQuestions,
  submitTest: apiSubmitTest,
  getTestResult: apiGetTestResult,
  getProjetos: apiGetProjetos,
  candidatar: apiCandidatarProjeto,
  adminDashboard: apiAdminDashboard,
  adminVoluntarios: apiAdminVoluntarios,
  criarProjeto: apiCriarProjeto
};