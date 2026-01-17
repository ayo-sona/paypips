import axios from "axios";
import { getCookie, setCookie } from "cookies-next";

const BASE_URL = `https://paypips.onrender.com/api/v1`;
// const BASE_URL = `http://localhost:4000/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important! This sends cookies
});

// Add access token to requests
apiClient.interceptors.request.use((config) => {
  const token = getCookie("access_token");
  // const token = localStorage.getItem("access_token");
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
        setCookie("access_token", data.data.access_token, {
          maxAge: 60 * 60, // 1 hour
        });
        // localStorage.setItem("access_token", data.data.access_token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        // localStorage.removeItem("access_token");
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

///////////////////////////////////

// import axios, {
//   AxiosInstance,
//   AxiosRequestConfig,
//   InternalAxiosRequestConfig,
// } from "axios";
// import { getCookie, setCookie } from "cookies-next";
// import { NextRequest, NextResponse } from "next/server";

// const BASE_URL = `https://paypips.onrender.com/api/v1`;
// // const BASE_URL = `http://localhost:4000/api/v1`;

// // Create axios instance
// const apiClient: AxiosInstance = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true, // Important for sending/receiving cookies
// });

// // Request interceptor to add auth token
// apiClient.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     // Get token from cookies
//     const token = getCookie("access_token");

//     if (token) {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor to handle token refresh
// apiClient.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     // If error is 401 and we haven't tried to refresh yet
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // Attempt to refresh the token
//         const refreshToken = getCookie("refresh_token");
//         if (refreshToken) {
//           const { data } = await axios.post(
//             `${BASE_URL}/auth/refresh`,
//             {},
//             { withCredentials: true }
//           );

//           const { access_token, refresh_token } = data;

//           // Update tokens in cookies
//           setCookie("access_token", access_token, {
//             maxAge: 60 * 60, // 1 hour
//           });

//           if (refresh_token) {
//             setCookie("refresh_token", refresh_token, {
//               maxAge: 60 * 60 * 24 * 14, // 14 days
//               path: "/auth/refresh",
//               httpOnly: true,
//             });
//           }

//           // Update the authorization header
//           originalRequest.headers.Authorization = `Bearer ${access_token}`;

//           // Retry the original request
//           return apiClient(originalRequest);
//         }
//       } catch (refreshError) {
//         // If refresh fails, redirect to login
//         if (typeof window !== "undefined") {
//           window.location.href = "/auth/login";
//         }
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default apiClient;
