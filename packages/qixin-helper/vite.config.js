import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn, util } from 'vite-plugin-monkey';


// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.html'],
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: "Qx助手",
        version: loadEnv("", process.cwd(), '').VITE_VERSION,
        license: 'MIT',
        description: '企信小助手',
        namespace: 'https://github.com/kxx/k-script',
        author: "kxx",
        match: ['https://www.qixin.com','https://www.qixin.com/*','https://qixin.com','qixin.com','kxx.me'],
        connect: ['skynjweb.com'],
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js').concat(
            await util.fn2dataUrl(() => {
              window.Vue = Vue; // work with element-plus
            }),
          ),
          jquery: cdn.bootcdn('$', 'jquery.min.js'),
          axios: cdn.bootcdn('axios', 'axios.min.js'),
          'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js')
        },
        externalResource: {
          'element-plus/dist/index.css': cdn.bootcdn('', 'index.min.css'),
        }
      },
    })
  ],
});
