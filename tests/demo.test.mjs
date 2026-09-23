import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seed = JSON.parse(fs.readFileSync(new URL('../demo/seed.json', import.meta.url), 'utf8'));
let source = fs.readFileSync(new URL('../demo/service.js', import.meta.url), 'utf8');
source = source.replace("import seed from './seed.json';", `const seed = ${JSON.stringify(seed)};`)
  .replace("import { demoConfig } from './config.js';", 'const demoConfig = globalThis.demoConfig;');
globalThis.demoConfig = { apiBase: '/river/openapi/v1', fileBase: 'http://192.168.2.103:8086', uploadUrl: '/jwsk-resource/oss/endpoint/put-file-attach', sampleImageBase: '', taskBindings: {} };
const service = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
globalThis.demoService = service;
let pageSource = fs.readFileSync(new URL('../pages/demo/index.vue', import.meta.url), 'utf8').split('<script>')[1].split('</script>')[0];
pageSource = pageSource.replace(/import \{([^}]+)\} from '@\/demo\/service.js';/, 'const {$1} = globalThis.demoService;');
const page = (await import(`data:text/javascript;base64,${Buffer.from(pageSource).toString('base64')}`)).default;
function pageInstance() {
  const vm = page.data();
  for (const [name, method] of Object.entries(page.methods)) vm[name] = method.bind(vm);
  for (const [name, getter] of Object.entries(page.computed)) Object.defineProperty(vm, name, { get: getter.bind(vm) });
  vm.records = service.loadRecords(); vm.selectedId = vm.records[0].id;
  return vm;
}
let storage;
let calls;
beforeEach(() => {
  storage = new Map(); calls = [];
  globalThis.demoConfig.taskBindings = {};
  globalThis.uni = {
    getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value),
    request: options => { calls.push(options); options.success({ statusCode: 200, data: { code: 200, data: { aiResult: 'COMPLETED' } } }); },
    uploadFile: options => { calls.push(options); options.success({ statusCode: 200, data: JSON.stringify({ code: 200, data: { link: 'http://files/photo.jpg' } }) }); },
    showToast: () => {},
  };
});
test('20 条样本保留原始信息并覆盖三个演示状态', () => {
  const rows = service.loadRecords(); assert.equal(rows.length, 20);
  assert.equal(rows[0].id, seed[0].id); assert.equal(rows[0].description, seed[0].problemDescription);
  assert.deepEqual(new Set(rows.map(r => r.status)), new Set(['RECTIFYING', 'REVIEW', 'COMPLETED']));
  assert.equal(rows[0].images[0].ref, seed[0].beforeImageText.split(',')[0]);
  assert.equal(calls.length, 0);
});
test('新增、整改、复核本地状态持久化，重置还原初始数据', () => {
  let rows = service.addRecord(service.loadRecords(), { kind: '乱堆', location: '桥下', description: '建筑垃圾', images: [{ ref: 'photo.jpg' }] });
  const id = rows[0].id;
  assert.equal(service.loadRecords().length, 21);
  rows = service.updateRecord(rows, id, { status: 'REVIEW', rectifyDescription: '已清理' }, '提交整改');
  rows = service.updateRecord(rows, id, { status: 'COMPLETED' }, '复核通过');
  assert.equal(service.loadRecords()[0].status, 'COMPLETED'); assert.equal(rows[0].history.length, 3);
  assert.equal(service.resetRecords().length, 20); assert.equal(calls.length, 0);
});
test('只有三个真实业务接口允许请求，免登录不携带伪造 token', async () => {
  demoConfig.recognitionApiKey = 'test-recognition-key';
  await assert.rejects(service.realRequest('/inspection/direct-submit', {}), /不允许/);
  assert.equal(calls.length, 0);
  for (const path of ['/inspection/recognition', '/rectification/ai-judgment', '/rectification/manual-review']) await service.realRequest(path, { imageRef: 'photo.jpg' });
  assert.equal(calls.length, 3); assert.equal(calls[0].header['Blade-Auth'], undefined);
  assert.equal(calls[0].header['X-API-Key'], 'test-recognition-key');
  assert.equal(calls[1].header['X-API-Key'], 'test-recognition-key');
  assert.equal(calls[2].header['X-API-Key'], undefined);
});
test('HTTP、业务、格式错误和网络失败均拒绝，不伪造识别成功', async () => {
  for (const response of [{ statusCode: 401, data: { msg: '未授权' } }, { statusCode: 200, data: { success: false, code: 200 } }, { statusCode: 200, data: '<html>' }]) {
    uni.request = options => options.success(response);
    await assert.rejects(service.realRequest('/inspection/recognition', {}));
  }
  uni.request = options => options.fail({});
  await assert.rejects(service.realRequest('/inspection/recognition', {}), /连接失败/);
});
test('上传地址与响应解析，不接受无文件地址或非 JSON 响应', async () => {
  assert.equal((await service.uploadImage('local.jpg')).ref, 'http://files/photo.jpg');
  assert.equal(calls[0].url, '/jwsk-resource/oss/endpoint/put-file-attach');
  assert.equal(calls[0].name, 'file');
  uni.uploadFile = options => options.success({ statusCode: 200, data: '{bad json' });
  await assert.rejects(service.uploadImage('local.jpg'), /格式异常/);
  uni.uploadFile = options => options.success({ statusCode: 200, data: { code: 200, data: {} } });
  await assert.rejects(service.uploadImage('local.jpg'), /未返回文件地址/);
});
test('图斑 ID 不冒充真实任务 ID，远端版本优先', () => {
  const row = service.loadRecords()[0]; assert.throws(() => service.taskContext(row), /尚未关联/);
  demoConfig.taskBindings[row.id] = { rectificationId: '1930000000000000601', version: 2 };
  assert.deepEqual(service.taskContext(row), { rectificationId: '1930000000000000601', version: 2 });
  assert.equal(service.taskContext({ ...row, remoteVersion: 3 }).version, 3);
});
test('样例图片没有来源时展示占位，上传图片使用上传服务源', () => {
  assert.equal(service.imageUrl('/static/work_file/a.jpg', true), '');
  assert.equal(service.imageUrl('upload/a.jpg'), 'http://192.168.2.103:8086/upload/a.jpg');
  assert.equal(service.imageUrl('https://files/a.jpg'), 'https://files/a.jpg');
});
test('页面整改识别通过后才能提交，照片变化立即使结果失效', async () => {
  const vm = pageInstance();
  demoConfig.taskBindings[vm.selectedId] = { rectificationId: '123', version: 0 };
  vm.startRectify(); vm.form = { images: [{ ref: 'after.jpg' }], description: '已清理' };
  await vm.submitRectify(); assert.equal(vm.selected.status, 'RECTIFYING');
  uni.request = options => options.success({ statusCode: 200, data: { code: 200, data: { aiResult: 'COMPLETED', judgmentId: '456', version: 1, canSubmit: true } } });
  await vm.judge(); assert.equal(vm.canSubmit, true);
  vm.removePhoto(0); assert.equal(vm.canSubmit, false);
  vm.form.images = [{ ref: 'new-after.jpg' }]; await vm.judge(); await vm.submitRectify();
  assert.equal(vm.selected.status, 'REVIEW'); assert.equal(vm.selected.remoteVersion, 1);
});
test('复核失败不改变状态，成功通过和驳回分别更新本地记录', async () => {
  const vm = pageInstance(); vm.selectedId = vm.records.find(r => r.status === 'REVIEW').id;
  demoConfig.taskBindings[vm.selectedId] = { rectificationId: '123', version: 0 };
  vm.reason = '现场检查完成'; vm.mode = 'review';
  uni.request = options => options.fail({});
  await vm.submitReview(); assert.equal(vm.selected.status, 'REVIEW'); assert.ok(vm.error);
  const retryId = vm.pendingReview.data.requestId;
  uni.request = options => { assert.equal(options.data.requestId, retryId); options.success({ statusCode: 200, data: { code: 200, data: { status: 'COMPLETED', version: 2 } } }); };
  await vm.submitReview(); assert.equal(vm.selected.status, 'COMPLETED');
  vm.selectedId = vm.records.find(r => r.status === 'REVIEW').id;
  demoConfig.taskBindings[vm.selectedId] = { rectificationId: '124', version: 0 };
  vm.approved = false; vm.reason = '仍有遗留垃圾';
  uni.request = options => options.success({ statusCode: 200, data: { code: 200, data: { status: 'PENDING', version: 1 } } });
  await vm.submitReview(); assert.equal(vm.selected.status, 'RECTIFYING');
});
