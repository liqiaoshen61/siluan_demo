<template>
  <view class="search-bar">
    <view class="search-content">
      <!-- 状态筛选 -->
      <picker v-if="showStatusFilter" :range="statusOptions" range-key="label" :value="statusIndex"
        @change="handleStatusChange">
        <view class="filter-item">
          <text class="filter-text">{{ currentStatusLabel }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>

      <!-- 关键词搜索 -->
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input class="search-input" type="text" :value="currentKeyword" placeholder="搜索乡镇/河段"
          placeholder-class="placeholder" @input="handleKeywordInput" @confirm="handleSearch" />
        <text v-if="currentKeyword" class="clear-btn" @click="clearKeyword">✕</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "SearchBar",
  props: {
    showStatusFilter: {
      type: Boolean,
      default: true,
    },
    statusOptions: {
      type: Array,
      default: () => [
        { value: "", label: "全部状态" },
        { value: "DRAFT", label: "草稿" },
        { value: "RECTIFYING", label: "整改中" },
        { value: "COMPLETED", label: "已完成" },
        { value: "WITHDRAWN", label: "已撤回" },
      ],
    },
    currentStatus: {
      type: String,
      default: "",
    },
    currentKeyword: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      statusIndex: 0,
    };
  },
  computed: {
    currentStatusLabel() {
      return this.statusOptions[this.statusIndex]?.label || "全部状态";
    },
  },
  watch: {
    currentStatus: {
      handler(val) {
        const index = this.statusOptions.findIndex((item) => item.value === val);
        this.statusIndex = index >= 0 ? index : 0;
      },
      immediate: true,
    },
  },
  methods: {
    handleStatusChange(e) {
      const index = e.detail.value;
      this.statusIndex = index;
      const status = this.statusOptions[index]?.value || "";
      this.$emit("update:currentStatus", status);
      this.$emit("search", { status, keyword: this.currentKeyword });
    },

    handleKeywordInput(e) {
      this.$emit("update:currentKeyword", e.detail.value);
    },

    handleSearch() {
      this.$emit("search", {
        status: this.statusOptions[this.statusIndex]?.value || "",
        keyword: this.currentKeyword,
      });
    },

    clearKeyword() {
      this.$emit("update:currentKeyword", "");
      this.$emit("search", {
        status: this.statusOptions[this.statusIndex]?.value || "",
        keyword: "",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.search-bar {
  background: #f1f5f9;
  padding: 24rpx 20rpx 16rpx;
  position: sticky;
  top: 0;
  z-index: 50;
}

.search-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding-right: 16rpx;
  border-right: 1rpx solid #e2e8f0;
}

.filter-text {
  font-size: 28rpx;
  color: #1e293b;
}

.arrow {
  font-size: 20rpx;
  color: #94a3b8;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.search-icon {
  font-size: 32rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1e293b;
  height: 48rpx;
}

.clear-btn {
  font-size: 28rpx;
  color: #94a3b8;
  padding: 8rpx;
}

.placeholder {
  color: #94a3b8;
}
</style>
