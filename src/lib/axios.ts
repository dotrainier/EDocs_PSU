// lib/axios.ts
import axios, { AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        data,
      });
    }
    return Promise.reject({
      status: null,
      message: error.message || 'An unexpected error occurred',
      data: null,
    });
  },
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get(url, config) as Promise<T>,
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post(url, data, config) as Promise<T>,
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put(url, data, config) as Promise<T>,
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch(url, data, config) as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete(url, config) as Promise<T>,
};

export default axiosInstance;
