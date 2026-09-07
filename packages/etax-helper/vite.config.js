import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
import vue from '@vitejs/plugin-vue';
import monkey from 'vite-plugin-monkey';


// https://vitejs.dev/config/
export default defineConfig({
  build: { minify: 'esbuild' },
  define: { __ETAX_VERSION__: JSON.stringify(version) },
  assetsInclude: ['**/*.html'],
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: "etax助手",
        version,
        'run-at': 'document-start',
        license: 'MIT',
        description: 'etax小助手',
        namespace: 'https://github.com/kxx/k-script',
        author: "kxx",
        match: ['https://*.chinatax.gov.cn/*'
          , 'https://*.chinatax.gov.cn:8443/*'
        ],
        connect: ['skynjweb.com'],
      },

    })
  ],
});
