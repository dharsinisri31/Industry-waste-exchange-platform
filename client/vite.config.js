import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function transformJsJsxPlugin() {
  return {
    name: 'transform-js-jsx',
    enforce: 'pre',
    async transform(code, id) {
      if (id.endsWith('.js') && !id.includes('node_modules')) {
        return transformWithOxc(code, id, {
          lang: 'jsx',
          jsx: {
            runtime: 'automatic'
          }
        });
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    transformJsJsxPlugin(),
    react(),
    tailwindcss()
  ]
});
