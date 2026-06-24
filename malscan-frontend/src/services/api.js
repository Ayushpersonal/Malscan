import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://malscan-1d93.onrender.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for PE file upload, parsing, and XGBoost scoring
});

// Interceptor to inject verified bearer tokens automatically into requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('malscan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const handleApiError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.detail || 'An error occurred during backend analysis.',
      data: error.response.data,
    };
  } else if (error.request) {
    return {
      status: 0,
      message: `MalScan backend is currently unreachable at ${API_BASE_URL}. Ensure the backend service is active and running.`,
    };
  } else {
    return {
      status: -1,
      message: error.message || 'An unexpected client connection error occurred.',
    };
  }
};

export const api = {
  scanFile: async (formData) => {
    try {
      const response = await apiClient.post('/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getHistory: async () => {
    try {
      const response = await apiClient.get('/history');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserHistory: async () => {
    try {
      const response = await apiClient.get('/user/history');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getHealth: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Phase 3 Authentication endpoints
  register: async (name, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getRecentScans: async () => {
    try {
      const response = await apiClient.get('/dashboard/recent');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getScanTrends: async () => {
    try {
      const response = await apiClient.get('/dashboard/trends');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getThreatDistribution: async () => {
    try {
      const response = await apiClient.get('/dashboard/threat-distribution');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Phase 5: Report, Export, Hash Reputation, Comparison
  getScanReport: async (scanId) => {
    try {
      const response = await apiClient.get(`/report/${scanId}`, {
        responseType: 'blob',
        timeout: 60000,
      });
      return response.data; // Blob
    } catch (error) {
      throw handleApiError(error);
    }
  },

  exportScanJson: async (scanId) => {
    try {
      const response = await apiClient.get(`/export/json/${scanId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getHashReputation: async (sha256Hash) => {
    try {
      const response = await apiClient.get(`/hash/${sha256Hash}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  compareScansDelta: async (scanAId, scanBId) => {
    try {
      const response = await apiClient.get('/analysis/compare', {
        params: { scan_a: scanAId, scan_b: scanBId }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

