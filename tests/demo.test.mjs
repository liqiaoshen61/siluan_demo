import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seed = JSON.parse(fs.readFileSync(new URL('../demo/seed.json', import.meta.url), 'utf8'));
let source = fs.readFileSync(new URL('../demo/service.js', import.meta.url), 'utf8');
source = source.replace("import seed from './seed.json';", `const seed = ${JSON.stringify(seed)};`)
  .replace("import { demoConfig } from './config.js';", 'const demoConfig = globalThis.demoConfig;');
globalThis.demoConfig = { apiBase: '/api/v1', aiApiBase: '/api/v1', recognitionApiKey: 'test-recognition-key', fileBase: 'http://218.85.23.37:20320', uploadUrl: '/api/v1/file/upload', sampleImageBase: '', taskBindings: {} };
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
    request: options => { calls.push(options); options.success({ statusCode: 200, data: { code: 200, data: options.url.endsWith('/issue/detect') ? { category_main: '乱堆', category_sub: '垃圾', description: '现场存在垃圾' } : { passed: true } } }); },
    uploadFile: options => { calls.push(options); options.success({ statusCode: 200, data: JSON.stringify({ code: 200, data: { results: [{ file_name: 'uploads/photo.jpg', show_url: 'http://files/photo.jpg' }] } }) }); },
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
test('仅识别接口允许真实请求，复核接口保持本地模拟', async () => {
  demoConfig.recognitionApiKey = 'test-recognition-key';
  await assert.rejects(service.realRequest('/inspection/direct-submit', {}), /不允许/);
  assert.equal(calls.length, 0);
  await assert.rejects(service.realRequest('/rectification/manual-review', {}), /不允许/);
  for (const path of ['/issue/detect', '/issue/verify-rectification']) await service.realRequest(path, { image_name: 'uploads/photo.jpg' });
  assert.equal(calls.length, 2); assert.equal(calls[0].header['Blade-Auth'], undefined);
  assert.equal(calls[0].header['X-API-Key'], 'test-recognition-key');
  assert.equal(calls[1].header['X-API-Key'], 'test-recognition-key');
});
test('AI 未返回分类时可手动选择大类和对应小类，切换大类会清空旧小类', async () => {
  const vm = pageInstance(); vm.openCreate();
  vm.form.images = [{ ref: 'http://files/photo.jpg', image_name: 'uploads/photo.jpg' }];
  uni.request = options => options.success({ statusCode: 200, data: { code: 200, data: { description: '现场发现问题' } } });
  await vm.recognize();
  assert.equal(vm.form.kind, ''); assert.equal(vm.form.problemAttribute, '');
  vm.selectMainCategory(vm.kinds.indexOf('乱占'));
  assert.equal(vm.subKinds.length, 4);
  vm.form.problemAttribute = '非法占用水域滩地';
  vm.selectMainCategory(vm.kinds.indexOf('乱堆'));
  assert.equal(vm.form.problemAttribute, '');
  assert.deepEqual(vm.subKinds, ['乱堆垃圾', '废物废水倾倒、填埋等', '堆放碍洪物体']);
});
test('识别结果提示未发现四乱行为时不填入问题描述', async () => {
  const vm = pageInstance(); vm.openCreate();
  vm.form.images = [{ ref: 'http://files/photo.jpg', image_name: 'uploads/photo.jpg' }];
  uni.request = options => options.success({ statusCode: 200, data: { code: 200, data: { description: '图中为高峡水库及周边群山与公路。未发现类似四乱行为。' } } });
  await vm.recognize();
  assert.equal(vm.form.description, '');
  assert.match(vm.recognition, /未发现类似四乱行为/);
});
test('HTTP、业务、格式错误和网络失败均拒绝，不伪造识别成功', async () => {
  for (const response of [{ statusCode: 401, data: { msg: '未授权' } }, { statusCode: 200, data: { success: false, code: 200 } }, { statusCode: 200, data: '<html>' }]) {
    uni.request = options => options.success(response);
    await assert.rejects(service.realRequest('/issue/detect', {}));
  }
  uni.request = options => options.fail({});
  await assert.rejects(service.realRequest('/issue/detect', {}), /连接失败/);
});
test('上传解析 show_url 与 file_name，使用 files 字段和 API Key', async () => {
  const photo = await service.uploadImage('local.jpg');
  assert.equal(photo.ref, 'http://files/photo.jpg');
  assert.equal(photo.image_name, 'uploads/photo.jpg');
  assert.equal(calls[0].url, '/api/v1/file/upload');
  assert.equal(calls[0].name, 'files');
  assert.equal(calls[0].header['X-API-Key'], 'test-recognition-key');
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
test('样例图走 fzstatic 同源路径，上传图片使用上传服务源', () => {
  assert.equal(service.imageUrl('/static/work_file/a.jpg', true), '/fzstatic/work_file/a.jpg');
  assert.equal(service.imageUrl('upload/a.jpg'), 'http://218.85.23.37:20320/upload/a.jpg');
  assert.equal(service.imageUrl('https://files/a.jpg'), 'https://files/a.jpg');
  demoConfig.sampleImageBase = 'https://192.168.2.54:11000';
  demoConfig.fileBase = 'https://192.168.2.54:11000';
  assert.equal(service.imageUrl('/static/work_file/a.jpg', true), 'https://192.168.2.54:11000/fzstatic/work_file/a.jpg');
  assert.equal(service.imageUrl('http://218.85.23.37:20320/uploads/a.jpg'), 'https://192.168.2.54:11000/uploads/a.jpg');
  demoConfig.fileBase = '';
  assert.equal(service.imageUrl('uploads/a.jpg'), '/uploads/a.jpg');
});
test('页面整改识别通过后才能提交，照片变化立即使结果失效', async () => {
  const vm = pageInstance();
  vm.startRectify(); vm.form = { images: [{ ref: 'after.jpg', image_name: 'uploads/after.jpg' }], description: '已清理' };
  await vm.submitRectify(); assert.equal(vm.selected.status, 'RECTIFYING'); assert.match(vm.error, /先完成整改识别/);
  uni.request = options => { calls.push(options); options.success({ statusCode: 200, data: { code: 200, data: { passed: true, judgmentId: '456' } } }); };
  await vm.judge(); assert.equal(vm.canSubmit, true);
  vm.removePhoto(0); assert.equal(vm.canSubmit, false);
  vm.form.images = [{ ref: 'new-after.jpg', image_name: 'uploads/new-after.jpg' }]; await vm.judge(); await vm.submitRectify();
  assert.equal(vm.selected.status, 'REVIEW');
  assert.equal(calls.at(-1).data.before_image_name, vm.selected.images[0].ref);
  assert.equal(calls.at(-1).data.after_image_name, 'uploads/new-after.jpg');
});
test('AI 三次未通过后允许转人工复核', async () => {
  const vm = pageInstance(); vm.startRectify();
  vm.form = { images: [{ ref: 'after.jpg', image_name: 'uploads/after.jpg' }], description: '已清理' };
  uni.request = options => options.success({ statusCode: 200, data: { code: 200, data: { passed: false, message: '整改未完成' } } });
  await vm.judge(); assert.equal(vm.manualReviewAvailable, false);
  await vm.judge(); assert.equal(vm.manualReviewAvailable, false);
  await vm.judge(); assert.equal(vm.manualReviewAvailable, true);
  await vm.submitRectify();
  assert.equal(vm.selected.status, 'REVIEW'); assert.equal(vm.selected.manualReviewRequired, true);
});
test('复核必填意见，通过和驳回分别更新本地状态', async () => {
  const vm = pageInstance(); vm.selectedId = vm.records.find(r => r.status === 'REVIEW').id;
  vm.mode = 'review';
  await vm.submitReview(); assert.equal(vm.selected.status, 'REVIEW'); assert.match(vm.error, /复核意见/);
  vm.reason = '现场检查完成'; await vm.submitReview(); assert.equal(vm.selected.status, 'COMPLETED');
  vm.selectedId = vm.records.find(r => r.status === 'REVIEW').id;
  vm.approved = false; vm.reason = '仍有遗留垃圾';
  await vm.submitReview(); assert.equal(vm.selected.status, 'RECTIFYING');
});
