<template>
  <image
    class="icon"
    :src="iconSrc"
    :style="{ width: size, height: size }"
    mode="aspectFit"
  />
</template>

<script>
import { icons } from "@/icons/index.js";

/**
 * 将 SVG 转换为 base64 DataURI
 */
function svgToBase64(svgString) {
  // 使用 uni.base64ToArrayBuffer 或手动编码
  try {
    // 方法1: 直接编码 URL
    const encoded = svgString
      .replace(/</g, '%3C')
      .replace(/>/g, '%3E')
      .replace(/#/g, '%23')
      .replace(/"/g, '%22')
      .replace(/'/g, '%27');
    return `data:image/svg+xml,${encoded}`;
  } catch (e) {
    console.error('SVG 编码失败:', e);
    return '';
  }
}

export default {
  name: "Icon",
  props: {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#333333",
    },
    size: {
      type: String,
      default: "32rpx",
    },
  },
  computed: {
    iconData() {
      return icons[this.name] || {};
    },
    viewBox() {
      return this.iconData.viewBox || "0 0 24 24";
    },
    svgPath() {
      return this.iconData.path || "";
    },
    iconSrc() {
      if (!this.svgPath) {
        return "";
      }

      // 构建完整的 SVG 字符串
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.viewBox}" width="24" height="24" fill="${this.color}">${this.svgPath}</svg>`;

      return svgToBase64(svgString);
    },
  },
};
</script>

<style scoped>
.icon {
  display: inline-flex;
  flex-shrink: 0;
}
</style>
