import axios from "axios";
import AppLayout from "../components/layout/AppLayout";

const api = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true, //automatic cookies(refresh token)
});

//-----request interceptor ----------
// automatic attach the acess token to every request

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // a small error here crashed the whole thing :)))
  }
  return config;
});

//------ response interceptor ------------- if 401 , try to refresh token silently

api.interceptors.response.use(
  (Response) => Response,
  async (error) => {
    const original = error.config;

    //if 404 and we havent retried
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const { data } = await api.post("/auth/refresh");
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = "Bearer ${data.accessToken}";
        return api(original); // retry original requst
      } catch {
        // refresh failed- user need to log in again
        localStorage.removeItem("accessToken");
        window.localStorage.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

//-----Authentication ----------

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  me: () => api.get("/auth/me"),

  logout: () => api.post("/auth/logout"),

  updateProfile: (data: { name?: string; timezone?: string }) =>
    api.patch("/auth/me", data),

  stats: () => api.get("/auth/stats"),
};

//---- Habits ---------

export const habitsApi = {
  getAll: () => api.get("/habits"),

  create: (data: { name: string; color?: string; frequency?: string }) =>
    api.post("/habits", data),

  update: (id: string, data: { name?: string; color?: string }) =>
    api.patch(`/habits/${id}`, data),

  archive: (id: string) => api.delete(`/habits/${id}`),

  checkIn: (id: string) => api.post(`/habits/${id}/checkin`),

  undoCheckIn: (id: string) => api.delete(`/habits/${id}/checkin`),
  stats: () => api.get("/habits/stats"),
  calendar: (month: string) => api.get(`/habits/calendar?month=${month}`),
};

// notes:

export const notebooksApi = {
  getAll: () => api.get("/notes/notebooks"),

  create: (data: { name: string; emoji?: string; color?: string }) =>
    api.post("/notes/notebooks", data),

  delete: (id: string) => api.delete(`/notes/notebooks/${id}`),
};

export const notesApi = {
  getByNotebook: (notebookId: string) =>
    api.get(`/notes?notebookId=${notebookId}`),

  search: (query: string) =>
    api.get(`/notes?search=${encodeURIComponent(query)}`),

  create: (data: { notebookId: string; title: string; content?: string }) =>
    api.post("/notes", data),

  update: (id: string, data: { title?: string; content?: string }) =>
    api.put(`/notes/${id}`, data),

  toggleStar: (id: string) => api.patch(`/notes/${id}/star`),

  delete: (id: string) => api.delete(`/notes/${id}`),
};

export default api;
