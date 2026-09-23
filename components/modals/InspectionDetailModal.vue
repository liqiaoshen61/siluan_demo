<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">记录详情</text>
        <view class="close-btn" @click="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-body" scroll-y>
        <!-- 状态 -->
        <view class="detail-section">
          <StatusBadge :status="data.inspectionStatus" :is-overdue="data.overdue" />
          <!-- 人工判定状态 -->
          <view v-if="data.manualReviewStatus" class="manual-review-status">
            <text class="status-label">人工判定：</text>
            <text :class="['status-value', data.manualReviewStatus.toLowerCase()]">
              {{ manualReviewStatusText }}
            </text>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="detail-section">
          <view class="info-row">
            <text class="info-label">暗访时间</text>
            <text class="info-value">{{ formatTime(data.inspectionTime) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">上报人员</text>
            <text class="info-value">{{ formatPerson(data.reporterName, data.reporterRoleNames) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">所属乡镇</text>
            <text class="info-value">{{ data.townshipName || "-" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">所属河段</text>
            <text class="info-value">{{ data.sectionName || "-" }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">坐标位置</text>
            <text class="info-value">{{ formatCoordinate(data.longitude, data.latitude) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">问题类型</text>
            <text class="info-value">{{ data.problemTypeName }} - {{ data.problemSubtypeName }}</text>
          </view>
        </view>



        <!-- 问题描述 -->
        <view class="detail-section">
          <text class="section-title">问题描述</text>
          <text class="description-text">{{ data.description || "暂无描述" }}</text>
        </view>

        <!-- 背景图片 -->
        <view class="detail-section" v-if="data.backgroundImages?.length">
          <text class="section-title">背景图片</text>
          <view class="image-grid">
            <image v-for="(img, index) in data.backgroundImages" :key="'bg-' + index" :src="$img(img)" mode="aspectFill"
              class="preview-image" @click="previewImage(data.backgroundImages, index)" />
          </view>
        </view>

        <!-- 问题图片 -->
        <view class="detail-section" v-if="data.problemImages?.length">
          <text class="section-title">问题图片</text>
          <view class="image-grid">
            <image v-for="(img, index) in data.problemImages" :key="'problem-' + index" :src="$img(img)" mode="aspectFill"
              class="preview-image" @click="previewImage(data.problemImages, index)" />
          </view>
        </view>

        <!-- 整改信息（已完成或有整改记录时显示） -->
        <view class="detail-section" v-if="data.rectificationStatus === 'COMPLETED' || rectifyInfo?.id">
          <text class="section-title" v-if="data.hasRectificationInfo">整改信息</text>
          <!-- 处理人员信息 -->
          <view class="detail-section" v-if="data.handlerName">
            <view v-if="rectifyInfo.handlerName" class="info-row">
              <text class="info-label">整改人员</text>
              <text class="info-value">{{ formatPerson(rectifyInfo.handlerName, rectifyInfo.handlerRoleNames) }}</text>
            </view>
            <view v-if="data.rejecterName" class="info-row">
              <text class="info-label">驳回人员</text>
              <text class="info-value">{{ formatPerson(data.rejecterName, data.rejecterRoleNames) }}</text>
            </view>
            <view v-if="rectifyInfo.manualRejectionCount" class="info-row">
              <text class="info-label">驳回次数</text>
              <text class="info-value">{{ rectifyInfo.manualRejectionCount }}</text>
            </view>
            <view v-if="rectifyInfo.completedByName" class="info-row">
              <text class="info-label">完成人员</text>
              <text class="info-value">{{ formatPerson(rectifyInfo.completedByName, rectifyInfo.completedByRoleNames)
              }}</text>
            </view>
          </view>
          <!-- 整改图片 -->
          <view v-if="rectifyInfo.rectificationImages?.length" class="rectify-images">
            <view class="ai-result" :class="rectifyInfo.lastAiResult === 'COMPLETED' ? 'success' : 'fail'">
              <text class="ai-icon">{{ rectifyInfo.lastAiResult === 'COMPLETED' ? '✓' : '✗' }}</text>
              <text class="ai-text">
                {{ rectifyInfo.lastAiResult === 'COMPLETED' ? '经智能判断，已完成整改' : '经智能判断，未完成整改' +
                  rectifyInfo.lastAiConclusion
                }}
              </text>
            </view>
            <view class="image-grid">
              <image v-for="(img, index) in rectifyInfo.rectificationImages" :key="'rect-' + index" :src="$img(img)"
                mode="aspectFill" class="preview-image" @click="previewImage(rectifyInfo.rectificationImages, index)" />
            </view>
          </view>
          <!-- 整改说明 -->
          <view v-if="rectifyInfo.description" class="rectify-desc">
            <text class="section-title">整改说明</text>
            <view class="description-text">{{ rectifyInfo.description }}</view>
          </view>
          <!-- 人工判定请求原因 -->
          <view v-if="rectifyInfo.forceReason" class="rectify-desc">
            <text class="section-title">申请判定原因</text>
            <view class="description-text">{{ rectifyInfo.forceReason }}</view>
          </view>
          <!-- 人工判定结果 -->
          <view
            v-if="rectifyInfo.manualReviewStatus && rectifyInfo.manualReviewStatus !== 'PENDING' && rectifyInfo.rectificationStatus !== 'COMPLETED'"
            class="rectify-desc">
            <text class="section-title">人工判定结果</text>
            <view class="description-text" :class="rectifyInfo.manualReviewStatus === 'APPROVED' ? 'success' : 'fail'">
              {{ rectifyInfo.manualReviewStatus == 'APPROVED' ? '通过' : '不通过' }}</view>
          </view>
          <!-- 人工判定结果 -->
          <view v-if="rectifyInfo.manualReviewReason && rectifyInfo.manualReviewStatus !== 'PENDING'"
            class="rectify-desc">
            <text class="section-title">人工判定说明</text>
            <view class="description-text">{{ rectifyInfo.manualReviewReason }}</view>
          </view>

        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <!-- 草稿状态 -->
        <template v-if="data.inspectionStatus === 'DRAFT'">
          <button class="btn btn-default" @click="handleEdit">编辑</button>
          <button class="btn btn-danger" @click="handleDelete">删除</button>
        </template>
        <!-- 整改中状态，可人工判定 -->
        <template v-else-if="canManualReview">
          <button class="btn btn-default" @click="handleClose">关闭</button>
          <button class="btn btn-warning" @click="openManualReview">人工判定</button>
        </template>
        <!-- 整改中状态，可撤回 -->
        <template v-else-if="canWithdraw">
          <button class="btn btn-default" @click="handleClose">关闭</button>
          <button class="btn btn-warning" @click="openWithdrawModal">撤回</button>
        </template>
        <!-- 其他状态 -->
        <template v-else>
          <button class="btn btn-primary" @click="handleClose">关闭</button>
        </template>
      </view>
    </view>

    <!-- H5 自定义图片预览组件 -->
    <!-- #ifdef H5 -->
    <ImageViewer :visible="imageViewerVisible" :urls="imageViewerUrls" :current="imageViewerCurrent"
      @update:visible="imageViewerVisible = $event" />
    <!-- #endif -->

    <!-- 撤回弹窗 -->
    <view v-if="showWithdrawModal" class="modal-overlay" @click="closeWithdrawModal">
      <view class="withdraw-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">撤回派件</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label"><text class="required">*</text>撤回原因</text>
            <textarea class="form-textarea" v-model="withdrawForm.remark" placeholder="请输入撤回原因"
              placeholder-class="placeholder" :maxlength="500" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn btn-default" @click="closeWithdrawModal">取消</button>
          <button class="btn btn-danger" :disabled="withdrawSubmitting" @click="submitWithdraw">
            {{ withdrawSubmitting ? "撤回中..." : "确认撤回" }}
          </button>
        </view>
      </view>
    </view>

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
import { defineComponent, computed, ref } from "vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import ImageViewer from "@/components/common/ImageViewer.vue";
import userStore from "@/store/user.js";
import api from "@/api/index.js";
import { resolveImageUrl } from "@/api/upload.js";

export default defineComponent({
  name: "InspectionDetailModal",
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
    // 整改信息（从外部传入，或自行获取）
    rectifyInfo: {
      type: Object,
      default: null,
    },
  },
  emits: ["update:visible", "edit", "delete", "success"],
  setup(props, { emit }) {
    // #ifdef H5
    // H5 图片预览状态
    const imageViewerVisible = ref(false);
    const imageViewerUrls = ref([]);
    const imageViewerCurrent = ref(0);
    // #endif

    // 撤回弹窗状态
    const showWithdrawModal = ref(false);
    const withdrawForm = ref({
      remark: "",
    });
    const withdrawSubmitting = ref(false);

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

    // 格式化人员显示：角色名称 + 用户名称
    const formatPerson = (name, roleNames) => {
      if (!name) return "-";
      if (roleNames) {
        return `${roleNames} ${name}`;
      }
      return name;
    };

    // 是否可以撤回
    const canWithdraw = computed(() => {
      // 条件：
      // 1. 当前角色包含 river_inspector
      // 2. 当前用户是该事件的 reporterId
      // 3. 当前状态为整改中（RECTIFYING）
      // 4. 乡镇尚未提交有效整改结果（无整改图片）
      // 5. 且当前用户县级巡查员
      const isReporter = String(props.data.reporterId) === String(currentUserId.value);
      const isRectifying = props.data.inspectionStatus === "RECTIFYING";
      const noRectification = !props.rectifyInfo?.rectificationImages?.length;
      const isCountyInspector = userStore.getters.canWidrawInspection();

      return isInspector.value && isReporter && isRectifying && noRectification && isCountyInspector;
    });
    const inDistrictInspector = computed(() => {
      return userStore.getters.isDistrictInspector();
    })
    // 是否可以人工判定
    const canManualReview = computed(() => {
      // 条件：
      // 1. 当前角色为县级巡查员（river_inspector）
      // 2. manualReviewStatus === 'PENDING'
      return (
        inDistrictInspector.value &&
        props.data.rectification.manualReviewStatus === "PENDING"
      );
    });

    // 人工判定状态文本
    const manualReviewStatusText = computed(() => {
      const statusMap = {
        PENDING: "待人工判定",
        APPROVED: "人工判定通过",
        REJECTED: "人工判定驳回",
      };
      return statusMap[props.data.rectification.manualReviewStatus] || "";
    });

    // 格式化时间
    const formatTime = (time) => {
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

    // 格式化坐标
    const formatCoordinate = (lon, lat) => {
      if (!lon || !lat) return "-";
      return `${(lon - 0).toFixed(6)}, ${(lat - 0).toFixed(6)}`;
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

    // 编辑
    const handleEdit = () => {
      emit("edit", props.data);
      handleClose();
    };

    // 删除
    const handleDelete = () => {
      uni.showModal({
        title: "确认删除",
        content: "确定要删除这条草稿记录吗？",
        success: (res) => {
          if (res.confirm) {
            emit("delete", props.data);
            handleClose();
          }
        },
      });
    };

    // 打开撤回弹窗
    const openWithdrawModal = () => {
      withdrawForm.value = {
        remark: "",
      };
      showWithdrawModal.value = true;
    };

    // 关闭撤回弹窗
    const closeWithdrawModal = () => {
      showWithdrawModal.value = false;
    };

    // 提交撤回
    const submitWithdraw = async () => {
      if (!withdrawForm.value.remark.trim()) {
        uni.showToast({ title: "请输入撤回原因", icon: "none" });
        return;
      }

      if (withdrawSubmitting.value) return;
      withdrawSubmitting.value = true;

      try {
        await api.inspection.withdrawInspection({
          inspectionId: String(props.data.id),
          version: props.data.version,
          remark: withdrawForm.value.remark,
        });

        uni.showToast({ title: "撤回成功", icon: "success" });
        showWithdrawModal.value = false;
        emit("success");
        handleClose();
      } catch (error) {
        console.error("撤回失败:", error);
        uni.showToast({ title: error.msg || "撤回失败", icon: "none" });
      } finally {
        withdrawSubmitting.value = false;
      }
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
          rectificationId: String(props.rectifyInfo.id),
          version: props.rectifyInfo.version,
          approved: manualReviewForm.value.approved,
          reason: manualReviewForm.value.reason,
        });

        uni.showToast({
          title: manualReviewForm.value.approved ? "判定通过" : "已驳回，继续整改",
          icon: "success",
        });

        showManualReviewModal.value = false;
        emit("success");
        handleClose();
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
      // 不允许点击遮罩关闭
    };

    return {
      formatTime,
      formatCoordinate,
      formatPerson,
      previewImage,
      handleEdit,
      handleDelete,
      handleClose,
      handleOverlayClick,
      // 撤回相关
      canWithdraw,
      showWithdrawModal,
      withdrawForm,
      withdrawSubmitting,
      openWithdrawModal,
      closeWithdrawModal,
      submitWithdraw,
      // 人工判定相关
      canManualReview,
      manualReviewStatusText,
      showManualReviewModal,
      manualReviewForm,
      manualReviewSubmitting,
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
  color: #404041;
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
  text-indent: 2em;
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

/* 整改信息样式 */
.rectify-images {
  margin-bottom: 16rpx;
}

.ai-result {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;

}

.success {
  background: #d1fae5;

  .ai-icon,
  .ai-text {
    color: #059669;
  }
}

.fail {
  background: #fee2e2;

  .ai-icon,
  .ai-text {
    color: #dc2626;
  }
}

.ai-icon {
  font-size: 32rpx;
  font-weight: bold;
}

.ai-text {
  font-size: 26rpx;
}

.rectify-desc {
  margin-top: 16rpx;
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

  &.btn-danger {
    background: #fef2f2;
    color: #dc2626;
  }

  &.btn-warning {
    background: #fef3c7;
    color: #d97706;
  }

  &.btn-primary {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
  }
}

// 撤回弹窗样式
.withdraw-modal {
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
</style>
