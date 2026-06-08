import api from './api';

export const patientsApi = {
  list:         (params) => api.get('/patients', { params }),
  getById:      (id)     => api.get(`/patients/${id}`),
  register:     (data)   => api.post('/patients', data),
  update:       (id, data) => api.patch(`/patients/${id}`, data),
  remove:       (id)     => api.delete(`/patients/${id}`),
  assignDoctor: (id, doctorId) => api.post(`/patients/${id}/assign-doctor`, { doctorId }),
};

export const doctorsApi = {
  list:            (params) => api.get('/doctors', { params }),
  getById:         (id)     => api.get(`/doctors/${id}`),
  workload:        ()       => api.get('/doctors/workload'),
  departments:     ()       => api.get('/doctors/departments'),
  toggleAvailable: (id)     => api.patch(`/doctors/${id}/toggle-availability`),
};

export const bedsApi = {
  list:    (params) => api.get('/beds', { params }),
  summary: ()       => api.get('/beds/summary'),
  assign:  (id, patientId) => api.post(`/beds/${id}/assign`, { patientId }),
  release: (id)     => api.post(`/beds/${id}/release`),
};

export const resourcesApi = {
  list:     (params) => api.get('/resources', { params }),
  lowStock: ()       => api.get('/resources/low-stock'),
  create:   (data)   => api.post('/resources', data),
  update:   (id, data) => api.patch(`/resources/${id}`, data),
  restock:  (id, quantity, notes) => api.post(`/resources/${id}/restock`, { quantity, notes }),
};

export const appointmentsApi = {
  list:         (params) => api.get('/appointments', { params }),
  today:        ()       => api.get('/appointments/today'),
  create:       (data)   => api.post('/appointments', data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}`, { status }),
};

export const dashboardApi = {
  stats:         ()       => api.get('/dashboard/stats'),
  agentActivity: (params) => api.get('/dashboard/agent-activity', { params }),
  notifications: (params) => api.get('/dashboard/notifications', { params }),
};
