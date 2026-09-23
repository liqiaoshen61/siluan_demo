// H5 使用同源代理；上传代理指向用户指定的内网服务。
// 可在 index.html 加载应用前设置 window.RIVER_DEMO_CONFIG 覆盖部署配置。
const runtime = typeof window !== 'undefined' ? window.RIVER_DEMO_CONFIG || {} : {};
export const demoConfig = {
  apiBase: '/river/openapi/v1',
  recognitionApiKey: 'b0270c21c2ed21f53a740301a0d2f3c039adfa4fafbf3589',
  uploadUrl: '/jwsk-resource/oss/endpoint/put-file-attach',
  fileBase: 'http://192.168.2.103:8086',
  sampleImageBase: 'http://27.156.118.74:19200',
  // key 为本地问题 ID，value 为 { rectificationId: '真实任务ID', version: 0 }。
  taskBindings: {},
  ...runtime,
};
