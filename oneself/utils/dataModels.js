/**
 * 数据模型定义
 * 定义记账应用的所有数据结构
 */

/**
 * 交易记录模型
 */
export class Transaction {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.amount = data.amount || 0
    this.type = data.type || 'expense' // 'income' | 'expense'
    this.categoryId = data.categoryId || ''
    this.categoryName = data.categoryName || ''
    this.categoryIcon = data.categoryIcon || ''
    this.categoryColor = data.categoryColor || '#FF8A65' // 添加分类颜色
    this.note = data.note || ''
    this.date = data.date || new Date().toISOString()
    this.accountId = data.accountId || 'default'
    this.accountName = data.accountName || '默认账户'
    this.isDeleted = data.isDeleted || false
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.syncStatus = data.syncStatus || 'pending' // 'pending' | 'synced' | 'failed'
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  // 更新记录
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        this[key] = updates[key]
      }
    })
    this.updatedAt = new Date().toISOString()
    this.syncStatus = 'pending'
  }

  // 软删除
  softDelete() {
    this.isDeleted = true
    this.updatedAt = new Date().toISOString()
    this.syncStatus = 'pending'
  }

  // 验证数据完整性
  validate() {
    const errors = []
    
    if (!this.amount || this.amount <= 0) {
      errors.push('金额必须大于0')
    }
    
    if (!['income', 'expense'].includes(this.type)) {
      errors.push('交易类型必须是收入或支出')
    }
    
    if (!this.categoryId) {
      errors.push('必须选择分类')
    }
    
    if (!this.date) {
      errors.push('必须设置日期')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 转换为用于显示的格式
  toDisplayFormat() {
    return {
      ...this,
      formattedAmount: this.type === 'expense' ? `-¥${this.amount.toFixed(2)}` : `+¥${this.amount.toFixed(2)}`,
      formattedDate: this.formatDate(this.date),
      amountColor: this.type === 'expense' ? '#EF5350' : '#66BB6A'
    }
  }

  formatDate(dateString) {
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
  }
}

/**
 * 分类模型
 */
export class Category {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || ''
    this.icon = data.icon || '📝'
    this.color = data.color || '#FF8A65'
    this.type = data.type || 'expense' // 'income' | 'expense'
    this.sortOrder = data.sortOrder || 0
    this.isCustom = data.isCustom || false
    this.isDeleted = data.isDeleted || false
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  generateId() {
    return 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }
}

/**
 * 账户模型
 */
export class Account {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.name = data.name || ''
    this.type = data.type || 'cash' // 'cash' | 'bank' | 'alipay' | 'wechat' | 'credit'
    this.balance = data.balance || 0
    this.icon = data.icon || '💰'
    this.color = data.color || '#64B5F6'
    this.isDefault = data.isDefault || false
    this.isDeleted = data.isDeleted || false
    this.createdAt = data.createdAt || new Date().toISOString()
  }

  generateId() {
    return 'acc_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }
}

/**
 * 预算模型
 */
export class Budget {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.categoryId = data.categoryId || ''
    this.amount = data.amount || 0
    this.period = data.period || 'monthly' // 'monthly' | 'yearly'
    this.startDate = data.startDate || new Date().toISOString()
    this.endDate = data.endDate || this.calculateEndDate(data.startDate, data.period)
    this.isActive = data.isActive !== undefined ? data.isActive : true
    this.createdAt = data.createdAt || new Date().toISOString()
  }

  generateId() {
    return 'budget_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  calculateEndDate(startDate, period) {
    const start = new Date(startDate || new Date())
    if (period === 'yearly') {
      return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate()).toISOString()
    } else {
      return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate()).toISOString()
    }
  }
}

/**
 * 统计数据模型
 */
export class Statistics {
  constructor(data = {}) {
    this.period = data.period || 'monthly'
    this.startDate = data.startDate || ''
    this.endDate = data.endDate || ''
    this.totalIncome = data.totalIncome || 0
    this.totalExpense = data.totalExpense || 0
    this.balance = data.balance || 0
    this.transactionCount = data.transactionCount || 0
    this.categoryStats = data.categoryStats || []
    this.dailyStats = data.dailyStats || []
    this.topCategories = data.topCategories || []
  }

  get netIncome() {
    return this.totalIncome - this.totalExpense
  }

  get avgDailyExpense() {
    const days = this.getDaysBetween(this.startDate, this.endDate)
    return days > 0 ? this.totalExpense / days : 0
  }

  getDaysBetween(start, end) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

/**
 * 默认分类数据
 */
export const DEFAULT_CATEGORIES = {
  expense: [
    { id: 'cat_food', name: '餐饮', icon: '🍽️', color: '#FF8A65', type: 'expense', sortOrder: 1 },
    { id: 'cat_transport', name: '交通', icon: '🚗', color: '#64B5F6', type: 'expense', sortOrder: 2 },
    { id: 'cat_shopping', name: '购物', icon: '🛍️', color: '#F06292', type: 'expense', sortOrder: 3 },
    { id: 'cat_entertainment', name: '娱乐', icon: '🎮', color: '#9C27B0', type: 'expense', sortOrder: 4 },
    { id: 'cat_medical', name: '医疗', icon: '💊', color: '#66BB6A', type: 'expense', sortOrder: 5 },
    { id: 'cat_education', name: '教育', icon: '📚', color: '#3F51B5', type: 'expense', sortOrder: 6 },
    { id: 'cat_housing', name: '居住', icon: '🏠', color: '#FFB74D', type: 'expense', sortOrder: 7 },
    { id: 'cat_utilities', name: '生活缴费', icon: '💡', color: '#FFC107', type: 'expense', sortOrder: 8 },
    { id: 'cat_others_expense', name: '其他支出', icon: '📝', color: '#9E9E9E', type: 'expense', sortOrder: 9 }
  ],
  income: [
    { id: 'cat_salary', name: '工资', icon: '💰', color: '#4CAF50', type: 'income', sortOrder: 1 },
    { id: 'cat_bonus', name: '奖金', icon: '💎', color: '#8BC34A', type: 'income', sortOrder: 2 },
    { id: 'cat_investment', name: '投资收益', icon: '📈', color: '#CDDC39', type: 'income', sortOrder: 3 },
    { id: 'cat_part_time', name: '兼职', icon: '⏰', color: '#FF9800', type: 'income', sortOrder: 4 },
    { id: 'cat_gift', name: '礼金', icon: '🎁', color: '#FF5722', type: 'income', sortOrder: 5 },
    { id: 'cat_others_income', name: '其他收入', icon: '➕', color: '#607D8B', type: 'income', sortOrder: 6 }
  ]
}

/**
 * 默认账户数据
 */
export const DEFAULT_ACCOUNTS = [
  { id: 'acc_cash', name: '现金', type: 'cash', icon: '💵', color: '#4CAF50', isDefault: true },
  { id: 'acc_alipay', name: '支付宝', type: 'alipay', icon: '🔵', color: '#1296DB' },
  { id: 'acc_wechat', name: '微信', type: 'wechat', icon: '💚', color: '#07C160' },
  { id: 'acc_bank', name: '银行卡', type: 'bank', icon: '🏦', color: '#FF5722' },
  { id: 'acc_credit', name: '信用卡', type: 'credit', icon: '💳', color: '#9C27B0' }
]