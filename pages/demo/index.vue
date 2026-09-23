<template>
  <view class="demo-page">
    <view class="header">
      <view class="header-spacer" />
      <text class="title">四乱问题管理</text>
      <button class="primary compact" @click="openCreate">＋ 新增</button>
    </view>
    <view class="list-heading"><view class="summary"><text class="summary-icon">≋</text><text>四乱问题台账 · 共 {{ filtered.length }} 条</text></view><text class="reset" @click="reset">重置演示</text></view>
    <view class="toolbar">
      <view class="search"><view class="search-icon" /><input v-model="keyword" placeholder="请输入地点、河流或问题搜索" /><text v-if="keyword" @click="keyword = ''">清除</text></view>
      <scroll-view scroll-x class="tabs">
        <view class="tab-row"><view v-for="tab in tabs" :key="tab.value" class="tab" :class="{ active: status === tab.value }" @click="status = tab.value">{{ tab.label }} <text>{{ count(tab.value) }}</text></view></view>
      </scroll-view>
    </view>
    <view v-for="row in visibleRows" :key="row.id" class="card" @click="openDetail(row)">
      <view class="row"><text class="place">{{ row.town || '现场上报' }}</text><text class="badge" :class="row.status">{{ statuses[row.status] }}</text></view>
      <text class="description">{{ row.description }}</text>
      <text class="muted location">{{ row.location }}</text>
      <view class="card-bottom"><text class="kind">{{ row.kind }}<text v-if="row.river"> · {{ row.river }}</text></text><text class="muted">{{ row.importedAt.slice(0, 10) }}</text></view>
      <view class="card-action"><text>查看详情</text><text>{{ row.status === 'RECTIFYING' ? '去整改 →' : row.status === 'REVIEW' ? '去复核 →' : '查看记录 →' }}</text></view>
    </view>
    <view v-if="!filtered.length" class="empty">暂无匹配的问题，试试其他关键词</view>
    <button v-if="visibleRows.length < filtered.length" class="more" @click="limit += 10">加载更多</button>
    <text class="footnote">业务数据保存在当前设备，上传与识别使用真实服务</text>

    <view v-if="mode" class="overlay">
      <view class="sheet">
        <view class="sheet-head"><text>{{ modeTitle }}</text><button class="close" :disabled="busy" @click="close">关闭</button></view>
        <scroll-view scroll-y class="sheet-body">
          <template v-if="mode === 'create'">
            <text class="section-title">问题照片</text>
            <view class="photos"><view v-for="(photo, i) in form.images" :key="photo.ref" class="photo"><image :src="imageUrl(photo.ref)" mode="aspectFill" @click="preview(photo)" /><text class="remove" @click="removePhoto(i)">×</text></view><button v-if="form.images.length < 9" class="upload" :disabled="busy" @click="choosePhotos">＋<text>拍照 / 相册</text></button></view>
            <button class="secondary" :disabled="busy || !form.images.length" @click="recognize">{{ busy ? '处理中…' : 'AI 识别问题照片' }}</button>
            <text v-if="recognition" class="result">{{ recognition }}</text>
            <text class="label">问题类型</text><picker :range="kinds" :value="Math.max(0, kinds.indexOf(form.kind))" @change="form.kind = kinds[$event.detail.value]"><view class="field">{{ form.kind }} <text>⌄</text></view></picker>
            <template v-if="form.problemAttribute"><text class="label">问题子类</text><view class="field">{{ form.problemAttribute }}</view></template>
            <text class="label">乡镇 / 街道</text><input v-model="form.town" class="field" placeholder="请输入乡镇或街道" maxlength="80" />
            <text class="label">河流</text><input v-model="form.river" class="field" placeholder="请输入河流名称" maxlength="80" />
            <text class="label">问题地点 *</text><input v-model="form.location" class="field" placeholder="请输入问题发生地点" maxlength="200" />
            <text class="label">问题描述 *</text><textarea v-model="form.description" class="textarea" maxlength="1000" placeholder="描述现场问题，可修改 AI 识别建议" />
          </template>
          <template v-else-if="selected">
            <view class="row"><text class="kind">{{ selected.kind }} · {{ selected.river }}</text><text class="badge" :class="selected.status">{{ statuses[selected.status] }}</text></view>
            <text class="detail-title">{{ selected.description }}</text><text class="muted">{{ selected.location }}</text>
            <text class="meta">图斑编号：{{ selected.id }}</text><text v-if="selected.problemAttribute" class="meta">问题属性：{{ selected.problemAttribute }}</text>
            <text class="section-title">问题照片</text>
            <view class="photos"><view v-for="photo in selected.images" :key="photo.ref" class="photo"><image v-if="imageUrl(photo.ref, photo.sample)" :src="imageUrl(photo.ref, photo.sample)" mode="aspectFill" @click="preview(photo)" /><text v-else class="placeholder">示例照片<br />待配置图片服务</text></view></view>
            <template v-if="mode === 'rectify'">
              <text class="section-title">整改材料</text><text class="muted">上传整改后照片，识别通过后提交复核。</text>
              <view class="photos"><view v-for="(photo, i) in form.images" :key="photo.ref" class="photo"><image :src="imageUrl(photo.ref)" mode="aspectFill" @click="preview(photo)" /><text class="remove" @click="removePhoto(i)">×</text></view><button v-if="form.images.length < 9" class="upload" :disabled="busy" @click="choosePhotos">＋<text>拍照 / 相册</text></button></view>
              <text class="label">整改说明 *</text><textarea v-model="form.description" class="textarea" maxlength="1000" placeholder="请填写整改措施和完成情况" />
              <button class="secondary" :disabled="busy || !form.images.length" @click="judge">{{ busy ? '处理中…' : 'AI 识别整改结果' }}</button>
              <text v-if="judgment" class="result">{{ judgment.conclusion || judgment.aiResult }}</text>
            </template>
            <template v-if="selected.rectifyDescription">
              <text class="section-title">整改情况</text><text class="body-text">{{ selected.rectifyDescription }}</text>
              <view class="photos"><image v-for="photo in selected.rectifyImages" :key="photo.ref" class="photo" :src="imageUrl(photo.ref, photo.sample)" mode="aspectFill" @click="preview(photo)" /></view>
            </template>
            <template v-if="mode === 'review'">
              <text class="section-title">复核意见</text>
              <radio-group class="decisions" @change="!busy && (approved = $event.detail.value === 'approved')">
                <label class="decision-option"><radio value="approved" :checked="approved" :disabled="busy" color="#2185d9" /><text>复核通过</text></label>
                <label class="decision-option"><radio value="rejected" :checked="!approved" :disabled="busy" color="#2185d9" /><text>退回整改</text></label>
              </radio-group>
              <textarea v-model="reason" class="textarea" maxlength="500" placeholder="请填写复核意见（必填）" />
            </template>
            <template v-if="mode === 'detail'"><text class="section-title">处理记录</text><view v-for="(event, i) in selected.history" :key="i" class="history"><text>{{ event.text }}</text><text class="muted">{{ event.time }}</text></view></template>
          </template>
          <text v-if="error" class="error">{{ error }}</text>
          <view class="body-end" />
        </scroll-view>
        <view class="sheet-footer">
          <button v-if="mode === 'create'" class="primary" :disabled="busy" @click="submitCreate">保存并发起整改</button>
          <button v-else-if="mode === 'rectify'" class="primary" :disabled="busy || !canSubmit" @click="submitRectify">提交复核</button>
          <button v-else-if="mode === 'review'" class="primary" :disabled="busy" @click="submitReview">{{ busy ? '校验中…' : '校验并提交复核' }}</button>
          <button v-else-if="selected.status === 'RECTIFYING'" class="primary" @click="startRectify">开始整改</button>
          <button v-else-if="selected.status === 'REVIEW'" class="primary" @click="mode = 'review'">开始复核</button>
          <button v-else class="secondary" @click="close">完成</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { statuses, kinds, loadRecords, resetRecords, addRecord, updateRecord, imageUrl, uploadImage, realRequest, taskContext, requestId } from '@/demo/service.js';
export default {
  data: () => ({ records: [], statuses, kinds, keyword: '', status: '', limit: 10, mode: '', selectedId: '',
    form: { images: [] }, busy: false, error: '', recognition: '', judgment: null, approved: true, reason: '', pendingJudgment: null, pendingReview: null }),
  computed: {
    tabs() { return [{ value: '', label: '全部' }, ...Object.entries(statuses).map(([value, label]) => ({ value, label }))]; },
    filtered() { const keyword = this.keyword.trim().toLowerCase(); return this.records.filter(r => (!this.status || r.status === this.status) && (!keyword || [r.id, r.town, r.river, r.location, r.description, r.kind].join(' ').toLowerCase().includes(keyword))); },
    visibleRows() { return this.filtered.slice(0, this.limit); },
    selected() { return this.records.find(r => r.id === this.selectedId); },
    modeTitle() { return { create: '新增问题', detail: '问题详情', rectify: '问题整改', review: '问题复核' }[this.mode]; },
    canSubmit() { return this.judgment?.aiResult === 'COMPLETED' && this.judgment?.canSubmit === true && !!this.judgment?.judgmentId; },
  },
  watch: { keyword() { this.limit = 10; }, status() { this.limit = 10; } },
  onLoad() { this.records = loadRecords(); },
  methods: {
    imageUrl,
    count(status) { return this.records.filter(r => !status || r.status === status).length; },
    clearState() { this.error = ''; this.recognition = ''; this.judgment = null; this.pendingJudgment = null; this.pendingReview = null; this.reason = ''; this.approved = true; },
    close() { if (!this.busy) this.mode = ''; },
    openCreate() { this.clearState(); this.form = { kind: '乱占', problemAttribute: '', town: '', river: '', location: '', description: '', images: [] }; this.mode = 'create'; },
    openDetail(row) { this.clearState(); this.selectedId = row.id; this.mode = 'detail'; },
    startRectify() { this.form = { description: '', images: [] }; this.judgment = null; this.mode = 'rectify'; },
    reset() { uni.showModal({ title: '重置演示数据', content: '清除本地新增和操作记录，恢复原始 20 条示例数据？', success: ({ confirm }) => { if (confirm) this.records = resetRecords(); } }); },
    async run(action) { if (this.busy) return; this.busy = true; this.error = ''; try { await action(); } catch (e) { this.error = e.message || e.msg || '操作失败，请重试'; } finally { this.busy = false; } },
    invalidate() { this.judgment = null; this.recognition = ''; this.pendingJudgment = null; this.form.recognitionData = null; },
    removePhoto(index) { if (this.busy) return; this.form.images.splice(index, 1); this.invalidate(); },
    choosePhotos() {
      if (this.busy) return;
      uni.chooseImage({ count: 9 - this.form.images.length, sizeType: ['compressed'], sourceType: ['album', 'camera'],
        success: res => this.run(async () => { this.invalidate(); for (const path of res.tempFilePaths) this.form.images.push(await uploadImage(path)); }),
        fail: e => { if (!String(e.errMsg).includes('cancel')) this.error = '无法打开相册或相机，请检查宿主 App 权限'; },
      });
    },
    preview(photo) { const url = imageUrl(photo.ref, photo.sample); if (url) uni.previewImage({ urls: [url] }); },
    recognize() { return this.run(async () => {
      const image_url = imageUrl(this.form.images[0].ref, this.form.images[0].sample);
      if (!image_url) throw new Error('无法获取图片地址，请重新上传');
      const result = await realRequest('/issue/detect', { image_url });
      if (!result || typeof result !== 'object') throw new Error('识别接口未返回有效结果');
      this.form.recognitionData = result;
      const categoryMain = result.category_main || result.categoryMain;
      const categorySub = result.category_sub || result.categorySub;
      const description = result.description || result.suggestedDescription;
      this.recognition = description || categorySub || '识别完成，请确认问题信息';
      if (categoryMain) this.form.kind = categoryMain;
      if (categorySub) this.form.problemAttribute = categorySub;
      if (description) this.form.description = description;
      if (result.suggestedLocation) this.form.location = result.suggestedLocation;
    }); },
    submitCreate() { return this.run(async () => {
      if (!this.form.images.length || !this.form.location.trim() || !this.form.description.trim()) throw new Error('请上传问题照片并填写地点、描述');
      this.records = addRecord(this.records, this.form); this.status = ''; this.keyword = ''; this.mode = ''; uni.showToast({ title: '问题已保存', icon: 'success' });
    }); },
    judge() { return this.run(async () => {
      this.judgment = null;
      const before = this.selected.images?.[0];
      const after = this.form.images?.[0];
      const before_image_url = before && imageUrl(before.ref, before.sample);
      const after_image_url = after && imageUrl(after.ref, after.sample);
      if (!before_image_url || !after_image_url) throw new Error('整改校验需要整改前、整改后照片');
      const detection = this.selected.recognitionData || {};
      const category_main = detection.category_main || detection.categoryMain || this.selected.kind;
      const category_sub = detection.category_sub || detection.categorySub || this.selected.problemAttribute || this.selected.problemDescription || '';
      const description = detection.description || detection.suggestedDescription || this.selected.description || '';
      if (!category_main || !category_sub || !description) throw new Error('缺少问题分类或描述，请先完成新增问题识别');
      const result = await realRequest('/issue/verify-rectification', { before_image_url, after_image_url, category_main, category_sub, description });
      if (!result || typeof result !== 'object') throw new Error('整改识别接口未返回有效结果');
      const rawVerdict = result.passed ?? result.is_passed ?? result.is_rectified ?? result.rectification_passed ?? result.is_compliant ?? result.verified ?? result.rectified ?? result.result;
      const verdict = typeof rawVerdict === 'boolean' ? rawVerdict : typeof result.status === 'string' ? ['PASS', 'PASSED', 'COMPLETED', 'RECTIFIED'].includes(result.status.toUpperCase()) ? true : ['FAIL', 'FAILED', 'INCOMPLETE', 'NOT_RECTIFIED'].includes(result.status.toUpperCase()) ? false : undefined : undefined;
      if (typeof verdict !== 'boolean') throw new Error('整改校验响应中缺少通过状态，请检查接口返回字段');
      const conclusion = result.conclusion || result.message || result.description || (verdict ? '整改校验通过' : '整改校验未通过');
      this.judgment = { ...result, aiResult: verdict ? 'COMPLETED' : 'INCOMPLETE', canSubmit: verdict, judgmentId: 'issue-verify', conclusion };
      this.records = updateRecord(this.records, this.selectedId, {}, `整改识别：${conclusion}`);
    }); },
    submitRectify() { return this.run(async () => {
      if (!this.canSubmit || !this.form.description.trim()) throw new Error('请完成整改识别并填写整改说明');
      this.records = updateRecord(this.records, this.selectedId, { status: 'REVIEW', rectifyImages: this.form.images, rectifyDescription: this.form.description, judgmentId: this.judgment.judgmentId }, '提交整改，等待复核');
      this.mode = 'detail';
    }); },
    submitReview() { return this.run(async () => {
      if (!this.reason.trim()) throw new Error('请填写复核意见');
      const payload = { ...taskContext(this.selected), approved: this.approved, reason: this.reason.trim() };
      const signature = JSON.stringify(payload);
      if (this.pendingReview?.signature !== signature) this.pendingReview = { signature, data: { ...payload, requestId: requestId() } };
      const result = await realRequest('/rectification/manual-review', this.pendingReview.data);
      if (!result || typeof result !== 'object' || !result.status) throw new Error('复核接口未返回有效状态');
      this.records = updateRecord(this.records, this.selectedId, { status: payload.approved ? 'COMPLETED' : 'RECTIFYING', remoteVersion: result.version ?? payload.version }, `${payload.approved ? '复核通过' : '退回整改'}：${payload.reason}`);
      this.pendingReview = null; this.mode = 'detail';
    }); },
  },
};
</script>

<style scoped src="./theme.css"></style>
