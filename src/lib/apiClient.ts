import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { deleteCookie, getCookie, setCookie } from "cookies-next";

// Extend AxiosRequestConfig to include _retry flag
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const BASE_URL = "https://paypips.onrender.com/api/v1";
// const BASE_URL = "http://localhost:4000/api/v1";

// Prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This sends httpOnly cookies automatically
  // timeout: 30000,
});

/**
 * Request Interceptor
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getCookie("access_token");
    // console.log(token);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor
 * Automatically refreshes access token when it expires (401 error)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig;

    console.log("API Response error", error);

    // If no config, reject immediately
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Access token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints to prevent infinite loops
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/org/register") ||
        originalRequest.url?.includes("/auth/accept-invite")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true, // Sends refreshToken cookie
          },
        );

        // console.log(response.data.data);
        const { access_token } = response?.data?.data;

        // Update tokens in cookies
        setCookie("access_token", access_token);

        // Server will set new access_token cookie automatically
        processQueue(null); // Tell waiting requests to retry

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        processQueue(new Error("Token refresh failed")); // Reject all waiting requests

        if (typeof window !== "undefined") {
          // Clear local storage items
          localStorage.removeItem("selectedOrganizationId");
          localStorage.removeItem("organizations");

          // Delete any cookie
          deleteCookie("access_token");

          // Redirect to login
          window.location.href = "/auth/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    return Promise.reject(error);
  },
);

/**
 * Logout helper
 */
export async function logout() {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear client-side data
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedOrganizationId");
      window.location.href = "/auth/login";
    }
  }
}

export default apiClient;

///////////////////////////////////////////////
// import axios from 'axios';
// import router from './router'; // Assuming you have a router for navigation

// Request interceptor to add auth token
// apiClient.interceptors.request.use(
//   (config: AxiosRequestConfig): AxiosRequestConfig => {
//     const token = getCookie("access_token");
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// axios.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // Check if the error is a 401 and not a retry already
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true; // Mark as retried to prevent infinite loops

//       // Check if the specific message indicates an invalid refresh token
//       if (error.response.data && error.response.data.message === 'Invalid refresh token') {
//         // Refresh token is invalid/expired, force user to re-login
//         console.error('Refresh token invalid or expired. Redirecting to login.');
//         // Clear any stored tokens
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         // Redirect to login page
//         router.push('/login'); // Adjust this to your routing mechanism
//         return Promise.reject(error);
//       }

//       // If it's a 401 but not explicitly "Invalid refresh token", try to refresh the access token
//       try {
//         const refreshToken = localStorage.getItem('refreshToken'); // Get refresh token from storage

//         if (refreshToken) {
//           // Send a request to your backend to refresh the access token
//           const response = await axios.post('/api/auth/refresh-token', { refreshToken }); // Adjust endpoint
//           const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

//           // Store the new tokens
//           localStorage.setItem('accessToken', newAccessToken);
//           localStorage.setItem('refreshToken', newRefreshToken);

//           // Update the authorization header for the original request
//           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//           // Retry the original request with the new token
//           return axios(originalRequest);
//         } else {
//           // No refresh token available, redirect to login
//           console.error('No refresh token found. Redirecting to login.');
//           router.push('/login');
//           return Promise.reject(error);
//         }
//       } catch (refreshError) {
//         // Refresh token failed, force user to re-login
//         console.error('Failed to refresh token. Redirecting to login.', refreshError);
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
//         router.push('/login');
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );
