/**
 * 图片预览工具
 * 解决 H5 环境中弹窗遮挡图片预览的问题
 */

// 全局图片预览事件
const IMAGE_PREVIEW_EVENT = 'image-preview';

/**
 * 预览图片（兼容 H5 和小程序）
 * @param {Array} urls 图片地址数组
 * @param {Number|String} current 当前显示图片的索引/链接
 */
export function previewImage(urls, current = 0) {
  // #ifdef H5
  // H5环境：触发全局事件，由 ImageViewer 组件监听处理
  uni.$emit(IMAGE_PREVIEW_EVENT, {
    urls,
    current,
  });
  // #endif

  // #ifndef H5
  // 小程序环境：使用原生预览
  uni.previewImage({
    urls,
    current,
  });
  // #endif
}

/**
 * 关闭图片预览（仅 H5）
 */
export function closeImagePreview() {
  // #ifdef H5
  uni.$emit(IMAGE_PREVIEW_EVENT, {
    visible: false,
  });
  // #endif
}

/**
 * 获取图片预览事件名
 */
export function getImagePreviewEvent() {
  return IMAGE_PREVIEW_EVENT;
}

export default {
  previewImage,
  closeImagePreview,
  getImagePreviewEvent,
};
