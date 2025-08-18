<template>
	<view class="page-container">
		<!-- 头部区域 -->
		<view class="header-section">
			<view class="header-top">
				<view class="back-btn" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="header-title">{{ pageTitle }}</text>
				<view class="filter-btn" @tap="showFilter">
					<text class="filter-icon">🔍</text>
				</view>
			</view>
		</view>

		<!-- 当期概览 -->
		<view class="overview-section">
			<view class="overview-card">
				<view class="overview-header">
					<text class="overview-title">{{ periodTitle }}</text>
					<text class="record-count">{{ records.length }}笔记录</text>
				</view>
				<view class="amount-summary">
					<view class="summary-item">
						<text class="summary-amount income">¥{{ totalIncome }}</text>
						<text class="summary-label">收入</text>
					</view>
					<view class="summary-item">
						<text class="summary-amount expense">¥{{ totalExpense }}</text>
						<text class="summary-label">支出</text>
					</view>
				</view>
				<view class="net-amount-section">
					<view class="net-amount-row">
						<text class="net-label">{{ netAmount >= 0 ? '净收入' : '净支出' }}</text>
						<text class="net-amount" :class="{ positive: netAmount >= 0, negative: netAmount < 0 }">
							{{ netAmount >= 0 ? '+' : '' }}¥{{ Math.abs(netAmount).toFixed(2) }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 筛选标签 -->
		<view class="filter-section">
			<scroll-view class="filter-scroll" scroll-x>
				<view class="filter-tags">
					<view class="filter-tag" 
						:class="{ active: currentFilter === 'all' }"
						@tap="setFilter('all')">
						<text class="tag-text">全部</text>
					</view>
					<view class="filter-tag" 
						:class="{ active: currentFilter === 'expense' }"
						@tap="setFilter('expense')">
						<text class="tag-text">支出</text>
					</view>
					<view class="filter-tag" 
						:class="{ active: currentFilter === 'income' }"
						@tap="setFilter('income')">
						<text class="tag-text">收入</text>
					</view>
					<view class="filter-tag" 
						:class="{ active: currentFilter === 'food' }"
						@tap="setFilter('food')">
						<text class="tag-text">餐饮</text>
					</view>
					<view class="filter-tag" 
						:class="{ active: currentFilter === 'transport' }"
						@tap="setFilter('transport')">
						<text class="tag-text">交通</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 交易记录列表 -->
		<view class="records-section">
			<view class="record-item" 
				v-for="record in filteredRecords" 
				:key="record.id"
				@tap="editRecord(record)">
				<view class="record-content">
					<view class="record-left">
						<view class="record-icon" :style="{ background: record.iconBg }">
							<text class="record-emoji">{{ record.emoji }}</text>
						</view>
						<view class="record-info">
							<text class="record-title">{{ record.title }}</text>
							<text class="record-subtitle">{{ record.category }} · {{ record.time }}</text>
						</view>
					</view>
					<view class="record-right">
						<text class="record-amount" :class="{ income: record.type === 'income', expense: record.type === 'expense' }">
							{{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount }}
						</text>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="filteredRecords.length === 0">
				<view class="empty-icon">
					<text class="empty-emoji">✅</text>
				</view>
				<text class="empty-title">{{ emptyStateTitle }}</text>
				<text class="empty-subtitle">{{ emptyStateSubtitle }}</text>
			</view>
		</view>

		<!-- 底部导航 -->
		<view class="bottom-nav">
			<view class="nav-item" @tap="goToHome">
				<text class="nav-emoji">🏠</text>
				<text class="nav-label">首页</text>
			</view>
			<view class="nav-item active" @tap="goToAccounting">
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
			timeType: 'today', // 从路由参数获取
			currentFilter: 'all',
			loading: true,
			
			// 真实数据
			transactions: [],
			categories: [],
			accounts: []
		}
	},
	
	async onLoad(options) {
		if (options.type) {
			this.timeType = options.type;
		}
		await this.initializeData()
	},
	
	async onShow() {
		// 页面显示时刷新数据
		if (!this.loading) {
			await this.loadTransactions()
		}
	},
	computed: {
		pageTitle() {
			const titles = {
				today: '今天账目',
				week: '本周账目',
				month: '本月账目',
				year: '今年账目'
			};
			return titles[this.timeType] || '账目详情';
		},
		
		periodTitle() {
			const now = new Date()
			const titles = {
				today: this.formatDate(now),
				week: this.getWeekRange(now),
				month: `${now.getMonth() + 1}月`,
				year: `${now.getFullYear()}年`
			};
			return titles[this.timeType] || '';
		},
		
		records() {
			// 根据时间类型过滤交易记录
			return this.transactions.map(transaction => {
				const category = this.categories.find(c => c.id === transaction.categoryId)
				const account = this.accounts.find(a => a.id === transaction.accountId)
				
				return {
					id: transaction.id,
					type: transaction.type,
					amount: transaction.amount.toFixed(2),
					title: transaction.description || (category ? category.name : '未知分类'),
					category: category ? category.name : '未知分类',
					time: this.formatTime(transaction.date),
					emoji: category ? category.icon : '💰',
					iconBg: this.getCategoryColor(category ? category.name : '其他'),
					tags: this.getRecordTags(transaction, category),
					originalData: transaction
				}
			});
		},
		
		filteredRecords() {
			if (this.currentFilter === 'all') {
				return this.records;
			}
			
			return this.records.filter(record => {
				// 根据筛选类型过滤
				switch(this.currentFilter) {
					case 'expense':
					case 'income':
						return record.type === this.currentFilter
					case 'food':
						return record.tags.includes('food')
					case 'transport':
						return record.tags.includes('transport')
					default:
						return record.tags.includes(this.currentFilter);
				}
			});
		},
		
		totalIncome() {
			return this.records
				.filter(r => r.type === 'income')
				.reduce((sum, r) => sum + parseFloat(r.amount), 0)
				.toFixed(2);
		},
		
		totalExpense() {
			return this.records
				.filter(r => r.type === 'expense')
				.reduce((sum, r) => sum + parseFloat(r.amount), 0)
				.toFixed(2);
		},
		
		netAmount() {
			return parseFloat(this.totalIncome) - parseFloat(this.totalExpense);
		},
		
		emptyStateTitle() {
			const filterTitles = {
				all: `${this.periodTitle}的记录就这些了`,
				expense: '暂无支出记录',
				income: '暂无收入记录',
				food: '暂无餐饮记录',
				transport: '暂无交通记录'
			};
			return filterTitles[this.currentFilter] || '暂无记录';
		},
		
		emptyStateSubtitle() {
			return '继续记录让数据更完整';
		}
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
				
				// 并行加载基础数据
				const [categories, accounts] = await Promise.all([
					DataManager.getCategories(),
					DataManager.getAccounts()
				])
				
				this.categories = categories
				this.accounts = accounts
				
				// 加载交易记录
				await this.loadTransactions()
				
				console.log('[DetailPage] 数据加载完成')
				
			} catch (error) {
				console.error('[DetailPage] 数据初始化失败:', error)
				uni.showToast({
					title: '数据加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		/**
		 * 加载交易记录
		 */
		async loadTransactions() {
			try {
				// 根据timeType获取对应时间范围的数据
				const dateRange = this.getDateRange(this.timeType)
				const transactions = await DataManager.getTransactions({
					startDate: dateRange.startDate.toISOString(),
					endDate: dateRange.endDate.toISOString(),
					limit: 1000
				})
				
				this.transactions = transactions.data || []
				console.log('[DetailPage] 交易记录加载完成:', this.transactions.length, '条')
				
			} catch (error) {
				console.error('[DetailPage] 交易记录加载失败:', error)
				this.transactions = []
			}
		},
		
		/**
		 * 根据时间类型获取日期范围
		 */
		getDateRange(timeType) {
			const now = new Date()
			let startDate, endDate
			
			switch (timeType) {
				case 'today':
					startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
					endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
					break
					
				case 'week':
					// 本周周一到周日
					const currentDay = now.getDay()
					const mondayOffset = currentDay === 0 ? 6 : currentDay - 1
					const monday = new Date(now)
					monday.setDate(now.getDate() - mondayOffset)
					startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
					endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
					break
					
				case 'month':
					startDate = new Date(now.getFullYear(), now.getMonth(), 1)
					endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
					break
					
				case 'year':
					startDate = new Date(now.getFullYear(), 0, 1)
					endDate = new Date(now.getFullYear() + 1, 0, 1)
					break
					
				default:
					// 默认为今天
					startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
					endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
			}
			
			return { startDate, endDate }
		},
		
		/**
		 * 格式化日期显示
		 */
		formatDate(date) {
			const month = date.getMonth() + 1
			const day = date.getDate()
			return `${month}月${day}日`
		},
		
		/**
		 * 获取周范围显示
		 */
		getWeekRange(date) {
			const currentDay = date.getDay()
			const mondayOffset = currentDay === 0 ? 6 : currentDay - 1
			const monday = new Date(date)
			monday.setDate(date.getDate() - mondayOffset)
			const sunday = new Date(monday)
			sunday.setDate(monday.getDate() + 6)
			
			return `${this.formatDate(monday)}-${this.formatDate(sunday)}`
		},
		
		/**
		 * 格式化时间显示
		 */
		formatTime(dateString) {
			const date = new Date(dateString)
			const hours = date.getHours().toString().padStart(2, '0')
			const minutes = date.getMinutes().toString().padStart(2, '0')
			return `${hours}:${minutes}`
		},
		
		/**
		 * 获取分类颜色
		 */
		getCategoryColor(categoryName) {
			const colorMap = {
				'餐饮': 'linear-gradient(135deg, #FF8A65, #FFB74D)',
				'购物': 'linear-gradient(135deg, #F06292, #F48FB1)',
				'交通': 'linear-gradient(135deg, #64B5F6, #90CAF9)',
				'娱乐': 'linear-gradient(135deg, #9C27B0, #BA68C8)',
				'医疗': 'linear-gradient(135deg, #66BB6A, #81C784)',
				'教育': 'linear-gradient(135deg, #3F51B5, #5C6BC0)',
				'居住': 'linear-gradient(135deg, #FFB74D, #FFCC02)',
				'生活缴费': 'linear-gradient(135deg, #FFC107, #FFD54F)',
				'工资': 'linear-gradient(135deg, #4CAF50, #66BB6A)',
				'投资': 'linear-gradient(135deg, #2196F3, #42A5F5)',
				'其他': 'linear-gradient(135deg, #9E9E9E, #BDBDBD)'
			}
			return colorMap[categoryName] || colorMap['其他']
		},
		
		/**
		 * 获取记录标签
		 */
		getRecordTags(transaction, category) {
			const tags = [transaction.type]
			
			if (category) {
				// 根据分类名称添加标签
				switch (category.name) {
					case '餐饮':
						tags.push('food')
						break
					case '交通':
						tags.push('transport')
						break
					// 可以根据需要添加更多标签映射
				}
			}
			
			return tags
		},
		goBack() {
			uni.navigateBack();
		},
		goToHome() {
			uni.reLaunch({
				url: '/pages/index/index'
			});
		},
		goToAccounting() {
			uni.navigateTo({
				url: '/pages/accounting/index'
			});
		},
		goToDiary() {
			uni.showToast({
				title: '日记功能开发中',
				icon: 'none'
			});
		},
		goToSettings() {
			uni.showToast({
				title: '设置功能开发中',
				icon: 'none'
			});
		},
		setFilter(filter) {
			this.currentFilter = filter;
		},
		showFilter() {
			uni.showToast({
				title: '筛选功能开发中',
				icon: 'none'
			});
		},
		editRecord(record) {
			console.log('[DetailPage] 编辑记录:', record)
			uni.navigateTo({
				url: `/pages/accounting/edit?id=${record.id}`
			});
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

.back-btn, .filter-btn {
	width: 80rpx;
	height: 80rpx;
	background: #F3F4F6;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	font-size: 40rpx;
	color: #6B7280;
	font-weight: 300;
}

.filter-icon {
	font-size: 40rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
}

/* 当期概览 */
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

.record-count {
	font-size: 28rpx;
	color: #6B7280;
}

.amount-summary {
	display: flex;
	gap: 32rpx;
	margin-bottom: 32rpx;
}

.summary-item {
	flex: 1;
	text-align: center;
}

.summary-amount.income {
	display: block;
	color: #66BB6A;
	font-size: 40rpx;
	font-weight: bold;
}

.summary-amount.expense {
	display: block;
	color: #EF5350;
	font-size: 40rpx;
	font-weight: bold;
}

.summary-label {
	display: block;
	color: #6B7280;
	font-size: 28rpx;
	margin-top: 8rpx;
}

.net-amount-section {
	padding-top: 32rpx;
	border-top: 1px solid #E5E7EB;
}

.net-amount-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.net-label {
	color: #6B7280;
	font-size: 32rpx;
}

.net-amount {
	font-size: 40rpx;
	font-weight: bold;
}

.net-amount.positive {
	color: #66BB6A;
}

.net-amount.negative {
	color: #EF5350;
}

/* 筛选标签 */
.filter-section {
	padding: 0 48rpx 32rpx 48rpx;
}

.filter-scroll {
	width: 100%;
}

.filter-tags {
	display: flex;
	gap: 16rpx;
	white-space: nowrap;
}

.filter-tag {
	padding: 16rpx 32rpx;
	background: #F3F4F6;
	border-radius: 50rpx;
	flex-shrink: 0;
}

.filter-tag.active {
	background: #FF8A65;
}

.tag-text {
	color: #6B7280;
	font-size: 28rpx;
	font-weight: 500;
}

.filter-tag.active .tag-text {
	color: white;
}

/* 记录列表 */
.records-section {
	padding: 0 48rpx;
}

.record-item {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.record-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.record-left {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.record-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.record-emoji {
	font-size: 48rpx;
}

.record-info {
	display: flex;
	flex-direction: column;
}

.record-title {
	font-weight: 500;
	color: #1F2937;
	font-size: 32rpx;
}

.record-subtitle {
	color: #6B7280;
	font-size: 28rpx;
	margin-top: 4rpx;
}

.record-right {
	text-align: right;
}

.record-amount {
	font-weight: 600;
	font-size: 32rpx;
}

.record-amount.income {
	color: #66BB6A;
}

.record-amount.expense {
	color: #EF5350;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 64rpx 0;
}

.empty-icon {
	width: 128rpx;
	height: 128rpx;
	background: #F3F4F6;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 24rpx auto;
}

.empty-emoji {
	font-size: 64rpx;
}

.empty-title {
	display: block;
	color: #6B7280;
	font-size: 28rpx;
	margin-bottom: 8rpx;
}

.empty-subtitle {
	display: block;
	color: #9CA3AF;
	font-size: 24rpx;
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
</style>