<template>
  <view class="page-container">
    <!-- 顶部导航 -->
    <TopNav @smartInputSuccess="handleSmartInputSuccess" @formSuccess="handleFormSuccess" />

    <!-- 搜索栏 -->
    <SearchBar :currentStatus="searchStatus" :currentKeyword="searchKeyword"
      @update:currentStatus="searchStatus = $event" @update:currentKeyword="searchKeyword = $event"
      @search="handleSearch" />

    <!-- 列表内容 -->
    <scroll-view class="list-container" scroll-y @scrolltolower="loadMore">
      <!-- 数据列表 -->
      <view v-if="list.length > 0" class="list-content">
        <InspectionCard v-for="item in list" :key="item.id" :data="item" @click="handleViewDetail" @edit="handleEdit"
          @delete="handleDelete" @view="handleViewDetail" />
      </view>

      <!-- 空状态 -->
      <EmptyState v-else-if="!loading" icon="📋" text="暂无暗访记录" :show-button="canCreateInspection" button-text="新增暗访"
        @action="openAddModal" />

      <!-- 加载更多 -->
      <view v-if="hasMore && list.length > 0" class="load-more">
        <text v-if="loading" class="loading-text">加载中...</text>
        <text v-else class="load-more-text">上拉加载更多</text>
      </view>
    </scroll-view>

    <!-- 自定义TabBar -->
    <CustomTabBar current-tab="inspection" @change="handleTabChange" />

    <!-- 新增/编辑弹窗 -->
    <InspectionFormModal :visible="showFormModal" :edit-data="editData" @update:visible="showFormModal = $event"
      @success="handleFormSuccess" />

    <!-- 详情弹窗 -->
    <InspectionDetailModal :visible="showDetailModal" :rectifyInfo="rectifyInfo" :data="detailData"
      @update:visible="showDetailModal = $event" @edit="handleEdit" @delete="handleDelete"
      @success="handleFormSuccess" />
  </view>
</template>

<script>
import TopNav from "@/components/common/TopNav.vue";
import CustomTabBar from "@/components/common/CustomTabBar.vue";
import SearchBar from "@/components/common/SearchBar.vue";
import InspectionCard from "@/components/common/InspectionCard.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import InspectionFormModal from "@/components/modals/InspectionFormModal.vue";
import InspectionDetailModal from "@/components/modals/InspectionDetailModal.vue";
import api from "@/api/index.js";
import userStore from "@/store/user.js";

export default {
  components: {
    TopNav,
    CustomTabBar,
    SearchBar,
    InspectionCard,
    EmptyState,
    InspectionFormModal,
    InspectionDetailModal,
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
      showFormModal: false,
      showDetailModal: false,
      editData: null,
      detailData: {},
      rectifyInfo: {},
      // 整改信息
      isDetailLoading: false, // 详情加载状态
    };
  },
  computed: {
    canCreateInspection() {
      return userStore.getters.canCreateInspection();
    },
  },
  onLoad() {
    // 加载基础选项
    userStore.actions.loadOptions();
  },
  onShow() {
    // 刷新列表
    this.loadList(true);
    // 更新红点
    userStore.actions.updateBadges();
  },
  methods: {
    // 加载列表
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

        const result = await api.inspection.getInspectionPage(params);

        const records = result.records || [];

        // // 关键词过滤（前端过滤）
        let filteredRecords = records;
        // if (this.searchKeyword) {
        //   const keyword = this.searchKeyword.toLowerCase();
        //   filteredRecords = records.filter(
        //     (item) =>
        //       item.townshipName?.toLowerCase().includes(keyword) ||
        //       item.sectionName?.toLowerCase().includes(keyword) ||
        //       item.description?.toLowerCase().includes(keyword)
        //   );
        // }

        if (isRefresh) {
          this.list = filteredRecords;
        } else {
          this.list = [...this.list, ...filteredRecords];
        }

        this.hasMore = records.length >= this.pageSize;
      } catch (error) {
        console.error("加载列表失败:", error);
      } finally {
        this.loading = false;
      }
    },

    // 加载更多
    loadMore() {
      if (!this.hasMore || this.loading) return;
      this.currentPage++;
      this.loadList();
    },

    // 搜索
    handleSearch() {
      this.loadList(true);
    },

    // 查看详情
    async handleViewDetail(item) {
      // 防止重复请求
      if (this.isDetailLoading) {
        console.log("正在加载详情，跳过重复请求");
        return;
      }

      // 如果详情弹窗已打开，不重复打开
      if (this.showDetailModal) {
        console.log("详情弹窗已打开，跳过");
        return;
      }

      this.isDetailLoading = true;
      this.rectifyInfo = {};

      try {

        console.log("请求详情:", item.id);
        const result = await api.inspection.getInspectionDetail(item.id);
        console.log("详情结果:", result);
        this.detailData = result.data || item;
        this.showDetailModal = true;
        if (item.rectificationStatus === 'COMPLETED' || this.detailData.rectification?.id) {
          // 获取整改信息
          this.rectifyInfo = this.detailData.rectification || {};
          console.log("整改信息:", this.rectifyInfo);
        }
      } catch (error) {
        console.error("获取详情失败:", error);
      } finally {
        // 延迟重置状态，防止快速点击
        setTimeout(() => {
          this.isDetailLoading = false;
        }, 500);
      }
    },
    // 打开新增弹窗
    openAddModal() {
      this.editData = null;
      this.showFormModal = true;
    },
    // 编辑
    handleEdit(item) {
      this.openEditModal(item);
    },

    // 删除
    async handleDelete(item) {
      try {
        await api.inspection.deleteDraft({
          inspectionId: item.id,
          version: item.version,
        });

        uni.showToast({
          title: "删除成功",
          icon: "success",
        });

        // 刷新列表
        this.loadList(true);
        // 更新红点
        userStore.actions.updateDraftBadge();
      } catch (error) {
        console.error("删除失败:", error);
      }
    },

    // 打开编辑弹窗
    openEditModal(item) {
      this.editData = item;
      this.showFormModal = true;
    },

    // 表单提交成功（新增/编辑）
    handleFormSuccess() {
      this.showFormModal = false;
      this.loadList(true);
      userStore.actions.updateDraftBadge();
      userStore.actions.updatePendingBadge();
    },

    // 智能录入成功
    handleSmartInputSuccess(data) {
      // 打开新增弹窗并预填数据
      this.editData = data;
      this.showFormModal = true;
    },

    // Tab切换
    handleTabChange(tab) {
      // Tab切换由CustomTabBar内部处理
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
  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）padding */
  padding-bottom: 168rpx;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无padding */
  padding-bottom: 128rpx;
  /* #endif */
  box-sizing: border-box;
}

.list-container {
  flex: auto;
  overflow-y: auto;
  padding: 0rpx 20rpx 20rpx 20rpx;
  box-sizing: border-box;
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
