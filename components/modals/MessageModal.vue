<template>
  <view class="modal-overlay" v-if="visible">
    <view class="modal-container">
      <!-- 头部 -->
      <view class="modal-header">
        <text class="modal-title">消息通知</text>
        <view class="header-actions">
          <text class="del-btn" @click="deleteAllRead">全部清空</text>
          <text class="action-btn" @click="markAllRead">全部已读</text>
          <text class="close-btn" @click="handleClose">✕</text>
        </view>
      </view>

      <!-- 分类筛选 -->
      <scroll-view class="filter-bar">
        <view class="filter-list">
          <view v-for="filter in filterOptions" :key="filter.value" class="filter-item"
            :class="{ active: currentFilter === filter.value }" @click="changeFilter(filter.value)">
            <text class="filter-text">{{ filter.label }}</text>
            <text v-if="filter.count > 0" class="filter-count">{{ filter.count }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 列表内容 -->
      <scroll-view class="list-container" scroll-y @scrolltolower="loadMore">
        <!-- 数据列表 -->
        <view v-if="list.length > 0" class="list-content">
          <view v-for="item in list" :key="item.id" class="notification-card" :class="{ unread: item.unread }"
            @click="handleItemClick(item)">
            <view class="card-icon" :class="getIconClass(item.notificationType)">
              <text class="icon">{{ getIcon(item.notificationType) }}</text>
            </view>
            <view class="card-content">
              <view class="card-header">
                <text class="card-title">{{ item.title }}</text>
                <text class="card-time">{{ formatTime(item.sentAt) }}</text>
              </view>
              <text class="card-text">{{ item.content }}</text>
              <view class="card-actions">
                <text v-if="item.unread" class="action-read" @click.stop="markItemRead(item)">标记已读</text>
                <text v-if="item.businessId" class="action-link" @click.stop="handleItemClick(item)">查看详情</text>
                <text class="action-delete" @click.stop="deleteItem(item)">删除</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <EmptyState v-else-if="!loading" icon="🔔" text="暂无消息" />

        <!-- 加载更多 -->
        <view v-if="hasMore && list.length > 0" class="load-more">
          <text v-if="loading" class="loading-text">加载中...</text>
          <text v-else class="load-more-text">上拉加载更多</text>
        </view>
      </scroll-view>
    </view>

    <!-- 整改弹窗 -->
    <RectifyModal :visible="showRectifyModal" :task="currentTask" @update:visible="showRectifyModal = $event"
      @success="handleRectifySuccess" />

    <!-- 任务详情弹窗 -->
    <TaskDetailModal :visible="showTaskDetail" :data="taskDetailData" @update:visible="showTaskDetail = $event"
      @rectify="handleRectify" />

    <!-- 消息详情弹窗 -->
    <NotificationDetailModal :visible="showNotificationDetail" :data="notificationDetailData"
      @update:visible="showNotificationDetail = $event" />
  </view>
</template>

<script>
import EmptyState from "@/components/common/EmptyState.vue";
import InspectionDetailModal from "@/components/modals/InspectionDetailModal.vue";
import TaskDetailModal from "@/components/modals/TaskDetailModal.vue";
import RectifyModal from "@/components/modals/RectifyModal.vue";
import NotificationDetailModal from "@/components/modals/NotificationDetailModal.vue";
import api from "@/api/index.js";
import userStore from "@/store/user.js";

export default {
  components: {
    EmptyState,
    InspectionDetailModal,
    TaskDetailModal,
    RectifyModal,
    NotificationDetailModal,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:visible"],
  data() {
    return {
      list: [],
      loading: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 10,
      currentFilter: "",
      filterCounts: {
        all: 0,
        dispatch: 0,
        team: 0,
        teamRemind: 0,
        overdue: 0,
      },
      showRectifyModal: false,
      currentTask: {},
      showTaskDetail: false,
      taskDetailData: {},
      showNotificationDetail: false,
      notificationDetailData: {},
      loadingDetail: false,
      hasReadAll: false,
    };
  },
  computed: {
    isTownReceiver() {
      return userStore.getters.isTownReceiver;
    },
    filterOptions() {
      let townTag = []
      if (this.isTownReceiver) {
        townTag = [
          { value: "daily", label: "日常通知", count: this.filterCounts.daily },
          { value: "problem", label: "问题通知", count: this.filterCounts.problem },
          { value: "monthly-warning", label: "月度预警", count: this.filterCounts.monthlyWarning },
        ]
      }
      return [
        { value: "", label: "全部", count: this.filterCounts.total },
        { value: "dispatch", label: "派件通知", count: this.filterCounts.dispatch },
        { value: "team", label: "暗访安排", count: this.filterCounts.team },
        { value: "team-remind", label: "提醒暗访", count: this.filterCounts.teamRemind },
        { value: "overdue", label: "超时提醒", count: this.filterCounts.overdue },
        ...townTag
      ];
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadList(true);
        this.loadFilterCounts();
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
    },

    async loadList(isRefresh = false) {
      if (this.loading) return;

      if (isRefresh) {
        this.currentPage = 1;
        this.list = [];
        this.hasMore = true;
      }

      this.loading = true;

      try {
        const params = {
          current: this.currentPage,
          size: this.pageSize,
          notificationType: this.currentFilter || undefined,
          // unreadOnly: this.hasReadAll
        };

        const result = await api.notification.getNotificationPage(params);
        const records = result.records || [];

        if (isRefresh) {
          this.list = records;
        } else {
          this.list = [...this.list, ...records];
        }

        this.hasMore = records.length >= this.pageSize;
      } catch (error) {
        console.error("加载列表失败:", error);
      } finally {
        this.loading = false;
      }
    },
    async loadFilterCounts() {
      const result = await api.notification.getNotificationCount();
      this.filterCounts = result || {};
      console.log(this.filterCounts);
    },

    loadMore() {
      if (!this.hasMore || this.loading) return;
      this.currentPage++;
      this.loadList();
    },

    changeFilter(filter) {
      this.currentFilter = filter;
      this.loadList(true);
    },

    getIcon(type) {
      const icons = {
        PLAN: "📅",
        TASK: "📋",
        OVERDUE: "⏰",
        REPORT: "📊",
      };
      return icons[type] || "🔔";
    },

    getIconClass(type) {
      const classes = {
        PLAN: "plan",
        TASK: "task",
        OVERDUE: "overdue",
        REPORT: "report",
      };
      return classes[type] || "default";
    },

    formatTime(time) {
      if (!time) return "";
      // iOS日期格式兼容处理：将 "yyyy-MM-dd HH:mm:ss" 转换为 "yyyy-MM-ddTHH:mm:ss"
      const dateStr = typeof time === "string" ? time.replace(" ", "T") : time;
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now - date;
      const day = 24 * 60 * 60 * 1000;

      if (diff < day) {
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        return `${hour}:${minute}`;
      } else if (diff < 2 * day) {
        return "昨天";
      }
      // else if (diff < 7 * day) {
      //   const days = ["日", "一", "二", "三", "四", "五", "六"];
      //   return `周${days[date.getDay()]}`;
      // }
      else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
      }
    },

    async handleItemClick(item) {
      // 标记已读
      if (item.unread) {
        try {
          await api.notification.markAsRead(item.id);
          item.unread = false;
          userStore.actions.updateNotificationBadge();
          this.loadFilterCounts();
        } catch (error) {
          console.error("标记已读失败:", error);
        }
      }

      // 根据 businessType 决定打开哪个弹窗
      if (item.businessType === "RECTIFICATION") {
        // 整改通知 → 调用接口获取任务详情
        await this.openTaskDetail(item.businessId);
      } else {
        // 其他类型 → 显示消息详情（使用列表数据）
        this.notificationDetailData = item;
        this.showNotificationDetail = true;
      }
    },

    // 标记单条已读
    async markItemRead(item) {
      if (!item.unread) return;

      try {
        await api.notification.markAsRead(item.id);
        item.unread = false;
        userStore.actions.updateNotificationBadge();
        this.loadFilterCounts();
        uni.showToast({ title: "已标记已读", icon: "success" });
      } catch (error) {
        console.error("标记已读失败:", error);
      }
    },


    // 打开暗访详情弹窗（调用接口）
    async openTaskDetail(inspectionId) {
      this.loadingDetail = true;

      try {
        const result = await api.task.getTaskDetail(inspectionId);
        this.taskDetailData = result.data || {};
        this.showTaskDetail = true;
      } catch (error) {
        console.error("获取任务详情失败:", error);
        uni.showToast({ title: "获取任务详情失败", icon: "none" });
      } finally {
        this.loadingDetail = false;
      }
    },
    handleRectify(item) {
      this.currentTask = item;
      this.showRectifyModal = true;
      this.showTaskDetail = false;
    },
    handleRectifySuccess() {
      this.showRectifyModal = false;
      this.loadList(true);  // 刷新消息列表
      userStore.actions.updatePendingBadge();  // 更新待处理红点
      uni.$emit('rectifySuccess');  // 通知其他页面
    },
    deleteItem(item) {
      uni.showModal({
        title: "确认删除",
        content: "确定要删除这条消息吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await api.notification.deleteNotification(item.id);
              this.list = this.list.filter((i) => i.id !== item.id);
              userStore.actions.updateNotificationBadge();
              uni.showToast({
                title: "删除成功",
                icon: "success",
              });
            } catch (error) {
              console.error("删除失败:", error);
            }
          }
        },
      });
    },
    async deleteAllRead() {
      try {
        let params = {
          data: this.list.filter((item) => !item.unread).length
        }
        await api.notification.deleteAllAsRead(params);
        this.loadList(true);
        uni.showToast({
          title: "已删除已读",
          icon: "success",
        });
      } catch (error) {
        console.error("删除已读失败:", error);
      }
    },
    async markAllRead() {
      try {
        await api.notification.markAllAsRead(this.currentFilter || undefined);
        this.loadList(true);
        userStore.actions.updateNotificationBadge();
        uni.showToast({
          title: "已全部标记已读",
          icon: "success",
        });
      } catch (error) {
        console.error("标记已读失败:", error);
      }
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
}

.modal-container {
  width: 100%;
  max-height: 85vh;
  background: #f1f5f9;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 24rpx 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.action-btn {
  font-size: 28rpx;
  color: #3b82f6;
}

.del-btn {
  font-size: 28rpx;
  color: #a36d2e;
}

.close-btn {
  font-size: 32rpx;
  color: #94a3b8;
  padding: 8rpx;
}

.filter-bar {
  background: #ffffff;
  padding: 16rpx 20rpx;
  box-sizing: border-box;
  border-bottom: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.filter-list {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  background: #f1f5f9;
  font-size: 26rpx;
  color: #64748b;

  &.active {
    background: #1e40af;
    color: #ffffff;

    .filter-count {
      background: #ffffff;
      color: #1e40af;
    }
  }
}

.filter-text {
  font-size: 26rpx;
}

.filter-count {
  min-width: 36rpx;
  height: 36rpx;
  background: #e2e8f0;
  border-radius: 18rpx;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.list-container {
  flex: auto;
  overflow-y: auto;
  padding: 20rpx 20rpx 20rpx 20rpx;
  box-sizing: border-box;
  max-height: 60vh;
}

.notification-card {
  display: flex;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);

  &.unread {
    border-left: 6rpx solid #3b82f6;
  }
}

.card-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .icon {
    font-size: 36rpx;
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

.card-content {
  flex: 1;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #1e293b;
  flex: 1;
}

.card-time {
  font-size: 24rpx;
  color: #94a3b8;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.card-text {
  font-size: 26rpx;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
  margin-top: 16rpx;
}

.action-link {
  font-size: 26rpx;
  color: #3b82f6;
}

.action-read {
  font-size: 26rpx;
  color: #10b981;
}

.action-delete {
  font-size: 26rpx;
  color: #94a3b8;
}

.load-more {
  text-align: center;
  padding: 20rpx;
}

.loading-text,
.load-more-text {
  font-size: 28rpx;
  color: #94a3b8;
}
</style>
