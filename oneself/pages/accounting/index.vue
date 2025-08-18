<template>
	<view class="page-container">
		<!-- 头部区域 -->
		<view class="header-section">
			<view class="header-top">
				<text class="header-title">我的账本</text>
				<view class="add-btn" @tap="goToAdd">
					<text class="add-icon">+</text>
				</view>
			</view>
		</view>

		<!-- 总体概览 -->
		<view class="overview-section">
			<view class="overview-card">
				<view class="overview-header">
					<text class="overview-title">总览</text>
					<text class="detail-link" @tap="goToStats">详细统计 ></text>
				</view>
				<view class="balance-section">
					<text class="balance-amount">¥{{ statistics.balance.toFixed(2) }}</text>
					<text class="balance-label">本月结余</text>
				</view>
				<view class="income-expense-row">
					<view class="income-item">
						<text class="income-amount">¥{{ statistics.totalIncome.toFixed(2) }}</text>
						<text class="income-label">本月收入</text>
					</view>
					<view class="expense-item">
						<text class="expense-amount">¥{{ statistics.totalExpense.toFixed(2) }}</text>
						<text class="expense-label">本月支出</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 查看账目 -->
		<view class="time-dimension-section">
			<text class="section-title">查看账目</text>
			<view class="time-cards">
				<!-- 今天 -->
				<view class="time-card" @tap="goToDetail('today')">
					<view class="time-card-content">
						<view class="time-card-left">
							<view class="time-icon today-icon">
								<text class="icon-emoji">📅</text>
							</view>
							<view class="time-info">
								<text class="time-title">今天</text>
								<text class="time-subtitle">{{ formattedDates.today }}</text>
							</view>
						</view>
						<view class="time-card-right">
							<view class="count-display">
								<text class="income-count">+¥{{ timeStats.today.income.toFixed(0) }}</text>
								<text class="expense-count">-¥{{ timeStats.today.expense.toFixed(0) }}</text>
							</view>
							<text class="chevron-icon">›</text>
						</view>
					</view>
				</view>

				<!-- 本周 -->
				<view class="time-card" @tap="goToDetail('week')">
					<view class="time-card-content">
						<view class="time-card-left">
							<view class="time-icon week-icon">
								<text class="icon-emoji">📊</text>
							</view>
							<view class="time-info">
								<text class="time-title">本周</text>
								<text class="time-subtitle">{{ formattedDates.week }}</text>
							</view>
						</view>
						<view class="time-card-right">
							<view class="count-display">
								<text class="income-count">+¥{{ timeStats.week.income.toFixed(0) }}</text>
								<text class="expense-count">-¥{{ timeStats.week.expense.toFixed(0) }}</text>
							</view>
							<text class="chevron-icon">›</text>
						</view>
					</view>
				</view>

				<!-- 本月 -->
				<view class="time-card" @tap="goToDetail('month')">
					<view class="time-card-content">
						<view class="time-card-left">
							<view class="time-icon month-icon">
								<text class="icon-emoji">📆</text>
							</view>
							<view class="time-info">
								<text class="time-title">本月</text>
								<text class="time-subtitle">{{ formattedDates.month }}</text>
							</view>
						</view>
						<view class="time-card-right">
							<view class="count-display">
								<text class="income-count">+¥{{ timeStats.month.income.toFixed(0) }}</text>
								<text class="expense-count">-¥{{ timeStats.month.expense.toFixed(0) }}</text>
							</view>
							<text class="chevron-icon">›</text>
						</view>
					</view>
				</view>

				<!-- 今年 -->
				<view class="time-card" @tap="goToDetail('year')">
					<view class="time-card-content">
						<view class="time-card-left">
							<view class="time-icon year-icon">
								<text class="icon-emoji">📈</text>
							</view>
							<view class="time-info">
								<text class="time-title">今年</text>
								<text class="time-subtitle">{{ formattedDates.year }}</text>
							</view>
						</view>
						<view class="time-card-right">
							<view class="count-display">
								<text class="income-count">+¥{{ timeStats.year.income.toFixed(0) }}</text>
								<text class="expense-count">-¥{{ timeStats.year.expense.toFixed(0) }}</text>
							</view>
							<text class="chevron-icon">›</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 最近交易记录 -->
		<view class="recent-transactions-section">
			<view class="section-header">
				<text class="section-title">最近记录</text>
				<text class="view-all-link" @tap="goToDetail('recent')">查看全部 ></text>
			</view>
			
			<!-- 加载状态 -->
			<view class="loading-container" v-if="loading">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 交易记录列表 -->
			<view class="transaction-list" v-else-if="recentTransactions.length > 0">
				<view class="transaction-item" 
					v-for="transaction in recentTransactions" 
					:key="transaction.id"
					@tap="goToTransactionDetail(transaction.id)">
					<view class="transaction-content">
						<view class="transaction-left">
							<view class="category-icon" :style="{ backgroundColor: getTransactionColor(transaction) }">
								<text class="category-emoji">{{ transaction.categoryIcon }}</text>
							</view>
							<view class="transaction-info">
								<text class="transaction-note">{{ transaction.note || transaction.categoryName }}</text>
								<text class="transaction-meta">{{ transaction.categoryName }} · {{ formatTransactionDate(transaction.date) }}</text>
							</view>
						</view>
						<view class="transaction-right">
							<text class="transaction-amount" 
								:style="{ color: transaction.type === 'expense' ? '#EF5350' : '#66BB6A' }">
								{{ transaction.type === 'expense' ? '-' : '+' }}¥{{ transaction.amount.toFixed(2) }}
							</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-else>
				<view class="empty-icon">📝</view>
				<text class="empty-text">还没有记录</text>
				<text class="empty-hint">点击右上角 + 开始记账</text>
			</view>
		</view>

		<!-- 快速操作 -->
		<view class="quick-actions-section">
			<text class="section-title">快速操作</text>
			<view class="quick-actions">
				<view class="quick-action" @tap="goToAdd">
					<view class="quick-icon add-quick-icon">
						<text class="add-icon">+</text>
					</view>
					<text class="quick-label">记一笔</text>
				</view>
				<view class="quick-action" @tap="goToStats">
					<view class="quick-icon stats-icon">
						<text class="icon-emoji">📊</text>
					</view>
					<text class="quick-label">统计分析</text>
				</view>
			</view>
		</view>

		<!-- 底部导航 -->
		<view class="bottom-nav">
			<view class="nav-item" @tap="goToHome">
				<text class="nav-emoji">🏠</text>
				<text class="nav-label">首页</text>
			</view>
			<view class="nav-item active">
				<view class="nav-icon-active">
					<text class="nav-emoji">💰</text>
				</view>
				<text class="nav-label-active">记账</text>
			</view>
			<view class="nav-item" @tap="goToDiary">
				<text class="nav-emoji">📖</text>
				<text class="nav-label">日记</text>
			</view>
			<view class="nav-item" @tap="goToSettings">
				<text class="nav-emoji">⚙️</text>
				<text class="nav-label">设置</text>
			</view>
		</view>
	</view>
</template>

<script>
import DataManager from '@/utils/dataManager.js'

export default {
	data() {
		return {
			loading: true,
					statistics: {
			totalIncome: 0,
			totalExpense: 0,
			balance: 0,
			transactionCount: 0
		},
		recentTransactions: [],
		refreshing: false,
		timeStats: {
			today: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 },
			week: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 },
			month: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 },
			year: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 }
		}
		}
	},
	
	computed: {
		/**
		 * 格式化当前日期显示
		 */
		formattedDates() {
			const now = new Date()
			const startOfWeek = new Date(now)
			startOfWeek.setDate(now.getDate() - now.getDay())
			const endOfWeek = new Date(startOfWeek)
			endOfWeek.setDate(startOfWeek.getDate() + 6)
			
			return {
				today: `${now.getMonth() + 1}月${now.getDate()}日`,
				week: `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日-${endOfWeek.getDate()}日`,
				month: `${now.getMonth() + 1}月`,
				year: `${now.getFullYear()}年`
			}
		}
	},
	
	async onLoad() {
		await this.initializeData()
	},
	
	async onShow() {
		// 页面显示时刷新数据（从添加页面返回时）
		if (!this.loading) {
			await this.refreshData()
		}
	},
	
	// 下拉刷新
	async onPullDownRefresh() {
		await this.refreshData()
		uni.stopPullDownRefresh()
	},
	
	methods: {
		/**
		 * 初始化页面数据
		 */
		async initializeData() {
			try {
				this.loading = true
				
				// 初始化数据管理器
				await DataManager.initialize()
				
							// 并行加载统计数据和最近交易记录
			await Promise.all([
				this.loadStatistics(),
				this.loadRecentTransactions(),
				this.loadTimeStats()
			])
				
				console.log('[AccountingIndex] 数据加载完成')
				
			} catch (error) {
				console.error('[AccountingIndex] 数据初始化失败:', error)
				uni.showToast({
					title: '数据加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		/**
		 * 刷新数据
		 */
		async refreshData() {
			try {
				this.refreshing = true
				
							await Promise.all([
				this.loadStatistics(),
				this.loadRecentTransactions(),
				this.loadTimeStats()
			])
				
				console.log('[AccountingIndex] 数据刷新完成')
				
			} catch (error) {
				console.error('[AccountingIndex] 数据刷新失败:', error)
				uni.showToast({
					title: '刷新失败',
					icon: 'none'
				})
			} finally {
				this.refreshing = false
			}
		},
		
		/**
		 * 加载统计数据
		 */
		async loadStatistics() {
			try {
				const stats = await DataManager.getStatistics('monthly')
				this.statistics = {
					totalIncome: stats.totalIncome,
					totalExpense: stats.totalExpense,
					balance: stats.balance,
					transactionCount: stats.transactionCount
				}
				
				console.log('[AccountingIndex] 统计数据加载完成:', this.statistics)
				
			} catch (error) {
				console.error('[AccountingIndex] 统计数据加载失败:', error)
			}
		},
		
		/**
		 * 加载最近交易记录
		 */
		async loadRecentTransactions() {
			try {
				const result = await DataManager.getTransactions({
					limit: 5, // 只显示最近5条
					offset: 0
				})
				
				this.recentTransactions = result.data
				
				console.log('[AccountingIndex] 最近交易记录加载完成:', result.data.length)
				
			} catch (error) {
				console.error('[AccountingIndex] 最近交易记录加载失败:', error)
			}
		},
		
		/**
		 * 加载时间维度统计数据
		 */
		async loadTimeStats() {
			try {
				// 并行加载各个时间维度的统计
				const [todayStats, weekStats, monthStats, yearStats] = await Promise.all([
					DataManager.getStatistics('daily'),
					DataManager.getStatistics('weekly'),
					DataManager.getStatistics('monthly'),
					DataManager.getStatistics('yearly')
				])
				
				this.timeStats = {
					today: {
						income: todayStats.totalIncome,
						expense: todayStats.totalExpense,
						incomeCount: todayStats.categoryStats.filter(c => c.type === 'income').reduce((sum, c) => sum + c.count, 0),
						expenseCount: todayStats.categoryStats.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.count, 0)
					},
					week: {
						income: weekStats.totalIncome,
						expense: weekStats.totalExpense,
						incomeCount: weekStats.categoryStats.filter(c => c.type === 'income').reduce((sum, c) => sum + c.count, 0),
						expenseCount: weekStats.categoryStats.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.count, 0)
					},
					month: {
						income: monthStats.totalIncome,
						expense: monthStats.totalExpense,
						incomeCount: monthStats.categoryStats.filter(c => c.type === 'income').reduce((sum, c) => sum + c.count, 0),
						expenseCount: monthStats.categoryStats.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.count, 0)
					},
					year: {
						income: yearStats.totalIncome,
						expense: yearStats.totalExpense,
						incomeCount: yearStats.categoryStats.filter(c => c.type === 'income').reduce((sum, c) => sum + c.count, 0),
						expenseCount: yearStats.categoryStats.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.count, 0)
					}
				}
				
				console.log('[AccountingIndex] 时间统计数据加载完成:', this.timeStats)
				
			} catch (error) {
				console.error('[AccountingIndex] 时间统计数据加载失败:', error)
			}
		},
		

		
		/**
		 * 格式化交易日期
		 */
		formatTransactionDate(dateString) {
			const date = new Date(dateString)
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
			const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
			
			const diffTime = today - targetDate
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
			
			if (diffDays === 0) {
				return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
			} else if (diffDays === 1) {
				return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
			} else if (diffDays < 7) {
				return `${diffDays}天前`
			} else {
				return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
			}
		},
		
		/**
		 * 获取交易颜色（基于分类）
		 */
		getTransactionColor(transaction) {
			// 可以根据分类返回不同颜色，这里简化处理
			return transaction.type === 'expense' ? '#FF8A65' : '#66BB6A'
		},
		
		/**
		 * 跳转到交易详情
		 */
		goToTransactionDetail(transactionId) {
			uni.navigateTo({
				url: `/pages/accounting/edit?id=${transactionId}`
			})
		},
		
		goToHome() {
			uni.reLaunch({
				url: '/pages/index/index'
			})
		},
		
		goToAdd() {
			uni.navigateTo({
				url: '/pages/accounting/add'
			})
		},
		
		goToDetail(type) {
			uni.navigateTo({
				url: `/pages/accounting/detail?type=${type}`
			})
		},
		
		goToStats() {
			uni.navigateTo({
				url: '/pages/accounting/stats'
			})
		},
		
		goToDiary() {
			uni.showToast({
				title: '日记功能开发中',
				icon: 'none'
			})
		},
		
		goToSettings() {
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none'
			})
		}
	}
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
	min-height: 100vh;
	background: #FFFFFF;
	padding-bottom: 160rpx;
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

.header-title {
	font-size: 48rpx;
	font-weight: bold;
	color: #1F2937;
}

.add-btn {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-icon {
	color: white;
	font-size: 32rpx;
	font-weight: bold;
}

/* 总体概览 */
.overview-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.overview-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 40rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.overview-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32rpx;
}

.overview-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
}

.detail-link {
	color: #FF8A65;
	font-size: 28rpx;
	font-weight: 500;
}

.balance-section {
	text-align: center;
	margin-bottom: 32rpx;
}

.balance-amount {
	display: block;
	font-size: 72rpx;
	font-weight: bold;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	-webkit-background-clip: text;
	color: transparent;
	background-clip: text;
}

.balance-label {
	display: block;
	color: #6B7280;
	font-size: 28rpx;
	margin-top: 8rpx;
}

.income-expense-row {
	display: flex;
	gap: 32rpx;
}

.income-item, .expense-item {
	flex: 1;
	text-align: center;
}

.income-amount {
	display: block;
	color: #66BB6A;
	font-size: 40rpx;
	font-weight: bold;
}

.expense-amount {
	display: block;
	color: #EF5350;
	font-size: 40rpx;
	font-weight: bold;
}

.income-label, .expense-label {
	display: block;
	color: #6B7280;
	font-size: 28rpx;
	margin-top: 4rpx;
}

/* 时间维度区域 */
.time-dimension-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 32rpx;
	display: block;
}

.time-cards {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.time-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.time-card-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.time-card-left {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.time-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.today-icon {
	background: #DBEAFE;
}

.week-icon {
	background: #D1FAE5;
}

.month-icon {
	background: #FED7AA;
}

.year-icon {
	background: #E0E7FF;
}

.icon-emoji {
	font-size: 48rpx;
}

.time-info {
	display: flex;
	flex-direction: column;
}

.time-title {
	font-weight: 500;
	color: #1F2937;
	font-size: 32rpx;
}

.time-subtitle {
	color: #6B7280;
	font-size: 28rpx;
	margin-top: 4rpx;
}

.time-card-right {
	display: flex;
	align-items: center;
	gap: 32rpx;
}

.count-display {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.income-count {
	color: #66BB6A;
	font-size: 28rpx;
	font-weight: 500;
}

.expense-count {
	color: #EF5350;
	font-size: 28rpx;
	font-weight: 500;
}

.chevron-icon {
	color: #9CA3AF;
	font-size: 40rpx;
	font-weight: 300;
}

/* 快速操作区域 */
.quick-actions-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.quick-actions {
	display: flex;
	gap: 24rpx;
}

.quick-action {
	flex: 1;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	text-align: center;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.quick-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 16rpx auto;
}

.add-quick-icon {
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
}

.stats-icon {
	background: #DBEAFE;
}

.quick-label {
	color: #1F2937;
	font-size: 28rpx;
	font-weight: 500;
}

/* 底部导航 */
.bottom-nav {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(40rpx);
	border-top: 1px solid #E5E7EB;
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 24rpx 0;
}

.nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.nav-emoji {
	font-size: 48rpx;
}

.nav-label {
	color: #9CA3AF;
	font-size: 24rpx;
}

.nav-item.active {
	color: #FF8A65;
}

.nav-icon-active {
	width: 64rpx;
	height: 64rpx;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.nav-icon-active .nav-emoji {
	filter: brightness(0) invert(1);
	font-size: 32rpx;
}

.nav-label-active {
	color: #FF8A65;
	font-size: 24rpx;
	font-weight: 500;
}

/* 最近交易记录 */
.recent-transactions-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32rpx;
}

.view-all-link {
	color: #FF8A65;
	font-size: 28rpx;
	font-weight: 500;
}

.loading-container {
	text-align: center;
	padding: 64rpx 0;
}

.loading-text {
	color: #9CA3AF;
	font-size: 32rpx;
}

.transaction-list {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	overflow: hidden;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.transaction-item {
	padding: 32rpx;
	border-bottom: 1px solid #F9FAFB;
	transition: background 0.2s ease;
}

.transaction-item:last-child {
	border-bottom: none;
}

.transaction-item:active {
	background: #F9FAFB;
}

.transaction-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.transaction-left {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.category-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.category-emoji {
	font-size: 40rpx;
}

.transaction-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.transaction-note {
	font-size: 32rpx;
	font-weight: 500;
	color: #374151;
	max-width: 300rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.transaction-meta {
	font-size: 24rpx;
	color: #9CA3AF;
}

.transaction-right {
	text-align: right;
}

.transaction-amount {
	font-size: 32rpx;
	font-weight: 600;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 80rpx 48rpx;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.empty-icon {
	font-size: 96rpx;
	margin-bottom: 32rpx;
}

.empty-text {
	display: block;
	font-size: 32rpx;
	color: #6B7280;
	margin-bottom: 16rpx;
}

.empty-hint {
	display: block;
	font-size: 24rpx;
	color: #9CA3AF;
}
</style>