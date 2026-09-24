// H5 直连演示后端；服务端需允许宿主页面跨域访问。
// 可在 index.html 加载应用前设置 window.RIVER_DEMO_CONFIG 覆盖部署配置。
const runtime = typeof window !== 'undefined' ? window.RIVER_DEMO_CONFIG || {} : {};
export const demoConfig = {
  apiBase: 'http://218.85.23.37:20320/api/v1',
  aiApiBase: 'http://218.85.23.37:20320/api/v1',
  recognitionApiKey: 'b0270c21c2ed21f53a740301a0d2f3c039adfa4fafbf3589',
  uploadUrl: 'http://218.85.23.37:20320/api/v1/file/upload',
  fileBase: 'http://218.85.23.37:20320',
  sampleImageBase: 'http://27.156.118.74:19200',
  // key 为本地问题 ID，value 为 { rectificationId: '真实任务ID', version: 0 }。
  taskBindings: {},
  ...runtime,
};
