import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';


// const app = createApp(App);
// app.use(ElementPlus);

// // 创建一个宿主元素，用于挂载Shadow DOM
// const shadowHost = document.createElement('div');
// shadowHost.id = 'etax-helper';
// document.body.appendChild(shadowHost);

// // 创建一个开放模式的Shadow DOM
// const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

// // 将包含 data-vite-dev-id 的样式移动到 Shadow DOM
// const styles = document.querySelectorAll('style[data-vite-dev-id]');
// styles.forEach((styleElement) => {
//   shadowRoot.appendChild(styleElement.cloneNode(true));
// });

// // 创建一个容器元素作为 Vue 应用的挂载点，并附加到 Shadow DOM 中
// const shadowContainer = document.createElement('div');
// shadowRoot.appendChild(shadowContainer);

// // 将 Vue 应用挂载到容器元素上
// app.mount(shadowContainer);



createApp(App).mount(
  (() => {
    const app = document.createElement('div');
    app.id = 'qixin-helper';
    document.body.append(app);
    return app;
  })(),
);

