import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss  from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined
          }

          if (id.includes("@supabase")) return "supabase"
          if (id.includes("@tanstack")) return "tanstack"
          if (id.includes("react-router")) return "router"
          if (id.includes("recharts") || id.includes("chart.js") || id.includes("d3")) return "charts"

          return "vendor"
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
