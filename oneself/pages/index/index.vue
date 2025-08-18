<template>
	<view class="page-container">
		<!-- 头部问候区域 -->
		<view class="header-section">
			<view class="greeting-area">
				<view class="greeting-text">
					<text class="greeting-title">早安，小明</text>
					<text class="greeting-subtitle">今天也要元气满满哦 ✨</text>
				</view>
				<view class="sun-icon animate-float">
					<text class="sun-emoji">☀️</text>
				</view>
			</view>
			
			<!-- 日期卡片 -->
			<view class="date-card glass-card">
				<view class="date-content">
					<view class="date-left">
						<text class="date-number">12月18日</text>
						<text class="date-desc">星期一 · 冬至将至</text>
					</view>
					<view class="weather-info">
						<text class="temperature">22°C</text>
						<text class="weather-desc">晴朗温暖</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 快速功能入口 -->
		<view class="quick-actions">
			<text class="section-title">快速入口</text>
			<view class="actions-grid">
				<!-- 记账入口 -->
				<view class="action-item glass-card" @tap="navigateToAccounting">
					<view class="action-icon accounting-icon">
						<text class="icon-emoji">💰</text>
					</view>
					<text class="action-title">记一笔</text>
					<text class="action-subtitle">添加记录</text>
				</view>
				
				<!-- 日记入口 -->
				<view class="action-item glass-card" @tap="navigateToDiary">
					<view class="action-icon diary-icon">
						<text class="icon-emoji">📝</text>
					</view>
					<text class="action-title">日记</text>
					<text class="action-subtitle">记录心情</text>
				</view>
				
				<!-- 待办入口 -->
				<view class="action-item glass-card" @tap="navigateToTodo">
					<view class="action-icon todo-icon">
						<text class="icon-emoji">✅</text>
					</view>
					<text class="action-title">待办</text>
					<text class="action-subtitle">任务管理</text>
				</view>
			</view>
		</view>
		
		<!-- 今日数据统计 -->
		<view class="daily-stats">
			<text class="section-title">今日数据</text>
			<view class="stats-card glass-card">
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-number number-gradient">¥{{ todayStats.expense.toFixed(2) }}</text>
						<text class="stat-label">今日支出</text>
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: getExpenseProgress() }"></view>
						</view>
					</view>
					<view class="stat-item stat-divider">
						<text class="stat-number number-gradient">3</text>
						<text class="stat-label">待办任务</text>
						<view class="progress-dots">
							<view class="dot dot-primary"></view>
							<view class="dot dot-secondary"></view>
							<view class="dot dot-gray"></view>
						</view>
					</view>
					<view class="stat-item">
						<text class="stat-number number-gradient">1</text>
						<text class="stat-label">日记篇数</text>
						<view class="heart-icon">
							<text class="heart-emoji">❤️</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 近期活动时间线 -->
		<view class="recent-activities">
			<text class="section-title">近期活动</text>
			<view class="activity-list" v-if="recentActivities.length > 0">
				<view class="activity-item" 
					v-for="(activity, index) in recentActivities" 
					:key="activity.id">
					<view class="activity-dot" :class="getActivityDotClass(activity.type)"></view>
					<view class="activity-content">
						<view class="activity-card glass-card">
							<view class="activity-header">
								<text class="activity-title">{{ activity.title }}</text>
								<text class="activity-time">{{ activity.timeText }}</text>
							</view>
							<text class="activity-desc">{{ activity.description }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="activity-empty" v-else>
				<view class="empty-icon">📝</view>
				<text class="empty-text">暂无近期活动</text>
				<text class="empty-hint">开始记账创建第一个活动</text>
			</view>
		</view>
		
		<!-- 底部导航栏 -->
		<view class="bottom-navigation">
			<view class="nav-item nav-active">
				<view class="nav-icon nav-icon-active">
					<text class="nav-emoji">🏠</text>
				</view>
				<text class="nav-text nav-text-active">首页</text>
			</view>
			<view class="nav-item" @tap="navigateToAccountingHome">
				<text class="nav-emoji nav-emoji-inactive">💰</text>
				<text class="nav-text nav-text-inactive">记账</text>
			</view>
			<view class="nav-item" @tap="navigateToDiary">
				<text class="nav-emoji nav-emoji-inactive">📝</text>
				<text class="nav-text nav-text-inactive">日记</text>
			</view>
			<view class="nav-item" @tap="navigateToSettings">
				<text class="nav-emoji nav-emoji-inactive">⚙️</text>
				<text class="nav-text nav-text-inactive">设置</text>
			</view>
		</view>
	</view>
</template>

<script>
import DataManager from '@/utils/dataManager.js'

export default {
	data() {
		return {
					todayStats: {
			expense: 0,
			income: 0,
			transactions: 0
		},
		loading: false,
		recentActivities: []
		}
	},
	
	async onLoad() {
		await Promise.all([
			this.loadTodayStats(),
			this.loadRecentActivities()
		])
	},
	
	async onShow() {
		// 页面显示时刷新今日统计（从记账页面返回时）
		await Promise.all([
			this.loadTodayStats(),
			this.loadRecentActivities()
		])
	},
	
	methods: {
		/**
		 * 加载今日统计数据
		 */
		async loadTodayStats() {
			try {
				this.loading = true
				
				// 获取今日统计数据
				const stats = await DataManager.getStatistics('daily')
				
				this.todayStats = {
					expense: stats.totalExpense,
					income: stats.totalIncome,
					transactions: stats.transactionCount
				}
				
				console.log('[HomePage] 今日统计加载完成:', this.todayStats)
				
			} catch (error) {
				console.error('[HomePage] 今日统计加载失败:', error)
				// 静默失败，不影响页面显示
			} finally {
				this.loading = false
			}
		},
		
		/**
		 * 获取支出进度条百分比
		 */
		getExpenseProgress() {
			// 简单的进度计算，可以基于预算或者历史平均值
			const maxExpense = 200 // 假设日预算200元
			const progress = Math.min((this.todayStats.expense / maxExpense) * 100, 100)
			return `${progress}%`
		},
		
		/**
		 * 加载近期活动数据
		 */
		async loadRecentActivities() {
			try {
				// 获取最近的交易记录作为活动
				const result = await DataManager.getTransactions({
					limit: 5, // 最近5条
					offset: 0
				})
				
				this.recentActivities = result.data.map(transaction => {
					return {
						id: transaction.id,
						type: transaction.type,
						title: transaction.note || `${transaction.categoryName}消费`,
						timeText: this.formatActivityTime(transaction.date),
						description: `${transaction.type === 'expense' ? '支出' : '收入'} ¥${transaction.amount.toFixed(2)}`
					}
				})
				
				console.log('[HomePage] 近期活动加载完成:', this.recentActivities.length)
				
			} catch (error) {
				console.error('[HomePage] 近期活动加载失败:', error)
				// 静默失败，不影响页面显示
			}
		},
		
		/**
		 * 格式化活动时间
		 */
		formatActivityTime(dateString) {
			const date = new Date(dateString)
			const now = new Date()
			const diffTime = now - date
			const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
			const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
			
			if (diffHours < 1) {
				const diffMinutes = Math.floor(diffTime / (1000 * 60))
				return diffMinutes < 1 ? '刚刚' : `${diffMinutes}分钟前`
			} else if (diffHours < 24) {
				return `${diffHours}小时前`
			} else if (diffDays === 1) {
				return '昨天'
			} else if (diffDays < 7) {
				return `${diffDays}天前`
			} else {
				return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
			}
		},
		
		/**
		 * 获取活动点样式类名
		 */
		getActivityDotClass(type) {
			return type === 'expense' ? 'dot-primary' : 'dot-secondary'
		},
		
		navigateToAccounting() {
			// 快速入口直接跳转到添加记账页面
			uni.navigateTo({
				url: '/pages/accounting/add'
			})
		},
		
		navigateToAccountingHome() {
			// 底部导航跳转到记账主页
			uni.navigateTo({
				url: '/pages/accounting/index'
			})
		},
		
		navigateToDiary() {
			uni.showToast({
				title: '日记功能开发中',
				icon: 'none'
			})
		},
		
		navigateToTodo() {
			uni.showToast({
				title: '待办功能开发中',
				icon: 'none'
			})
		},
		
		navigateToSettings() {
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none'
			})
		}
	}
}
</script>

<style>
/* 通用样式 */
.page-container {
	min-height: 100vh;
	background: #FFFFFF;
	padding: 0 48rpx;
	position: relative;
}

/* 玻璃拟态效果 */
.glass-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 138, 101, 0.2);
	box-shadow: 0 8rpx 32rpx rgba(255, 138, 101, 0.15);
}



/* 头部问候区域 */
.header-section {
	padding-top: 48rpx;
	padding-bottom: 48rpx;
}

.greeting-area {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 48rpx;
}

.greeting-text {
	flex: 1;
}

.greeting-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #1F2937;
	display: block;
	margin-bottom: 8rpx;
}

.greeting-subtitle {
	font-size: 28rpx;
	color: #6B7280;
	display: block;
}

.sun-icon {
	width: 96rpx;
	height: 96rpx;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	border-radius: 32rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.sun-emoji {
	font-size: 48rpx;
}

.animate-float {
	animation: float 3s ease-in-out infinite;
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10rpx); }
}

/* 日期卡片 */
.date-card {
	border-radius: 32rpx;
	padding: 32rpx;
	margin-bottom: 48rpx;
}

.date-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.date-left {
	flex: 1;
}

.date-number {
	font-size: 60rpx;
	font-weight: bold;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	background-clip: text;
	-webkit-background-clip: text;
	color: transparent;
	display: block;
	margin-bottom: 8rpx;
}

.date-desc {
	font-size: 28rpx;
	color: #6B7280;
	display: block;
}

.weather-info {
	text-align: right;
}

.temperature {
	font-size: 36rpx;
	font-weight: 600;
	color: #FF8A65;
	display: block;
	margin-bottom: 4rpx;
}

.weather-desc {
	font-size: 24rpx;
	color: #9CA3AF;
	display: block;
}

/* 快速功能入口 */
.quick-actions {
	padding-bottom: 48rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
	display: block;
	margin-bottom: 32rpx;
}

.actions-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24rpx;
}

.action-item {
	border-radius: 32rpx;
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	transition: transform 0.2s;
}

.action-item:active {
	transform: scale(0.95);
}

.action-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
	transition: transform 0.2s;
}

.action-item:hover .action-icon {
	transform: scale(1.1);
}

.accounting-icon {
	background: linear-gradient(135deg, #FF8A65, #FFAB91);
}

.diary-icon {
	background: linear-gradient(135deg, #FFB74D, #FF8A65);
}

.todo-icon {
	background: linear-gradient(135deg, #FFAB91, #FFB74D);
}

.icon-emoji {
	font-size: 48rpx;
}

.action-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #374151;
	display: block;
	margin-bottom: 4rpx;
}

.action-subtitle {
	font-size: 24rpx;
	color: #9CA3AF;
	display: block;
}

/* 今日数据统计 */
.daily-stats {
	padding-bottom: 48rpx;
}

.stats-card {
	border-radius: 32rpx;
	padding: 40rpx;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 32rpx;
}

.stat-item {
	text-align: center;
}

.stat-divider {
	border-left: 1px solid #E5E7EB;
	border-right: 1px solid #E5E7EB;
}

.stat-number {
	font-size: 48rpx;
	font-weight: bold;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	background-clip: text;
	-webkit-background-clip: text;
	color: transparent;
	display: block;
	margin-bottom: 8rpx;
}

.number-gradient {
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	background-clip: text;
	-webkit-background-clip: text;
	color: transparent;
}

.stat-label {
	font-size: 24rpx;
	color: #9CA3AF;
	display: block;
	margin-bottom: 16rpx;
}

.progress-bar {
	width: 100%;
	height: 8rpx;
	background: #E5E7EB;
	border-radius: 4rpx;
	overflow: hidden;
}

.progress-fill {
	width: 75%;
	height: 100%;
	background: linear-gradient(90deg, #FF8A65, #FFB74D);
	border-radius: 4rpx;
}

.progress-dots {
	display: flex;
	justify-content: center;
	gap: 8rpx;
}

.dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
}

.dot-primary {
	background: #FF8A65;
}

.dot-secondary {
	background: #FFB74D;
}

.dot-gray {
	background: #E5E7EB;
}

.dot-accent {
	background: #FFAB91;
}

.heart-icon {
	width: 48rpx;
	height: 48rpx;
	background: #FFAB91;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto;
}

.heart-emoji {
	font-size: 24rpx;
}

/* 近期活动时间线 */
.recent-activities {
	padding-bottom: 160rpx;
}

.activity-list {
	display: flex;
	flex-direction: column;
	gap: 32rpx;
}

.activity-item {
	display: flex;
	align-items: flex-start;
	gap: 24rpx;
}

.activity-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	margin-top: 16rpx;
	flex-shrink: 0;
}

.activity-content {
	flex: 1;
}

.activity-card {
	border-radius: 24rpx;
	padding: 24rpx;
}

.activity-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8rpx;
}

.activity-title {
	font-size: 28rpx;
	font-weight: 500;
	color: #374151;
	display: block;
}

.activity-time {
	font-size: 24rpx;
	color: #9CA3AF;
	display: block;
}

.activity-desc {
	font-size: 24rpx;
	color: #6B7280;
	display: block;
}

/* 活动空状态 */
.activity-empty {
	text-align: center;
	padding: 60rpx 40rpx;
	background: rgba(255, 255, 255, 0.25);
	border-radius: 24rpx;
	border: 1px solid rgba(255, 255, 255, 0.18);
}

.activity-empty .empty-icon {
	font-size: 80rpx;
	margin-bottom: 24rpx;
}

.activity-empty .empty-text {
	display: block;
	font-size: 28rpx;
	color: #6B7280;
	margin-bottom: 12rpx;
}

.activity-empty .empty-hint {
	display: block;
	font-size: 24rpx;
	color: #9CA3AF;
}

/* 底部导航栏 */
.bottom-navigation {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(20px);
	border-top: 1px solid #E5E7EB;
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 24rpx;
	z-index: 100;
}

.nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx;
	cursor: pointer;
}

.nav-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.nav-icon-active {
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
}

.nav-emoji {
	font-size: 32rpx;
}

.nav-emoji-inactive {
	font-size: 32rpx;
	opacity: 0.6;
}

.nav-text {
	font-size: 24rpx;
	font-weight: 500;
}

.nav-text-active {
	color: #FF8A65;
}

.nav-text-inactive {
	color: #9CA3AF;
}

.nav-active {
	opacity: 1;
}
</style>