/**
 * 数据管理服务
 * 封装所有数据操作，支持本地存储和云同步
 */

import StorageManager from './storage.js'
import { Transaction, Category, Account, Budget, Statistics, DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from './dataModels.js'

class DataManager {
  constructor() {
    this.storage = StorageManager
    this.isInitialized = false
    this.syncCallbacks = new Set()
  }

  /**
   * 初始化数据管理器
   */
  async initialize() {
    if (this.isInitialized) return
    
    console.log('[DataManager] 开始初始化...')
    
    try {
      // 检查是否首次运行
      const isFirstRun = !this.storage.getSync('app_initialized', false)
      
      if (isFirstRun) {
        await this.initializeDefaultData()
        this.storage.setSync('app_initialized', true)
        this.storage.setSync('app_version', '1.0.0')
        console.log('[DataManager] 首次运行，已初始化默认数据')
      }
      
      // 检查数据版本，进行必要的迁移
      await this.migrateData()
      
      this.isInitialized = true
      console.log('[DataManager] 初始化完成')
      
      // 触发同步检查
      this.checkSync()
      
    } catch (error) {
      console.error('[DataManager] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化默认数据
   */
  async initializeDefaultData() {
    // 初始化默认分类
    const categories = [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income]
    this.storage.setSync('categories', categories)
    
    // 初始化默认账户
    this.storage.setSync('accounts', DEFAULT_ACCOUNTS)
    
    // 初始化空的交易记录
    this.storage.setSync('transactions', [])
    
    // 初始化应用设置
    const defaultSettings = {
      currency: 'CNY',
      currencySymbol: '¥',
      theme: 'warm',
      autoSync: true,
      reminderEnabled: true,
      reminderTime: '21:00',
      budgetAlertThreshold: 0.8
    }
    this.storage.setSync('app_settings', defaultSettings)
    
    console.log('[DataManager] 默认数据初始化完成')
  }

  /**
   * 数据迁移
   */
  async migrateData() {
    const currentVersion = this.storage.getSync('data_version', '1.0.0')
    
    // 如果版本低于1.1.0，需要为交易记录添加分类颜色
    if (currentVersion < '1.1.0') {
      console.log('[DataManager] 开始数据迁移: 添加分类颜色...')
      
      const transactions = this.storage.getSync('transactions', [])
      const categories = this.storage.getSync('categories', [])
      
      // 创建分类颜色映射
      const categoryColorMap = {}
      categories.forEach(cat => {
        categoryColorMap[cat.id] = cat.color
      })
      
      // 为现有交易记录添加分类颜色
      let updatedCount = 0
      transactions.forEach(transaction => {
        if (!transaction.categoryColor && transaction.categoryId) {
          transaction.categoryColor = categoryColorMap[transaction.categoryId] || '#FF8A65'
          updatedCount++
        }
      })
      
      // 保存更新后的交易记录
      if (updatedCount > 0) {
        this.storage.setSync('transactions', transactions)
        console.log(`[DataManager] 已为 ${updatedCount} 条交易记录添加分类颜色`)
      }
      
      // 更新数据版本
      this.storage.setSync('data_version', '1.1.0')
      console.log('[DataManager] 数据迁移完成')
    }
  }

  // ==================== 交易记录管理 ====================

  /**
   * 添加交易记录
   */
  async addTransaction(transactionData) {
    try {
      await this.ensureInitialized()
      
      const transaction = new Transaction(transactionData)
      const validation = transaction.validate()
      
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }
      
      const transactions = this.storage.getSync('transactions', [])
      transactions.unshift(transaction) // 新记录在前
      
      this.storage.setSync('transactions', transactions)
      
      console.log('[DataManager] 交易记录添加成功:', transaction.id)
      
      // 触发同步
      this.triggerSync('transaction_add', transaction)
      
      return transaction
    } catch (error) {
      console.error('[DataManager] 添加交易记录失败:', error)
      throw error
    }
  }

  /**
   * 获取交易记录列表
   */
  async getTransactions(options = {}) {
    await this.ensureInitialized()
    
    const {
      type = null,          // 'income' | 'expense' | null
      categoryId = null,    // 分类ID筛选
      accountId = null,     // 账户ID筛选
      startDate = null,     // 开始日期
      endDate = null,       // 结束日期
      limit = 50,           // 限制数量
      offset = 0,           // 偏移量
      includeDeleted = false // 是否包含已删除
    } = options
    
    let transactions = this.storage.getSync('transactions', [])
    
    // 过滤条件
    transactions = transactions.filter(t => {
      if (!includeDeleted && t.isDeleted) return false
      if (type && t.type !== type) return false
      if (categoryId && t.categoryId !== categoryId) return false
      if (accountId && t.accountId !== accountId) return false
      
      if (startDate || endDate) {
        const tDate = new Date(t.date)
        if (startDate && tDate < new Date(startDate)) return false
        if (endDate && tDate > new Date(endDate)) return false
      }
      
      return true
    })
    
    // 按日期排序（最新在前）
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    // 分页
    const result = transactions.slice(offset, offset + limit)
    
    return {
      data: result.map(t => new Transaction(t)),
      total: transactions.length,
      hasMore: offset + limit < transactions.length
    }
  }

  /**
   * 获取单个交易记录
   */
  async getTransaction(id) {
    await this.ensureInitialized()
    
    const transactions = this.storage.getSync('transactions', [])
    const transaction = transactions.find(t => t.id === id && !t.isDeleted)
    
    return transaction ? new Transaction(transaction) : null
  }

  /**
   * 更新交易记录
   */
  async updateTransaction(id, updates) {
    try {
      await this.ensureInitialized()
      
      const transactions = this.storage.getSync('transactions', [])
      const index = transactions.findIndex(t => t.id === id)
      
      if (index === -1) {
        throw new Error('交易记录不存在')
      }
      
      const transaction = new Transaction(transactions[index])
      transaction.update(updates)
      
      const validation = transaction.validate()
      if (!validation.isValid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }
      
      transactions[index] = transaction
      this.storage.setSync('transactions', transactions)
      
      console.log('[DataManager] 交易记录更新成功:', id)
      
      // 触发同步
      this.triggerSync('transaction_update', transaction)
      
      return transaction
    } catch (error) {
      console.error('[DataManager] 更新交易记录失败:', error)
      throw error
    }
  }

  /**
   * 删除交易记录（软删除）
   */
  async deleteTransaction(id) {
    try {
      await this.ensureInitialized()
      
      const transactions = this.storage.getSync('transactions', [])
      const index = transactions.findIndex(t => t.id === id)
      
      if (index === -1) {
        throw new Error('交易记录不存在')
      }
      
      const transaction = new Transaction(transactions[index])
      transaction.softDelete()
      
      transactions[index] = transaction
      this.storage.setSync('transactions', transactions)
      
      console.log('[DataManager] 交易记录删除成功:', id)
      
      // 触发同步
      this.triggerSync('transaction_delete', transaction)
      
      return true
    } catch (error) {
      console.error('[DataManager] 删除交易记录失败:', error)
      throw error
    }
  }

  // ==================== 分类管理 ====================

  /**
   * 获取分类列表
   */
  async getCategories(type = null) {
    await this.ensureInitialized()
    
    let categories = this.storage.getSync('categories', [])
    
    console.log(`[DataManager] 获取分类数据 - 类型: ${type}, 原始数据长度: ${categories.length}`)
    
    if (categories.length === 0) {
      console.warn('[DataManager] 分类数据为空，重新初始化...')
      await this.initializeDefaultData()
      categories = this.storage.getSync('categories', [])
    }
    
    if (type) {
      categories = categories.filter(c => c.type === type && !c.isDeleted)
    } else {
      categories = categories.filter(c => !c.isDeleted)
    }
    
    console.log(`[DataManager] 过滤后分类数据长度: ${categories.length}`)
    
    // 按sortOrder排序
    categories.sort((a, b) => a.sortOrder - b.sortOrder)
    
    const result = categories.map(c => new Category(c))
    console.log(`[DataManager] 返回分类数据:`, result)
    
    return result
  }

  /**
   * 获取单个分类
   */
  async getCategory(id) {
    await this.ensureInitialized()
    
    const categories = this.storage.getSync('categories', [])
    const category = categories.find(c => c.id === id && !c.isDeleted)
    
    return category ? new Category(category) : null
  }

  /**
   * 添加新分类
   */
  async addCategory(categoryData) {
    try {
      await this.ensureInitialized()
      
      const category = new Category({
        ...categoryData,
        isCustom: true,
        sortOrder: categoryData.sortOrder || 999
      })
      
      const categories = this.storage.getSync('categories', [])
      categories.push(category)
      
      this.storage.setSync('categories', categories)
      
      console.log('[DataManager] 分类添加成功:', category.id)
      
      // 触发同步
      this.triggerSync('category_add', category)
      
      return category
    } catch (error) {
      console.error('[DataManager] 添加分类失败:', error)
      throw error
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(id, updateData) {
    try {
      await this.ensureInitialized()
      
      const categories = this.storage.getSync('categories', [])
      const categoryIndex = categories.findIndex(c => c.id === id)
      
      if (categoryIndex === -1) {
        throw new Error('分类不存在')
      }
      
      // 更新分类数据
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      }
      
      this.storage.setSync('categories', categories)
      
      const updatedCategory = new Category(categories[categoryIndex])
      
      console.log('[DataManager] 分类更新成功:', id)
      
      // 触发同步
      this.triggerSync('category_update', updatedCategory)
      
      return updatedCategory
    } catch (error) {
      console.error('[DataManager] 更新分类失败:', error)
      throw error
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(id) {
    try {
      await this.ensureInitialized()
      
      // 检查是否有交易使用了这个分类
      const transactions = this.storage.getSync('transactions', [])
      const hasTransactions = transactions.some(t => t.categoryId === id && !t.isDeleted)
      
      if (hasTransactions) {
        throw new Error('该分类下还有交易记录，无法删除')
      }
      
      const categories = this.storage.getSync('categories', [])
      const categoryIndex = categories.findIndex(c => c.id === id)
      
      if (categoryIndex === -1) {
        throw new Error('分类不存在')
      }
      
      // 软删除
      categories[categoryIndex].isDeleted = true
      categories[categoryIndex].updatedAt = new Date().toISOString()
      
      this.storage.setSync('categories', categories)
      
      console.log('[DataManager] 分类删除成功:', id)
      
      // 触发同步
      this.triggerSync('category_delete', { id })
      
      return true
    } catch (error) {
      console.error('[DataManager] 删除分类失败:', error)
      throw error
    }
  }

  // ==================== 账户管理 ====================

  /**
   * 获取账户列表
   */
  async getAccounts() {
    await this.ensureInitialized()
    
    const accounts = this.storage.getSync('accounts', [])
    return accounts.filter(a => !a.isDeleted).map(a => new Account(a))
  }

  /**
   * 获取默认账户
   */
  async getDefaultAccount() {
    const accounts = await this.getAccounts()
    return accounts.find(a => a.isDefault) || accounts[0] || null
  }

  // ==================== 统计分析 ====================

  /**
   * 获取统计数据
   */
  async getStatistics(period = 'monthly', customRange = null) {
    await this.ensureInitialized()
    
    let startDate, endDate
    const now = new Date()
    
    if (customRange) {
      startDate = new Date(customRange.startDate)
      endDate = new Date(customRange.endDate)
    } else {
      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'weekly':
          // 计算本周周一的日期
          const currentDay = now.getDay()
          const mondayOffset = currentDay === 0 ? 6 : currentDay - 1 // 周日偏移6天，其他偏移currentDay-1天
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - mondayOffset)
          startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1)
          endDate = new Date(now.getFullYear() + 1, 0, 1)
          break
        default: // monthly
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    }
    
    const transactions = await this.getTransactions({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 10000 // 获取所有数据用于统计
    })
    
    return this.calculateStatistics(transactions.data, startDate, endDate, period)
  }

  /**
   * 计算统计数据
   */
  calculateStatistics(transactions, startDate, endDate, period) {
    let totalIncome = 0
    let totalExpense = 0
    const categoryStats = new Map()
    const dailyStats = new Map()
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount
      } else {
        totalExpense += transaction.amount
      }
      
      // 分类统计
      const categoryKey = transaction.categoryId
      if (!categoryStats.has(categoryKey)) {
        categoryStats.set(categoryKey, {
          categoryId: transaction.categoryId,
          categoryName: transaction.categoryName,
          categoryIcon: transaction.categoryIcon,
          categoryColor: transaction.categoryColor, // 添加分类颜色
          type: transaction.type,
          amount: 0,
          count: 0
        })
      }
      const categoryStat = categoryStats.get(categoryKey)
      categoryStat.amount += transaction.amount
      categoryStat.count += 1
      
      // 每日统计
      const dateKey = new Date(transaction.date).toDateString()
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, { date: dateKey, income: 0, expense: 0 })
      }
      const dailyStat = dailyStats.get(dateKey)
      if (transaction.type === 'income') {
        dailyStat.income += transaction.amount
      } else {
        dailyStat.expense += transaction.amount
      }
    })
    
    // 转换为数组并排序
    const categoryStatsArray = Array.from(categoryStats.values())
      .sort((a, b) => b.amount - a.amount)
    
    const dailyStatsArray = Array.from(dailyStats.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    const topCategories = categoryStatsArray
      .filter(c => c.type === 'expense')
      .slice(0, 5)
    
    return new Statistics({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      categoryStats: categoryStatsArray,
      dailyStats: dailyStatsArray,
      topCategories
    })
  }

  // ==================== 同步管理 ====================

  /**
   * 触发数据同步
   */
  triggerSync(action, data) {
    // 标记需要同步
    const pendingSync = this.storage.getSync('pending_sync', [])
    pendingSync.push({
      action,
      data: data ? data.id : null,
      timestamp: new Date().toISOString()
    })
    this.storage.setSync('pending_sync', pendingSync)
    
    // 通知同步回调
    this.syncCallbacks.forEach(callback => {
      try {
        callback(action, data)
      } catch (error) {
        console.error('[DataManager] 同步回调执行失败:', error)
      }
    })
  }

  /**
   * 检查同步状态
   */
  async checkSync() {
    const pendingSync = this.storage.getSync('pending_sync', [])
    if (pendingSync.length > 0) {
      console.log(`[DataManager] 发现 ${pendingSync.length} 个待同步项目`)
      // 这里后续会集成云同步插件
    }
  }

  /**
   * 注册同步回调
   */
  onSync(callback) {
    this.syncCallbacks.add(callback)
    return () => this.syncCallbacks.delete(callback)
  }

  // ==================== 工具方法 ====================

  /**
   * 确保已初始化
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * 获取应用设置
   */
  getSettings() {
    return this.storage.getSync('app_settings', {})
  }

  /**
   * 更新应用设置
   */
  updateSettings(updates) {
    const current = this.getSettings()
    const newSettings = { ...current, ...updates }
    this.storage.setSync('app_settings', newSettings)
    return newSettings
  }

  /**
   * 导出数据（用于备份）
   */
  async exportData() {
    await this.ensureInitialized()
    
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      transactions: this.storage.getSync('transactions', []),
      categories: this.storage.getSync('categories', []),
      accounts: this.storage.getSync('accounts', []),
      settings: this.storage.getSync('app_settings', {})
    }
  }

  /**
   * 清除所有数据
   */
  async clearAllData() {
    this.storage.clear()
    this.isInitialized = false
    console.log('[DataManager] 所有数据已清除')
  }
}

// 导出单例实例
export default new DataManager()