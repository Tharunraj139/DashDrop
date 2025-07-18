import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],

  // This `server` block makes the dev server work correctly in Gitpod
  server: {
    host: true,
  },
  
  base: '/',
})