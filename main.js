import App from "./App";
import api from "@/http/";
import { resolveImageUrl } from "@/api/upload.js";

// #ifndef VUE3
import Vue from "vue";
import "./uni.promisify.adaptor";
Vue.config.productionTip = false;
App.mpType = "app";
Vue.prototype.$api = api;
// 全局图片 URL 解析：把相对路径 name 转成可访问的完整 URL
Vue.prototype.$img = resolveImageUrl;

const app = new Vue({
  ...App,
});
app.$mount();
// #endif

// #ifdef VUE3
// import uView from "./uni_modules/vk-uview-ui";
// 如需使用 uv-ui，请先从插件市场安装，然后替换为：
// import uvUI from '@/uni_modules/uv-ui-tools'
import { createSSRApp } from "vue";
export function createApp() {
  const app = createSSRApp(App);
  app.config.globalProperties.$api = api;
  // 全局图片 URL 解析：把相对路径 name 转成可访问的完整 URL
  app.config.globalProperties.$img = resolveImageUrl;
  // app.use(uView);
  // 如需使用 uv-ui，取消下面注释
  // app.use(uvUI)
  return {
    app,
  };
}
// #endif
