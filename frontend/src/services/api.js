import axios from "axios";
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 120000,
});
export const fetchWind = (start, end, signal) =>
  client
    .get("/api/wind", { params: { start, end }, signal })
    .then((r) => r.data);
