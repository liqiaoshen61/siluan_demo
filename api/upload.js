/**
 * 文件上传相关接口
 */
import { uploadFile } from "@/http/riverRequest.js";
import { RiverFileBaseUrl } from "@/http/baseApi.js";

/**
 * 把图片相对路径(name)拼成可访问的完整 URL
 * - name: "upload/20260904/xxx.jpg"
 * - 小程序: "https://ycsl.fjswxsj.com:20319/yc-river-supervision/upload/20260904/xxx.jpg"
 * - H5 生产(RiverFileBaseUrl 为空): "/yc-river-supervision/upload/20260904/xxx.jpg"，由 nginx 代理
 * @param {string} name 图片相对路径
 * @returns {string} 可访问的完整 URL
 */
export function resolveImageUrl(name) {
  if (!name) return "";
  // 已经是完整 URL（http 开头）直接返回
  if (/^https?:\/\//.test(name)) return name;
  // 去掉开头多余的 /
  const path = name.replace(/^\/+/, "");
  // H5 生产环境 RiverFileBaseUrl 为空字符串，拼接出相对路径交由 nginx 代理
  return `${RiverFileBaseUrl}/${path}`;
}

/**
 * 上传图片
 * @param {string} filePath 本地文件路径
 * @returns {Promise<string>} 返回图片相对路径 name（显示时用 resolveImageUrl 转换）
 */
export function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    uploadFile(filePath)
      .then((res) => {
        if (res.data && res.data.name) {
          // 统一返回 name 相对路径，保存到后端的也是 name
          resolve(res.data.name);
        } else if (res.data && res.data.link) {
          // 没有 name 时退回 link（已是完整 URL）
          resolve(res.data.link);
        } else {
          reject(new Error("上传返回数据异常"));
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 批量上传图片
 * @param {string[]} filePaths 本地文件路径数组
 * @param {Function} onProgress 进度回调
 * @returns {Promise<string[]>} 返回图片链接数组
 */
export async function uploadImages(filePaths, onProgress) {
  const results = [];
  const total = filePaths.length;

  for (let i = 0; i < filePaths.length; i++) {
    try {
      const link = await uploadImage(filePaths[i]);
      results.push(link);

      if (onProgress) {
        onProgress(i + 1, total);
      }
    } catch (error) {
      console.error(`上传第${i + 1}张图片失败:`, error);
      results.push(null);
    }
  }

  return results.filter(Boolean);
}

/**
 * 压缩图片
 * @param {string} filePath 原始文件路径
 * @param {number} quality 压缩质量 0-100
 * @returns {Promise<string>} 压缩后的临时路径
 */
export function compressImage(filePath, quality = 80) {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src: filePath,
      quality,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (err) => {
        // 压缩失败则返回原路径
        resolve(filePath);
      },
    });
  });
}

export default {
  uploadImage,
  uploadImages,
  compressImage,
  resolveImageUrl,
};
