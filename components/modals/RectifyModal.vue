<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">整改记录</text>
        <view class="close-btn" @click="handleClose">
          <Icon name="close" color="#64748b" size="28rpx" />
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-body" scroll-y><!-- 状态 -->
        <view class="detail-section">
          <StatusBadge :status="task.rectificationStatus" :is-overdue="task.overdue" />
          <!-- 人工判定状态 -->
          <view v-if="task.manualReviewStatus || task.manualRejectionCount" class="manual-review-status">
            <text class="status-label">人工判定：</text>
            <text
              :class="['status-value', task.manualReviewStatus.toLowerCase(), manualReviewStatusText.includes('驳回') ? 'rejected' : '', manualReviewStatusText.includes('通过') ? 'approved' : '']">
              {{ manualReviewStatusText }}{{ manualReviewStatusText.includes('驳回') ?
                `,驳回次数：${task.manualRejectionCount}次` : '' }}
            </text>
          </view>
        </view>

        <!-- 问题信息 -->
        <view class="info-card">
          <view class="info-row">
            <text class="info-label">河段</text>
            <text class="info-value">{{ task.townshipName }}-{{ task.sectionName || "" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">类型</text>
            <text class="info-value">{{ task.problemTypeName || "" }}-{{ task.problemSubtypeName || "" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">上报人员</text>
            <text class="info-value">{{ formatPerson(task.reporterName, task.reporterRoleNames) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">描述</text>
            <text class="info-value desc">{{ task.problemDescription || "" }}</text>
          </view>
        </view>

        <!-- 图片预览 -->
        <view class="image-preview">
          <view class="preview-item">
            <text class="preview-label">背景图片</text>
            <image v-if="task.backgroundImages && task.backgroundImages[0]" :src="$img(task.backgroundImages[0])"
              mode="widthFix" class="preview-image" @click="previewImage(task.backgroundImages[0])" />
            <view v-else class="no-image">
              <text>暂无</text>
            </view>
          </view>
          <view class="preview-item">
            <text class="preview-label">问题图片</text>
            <image v-if="task.problemImages && task.problemImages[0]" :src="$img(task.problemImages[0])" mode="widthFix"
              class="preview-image" @click="previewImage(task.problemImages[0])" />
            <view v-else class="no-image">
              <text>暂无</text>
            </view>
          </view>
        </view>
        <!-- 驳回信息 -->
        <view class="info-card" v-if="task.manualReviewStatus === 'REJECTED'">
          <view class="info-row">
            <text class="info-label">驳回人员</text>
            <text class="info-value">{{ task.manualReviewGroupName }}-{{ task.manualReviewerName || "" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">驳回原因</text>
            <text class="info-value">{{ task.manualReviewReason || "" }}</text>
          </view>
        </view>
        <view class="info-card" v-if="task.manualRejectionCount">
          <view class="info-row">
            <text class="info-label">驳回次数</text>
            <text class="info-value">{{ task.manualRejectionCount }}</text>
          </view>
        </view>

        <!-- 整改图片上传 -->
        <view class="form-item margt">
          <text class="form-label"><text class="required">*</text>整改图片</text>
          <view class="image-upload">
            <view v-for="(img, index) in form.rectImages" :key="index" class="image-item">
              <image :src="$img(img)" mode="aspectFill" @click="previewImage(img)" />
              <view class="remove-btn" @click="removeImage(index)">
                <Icon name="close" color="#ffffff" size="24rpx" />
              </view>
            </view>
            <view v-if="form.rectImages.length < 9" class="upload-btn" @click="chooseImage">
              <Icon name="plus" color="#94a3b8" size="48rpx" />
              <text class="text">上传图片</text>
            </view>
          </view>

          <!-- 智能判定按钮 -->
          <view class="ai-judge-section">
            <button class="btn-ai-judge" :disabled="judging || form.rectImages.length === 0"
              @click="handleAiJudge(false)">
              <Icon v-if="!judging" name="search" color="#ffffff" size="28rpx" />
              <Icon v-else name="refresh" color="#ffffff" size="28rpx" class="rotating" />
              <text v-if="!judging">智能判定</text>
              <text v-else>判定中...</text>
            </button>

            <!-- 判定结果显示 -->
            <view v-if="lastAiResult && !judging" class="ai-result-display">
              <view class="ai-result" :class="getAiResultClass(lastAiResult)" v-if="form.rectImages.length">
                <Icon :name="lastAiResult === 'COMPLETED' ? 'check' : 'close'"
                  :color="lastAiResult === 'COMPLETED' ? '#059669' : '#dc2626'" size="32rpx" />
                <view class="ai-content">
                  <text class="ai-text">{{ getAiResultText(lastAiResult) }}</text>
                  <text v-if="aiConclusion" class="ai-reason">{{ aiConclusion }}</text>
                </view>
              </view>

              <!-- 判定次数提示 -->
              <view v-if="aiJudgmentCount > 0 && aiJudgmentCount < 3 && lastAiResult !== 'COMPLETED'"
                class="ai-count-tip">
                <text>已判定 {{ aiJudgmentCount }}/3 次</text>
              </view>

              <!-- 3次未通过提示 -->
              <view v-if="needManualReview" class="ai-force-tip">
                <text>已连续3次未通过，需填写原因后提交人工判定</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 整改说明 -->
        <view class="form-item">
          <text class="form-label">整改说明</text>
          <!-- 三次未通过后显示下拉快捷选择 -->
          <view v-if="showForceComplete" class="select-wrapper">
            <uni-data-select v-model="form.descriptionSelect" :localdata="zgsmOptions" placeholder="可快捷选择整改说明（也可直接输入）"
              @change="onDescriptionSelect" />
          </view>
          <textarea class="form-textarea" v-model="form.description" placeholder="请输入整改说明"
            placeholder-class="placeholder" :maxlength="1000" />
        </view>

        <!-- 申请人工判定原因（三次未通过后显示） -->
        <view v-if="showForceComplete" class="form-item">
          <text class="form-label"><text class="required">*</text>申请人工判定原因</text>
          <!-- 下拉快捷选择 -->
          <view class="select-wrapper">
            <uni-data-select v-model="form.forceReasonSelect" :localdata="sqrgpdOptions" placeholder="可快捷选择原因（也可直接输入）"
              @change="onForceReasonSelect" />
          </view>
          <!-- 输入框 -->
          <textarea class="form-textarea" v-model="form.forceReason" placeholder="请输入申请人工判定的原因"
            placeholder-class="placeholder" :maxlength="500" />
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <!-- 判定通过后显示提交按钮 -->
        <template v-if="canRectify && hasPassedAiCheck">
          <button class="btn btn-cancel" @click="handleClose">关闭</button>
          <button class="btn btn-submit" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? "提交中..." : "提交整改" }}
          </button>
        </template>

        <!-- 3次未通过显示提交人工判定按钮 -->
        <template v-else-if="canRectify && needManualReview">
          <button class="btn btn-cancel" @click="handleClose">关闭</button>
          <button class="btn btn-force" :disabled="submitting" @click="handleForceComplete">
            {{ submitting ? "提交中..." : "提交人工判定" }}
          </button>
        </template>

        <!-- 默认只显示关闭按钮 -->
        <template v-else>
          <button class="btn btn-cancel-full" @click="handleClose">关闭</button>
        </template>
      </view>
    </view>

    <!-- H5 自定义图片预览组件 -->
    <!-- #ifdef H5 -->
    <ImageViewer :visible="imageViewerVisible" :urls="imageViewerUrls" :current="imageViewerCurrent"
      @update:visible="imageViewerVisible = $event" />
    <!-- #endif -->
  </view>
</template>

<script>
import api from "@/api/index.js";
import userStore from "@/store/user.js";
import ImageViewer from "@/components/common/ImageViewer.vue";
import Icon from "@/components/common/Icon.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";

export default {
  name: "RectifyModal",
  components: {
    ImageViewer,
    StatusBadge,
    Icon,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    task: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:visible", "success"],
  data() {
    return {
      form: {
        rectImages: [],
        description: "",
        descriptionSelect: "", // 整改说明下拉选中值
        forceReason: "",
        forceReasonSelect: "", // 申请人工判定原因下拉选中值
      },
      zgsmOptions: [], // 整改说明下拉选项
      sqrgpdOptions: [], // 申请人工判定原因下拉选项
      submitting: false,
      judging: false, // 智能判定中
      currentVersion: 0,
      aiJudgmentCount: 0,
      lastAiResult: null,
      aiConclusion: "",
      forceRequired: false,
      manualReviewRequired: false, // 是否需要人工判定
      hasPassedAiCheck: false, // 是否已通过AI判定
      judgmentId: "", // AI判定记录ID
      canSubmit: false, // 是否允许提交整改
      lastAiRequestId: "", // AI判定请求ID(幂等控制)
      lastSubmitRequestId: "", // 提交请求ID(幂等控制)
      // #ifdef H5
      imageViewerVisible: false,
      imageViewerUrls: [],
      imageViewerCurrent: 0,
      // #endif
    };
  },
  computed: {
    showForceComplete() {
      return this.forceRequired || this.manualReviewRequired;
    },
    // 是否需要人工判定（三次驳回后）
    needManualReview() {
      return this.manualReviewRequired || (this.forceRequired && !this.canSubmit);
    },
    canRectify() {
      return userStore.getters.canRectify();
    },
    manualReviewStatusText() {
      const statusMap = {
        PENDING: "待人工判定",
        APPROVED: "人工判定通过",
        REJECTED: "人工判定驳回",
      };
      let otherStatus = this.task.manualReviewStatus;
      if (this.task.manualRejectionCount && this.task.rectificationStatus == 'PENDING') {
        otherStatus = "REJECTED";
      } else if (this.task.manualRejectionCount && this.task.rectificationStatus == 'COMPLETED') {
        otherStatus = "APPROVED";
      }
      return statusMap[otherStatus] || "";
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetForm();
        this.loadDictionaries();
      }
    },
  },
  methods: {
    resetForm() {
      // 回填历史整改图片和说明
      this.form.rectImages = this.task.rectificationImages || [];
      this.form.description = this.task.description || "";
      this.form.descriptionSelect = "";
      this.form.forceReason = this.task.manualReviewReason || "";
      this.form.forceReasonSelect = "";
      this.currentVersion = this.task.version || 0;
      this.aiJudgmentCount = this.task.aiJudgmentCount || 0;
      this.lastAiResult = this.task.aiResult || (this.task.lastAiJudgmentId !== -1 ? this.task.lastAiResult : null) || null;
      this.aiConclusion = this.task.conclusion || this.task.lastAiConclusion || "";
      this.forceRequired = this.task.forceRequired || false;
      this.manualReviewRequired = this.task.manualReviewRequired || false;

      // 处理任务详情新字段
      this.judgmentId = this.task.lastAiJudgmentId || "";
      this.canSubmit = this.task.canSubmit || false;

      // 判定通过状态由canSubmit决定
      this.hasPassedAiCheck = this.task.canSubmit || false;

      // 重置请求ID
      this.lastAiRequestId = "";
      this.lastSubmitRequestId = "";

      this.judging = false;
      this.submitting = false;
    },

    chooseImage() {
      uni.chooseImage({
        count: 9 - this.form.rectImages.length,
        sizeType: ["compressed"],
        sourceType: ["camera", "album"],
        success: async (res) => {
          uni.showLoading({ title: "上传中..." });
          try {
            const oldLength = this.form.rectImages.length;
            for (const filePath of res.tempFilePaths) {
              const link = await api.upload.uploadImage(filePath);
              this.form.rectImages.push(link);
            }

            // 图片变化后清空判定记录
            if (this.judgmentId && this.form.rectImages.length > oldLength) {
              this.judgmentId = "";
              this.canSubmit = false;
              this.hasPassedAiCheck = false;
              this.lastAiRequestId = "";
            }

            // 上传成功后自动触发 AI 判定
            uni.hideLoading();
            await this.handleAiJudge(true);
          } catch (error) {
            uni.hideLoading();
            uni.showToast({ title: "上传失败", icon: "none" });
          }
        },
      });
    },

    previewImage(url) {
      const fullUrl = this.$img(url);
      // #ifdef H5
      // H5环境：使用自定义图片预览组件
      this.imageViewerUrls = [fullUrl];
      this.imageViewerCurrent = 0;
      this.imageViewerVisible = true;
      // #endif

      // #ifndef H5
      // 小程序环境：使用原生预览
      uni.previewImage({
        urls: [fullUrl],
        current: fullUrl,
      });
      // #endif
    },

    removeImage(index) {
      this.form.rectImages.splice(index, 1);

      // 图片变化后清空判定记录
      if (this.judgmentId) {
        this.judgmentId = "";
        this.canSubmit = false;
        this.hasPassedAiCheck = false;
        this.lastAiRequestId = ""; // 重置请求ID

        uni.showToast({
          title: "图片已变化,需重新判定",
          icon: "none",
          duration: 2000,
        });
      }
    },

    getAiResultClass(result) {
      return result === "COMPLETED" ? "success" : "fail";
    },
    // 格式化人员显示：角色名称 + 用户名称
    formatPerson(name, roleNames) {
      if (!name) return "-";
      if (roleNames) {
        return `${roleNames} ${name}`;
      }
      return name;
    },
    getAiResultText(result) {
      const texts = {
        COMPLETED: "经智能判断，已完成整改",
        INCOMPLETE: "经智能判断，未完成整改",
        FAILED: "智能判断失败",
      };
      return texts[result] || "未知结果";
    },

    // 加载字典数据
    async loadDictionaries() {
      try {
        const [zgsmRes, sqrgpdRes] = await Promise.all([
          api.task.getDictionary('zgsm'),
          api.task.getDictionary('sqrgpd'),
        ]);

        // 格式化整改说明选项：[{text: '显示文本', value: '值'}]
        this.zgsmOptions = (zgsmRes.data || []).map(item => ({
          text: item.dictValue,
          value: item.dictKey,
        }));

        // 格式化申请人工判定原因选项
        this.sqrgpdOptions = (sqrgpdRes.data || []).map(item => ({
          text: item.dictValue,
          value: item.dictKey,
        }));
      } catch (error) {
        console.error('加载字典数据失败:', error);
      }
    },

    // 整改说明下拉选择 -> 填充到输入框
    onDescriptionSelect(value) {
      const selected = this.zgsmOptions.find(item => item.value === value);
      if (selected) {
        this.form.description = selected.text;
      }
    },

    // 申请人工判定原因下拉选择 -> 填充到输入框
    onForceReasonSelect(value) {
      const selected = this.sqrgpdOptions.find(item => item.value === value);
      if (selected) {
        this.form.forceReason = selected.text;
      }
    },


    // 智能判定
    // isAuto: 是否为自动判定（上传图片后自动触发）
    async handleAiJudge(isAuto = false) {
      // 验证图片
      if (this.form.rectImages.length === 0) {
        if (!isAuto) {
          uni.showToast({ title: "请先上传整改图片", icon: "none" });
        }
        return;
      }

      if (this.judging) return;

      this.judging = true;

      // 自动判定时显示 loading
      if (isAuto) {
        uni.showLoading({ title: "AI判定中..." });
      }

      try {
        // 生成或复用请求ID(幂等控制)
        if (!this.lastAiRequestId) {
          this.lastAiRequestId = this.generateRequestId();
        }

        // 调用新的AI判定接口
        const result = await api.task.aiJudgment({
          rectificationId: String(this.task.id),
          version: this.currentVersion,
          requestId: this.lastAiRequestId,
          imageRefs: this.form.rectImages,
        });

        const data = result.data || {};

        // 保存关键信息
        this.judgmentId = String(data.judgmentId);
        this.currentVersion = data.version;
        this.aiJudgmentCount = data.aiJudgmentCount;
        this.lastAiResult = data.aiResult;
        this.aiConclusion = data.conclusion || "";
        this.canSubmit = data.canSubmit;
        this.forceRequired = data.forceRequired;
        this.manualReviewRequired = data.manualReviewRequired || false;

        // 处理判定结果
        if (data.aiResult === "COMPLETED") {
          this.hasPassedAiCheck = true;

          // 判定通过时，将 conclusion 填入整改说明
          if (this.aiConclusion) {
            this.form.description = this.aiConclusion;
          }

          uni.showToast({ title: "判定通过！", icon: "success" });
        } else if (data.aiResult === "INCOMPLETE") {
          // 判定未通过，不填入整改说明，保持原来在照片下面显示
          this.form.description = "";
          if (this.forceRequired) {
            uni.showModal({
              title: "提示",
              content: "已连续3次判定未通过,需填写原因后提交人工判断",
              showCancel: false,
            });
          } else {
            uni.showToast({ title: "判定未通过", icon: "none" });
          }
        } else if (data.aiResult === "FAILED") {
          uni.showToast({ title: "判定失败,请重试", icon: "none" });
        }
      } catch (error) {
        console.error("AI判定失败:", error);
        uni.showToast({ title: error.msg || "判定失败", icon: "none" });
      } finally {
        this.judging = false;
        if (isAuto) {
          uni.hideLoading();
        }
      }
    },

    // 生成请求ID
    generateRequestId() {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 10);
      return `${timestamp}-${random}`;
    },

    async handleSubmit() {
      // 验证
      if (this.form.rectImages.length === 0) {
        uni.showToast({ title: "请上传整改图片", icon: "none" });
        return;
      }

      if (!this.judgmentId) {
        uni.showToast({ title: "请先进行AI判定", icon: "none" });
        return;
      }

      if (!this.canSubmit) {
        uni.showToast({ title: "AI判定未通过,无法提交", icon: "none" });
        return;
      }

      if (this.submitting) return;

      this.submitting = true;

      try {
        // 生成或复用请求ID(幂等控制)
        if (!this.lastSubmitRequestId) {
          this.lastSubmitRequestId = this.generateRequestId();
        }

        // 调用新的提交接口
        const result = await api.task.submitRectification({
          rectificationId: String(this.task.id),
          version: this.currentVersion,
          requestId: this.lastSubmitRequestId,
          judgmentId: this.judgmentId,
          description: this.form.description,
        });

        uni.showToast({ title: "提交成功！", icon: "success" });
        this.$emit("success", result.data);
        this.handleClose();
      } catch (error) {
        console.error("提交失败:", error);

        // 处理常见错误
        if (error.msg && error.msg.includes("已被其他用户修改")) {
          uni.showModal({
            title: "提示",
            content: "任务已被修改,请刷新后重试",
            showCancel: false,
          });
        } else {
          uni.showToast({ title: error.msg || "提交失败", icon: "none" });
        }
      } finally {
        this.submitting = false;
      }
    },

    async handleForceComplete() {
      if (!this.form.forceReason.trim()) {
        uni.showToast({ title: "请填写申请人工判定原因", icon: "none" });
        return;
      }

      // 必须有判定记录ID
      if (!this.judgmentId) {
        uni.showToast({ title: "缺少AI判定记录", icon: "none" });
        return;
      }

      if (this.submitting) return;

      this.submitting = true;

      try {
        // 生成或复用请求ID(幂等控制)
        if (!this.lastSubmitRequestId) {
          this.lastSubmitRequestId = this.generateRequestId();
        }

        const result = await api.task.forceCompleteRectification({
          rectificationId: String(this.task.id),
          version: this.currentVersion,
          requestId: this.lastSubmitRequestId,
          judgmentId: this.judgmentId,
          description: this.form.description,
          reason: this.form.forceReason,
        });

        uni.showToast({
          title: "已提交人工判定！",
          icon: "success",
        });

        this.$emit("success", result.data);
        this.handleClose();
      } catch (error) {
        console.error("提交人工判定失败:", error);
        uni.showToast({
          title: error.msg || "操作失败",
          icon: "none",
        });
      } finally {
        this.submitting = false;
      }
    },

    handleClose() {
      this.$emit("update:visible", false);
      this.resetForm();
    },

    handleOverlayClick() {
      // 不关闭
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-container {
  width: 100%;
  max-height: 85vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  border-bottom: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 32rpx;
  color: #64748b;
}

.modal-body {
  flex: 1;
  padding: 24rpx 20rpx;
  overflow-y: auto;
  box-sizing: border-box;
}

.info-card {
  background: #f8fafc;
  // border-radius: 16rpx;
  padding: 0rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;

  // &:not(:last-child) {
  border-bottom: 1rpx solid #e2e8f0;
  // }
}

.info-label {
  font-size: 26rpx;
  color: #64748b;
}

.info-value {
  font-size: 26rpx;
  color: #1e293b;
  flex: 1;
  text-align: right;
  margin-left: 24rpx;

  &.desc {
    text-align: left;
    // margin-top: 12rpx;
  }
}

.image-preview {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  margin-top: 10rpx;
}

.preview-item {
  flex: 1;
}

.preview-label {
  display: block;
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 8rpx;
}

.preview-image {
  width: 50%;
  height: 200rpx;
  border-radius: 12rpx;
}

.no-image {
  width: 100%;
  height: 200rpx;
  background: #f1f5f9;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 24rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #374151;
  margin-bottom: 16rpx;

  .required {
    color: #ef4444;
    margin-right: 4rpx;
  }
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;

  image {
    width: 100%;
    height: 100%;
  }

  .remove-btn {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 40rpx;
    height: 40rpx;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      color: #ffffff;
      font-size: 24rpx;
    }
  }
}

.upload-btn {
  width: 160rpx;
  height: 160rpx;
  background: #f8fafc;
  border: 2rpx dashed #cbd5e1;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  .plus {
    font-size: 48rpx;
    color: #94a3b8;
  }

  .text {
    font-size: 24rpx;
    color: #94a3b8;
  }
}

.ai-result {
  display: flex;
  gap: 12rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;

  &.success {
    background: #d1fae5;

    .ai-icon,
    .ai-text {
      color: #059669;
    }
  }

  &.fail {
    background: #fee2e2;

    .ai-icon,
    .ai-text {
      color: #dc2626;
    }
  }
}

.ai-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.ai-content {
  flex: 1;
}

.ai-text {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
}

.ai-reason {
  display: block;
  font-size: 22rpx;
  opacity: 0.8;
  margin-top: 4rpx;
}

.ai-count-tip {
  margin-top: 16rpx;
  padding: 12rpx 16rpx;
  background: #fef3c7;
  border-radius: 12rpx;

  text {
    font-size: 24rpx;
    color: #d97706;
  }
}

.form-textarea {
  width: 100%;
  height: 160rpx;
  background: #f8fafc;
  border: 1rpx solid #e2e8f0;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #1e293b;
  box-sizing: border-box;
}

.select-wrapper {
  margin-bottom: 16rpx;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 20rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom, 16rpx));
  border-top: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &.btn-cancel {
    background: #f1f5f9;
    color: #64748b;
  }

  &.btn-submit {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
  }

  &.btn-force {
    background: linear-gradient(135deg, #dc2626 0%, #f87171 100%);
    color: #ffffff;
  }

  &[disabled] {
    opacity: 0.6;
  }
}

.ai-judge-section {

  margin-top: 20rpx;

  .btn-ai-judge {
    width: 300rpx;
    font-size: 26rpx;
    height: 48rpx;
    line-height: 48rpx;
  }
}

.ai-force-tip {
  font-size: 20rpx;
  color: #64748b;
}

.placeholder {
  color: #94a3b8;
}

.margt {
  margin-top: 20rpx;

}

// 旋转动画
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.detail-section {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 16rpx;
}

uni-button:after {
  height: 193%;
}

// 人工判定状态样式
.manual-review-status {
  display: flex;
  align-items: center;
  margin-top: 16rpx;

  .status-label {
    font-size: 26rpx;
    color: #64748b;
  }

  .status-value {
    font-size: 26rpx;
    font-weight: 500;

    &.pending {
      color: #d97706;
    }

    &.approved {
      color: #059669;
    }

    &.rejected {
      color: #dc2626;
    }
  }
}
</style>
