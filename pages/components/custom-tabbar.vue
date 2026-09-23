<!-- components/custom-tabbar.vue -->
<template>
  <view class="custom-tabbar">
    <view v-for="(item, index) in tabList" :key="index" class="tabbar-item" :class="{ active: current === item.text }"
      @click="switchTab(item, index)">
      <image class="tabbar-icon" mode="widthFix" :src="current === item.text ? item.selectedIconPath : item.iconPath" />
      <text class="tabbar-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    current: {
      type: String,
      default: '首页'
    }
  },
  data() {
    return {
      tabList: [
        {
          "pagePath": "/pages/index/index",
          "iconPath": "../../static/index-normal.png",
          "selectedIconPath": "../../static/index-active.png",
          "text": "首页"
        },
        {
          "pagePath": "/pages/user/index",
          "iconPath": "../../static/login-account.png",
          "selectedIconPath": "../../static/login-active.png",
          "text": "我的"
        }
      ]
    }
  },
  methods: {
    switchTab(item, index) {
      uni.switchTab({
        url: item.pagePath
      })
      this.$emit('change', index)
    }
  }
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* height: 60px; */
  display: flex;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 999;
  padding-bottom: env(safe-area-inset-bottom);
  /* #ifndef H5 */
  /* 非H5环境（小程序、APP）height高度 */
  height: 60px;
  /* #endif */

  /* #ifdef H5 */
  /* H5环境无height高度 */
  height: 90px;
  /* #endif */
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tabbar-icon {
  width: 24px;
  height: 24px;
}

.tabbar-text {
  font-size: 12px;
  margin-top: 4px;
  color: #808080;
}

.active .tabbar-text {
  color: #1fa7d4;
}
</style>
