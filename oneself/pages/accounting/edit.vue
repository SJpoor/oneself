<template>
	<view class="page-container">
		<!-- 头部区域 -->
		<view class="header-section">
			<view class="header-top">
				<view class="back-btn" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="header-title">编辑记录</text>
				<view class="delete-btn" @tap="showDeleteConfirm">
					<text class="delete-icon">🗑️</text>
				</view>
			</view>
		</view>

		<!-- 原记录信息 -->
		<view class="original-record-section">
			<view class="original-card">
				<view class="original-header">
					<text class="original-title">原记录信息</text>
					<text class="original-time">{{ originalRecord.date }} {{ originalRecord.time }}</text>
				</view>
				<view class="original-content">
					<view class="original-left">
						<view class="original-icon" :style="{ background: originalRecord.iconBg }">
							<text class="original-emoji">{{ originalRecord.emoji }}</text>
						</view>
						<view class="original-info">
							<text class="original-record-title">{{ originalRecord.title }}</text>
							<text class="original-category">{{ originalRecord.category }}类别</text>
						</view>
					</view>
					<view class="original-right">
						<text class="original-amount" :class="{ income: originalRecord.type === 'income', expense: originalRecord.type === 'expense' }">
							{{ originalRecord.type === 'income' ? '+' : '-' }}¥{{ originalRecord.amount }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 编辑表单 -->
		<view class="edit-form-section">
			<!-- 金额编辑 -->
			<view class="form-item">
				<text class="form-label">金额</text>
				<view class="form-input-container">
					<view class="amount-input-row">
						<text class="currency-symbol">¥</text>
						<input class="amount-input" 
							type="digit" 
							:value="editData.amount" 
							@input="onAmountInput" />
					</view>
				</view>
			</view>

			<!-- 类别编辑 -->
			<view class="form-item">
				<text class="form-label">类别</text>
				<view class="form-input-container" @tap="showCategoryPicker">
					<view class="category-display">
						<view class="category-icon" :style="{ background: selectedCategory.iconBg }">
							<text class="category-emoji">{{ selectedCategory.emoji }}</text>
						</view>
						<text class="category-name">{{ selectedCategory.name }}</text>
					</view>
					<text class="chevron-icon">›</text>
				</view>
			</view>

			<!-- 备注编辑 -->
			<view class="form-item">
				<text class="form-label">备注</text>
				<view class="form-input-container">
					<input class="note-input" 
						:value="editData.note" 
						@input="onNoteInput" 
						placeholder="添加备注..." />
				</view>
			</view>

			<!-- 日期时间编辑 -->
			<view class="form-item">
				<text class="form-label">日期时间</text>
				<view class="form-input-container" @tap="showDateTimePicker">
					<text class="datetime-text">{{ editData.datetime }}</text>
					<text class="calendar-icon">📅</text>
				</view>
			</view>

			<!-- 账户选择 -->
			<view class="form-item">
				<text class="form-label">账户</text>
				<view class="form-input-container" @tap="showAccountPicker">
					<view class="account-display">
						<view class="account-icon">
							<text class="account-emoji">{{ selectedAccount.emoji }}</text>
						</view>
						<text class="account-name">{{ selectedAccount.name }}</text>
					</view>
					<text class="chevron-icon">›</text>
				</view>
			</view>
		</view>

		<!-- 底部按钮组 -->
		<view class="action-buttons">
			<button class="save-btn" @tap="saveChanges">保存修改</button>
			<button class="cancel-btn" @tap="goBack">取消</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			recordId: null,
			// 原始记录数据
			originalRecord: {
				id: 1,
				type: 'expense',
				amount: '89.00',
				title: '午餐 - 海底捞',
				category: '餐饮',
				date: '今天',
				time: '14:30',
				emoji: '🍽️',
				iconBg: 'linear-gradient(135deg, #FF8A65, #FFB74D)',
				note: '午餐 - 海底捞',
				account: 'alipay'
			},
			// 编辑数据
			editData: {
				amount: '89.00',
				note: '午餐 - 海底捞',
				datetime: '2024年12月18日 14:30',
				categoryId: 1,
				accountId: 1
			},
			// 分类数据
			categories: [
				{ id: 1, name: '餐饮', emoji: '🍽️', iconBg: 'linear-gradient(135deg, #FF8A65, #FFB74D)' },
				{ id: 2, name: '交通', emoji: '🚗', iconBg: '#DBEAFE' },
				{ id: 3, name: '购物', emoji: '🛍️', iconBg: '#FCE7F3' },
				{ id: 4, name: '娱乐', emoji: '🎮', iconBg: '#E0E7FF' }
			],
			// 账户数据
			accounts: [
				{ id: 1, name: '支付宝', emoji: '💰' },
				{ id: 2, name: '微信', emoji: '💚' },
				{ id: 3, name: '银行卡', emoji: '💳' },
				{ id: 4, name: '现金', emoji: '💵' }
			]
		}
	},
	computed: {
		selectedCategory() {
			return this.categories.find(c => c.id === this.editData.categoryId) || this.categories[0];
		},
		selectedAccount() {
			return this.accounts.find(a => a.id === this.editData.accountId) || this.accounts[0];
		}
	},
	onLoad(options) {
		if (options.id) {
			this.recordId = options.id;
			this.loadRecordData();
		}
	},
	methods: {
		loadRecordData() {
			// 这里应该根据recordId加载实际数据
			// 现在使用模拟数据
			console.log('加载记录数据:', this.recordId);
		},
		goBack() {
			uni.navigateBack();
		},
		onAmountInput(e) {
			this.editData.amount = e.detail.value;
		},
		onNoteInput(e) {
			this.editData.note = e.detail.value;
		},
		showCategoryPicker() {
			const itemList = this.categories.map(c => c.name);
			uni.showActionSheet({
				itemList,
				success: (res) => {
					if (res.tapIndex >= 0) {
						this.editData.categoryId = this.categories[res.tapIndex].id;
					}
				}
			});
		},
		showAccountPicker() {
			const itemList = this.accounts.map(a => a.name);
			uni.showActionSheet({
				itemList,
				success: (res) => {
					if (res.tapIndex >= 0) {
						this.editData.accountId = this.accounts[res.tapIndex].id;
					}
				}
			});
		},
		showDateTimePicker() {
			uni.showToast({
				title: '日期时间选择功能开发中',
				icon: 'none'
			});
		},
		showDeleteConfirm() {
			uni.showModal({
				title: '确认删除',
				content: '删除后无法恢复，确定要删除这条记录吗？',
				confirmText: '删除',
				confirmColor: '#EF5350',
				success: (res) => {
					if (res.confirm) {
						this.deleteRecord();
					}
				}
			});
		},
		deleteRecord() {
			// 这里应该调用删除API
			console.log('删除记录:', this.recordId);
			
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			});

			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		},
		saveChanges() {
			if (!this.editData.amount || parseFloat(this.editData.amount) <= 0) {
				uni.showToast({
					title: '请输入正确的金额',
					icon: 'none'
				});
				return;
			}

			// 这里应该调用保存API
			const updatedRecord = {
				id: this.recordId,
				amount: parseFloat(this.editData.amount),
				note: this.editData.note,
				categoryId: this.editData.categoryId,
				accountId: this.editData.accountId,
				datetime: this.editData.datetime
			};

			console.log('保存修改:', updatedRecord);

			uni.showToast({
				title: '保存成功',
				icon: 'success'
			});

			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		}
	}
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
	min-height: 100vh;
	background: #FFFFFF;
	position: relative;
	padding-bottom: 200rpx;
}

/* 头部区域 */
.header-section {
	padding: 48rpx 48rpx 48rpx 48rpx;
}

.header-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.back-btn, .delete-btn {
	width: 80rpx;
	height: 80rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-btn {
	background: #F3F4F6;
}

.delete-btn {
	background: #FEE2E2;
}

.back-icon {
	font-size: 40rpx;
	color: #6B7280;
	font-weight: 300;
}

.delete-icon {
	font-size: 40rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
}

/* 原记录信息 */
.original-record-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.original-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-left: 8rpx solid #FF8A65;
	border-radius: 32rpx;
	padding: 40rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.original-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.original-title {
	font-weight: 600;
	color: #1F2937;
	font-size: 32rpx;
}

.original-time {
	color: #6B7280;
	font-size: 28rpx;
}

.original-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.original-left {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.original-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.original-emoji {
	font-size: 48rpx;
}

.original-info {
	display: flex;
	flex-direction: column;
}

.original-record-title {
	font-weight: 500;
	color: #1F2937;
	font-size: 32rpx;
}

.original-category {
	color: #6B7280;
	font-size: 28rpx;
	margin-top: 4rpx;
}

.original-right {
	text-align: right;
}

.original-amount {
	font-size: 48rpx;
	font-weight: bold;
}

.original-amount.income {
	color: #66BB6A;
}

.original-amount.expense {
	color: #EF5350;
}

/* 编辑表单 */
.edit-form-section {
	padding: 0 48rpx;
}

.form-item {
	margin-bottom: 32rpx;
}

.form-label {
	display: block;
	color: #374151;
	font-size: 28rpx;
	font-weight: 500;
	margin-bottom: 16rpx;
}

.form-input-container {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

/* 金额输入 */
.amount-input-row {
	display: flex;
	align-items: center;
}

.currency-symbol {
	font-size: 40rpx;
	font-weight: bold;
	color: #FF8A65;
	margin-right: 16rpx;
}

.amount-input {
	flex: 1;
	font-size: 40rpx;
	font-weight: bold;
	color: #FF8A65;
	background: none;
	border: none;
}

/* 分类显示 */
.category-display, .account-display {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.category-icon, .account-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.account-icon {
	background: #DBEAFE;
}

.category-emoji, .account-emoji {
	font-size: 40rpx;
}

.category-name, .account-name {
	font-weight: 500;
	color: #1F2937;
	font-size: 32rpx;
}

.form-input-container {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.chevron-icon {
	color: #9CA3AF;
	font-size: 40rpx;
	font-weight: 300;
}

/* 备注输入 */
.note-input {
	width: 100%;
	background: transparent;
	color: #374151;
	font-size: 32rpx;
}

/* 日期时间 */
.datetime-text {
	color: #374151;
	font-size: 32rpx;
	flex: 1;
}

.calendar-icon {
	font-size: 40rpx;
}

/* 底部按钮 */
.action-buttons {
	position: fixed;
	bottom: 48rpx;
	left: 48rpx;
	right: 48rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.save-btn, .cancel-btn {
	width: 100%;
	padding: 32rpx;
	font-weight: 600;
	font-size: 32rpx;
	border-radius: 32rpx;
	border: none;
}

.save-btn {
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	color: white;
}

.cancel-btn {
	background: #F3F4F6;
	color: #374151;
}

.save-btn:active, .cancel-btn:active {
	transform: scale(0.95);
}
</style>