# 四乱问题管理 H5 演示模块

基于现有 uni-app / Vue 3 项目，默认进入 `pages/demo/index`。免登录，同一演示用户可以新增、整改、复核。没有底部导航、个人中心、统计、消息入口；原有页面源码保留但不注册到构建路由。

## 运行

```sh
npm ci
npm run dev:h5
npm run build:h5
npm test
```

开发地址为 `http://localhost:8081`，构建输出为 `dist/h5`。宿主 App 使用 WebView 打开部署地址。使用 hash 路由；拍照/相册需要宿主 WebView 支持文件选择与相机权限。

## 数据与真实接口

`demo/seed.json` 来自用户提供的 20 条图斑示例。保留原始字段，分配待整改、待复核、已完成三种**演示状态**。新增和业务状态存储在浏览器本地，点击“重置演示”恢复初始数据。列表、详情、搜索、保存、整改提交均不请求后端。

仅以下接口请求真实后端，任何失败都展示错误，不自动降级成模拟成功：

| 功能 | 地址 |
| --- | --- |
| 上传 | `http://218.85.23.37:20320/api/v1/file/upload` |
| 新增识别 | `http://218.85.23.37:20320/api/v1/issue/detect` |
| 整改识别 | `http://218.85.23.37:20320/api/v1/issue/verify-rectification` |

开发代理在 `vite.config.js` 将 `/api/v1` 统一转发到 `http://218.85.23.37:20320`，以避免 H5 跨域问题。上传表单字段为 `file`，支持响应 `data.link`、`data.url`、`data.name` 或字符串地址。识别请求带 `X-API-Key`。复核在本地模拟，不调用后端。

## 联调必须具备的条件

1. **免登录**：不发送 token，不刷新登录、不跳转登录页。后端/网关需要对上述演示接口提供免登录访问，否则页面显示后端 401 错误。
2. **整改前照片**：`beforeImageText` 按分号拆分多张图片，每项取逗号前的路径，拼接 `http://27.156.118.74:19200`。例如 `/static/work_file/2025-04-02/pic52574003368.JPG` 会使用该前缀显示；可通过 `sampleImageBase` 覆盖图片服务地址。

可在 `index.html` 的应用脚本之前加入配置，或修改 `demo/config.js`：

```html
<script>
window.RIVER_DEMO_CONFIG = {
  apiBase: '/api/v1',
  aiApiBase: '/api/v1',
  uploadUrl: '/api/v1/file/upload',
  fileBase: 'http://218.85.23.37:20320',
  sampleImageBase: 'http://27.156.118.74:19200',
};
</script>
```

## 部署代理示例

生产静态服务器也需要代理（Vite 代理只用于开发）：

```nginx
location /api/v1/ {
    proxy_pass http://218.85.23.37:20320;
}
```

HTTPS 页面需将图片也通过 HTTPS/同源代理提供，避免内网 HTTP 图片被 WebView 拦截。如部署到子目录，同时调整 `manifest.json` 的 `h5.router.base`。运行环境必须能够访问配置的内网后端。
