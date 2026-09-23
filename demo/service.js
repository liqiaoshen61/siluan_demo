import seed from './seed.json';
import { demoConfig } from './config.js';

const STORAGE_KEY = 'river_h5_demo_v1';
export const statuses = { RECTIFYING: '待整改', REVIEW: '待复核', COMPLETED: '已完成' };
export const kinds = ['乱占', '乱采', '乱堆', '乱建'];
const clone = value => JSON.parse(JSON.stringify(value));
export const requestId = () => `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export function imageUrl(ref, sample = false) {
  if (!ref) return '';
  if (/^(https?:|blob:|data:)/.test(ref)) return ref;
  const base = sample ? demoConfig.sampleImageBase : demoConfig.fileBase;
  if (sample && !base) return '';
  return `${base.replace(/\/$/, '')}/${ref.replace(/^\/+/, '')}`;
}
export function initialRecords() {
  return seed.map((item, index) => ({
    ...item,
    status: index % 5 === 4 ? 'COMPLETED' : index % 5 === 3 ? 'REVIEW' : 'RECTIFYING',
    sourceStatus: item.status,
    location: item.locationDescription.trim() || `${item.city}${item.county}${item.town}${item.village} · ${item.river}`,
    description: item.problemDescription,
    images: item.beforeImageText.split(';').filter(Boolean).map(s => ({ ref: s.split(',')[0], sample: true })),
    rectifyImages: [],
    rectifyDescription: index % 5 >= 3 ? '演示记录：已完成现场清理，提交复核。' : '',
    version: 0,
    history: [{ text: '导入示例图斑', time: item.importedAt }],
  }));
}
export function loadRecords() {
  const saved = uni.getStorageSync(STORAGE_KEY);
  return Array.isArray(saved) && saved.length >= 0 ? clone(saved) : initialRecords();
}
export function saveRecords(records) { uni.setStorageSync(STORAGE_KEY, clone(records)); }
export function resetRecords() { const records = initialRecords(); saveRecords(records); return records; }
export function addRecord(records, form) {
  const record = { ...clone(form), id: requestId(), status: 'RECTIFYING', version: 0,
    importedAt: new Date().toLocaleString('zh-CN'), rectifyImages: [], rectifyDescription: '',
    history: [{ text: '新增问题', time: new Date().toLocaleString('zh-CN') }] };
  const next = [record, ...records]; saveRecords(next); return next;
}
export function updateRecord(records, id, changes, text) {
  const next = records.map(row => row.id === id ? { ...row, ...clone(changes),
    history: [...row.history, { text, time: new Date().toLocaleString('zh-CN') }] } : row);
  saveRecords(next); return next;
}
function decodeResponse(res) {
  let body = res.data;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { throw new Error('接口返回格式异常'); }
  }
  if (res.statusCode < 200 || res.statusCode >= 300 || !body || body.success === false ||
      !(body.code === 200 || body.code === 0 || body.success === true)) {
    throw new Error(body?.msg || body?.message || `请求失败（${res.statusCode}）`);
  }
  return body.data;
}
// 严格白名单：演示业务增删改查不进入网络请求。
const REAL_PATHS = ['/inspection/recognition', '/rectification/ai-judgment', '/rectification/manual-review'];
export function realRequest(path, data) {
  if (!REAL_PATHS.includes(path)) return Promise.reject(new Error('演示模式不允许此接口'));
  const header = { 'Content-Type': 'application/json' };
  if (path === '/inspection/recognition' || path === '/rectification/ai-judgment') {
    header['X-API-Key'] = demoConfig.recognitionApiKey;
  }
  return new Promise((resolve, reject) => uni.request({
    url: demoConfig.apiBase.replace(/\/$/, '') + path, method: 'POST', data,
    header, timeout: 60000,
    success: res => { try { resolve(decodeResponse(res)); } catch (error) { reject(error); } },
    fail: () => reject(new Error('接口连接失败，请检查网络及服务代理配置')),
  }));
}
export function uploadImage(filePath) {
  return new Promise((resolve, reject) => uni.uploadFile({
    url: demoConfig.uploadUrl, filePath, name: 'file', timeout: 60000,
    success: res => {
      try {
        const data = decodeResponse(res);
        const ref = typeof data === 'string' ? data : data?.link || data?.url || data?.name;
        if (!ref) throw new Error('上传成功但未返回文件地址');
        resolve({ ref, sample: false });
      } catch (error) { reject(error); }
    },
    fail: () => reject(new Error('文件上传失败，请检查上传服务连接')),
  }));
}
export function taskContext(record) {
  const binding = demoConfig.taskBindings[record.id];
  // 不把图斑 ID 冒充后端整改任务 ID。
  if (!binding?.rectificationId) throw new Error('该演示问题尚未关联真实整改任务，请配置 taskBindings 后重试');
  return { rectificationId: String(binding.rectificationId), version: record.remoteVersion ?? binding.version ?? 0 };
}
