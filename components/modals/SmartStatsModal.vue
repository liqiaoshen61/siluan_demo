<template>
  <view v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <!-- 头部 -->
      <view class="modal-header">
        <view class="header-left">
          <view class="ai-icon">
            <image src="/static/logo.png" class="ai-icon-image" mode="widthFix"></image>
          </view>
          <view class="header-info">
            <text class="modal-title">水利统计智能体</text>
          </view>
        </view>
        <view class="header-right">
          <view class="new-session-btn" @click="handleNewSession">
            <text class="new-session-text">新建</text>
          </view>
          <view class="close-btn" @click="handleClose">
            <text class="close-icon">✕</text>
          </view>
        </view>
      </view>

      <!-- 对话区域 -->
      <scroll-view class="chat-container" scroll-y :scroll-top="scrollTop">
        <view class="chat-messages">
          <!-- 消息列表 -->
          <view v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
            <view v-if="msg.role === 'bot'" class="avatar bot-avatar">
              <image src="/static/logo.png" class="ai-icon-image" mode="widthFix"></image>
            </view>
            <view v-if="msg.role === 'user'" class="avatar user-avatar">👤</view>
            <view class="message-content">
              <rich-text class="message-text" :class="{ 'has-cards': msg.cards?.length }"
                :nodes="parseMarkdown(msg.content)"></rich-text>
            </view>

          </view>

          <!-- 思考中状态 -->
          <view v-if="thinking" class="message bot">
            <view class="avatar bot-avatar">💡</view>
            <view class="message-content thinking">
              <view class="thinking-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 快捷问题 -->
      <scroll-view class="quick-questions" scroll-x>
        <view class="quick-list">
          <view v-for="(q, index) in quickQuestions" :key="index" class="quick-btn" @click="askQuickQuestion(q)">
            {{ q }}
          </view>
        </view>
      </scroll-view>

      <!-- 输入区域 -->
      <view class="input-area">
        <input class="chat-input" type="text" v-model="userInput" placeholder="输入您的问题..."
          placeholder-class="placeholder" @confirm="sendMessage" />
        <view class="send-btn" @click="sendMessage">
          <text class="send-icon">➤</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from "@/api/index.js";

export default {
  name: "SmartStatsModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:visible"],
  data() {
    return {
      messages: [],
      userInput: "",
      thinking: false,
      scrollTop: 0,
      quickQuestions: [
        "本月辖区共有多少问题？",
        "哪些乡镇问题最多？",
        "本月整改率是多少？",
        "有多少超时未处理的？",
        "有多少乱堆问题？",
        "本月整改情况如何？",
        "乱采问题主要分布在哪里？",
      ],
      sessionId: null,
      sessionLoading: false,
      showConfirmModal: false,
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.initChat();
      }
    },
  },
  methods: {
    async initChat() {
      // 尝试读取缓存的会话
      const cachedSession = api.smart.getSessionCache();

      if (cachedSession && cachedSession.sessionId) {
        // 使用缓存的会话ID
        this.sessionId = cachedSession.sessionId;
        console.log("使用缓存的会话ID:", this.sessionId);
      } else {
        // 无缓存，创建新会话
        await this.createNewSession(true);
      }

      // 显示欢迎消息
      if (this.messages.length === 0) {
        this.messages.push({
          role: "bot",
          content: `您好！我是水利统计智能体 👋\n我可以帮您分析"四乱"暗访数据。\n\n您可以这样问我：\n• 按乡镇/类型/月份查询\n• 询问整改率、超时情况\n• 对比不同乡镇的数据\n\n请输入您的问题，或点击下方快捷问题～`,
        });
      }
    },

    /**
     * 创建新会话
     * @param {boolean} isInit 是否为初始化时调用（不提示确认）
     */
    async createNewSession(isInit = false) {
      if (this.sessionLoading) return;

      this.sessionLoading = true;

      try {
        const result = await api.smart.createSession("水利统计对话");

        if (result.success && result.data) {
          this.sessionId = String(result.data);
          // 缓存会话
          api.smart.saveSessionCache(this.sessionId, "水利统计对话");
          console.log("创建新会话成功:", this.sessionId);

          // 非初始化时，清空消息并显示欢迎语
          if (!isInit) {
            this.messages = [];
            this.messages.push({
              role: "bot",
              content: `您好！我是水利统计智能体 👋\n我可以帮您分析"四乱"暗访数据。\n\n您可以这样问我：\n• 按乡镇/类型/月份查询\n• 询问整改率、超时情况\n• 对比不同乡镇的数据\n\n请输入您的问题，或点击下方快捷问题～`,
            });
          }
        } else {
          throw new Error(result.msg || "创建会话失败");
        }
      } catch (error) {
        console.error("创建会话失败:", error);
        if (!isInit) {
          uni.showToast({
            title: "创建会话失败，请重试",
            icon: "none",
            duration: 2000,
          });
        }
      } finally {
        this.sessionLoading = false;
      }
    },

    /**
     * 点击新建会话按钮
     */
    handleNewSession() {
      // 显示确认弹窗
      uni.showModal({
        title: "提示",
        content: "创建新会话将清空当前对话记录，是否继续？",
        success: (res) => {
          if (res.confirm) {
            this.createNewSession(false);
          }
        },
      });
    },

    async sendMessage() {
      const text = this.userInput.trim();
      if (!text || this.thinking) return;

      // 检查会话ID是否存在
      if (!this.sessionId) {
        uni.showToast({
          title: "会话未初始化，请稍后重试",
          icon: "none",
          duration: 2000,
        });
        // 尝试重新创建会话
        await this.createNewSession(true);
        return;
      }

      // 添加用户消息
      this.messages.push({
        role: "user",
        content: text,
      });

      this.userInput = "";
      this.scrollToBottom();

      // 显示思考状态
      this.thinking = true;
      this.scrollToBottom();

      try {
        let fullResponse = "";

        await api.smart.assistantChat({
          sessionId: this.sessionId,
          message: text,
          onChunk: (chunk) => {
            console.log("收到数据块:", chunk);
            fullResponse += chunk;

            // 隐藏 thinking 状态
            if (this.thinking) {
              this.thinking = false;
              // 创建新的 bot 消息
              this.messages.push({
                role: "bot",
                content: "",
              });
            }

            // 实时更新最后一条消息的内容
            const lastMsg = this.messages[this.messages.length - 1];
            if (lastMsg && lastMsg.role === "bot") {
              lastMsg.content = fullResponse;
              this.scrollToBottom();
            }
          },
          onComplete: (data) => {
            console.log("完整响应:", data);
            this.thinking = false;

            // 优先使用完整响应数据，否则使用分块累积的数据
            const responseData = data || fullResponse;
            console.log("最终数据:", responseData);

            if (!responseData) {
              // 无数据，显示错误
              console.log("无数据，显示错误");
              // 检查是否已有 bot 消息
              const lastMsg = this.messages[this.messages.length - 1];
              if (lastMsg && lastMsg.role === "bot") {
                lastMsg.content = "抱歉，未获取到有效数据，请稍后重试。";
              } else {
                // 没有则创建新消息
                this.messages.push({
                  role: "bot",
                  content: "抱歉，未获取到有效数据，请稍后重试。",
                });
              }
              this.scrollToBottom();
              return;
            }

            // 解析响应，生成数据卡片
            const result = this.parseResponse(text, responseData);
            console.log("解析后的 result:", result);

            // 检查是否已有 bot 消息（通过 onChunk 创建）
            const lastMsg = this.messages[this.messages.length - 1];
            if (lastMsg && lastMsg.role === "bot") {
              // 已存在，更新内容
              lastMsg.content = result.content;
              lastMsg.cards = result.cards;
            } else {
              // 不存在，创建新消息
              this.messages.push({
                role: "bot",
                content: result.content,
                cards: result.cards,
              });
            }

            this.scrollToBottom();
          },
          onError: (error) => {
            console.error("请求错误:", error);
            this.thinking = false;
            this.messages.push({
              role: "bot",
              content: "抱歉，查询出错，请稍后重试。",
            });
            this.scrollToBottom();
          },
        });
      } catch (error) {
        console.error("对话失败:", error);
        this.thinking = false;

        // 使用本地模拟响应
        // const mockResult = this.generateMockResponse(text);
        // this.messages.push({
        //   role: "bot",
        //   content: mockResult.content,
        //   cards: mockResult.cards,
        // });
        // this.scrollToBottom();
      }
    },

    parseResponse(question, rawResponse) {
      // 清理末尾的完成标记
      let content = rawResponse;
      if (typeof content === "string") {
        // 移除末尾的 {"completed":true}
        content = content.replace(/\{"completed":true\}$/g, "").trim();
      }

      // 返回内容和卡片
      if (content) {
        return {
          content: content,
          cards: this.extractCards(question),
        };
      }
      return this.generateMockResponse(question);
    },

    /**
     * 将 Markdown 转换为小程序可渲染的节点数组
     * @param {string} markdown Markdown 文本
     * @returns {Array} rich-text 节点数组
     */
    parseMarkdown(markdown) {
      if (!markdown) return [];

      let html = markdown;

      // 1. 代码块（必须先处理，避免内部内容被其他规则影响）
      html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
        const langClass = lang ? `language-${lang}` : '';
        // 保留所有空格和换行，只转义 HTML 特殊字符
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        // 不使用 trim()，保留原始格式
        return `<pre class="code-block ${langClass}"><code>${escapedCode}</code></pre>`;
      });

      // 处理未闭合的代码块（流式输出场景）
      html = html.replace(/```(\w*)\n([\s\S]*?)$/g, (_match, lang, code) => {
        // 未闭合的代码块，暂时显示为纯文本
        const langText = lang ? ` [${lang}]` : '';
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre class="code-block incomplete"><code>${langText}${escapedCode}</code></pre>`;
      });

      // 2. 内联代码
      html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

      // 处理单个反引号（未闭合的内联代码）
      html = html.replace(/`([^`\n]*)$/gm, '<code class="inline-code incomplete">$1</code>');

      // 3. 表格（使用标准 table 标签，小程序 rich-text 支持）
      // 支持带对齐符号的分隔线（冒号 :）
      html = html.replace(/\|(.+)\|\n\|[-|: ]+\|\n((?:\|.+\|\n?)+)/g, (_match, header, body) => {
        const headers = header.split("|").filter(h => h.trim());
        const rows = body.trim().split("\n").map(row => {
          const cells = row.split("|").filter(c => c.trim());
          return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join("")}</tr>`;
        }).join("");
        return `<table class="markdown-table"><thead><tr>${headers.map(h => `<th>${h.trim()}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
      });

      // 4. 任务列表
      html = html.replace(/^- \[x\] (.+)$/gm, '<li class="task-item completed">✅ $1</li>');
      html = html.replace(/^- \[ \] (.+)$/gm, '<li class="task-item">⬜ $1</li>');

      // 5. 标题
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

      // 6. 删除线
      html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

      // 处理未闭合的删除线
      html = html.replace(/~~(.+?)$/g, '<span class="incomplete-del">~~$1</span>');

      // 7. 加粗和斜体（注意顺序，先处理加粗）
      // 先处理已闭合的
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/_(.+?)_/g, '<em>$1</em>');

      // 处理未闭合的加粗和斜体（流式输出场景）
      // 未闭合的加粗 **text
      html = html.replace(/\*\*([^*\n]+)$/gm, '<span class="incomplete-bold">**$1</span>');
      // 未闭合的斜体 *text（单个星号）
      html = html.replace(/(?<!\*)\*([^*\n]+)$/gm, '<span class="incomplete-italic">*$1</span>');

      // 8. 分割线
      html = html.replace(/^---$/gm, '<hr/>');
      html = html.replace(/^\*\*\*$/gm, '<hr/>');

      // 9. 引用
      html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

      // 10. 无序列表（排除已处理的任务列表）
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

      // 11. 有序列表
      html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ordered-item">$2</li>');

      // 12. 链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

      // 13. 段落和换行
      html = html.replace(/\n\n/g, '</p><p>');
      html = html.replace(/\n/g, '<br/>');

      // 包裹段落
      if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
      }

      // 解析 HTML 为节点数组
      return this.parseHtmlToNodes(html);
    },

    /**
     * 简单解析 HTML 为 rich-text 可用的节点数组
     */
    parseHtmlToNodes(html) {
      const nodes = [];
      let current = { children: nodes };
      const stack = [current];

      // 支持的标签（增加了表格标签）
      const tagRegex = /<(\/?)(h[1-6]|p|strong|em|br|hr|blockquote|li|div|span|pre|code|del|a|table|thead|tbody|tr|th|td)[^>]*>|([^<]+)/g;
      let matchResult;

      while ((matchResult = tagRegex.exec(html)) !== null) {
        const isClose = matchResult[1];
        const tagName = matchResult[2];
        const text = matchResult[3];

        if (text) {
          // 纯文本
          current.children = current.children || [];
          current.children.push({
            type: 'text',
            text: text
          });
        } else if (isClose) {
          // 闭合标签
          if (stack.length > 1) {
            stack.pop();
            current = stack[stack.length - 1];
          }
        } else if (tagName) {
          // 开始标签
          const node = {
            name: tagName,
            attrs: {},
            children: []
          };

          // 添加 class 和其他属性
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
            node.attrs.class = `md-${tagName}`;
          } else if (['strong', 'em'].includes(tagName)) {
            node.attrs.class = `md-${tagName}`;
          } else if (tagName === 'blockquote') {
            node.attrs.class = 'md-blockquote';
          } else if (tagName === 'hr') {
            node.attrs.class = 'md-hr';
          } else if (tagName === 'li') {
            node.attrs.class = 'md-li';
          } else if (tagName === 'pre') {
            node.attrs.class = 'md-pre';
          } else if (tagName === 'code') {
            node.attrs.class = 'md-code';
          } else if (tagName === 'del') {
            node.attrs.class = 'md-del';
          } else if (tagName === 'a') {
            node.attrs.class = 'md-link';
          } else if (tagName === 'table') {
            node.attrs.class = 'markdown-table';
            node.attrs.style = 'width: 100%; border-collapse: collapse; margin: 12rpx 0; border: 1rpx solid #e2e8f0; border-radius: 8rpx; overflow: hidden;';
          } else if (tagName === 'th') {
            node.attrs.class = 'table-header-cell';
            node.attrs.style = 'padding: 12rpx 16rpx; text-align: left; font-weight: 600; background: #f1f5f9; border-bottom: 1rpx solid #e2e8f0; border-right: 1rpx solid #e2e8f0;';
          } else if (tagName === 'td') {
            node.attrs.class = 'table-cell';
            node.attrs.style = 'padding: 12rpx 16rpx; border-bottom: 1rpx solid #e2e8f0; border-right: 1rpx solid #e2e8f0;';
          }

          if (tagName === 'br' || tagName === 'hr') {
            // 自闭合标签
            current.children = current.children || [];
            current.children.push(node);
          } else {
            current.children = current.children || [];
            current.children.push(node);
            stack.push(node);
            current = node;
          }
        }
      }

      return nodes;
    },

    extractCards(question) {
      // 根据问题类型生成模拟卡片
      const now = new Date();
      const monthStr = `${now.getFullYear()}年${now.getMonth() + 1}月`;

      return [
        {
          title: `${monthStr} · 全县 · 各类`,
          total: Math.floor(Math.random() * 50) + 20,
          completed: Math.floor(Math.random() * 30) + 10,
          rate: Math.floor(Math.random() * 30) + 60,
          overdue: Math.floor(Math.random() * 10) + 1,
        },
      ];
    },

    generateMockResponse(question) {
      const now = new Date();
      const monthStr = `${now.getFullYear()}年${now.getMonth() + 1}月`;
      const total = Math.floor(Math.random() * 50) + 20;
      const completed = Math.floor(Math.random() * 30) + 10;
      const rate = Math.floor((completed / total) * 100);
      const overdue = Math.floor(Math.random() * 10) + 1;

      return {
        content: `📊 ${monthStr}「全县」各类问题概况：\n\n• 问题总数：${total} 起\n• 已整改：${completed} 起（整改率 ${rate}%）\n• 整改中：${total - completed - overdue} 起\n• 超时未处理：${overdue} 起`,
        cards: [
          {
            title: `${monthStr} · 全县 · 各类`,
            total,
            completed,
            rate,
            overdue,
          },
        ],
      };
    },

    askQuickQuestion(question) {
      this.userInput = question;
      this.sendMessage();
    },

    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop += 999;
      });
    },

    handleClose() {
      this.$emit("update:visible", false);
    },

    handleOverlayClick() {
      // 不关闭
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
  justify-content: center;
}

.modal-container {
  width: 100%;
  height: 85vh;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid #e2e8f0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.ai-icon {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;


}

.ai-icon-image {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.new-session-btn {
  padding: 12rpx 24rpx;
  background: #ecfeff;
  border: 1rpx solid #a5f3fc;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-session-text {
  font-size: 24rpx;
  color: #0891b2;
}

.close-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 32rpx;
  color: #64748b;
}

.chat-container {
  flex: 1;
  padding: 24rpx 10rpx;
  box-sizing: border-box;
  background: #f8fafc;
  overflow-y: auto;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.message {
  display: flex;
  gap: 16rpx;

  &.bot {
    .message-content {
      background: #ffffff;
      border: 1rpx solid #e2e8f0;
      border-radius: 20rpx 20rpx 20rpx 4rpx;
    }
  }

  &.user {
    flex-direction: row-reverse;

    .message-content {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      border-radius: 20rpx 20rpx 4rpx 20rpx;

      .message-text {
        color: #ffffff;
      }
    }
  }
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

.bot-avatar {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

.user-avatar {
  background: #e2e8f0;
}

.message-content {
  max-width: 80%;
  padding: 20rpx 24rpx;
}

.message-text {
  font-size: 28rpx;
  color: #1e293b;
  line-height: 1.6;
  white-space: pre-line;
}

.thinking {
  padding: 24rpx;
}

.thinking-dots {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  background: #94a3b8;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: 0s;
  }

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-16rpx);
  }
}

.data-cards {
  margin-top: 16rpx;
}

.data-card {
  background: #f8fafc;
  border-radius: 12rpx;
  padding: 16rpx;
  border: 1rpx solid #e2e8f0;
}

.card-header {
  margin-bottom: 12rpx;
}

.card-title {
  font-size: 24rpx;
  color: #64748b;
}

.card-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;

  &.success {
    color: #059669;
  }

  &.warning {
    color: #d97706;
  }

  &.danger {
    color: #dc2626;
  }
}

.stat-label {
  display: block;
  font-size: 22rpx;
  color: #64748b;
  margin-top: 4rpx;
}

.quick-questions {
  flex-shrink: 0;
  padding: 16rpx 20rpx;
  border-top: 1rpx solid #e2e8f0;
  background: #ffffff;
}

.quick-list {
  display: flex;
  gap: 16rpx;
  white-space: nowrap;
}

.quick-btn {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #0891b2;
  background: #ecfeff;
  border: 1rpx solid #a5f3fc;
  padding: 12rpx 20rpx;
  border-radius: 32rpx;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom, 16rpx));
  border-top: 1rpx solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  height: 80rpx;
  background: #f1f5f9;
  border: 1rpx solid #e2e8f0;
  border-radius: 40rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.send-btn {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-icon {
  color: #ffffff;
  font-size: 32rpx;
}

.placeholder {
  color: #94a3b8;
}

// Markdown 样式
.message-text {

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    font-weight: 600;
    margin: 16rpx 0 8rpx;
    color: #1e293b;
  }

  :deep(h1) {
    font-size: 36rpx;
  }

  :deep(h2) {
    font-size: 32rpx;
  }

  :deep(h3) {
    font-size: 30rpx;
  }

  :deep(strong) {
    font-weight: 600;
    color: #0f172a;
  }

  :deep(em) {
    font-style: italic;
    color: #475569;
  }

  :deep(blockquote) {
    border-left: 6rpx solid #06b6d4;
    padding-left: 16rpx;
    margin: 12rpx 0;
    color: #64748b;
    background: #f0f9ff;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
  }

  :deep(hr) {
    border: none;
    border-top: 2rpx solid #e2e8f0;
    margin: 16rpx 0;
  }

  :deep(li) {
    margin: 8rpx 0;
    padding-left: 24rpx;
    position: relative;

    &::before {
      content: "•";
      position: absolute;
      left: 8rpx;
      color: #06b6d4;
    }

    // 有序列表样式
    &.ordered-item::before {
      content: none;
    }
  }

  // 任务列表样式
  :deep(.task-item) {
    list-style: none;

    &.completed {
      color: #64748b;
      text-decoration: line-through;
    }
  }

  // 代码块样式
  :deep(pre) {
    background: #f8fafc;
    color: #334155;
    padding: 20rpx;
    border-radius: 8rpx;
    margin: 12rpx 0;
    border: 1rpx solid #e2e8f0;
    overflow-x: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', Courier, monospace;
    font-size: 26rpx;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    display: block;

    code {
      background: transparent;
      padding: 0;
      color: inherit;
      font-size: inherit;
      white-space: pre-wrap;
    }
  }

  // 内联代码样式
  :deep(code) {
    background: #f1f5f9;
    color: #dc2626;
    padding: 4rpx 12rpx;
    border-radius: 6rpx;
    font-family: 'Menlo', 'Monaco', 'Courier New', Courier, monospace;
    font-size: 26rpx;

    // 未闭合的代码
    &.incomplete {
      background: #fef3c7;
      color: #d97706;
    }
  }

  // 删除线样式
  :deep(del) {
    color: #94a3b8;
    text-decoration: line-through;
  }

  // 未闭合语法样式（流式输出时显示）
  :deep(.incomplete-bold),
  :deep(.incomplete-italic),
  :deep(.incomplete-del) {
    color: #64748b;
    opacity: 0.7;
  }

  :deep(.incomplete-bold) {
    font-weight: 500;
  }

  :deep(.incomplete-italic) {
    font-style: italic;
  }

  // 链接样式
  :deep(a) {
    color: #0891b2;
    text-decoration: underline;

    &:active {
      color: #06b6d4;
    }
  }

  // 表格样式（使用 table 标签）
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 12rpx 0;
    border: 1rpx solid #e2e8f0;
    border-radius: 8rpx;
    overflow: hidden;
    font-size: 26rpx;
    /* #ifdef MP-WEIXIN */
    display: block;
    /* #endif */
    /* #ifdef H5 */
    display: table;
    /* #endif */
  }

  :deep(thead) {
    background: #f1f5f9;
    /* #ifdef H5 */
    display: table-header-group;
    /* #endif */
  }

  :deep(th) {
    padding: 12rpx 16rpx;
    text-align: left;
    font-weight: 600;
    border-bottom: 2rpx solid #e2e8f0;
    border-right: 1rpx solid #e2e8f0;
    /* #ifdef H5 */
    display: table-cell;
    /* #endif */
  }

  :deep(tbody) {
    /* #ifdef H5 */
    display: table-row-group;
    /* #endif */
  }

  :deep(tr) {
    /* #ifdef H5 */
    display: table-row;
    /* #endif */
    border-bottom: 1rpx solid #e2e8f0;
  }

  :deep(td) {
    padding: 12rpx 16rpx;
    border-right: 1rpx solid #e2e8f0;
    /* #ifdef H5 */
    display: table-cell;
    /* #endif */
  }

  :deep(th:last-child),
  :deep(td:last-child) {
    border-right: none;
  }

  :deep(tbody tr:last-child) {
    border-bottom: none;
  }
}
</style>
