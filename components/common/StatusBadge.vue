<template>
	<view class="status-badge" :class="statusClass">
		<text class="status-text">{{ statusText }}</text>
	</view>
</template>

<script>
// 状态映射
const STATUS_MAP = {
	DRAFT: { text: "草稿", class: "status-draft" },
	RECTIFYING: { text: "整改中", class: "status-pending" },
	COMPLETED: { text: "已完成", class: "status-completed" },
	WITHDRAWN: { text: "已撤回", class: "status-draft" },
	PENDING: { text: "待处理", class: "status-pending" },
	OVERDUE: { text: "已超时", class: "status-overdue" },
};

export default {
	name: "StatusBadge",
	props: {
		status: {
			type: String,
			default: "",
		},
		isOverdue: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		statusInfo() {
			if (this.isOverdue && this.status !== "COMPLETED" && this.status !== "DRAFT") {
				return STATUS_MAP.OVERDUE;
			}
			return STATUS_MAP[this.status] || { text: "未知", class: "status-draft" };
		},
		statusText() {
			return this.statusInfo.text;
		},
		statusClass() {
			return this.statusInfo.class;
		},
	},
};
</script>

<style lang="scss" scoped>
.status-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	font-size: 22rpx;
}

.status-text {
	white-space: nowrap;
}

.status-draft {
	background: #f1f5f9;
	color: #64748b;
}

.status-pending {
	background: #fef3c7;
	color: #d97706;
}

.status-completed {
	background: #d1fae5;
	color: #059669;
}

.status-overdue {
	background: #fee2e2;
	color: #dc2626;
}
</style>
