<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">任务详情</text>
        <view class="close-btn" @click="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-body" scroll-y>
        <!-- 状态 -->
        <view class="detail-section">
          <StatusBadge :status="data.rectificationStatus" :is-overdue="data.overdue" />
          <!-- 人工判定状态 -->
          <view v-if="data.manualReviewStatus || data.manualRejectionCount" class="manual-review-status">
            <text class="status-label">人工判定：</text>
            <text
              :class="['status-value', data.manualReviewStatus.toLowerCase(), manualReviewStatusText.includes('驳回') ? 'rejected' : '', manualReviewStatusText.includes('通过') ? 'approved' : '']">
              {{ manualReviewStatusText }}{{ manualReviewStatusText.includes('驳回') ?
                `,驳回次数：${data.manualRejectionCount}次` : '' }}
            </text>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="detail-section">
          <view class="info-row">
            <text class="info-label">责任乡镇</text>
            <text class="info-value">{{ data.townshipName || "-" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">问题地点</text>
            <text class="info-value">{{ data.problemLocation || "-" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">问题类型</text>
            <text class="info-value">{{ data.problemTypeName }}-{{ data.problemSubtypeName || "-" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">问题描述</text>
            <text class="info-value">{{ data.problemDescription || "-" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">暗访时间</text>
            <text class="info-value">{{ formatDateTime(data.inspectionTime) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">上报人员</text>
            <text class="info-value">{{ formatPerson(data.reporterName, data.reporterRoleNames) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">问题图片</text>
            <view v-if="data.problemImages?.length" class="image-grid">
              <image v-for="(img, index) in data.problemImages" :key="index" :src="$img(img)" mode="aspectFill"
                class="preview-image" @click="previewImage(data.problemImages, index)" />
            </view>
          </view>
          <view class="info-row">
            <text class="info-label">问题背景</text>
            <view v-if="data.backgroundImages?.length" class="image-grid">
              <image v-for="(img, index) in data.backgroundImages" :key="index" :src="$img(img)" mode="aspectFill"
                class="preview-image" @click="previewImage(data.backgroundImages, index)" />
            </view>
          </view>
        </view>

        <!-- 处理人员信息 -->
        <view class="detail-section">
          <text class="section-title" v-if="data.handlerName">处理人员</text>
          <view v-if="data.handlerName" class="info-row">
            <text class="info-label">整改人员</text>
            <text class="info-value">{{ formatPerson(data.handlerName, data.handlerRoleNames) }}</text>
          </view>
          <view v-if="data.rejecterName" class="info-row">
            <text class="info-label">驳回人员</text>
            <text class="info-value">{{ formatPerson(data.rejecterName, data.rejecterRoleNames) }}</text>
          </view>
          <view v-if="data.manualRejectionCount" class="info-row">
            <text class="info-label">驳回次数</text>
            <text class="info-value">{{ data.manualRejectionCount }}</text>
          </view>
          <view v-if="data.completedByName" class="info-row">
            <text class="info-label">完成人员</text>
            <text class="info-value">{{ formatPerson(data.completedByName, data.completedByRoleNames) }}</text>
          </view>
        </view>

        <!-- 整改信息 -->
        <view class="detail-section" v-if="data.rectificationImages?.length || data.description">
          <text class="section-title">整改信息</text>

          <!-- 整改图片 -->
          <view v-if="data.rectificationImages?.length" class="info-row">
            <text class="info-label">整改图片</text>
            <image v-for="(img, index) in data.rectificationImages" :key="index" :src="$img(img)" mode="aspectFill"
              class="preview-image" @click="previewImage(data.rectificationImages, index)" />
          </view>

          <!-- 整改说明 -->
          <view v-if="data.description" class="rectify-desc">
            <text class="info-label">整改说明</text>
            <text class="description-text">{{ data.description }}</text>
          </view>
          <!-- Ai 判定不通过说明 -->
          <view v-if="data.lastAiResult == 'INCOMPLETE'" class="rectify-desc">
            <text class="info-label">Ai判定不通过说明</text>
            <text class="description-text">{{ data.lastAiConclusion }}</text>
          </view>
          <!-- Ai 判定不通过说明 -->
          <view v-if="data.forceReason" class="rectify-desc">
            <text class="info-label">申请人工判定说明</text>
            <text class="description-text">{{ data.forceReason }}</text>
          </view>
          <!-- 人工判定原因 -->
          <view v-if="data.manualReviewReason" class="rectify-desc">
            <text class="info-label">人工判定说明</text>
            <text class="description-text">{{ data.manualReviewReason }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <!-- 人工判定按钮（县级巡查员可见） -->
        <template v-if="canManualReview">
          <button class="btn btn-default" @click="handleClose">关闭</button>
          <button class="btn btn-warning" @click="openManualReview">人工判定</button>
        </template>
        <!-- 整改按钮 -->
        <template v-else-if="data.rectificationStatus === 'PENDING'">
          <button class="btn btn-primary" @click="handleRectify">提交整改</button>
        </template>
        <!-- 默认关闭按钮 -->
        <template v-else>
          <button class="btn btn-default" @click="handleClose">关闭</button>
        </template>
      </view>
    </view>

    <!-- H5 自定义图片预览组件 -->
    <!-- #ifdef H5 -->
    <ImageViewer :visible="imageViewerVisible" :urls="imageViewerUrls" :current="imageViewerCurrent"
      @update:visible="imageViewerVisible = $event" />
    <!-- #endif -->

    <!-- 人工判定弹窗 -->
    <view v-if="showManualReviewModal" class="modal-overlay" @click="closeManualReview">
      <view class="review-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">人工判定</text>
        </view>
        <view class="modal-body">
          <view class="review-options">
            <view :class="['review-option', { active: manualReviewForm.approved === true }]"
              @click="manualReviewForm.approved = true">
              <text class="option-title">判定通过</text>
              <text class="option-desc">任务完成，累计驳回次数不变</text>
            </view>
            <view :class="['review-option', { active: manualReviewForm.approved === false }]"
              @click="manualReviewForm.approved = false">
              <text class="option-title">判定驳回</text>
              <text class="option-desc">任务继续整改，累计驳回次数+1</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label"><text class="required">*</text>判定原因</text>
            <textarea class="form-textarea" v-model="manualReviewForm.reason"
              :placeholder="manualReviewForm.approved ? '请输入判定通过的原因' : '请输入驳回原因，要求继续整改'" placeholder-class="placeholder"
              :maxlength="500" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-default" @click="closeManualReview">取消</button>
          <button class="btn" :class="manualReviewForm.approved ? 'btn-primary' : 'btn-danger'"
            :disabled="manualReviewSubmitting" @click="submitManualReview">
            {{ manualReviewSubmitting ? "提交中..." : "确认提交" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import ImageViewer from "@/components/common/ImageViewer.vue";
import userStore from "@/store/user.js";
import api from "@/api/index.js";
import { resolveImageUrl } from "@/api/upload.js";

export default defineComponent({
  name: "TaskDetailModal",
  components: {
    StatusBadge,
    ImageViewer,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:visible", "rectify", "success"],
  setup(props, { emit }) {
    // #ifdef H5
    // H5 图片预览状态
    const imageViewerVisible = ref(false);
    const imageViewerUrls = ref([]);
    const imageViewerCurrent = ref(0);
    // #endif

    // 人工判定弹窗状态
    const showManualReviewModal = ref(false);
    const manualReviewForm = ref({
      approved: true,
      reason: "",
    });
    const manualReviewSubmitting = ref(false);

    // 当前用户ID
    const currentUserId = computed(() => {
      const userInfo = uni.getStorageSync("river_user_info");
      return userInfo?.userId || "";
    });

    // 是否为县级巡查员
    const isInspector = computed(() => {
      return userStore.getters.isInspector();
    });

    // 是否可以人工判定
    const canManualReview = computed(() => {
      // 条件：
      // 1. 当前角色为县级巡查员（river_inspector）
      // 2. manualReviewStatus === 'PENDING'
      // 3. manualReviewerId 等于当前用户ID
      return (
        isInspector.value &&
        props.data.manualReviewStatus === "PENDING" &&
        String(props.data.manualReviewerId) === String(currentUserId.value)
      );
    });

    // 人工判定状态文本
    const manualReviewStatusText = computed(() => {
      const statusMap = {
        PENDING: "待人工判定",
        APPROVED: "人工判定通过",
        REJECTED: "人工判定驳回",
      };
      let otherStatus = props.data.manualReviewStatus;
      if (props.data.manualRejectionCount && props.data.rectificationStatus == 'PENDING') {
        otherStatus = "REJECTED";
      } else if (props.data.manualRejectionCount && props.data.rectificationStatus == 'COMPLETED') {
        otherStatus = "APPROVED";
      }
      return statusMap[otherStatus] || "";
    });

    // 格式化人员显示：角色名称 + 用户名称
    const formatPerson = (name, roleNames) => {
      if (!name) return "-";
      if (roleNames) {
        return `${roleNames} ${name}`;
      }
      return name;
    };

    // 格式化日期时间
    const formatDateTime = (time) => {
      if (!time) return "-";
      // iOS日期格式兼容处理：将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy-MM-ddTHH:mm:ss"
      const dateStr = typeof time === "string" ? time.replace(" ", "T") : time;
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");
      const minute = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hour}:${minute}`;
    };

    // 预览图片
    const previewImage = (urls, index) => {
      // 把相对路径 name 转成完整 URL
      const fullUrls = (urls || []).map((u) => resolveImageUrl(u));
      // #ifdef H5
      // H5环境：使用自定义图片预览组件
      imageViewerUrls.value = fullUrls;
      imageViewerCurrent.value = index;
      imageViewerVisible.value = true;
      // #endif

      // #ifndef H5
      // 小程序环境：使用原生预览
      uni.previewImage({
        urls: fullUrls,
        current: index,
      });
      // #endif
    };

    // 整改
    const handleRectify = () => {
      emit("rectify", props.data);
    };

    // 打开人工判定弹窗
    const openManualReview = () => {
      manualReviewForm.value = {
        approved: true,
        reason: "",
      };
      showManualReviewModal.value = true;
    };

    // 关闭人工判定弹窗
    const closeManualReview = () => {
      showManualReviewModal.value = false;
    };

    // 提交人工判定
    const submitManualReview = async () => {
      if (!manualReviewForm.value.reason.trim()) {
        uni.showToast({ title: "请填写判定原因", icon: "none" });
        return;
      }

      if (manualReviewSubmitting.value) return;
      manualReviewSubmitting.value = true;

      try {
        const result = await api.task.manualReview({
          rectificationId: String(props.data.id),
          version: props.data.version,
          approved: manualReviewForm.value.approved,
          reason: manualReviewForm.value.reason,
        });

        uni.showToast({
          title: manualReviewForm.value.approved ? "判定通过" : "已驳回，继续整改",
          icon: "success",
        });

        showManualReviewModal.value = false;
        emit("success", result.data);
      } catch (error) {
        console.error("人工判定失败:", error);
        uni.showToast({ title: error.msg || "操作失败", icon: "none" });
      } finally {
        manualReviewSubmitting.value = false;
      }
    };

    // 关闭
    const handleClose = () => {
      emit("update:visible", false);
    };

    // 点击遮罩
    const handleOverlayClick = () => {
      // 不关闭
    };

    return {
      formatDateTime,
      formatPerson,
      previewImage,
      handleRectify,
      handleClose,
      handleOverlayClick,
      // 人工判定相关
      showManualReviewModal,
      manualReviewForm,
      manualReviewSubmitting,
      canManualReview,
      manualReviewStatusText,
      openManualReview,
      closeManualReview,
      submitManualReview,
      // #ifdef H5
      imageViewerVisible,
      imageViewerUrls,
      imageViewerCurrent,
      // #endif
    };
  },
});
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

.detail-section {
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.info-label {
  font-size: 28rpx;
  color: #64748b;
}

.info-value {
  font-size: 28rpx;
  color: #1e293b;
  text-align: right;
  flex: 1;
  margin-left: 24rpx;
}

.description-text {
  font-size: 28rpx;
  color: #374151;
  line-height: 1.6;
  display: block;
  margin-top: 8rpx;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.preview-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
}

.rectify-desc {
  margin-top: 20rpx;
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

  &.btn-default {
    background: #f1f5f9;
    color: #64748b;
  }

  &.btn-primary {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
  }

  &.btn-warning {
    background: linear-gradient(135deg, #d97706 0%, #fbbf24 100%);
    color: #ffffff;
  }

  &.btn-danger {
    background: linear-gradient(135deg, #dc2626 0%, #f87171 100%);
    color: #ffffff;
  }
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

// 人工判定弹窗样式
.review-modal {
  width: 85%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32rpx;
    border-bottom: 1rpx solid #e2e8f0;
  }

  .modal-body {
    padding: 32rpx;
  }

  .review-options {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-bottom: 24rpx;
  }

  .review-option {
    padding: 20rpx;
    border: 2rpx solid #e2e8f0;
    border-radius: 12rpx;
    cursor: pointer;
    transition: all 0.3s;

    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .option-title {
      display: block;
      font-size: 28rpx;
      font-weight: 500;
      color: #1e293b;
    }

    .option-desc {
      display: block;
      font-size: 24rpx;
      color: #64748b;
      margin-top: 8rpx;
    }
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

  .modal-footer {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx;
    border-top: 1rpx solid #e2e8f0;
  }
}

.placeholder {
  color: #94a3b8;
}
</style>
