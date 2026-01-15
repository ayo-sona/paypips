import axios from "axios";

const BASE_URL = `https://paypips.onrender.com/api/v1`;
// const BASE_URL = `http://localhost:4000/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important! This sends cookies
});

// Add access token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.error("API Error:", {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint (cookie sent automatically)
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Update access token
        localStorage.setItem("access_token", data.data.access_token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("access_token");
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

///////////////////////////////////

// import { ApiResponse } from '../types/common';

// class ApiClient {
//   private baseUrl: string;

//   constructor(baseUrl: string = '/api') {
//     this.baseUrl = baseUrl;
//   }

//   private async request<T>(
//     endpoint: string,
//     options: RequestInit = {}
//   ): Promise<ApiResponse<T>> {
//     try {
//       // Get auth token from localStorage
//       const token = localStorage.getItem('auth_token');

//       const response = await fetch(`${this.baseUrl}${endpoint}`, {
//         ...options,
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { Authorization: `Bearer ${token}` }),
//           ...options.headers,
//         },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         return {
//           success: false,
//           error: data.error || 'An error occurred',
//         };
//       }

//       return {
//         success: true,
//         data: data,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Network error',
//       };
//     }
//   }

//   async get<T>(endpoint: string): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, { method: 'GET' });
//   }

//   async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, {
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   }

//   async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     });
//   }

//   async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
//     return this.request<T>(endpoint, { method: 'DELETE' });
//   }
// }

// export const apiClient = new ApiClient();
