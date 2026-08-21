import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  timeout: 10000,
});

// প্রতিটি API কল পাঠানোর আগে অটোমেটিক Bearer Token যুক্ত করার ইন্টারসেপ্টর
api.interceptors.request.use(
  (config) => {
    // LocalStorage থেকে টোকেন নিন
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);