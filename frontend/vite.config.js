import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// usePolling: file-change detection through Docker bind mounts (esp. Docker Desktop on Windows/macOS)
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, watch: { usePolling: true } },
});
