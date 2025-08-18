<template>
	<view class="page-container">
		<!-- 头部区域 -->
		<view class="header-section">
			<view class="header-top">
				<view class="back-btn" @tap="goBack">
					<text class="back-icon">‹</text>
				</view>
				<text class="header-title">记一笔</text>
				<view class="calendar-btn" @tap="debugReload">
					<text class="calendar-icon">🔄</text>
				</view>
			</view>
		</view>

		<!-- 收支切换 -->
		<view class="type-switch-section">
			<view class="type-switch">
				<view class="switch-btn" 
					:class="{ active: recordType === 'expense' }" 
					@tap="setRecordType('expense')">
					<text class="switch-text">支出</text>
				</view>
				<view class="switch-btn" 
					:class="{ active: recordType === 'income' }" 
					@tap="setRecordType('income')">
					<text class="switch-text">收入</text>
				</view>
			</view>
		</view>

		<!-- 金额输入 -->
		<view class="amount-section">
			<view class="amount-container">
				<text class="amount-label">金额</text>
				<view class="amount-input-row">
					<text class="currency-symbol">¥</text>
					<input class="amount-input" 
						type="digit" 
						:value="displayAmount" 
						@input="onAmountInput" 
						@focus="onAmountFocus"
						@blur="onAmountBlur"
						:placeholder="amountPlaceholder" />
				</view>
			</view>
		</view>

		<!-- 分类选择 -->
		<view class="category-section">
			<view class="category-header">
				<text class="section-title">选择分类</text>
				<view class="category-manage-btn" @tap="showCategoryManager">
					<text class="manage-icon">⚙️</text>
					<text class="manage-text">管理</text>
				</view>
			</view>
			<view class="category-grid">
				<view class="category-item" 
					v-for="category in currentCategories" 
					:key="category.id"
					:class="{ selected: selectedCategory && selectedCategory.id === category.id }"
					@tap="selectCategory(category)">
					<view class="category-icon" :style="{ backgroundColor: category.color }">
						<text class="category-emoji">{{ category.icon }}</text>
					</view>
					<text class="category-name">{{ category.name }}</text>
				</view>
				<!-- 添加新分类按钮 -->
				<view class="category-item add-category-item" @tap="showAddCategoryModal">
					<view class="category-icon add-icon">
						<text class="category-emoji">➕</text>
					</view>
					<text class="category-name">添加分类</text>
				</view>
			</view>
		</view>

		<!-- 账户选择 -->
		<view class="account-section" v-if="selectedAccount">
			<text class="section-title">账户</text>
			<view class="account-selector" @tap="showAccountPicker">
				<view class="account-info">
					<view class="account-icon" :style="{ backgroundColor: selectedAccount.color }">
						<text class="account-emoji">{{ selectedAccount.icon }}</text>
					</view>
					<text class="account-name">{{ selectedAccount.name }}</text>
				</view>
				<text class="selector-arrow">›</text>
			</view>
		</view>

		<!-- 日期选择 -->
		<view class="date-section">
			<text class="section-title">日期</text>
			<view class="date-selector" @tap="showDatePicker">
				<text class="date-text">{{ formattedDate }}</text>
				<text class="selector-arrow">›</text>
			</view>
		</view>

		<!-- 备注输入 -->
		<view class="note-section">
			<view class="note-container">
				<input class="note-input" 
					:value="note" 
					@input="onNoteInput" 
					placeholder="添加备注..." />
			</view>
		</view>

		<!-- 底部保存按钮 -->
		<view class="save-section">
			<button class="save-btn" 
				:class="{ disabled: !canSave || loading }"
				@tap="saveRecord">
				{{ loading ? '保存中...' : '保存记录' }}
			</button>
		</view>

		<!-- 日期选择弹窗 -->
		<view class="modal-overlay" v-if="showDateModal" @tap="hideDatePicker">
			<view class="date-picker-modal" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">选择日期</text>
					<view class="modal-close" @tap="hideDatePicker">✕</view>
				</view>
				<picker mode="date" 
					:value="selectedDate.toISOString().split('T')[0]"
					@change="onDateChange">
					<view class="date-picker-trigger">
						<text>{{ formattedDate }}</text>
					</view>
				</picker>
			</view>
		</view>

		<!-- 账户选择弹窗 -->
		<view class="modal-overlay" v-if="showAccountModal" @tap="hideAccountPicker">
			<view class="account-picker-modal" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">选择账户</text>
					<view class="modal-close" @tap="hideAccountPicker">✕</view>
				</view>
				<view class="account-list">
					<view class="account-item"
						v-for="account in accounts"
						:key="account.id"
						:class="{ selected: selectedAccount && selectedAccount.id === account.id }"
						@tap="selectAccount(account)">
						<view class="account-icon" :style="{ backgroundColor: account.color }">
							<text class="account-emoji">{{ account.icon }}</text>
						</view>
						<text class="account-name">{{ account.name }}</text>
						<text class="check-icon" v-if="selectedAccount && selectedAccount.id === account.id">✓</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 分类管理弹窗 -->
		<view class="modal-overlay" v-if="showCategoryManagerModal" @tap="hideCategoryManager">
			<view class="category-manager-modal" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">分类管理</text>
					<view class="modal-close" @tap="hideCategoryManager">✕</view>
				</view>
				<view class="category-manager-content">
					<view class="category-manager-list">
						<view class="category-manager-item"
							v-for="category in currentCategories"
							:key="category.id">
							<view class="category-info">
								<view class="category-icon" :style="{ backgroundColor: category.color }">
									<text class="category-emoji">{{ category.icon }}</text>
								</view>
								<text class="category-name">{{ category.name }}</text>
							</view>
							<view class="category-actions">
								<view class="action-btn edit-btn" @tap="editCategory(category)">
									<text class="action-text">编辑</text>
								</view>
								<view class="action-btn delete-btn" @tap="deleteCategory(category)" v-if="category.isCustom">
									<text class="action-text">删除</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 添加/编辑分类弹窗 -->
		<view class="modal-overlay" v-if="showCategoryEditModal" @tap="hideCategoryEditModal">
			<view class="category-edit-modal" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">{{ editingCategory ? '编辑分类' : '添加分类' }}</text>
					<view class="modal-close" @tap="hideCategoryEditModal">✕</view>
				</view>
				<view class="category-edit-content">
					<!-- 分类名称 -->
					<view class="form-group">
						<text class="form-label">分类名称</text>
						<input class="form-input" 
							v-model="categoryForm.name" 
							placeholder="请输入分类名称" />
					</view>
					
					<!-- 图标选择 -->
					<view class="form-group">
						<text class="form-label">选择图标</text>
						<view class="icon-grid">
							<view class="icon-option"
								v-for="icon in availableIcons"
								:key="icon"
								:class="{ selected: categoryForm.icon === icon }"
								@tap="selectIcon(icon)">
								<text class="icon-emoji">{{ icon }}</text>
							</view>
						</view>
					</view>
					
					<!-- 颜色选择 -->
					<view class="form-group">
						<text class="form-label">选择颜色</text>
						<view class="color-grid">
							<view class="color-option"
								v-for="color in availableColors"
								:key="color"
								:class="{ selected: categoryForm.color === color }"
								:style="{ backgroundColor: color }"
								@tap="selectColor(color)">
								<text class="color-check" v-if="categoryForm.color === color">✓</text>
							</view>
						</view>
					</view>
					
					<!-- 操作按钮 -->
					<view class="form-actions">
						<button class="form-btn cancel-btn" @tap="hideCategoryEditModal">取消</button>
						<button class="form-btn save-btn" @tap="saveCategoryForm" 
							:class="{ disabled: !categoryForm.name.trim() }">
							{{ editingCategory ? '更新' : '添加' }}
						</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import DataManager from '@/utils/dataManager.js'

export default {
	data() {
		return {
			recordType: 'expense', // 'expense' | 'income'
			amount: '',
			selectedCategory: null, // 选中的分类对象
			selectedAccount: null, // 选中的账户
			note: '',
			selectedDate: new Date(),
			loading: false,
			
			// 动态加载的数据
			expenseCategories: [],
			incomeCategories: [],
			accounts: [],
			
			// 界面控制
			showDateModal: false,
			showAccountModal: false,
			amountFocused: false,
			
			// 分类管理相关
			showCategoryManagerModal: false,
			showCategoryEditModal: false,
			editingCategory: null, // 正在编辑的分类
			categoryForm: {
				name: '',
				icon: '📝',
				color: '#FF8A65'
			},
			
			// 可选的图标和颜色
			availableIcons: [
				'🍽️', '🚗', '🛍️', '🎮', '💊', '📚', '🏠', '💡', '📝',
				'💰', '💎', '📈', '⏰', '🎁', '➕', '🎵', '🏃‍♂️', '✈️',
				'📱', '💻', '👕', '🧸', '🐱', '🌟', '🎨', '🔧', '📖',
				'🍕', '☕', '🎂', '🍎', '🚌', '🚕', '⛽', '🏥', '💄'
			],
			availableColors: [
				'#FF8A65', '#F06292', '#BA68C8', '#9C27B0', '#7986CB',
				'#3F51B5', '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A',
				'#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28',
				'#FFA726', '#FF7043', '#8D6E63', '#A1887F', '#90A4AE',
				'#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F',
				'#EF5350', '#E57373', '#81C784', '#64B5F6', '#FFB74D'
			]
		}
	},
	computed: {
		currentCategories() {
			return this.recordType === 'expense' ? this.expenseCategories : this.incomeCategories;
		},
		canSave() {
			return this.amount && 
				   parseFloat(this.amount) > 0 && 
				   this.selectedCategory && 
				   this.selectedAccount;
		},
		formattedDate() {
			const date = this.selectedDate
			return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月${date.getDate().toString().padStart(2, '0')}日`
		},
		amountPlaceholder() {
			// 当输入框获得焦点时，不显示placeholder，避免重叠
			return this.amountFocused ? '' : '0.00'
		},
		displayAmount() {
			// 如果没有输入金额且未获得焦点，显示空字符串让placeholder显示
			if (!this.amount && !this.amountFocused) {
				return ''
			}
			return this.amount
		}
	},
	
	async onLoad() {
		await this.initializeData()
	},
	methods: {
		/**
		 * 初始化页面数据
		 */
		async initializeData() {
			try {
				uni.showLoading({ title: '加载中...' })
				
				console.log('[AddPage] 开始初始化数据管理器...')
				
				// 初始化数据管理器
				await DataManager.initialize()
				
				console.log('[AddPage] 数据管理器初始化完成，开始加载分类...')
				
				// 加载分类数据
				this.expenseCategories = await DataManager.getCategories('expense')
				this.incomeCategories = await DataManager.getCategories('income')
				
				console.log('[AddPage] 分类数据加载完成:', {
					expenseCount: this.expenseCategories.length,
					incomeCount: this.incomeCategories.length,
					expenseCategories: this.expenseCategories,
					incomeCategories: this.incomeCategories
				})
				
				// 加载账户数据
				this.accounts = await DataManager.getAccounts()
				this.selectedAccount = await DataManager.getDefaultAccount()
				
				console.log('[AddPage] 账户数据加载完成:', {
					accountsCount: this.accounts.length,
					selectedAccount: this.selectedAccount
				})
				
				// 设置默认分类 - 确保有分类可选
				if (this.recordType === 'expense' && this.expenseCategories.length > 0) {
					this.selectedCategory = this.expenseCategories[0]
					console.log('[AddPage] 设置默认支出分类:', this.selectedCategory)
				} else if (this.recordType === 'income' && this.incomeCategories.length > 0) {
					this.selectedCategory = this.incomeCategories[0]
					console.log('[AddPage] 设置默认收入分类:', this.selectedCategory)
				}
				
				console.log('[AddPage] 数据加载完成', {
					expense: this.expenseCategories.length,
					income: this.incomeCategories.length,
					accounts: this.accounts.length,
					selectedCategory: this.selectedCategory,
					selectedAccount: this.selectedAccount
				})
				
			} catch (error) {
				console.error('[AddPage] 数据初始化失败:', error)
				uni.showToast({
					title: '数据加载失败: ' + error.message,
					icon: 'none',
					duration: 3000
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		goBack() {
			uni.navigateBack()
		},
		
		setRecordType(type) {
			if (this.recordType !== type) {
				console.log('[AddPage] 切换记录类型:', this.recordType, '->', type)
				this.recordType = type
				// 切换类型时选择第一个分类
				const categories = type === 'expense' ? this.expenseCategories : this.incomeCategories
				this.selectedCategory = categories.length > 0 ? categories[0] : null
				console.log('[AddPage] 切换后选中分类:', this.selectedCategory)
				console.log('[AddPage] 当前可用分类:', categories)
			}
		},
		
		onAmountInput(e) {
			let value = e.detail.value
			// 限制小数点后两位
			if (value.includes('.')) {
				const parts = value.split('.')
				if (parts[1] && parts[1].length > 2) {
					value = parts[0] + '.' + parts[1].substring(0, 2)
				}
			}
			this.amount = value
		},
		
		onAmountFocus() {
			this.amountFocused = true
			console.log('[AddPage] 金额输入框获得焦点')
		},
		
		onAmountBlur() {
			this.amountFocused = false
			console.log('[AddPage] 金额输入框失去焦点')
		},
		
		onNoteInput(e) {
			this.note = e.detail.value
		},
		
		selectCategory(category) {
			console.log('[AddPage] 选择分类:', category)
			this.selectedCategory = category
			console.log('[AddPage] 当前选中分类:', this.selectedCategory)
		},
		
		showDatePicker() {
			this.showDateModal = true
		},
		
		hideDatePicker() {
			this.showDateModal = false
		},
		
		onDateChange(e) {
			this.selectedDate = new Date(e.detail.value)
			this.hideDatePicker()
		},
		
		showAccountPicker() {
			this.showAccountModal = true
		},
		
		hideAccountPicker() {
			this.showAccountModal = false
		},
		
		selectAccount(account) {
			this.selectedAccount = account
			this.hideAccountPicker()
		},
		
		/**
		 * 保存记账记录
		 */
		async saveRecord() {
			if (this.loading) return
			
			// 验证数据
			if (!this.amount || parseFloat(this.amount) <= 0) {
				uni.showToast({
					title: '请输入有效金额',
					icon: 'none'
				})
				return
			}
			
			if (!this.selectedCategory) {
				uni.showToast({
					title: '请选择分类',
					icon: 'none'
				})
				return
			}
			
			if (!this.selectedAccount) {
				uni.showToast({
					title: '请选择账户',
					icon: 'none'
				})
				return
			}
			
			this.loading = true
			
			try {
				// 构造交易记录数据
				const transactionData = {
					amount: parseFloat(this.amount),
					type: this.recordType,
					categoryId: this.selectedCategory.id,
					categoryName: this.selectedCategory.name,
					categoryIcon: this.selectedCategory.icon,
					categoryColor: this.selectedCategory.color, // 添加分类颜色
					note: this.note.trim(),
					date: this.selectedDate.toISOString(),
					accountId: this.selectedAccount.id,
					accountName: this.selectedAccount.name
				}
				
				console.log('[AddPage] 准备保存交易记录:', transactionData)
				
				// 使用数据管理器保存
				const transaction = await DataManager.addTransaction(transactionData)
				
				console.log('[AddPage] 交易记录保存成功:', transaction.id)
				
				// 显示自定义成功提示
				this.showSuccessMessage()
				
				// 清空表单
				this.resetForm()
				
				// 优化返回速度 - 减少延迟时间
				setTimeout(() => {
					uni.navigateBack()
				}, 800)
				
			} catch (error) {
				console.error('[AddPage] 保存失败:', error)
				uni.showToast({
					title: error.message || '保存失败',
					icon: 'none'
				})
			} finally {
				this.loading = false
			}
		},
		
		/**
		 * 重置表单
		 */
		resetForm() {
			this.amount = ''
			this.note = ''
			this.selectedDate = new Date()
			// 不重置分类和账户，保持用户习惯
		},
		
		/**
		 * 快速金额输入
		 */
		quickAmount(amount) {
			this.amount = amount.toString()
		},
		
		/**
		 * 调试重新加载数据
		 */
		async debugReload() {
			console.log('[AddPage] 手动重新加载数据...')
			await this.initializeData()
		},
		
		/**
		 * 显示美化的成功提示
		 */
		showSuccessMessage() {
			// 使用更好看的成功提示
			uni.showToast({
				title: '💰 记账成功',
				icon: 'none',
				duration: 800,
				mask: false
			})
		},
		
		// ==================== 分类管理相关方法 ====================
		
		/**
		 * 显示分类管理弹窗
		 */
		showCategoryManager() {
			this.showCategoryManagerModal = true
		},
		
		/**
		 * 隐藏分类管理弹窗
		 */
		hideCategoryManager() {
			this.showCategoryManagerModal = false
		},
		
		/**
		 * 显示添加分类弹窗
		 */
		showAddCategoryModal() {
			this.editingCategory = null
			this.categoryForm = {
				name: '',
				icon: '📝',
				color: '#FF8A65'
			}
			this.showCategoryEditModal = true
		},
		
		/**
		 * 编辑分类
		 */
		editCategory(category) {
			this.editingCategory = category
			this.categoryForm = {
				name: category.name,
				icon: category.icon,
				color: category.color
			}
			this.hideCategoryManager()
			this.showCategoryEditModal = true
		},
		
		/**
		 * 隐藏分类编辑弹窗
		 */
		hideCategoryEditModal() {
			this.showCategoryEditModal = false
			this.editingCategory = null
		},
		
		/**
		 * 选择图标
		 */
		selectIcon(icon) {
			this.categoryForm.icon = icon
		},
		
		/**
		 * 选择颜色
		 */
		selectColor(color) {
			this.categoryForm.color = color
		},
		
		/**
		 * 保存分类表单
		 */
		async saveCategoryForm() {
			if (!this.categoryForm.name.trim()) {
				uni.showToast({
					title: '请输入分类名称',
					icon: 'none'
				})
				return
			}
			
			try {
				uni.showLoading({ title: '保存中...' })
				
				const categoryData = {
					name: this.categoryForm.name.trim(),
					icon: this.categoryForm.icon,
					color: this.categoryForm.color,
					type: this.recordType
				}
				
				if (this.editingCategory) {
					// 更新分类
					await DataManager.updateCategory(this.editingCategory.id, categoryData)
					uni.showToast({
						title: '分类更新成功',
						icon: 'success'
					})
				} else {
					// 添加新分类
					await DataManager.addCategory(categoryData)
					uni.showToast({
						title: '分类添加成功',
						icon: 'success'
					})
				}
				
				// 重新加载分类数据
				await this.reloadCategories()
				
				// 关闭弹窗
				this.hideCategoryEditModal()
				
			} catch (error) {
				console.error('保存分类失败:', error)
				uni.showToast({
					title: error.message || '保存失败',
					icon: 'none'
				})
			} finally {
				uni.hideLoading()
			}
		},
		
		/**
		 * 删除分类
		 */
		async deleteCategory(category) {
			uni.showModal({
				title: '删除确认',
				content: `确定要删除分类"${category.name}"吗？`,
				success: async (res) => {
					if (res.confirm) {
						try {
							uni.showLoading({ title: '删除中...' })
							
							await DataManager.deleteCategory(category.id)
							
							uni.showToast({
								title: '删除成功',
								icon: 'success'
							})
							
							// 重新加载分类数据
							await this.reloadCategories()
							
							// 如果删除的是当前选中的分类，重置选择
							if (this.selectedCategory && this.selectedCategory.id === category.id) {
								this.selectedCategory = null
							}
							
						} catch (error) {
							console.error('删除分类失败:', error)
							uni.showToast({
								title: error.message || '删除失败',
								icon: 'none'
							})
						} finally {
							uni.hideLoading()
						}
					}
				}
			})
		},
		
		/**
		 * 重新加载分类数据
		 */
		async reloadCategories() {
			this.expenseCategories = await DataManager.getCategories('expense')
			this.incomeCategories = await DataManager.getCategories('income')
			
			// 如果当前没有选中分类，自动选择第一个
			if (!this.selectedCategory && this.currentCategories.length > 0) {
				this.selectedCategory = this.currentCategories[0]
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
	position: relative;
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

.back-btn, .calendar-btn {
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

.calendar-icon {
	font-size: 40rpx;
}

.header-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
}

/* 收支切换 */
.type-switch-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.type-switch {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 16rpx;
	display: flex;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.switch-btn {
	flex: 1;
	padding: 24rpx;
	border-radius: 24rpx;
	text-align: center;
}

.switch-btn.active {
	background: linear-gradient(135deg, #EF5350, #E57373);
}

.switch-text {
	color: #6B7280;
	font-weight: 500;
	font-size: 32rpx;
}

.switch-btn.active .switch-text {
	color: white;
}

/* 金额输入 */
.amount-section {
	padding: 0 48rpx 64rpx 48rpx;
}

.amount-container {
	text-align: center;
}

.amount-label {
	display: block;
	color: #6B7280;
	font-size: 28rpx;
	margin-bottom: 16rpx;
}

.amount-input-row {
	display: flex;
	align-items: center;
	justify-content: center;
}

.currency-symbol {
	font-size: 72rpx;
	font-weight: bold;
	color: #FF8A65;
	margin-right: 16rpx;
}

.amount-input {
	font-size: 72rpx;
	font-weight: bold;
	color: #FF8A65;
	text-align: center;
	background: none;
	border: none;
	outline: none;
	min-width: 200rpx;
	caret-color: #FF8A65;
}

.amount-input:focus {
	color: #E65100;
}

/* 分类选择 */
.category-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 32rpx;
	display: block;
}

.category-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 32rpx;
}

.category-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	padding: 24rpx;
	border-radius: 32rpx;
	cursor: pointer;
}

.category-item.selected {
	background: #FFF3E0;
	border: 4rpx solid #FF8A65;
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
	font-size: 48rpx;
}

.category-name {
	font-size: 24rpx;
	font-weight: 500;
	color: #374151;
}

/* 备注输入 */
.note-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.note-container {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.note-input {
	width: 100%;
	background: transparent;
	color: #374151;
	font-size: 32rpx;
}

/* 底部保存按钮 */
.save-section {
	position: fixed;
	bottom: 48rpx;
	left: 48rpx;
	right: 48rpx;
}

.save-btn {
	width: 100%;
	padding: 32rpx;
	background: linear-gradient(135deg, #EF5350, #E57373);
	color: white;
	font-weight: 600;
	font-size: 32rpx;
	border-radius: 32rpx;
	border: none;
	transition: transform 0.2s ease;
}

.save-btn:active {
	transform: scale(0.95);
}

.save-btn.disabled {
	background: #D1D5DB;
	color: #9CA3AF;
}

/* 账户选择 */
.account-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.account-selector {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.account-info {
	display: flex;
	align-items: center;
	gap: 24rpx;
}

.account-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.account-emoji {
	font-size: 40rpx;
}

.account-name {
	font-size: 32rpx;
	font-weight: 500;
	color: #374151;
}

.selector-arrow {
	font-size: 48rpx;
	color: #9CA3AF;
	font-weight: 300;
}

/* 日期选择 */
.date-section {
	padding: 0 48rpx 48rpx 48rpx;
}

.date-selector {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(40rpx);
	border: 1px solid rgba(255, 138, 101, 0.2);
	border-radius: 32rpx;
	padding: 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: 0 16rpx 64rpx rgba(255, 138, 101, 0.15);
}

.date-text {
	font-size: 32rpx;
	font-weight: 500;
	color: #374151;
}

/* 弹窗样式 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.date-picker-modal,
.account-picker-modal {
	background: white;
	border-radius: 32rpx;
	margin: 48rpx;
	max-height: 80vh;
	width: 100%;
	max-width: 600rpx;
	overflow: hidden;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 48rpx;
	border-bottom: 1px solid #F3F4F6;
}

.modal-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1F2937;
}

.modal-close {
	width: 64rpx;
	height: 64rpx;
	border-radius: 16rpx;
	background: #F3F4F6;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #6B7280;
}

.date-picker-trigger {
	padding: 48rpx;
	text-align: center;
	font-size: 32rpx;
	color: #374151;
}

/* 账户列表 */
.account-list {
	max-height: 60vh;
	overflow-y: auto;
}

.account-item {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 32rpx 48rpx;
	border-bottom: 1px solid #F9FAFB;
}

.account-item:last-child {
	border-bottom: none;
}

.account-item.selected {
	background: #FFF3E0;
}

.account-item .account-name {
	flex: 1;
}

.check-icon {
	font-size: 32rpx;
	color: #FF8A65;
	font-weight: bold;
}

/* 分类管理样式 */
.category-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32rpx;
}

.category-manage-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx 24rpx;
	background: #F3F4F6;
	border-radius: 20rpx;
	border: 1px solid #E5E7EB;
}

.manage-icon {
	font-size: 24rpx;
}

.manage-text {
	font-size: 24rpx;
	color: #6B7280;
	font-weight: 500;
}

.add-category-item {
	border: 2rpx dashed #E5E7EB !important;
	background: #FAFAFA !important;
}

.add-icon {
	background: #F3F4F6 !important;
	color: #9CA3AF;
}

/* 分类管理弹窗 */
.category-manager-modal {
	background: white;
	border-radius: 32rpx;
	margin: 48rpx;
	max-height: 80vh;
	width: 100%;
	max-width: 600rpx;
	overflow: hidden;
}

.category-manager-content {
	max-height: 60vh;
	overflow-y: auto;
}

.category-manager-list {
	padding: 0 48rpx 48rpx 48rpx;
}

.category-manager-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1px solid #F9FAFB;
}

.category-manager-item:last-child {
	border-bottom: none;
}

.category-info {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.category-actions {
	display: flex;
	gap: 16rpx;
}

.action-btn {
	padding: 12rpx 24rpx;
	border-radius: 16rpx;
	font-size: 24rpx;
}

.edit-btn {
	background: #EBF8FF;
	border: 1px solid #3182CE;
}

.edit-btn .action-text {
	color: #3182CE;
}

.delete-btn {
	background: #FED7D7;
	border: 1px solid #E53E3E;
}

.delete-btn .action-text {
	color: #E53E3E;
}

/* 分类编辑弹窗 */
.category-edit-modal {
	background: white;
	border-radius: 32rpx;
	margin: 48rpx;
	max-height: 90vh;
	width: 100%;
	max-width: 600rpx;
	overflow: hidden;
}

.category-edit-content {
	padding: 48rpx;
	max-height: 80vh;
	overflow-y: auto;
}

.form-group {
	margin-bottom: 48rpx;
}

.form-label {
	display: block;
	font-size: 32rpx;
	font-weight: 600;
	color: #1F2937;
	margin-bottom: 24rpx;
}

.form-input {
	width: 100%;
	padding: 24rpx;
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 16rpx;
	font-size: 32rpx;
	color: #374151;
}

.form-input:focus {
	border-color: #FF8A65;
	background: white;
}

/* 图标网格 */
.icon-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 16rpx;
}

.icon-option {
	aspect-ratio: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F9FAFB;
	border: 2rpx solid #E5E7EB;
	border-radius: 16rpx;
	cursor: pointer;
	transition: all 0.2s ease;
}

.icon-option.selected {
	background: #FFF3E0;
	border-color: #FF8A65;
	transform: scale(1.05);
}

.icon-emoji {
	font-size: 32rpx;
}

/* 颜色网格 */
.color-grid {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 16rpx;
}

.color-option {
	aspect-ratio: 1;
	border-radius: 50%;
	border: 3rpx solid transparent;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
}

.color-option.selected {
	border-color: #1F2937;
	transform: scale(1.1);
}

.color-check {
	color: white;
	font-size: 24rpx;
	font-weight: bold;
	text-shadow: 0 0 4rpx rgba(0, 0, 0, 0.5);
}

/* 表单操作按钮 */
.form-actions {
	display: flex;
	gap: 24rpx;
	margin-top: 48rpx;
}

.form-btn {
	flex: 1;
	padding: 24rpx;
	border-radius: 16rpx;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
}

.cancel-btn {
	background: #F3F4F6;
	color: #6B7280;
}

.save-btn {
	background: linear-gradient(135deg, #EF5350, #E57373);
	color: white;
}

.save-btn.disabled {
	background: #D1D5DB;
	color: #9CA3AF;
}
</style>