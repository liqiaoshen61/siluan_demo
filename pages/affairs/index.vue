<template>
  <view class="page-container">
    <!-- 顶部导航 -->
    <TopNav @formSuccess="handleFormSuccess" />

    <!-- 搜索栏 -->
    <SearchBar :currentStatus="searchStatus" :currentKeyword="searchKeyword" :status-options="statusOptions"
      @update:currentStatus="searchStatus = $event" @update:currentKeyword="searchKeyword = $event"
      @search="handleSearch" />

    <!-- 列表内容 -->
    <scroll-view class="list-container" scroll-y @scrolltolower="loadMore">
      <!-- 数据列表 -->
      <view v-if="list.length > 0" class="list-content">
        <view v-for="item in list" :key="item.id" class="task-card" @click="handleViewDetail(item)">
          <view class="card-main">
            <view class="card-left">
              <view class="card-header">
                <text class="township">{{ item.townshipName || "-" }}</text>
                <StatusBadge :status="item.rectificationStatus" :is-overdue="item.overdue" />
              </view>
              <text class="location">{{ item.problemLocation || "-" }}</text>
              <view class="card-footer">
                <text class="deadline">{{ item.problemTypeName }}-{{ item.problemSubtypeName }}</text>
                <text class="deadline">{{ formatDate(item.inspectionTime) }}</text>
              </view>
            </view>
            <view class="card-right">
              <text class="action-btn" @click.stop="handleRectify(item)">整改</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <EmptyState v-else-if="!loading" icon="⏰" text="暂无事务" />

      <!-- 加载更多 -->
      <view v-if="hasMore && list.length > 0" class="load-more">
        <text v-if="loading" class="loading-text">加载中...</text>
        <text v-else class="load-more-text">上拉加载更多</text>
      </view>
    </scroll-view>

    <!-- 自定义TabBar -->
    <CustomTabBar current-tab="affairs" />

    <!-- 整改弹窗 -->
    <RectifyModal :visible="showRectifyModal" :task="currentTask" @update:visible="showRectifyModal = $event"
      @success="handleRectifySuccess" />

    <!-- 详情弹窗 -->
    <TaskDetailModal :visible="showDetailModal" :data="detailData" @update:visible="showDetailModal = $event"
      @rectify="handleRectify" />
  </view>
</template>

<script>
import TopNav from "@/components/common/TopNav.vue";
import CustomTabBar from "@/components/common/CustomTabBar.vue";
import SearchBar from "@/components/common/SearchBar.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import RectifyModal from "@/components/modals/RectifyModal.vue";
import TaskDetailModal from "@/components/modals/TaskDetailModal.vue";
import api from "@/api/index.js";
import userStore from "@/store/user.js";

export default {
  components: {
    TopNav,
    CustomTabBar,
    SearchBar,
    StatusBadge,
    EmptyState,
    RectifyModal,
    TaskDetailModal,
  },
  data() {
    return {
      list: [],
      loading: false,
      hasMore: true,
      currentPage: 1,
      pageSize: 10,
      searchStatus: "",
      searchKeyword: "",
      statusOptions: [
        { value: "", label: "全部状态" },
        { value: "PENDING", label: "待处理" },
        { value: "COMPLETED", label: "已完成" },
      ],
      showRectifyModal: false,
      showDetailModal: false,
      currentTask: {},
      detailData: {},
    };
  },
  onLoad() {
    // userStore.actions.loadOptions();
    // 监听整改成功事件
    uni.$on('rectifySuccess', () => {
      this.loadList(true);
    });
  },
  onUnload() {
    // 移除监听
    uni.$off('rectifySuccess');
  },
  onShow() {
    this.loadList(true);
    userStore.actions.updateBadges();
  },
  methods: {
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
          status: this.searchStatus || undefined,
          keyword: this.searchKeyword || undefined,
        };

        const result = await api.task.getTaskPage(params);
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

    loadMore() {
      if (!this.hasMore || this.loading) return;
      this.currentPage++;
      this.loadList();
    },

    handleSearch() {
      this.loadList(true);
    },

    formatDate(date) {
      if (!date) return "-";
      const d = new Date(date);
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    },

    async handleViewDetail(item) {
      try {
        const result = await api.task.getTaskDetail(item.id);
        this.detailData = result.data || item;
        this.showDetailModal = true;
      } catch (error) {
        console.error("获取详情失败:", error);
      }
    },

    handleRectify(item) {
      this.currentTask = item;
      this.showRectifyModal = true;
      this.showDetailModal = false;
    },

    handleRectifySuccess() {
      this.showRectifyModal = false;
      this.loadList(true);
      userStore.actions.updatePendingBadge();
    },

    // 新增暗访成功（刷新红点）
    handleFormSuccess() {
      userStore.actions.updateBadges();
    },
  },
};
</script>

<style lang="scss" scoped>
.page-container {
  height: calc(100vh);
  background: #f1f5f9;
  display: flex;
  flex-direction: column;

  box-sizing: border-box;
  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）padding */
  padding-bottom: 168rpx;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无padding */
  padding-bottom: 128rpx;
  /* #endif */
}

.list-container {
  flex: auto;
  overflow-y: auto;
  padding: 0rpx 20rpx 20rpx 20rpx;
  box-sizing: border-box;
}

.task-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  &:active {
    background: #f8fafc;
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
}

.location {
  font-size: 28rpx;
  color: #64748b;
  margin-bottom: 16rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.deadline {
  font-size: 24rpx;
  color: #94a3b8;
}

.card-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.action-btn {
  font-size: 28rpx;
  padding: 12rpx 20rpx;
  border-radius: 12rpx;
  color: #12478d;
  background: #dcf4fc;
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
