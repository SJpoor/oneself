<template>
	<view class="page-container">
		<!-- 头部区域 -->
		<view class="header-section">
			<view class="header-top">
				<view class="back-btn" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="header-title" @longpress="resetPageState">收支统计</text>
				<view class="export-btn" @tap="exportData">
					<text class="export-icon">📤</text>
				</view>
			</view>
		</view>

		<!-- 时间切换 -->
		<view class="time-switch-section">
			<view class="time-switch" :class="{ loading: loading }">
				<view class="time-btn" 
					:class="{ active: currentPeriod === 'week', disabled: loading }" 
					@tap="setPeriod('week')">
					<text class="time-text">本周</text>
				</view>
				<view class="time-btn" 
					:class="{ active: currentPeriod === 'month', disabled: loading }" 
					@tap="setPeriod('month')">
					<text class="time-text">本月</text>
				</view>
				<view class="time-btn" 
					:class="{ active: currentPeriod === 'year', disabled: loading }" 
					@tap="setPeriod('year')">
					<text class="time-text">本年</text>
				</view>
			</view>
			<!-- 加载指示器 -->
			<view class="loading-indicator" v-if="loading">
				<text class="loading-text">正在加载...</text>
			</view>
		</view>

		<!-- 收支概览 -->
		<view class="overview-section">
			<view class="overview-card">
				<text class="overview-title">{{ periodTitle }}概览</text>
				<view class="overview-items">
					<view class="overview-item">
						<view class="overview-indicator income-indicator"></view>
						<text class="overview-label">总收入</text>
						<text class="overview-amount income">¥{{ totalIncomeDisplay }}</text>
					</view>
					<view class="overview-item">
						<view class="overview-indicator expense-indicator"></view>
						<text class="overview-label">总支出</text>
						<text class="overview-amount expense">¥{{ totalExpenseDisplay }}</text>
					</view>
				</view>
				<view class="net-income-section">
					<view class="net-income-row">
						<text class="net-label">净收入</text>
						<text class="net-amount" :class="{ positive: netIncome >= 0, negative: netIncome < 0 }">
							¥{{ netIncomeDisplay }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 支出分类图表 -->
		<view class="chart-section">
			<view class="chart-card">
				<text class="chart-title">支出分类</text>
				
				<!-- 环形图 -->
				<view class="chart-container">
					<view class="donut-chart">
						<view class="chart-center">
							<text class="chart-total" :style="chartTotalStyle">¥{{ chartTotalAmount }}</text>
							<text class="chart-label">总支出</text>
						</view>
						<!-- 动态环形图 -->
						<view class="chart-ring" :style="{ background: chartGradient }"></view>
					</view>
				</view>

				<!-- 分类详情 -->
				<view class="category-details" v-if="expenseCategories.length > 0">
					<view class="category-item" v-for="category in expenseCategories" :key="category.id">
						<view class="category-info">
							<view class="category-color" :style="{ background: category.color }"></view>
							<text class="category-name">{{ category.name }}</text>
						</view>
						<view class="category-stats">
							<text class="category-amount">¥{{ formatNumber(category.amount) }}</text>
							<text class="category-percent">{{ category.percent }}%</text>
						</view>
					</view>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-else>
					<view class="empty-icon">📊</view>
					<text class="empty-text">暂无支出数据</text>
					<text class="empty-hint">开始记账查看分类统计</text>
				</view>
			</view>
		</view>

		<!-- 趋势图表 -->
<!-- 		<view class="trend-section">
			<view class="trend-card">
				<text class="trend-title">支出趋势</text>
				<view class="trend-chart">
					<view class="chart-bars">
						<view class="bar-item" v-for="(bar, index) in trendData" :key="index">
							<view class="bar" :style="{ height: bar.height + 'rpx' }"></view>
						</view>
					</view>
					<view class="chart-labels">
						<text class="chart-label" v-for="(item, index) in trendData" :key="index">
							{{ item.period || chartLabels[index] || '' }}
						</text>
					</view>
				</view>
			</view>
		</view> -->

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
			currentPeriod: 'month',
			loading: true,
			
			// 真实统计数据
			statsData: {
				week: {
					income: 0,
					expense: 0,
					categories: []
				},
				month: {
					income: 0,
					expense: 0,
					categories: []
				},
				year: {
					income: 0,
					expense: 0,
					categories: []
				}
			},
			
			// 趋势数据
			trendData: [],
			
			// 防抖控制
			lastClickTime: 0,
			clickDebounceTime: 500  // 500ms防抖
		}
	},
	
	async onLoad() {
		await this.initializeData()
	},
	
	async onShow() {
		// 页面显示时刷新数据
		if (!this.loading) {
			await this.loadAllStatistics()
		}
	},
	computed: {
		periodTitle() {
			const now = new Date()
			const titles = {
				week: '本周',
				month: `${now.getMonth() + 1}月`,
				year: `${now.getFullYear()}年`
			};
			return titles[this.currentPeriod] || '';
		},
		currentData() {
			return this.statsData[this.currentPeriod];
		},
		totalIncomeDisplay() {
			return this.formatNumber(this.currentData.income);
		},
		totalExpenseDisplay() {
			return this.formatNumber(this.currentData.expense);
		},
		netIncome() {
			return this.currentData.income - this.currentData.expense;
		},
		netIncomeDisplay() {
			return this.formatNumber(Math.abs(this.netIncome));
		},
		expenseCategories() {
			return this.currentData.categories;
		},
		chartLabels() {
			return this.generateChartLabels(this.currentPeriod);
		},
		
		/**
		 * 生成环形图的渐变色
		 */
		chartGradient() {
			const categories = this.currentData.categories
			if (!categories || categories.length === 0) {
				return 'conic-gradient(#E5E7EB 0deg 360deg)'
			}
			
			let gradient = 'conic-gradient('
			let currentDegree = 0
			
			categories.forEach((category, index) => {
				const percent = category.percent / 100
				const nextDegree = currentDegree + (360 * percent)
				
				if (index > 0) gradient += ', '
				gradient += `${category.color} ${currentDegree}deg ${nextDegree}deg`
				
				currentDegree = nextDegree
			})
			
			// 如果总百分比不到100%，用灰色填充剩余部分
			if (currentDegree < 360) {
				gradient += `, #E5E7EB ${currentDegree}deg 360deg`
			}
			
			gradient += ')'
			return gradient
		},
		
		/**
		 * 动态调整总支出显示格式和字体大小
		 */
		chartTotalStyle() {
			const amount = this.currentData.expense || 0
			const amountStr = this.formatChartAmount(amount)
			
			// 根据字符长度动态调整字体大小
			let fontSize = '48rpx'
			if (amountStr.length > 8) {
				fontSize = '32rpx'
			} else if (amountStr.length > 6) {
				fontSize = '40rpx'
			}
			
			return {
				fontSize: fontSize
			}
		},
		
		/**
		 * 格式化图表中心显示的金额
		 */
		chartTotalAmount() {
			return this.formatChartAmount(this.currentData.expense || 0)
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
				
				// 加载所有时间维度的统计数据
				await this.loadAllStatistics()
				
				console.log('[StatsPage] 数据加载完成')
				
			} catch (error) {
				console.error('[StatsPage] 数据初始化失败:', error)
				uni.showToast({
					title: '数据加载失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		/**
		 * 加载所有统计数据
		 */
		async loadAllStatistics() {
			try {
				// 并行加载三个时间维度的统计
				const [weekStats, monthStats, yearStats] = await Promise.all([
					DataManager.getStatistics('weekly'),
					DataManager.getStatistics('monthly'),
					DataManager.getStatistics('yearly')
				])
				
				// 处理数据并生成分类统计
				this.statsData = {
					week: await this.processStatisticsData(weekStats),
					month: await this.processStatisticsData(monthStats),
					year: await this.processStatisticsData(yearStats)
				}
				
				// 生成趋势数据
				await this.generateTrendData()
				
				console.log('[StatsPage] 统计数据加载完成:', this.statsData)
				
			} catch (error) {
				console.error('[StatsPage] 统计数据加载失败:', error)
			}
		},
		
		/**
		 * 处理统计数据，生成分类信息
		 */
		async processStatisticsData(statistics) {
			// 只处理支出分类（图表主要显示支出分布）
			const expenseCategories = statistics.categoryStats
				.filter(cat => cat.type === 'expense')
				.sort((a, b) => b.amount - a.amount) // 按金额降序排列
			
			// 获取所有分类数据以获取正确的颜色
			const allCategories = await DataManager.getCategories()
			const categoryColorMap = {}
			allCategories.forEach(cat => {
				categoryColorMap[cat.id] = cat.color
			})
			
			// 计算百分比
			const totalExpense = statistics.totalExpense
			const categories = expenseCategories.map(cat => ({
				id: cat.categoryId,
				name: cat.categoryName,
				amount: cat.amount,
				percent: totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0,
				color: cat.categoryColor || categoryColorMap[cat.categoryId] || this.getCategoryColor(cat.categoryName) // 优先使用交易记录中的颜色
			}))
			
			return {
				income: statistics.totalIncome,
				expense: statistics.totalExpense,
				categories: categories.slice(0, 6) // 最多显示6个分类
			}
		},
		
		/**
		 * 获取分类对应的颜色
		 */
		getCategoryColor(categoryName) {
			const colorMap = {
				'餐饮': '#FF8A65',
				'购物': '#F06292',
				'交通': '#64B5F6',
				'娱乐': '#9C27B0',
				'医疗': '#66BB6A',
				'教育': '#3F51B5',
				'居住': '#FFB74D',
				'生活缴费': '#FFC107',
				'其他支出': '#9E9E9E'
			}
			return colorMap[categoryName] || '#9E9E9E'
		},
		
		/**
		 * 生成趋势数据
		 */
		async generateTrendData() {
			try {
				const trendExpenses = await this.loadTrendExpenses(this.currentPeriod)
				
				if (!trendExpenses || trendExpenses.length === 0) {
					// 如果没有数据，生成空的趋势图
					this.trendData = Array(7).fill({ height: 16, amount: 0 })
					return
				}
				
				// 计算最大值用于高度比例
				const maxAmount = Math.max(...trendExpenses.map(item => item.amount))
				const baseHeight = 30
				const maxHeight = 150
				
				// 生成趋势数据
				this.trendData = trendExpenses.map(item => {
					let height = baseHeight
					if (maxAmount > 0) {
						// 根据金额比例计算高度
						const ratio = item.amount / maxAmount
						height = baseHeight + (maxHeight - baseHeight) * ratio
					}
					return {
						height: Math.round(height),
						amount: item.amount,
						period: item.period
					}
				})
				
				console.log('[StatsPage] 趋势数据生成完成:', this.trendData)
				
			} catch (error) {
				console.error('[StatsPage] 趋势数据生成失败:', error)
				this.trendData = Array(7).fill({ height: 16, amount: 0 })
			}
		},
		
		/**
		 * 加载趋势支出数据
		 */
		async loadTrendExpenses(period) {
			try {
				console.log('[StatsPage] 开始加载趋势数据:', period)
				
				// 获取所有交易数据（考虑缓存优化）
				const transactions = await DataManager.getTransactions()
				console.log('[StatsPage] 获取到交易数据:', transactions.length, '条')
				
				const expenseTransactions = transactions.filter(t => t.type === 'expense')
				console.log('[StatsPage] 支出交易数据:', expenseTransactions.length, '条')
				
				if (expenseTransactions.length === 0) {
					return []
				}
				
				const now = new Date()
				let trendData = []
				
				switch (period) {
					case 'week':
						// 本周（周一到周日）的每日支出
						const weekDates = this.getCurrentWeekDates(now)
						
						weekDates.forEach(date => {
							const dateStr = date.toDateString()
							
							const dayExpenses = expenseTransactions.filter(t => {
								const tDate = new Date(t.date)
								return tDate.toDateString() === dateStr
							})
							
							const totalAmount = dayExpenses.reduce((sum, t) => sum + t.amount, 0)
							const dayLabel = this.getDayLabel(date)
							
							trendData.push({
								period: dayLabel,
								amount: totalAmount,
								date: date
							})
						})
						break
						
					case 'month':
						// 本月每周的支出
						const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
						const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
						
						for (let week = 1; week <= 5; week++) {
							const weekStart = new Date(startOfMonth)
							weekStart.setDate(1 + (week - 1) * 7)
							const weekEnd = new Date(weekStart)
							weekEnd.setDate(weekStart.getDate() + 6)
							
							// 确保不超过月末
							if (weekEnd > endOfMonth) {
								weekEnd.setTime(endOfMonth.getTime())
							}
							
							const weekExpenses = expenseTransactions.filter(t => {
								const tDate = new Date(t.date)
								return tDate >= weekStart && tDate <= weekEnd
							})
							
							const totalAmount = weekExpenses.reduce((sum, t) => sum + t.amount, 0)
							trendData.push({
								period: `${week}周`,
								amount: totalAmount
							})
						}
						break
						
					case 'year':
						// 今年每两个月的支出
						for (let i = 1; i <= 12; i += 2) {
							const monthStart = new Date(now.getFullYear(), i - 1, 1)
							const monthEnd = new Date(now.getFullYear(), i, 0) // 上个月的最后一天
							
							const monthExpenses = expenseTransactions.filter(t => {
								const tDate = new Date(t.date)
								return tDate >= monthStart && tDate <= monthEnd
							})
							
							const totalAmount = monthExpenses.reduce((sum, t) => sum + t.amount, 0)
							trendData.push({
								period: `${i}月`,
								amount: totalAmount
							})
						}
						break
						
					default:
						return []
				}
				
				return trendData
				
			} catch (error) {
				console.error('[StatsPage] 加载趋势数据失败:', error)
				return []
			}
		},
		
		/**
		 * 生成图表标签
		 */
		generateChartLabels(period) {
			const now = new Date()
			
			switch (period) {
				case 'week':
					// 生成本周（周一到周日）的标签
					const weekDates = this.getCurrentWeekDates(now)
					return weekDates.map(date => this.getDayLabel(date))
					
				case 'month':
					// 生成本月的周数
					return ['1周', '2周', '3周', '4周', '5周']
					
				case 'year':
					// 生成今年的月份
					const yearLabels = []
					for (let i = 1; i <= 12; i += 2) {
						yearLabels.push(`${i}月`)
					}
					return yearLabels
					
				default:
					return []
			}
		},
		
		goBack() {
			uni.navigateBack();
		},
		
		goToHome() {
			try {
				console.log('[StatsPage] 点击首页导航')
				
				// 防止loading状态下的点击
				if (this.loading) {
					console.log('[StatsPage] 正在加载中，无法跳转')
					return
				}
				
				uni.reLaunch({
					url: '/pages/index/index'
				});
			} catch (error) {
				console.error('[StatsPage] 首页跳转失败:', error)
			}
		},
		
		goToAccounting() {
			try {
				console.log('[StatsPage] 点击记账导航')
				
				// 防止loading状态下的点击
				if (this.loading) {
					console.log('[StatsPage] 正在加载中，无法跳转')
					return
				}
				
				uni.navigateTo({
					url: '/pages/accounting/index'
				});
			} catch (error) {
				console.error('[StatsPage] 记账页跳转失败:', error)
			}
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
		
		async setPeriod(period) {
			try {
				const now = Date.now()
				
				// 防抖：如果距离上次点击时间过短，则忽略
				if (now - this.lastClickTime < this.clickDebounceTime) {
					console.log('[StatsPage] 点击过快，忽略本次点击')
					return
				}
				this.lastClickTime = now
				
				console.log('[StatsPage] 切换时间维度:', period)
				
				// 防止重复点击
				if (this.loading) {
					console.log('[StatsPage] 正在加载中，忽略重复点击')
					return
				}
				
				// 如果是相同的period，直接返回
				if (this.currentPeriod === period) {
					console.log('[StatsPage] 已经是当前时间维度，无需切换')
					return
				}
				
				this.loading = true
				this.currentPeriod = period;
				
				// 切换时间维度时重新生成趋势数据
				await this.generateTrendData()
				
				console.log('[StatsPage] 时间维度切换完成')
				
			} catch (error) {
				console.error('[StatsPage] 时间维度切换失败:', error)
				uni.showToast({
					title: '切换失败，请重试',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		exportData() {
			// 导出当前时间段的数据
			const data = this.statsData[this.currentPeriod]
			console.log('[StatsPage] 导出数据:', data)
			uni.showToast({
				title: '导出功能开发中',
				icon: 'none'
			});
		},
		
		/**
		 * 紧急重置页面状态
		 */
		async resetPageState() {
			try {
				console.log('[StatsPage] 重置页面状态')
				
				// 重置所有状态
				this.loading = false
				this.lastClickTime = 0
				this.currentPeriod = 'month'
				
				// 重新初始化数据
				await this.initializeData()
				
				uni.showToast({
					title: '页面已重置',
					icon: 'success'
				})
				
			} catch (error) {
				console.error('[StatsPage] 页面重置失败:', error)
				uni.showToast({
					title: '重置失败，请重启应用',
					icon: 'none'
				})
			}
		},
		
		formatNumber(num) {
			return num.toLocaleString('zh-CN', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
		},
		
		/**
		 * 格式化图表中心的金额显示，对大数字进行简化
		 */
		formatChartAmount(amount) {
			if (amount >= 10000) {
				// 大于等于1万，显示为 X.X万
				const wan = amount / 10000
				return wan.toFixed(1) + '万'
			} else if (amount >= 1000) {
				// 大于等于1千，显示为 X.Xk 或者完整数字（取决于长度）
				return amount.toFixed(0)
			} else {
				// 小于1千，显示完整金额（不带小数）
				return amount.toFixed(0)
			}
		},
		
		/**
		 * 获取当前周的所有日期（周一到周日）
		 */
		getCurrentWeekDates(currentDate = new Date()) {
			const dates = []
			const current = new Date(currentDate)
			
			// 获取当前是星期几（0=周日, 1=周一, ..., 6=周六）
			const currentDay = current.getDay()
			
			// 计算到周一的偏移量
			// 如果当前是周日(0)，偏移量是6；其他情况是 currentDay - 1
			const mondayOffset = currentDay === 0 ? 6 : currentDay - 1
			
			// 计算周一的日期
			const monday = new Date(current)
			monday.setDate(current.getDate() - mondayOffset)
			
			// 生成周一到周日的日期
			for (let i = 0; i < 7; i++) {
				const date = new Date(monday)
				date.setDate(monday.getDate() + i)
				dates.push(date)
			}
			
			return dates
		},
		
		/**
		 * 获取日期的简短标签
		 */
		getDayLabel(date) {
			const dayNames = ['日', '一', '二', '三', '四', '五', '六']
			const dayOfWeek = date.getDay()
			
			// 如果是今天，显示"今天"；否则显示星期几
			const today = new Date()
			const isToday = date.toDateString() === today.toDateString()
			
			if (isToday) {
				return '今天'
			} else {
				return dayNames[dayOfWeek]
			}
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

.back-btn, .export-btn {
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

.export-icon {
	font-size: 40rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
}

/* 时间切换 */
.time-switch-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.time-switch {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 16rpx;
	display: flex;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.time-btn {
	flex: 1;
	padding: 16rpx;
	border-radius: 24rpx;
	text-align: center;
}

.time-btn.active {
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
}

.time-text {
	color: #6B7280;
	font-weight: 500;
	font-size: 28rpx;
}

.time-btn.active .time-text {
	color: white;
}

.time-btn.disabled {
	opacity: 0.6;
	pointer-events: none;
}

.time-switch.loading {
	opacity: 0.8;
}

.loading-indicator {
	text-align: center;
	padding: 16rpx 0;
}

.loading-text {
	color: #6B7280;
	font-size: 24rpx;
}

/* 收支概览 */
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

.overview-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 32rpx;
	display: block;
}

.overview-items {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	margin-bottom: 24rpx;
}

.overview-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.overview-indicator {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	margin-right: 24rpx;
}

.income-indicator {
	background: #66BB6A;
}

.expense-indicator {
	background: #EF5350;
}

.overview-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
}

.overview-label {
	color: #374151;
	font-size: 28rpx;
	flex: 1;
}

.overview-amount {
	font-weight: bold;
	font-size: 32rpx;
}

.overview-amount.income {
	color: #66BB6A;
}

.overview-amount.expense {
	color: #EF5350;
}

.net-income-section {
	padding-top: 24rpx;
	border-top: 1px solid #E5E7EB;
}

.net-income-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.net-label {
	color: #374151;
	font-weight: 500;
	font-size: 32rpx;
}

.net-amount {
	font-size: 48rpx;
	font-weight: bold;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	-webkit-background-clip: text;
	color: transparent;
	background-clip: text;
}

.net-amount.negative {
	background: linear-gradient(135deg, #EF5350, #E57373);
	-webkit-background-clip: text;
	color: transparent;
	background-clip: text;
}

/* 图表区域 */
.chart-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.chart-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 40rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.chart-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 32rpx;
	display: block;
}

.chart-container {
	display: flex;
	justify-content: center;
	margin-bottom: 32rpx;
}

.donut-chart {
	position: relative;
	width: 256rpx;
	height: 256rpx;
}

.chart-ring {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: var(--chart-gradient, conic-gradient(#E5E7EB 0deg 360deg));
	position: relative;
}

.chart-ring::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 160rpx;
	height: 160rpx;
	background: white;
	border-radius: 50%;
	transform: translate(-50%, -50%);
}

.chart-center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
	z-index: 2;
	width: 120rpx;
	height: 120rpx;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.chart-total {
	display: block;
	font-weight: bold;
	background: linear-gradient(135deg, #FF8A65, #FFB74D);
	-webkit-background-clip: text;
	color: transparent;
	background-clip: text;
	word-break: break-all;
	line-height: 1.2;
	max-width: 100%;
	/* 根据数字长度动态调整字体大小 */
}

.chart-label {
	display: block;
	color: #6B7280;
	font-size: 24rpx;
	margin-top: 8rpx;
}

/* 分类详情 */
.category-details {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.category-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.category-info {
	display: flex;
	align-items: center;
	gap: 24rpx;
}

.category-color {
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
}

.category-name {
	color: #374151;
	font-size: 28rpx;
}

.category-stats {
	text-align: right;
}

.category-amount {
	display: block;
	color: #1F2937;
	font-weight: 500;
	font-size: 28rpx;
}

.category-percent {
	display: block;
	color: #6B7280;
	font-size: 24rpx;
	margin-top: 4rpx;
}

/* 空状态 */
.empty-state {
	text-align: center;
	padding: 60rpx 40rpx;
}

.empty-icon {
	font-size: 80rpx;
	margin-bottom: 24rpx;
}

.empty-text {
	display: block;
	font-size: 28rpx;
	color: #6B7280;
	margin-bottom: 12rpx;
}

.empty-hint {
	display: block;
	font-size: 24rpx;
	color: #9CA3AF;
}

/* 趋势图表 */
.trend-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.trend-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 40rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.trend-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 32rpx;
	display: block;
}

.trend-chart {
	height: 192rpx;
	background: linear-gradient(to right, #F9FAFB, #F3F4F6);
	border-radius: 24rpx;
	padding: 16rpx;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.chart-bars {
	display: flex;
	align-items: end;
	justify-content: space-around;
	height: 144rpx;
}

.bar-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.bar {
	width: 48rpx;
	background: linear-gradient(to top, #FF8A65, #FFB74D);
	border-radius: 8rpx 8rpx 0 0;
	min-height: 16rpx;
}

.chart-labels {
	display: flex;
	justify-content: space-around;
	margin-top: 16rpx;
}

.chart-label {
	color: #6B7280;
	font-size: 24rpx;
	text-align: center;
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