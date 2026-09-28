// H5 使用同源代理，由开发或部署服务器转发至演示后端，避免浏览器跨域拦截。
// 可在 index.html 加载应用前设置 window.RIVER_DEMO_CONFIG 覆盖部署配置。
const runtime = typeof window !== 'undefined' ? window.RIVER_DEMO_CONFIG || {} : {};
const localImageProxy = import.meta.env.DEV ? 'https://192.168.2.54:11000' : '';
export const demoConfig = {
  apiBase: '/api/v1',
  aiApiBase: '/api/v1',
  recognitionApiKey: 'b0270c21c2ed21f53a740301a0d2f3c039adfa4fafbf3589',
  uploadUrl: '/api/v1/file/upload',
  // Local dev uses the HTTPS proxy for both mock and uploaded images. Production
  // uses same-origin relative paths so the hosting Nginx can forward them.
  fileBase: localImageProxy,
  sampleImageBase: localImageProxy,
  // key 为本地问题 ID，value 为 { rectificationId: '真实任务ID', version: 0 }。
  taskBindings: {},
  ...runtime,
};
