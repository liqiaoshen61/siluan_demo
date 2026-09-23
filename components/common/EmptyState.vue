<template>
	<view class="empty-state">
		<view class="empty-icon">{{ icon }}</view>
		<text class="empty-text">{{ text }}</text>
		<view v-if="showButton" class="empty-action">
			<button class="action-btn" @click="handleAction">{{ buttonText }}</button>
		</view>
	</view>
</template>

<script>
export default {
	name: "EmptyState",
	props: {
		icon: {
			type: String,
			default: "📭",
		},
		text: {
			type: String,
			default: "暂无数据",
		},
		showButton: {
			type: Boolean,
			default: false,
		},
		buttonText: {
			type: String,
			default: "立即添加",
		},
	},
	methods: {
		handleAction() {
			this.$emit("action");
		},
	},
};
</script>

<style lang="scss" scoped>
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 48rpx;
}

.empty-icon {
	font-size: 120rpx;
	margin-bottom: 32rpx;
}

.empty-text {
	font-size: 32rpx;
	color: #94a3b8;
	margin-bottom: 48rpx;
}

.action-btn {
	background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
	color: #ffffff;
	font-size: 30rpx;
	padding: 24rpx 64rpx;
	border-radius: 48rpx;
	border: none;

	&:active {
		opacity: 0.9;
		transform: scale(0.98);
	}
}
</style>
