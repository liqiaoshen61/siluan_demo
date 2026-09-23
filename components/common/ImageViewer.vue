<template>
  <view v-if="visible" class="image-viewer" @click="handleClose">
    <!-- 关闭按钮 -->
    <view class="close-btn" @click.stop="handleClose">
      <text class="close-icon">✕</text>
    </view>

    <!-- 图片容器 -->
    <view class="image-container" @click.stop>
      <swiper
        :current="currentIndex"
        @change="handleSwiperChange"
        class="image-swiper"
      >
        <swiper-item v-for="(url, index) in urls" :key="index">
          <image
            :src="url"
            mode="aspectFit"
            class="preview-image"
            @click.stop
          />
        </swiper-item>
      </swiper>

      <!-- 图片计数 -->
      <view class="image-count">
        <text>{{ currentIndex + 1 }} / {{ urls.length }}</text>
      </view>

      <!-- 关闭提示 -->
      <view class="close-tip">
        <text>点击背景或右上角关闭</text>
      </view>
    </view>
  </view>
</template>

<script>
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  name: "ImageViewer",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    urls: {
      type: Array,
      default: () => [],
    },
    current: {
      type: [Number, String],
      default: 0,
    },
  },
  emits: ["update:visible"],
  setup(props, { emit }) {
    const currentIndex = ref(0);

    // 监听 current 变化
    watch(
      () => props.current,
      (newVal) => {
        if (typeof newVal === "number") {
          currentIndex.value = newVal;
        } else if (typeof newVal === "string") {
          const index = props.urls.indexOf(newVal);
          if (index !== -1) {
            currentIndex.value = index;
          }
        }
      },
      { immediate: true }
    );

    // swiper 切换
    const handleSwiperChange = (e) => {
      currentIndex.value = e.detail.current;
    };

    // 关闭
    const handleClose = () => {
      console.log("ImageViewer handleClose 被调用");
      emit("update:visible", false);
    };

    return {
      currentIndex,
      handleSwiperChange,
      handleClose,
    };
  },
});
</script>

<style lang="scss" scoped>
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999; // 最高层级，覆盖所有弹窗
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  width: 120rpx; // 增大点击区域
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  cursor: pointer;

  &:active {
    background: rgba(255, 255, 255, 0.5);
  }
}

.close-icon {
  color: #ffffff;
  font-size: 48rpx;
  font-weight: bold;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.image-swiper {
  width: 100%;
  height: 80vh;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.image-count {
  position: absolute;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.5);
  padding: 12rpx 32rpx;
  border-radius: 32rpx;
  color: #ffffff;
  font-size: 28rpx;
}

.close-tip {
  position: absolute;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
}
</style>
