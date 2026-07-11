import axios from 'axios';

const api = axios.create({
  baseURL: '/api/patients',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach authorization token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('khh_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getPatients = async () => {
  const response = await api.get('/');
  return response.data;
};

export const createPatient = async (patient) => {
  const response = await api.post('/', patient);
  return response.data;
};

export const updatePatient = async (id, patient) => {
  const response = await api.put(`/${id}`, patient);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const bulkCreatePatients = async (patients) => {
  const response = await api.post('/bulk', patients);
  return response.data;
};

// ==============================
// Settings API
// ==============================
const settingsApi = axios.create({
  baseURL: '/api/settings',
  headers: { 'Content-Type': 'application/json' },
});

settingsApi.interceptors.request.use(config => {
  const token = localStorage.getItem('khh_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSettings = async () => {
  const response = await settingsApi.get('/');
  return response.data;
};

export const updateSettings = async (payload) => {
  const response = await settingsApi.put('/', payload);
  return response.data;
};

export const testGoogleSheetConnection = async () => {
  const response = await settingsApi.get('/test-sheet');
  return response.data;
};
