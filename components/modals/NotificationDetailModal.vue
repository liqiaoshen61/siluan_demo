<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">消息详情</text>
        <view class="close-btn" @click="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 内容区域 -->
      <scroll-view class="modal-body" scroll-y>
        <!-- 消息类型图标 -->
        <!-- <view class="message-icon" :class="getIconClass(data.notificationType)">
          <text class="icon">{{ getIcon(data.notificationType) }}</text>
        </view> -->

        <!-- 消息标题 -->
        <view class="message-title">
          <text class="title-text">{{ data.title || "消息通知" }}</text>
        </view>

        <!-- 发送时间 -->
        <view class="message-time">
          <text class="time-text">{{ formatTime(data.sentAt) }}</text>
        </view>

        <!-- 消息内容 -->
        <view class="message-content">
          <text class="content-text">{{ data.content || "暂无内容" }}</text>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="modal-footer">
        <button class="btn btn-primary" @click="handleClose">关闭</button>
      </view>
    </view>
  </view>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "NotificationDetailModal",
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
  emits: ["update:visible"],
  setup(props, { emit }) {
    // 获取图标
    const getIcon = (type) => {
      const icons = {
        PLAN: "📅",
        TASK: "📋",
        OVERDUE: "⏰",
        REPORT: "📊",
      };
      return icons[type] || "🔔";
    };

    // 获取图标样式类
    const getIconClass = (type) => {
      const classes = {
        PLAN: "plan",
        TASK: "task",
        OVERDUE: "overdue",
        REPORT: "report",
      };
      return classes[type] || "default";
    };

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

    // 关闭
    const handleClose = () => {
      emit("update:visible", false);
    };

    // 点击遮罩
    const handleOverlayClick = () => {
      // 不关闭
    };

    return {
      getIcon,
      getIconClass,
      formatTime,
      handleClose,
      handleOverlayClick,
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
  max-height: 70vh;
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
  padding: 32rpx 24rpx;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.message-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;

  .icon {
    font-size: 56rpx;
  }

  &.plan {
    background: #fef3c7;
  }

  &.task {
    background: #dbeafe;
  }

  &.overdue {
    background: #fee2e2;
  }

  &.report {
    background: #d1fae5;
  }

  &.default {
    background: #f1f5f9;
  }
}

.message-title {
  margin-bottom: 16rpx;
  text-align: center;
}

.title-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #1e293b;
}

.message-time {
  padding: 8rpx 24rpx;
  box-sizing: border-box;
}

.time-text {
  font-size: 26rpx;
  color: #94a3b8;
}

.message-content {
  width: 100%;
  padding: 10rpx 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  box-sizing: border-box;
}

.content-text {
  font-size: 30rpx;
  color: #374151;
  line-height: 1.8;
  word-break: break-all;
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

  &.btn-primary {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    color: #ffffff;
  }
}
</style>
