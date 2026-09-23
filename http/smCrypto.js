/**
 * 加解密的工具类
 * 使用：https://github.com/JuneAndGreen/sm-crypto
 *
 */
import smCrypto from "sm-crypto";

const sm2 = smCrypto.sm2;
const cipherMode = 0; // 1 - C1C3C2，0 - C1C2C3，默认为1
const publicKey =
  "0438c0f1caaa418aea102dc4ea72e7e267bedc259afe3ad29ca9c76a2afb3e27c85264ff8fec0dac6e21b67903a48d065a0e7be02be70351e86c74dd2684138ac9";

/**
 * 国密加解密工具类
 */
export default {
  // SM2加密
  doSm2Encrypt(msgString) {
    return sm2.doEncrypt(msgString, publicKey, cipherMode);
  },
  // SM2数组加密
  doSm2ArrayEncrypt(msgString) {
    return sm2.doEncrypt(msgString, publicKey, cipherMode);
  },
};
