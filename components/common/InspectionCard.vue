<template>
  <view class="inspection-card" @click="handleClick">
    <view class="card-main">
      <!-- 左侧信息 -->
      <view class="card-left">
        <!-- 标题和状态 -->
        <view class="card-header">
          <text class="township">{{ data.townshipName || "未知乡镇" }}</text>
          <StatusBadge :status="data.inspectionStatus" :is-overdue="data.overdue" />
          <!-- 待人工判定标签 -->
          <view v-if="data.manualReviewRequired" class="manual-review-tag">
            <text>待人工判定</text>
          </view>
        </view>

        <!-- 河段 -->
        <text class="river-section">{{ data.sectionName || "未知河段" }}</text>

        <!-- 底部信息 -->
        <view class="card-footer">
          <text class="problem-type">
            {{ data.problemTypeName || "-" }} - {{ data.problemSubtypeName || "-" }}
          </text>
          <text class="time">{{ formatTime(data.inspectionTime || data.createTime) }}</text>
        </view>
      </view>

      <!-- 右侧操作 -->
      <view class="card-right">
        <!-- 草稿状态 -->
        <template v-if="data.inspectionStatus === 'DRAFT'">
          <text class="action-btn edit" @click.stop.prevent="handleEdit">编辑</text>
          <text class="action-btn delete" @click.stop.prevent="handleDelete">删除</text>
        </template>
        <!-- 其他状态 -->
        <template v-else>
          <text class="action-btn view" @click.stop.prevent="handleView">查看</text>
        </template>
      </view>
    </view>
  </view>
</template>

<script>
import StatusBadge from "./StatusBadge.vue";

export default {
  name: "InspectionCard",
  components: {
    StatusBadge,
  },
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  methods: {
    formatTime(time) {
      if (!time) return "-";
      // iOS日期格式兼容处理：将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy-MM-ddTHH:mm:ss"
      const dateStr = typeof time === "string" ? time.replace(" ", "T") : time;
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },

    handleClick() {
      this.$emit("click", this.data);
    },

    handleEdit() {
      this.$emit("edit", this.data);
    },

    handleDelete() {
      this.$emit("delete", this.data);
    },

    handleView() {
      this.$emit("view", this.data);
    },
  },
};
</script>

<style lang="scss" scoped>
.inspection-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  &:active {
    background: #f8fafc;
    transform: scale(0.99);
  }
}

.card-main {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.card-left {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.township {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.river-section {
  font-size: 28rpx;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  margin-bottom: 16rpx;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.problem-type {
  font-size: 24rpx;
  color: #64748b;
}

.time {
  font-size: 24rpx;
  color: #94a3b8;
}

.manual-review-tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 12rpx;
  background: #fef3c7;
  border-radius: 8rpx;

  text {
    font-size: 22rpx;
    color: #d97706;
    white-space: nowrap;
  }
}

.card-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.action-btn {
  font-size: 28rpx;
  padding: 12rpx 24rpx;
  border-radius: 12rpx;

  &.edit {
    color: #3b82f6;
    background: #eff6ff;
  }

  &.delete {
    color: #ef4444;
    background: #fef2f2;
  }

  &.view {
    color: #3b82f6;
    background: #eff6ff;
  }

  &:active {
    opacity: 0.8;
  }
}
</style>
