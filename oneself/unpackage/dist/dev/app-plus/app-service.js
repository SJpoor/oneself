if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  class StorageManager {
    constructor() {
      this.storagePrefix = "accounting_";
    }
    /**
     * 同步设置数据
     * @param {string} key 键名
     * @param {any} data 数据
     */
    setSync(key, data) {
      try {
        const fullKey = this.storagePrefix + key;
        uni.setStorageSync(fullKey, JSON.stringify(data));
        formatAppLog("log", "at utils/storage.js:20", `[Storage] 保存数据成功: ${key}`);
        return true;
      } catch (error) {
        formatAppLog("error", "at utils/storage.js:23", `[Storage] 保存数据失败: ${key}`, error);
        return false;
      }
    }
    /**
     * 同步获取数据
     * @param {string} key 键名
     * @param {any} defaultValue 默认值
     */
    getSync(key, defaultValue = null) {
      try {
        const fullKey = this.storagePrefix + key;
        const data = uni.getStorageSync(fullKey);
        if (data) {
          return JSON.parse(data);
        }
        return defaultValue;
      } catch (error) {
        formatAppLog("error", "at utils/storage.js:42", `[Storage] 获取数据失败: ${key}`, error);
        return defaultValue;
      }
    }
    /**
     * 异步设置数据
     * @param {string} key 键名
     * @param {any} data 数据
     */
    async set(key, data) {
      return new Promise((resolve, reject) => {
        const fullKey = this.storagePrefix + key;
        uni.setStorage({
          key: fullKey,
          data: JSON.stringify(data),
          success: () => {
            formatAppLog("log", "at utils/storage.js:59", `[Storage] 异步保存数据成功: ${key}`);
            resolve(true);
          },
          fail: (error) => {
            formatAppLog("error", "at utils/storage.js:63", `[Storage] 异步保存数据失败: ${key}`, error);
            reject(error);
          }
        });
      });
    }
    /**
     * 异步获取数据
     * @param {string} key 键名
     * @param {any} defaultValue 默认值
     */
    async get(key, defaultValue = null) {
      return new Promise((resolve) => {
        const fullKey = this.storagePrefix + key;
        uni.getStorage({
          key: fullKey,
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (error) {
              formatAppLog("error", "at utils/storage.js:85", `[Storage] 解析数据失败: ${key}`, error);
              resolve(defaultValue);
            }
          },
          fail: () => {
            resolve(defaultValue);
          }
        });
      });
    }
    /**
     * 删除数据
     * @param {string} key 键名
     */
    remove(key) {
      try {
        const fullKey = this.storagePrefix + key;
        uni.removeStorageSync(fullKey);
        formatAppLog("log", "at utils/storage.js:104", `[Storage] 删除数据成功: ${key}`);
        return true;
      } catch (error) {
        formatAppLog("error", "at utils/storage.js:107", `[Storage] 删除数据失败: ${key}`, error);
        return false;
      }
    }
    /**
     * 清空所有记账相关数据
     */
    clear() {
      try {
        const info = uni.getStorageInfoSync();
        const keys = info.keys.filter((key) => key.startsWith(this.storagePrefix));
        keys.forEach((key) => {
          uni.removeStorageSync(key);
        });
        formatAppLog("log", "at utils/storage.js:122", "[Storage] 清空数据成功");
        return true;
      } catch (error) {
        formatAppLog("error", "at utils/storage.js:125", "[Storage] 清空数据失败", error);
        return false;
      }
    }
    /**
     * 获取存储信息
     */
    getInfo() {
      try {
        const info = uni.getStorageInfoSync();
        const accountingKeys = info.keys.filter((key) => key.startsWith(this.storagePrefix));
        return {
          totalKeys: info.keys.length,
          accountingKeys: accountingKeys.length,
          currentSize: info.currentSize,
          limitSize: info.limitSize,
          keys: accountingKeys
        };
      } catch (error) {
        formatAppLog("error", "at utils/storage.js:145", "[Storage] 获取存储信息失败", error);
        return null;
      }
    }
  }
  const StorageManager$1 = new StorageManager();
  class Transaction {
    constructor(data = {}) {
      this.id = data.id || this.generateId();
      this.amount = data.amount || 0;
      this.type = data.type || "expense";
      this.categoryId = data.categoryId || "";
      this.categoryName = data.categoryName || "";
      this.categoryIcon = data.categoryIcon || "";
      this.note = data.note || "";
      this.date = data.date || (/* @__PURE__ */ new Date()).toISOString();
      this.accountId = data.accountId || "default";
      this.accountName = data.accountName || "默认账户";
      this.isDeleted = data.isDeleted || false;
      this.createdAt = data.createdAt || (/* @__PURE__ */ new Date()).toISOString();
      this.updatedAt = data.updatedAt || (/* @__PURE__ */ new Date()).toISOString();
      this.syncStatus = data.syncStatus || "pending";
    }
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    // 更新记录
    update(updates) {
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== void 0) {
          this[key] = updates[key];
        }
      });
      this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.syncStatus = "pending";
    }
    // 软删除
    softDelete() {
      this.isDeleted = true;
      this.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.syncStatus = "pending";
    }
    // 验证数据完整性
    validate() {
      const errors = [];
      if (!this.amount || this.amount <= 0) {
        errors.push("金额必须大于0");
      }
      if (!["income", "expense"].includes(this.type)) {
        errors.push("交易类型必须是收入或支出");
      }
      if (!this.categoryId) {
        errors.push("必须选择分类");
      }
      if (!this.date) {
        errors.push("必须设置日期");
      }
      return {
        isValid: errors.length === 0,
        errors
      };
    }
    // 转换为用于显示的格式
    toDisplayFormat() {
      return {
        ...this,
        formattedAmount: this.type === "expense" ? `-¥${this.amount.toFixed(2)}` : `+¥${this.amount.toFixed(2)}`,
        formattedDate: this.formatDate(this.date),
        amountColor: this.type === "expense" ? "#EF5350" : "#66BB6A"
      };
    }
    formatDate(dateString) {
      const date = new Date(dateString);
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const diffTime = today - targetDate;
      const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      if (diffDays === 0) {
        return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      } else if (diffDays === 1) {
        return `昨天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
      }
    }
  }
  class Category {
    constructor(data = {}) {
      this.id = data.id || this.generateId();
      this.name = data.name || "";
      this.icon = data.icon || "📝";
      this.color = data.color || "#FF8A65";
      this.type = data.type || "expense";
      this.sortOrder = data.sortOrder || 0;
      this.isCustom = data.isCustom || false;
      this.isDeleted = data.isDeleted || false;
      this.createdAt = data.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    }
    generateId() {
      return "cat_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
  }
  class Account {
    constructor(data = {}) {
      this.id = data.id || this.generateId();
      this.name = data.name || "";
      this.type = data.type || "cash";
      this.balance = data.balance || 0;
      this.icon = data.icon || "💰";
      this.color = data.color || "#64B5F6";
      this.isDefault = data.isDefault || false;
      this.isDeleted = data.isDeleted || false;
      this.createdAt = data.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    }
    generateId() {
      return "acc_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
  }
  class Statistics {
    constructor(data = {}) {
      this.period = data.period || "monthly";
      this.startDate = data.startDate || "";
      this.endDate = data.endDate || "";
      this.totalIncome = data.totalIncome || 0;
      this.totalExpense = data.totalExpense || 0;
      this.balance = data.balance || 0;
      this.transactionCount = data.transactionCount || 0;
      this.categoryStats = data.categoryStats || [];
      this.dailyStats = data.dailyStats || [];
      this.topCategories = data.topCategories || [];
    }
    get netIncome() {
      return this.totalIncome - this.totalExpense;
    }
    get avgDailyExpense() {
      const days = this.getDaysBetween(this.startDate, this.endDate);
      return days > 0 ? this.totalExpense / days : 0;
    }
    getDaysBetween(start, end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffTime = Math.abs(endDate - startDate);
      return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    }
  }
  const DEFAULT_CATEGORIES = {
    expense: [
      { id: "cat_food", name: "餐饮", icon: "🍽️", color: "#FF8A65", type: "expense", sortOrder: 1 },
      { id: "cat_transport", name: "交通", icon: "🚗", color: "#64B5F6", type: "expense", sortOrder: 2 },
      { id: "cat_shopping", name: "购物", icon: "🛍️", color: "#F06292", type: "expense", sortOrder: 3 },
      { id: "cat_entertainment", name: "娱乐", icon: "🎮", color: "#9C27B0", type: "expense", sortOrder: 4 },
      { id: "cat_medical", name: "医疗", icon: "💊", color: "#66BB6A", type: "expense", sortOrder: 5 },
      { id: "cat_education", name: "教育", icon: "📚", color: "#3F51B5", type: "expense", sortOrder: 6 },
      { id: "cat_housing", name: "居住", icon: "🏠", color: "#FFB74D", type: "expense", sortOrder: 7 },
      { id: "cat_utilities", name: "生活缴费", icon: "💡", color: "#FFC107", type: "expense", sortOrder: 8 },
      { id: "cat_others_expense", name: "其他支出", icon: "📝", color: "#9E9E9E", type: "expense", sortOrder: 9 }
    ],
    income: [
      { id: "cat_salary", name: "工资", icon: "💰", color: "#4CAF50", type: "income", sortOrder: 1 },
      { id: "cat_bonus", name: "奖金", icon: "💎", color: "#8BC34A", type: "income", sortOrder: 2 },
      { id: "cat_investment", name: "投资收益", icon: "📈", color: "#CDDC39", type: "income", sortOrder: 3 },
      { id: "cat_part_time", name: "兼职", icon: "⏰", color: "#FF9800", type: "income", sortOrder: 4 },
      { id: "cat_gift", name: "礼金", icon: "🎁", color: "#FF5722", type: "income", sortOrder: 5 },
      { id: "cat_others_income", name: "其他收入", icon: "➕", color: "#607D8B", type: "income", sortOrder: 6 }
    ]
  };
  const DEFAULT_ACCOUNTS = [
    { id: "acc_cash", name: "现金", type: "cash", icon: "💵", color: "#4CAF50", isDefault: true },
    { id: "acc_alipay", name: "支付宝", type: "alipay", icon: "🔵", color: "#1296DB" },
    { id: "acc_wechat", name: "微信", type: "wechat", icon: "💚", color: "#07C160" },
    { id: "acc_bank", name: "银行卡", type: "bank", icon: "🏦", color: "#FF5722" },
    { id: "acc_credit", name: "信用卡", type: "credit", icon: "💳", color: "#9C27B0" }
  ];
  class DataManager {
    constructor() {
      this.storage = StorageManager$1;
      this.isInitialized = false;
      this.syncCallbacks = /* @__PURE__ */ new Set();
    }
    /**
     * 初始化数据管理器
     */
    async initialize() {
      if (this.isInitialized)
        return;
      formatAppLog("log", "at utils/dataManager.js:22", "[DataManager] 开始初始化...");
      try {
        const isFirstRun = !this.storage.getSync("app_initialized", false);
        if (isFirstRun) {
          await this.initializeDefaultData();
          this.storage.setSync("app_initialized", true);
          this.storage.setSync("app_version", "1.0.0");
          formatAppLog("log", "at utils/dataManager.js:32", "[DataManager] 首次运行，已初始化默认数据");
        }
        this.isInitialized = true;
        formatAppLog("log", "at utils/dataManager.js:36", "[DataManager] 初始化完成");
        this.checkSync();
      } catch (error) {
        formatAppLog("error", "at utils/dataManager.js:42", "[DataManager] 初始化失败:", error);
        throw error;
      }
    }
    /**
     * 初始化默认数据
     */
    async initializeDefaultData() {
      const categories = [...DEFAULT_CATEGORIES.expense, ...DEFAULT_CATEGORIES.income];
      this.storage.setSync("categories", categories);
      this.storage.setSync("accounts", DEFAULT_ACCOUNTS);
      this.storage.setSync("transactions", []);
      const defaultSettings = {
        currency: "CNY",
        currencySymbol: "¥",
        theme: "warm",
        autoSync: true,
        reminderEnabled: true,
        reminderTime: "21:00",
        budgetAlertThreshold: 0.8
      };
      this.storage.setSync("app_settings", defaultSettings);
      formatAppLog("log", "at utils/dataManager.js:73", "[DataManager] 默认数据初始化完成");
    }
    // ==================== 交易记录管理 ====================
    /**
     * 添加交易记录
     */
    async addTransaction(transactionData) {
      try {
        await this.ensureInitialized();
        const transaction = new Transaction(transactionData);
        const validation = transaction.validate();
        if (!validation.isValid) {
          throw new Error(`数据验证失败: ${validation.errors.join(", ")}`);
        }
        const transactions = this.storage.getSync("transactions", []);
        transactions.unshift(transaction);
        this.storage.setSync("transactions", transactions);
        formatAppLog("log", "at utils/dataManager.js:97", "[DataManager] 交易记录添加成功:", transaction.id);
        this.triggerSync("transaction_add", transaction);
        return transaction;
      } catch (error) {
        formatAppLog("error", "at utils/dataManager.js:104", "[DataManager] 添加交易记录失败:", error);
        throw error;
      }
    }
    /**
     * 获取交易记录列表
     */
    async getTransactions(options = {}) {
      await this.ensureInitialized();
      const {
        type = null,
        // 'income' | 'expense' | null
        categoryId = null,
        // 分类ID筛选
        accountId = null,
        // 账户ID筛选
        startDate = null,
        // 开始日期
        endDate = null,
        // 结束日期
        limit = 50,
        // 限制数量
        offset = 0,
        // 偏移量
        includeDeleted = false
        // 是否包含已删除
      } = options;
      let transactions = this.storage.getSync("transactions", []);
      transactions = transactions.filter((t) => {
        if (!includeDeleted && t.isDeleted)
          return false;
        if (type && t.type !== type)
          return false;
        if (categoryId && t.categoryId !== categoryId)
          return false;
        if (accountId && t.accountId !== accountId)
          return false;
        if (startDate || endDate) {
          const tDate = new Date(t.date);
          if (startDate && tDate < new Date(startDate))
            return false;
          if (endDate && tDate > new Date(endDate))
            return false;
        }
        return true;
      });
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      const result = transactions.slice(offset, offset + limit);
      return {
        data: result.map((t) => new Transaction(t)),
        total: transactions.length,
        hasMore: offset + limit < transactions.length
      };
    }
    /**
     * 获取单个交易记录
     */
    async getTransaction(id) {
      await this.ensureInitialized();
      const transactions = this.storage.getSync("transactions", []);
      const transaction = transactions.find((t) => t.id === id && !t.isDeleted);
      return transaction ? new Transaction(transaction) : null;
    }
    /**
     * 更新交易记录
     */
    async updateTransaction(id, updates) {
      try {
        await this.ensureInitialized();
        const transactions = this.storage.getSync("transactions", []);
        const index = transactions.findIndex((t) => t.id === id);
        if (index === -1) {
          throw new Error("交易记录不存在");
        }
        const transaction = new Transaction(transactions[index]);
        transaction.update(updates);
        const validation = transaction.validate();
        if (!validation.isValid) {
          throw new Error(`数据验证失败: ${validation.errors.join(", ")}`);
        }
        transactions[index] = transaction;
        this.storage.setSync("transactions", transactions);
        formatAppLog("log", "at utils/dataManager.js:194", "[DataManager] 交易记录更新成功:", id);
        this.triggerSync("transaction_update", transaction);
        return transaction;
      } catch (error) {
        formatAppLog("error", "at utils/dataManager.js:201", "[DataManager] 更新交易记录失败:", error);
        throw error;
      }
    }
    /**
     * 删除交易记录（软删除）
     */
    async deleteTransaction(id) {
      try {
        await this.ensureInitialized();
        const transactions = this.storage.getSync("transactions", []);
        const index = transactions.findIndex((t) => t.id === id);
        if (index === -1) {
          throw new Error("交易记录不存在");
        }
        const transaction = new Transaction(transactions[index]);
        transaction.softDelete();
        transactions[index] = transaction;
        this.storage.setSync("transactions", transactions);
        formatAppLog("log", "at utils/dataManager.js:226", "[DataManager] 交易记录删除成功:", id);
        this.triggerSync("transaction_delete", transaction);
        return true;
      } catch (error) {
        formatAppLog("error", "at utils/dataManager.js:233", "[DataManager] 删除交易记录失败:", error);
        throw error;
      }
    }
    // ==================== 分类管理 ====================
    /**
     * 获取分类列表
     */
    async getCategories(type = null) {
      await this.ensureInitialized();
      let categories = this.storage.getSync("categories", []);
      formatAppLog("log", "at utils/dataManager.js:248", `[DataManager] 获取分类数据 - 类型: ${type}, 原始数据长度: ${categories.length}`);
      if (categories.length === 0) {
        formatAppLog("warn", "at utils/dataManager.js:251", "[DataManager] 分类数据为空，重新初始化...");
        await this.initializeDefaultData();
        categories = this.storage.getSync("categories", []);
      }
      if (type) {
        categories = categories.filter((c) => c.type === type && !c.isDeleted);
      } else {
        categories = categories.filter((c) => !c.isDeleted);
      }
      formatAppLog("log", "at utils/dataManager.js:262", `[DataManager] 过滤后分类数据长度: ${categories.length}`);
      categories.sort((a, b) => a.sortOrder - b.sortOrder);
      const result = categories.map((c) => new Category(c));
      formatAppLog("log", "at utils/dataManager.js:268", `[DataManager] 返回分类数据:`, result);
      return result;
    }
    /**
     * 获取单个分类
     */
    async getCategory(id) {
      await this.ensureInitialized();
      const categories = this.storage.getSync("categories", []);
      const category = categories.find((c) => c.id === id && !c.isDeleted);
      return category ? new Category(category) : null;
    }
    // ==================== 账户管理 ====================
    /**
     * 获取账户列表
     */
    async getAccounts() {
      await this.ensureInitialized();
      const accounts = this.storage.getSync("accounts", []);
      return accounts.filter((a) => !a.isDeleted).map((a) => new Account(a));
    }
    /**
     * 获取默认账户
     */
    async getDefaultAccount() {
      const accounts = await this.getAccounts();
      return accounts.find((a) => a.isDefault) || accounts[0] || null;
    }
    // ==================== 统计分析 ====================
    /**
     * 获取统计数据
     */
    async getStatistics(period = "monthly", customRange = null) {
      await this.ensureInitialized();
      let startDate, endDate;
      const now = /* @__PURE__ */ new Date();
      if (customRange) {
        startDate = new Date(customRange.startDate);
        endDate = new Date(customRange.endDate);
      } else {
        switch (period) {
          case "daily":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case "weekly":
            const currentDay = now.getDay();
            const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - mondayOffset);
            startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1e3);
            break;
          case "yearly":
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
      }
      const transactions = await this.getTransactions({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1e4
        // 获取所有数据用于统计
      });
      return this.calculateStatistics(transactions.data, startDate, endDate, period);
    }
    /**
     * 计算统计数据
     */
    calculateStatistics(transactions, startDate, endDate, period) {
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryStats = /* @__PURE__ */ new Map();
      const dailyStats = /* @__PURE__ */ new Map();
      transactions.forEach((transaction) => {
        if (transaction.type === "income") {
          totalIncome += transaction.amount;
        } else {
          totalExpense += transaction.amount;
        }
        const categoryKey = transaction.categoryId;
        if (!categoryStats.has(categoryKey)) {
          categoryStats.set(categoryKey, {
            categoryId: transaction.categoryId,
            categoryName: transaction.categoryName,
            categoryIcon: transaction.categoryIcon,
            type: transaction.type,
            amount: 0,
            count: 0
          });
        }
        const categoryStat = categoryStats.get(categoryKey);
        categoryStat.amount += transaction.amount;
        categoryStat.count += 1;
        const dateKey = new Date(transaction.date).toDateString();
        if (!dailyStats.has(dateKey)) {
          dailyStats.set(dateKey, { date: dateKey, income: 0, expense: 0 });
        }
        const dailyStat = dailyStats.get(dateKey);
        if (transaction.type === "income") {
          dailyStat.income += transaction.amount;
        } else {
          dailyStat.expense += transaction.amount;
        }
      });
      const categoryStatsArray = Array.from(categoryStats.values()).sort((a, b) => b.amount - a.amount);
      const dailyStatsArray = Array.from(dailyStats.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
      const topCategories = categoryStatsArray.filter((c) => c.type === "expense").slice(0, 5);
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
      });
    }
    // ==================== 同步管理 ====================
    /**
     * 触发数据同步
     */
    triggerSync(action, data) {
      const pendingSync = this.storage.getSync("pending_sync", []);
      pendingSync.push({
        action,
        data: data ? data.id : null,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.storage.setSync("pending_sync", pendingSync);
      this.syncCallbacks.forEach((callback) => {
        try {
          callback(action, data);
        } catch (error) {
          formatAppLog("error", "at utils/dataManager.js:443", "[DataManager] 同步回调执行失败:", error);
        }
      });
    }
    /**
     * 检查同步状态
     */
    async checkSync() {
      const pendingSync = this.storage.getSync("pending_sync", []);
      if (pendingSync.length > 0) {
        formatAppLog("log", "at utils/dataManager.js:454", `[DataManager] 发现 ${pendingSync.length} 个待同步项目`);
      }
    }
    /**
     * 注册同步回调
     */
    onSync(callback) {
      this.syncCallbacks.add(callback);
      return () => this.syncCallbacks.delete(callback);
    }
    // ==================== 工具方法 ====================
    /**
     * 确保已初始化
     */
    async ensureInitialized() {
      if (!this.isInitialized) {
        await this.initialize();
      }
    }
    /**
     * 获取应用设置
     */
    getSettings() {
      return this.storage.getSync("app_settings", {});
    }
    /**
     * 更新应用设置
     */
    updateSettings(updates) {
      const current = this.getSettings();
      const newSettings = { ...current, ...updates };
      this.storage.setSync("app_settings", newSettings);
      return newSettings;
    }
    /**
     * 导出数据（用于备份）
     */
    async exportData() {
      await this.ensureInitialized();
      return {
        version: "1.0.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        transactions: this.storage.getSync("transactions", []),
        categories: this.storage.getSync("categories", []),
        accounts: this.storage.getSync("accounts", []),
        settings: this.storage.getSync("app_settings", {})
      };
    }
    /**
     * 清除所有数据
     */
    async clearAllData() {
      this.storage.clear();
      this.isInitialized = false;
      formatAppLog("log", "at utils/dataManager.js:517", "[DataManager] 所有数据已清除");
    }
  }
  const DataManager$1 = new DataManager();
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$6 = {
    data() {
      return {
        todayStats: {
          expense: 0,
          income: 0,
          transactions: 0
        },
        loading: false,
        recentActivities: []
      };
    },
    async onLoad() {
      await Promise.all([
        this.loadTodayStats(),
        this.loadRecentActivities()
      ]);
    },
    async onShow() {
      await Promise.all([
        this.loadTodayStats(),
        this.loadRecentActivities()
      ]);
    },
    methods: {
      /**
       * 加载今日统计数据
       */
      async loadTodayStats() {
        try {
          this.loading = true;
          const stats = await DataManager$1.getStatistics("daily");
          this.todayStats = {
            expense: stats.totalExpense,
            income: stats.totalIncome,
            transactions: stats.transactionCount
          };
          formatAppLog("log", "at pages/index/index.vue:195", "[HomePage] 今日统计加载完成:", this.todayStats);
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:198", "[HomePage] 今日统计加载失败:", error);
        } finally {
          this.loading = false;
        }
      },
      /**
       * 获取支出进度条百分比
       */
      getExpenseProgress() {
        const maxExpense = 200;
        const progress = Math.min(this.todayStats.expense / maxExpense * 100, 100);
        return `${progress}%`;
      },
      /**
       * 加载近期活动数据
       */
      async loadRecentActivities() {
        try {
          const result = await DataManager$1.getTransactions({
            limit: 5,
            // 最近5条
            offset: 0
          });
          this.recentActivities = result.data.map((transaction) => {
            return {
              id: transaction.id,
              type: transaction.type,
              title: transaction.note || `${transaction.categoryName}消费`,
              timeText: this.formatActivityTime(transaction.date),
              description: `${transaction.type === "expense" ? "支出" : "收入"} ¥${transaction.amount.toFixed(2)}`
            };
          });
          formatAppLog("log", "at pages/index/index.vue:236", "[HomePage] 近期活动加载完成:", this.recentActivities.length);
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:239", "[HomePage] 近期活动加载失败:", error);
        }
      },
      /**
       * 格式化活动时间
       */
      formatActivityTime(dateString) {
        const date = new Date(dateString);
        const now = /* @__PURE__ */ new Date();
        const diffTime = now - date;
        const diffHours = Math.floor(diffTime / (1e3 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
        if (diffHours < 1) {
          const diffMinutes = Math.floor(diffTime / (1e3 * 60));
          return diffMinutes < 1 ? "刚刚" : `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
          return `${diffHours}小时前`;
        } else if (diffDays === 1) {
          return "昨天";
        } else if (diffDays < 7) {
          return `${diffDays}天前`;
        } else {
          return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
        }
      },
      /**
       * 获取活动点样式类名
       */
      getActivityDotClass(type) {
        return type === "expense" ? "dot-primary" : "dot-secondary";
      },
      navigateToAccounting() {
        uni.navigateTo({
          url: "/pages/accounting/add"
        });
      },
      navigateToAccountingHome() {
        uni.navigateTo({
          url: "/pages/accounting/index"
        });
      },
      navigateToDiary() {
        uni.showToast({
          title: "日记功能开发中",
          icon: "none"
        });
      },
      navigateToTodo() {
        uni.showToast({
          title: "待办功能开发中",
          icon: "none"
        });
      },
      navigateToSettings() {
        uni.showToast({
          title: "设置功能开发中",
          icon: "none"
        });
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createCommentVNode(" 头部问候区域 "),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "greeting-area" }, [
          vue.createElementVNode("view", { class: "greeting-text" }, [
            vue.createElementVNode("text", { class: "greeting-title" }, "早安，小明"),
            vue.createElementVNode("text", { class: "greeting-subtitle" }, "今天也要元气满满哦 ✨")
          ]),
          vue.createElementVNode("view", { class: "sun-icon animate-float" }, [
            vue.createElementVNode("text", { class: "sun-emoji" }, "☀️")
          ])
        ]),
        vue.createCommentVNode(" 日期卡片 "),
        vue.createElementVNode("view", { class: "date-card glass-card" }, [
          vue.createElementVNode("view", { class: "date-content" }, [
            vue.createElementVNode("view", { class: "date-left" }, [
              vue.createElementVNode("text", { class: "date-number" }, "12月18日"),
              vue.createElementVNode("text", { class: "date-desc" }, "星期一 · 冬至将至")
            ]),
            vue.createElementVNode("view", { class: "weather-info" }, [
              vue.createElementVNode("text", { class: "temperature" }, "22°C"),
              vue.createElementVNode("text", { class: "weather-desc" }, "晴朗温暖")
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 快速功能入口 "),
      vue.createElementVNode("view", { class: "quick-actions" }, [
        vue.createElementVNode("text", { class: "section-title" }, "快速入口"),
        vue.createElementVNode("view", { class: "actions-grid" }, [
          vue.createCommentVNode(" 记账入口 "),
          vue.createElementVNode("view", {
            class: "action-item glass-card",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.navigateToAccounting && $options.navigateToAccounting(...args))
          }, [
            vue.createElementVNode("view", { class: "action-icon accounting-icon" }, [
              vue.createElementVNode("text", { class: "icon-emoji" }, "💰")
            ]),
            vue.createElementVNode("text", { class: "action-title" }, "记一笔"),
            vue.createElementVNode("text", { class: "action-subtitle" }, "添加记录")
          ]),
          vue.createCommentVNode(" 日记入口 "),
          vue.createElementVNode("view", {
            class: "action-item glass-card",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.navigateToDiary && $options.navigateToDiary(...args))
          }, [
            vue.createElementVNode("view", { class: "action-icon diary-icon" }, [
              vue.createElementVNode("text", { class: "icon-emoji" }, "📝")
            ]),
            vue.createElementVNode("text", { class: "action-title" }, "日记"),
            vue.createElementVNode("text", { class: "action-subtitle" }, "记录心情")
          ]),
          vue.createCommentVNode(" 待办入口 "),
          vue.createElementVNode("view", {
            class: "action-item glass-card",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.navigateToTodo && $options.navigateToTodo(...args))
          }, [
            vue.createElementVNode("view", { class: "action-icon todo-icon" }, [
              vue.createElementVNode("text", { class: "icon-emoji" }, "✅")
            ]),
            vue.createElementVNode("text", { class: "action-title" }, "待办"),
            vue.createElementVNode("text", { class: "action-subtitle" }, "任务管理")
          ])
        ])
      ]),
      vue.createCommentVNode(" 今日数据统计 "),
      vue.createElementVNode("view", { class: "daily-stats" }, [
        vue.createElementVNode("text", { class: "section-title" }, "今日数据"),
        vue.createElementVNode("view", { class: "stats-card glass-card" }, [
          vue.createElementVNode("view", { class: "stats-grid" }, [
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode(
                "text",
                { class: "stat-number number-gradient" },
                "¥" + vue.toDisplayString($data.todayStats.expense.toFixed(2)),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "stat-label" }, "今日支出"),
              vue.createElementVNode("view", { class: "progress-bar" }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "progress-fill",
                    style: vue.normalizeStyle({ width: $options.getExpenseProgress() })
                  },
                  null,
                  4
                  /* STYLE */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "stat-item stat-divider" }, [
              vue.createElementVNode("text", { class: "stat-number number-gradient" }, "3"),
              vue.createElementVNode("text", { class: "stat-label" }, "待办任务"),
              vue.createElementVNode("view", { class: "progress-dots" }, [
                vue.createElementVNode("view", { class: "dot dot-primary" }),
                vue.createElementVNode("view", { class: "dot dot-secondary" }),
                vue.createElementVNode("view", { class: "dot dot-gray" })
              ])
            ]),
            vue.createElementVNode("view", { class: "stat-item" }, [
              vue.createElementVNode("text", { class: "stat-number number-gradient" }, "1"),
              vue.createElementVNode("text", { class: "stat-label" }, "日记篇数"),
              vue.createElementVNode("view", { class: "heart-icon" }, [
                vue.createElementVNode("text", { class: "heart-emoji" }, "❤️")
              ])
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 近期活动时间线 "),
      vue.createElementVNode("view", { class: "recent-activities" }, [
        vue.createElementVNode("text", { class: "section-title" }, "近期活动"),
        $data.recentActivities.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "activity-list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.recentActivities, (activity, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "activity-item",
                key: activity.id
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: vue.normalizeClass(["activity-dot", $options.getActivityDotClass(activity.type)])
                  },
                  null,
                  2
                  /* CLASS */
                ),
                vue.createElementVNode("view", { class: "activity-content" }, [
                  vue.createElementVNode("view", { class: "activity-card glass-card" }, [
                    vue.createElementVNode("view", { class: "activity-header" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "activity-title" },
                        vue.toDisplayString(activity.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "activity-time" },
                        vue.toDisplayString(activity.timeText),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "activity-desc" },
                      vue.toDisplayString(activity.description),
                      1
                      /* TEXT */
                    )
                  ])
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            vue.createCommentVNode(" 空状态 "),
            vue.createElementVNode("view", { class: "activity-empty" }, [
              vue.createElementVNode("view", { class: "empty-icon" }, "📝"),
              vue.createElementVNode("text", { class: "empty-text" }, "暂无近期活动"),
              vue.createElementVNode("text", { class: "empty-hint" }, "开始记账创建第一个活动")
            ])
          ],
          2112
          /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
        ))
      ]),
      vue.createCommentVNode(" 底部导航栏 "),
      vue.createElementVNode("view", { class: "bottom-navigation" }, [
        vue.createElementVNode("view", { class: "nav-item nav-active" }, [
          vue.createElementVNode("view", { class: "nav-icon nav-icon-active" }, [
            vue.createElementVNode("text", { class: "nav-emoji" }, "🏠")
          ]),
          vue.createElementVNode("text", { class: "nav-text nav-text-active" }, "首页")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[3] || (_cache[3] = (...args) => $options.navigateToAccountingHome && $options.navigateToAccountingHome(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji nav-emoji-inactive" }, "💰"),
          vue.createElementVNode("text", { class: "nav-text nav-text-inactive" }, "记账")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[4] || (_cache[4] = (...args) => $options.navigateToDiary && $options.navigateToDiary(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji nav-emoji-inactive" }, "📝"),
          vue.createElementVNode("text", { class: "nav-text nav-text-inactive" }, "日记")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[5] || (_cache[5] = (...args) => $options.navigateToSettings && $options.navigateToSettings(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji nav-emoji-inactive" }, "⚙️"),
          vue.createElementVNode("text", { class: "nav-text nav-text-inactive" }, "设置")
        ])
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__file", "E:/app/oneself/oneself/pages/index/index.vue"]]);
  const _sfc_main$5 = {
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
      };
    },
    computed: {
      /**
       * 格式化当前日期显示
       */
      formattedDates() {
        const now = /* @__PURE__ */ new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          today: `${now.getMonth() + 1}月${now.getDate()}日`,
          week: `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日-${endOfWeek.getDate()}日`,
          month: `${now.getMonth() + 1}月`,
          year: `${now.getFullYear()}年`
        };
      }
    },
    async onLoad() {
      await this.initializeData();
    },
    async onShow() {
      if (!this.loading) {
        await this.refreshData();
      }
    },
    // 下拉刷新
    async onPullDownRefresh() {
      await this.refreshData();
      uni.stopPullDownRefresh();
    },
    methods: {
      /**
       * 初始化页面数据
       */
      async initializeData() {
        try {
          this.loading = true;
          await DataManager$1.initialize();
          await Promise.all([
            this.loadStatistics(),
            this.loadRecentTransactions(),
            this.loadTimeStats()
          ]);
          formatAppLog("log", "at pages/accounting/index.vue:299", "[AccountingIndex] 数据加载完成");
        } catch (error) {
          formatAppLog("error", "at pages/accounting/index.vue:302", "[AccountingIndex] 数据初始化失败:", error);
          uni.showToast({
            title: "数据加载失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      /**
       * 刷新数据
       */
      async refreshData() {
        try {
          this.refreshing = true;
          await Promise.all([
            this.loadStatistics(),
            this.loadRecentTransactions(),
            this.loadTimeStats()
          ]);
          formatAppLog("log", "at pages/accounting/index.vue:325", "[AccountingIndex] 数据刷新完成");
        } catch (error) {
          formatAppLog("error", "at pages/accounting/index.vue:328", "[AccountingIndex] 数据刷新失败:", error);
          uni.showToast({
            title: "刷新失败",
            icon: "none"
          });
        } finally {
          this.refreshing = false;
        }
      },
      /**
       * 加载统计数据
       */
      async loadStatistics() {
        try {
          const stats = await DataManager$1.getStatistics("monthly");
          this.statistics = {
            totalIncome: stats.totalIncome,
            totalExpense: stats.totalExpense,
            balance: stats.balance,
            transactionCount: stats.transactionCount
          };
          formatAppLog("log", "at pages/accounting/index.vue:351", "[AccountingIndex] 统计数据加载完成:", this.statistics);
        } catch (error) {
          formatAppLog("error", "at pages/accounting/index.vue:354", "[AccountingIndex] 统计数据加载失败:", error);
        }
      },
      /**
       * 加载最近交易记录
       */
      async loadRecentTransactions() {
        try {
          const result = await DataManager$1.getTransactions({
            limit: 5,
            // 只显示最近5条
            offset: 0
          });
          this.recentTransactions = result.data;
          formatAppLog("log", "at pages/accounting/index.vue:370", "[AccountingIndex] 最近交易记录加载完成:", result.data.length);
        } catch (error) {
          formatAppLog("error", "at pages/accounting/index.vue:373", "[AccountingIndex] 最近交易记录加载失败:", error);
        }
      },
      /**
       * 加载时间维度统计数据
       */
      async loadTimeStats() {
        try {
          const [todayStats, weekStats, monthStats, yearStats] = await Promise.all([
            DataManager$1.getStatistics("daily"),
            DataManager$1.getStatistics("weekly"),
            DataManager$1.getStatistics("monthly"),
            DataManager$1.getStatistics("yearly")
          ]);
          this.timeStats = {
            today: {
              income: todayStats.totalIncome,
              expense: todayStats.totalExpense,
              incomeCount: todayStats.categoryStats.filter((c) => c.type === "income").reduce((sum, c) => sum + c.count, 0),
              expenseCount: todayStats.categoryStats.filter((c) => c.type === "expense").reduce((sum, c) => sum + c.count, 0)
            },
            week: {
              income: weekStats.totalIncome,
              expense: weekStats.totalExpense,
              incomeCount: weekStats.categoryStats.filter((c) => c.type === "income").reduce((sum, c) => sum + c.count, 0),
              expenseCount: weekStats.categoryStats.filter((c) => c.type === "expense").reduce((sum, c) => sum + c.count, 0)
            },
            month: {
              income: monthStats.totalIncome,
              expense: monthStats.totalExpense,
              incomeCount: monthStats.categoryStats.filter((c) => c.type === "income").reduce((sum, c) => sum + c.count, 0),
              expenseCount: monthStats.categoryStats.filter((c) => c.type === "expense").reduce((sum, c) => sum + c.count, 0)
            },
            year: {
              income: yearStats.totalIncome,
              expense: yearStats.totalExpense,
              incomeCount: yearStats.categoryStats.filter((c) => c.type === "income").reduce((sum, c) => sum + c.count, 0),
              expenseCount: yearStats.categoryStats.filter((c) => c.type === "expense").reduce((sum, c) => sum + c.count, 0)
            }
          };
          formatAppLog("log", "at pages/accounting/index.vue:417", "[AccountingIndex] 时间统计数据加载完成:", this.timeStats);
        } catch (error) {
          formatAppLog("error", "at pages/accounting/index.vue:420", "[AccountingIndex] 时间统计数据加载失败:", error);
        }
      },
      /**
       * 格式化交易日期
       */
      formatTransactionDate(dateString) {
        const date = new Date(dateString);
        const now = /* @__PURE__ */ new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffTime = today - targetDate;
        const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
        if (diffDays === 0) {
          return `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
        } else if (diffDays === 1) {
          return `昨天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
        } else if (diffDays < 7) {
          return `${diffDays}天前`;
        } else {
          return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
        }
      },
      /**
       * 获取交易颜色（基于分类）
       */
      getTransactionColor(transaction) {
        return transaction.type === "expense" ? "#FF8A65" : "#66BB6A";
      },
      /**
       * 跳转到交易详情
       */
      goToTransactionDetail(transactionId) {
        uni.navigateTo({
          url: `/pages/accounting/edit?id=${transactionId}`
        });
      },
      goToHome() {
        uni.reLaunch({
          url: "/pages/index/index"
        });
      },
      goToAdd() {
        uni.navigateTo({
          url: "/pages/accounting/add"
        });
      },
      goToDetail(type) {
        uni.navigateTo({
          url: `/pages/accounting/detail?type=${type}`
        });
      },
      goToStats() {
        uni.navigateTo({
          url: "/pages/accounting/stats"
        });
      },
      goToDiary() {
        uni.showToast({
          title: "日记功能开发中",
          icon: "none"
        });
      },
      goToSettings() {
        uni.showToast({
          title: "设置功能开发中",
          icon: "none"
        });
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createCommentVNode(" 头部区域 "),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "header-top" }, [
          vue.createElementVNode("text", { class: "header-title" }, "我的账本"),
          vue.createElementVNode("view", {
            class: "add-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goToAdd && $options.goToAdd(...args))
          }, [
            vue.createElementVNode("text", { class: "add-icon" }, "+")
          ])
        ])
      ]),
      vue.createCommentVNode(" 总体概览 "),
      vue.createElementVNode("view", { class: "overview-section" }, [
        vue.createElementVNode("view", { class: "overview-card" }, [
          vue.createElementVNode("view", { class: "overview-header" }, [
            vue.createElementVNode("text", { class: "overview-title" }, "总览"),
            vue.createElementVNode("text", {
              class: "detail-link",
              onClick: _cache[1] || (_cache[1] = (...args) => $options.goToStats && $options.goToStats(...args))
            }, "详细统计 >")
          ]),
          vue.createElementVNode("view", { class: "balance-section" }, [
            vue.createElementVNode(
              "text",
              { class: "balance-amount" },
              "¥" + vue.toDisplayString($data.statistics.balance.toFixed(2)),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "balance-label" }, "本月结余")
          ]),
          vue.createElementVNode("view", { class: "income-expense-row" }, [
            vue.createElementVNode("view", { class: "income-item" }, [
              vue.createElementVNode(
                "text",
                { class: "income-amount" },
                "¥" + vue.toDisplayString($data.statistics.totalIncome.toFixed(2)),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "income-label" }, "本月收入")
            ]),
            vue.createElementVNode("view", { class: "expense-item" }, [
              vue.createElementVNode(
                "text",
                { class: "expense-amount" },
                "¥" + vue.toDisplayString($data.statistics.totalExpense.toFixed(2)),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "expense-label" }, "本月支出")
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 查看账目 "),
      vue.createElementVNode("view", { class: "time-dimension-section" }, [
        vue.createElementVNode("text", { class: "section-title" }, "查看账目"),
        vue.createElementVNode("view", { class: "time-cards" }, [
          vue.createCommentVNode(" 今天 "),
          vue.createElementVNode("view", {
            class: "time-card",
            onClick: _cache[2] || (_cache[2] = ($event) => $options.goToDetail("today"))
          }, [
            vue.createElementVNode("view", { class: "time-card-content" }, [
              vue.createElementVNode("view", { class: "time-card-left" }, [
                vue.createElementVNode("view", { class: "time-icon today-icon" }, [
                  vue.createElementVNode("text", { class: "icon-emoji" }, "📅")
                ]),
                vue.createElementVNode("view", { class: "time-info" }, [
                  vue.createElementVNode("text", { class: "time-title" }, "今天"),
                  vue.createElementVNode(
                    "text",
                    { class: "time-subtitle" },
                    vue.toDisplayString($options.formattedDates.today),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "time-card-right" }, [
                vue.createElementVNode("view", { class: "count-display" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "income-count" },
                    "+¥" + vue.toDisplayString($data.timeStats.today.income.toFixed(0)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "expense-count" },
                    "-¥" + vue.toDisplayString($data.timeStats.today.expense.toFixed(0)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("text", { class: "chevron-icon" }, "›")
              ])
            ])
          ]),
          vue.createCommentVNode(" 本周 "),
          vue.createElementVNode("view", {
            class: "time-card",
            onClick: _cache[3] || (_cache[3] = ($event) => $options.goToDetail("week"))
          }, [
            vue.createElementVNode("view", { class: "time-card-content" }, [
              vue.createElementVNode("view", { class: "time-card-left" }, [
                vue.createElementVNode("view", { class: "time-icon week-icon" }, [
                  vue.createElementVNode("text", { class: "icon-emoji" }, "📊")
                ]),
                vue.createElementVNode("view", { class: "time-info" }, [
                  vue.createElementVNode("text", { class: "time-title" }, "本周"),
                  vue.createElementVNode(
                    "text",
                    { class: "time-subtitle" },
                    vue.toDisplayString($options.formattedDates.week),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "time-card-right" }, [
                vue.createElementVNode("view", { class: "count-display" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "income-count" },
                    "+¥" + vue.toDisplayString($data.timeStats.week.income.toFixed(0)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "expense-count" },
                    "-¥" + vue.toDisplayString($data.timeStats.week.expense.toFixed(0)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("text", { class: "chevron-icon" }, "›")
              ])
            ])
          ]),
          vue.createCommentVNode(" 本月 "),
          vue.createElementVNode("view", {
            class: "time-card",
            onClick: _cache[4] || (_cache[4] = ($event) => $options.goToDetail("month"))
          }, [
            vue.createElementVNode("view", { class: "time-card-content" }, [
              vue.createElementVNode("view", { class: "time-card-left" }, [
                vue.createElementVNode("view", { class: "time-icon month-icon" }, [
                  vue.createElementVNode("text", { class: "icon-emoji" }, "📆")
                ]),
                vue.createElementVNode("view", { class: "time-info" }, [
                  vue.createElementVNode("text", { class: "time-title" }, "本月"),
                  vue.createElementVNode(
                    "text",
                    { class: "time-subtitle" },
                    vue.toDisplayString($options.formattedDates.month),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "time-card-right" }, [
                vue.createElementVNode("view", { class: "count-display" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "income-count" },
                    "+¥" + vue.toDisplayString($data.timeStats.month.income.toFixed(0)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "expense-count" },
                    "-¥" + vue.toDisplayString($data.timeStats.month.expense.toFixed(0)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("text", { class: "chevron-icon" }, "›")
              ])
            ])
          ]),
          vue.createCommentVNode(" 今年 "),
          vue.createElementVNode("view", {
            class: "time-card",
            onClick: _cache[5] || (_cache[5] = ($event) => $options.goToDetail("year"))
          }, [
            vue.createElementVNode("view", { class: "time-card-content" }, [
              vue.createElementVNode("view", { class: "time-card-left" }, [
                vue.createElementVNode("view", { class: "time-icon year-icon" }, [
                  vue.createElementVNode("text", { class: "icon-emoji" }, "📈")
                ]),
                vue.createElementVNode("view", { class: "time-info" }, [
                  vue.createElementVNode("text", { class: "time-title" }, "今年"),
                  vue.createElementVNode(
                    "text",
                    { class: "time-subtitle" },
                    vue.toDisplayString($options.formattedDates.year),
                    1
                    /* TEXT */
                  )
                ])
              ]),
              vue.createElementVNode("view", { class: "time-card-right" }, [
                vue.createElementVNode("view", { class: "count-display" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "income-count" },
                    "+¥" + vue.toDisplayString($data.timeStats.year.income.toFixed(0)),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "expense-count" },
                    "-¥" + vue.toDisplayString($data.timeStats.year.expense.toFixed(0)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("text", { class: "chevron-icon" }, "›")
              ])
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 最近交易记录 "),
      vue.createElementVNode("view", { class: "recent-transactions-section" }, [
        vue.createElementVNode("view", { class: "section-header" }, [
          vue.createElementVNode("text", { class: "section-title" }, "最近记录"),
          vue.createElementVNode("text", {
            class: "view-all-link",
            onClick: _cache[6] || (_cache[6] = ($event) => $options.goToDetail("recent"))
          }, "查看全部 >")
        ]),
        vue.createCommentVNode(" 加载状态 "),
        $data.loading ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading-container"
        }, [
          vue.createElementVNode("text", { class: "loading-text" }, "加载中...")
        ])) : $data.recentTransactions.length > 0 ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            vue.createCommentVNode(" 交易记录列表 "),
            vue.createElementVNode("view", { class: "transaction-list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.recentTransactions, (transaction) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "transaction-item",
                    key: transaction.id,
                    onClick: ($event) => $options.goToTransactionDetail(transaction.id)
                  }, [
                    vue.createElementVNode("view", { class: "transaction-content" }, [
                      vue.createElementVNode("view", { class: "transaction-left" }, [
                        vue.createElementVNode(
                          "view",
                          {
                            class: "category-icon",
                            style: vue.normalizeStyle({ backgroundColor: $options.getTransactionColor(transaction) })
                          },
                          [
                            vue.createElementVNode(
                              "text",
                              { class: "category-emoji" },
                              vue.toDisplayString(transaction.categoryIcon),
                              1
                              /* TEXT */
                            )
                          ],
                          4
                          /* STYLE */
                        ),
                        vue.createElementVNode("view", { class: "transaction-info" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "transaction-note" },
                            vue.toDisplayString(transaction.note || transaction.categoryName),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "transaction-meta" },
                            vue.toDisplayString(transaction.categoryName) + " · " + vue.toDisplayString($options.formatTransactionDate(transaction.date)),
                            1
                            /* TEXT */
                          )
                        ])
                      ]),
                      vue.createElementVNode("view", { class: "transaction-right" }, [
                        vue.createElementVNode(
                          "text",
                          {
                            class: "transaction-amount",
                            style: vue.normalizeStyle({ color: transaction.type === "expense" ? "#EF5350" : "#66BB6A" })
                          },
                          vue.toDisplayString(transaction.type === "expense" ? "-" : "+") + "¥" + vue.toDisplayString(transaction.amount.toFixed(2)),
                          5
                          /* TEXT, STYLE */
                        )
                      ])
                    ])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ],
          2112
          /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
        )) : (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 2 },
          [
            vue.createCommentVNode(" 空状态 "),
            vue.createElementVNode("view", { class: "empty-state" }, [
              vue.createElementVNode("view", { class: "empty-icon" }, "📝"),
              vue.createElementVNode("text", { class: "empty-text" }, "还没有记录"),
              vue.createElementVNode("text", { class: "empty-hint" }, "点击右上角 + 开始记账")
            ])
          ],
          2112
          /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
        ))
      ]),
      vue.createCommentVNode(" 快速操作 "),
      vue.createElementVNode("view", { class: "quick-actions-section" }, [
        vue.createElementVNode("text", { class: "section-title" }, "快速操作"),
        vue.createElementVNode("view", { class: "quick-actions" }, [
          vue.createElementVNode("view", {
            class: "quick-action",
            onClick: _cache[7] || (_cache[7] = (...args) => $options.goToAdd && $options.goToAdd(...args))
          }, [
            vue.createElementVNode("view", { class: "quick-icon add-quick-icon" }, [
              vue.createElementVNode("text", { class: "add-icon" }, "+")
            ]),
            vue.createElementVNode("text", { class: "quick-label" }, "记一笔")
          ]),
          vue.createElementVNode("view", {
            class: "quick-action",
            onClick: _cache[8] || (_cache[8] = (...args) => $options.goToStats && $options.goToStats(...args))
          }, [
            vue.createElementVNode("view", { class: "quick-icon stats-icon" }, [
              vue.createElementVNode("text", { class: "icon-emoji" }, "📊")
            ]),
            vue.createElementVNode("text", { class: "quick-label" }, "统计分析")
          ])
        ])
      ]),
      vue.createCommentVNode(" 底部导航 "),
      vue.createElementVNode("view", { class: "bottom-nav" }, [
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[9] || (_cache[9] = (...args) => $options.goToHome && $options.goToHome(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "🏠"),
          vue.createElementVNode("text", { class: "nav-label" }, "首页")
        ]),
        vue.createElementVNode("view", { class: "nav-item active" }, [
          vue.createElementVNode("view", { class: "nav-icon-active" }, [
            vue.createElementVNode("text", { class: "nav-emoji" }, "💰")
          ]),
          vue.createElementVNode("text", { class: "nav-label-active" }, "记账")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[10] || (_cache[10] = (...args) => $options.goToDiary && $options.goToDiary(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "📖"),
          vue.createElementVNode("text", { class: "nav-label" }, "日记")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[11] || (_cache[11] = (...args) => $options.goToSettings && $options.goToSettings(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "⚙️"),
          vue.createElementVNode("text", { class: "nav-label" }, "设置")
        ])
      ])
    ]);
  }
  const PagesAccountingIndex = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-0bb450b5"], ["__file", "E:/app/oneself/oneself/pages/accounting/index.vue"]]);
  const _sfc_main$4 = {
    data() {
      return {
        recordType: "expense",
        // 'expense' | 'income'
        amount: "",
        selectedCategory: null,
        // 选中的分类对象
        selectedAccount: null,
        // 选中的账户
        note: "",
        selectedDate: /* @__PURE__ */ new Date(),
        loading: false,
        // 动态加载的数据
        expenseCategories: [],
        incomeCategories: [],
        accounts: [],
        // 界面控制
        showDateModal: false,
        showAccountModal: false,
        amountFocused: false
      };
    },
    computed: {
      currentCategories() {
        return this.recordType === "expense" ? this.expenseCategories : this.incomeCategories;
      },
      canSave() {
        return this.amount && parseFloat(this.amount) > 0 && this.selectedCategory && this.selectedAccount;
      },
      formattedDate() {
        const date = this.selectedDate;
        return `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, "0")}月${date.getDate().toString().padStart(2, "0")}日`;
      },
      amountPlaceholder() {
        return this.amountFocused ? "" : "0.00";
      },
      displayAmount() {
        if (!this.amount && !this.amountFocused) {
          return "";
        }
        return this.amount;
      }
    },
    async onLoad() {
      await this.initializeData();
    },
    methods: {
      /**
       * 初始化页面数据
       */
      async initializeData() {
        try {
          uni.showLoading({ title: "加载中..." });
          formatAppLog("log", "at pages/accounting/add.vue:213", "[AddPage] 开始初始化数据管理器...");
          await DataManager$1.initialize();
          formatAppLog("log", "at pages/accounting/add.vue:218", "[AddPage] 数据管理器初始化完成，开始加载分类...");
          this.expenseCategories = await DataManager$1.getCategories("expense");
          this.incomeCategories = await DataManager$1.getCategories("income");
          formatAppLog("log", "at pages/accounting/add.vue:224", "[AddPage] 分类数据加载完成:", {
            expenseCount: this.expenseCategories.length,
            incomeCount: this.incomeCategories.length,
            expenseCategories: this.expenseCategories,
            incomeCategories: this.incomeCategories
          });
          this.accounts = await DataManager$1.getAccounts();
          this.selectedAccount = await DataManager$1.getDefaultAccount();
          formatAppLog("log", "at pages/accounting/add.vue:235", "[AddPage] 账户数据加载完成:", {
            accountsCount: this.accounts.length,
            selectedAccount: this.selectedAccount
          });
          if (this.recordType === "expense" && this.expenseCategories.length > 0) {
            this.selectedCategory = this.expenseCategories[0];
            formatAppLog("log", "at pages/accounting/add.vue:243", "[AddPage] 设置默认支出分类:", this.selectedCategory);
          } else if (this.recordType === "income" && this.incomeCategories.length > 0) {
            this.selectedCategory = this.incomeCategories[0];
            formatAppLog("log", "at pages/accounting/add.vue:246", "[AddPage] 设置默认收入分类:", this.selectedCategory);
          }
          formatAppLog("log", "at pages/accounting/add.vue:249", "[AddPage] 数据加载完成", {
            expense: this.expenseCategories.length,
            income: this.incomeCategories.length,
            accounts: this.accounts.length,
            selectedCategory: this.selectedCategory,
            selectedAccount: this.selectedAccount
          });
        } catch (error) {
          formatAppLog("error", "at pages/accounting/add.vue:258", "[AddPage] 数据初始化失败:", error);
          uni.showToast({
            title: "数据加载失败: " + error.message,
            icon: "none",
            duration: 3e3
          });
        } finally {
          uni.hideLoading();
        }
      },
      goBack() {
        uni.navigateBack();
      },
      setRecordType(type) {
        if (this.recordType !== type) {
          formatAppLog("log", "at pages/accounting/add.vue:275", "[AddPage] 切换记录类型:", this.recordType, "->", type);
          this.recordType = type;
          const categories = type === "expense" ? this.expenseCategories : this.incomeCategories;
          this.selectedCategory = categories.length > 0 ? categories[0] : null;
          formatAppLog("log", "at pages/accounting/add.vue:280", "[AddPage] 切换后选中分类:", this.selectedCategory);
          formatAppLog("log", "at pages/accounting/add.vue:281", "[AddPage] 当前可用分类:", categories);
        }
      },
      onAmountInput(e) {
        let value = e.detail.value;
        if (value.includes(".")) {
          const parts = value.split(".");
          if (parts[1] && parts[1].length > 2) {
            value = parts[0] + "." + parts[1].substring(0, 2);
          }
        }
        this.amount = value;
      },
      onAmountFocus() {
        this.amountFocused = true;
        formatAppLog("log", "at pages/accounting/add.vue:299", "[AddPage] 金额输入框获得焦点");
      },
      onAmountBlur() {
        this.amountFocused = false;
        formatAppLog("log", "at pages/accounting/add.vue:304", "[AddPage] 金额输入框失去焦点");
      },
      onNoteInput(e) {
        this.note = e.detail.value;
      },
      selectCategory(category) {
        formatAppLog("log", "at pages/accounting/add.vue:312", "[AddPage] 选择分类:", category);
        this.selectedCategory = category;
        formatAppLog("log", "at pages/accounting/add.vue:314", "[AddPage] 当前选中分类:", this.selectedCategory);
      },
      showDatePicker() {
        this.showDateModal = true;
      },
      hideDatePicker() {
        this.showDateModal = false;
      },
      onDateChange(e) {
        this.selectedDate = new Date(e.detail.value);
        this.hideDatePicker();
      },
      showAccountPicker() {
        this.showAccountModal = true;
      },
      hideAccountPicker() {
        this.showAccountModal = false;
      },
      selectAccount(account) {
        this.selectedAccount = account;
        this.hideAccountPicker();
      },
      /**
       * 保存记账记录
       */
      async saveRecord() {
        if (this.loading)
          return;
        if (!this.amount || parseFloat(this.amount) <= 0) {
          uni.showToast({
            title: "请输入有效金额",
            icon: "none"
          });
          return;
        }
        if (!this.selectedCategory) {
          uni.showToast({
            title: "请选择分类",
            icon: "none"
          });
          return;
        }
        if (!this.selectedAccount) {
          uni.showToast({
            title: "请选择账户",
            icon: "none"
          });
          return;
        }
        this.loading = true;
        try {
          const transactionData = {
            amount: parseFloat(this.amount),
            type: this.recordType,
            categoryId: this.selectedCategory.id,
            categoryName: this.selectedCategory.name,
            categoryIcon: this.selectedCategory.icon,
            note: this.note.trim(),
            date: this.selectedDate.toISOString(),
            accountId: this.selectedAccount.id,
            accountName: this.selectedAccount.name
          };
          formatAppLog("log", "at pages/accounting/add.vue:390", "[AddPage] 准备保存交易记录:", transactionData);
          const transaction = await DataManager$1.addTransaction(transactionData);
          formatAppLog("log", "at pages/accounting/add.vue:395", "[AddPage] 交易记录保存成功:", transaction.id);
          this.showSuccessMessage();
          this.resetForm();
          setTimeout(() => {
            uni.navigateBack();
          }, 800);
        } catch (error) {
          formatAppLog("error", "at pages/accounting/add.vue:409", "[AddPage] 保存失败:", error);
          uni.showToast({
            title: error.message || "保存失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      /**
       * 重置表单
       */
      resetForm() {
        this.amount = "";
        this.note = "";
        this.selectedDate = /* @__PURE__ */ new Date();
      },
      /**
       * 快速金额输入
       */
      quickAmount(amount) {
        this.amount = amount.toString();
      },
      /**
       * 调试重新加载数据
       */
      async debugReload() {
        formatAppLog("log", "at pages/accounting/add.vue:440", "[AddPage] 手动重新加载数据...");
        await this.initializeData();
      },
      /**
       * 显示美化的成功提示
       */
      showSuccessMessage() {
        uni.showToast({
          title: "💰 记账成功",
          icon: "none",
          duration: 800,
          mask: false
        });
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createCommentVNode(" 头部区域 "),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "header-top" }, [
          vue.createElementVNode("view", {
            class: "back-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode("text", { class: "back-icon" }, "‹")
          ]),
          vue.createElementVNode("text", { class: "header-title" }, "记一笔"),
          vue.createElementVNode("view", {
            class: "calendar-btn",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.debugReload && $options.debugReload(...args))
          }, [
            vue.createElementVNode("text", { class: "calendar-icon" }, "🔄")
          ])
        ])
      ]),
      vue.createCommentVNode(" 收支切换 "),
      vue.createElementVNode("view", { class: "type-switch-section" }, [
        vue.createElementVNode("view", { class: "type-switch" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["switch-btn", { active: $data.recordType === "expense" }]),
              onClick: _cache[2] || (_cache[2] = ($event) => $options.setRecordType("expense"))
            },
            [
              vue.createElementVNode("text", { class: "switch-text" }, "支出")
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["switch-btn", { active: $data.recordType === "income" }]),
              onClick: _cache[3] || (_cache[3] = ($event) => $options.setRecordType("income"))
            },
            [
              vue.createElementVNode("text", { class: "switch-text" }, "收入")
            ],
            2
            /* CLASS */
          )
        ])
      ]),
      vue.createCommentVNode(" 金额输入 "),
      vue.createElementVNode("view", { class: "amount-section" }, [
        vue.createElementVNode("view", { class: "amount-container" }, [
          vue.createElementVNode("text", { class: "amount-label" }, "金额"),
          vue.createElementVNode("view", { class: "amount-input-row" }, [
            vue.createElementVNode("text", { class: "currency-symbol" }, "¥"),
            vue.createElementVNode("input", {
              class: "amount-input",
              type: "digit",
              value: $options.displayAmount,
              onInput: _cache[4] || (_cache[4] = (...args) => $options.onAmountInput && $options.onAmountInput(...args)),
              onFocus: _cache[5] || (_cache[5] = (...args) => $options.onAmountFocus && $options.onAmountFocus(...args)),
              onBlur: _cache[6] || (_cache[6] = (...args) => $options.onAmountBlur && $options.onAmountBlur(...args)),
              placeholder: $options.amountPlaceholder
            }, null, 40, ["value", "placeholder"])
          ])
        ])
      ]),
      vue.createCommentVNode(" 分类选择 "),
      vue.createElementVNode("view", { class: "category-section" }, [
        vue.createElementVNode("text", { class: "section-title" }, "选择分类"),
        vue.createElementVNode("view", { class: "category-grid" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($options.currentCategories, (category) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: vue.normalizeClass(["category-item", { selected: $data.selectedCategory && $data.selectedCategory.id === category.id }]),
                key: category.id,
                onClick: ($event) => $options.selectCategory(category)
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "category-icon",
                    style: vue.normalizeStyle({ backgroundColor: category.color })
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      { class: "category-emoji" },
                      vue.toDisplayString(category.icon),
                      1
                      /* TEXT */
                    )
                  ],
                  4
                  /* STYLE */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "category-name" },
                  vue.toDisplayString(category.name),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 账户选择 "),
      $data.selectedAccount ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "account-section"
      }, [
        vue.createElementVNode("text", { class: "section-title" }, "账户"),
        vue.createElementVNode("view", {
          class: "account-selector",
          onClick: _cache[7] || (_cache[7] = (...args) => $options.showAccountPicker && $options.showAccountPicker(...args))
        }, [
          vue.createElementVNode("view", { class: "account-info" }, [
            vue.createElementVNode(
              "view",
              {
                class: "account-icon",
                style: vue.normalizeStyle({ backgroundColor: $data.selectedAccount.color })
              },
              [
                vue.createElementVNode(
                  "text",
                  { class: "account-emoji" },
                  vue.toDisplayString($data.selectedAccount.icon),
                  1
                  /* TEXT */
                )
              ],
              4
              /* STYLE */
            ),
            vue.createElementVNode(
              "text",
              { class: "account-name" },
              vue.toDisplayString($data.selectedAccount.name),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("text", { class: "selector-arrow" }, "›")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 日期选择 "),
      vue.createElementVNode("view", { class: "date-section" }, [
        vue.createElementVNode("text", { class: "section-title" }, "日期"),
        vue.createElementVNode("view", {
          class: "date-selector",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.showDatePicker && $options.showDatePicker(...args))
        }, [
          vue.createElementVNode(
            "text",
            { class: "date-text" },
            vue.toDisplayString($options.formattedDate),
            1
            /* TEXT */
          ),
          vue.createElementVNode("text", { class: "selector-arrow" }, "›")
        ])
      ]),
      vue.createCommentVNode(" 备注输入 "),
      vue.createElementVNode("view", { class: "note-section" }, [
        vue.createElementVNode("view", { class: "note-container" }, [
          vue.createElementVNode("input", {
            class: "note-input",
            value: $data.note,
            onInput: _cache[9] || (_cache[9] = (...args) => $options.onNoteInput && $options.onNoteInput(...args)),
            placeholder: "添加备注..."
          }, null, 40, ["value"])
        ])
      ]),
      vue.createCommentVNode(" 底部保存按钮 "),
      vue.createElementVNode("view", { class: "save-section" }, [
        vue.createElementVNode(
          "button",
          {
            class: vue.normalizeClass(["save-btn", { disabled: !$options.canSave || $data.loading }]),
            onClick: _cache[10] || (_cache[10] = (...args) => $options.saveRecord && $options.saveRecord(...args))
          },
          vue.toDisplayString($data.loading ? "保存中..." : "保存记录"),
          3
          /* TEXT, CLASS */
        )
      ]),
      vue.createCommentVNode(" 日期选择弹窗 "),
      $data.showDateModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "modal-overlay",
        onClick: _cache[14] || (_cache[14] = (...args) => $options.hideDatePicker && $options.hideDatePicker(...args))
      }, [
        vue.createElementVNode("view", {
          class: "date-picker-modal",
          onClick: _cache[13] || (_cache[13] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "选择日期"),
            vue.createElementVNode("view", {
              class: "modal-close",
              onClick: _cache[11] || (_cache[11] = (...args) => $options.hideDatePicker && $options.hideDatePicker(...args))
            }, "✕")
          ]),
          vue.createElementVNode("picker", {
            mode: "date",
            value: $data.selectedDate.toISOString().split("T")[0],
            onChange: _cache[12] || (_cache[12] = (...args) => $options.onDateChange && $options.onDateChange(...args))
          }, [
            vue.createElementVNode("view", { class: "date-picker-trigger" }, [
              vue.createElementVNode(
                "text",
                null,
                vue.toDisplayString($options.formattedDate),
                1
                /* TEXT */
              )
            ])
          ], 40, ["value"])
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createCommentVNode(" 账户选择弹窗 "),
      $data.showAccountModal ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 2,
        class: "modal-overlay",
        onClick: _cache[17] || (_cache[17] = (...args) => $options.hideAccountPicker && $options.hideAccountPicker(...args))
      }, [
        vue.createElementVNode("view", {
          class: "account-picker-modal",
          onClick: _cache[16] || (_cache[16] = vue.withModifiers(() => {
          }, ["stop"]))
        }, [
          vue.createElementVNode("view", { class: "modal-header" }, [
            vue.createElementVNode("text", { class: "modal-title" }, "选择账户"),
            vue.createElementVNode("view", {
              class: "modal-close",
              onClick: _cache[15] || (_cache[15] = (...args) => $options.hideAccountPicker && $options.hideAccountPicker(...args))
            }, "✕")
          ]),
          vue.createElementVNode("view", { class: "account-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($data.accounts, (account) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: vue.normalizeClass(["account-item", { selected: $data.selectedAccount && $data.selectedAccount.id === account.id }]),
                  key: account.id,
                  onClick: ($event) => $options.selectAccount(account)
                }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "account-icon",
                      style: vue.normalizeStyle({ backgroundColor: account.color })
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "account-emoji" },
                        vue.toDisplayString(account.icon),
                        1
                        /* TEXT */
                      )
                    ],
                    4
                    /* STYLE */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "account-name" },
                    vue.toDisplayString(account.name),
                    1
                    /* TEXT */
                  ),
                  $data.selectedAccount && $data.selectedAccount.id === account.id ? (vue.openBlock(), vue.createElementBlock("text", {
                    key: 0,
                    class: "check-icon"
                  }, "✓")) : vue.createCommentVNode("v-if", true)
                ], 10, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ])
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const PagesAccountingAdd = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-1619521b"], ["__file", "E:/app/oneself/oneself/pages/accounting/add.vue"]]);
  const _sfc_main$3 = {
    data() {
      return {
        timeType: "today",
        // 从路由参数获取
        currentFilter: "all",
        loading: true,
        // 真实数据
        transactions: [],
        categories: [],
        accounts: []
      };
    },
    async onLoad(options) {
      if (options.type) {
        this.timeType = options.type;
      }
      await this.initializeData();
    },
    async onShow() {
      if (!this.loading) {
        await this.loadTransactions();
      }
    },
    computed: {
      pageTitle() {
        const titles = {
          today: "今天账目",
          week: "本周账目",
          month: "本月账目",
          year: "今年账目"
        };
        return titles[this.timeType] || "账目详情";
      },
      periodTitle() {
        const now = /* @__PURE__ */ new Date();
        const titles = {
          today: this.formatDate(now),
          week: this.getWeekRange(now),
          month: `${now.getMonth() + 1}月`,
          year: `${now.getFullYear()}年`
        };
        return titles[this.timeType] || "";
      },
      records() {
        return this.transactions.map((transaction) => {
          const category = this.categories.find((c) => c.id === transaction.categoryId);
          this.accounts.find((a) => a.id === transaction.accountId);
          return {
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount.toFixed(2),
            title: transaction.description || (category ? category.name : "未知分类"),
            category: category ? category.name : "未知分类",
            time: this.formatTime(transaction.date),
            emoji: category ? category.icon : "💰",
            iconBg: this.getCategoryColor(category ? category.name : "其他"),
            tags: this.getRecordTags(transaction, category),
            originalData: transaction
          };
        });
      },
      filteredRecords() {
        if (this.currentFilter === "all") {
          return this.records;
        }
        return this.records.filter((record) => {
          switch (this.currentFilter) {
            case "expense":
            case "income":
              return record.type === this.currentFilter;
            case "food":
              return record.tags.includes("food");
            case "transport":
              return record.tags.includes("transport");
            default:
              return record.tags.includes(this.currentFilter);
          }
        });
      },
      totalIncome() {
        return this.records.filter((r) => r.type === "income").reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2);
      },
      totalExpense() {
        return this.records.filter((r) => r.type === "expense").reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2);
      },
      netAmount() {
        return parseFloat(this.totalIncome) - parseFloat(this.totalExpense);
      },
      emptyStateTitle() {
        const filterTitles = {
          all: `${this.periodTitle}的记录就这些了`,
          expense: "暂无支出记录",
          income: "暂无收入记录",
          food: "暂无餐饮记录",
          transport: "暂无交通记录"
        };
        return filterTitles[this.currentFilter] || "暂无记录";
      },
      emptyStateSubtitle() {
        return "继续记录让数据更完整";
      }
    },
    methods: {
      /**
       * 初始化页面数据
       */
      async initializeData() {
        try {
          this.loading = true;
          await DataManager$1.initialize();
          const [categories, accounts] = await Promise.all([
            DataManager$1.getCategories(),
            DataManager$1.getAccounts()
          ]);
          this.categories = categories;
          this.accounts = accounts;
          await this.loadTransactions();
          formatAppLog("log", "at pages/accounting/detail.vue:285", "[DetailPage] 数据加载完成");
        } catch (error) {
          formatAppLog("error", "at pages/accounting/detail.vue:288", "[DetailPage] 数据初始化失败:", error);
          uni.showToast({
            title: "数据加载失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      /**
       * 加载交易记录
       */
      async loadTransactions() {
        try {
          const dateRange = this.getDateRange(this.timeType);
          const transactions = await DataManager$1.getTransactions({
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
            limit: 1e3
          });
          this.transactions = transactions.data || [];
          formatAppLog("log", "at pages/accounting/detail.vue:312", "[DetailPage] 交易记录加载完成:", this.transactions.length, "条");
        } catch (error) {
          formatAppLog("error", "at pages/accounting/detail.vue:315", "[DetailPage] 交易记录加载失败:", error);
          this.transactions = [];
        }
      },
      /**
       * 根据时间类型获取日期范围
       */
      getDateRange(timeType) {
        const now = /* @__PURE__ */ new Date();
        let startDate, endDate;
        switch (timeType) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case "week":
            const currentDay = now.getDay();
            const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
            const monday = new Date(now);
            monday.setDate(now.getDate() - mondayOffset);
            startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1e3);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        }
        return { startDate, endDate };
      },
      /**
       * 格式化日期显示
       */
      formatDate(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
      },
      /**
       * 获取周范围显示
       */
      getWeekRange(date) {
        const currentDay = date.getDay();
        const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(date);
        monday.setDate(date.getDate() - mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return `${this.formatDate(monday)}-${this.formatDate(sunday)}`;
      },
      /**
       * 格式化时间显示
       */
      formatTime(dateString) {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      },
      /**
       * 获取分类颜色
       */
      getCategoryColor(categoryName) {
        const colorMap = {
          "餐饮": "linear-gradient(135deg, #FF8A65, #FFB74D)",
          "购物": "linear-gradient(135deg, #F06292, #F48FB1)",
          "交通": "linear-gradient(135deg, #64B5F6, #90CAF9)",
          "娱乐": "linear-gradient(135deg, #9C27B0, #BA68C8)",
          "医疗": "linear-gradient(135deg, #66BB6A, #81C784)",
          "教育": "linear-gradient(135deg, #3F51B5, #5C6BC0)",
          "居住": "linear-gradient(135deg, #FFB74D, #FFCC02)",
          "生活缴费": "linear-gradient(135deg, #FFC107, #FFD54F)",
          "工资": "linear-gradient(135deg, #4CAF50, #66BB6A)",
          "投资": "linear-gradient(135deg, #2196F3, #42A5F5)",
          "其他": "linear-gradient(135deg, #9E9E9E, #BDBDBD)"
        };
        return colorMap[categoryName] || colorMap["其他"];
      },
      /**
       * 获取记录标签
       */
      getRecordTags(transaction, category) {
        const tags = [transaction.type];
        if (category) {
          switch (category.name) {
            case "餐饮":
              tags.push("food");
              break;
            case "交通":
              tags.push("transport");
              break;
          }
        }
        return tags;
      },
      goBack() {
        uni.navigateBack();
      },
      goToHome() {
        uni.reLaunch({
          url: "/pages/index/index"
        });
      },
      goToAccounting() {
        uni.navigateTo({
          url: "/pages/accounting/index"
        });
      },
      goToDiary() {
        uni.showToast({
          title: "日记功能开发中",
          icon: "none"
        });
      },
      goToSettings() {
        uni.showToast({
          title: "设置功能开发中",
          icon: "none"
        });
      },
      setFilter(filter) {
        this.currentFilter = filter;
      },
      showFilter() {
        uni.showToast({
          title: "筛选功能开发中",
          icon: "none"
        });
      },
      editRecord(record) {
        formatAppLog("log", "at pages/accounting/detail.vue:471", "[DetailPage] 编辑记录:", record);
        uni.navigateTo({
          url: `/pages/accounting/edit?id=${record.id}`
        });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createCommentVNode(" 头部区域 "),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "header-top" }, [
          vue.createElementVNode("view", {
            class: "back-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode("text", { class: "back-icon" }, "‹")
          ]),
          vue.createElementVNode(
            "text",
            { class: "header-title" },
            vue.toDisplayString($options.pageTitle),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", {
            class: "filter-btn",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.showFilter && $options.showFilter(...args))
          }, [
            vue.createElementVNode("text", { class: "filter-icon" }, "🔍")
          ])
        ])
      ]),
      vue.createCommentVNode(" 当期概览 "),
      vue.createElementVNode("view", { class: "overview-section" }, [
        vue.createElementVNode("view", { class: "overview-card" }, [
          vue.createElementVNode("view", { class: "overview-header" }, [
            vue.createElementVNode(
              "text",
              { class: "overview-title" },
              vue.toDisplayString($options.periodTitle),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "record-count" },
              vue.toDisplayString($options.records.length) + "笔记录",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "amount-summary" }, [
            vue.createElementVNode("view", { class: "summary-item" }, [
              vue.createElementVNode(
                "text",
                { class: "summary-amount income" },
                "¥" + vue.toDisplayString($options.totalIncome),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "summary-label" }, "收入")
            ]),
            vue.createElementVNode("view", { class: "summary-item" }, [
              vue.createElementVNode(
                "text",
                { class: "summary-amount expense" },
                "¥" + vue.toDisplayString($options.totalExpense),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "summary-label" }, "支出")
            ])
          ]),
          vue.createElementVNode("view", { class: "net-amount-section" }, [
            vue.createElementVNode("view", { class: "net-amount-row" }, [
              vue.createElementVNode(
                "text",
                { class: "net-label" },
                vue.toDisplayString($options.netAmount >= 0 ? "净收入" : "净支出"),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["net-amount", { positive: $options.netAmount >= 0, negative: $options.netAmount < 0 }])
                },
                vue.toDisplayString($options.netAmount >= 0 ? "+" : "") + "¥" + vue.toDisplayString(Math.abs($options.netAmount).toFixed(2)),
                3
                /* TEXT, CLASS */
              )
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 筛选标签 "),
      vue.createElementVNode("view", { class: "filter-section" }, [
        vue.createElementVNode("scroll-view", {
          class: "filter-scroll",
          "scroll-x": ""
        }, [
          vue.createElementVNode("view", { class: "filter-tags" }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["filter-tag", { active: $data.currentFilter === "all" }]),
                onClick: _cache[2] || (_cache[2] = ($event) => $options.setFilter("all"))
              },
              [
                vue.createElementVNode("text", { class: "tag-text" }, "全部")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["filter-tag", { active: $data.currentFilter === "expense" }]),
                onClick: _cache[3] || (_cache[3] = ($event) => $options.setFilter("expense"))
              },
              [
                vue.createElementVNode("text", { class: "tag-text" }, "支出")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["filter-tag", { active: $data.currentFilter === "income" }]),
                onClick: _cache[4] || (_cache[4] = ($event) => $options.setFilter("income"))
              },
              [
                vue.createElementVNode("text", { class: "tag-text" }, "收入")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["filter-tag", { active: $data.currentFilter === "food" }]),
                onClick: _cache[5] || (_cache[5] = ($event) => $options.setFilter("food"))
              },
              [
                vue.createElementVNode("text", { class: "tag-text" }, "餐饮")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["filter-tag", { active: $data.currentFilter === "transport" }]),
                onClick: _cache[6] || (_cache[6] = ($event) => $options.setFilter("transport"))
              },
              [
                vue.createElementVNode("text", { class: "tag-text" }, "交通")
              ],
              2
              /* CLASS */
            )
          ])
        ])
      ]),
      vue.createCommentVNode(" 交易记录列表 "),
      vue.createElementVNode("view", { class: "records-section" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($options.filteredRecords, (record) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              class: "record-item",
              key: record.id,
              onClick: ($event) => $options.editRecord(record)
            }, [
              vue.createElementVNode("view", { class: "record-content" }, [
                vue.createElementVNode("view", { class: "record-left" }, [
                  vue.createElementVNode(
                    "view",
                    {
                      class: "record-icon",
                      style: vue.normalizeStyle({ background: record.iconBg })
                    },
                    [
                      vue.createElementVNode(
                        "text",
                        { class: "record-emoji" },
                        vue.toDisplayString(record.emoji),
                        1
                        /* TEXT */
                      )
                    ],
                    4
                    /* STYLE */
                  ),
                  vue.createElementVNode("view", { class: "record-info" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "record-title" },
                      vue.toDisplayString(record.title),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "record-subtitle" },
                      vue.toDisplayString(record.category) + " · " + vue.toDisplayString(record.time),
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createElementVNode("view", { class: "record-right" }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: vue.normalizeClass(["record-amount", { income: record.type === "income", expense: record.type === "expense" }])
                    },
                    vue.toDisplayString(record.type === "income" ? "+" : "-") + "¥" + vue.toDisplayString(record.amount),
                    3
                    /* TEXT, CLASS */
                  )
                ])
              ])
            ], 8, ["onClick"]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        vue.createCommentVNode(" 空状态 "),
        $options.filteredRecords.length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty-state"
        }, [
          vue.createElementVNode("view", { class: "empty-icon" }, [
            vue.createElementVNode("text", { class: "empty-emoji" }, "✅")
          ]),
          vue.createElementVNode(
            "text",
            { class: "empty-title" },
            vue.toDisplayString($options.emptyStateTitle),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "empty-subtitle" },
            vue.toDisplayString($options.emptyStateSubtitle),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 底部导航 "),
      vue.createElementVNode("view", { class: "bottom-nav" }, [
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[7] || (_cache[7] = (...args) => $options.goToHome && $options.goToHome(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "🏠"),
          vue.createElementVNode("text", { class: "nav-label" }, "首页")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item active",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.goToAccounting && $options.goToAccounting(...args))
        }, [
          vue.createElementVNode("view", { class: "nav-icon-active" }, [
            vue.createElementVNode("text", { class: "nav-emoji" }, "💰")
          ]),
          vue.createElementVNode("text", { class: "nav-label-active" }, "记账")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[9] || (_cache[9] = (...args) => $options.goToDiary && $options.goToDiary(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "📖"),
          vue.createElementVNode("text", { class: "nav-label" }, "日记")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[10] || (_cache[10] = (...args) => $options.goToSettings && $options.goToSettings(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "⚙️"),
          vue.createElementVNode("text", { class: "nav-label" }, "设置")
        ])
      ])
    ]);
  }
  const PagesAccountingDetail = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-01e349ce"], ["__file", "E:/app/oneself/oneself/pages/accounting/detail.vue"]]);
  const _sfc_main$2 = {
    data() {
      return {
        recordId: null,
        // 原始记录数据
        originalRecord: {
          id: 1,
          type: "expense",
          amount: "89.00",
          title: "午餐 - 海底捞",
          category: "餐饮",
          date: "今天",
          time: "14:30",
          emoji: "🍽️",
          iconBg: "linear-gradient(135deg, #FF8A65, #FFB74D)",
          note: "午餐 - 海底捞",
          account: "alipay"
        },
        // 编辑数据
        editData: {
          amount: "89.00",
          note: "午餐 - 海底捞",
          datetime: "2024年12月18日 14:30",
          categoryId: 1,
          accountId: 1
        },
        // 分类数据
        categories: [
          { id: 1, name: "餐饮", emoji: "🍽️", iconBg: "linear-gradient(135deg, #FF8A65, #FFB74D)" },
          { id: 2, name: "交通", emoji: "🚗", iconBg: "#DBEAFE" },
          { id: 3, name: "购物", emoji: "🛍️", iconBg: "#FCE7F3" },
          { id: 4, name: "娱乐", emoji: "🎮", iconBg: "#E0E7FF" }
        ],
        // 账户数据
        accounts: [
          { id: 1, name: "支付宝", emoji: "💰" },
          { id: 2, name: "微信", emoji: "💚" },
          { id: 3, name: "银行卡", emoji: "💳" },
          { id: 4, name: "现金", emoji: "💵" }
        ]
      };
    },
    computed: {
      selectedCategory() {
        return this.categories.find((c) => c.id === this.editData.categoryId) || this.categories[0];
      },
      selectedAccount() {
        return this.accounts.find((a) => a.id === this.editData.accountId) || this.accounts[0];
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
        formatAppLog("log", "at pages/accounting/edit.vue:176", "加载记录数据:", this.recordId);
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
        const itemList = this.categories.map((c) => c.name);
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
        const itemList = this.accounts.map((a) => a.name);
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
          title: "日期时间选择功能开发中",
          icon: "none"
        });
      },
      showDeleteConfirm() {
        uni.showModal({
          title: "确认删除",
          content: "删除后无法恢复，确定要删除这条记录吗？",
          confirmText: "删除",
          confirmColor: "#EF5350",
          success: (res) => {
            if (res.confirm) {
              this.deleteRecord();
            }
          }
        });
      },
      deleteRecord() {
        formatAppLog("log", "at pages/accounting/edit.vue:230", "删除记录:", this.recordId);
        uni.showToast({
          title: "删除成功",
          icon: "success"
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      },
      saveChanges() {
        if (!this.editData.amount || parseFloat(this.editData.amount) <= 0) {
          uni.showToast({
            title: "请输入正确的金额",
            icon: "none"
          });
          return;
        }
        const updatedRecord = {
          id: this.recordId,
          amount: parseFloat(this.editData.amount),
          note: this.editData.note,
          categoryId: this.editData.categoryId,
          accountId: this.editData.accountId,
          datetime: this.editData.datetime
        };
        formatAppLog("log", "at pages/accounting/edit.vue:260", "保存修改:", updatedRecord);
        uni.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createCommentVNode(" 头部区域 "),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "header-top" }, [
          vue.createElementVNode("view", {
            class: "back-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode("text", { class: "back-icon" }, "‹")
          ]),
          vue.createElementVNode("text", { class: "header-title" }, "编辑记录"),
          vue.createElementVNode("view", {
            class: "delete-btn",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.showDeleteConfirm && $options.showDeleteConfirm(...args))
          }, [
            vue.createElementVNode("text", { class: "delete-icon" }, "🗑️")
          ])
        ])
      ]),
      vue.createCommentVNode(" 原记录信息 "),
      vue.createElementVNode("view", { class: "original-record-section" }, [
        vue.createElementVNode("view", { class: "original-card" }, [
          vue.createElementVNode("view", { class: "original-header" }, [
            vue.createElementVNode("text", { class: "original-title" }, "原记录信息"),
            vue.createElementVNode(
              "text",
              { class: "original-time" },
              vue.toDisplayString($data.originalRecord.date) + " " + vue.toDisplayString($data.originalRecord.time),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "original-content" }, [
            vue.createElementVNode("view", { class: "original-left" }, [
              vue.createElementVNode(
                "view",
                {
                  class: "original-icon",
                  style: vue.normalizeStyle({ background: $data.originalRecord.iconBg })
                },
                [
                  vue.createElementVNode(
                    "text",
                    { class: "original-emoji" },
                    vue.toDisplayString($data.originalRecord.emoji),
                    1
                    /* TEXT */
                  )
                ],
                4
                /* STYLE */
              ),
              vue.createElementVNode("view", { class: "original-info" }, [
                vue.createElementVNode(
                  "text",
                  { class: "original-record-title" },
                  vue.toDisplayString($data.originalRecord.title),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "original-category" },
                  vue.toDisplayString($data.originalRecord.category) + "类别",
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "original-right" }, [
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["original-amount", { income: $data.originalRecord.type === "income", expense: $data.originalRecord.type === "expense" }])
                },
                vue.toDisplayString($data.originalRecord.type === "income" ? "+" : "-") + "¥" + vue.toDisplayString($data.originalRecord.amount),
                3
                /* TEXT, CLASS */
              )
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 编辑表单 "),
      vue.createElementVNode("view", { class: "edit-form-section" }, [
        vue.createCommentVNode(" 金额编辑 "),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "金额"),
          vue.createElementVNode("view", { class: "form-input-container" }, [
            vue.createElementVNode("view", { class: "amount-input-row" }, [
              vue.createElementVNode("text", { class: "currency-symbol" }, "¥"),
              vue.createElementVNode("input", {
                class: "amount-input",
                type: "digit",
                value: $data.editData.amount,
                onInput: _cache[2] || (_cache[2] = (...args) => $options.onAmountInput && $options.onAmountInput(...args))
              }, null, 40, ["value"])
            ])
          ])
        ]),
        vue.createCommentVNode(" 类别编辑 "),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "类别"),
          vue.createElementVNode("view", {
            class: "form-input-container",
            onClick: _cache[3] || (_cache[3] = (...args) => $options.showCategoryPicker && $options.showCategoryPicker(...args))
          }, [
            vue.createElementVNode("view", { class: "category-display" }, [
              vue.createElementVNode(
                "view",
                {
                  class: "category-icon",
                  style: vue.normalizeStyle({ background: $options.selectedCategory.iconBg })
                },
                [
                  vue.createElementVNode(
                    "text",
                    { class: "category-emoji" },
                    vue.toDisplayString($options.selectedCategory.emoji),
                    1
                    /* TEXT */
                  )
                ],
                4
                /* STYLE */
              ),
              vue.createElementVNode(
                "text",
                { class: "category-name" },
                vue.toDisplayString($options.selectedCategory.name),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("text", { class: "chevron-icon" }, "›")
          ])
        ]),
        vue.createCommentVNode(" 备注编辑 "),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "备注"),
          vue.createElementVNode("view", { class: "form-input-container" }, [
            vue.createElementVNode("input", {
              class: "note-input",
              value: $data.editData.note,
              onInput: _cache[4] || (_cache[4] = (...args) => $options.onNoteInput && $options.onNoteInput(...args)),
              placeholder: "添加备注..."
            }, null, 40, ["value"])
          ])
        ]),
        vue.createCommentVNode(" 日期时间编辑 "),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "日期时间"),
          vue.createElementVNode("view", {
            class: "form-input-container",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.showDateTimePicker && $options.showDateTimePicker(...args))
          }, [
            vue.createElementVNode(
              "text",
              { class: "datetime-text" },
              vue.toDisplayString($data.editData.datetime),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "calendar-icon" }, "📅")
          ])
        ]),
        vue.createCommentVNode(" 账户选择 "),
        vue.createElementVNode("view", { class: "form-item" }, [
          vue.createElementVNode("text", { class: "form-label" }, "账户"),
          vue.createElementVNode("view", {
            class: "form-input-container",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.showAccountPicker && $options.showAccountPicker(...args))
          }, [
            vue.createElementVNode("view", { class: "account-display" }, [
              vue.createElementVNode("view", { class: "account-icon" }, [
                vue.createElementVNode(
                  "text",
                  { class: "account-emoji" },
                  vue.toDisplayString($options.selectedAccount.emoji),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode(
                "text",
                { class: "account-name" },
                vue.toDisplayString($options.selectedAccount.name),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("text", { class: "chevron-icon" }, "›")
          ])
        ])
      ]),
      vue.createCommentVNode(" 底部按钮组 "),
      vue.createElementVNode("view", { class: "action-buttons" }, [
        vue.createElementVNode("button", {
          class: "save-btn",
          onClick: _cache[7] || (_cache[7] = (...args) => $options.saveChanges && $options.saveChanges(...args))
        }, "保存修改"),
        vue.createElementVNode("button", {
          class: "cancel-btn",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.goBack && $options.goBack(...args))
        }, "取消")
      ])
    ]);
  }
  const PagesAccountingEdit = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-709a8ac2"], ["__file", "E:/app/oneself/oneself/pages/accounting/edit.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        currentPeriod: "month",
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
        clickDebounceTime: 500
        // 500ms防抖
      };
    },
    async onLoad() {
      await this.initializeData();
    },
    async onShow() {
      if (!this.loading) {
        await this.loadAllStatistics();
      }
    },
    computed: {
      periodTitle() {
        const now = /* @__PURE__ */ new Date();
        const titles = {
          week: "本周",
          month: `${now.getMonth() + 1}月`,
          year: `${now.getFullYear()}年`
        };
        return titles[this.currentPeriod] || "";
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
        const categories = this.currentData.categories;
        if (!categories || categories.length === 0) {
          return "conic-gradient(#E5E7EB 0deg 360deg)";
        }
        let gradient = "conic-gradient(";
        let currentDegree = 0;
        categories.forEach((category, index) => {
          const percent = category.percent / 100;
          const nextDegree = currentDegree + 360 * percent;
          if (index > 0)
            gradient += ", ";
          gradient += `${category.color} ${currentDegree}deg ${nextDegree}deg`;
          currentDegree = nextDegree;
        });
        if (currentDegree < 360) {
          gradient += `, #E5E7EB ${currentDegree}deg 360deg`;
        }
        gradient += ")";
        return gradient;
      },
      /**
       * 动态调整总支出显示格式和字体大小
       */
      chartTotalStyle() {
        const amount = this.currentData.expense || 0;
        const amountStr = this.formatChartAmount(amount);
        let fontSize = "48rpx";
        if (amountStr.length > 8) {
          fontSize = "32rpx";
        } else if (amountStr.length > 6) {
          fontSize = "40rpx";
        }
        return {
          fontSize
        };
      },
      /**
       * 格式化图表中心显示的金额
       */
      chartTotalAmount() {
        return this.formatChartAmount(this.currentData.expense || 0);
      }
    },
    methods: {
      /**
       * 初始化页面数据
       */
      async initializeData() {
        try {
          this.loading = true;
          await DataManager$1.initialize();
          await this.loadAllStatistics();
          formatAppLog("log", "at pages/accounting/stats.vue:302", "[StatsPage] 数据加载完成");
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:305", "[StatsPage] 数据初始化失败:", error);
          uni.showToast({
            title: "数据加载失败",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      /**
       * 加载所有统计数据
       */
      async loadAllStatistics() {
        try {
          const [weekStats, monthStats, yearStats] = await Promise.all([
            DataManager$1.getStatistics("weekly"),
            DataManager$1.getStatistics("monthly"),
            DataManager$1.getStatistics("yearly")
          ]);
          this.statsData = {
            week: this.processStatisticsData(weekStats),
            month: this.processStatisticsData(monthStats),
            year: this.processStatisticsData(yearStats)
          };
          await this.generateTrendData();
          formatAppLog("log", "at pages/accounting/stats.vue:337", "[StatsPage] 统计数据加载完成:", this.statsData);
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:340", "[StatsPage] 统计数据加载失败:", error);
        }
      },
      /**
       * 处理统计数据，生成分类信息
       */
      processStatisticsData(statistics) {
        const expenseCategories = statistics.categoryStats.filter((cat) => cat.type === "expense").sort((a, b) => b.amount - a.amount);
        const totalExpense = statistics.totalExpense;
        const categories = expenseCategories.map((cat) => ({
          id: cat.categoryId,
          name: cat.categoryName,
          amount: cat.amount,
          percent: totalExpense > 0 ? Math.round(cat.amount / totalExpense * 100) : 0,
          color: this.getCategoryColor(cat.categoryName)
        }));
        return {
          income: statistics.totalIncome,
          expense: statistics.totalExpense,
          categories: categories.slice(0, 6)
          // 最多显示6个分类
        };
      },
      /**
       * 获取分类对应的颜色
       */
      getCategoryColor(categoryName) {
        const colorMap = {
          "餐饮": "#FF8A65",
          "购物": "#F06292",
          "交通": "#64B5F6",
          "娱乐": "#9C27B0",
          "医疗": "#66BB6A",
          "教育": "#3F51B5",
          "居住": "#FFB74D",
          "生活缴费": "#FFC107",
          "其他支出": "#9E9E9E"
        };
        return colorMap[categoryName] || "#9E9E9E";
      },
      /**
       * 生成趋势数据
       */
      async generateTrendData() {
        try {
          const trendExpenses = await this.loadTrendExpenses(this.currentPeriod);
          if (!trendExpenses || trendExpenses.length === 0) {
            this.trendData = Array(7).fill({ height: 16, amount: 0 });
            return;
          }
          const maxAmount = Math.max(...trendExpenses.map((item) => item.amount));
          const baseHeight = 30;
          const maxHeight = 150;
          this.trendData = trendExpenses.map((item) => {
            let height = baseHeight;
            if (maxAmount > 0) {
              const ratio = item.amount / maxAmount;
              height = baseHeight + (maxHeight - baseHeight) * ratio;
            }
            return {
              height: Math.round(height),
              amount: item.amount,
              period: item.period
            };
          });
          formatAppLog("log", "at pages/accounting/stats.vue:421", "[StatsPage] 趋势数据生成完成:", this.trendData);
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:424", "[StatsPage] 趋势数据生成失败:", error);
          this.trendData = Array(7).fill({ height: 16, amount: 0 });
        }
      },
      /**
       * 加载趋势支出数据
       */
      async loadTrendExpenses(period) {
        try {
          formatAppLog("log", "at pages/accounting/stats.vue:434", "[StatsPage] 开始加载趋势数据:", period);
          const transactions = await DataManager$1.getTransactions();
          formatAppLog("log", "at pages/accounting/stats.vue:438", "[StatsPage] 获取到交易数据:", transactions.length, "条");
          const expenseTransactions = transactions.filter((t) => t.type === "expense");
          formatAppLog("log", "at pages/accounting/stats.vue:441", "[StatsPage] 支出交易数据:", expenseTransactions.length, "条");
          if (expenseTransactions.length === 0) {
            return [];
          }
          const now = /* @__PURE__ */ new Date();
          let trendData = [];
          switch (period) {
            case "week":
              const weekDates = this.getCurrentWeekDates(now);
              weekDates.forEach((date) => {
                const dateStr = date.toDateString();
                const dayExpenses = expenseTransactions.filter((t) => {
                  const tDate = new Date(t.date);
                  return tDate.toDateString() === dateStr;
                });
                const totalAmount = dayExpenses.reduce((sum, t) => sum + t.amount, 0);
                const dayLabel = this.getDayLabel(date);
                trendData.push({
                  period: dayLabel,
                  amount: totalAmount,
                  date
                });
              });
              break;
            case "month":
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              for (let week = 1; week <= 5; week++) {
                const weekStart = new Date(startOfMonth);
                weekStart.setDate(1 + (week - 1) * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                if (weekEnd > endOfMonth) {
                  weekEnd.setTime(endOfMonth.getTime());
                }
                const weekExpenses = expenseTransactions.filter((t) => {
                  const tDate = new Date(t.date);
                  return tDate >= weekStart && tDate <= weekEnd;
                });
                const totalAmount = weekExpenses.reduce((sum, t) => sum + t.amount, 0);
                trendData.push({
                  period: `${week}周`,
                  amount: totalAmount
                });
              }
              break;
            case "year":
              for (let i = 1; i <= 12; i += 2) {
                const monthStart = new Date(now.getFullYear(), i - 1, 1);
                const monthEnd = new Date(now.getFullYear(), i, 0);
                const monthExpenses = expenseTransactions.filter((t) => {
                  const tDate = new Date(t.date);
                  return tDate >= monthStart && tDate <= monthEnd;
                });
                const totalAmount = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
                trendData.push({
                  period: `${i}月`,
                  amount: totalAmount
                });
              }
              break;
            default:
              return [];
          }
          return trendData;
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:529", "[StatsPage] 加载趋势数据失败:", error);
          return [];
        }
      },
      /**
       * 生成图表标签
       */
      generateChartLabels(period) {
        const now = /* @__PURE__ */ new Date();
        switch (period) {
          case "week":
            const weekDates = this.getCurrentWeekDates(now);
            return weekDates.map((date) => this.getDayLabel(date));
          case "month":
            return ["1周", "2周", "3周", "4周", "5周"];
          case "year":
            const yearLabels = [];
            for (let i = 1; i <= 12; i += 2) {
              yearLabels.push(`${i}月`);
            }
            return yearLabels;
          default:
            return [];
        }
      },
      goBack() {
        uni.navigateBack();
      },
      goToHome() {
        try {
          formatAppLog("log", "at pages/accounting/stats.vue:569", "[StatsPage] 点击首页导航");
          if (this.loading) {
            formatAppLog("log", "at pages/accounting/stats.vue:573", "[StatsPage] 正在加载中，无法跳转");
            return;
          }
          uni.reLaunch({
            url: "/pages/index/index"
          });
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:581", "[StatsPage] 首页跳转失败:", error);
        }
      },
      goToAccounting() {
        try {
          formatAppLog("log", "at pages/accounting/stats.vue:587", "[StatsPage] 点击记账导航");
          if (this.loading) {
            formatAppLog("log", "at pages/accounting/stats.vue:591", "[StatsPage] 正在加载中，无法跳转");
            return;
          }
          uni.navigateTo({
            url: "/pages/accounting/index"
          });
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:599", "[StatsPage] 记账页跳转失败:", error);
        }
      },
      goToDiary() {
        uni.showToast({
          title: "日记功能开发中",
          icon: "none"
        });
      },
      goToSettings() {
        uni.showToast({
          title: "设置功能开发中",
          icon: "none"
        });
      },
      async setPeriod(period) {
        try {
          const now = Date.now();
          if (now - this.lastClickTime < this.clickDebounceTime) {
            formatAppLog("log", "at pages/accounting/stats.vue:623", "[StatsPage] 点击过快，忽略本次点击");
            return;
          }
          this.lastClickTime = now;
          formatAppLog("log", "at pages/accounting/stats.vue:628", "[StatsPage] 切换时间维度:", period);
          if (this.loading) {
            formatAppLog("log", "at pages/accounting/stats.vue:632", "[StatsPage] 正在加载中，忽略重复点击");
            return;
          }
          if (this.currentPeriod === period) {
            formatAppLog("log", "at pages/accounting/stats.vue:638", "[StatsPage] 已经是当前时间维度，无需切换");
            return;
          }
          this.loading = true;
          this.currentPeriod = period;
          await this.generateTrendData();
          formatAppLog("log", "at pages/accounting/stats.vue:648", "[StatsPage] 时间维度切换完成");
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:651", "[StatsPage] 时间维度切换失败:", error);
          uni.showToast({
            title: "切换失败，请重试",
            icon: "none"
          });
        } finally {
          this.loading = false;
        }
      },
      exportData() {
        const data = this.statsData[this.currentPeriod];
        formatAppLog("log", "at pages/accounting/stats.vue:664", "[StatsPage] 导出数据:", data);
        uni.showToast({
          title: "导出功能开发中",
          icon: "none"
        });
      },
      /**
       * 紧急重置页面状态
       */
      async resetPageState() {
        try {
          formatAppLog("log", "at pages/accounting/stats.vue:676", "[StatsPage] 重置页面状态");
          this.loading = false;
          this.lastClickTime = 0;
          this.currentPeriod = "month";
          await this.initializeData();
          uni.showToast({
            title: "页面已重置",
            icon: "success"
          });
        } catch (error) {
          formatAppLog("error", "at pages/accounting/stats.vue:692", "[StatsPage] 页面重置失败:", error);
          uni.showToast({
            title: "重置失败，请重启应用",
            icon: "none"
          });
        }
      },
      formatNumber(num) {
        return num.toLocaleString("zh-CN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      },
      /**
       * 格式化图表中心的金额显示，对大数字进行简化
       */
      formatChartAmount(amount) {
        if (amount >= 1e4) {
          const wan = amount / 1e4;
          return wan.toFixed(1) + "万";
        } else if (amount >= 1e3) {
          return amount.toFixed(0);
        } else {
          return amount.toFixed(0);
        }
      },
      /**
       * 获取当前周的所有日期（周一到周日）
       */
      getCurrentWeekDates(currentDate = /* @__PURE__ */ new Date()) {
        const dates = [];
        const current = new Date(currentDate);
        const currentDay = current.getDay();
        const mondayOffset = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(current);
        monday.setDate(current.getDate() - mondayOffset);
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          dates.push(date);
        }
        return dates;
      },
      /**
       * 获取日期的简短标签
       */
      getDayLabel(date) {
        const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
        const dayOfWeek = date.getDay();
        const today = /* @__PURE__ */ new Date();
        const isToday = date.toDateString() === today.toDateString();
        if (isToday) {
          return "今天";
        } else {
          return dayNames[dayOfWeek];
        }
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createCommentVNode(" 头部区域 "),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "header-top" }, [
          vue.createElementVNode("view", {
            class: "back-btn",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.goBack && $options.goBack(...args))
          }, [
            vue.createElementVNode("text", { class: "back-icon" }, "‹")
          ]),
          vue.createElementVNode(
            "text",
            {
              class: "header-title",
              onLongpress: _cache[1] || (_cache[1] = (...args) => $options.resetPageState && $options.resetPageState(...args))
            },
            "收支统计",
            32
            /* NEED_HYDRATION */
          ),
          vue.createElementVNode("view", {
            class: "export-btn",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.exportData && $options.exportData(...args))
          }, [
            vue.createElementVNode("text", { class: "export-icon" }, "📤")
          ])
        ])
      ]),
      vue.createCommentVNode(" 时间切换 "),
      vue.createElementVNode("view", { class: "time-switch-section" }, [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["time-switch", { loading: $data.loading }])
          },
          [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["time-btn", { active: $data.currentPeriod === "week", disabled: $data.loading }]),
                onClick: _cache[3] || (_cache[3] = ($event) => $options.setPeriod("week"))
              },
              [
                vue.createElementVNode("text", { class: "time-text" }, "本周")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["time-btn", { active: $data.currentPeriod === "month", disabled: $data.loading }]),
                onClick: _cache[4] || (_cache[4] = ($event) => $options.setPeriod("month"))
              },
              [
                vue.createElementVNode("text", { class: "time-text" }, "本月")
              ],
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["time-btn", { active: $data.currentPeriod === "year", disabled: $data.loading }]),
                onClick: _cache[5] || (_cache[5] = ($event) => $options.setPeriod("year"))
              },
              [
                vue.createElementVNode("text", { class: "time-text" }, "本年")
              ],
              2
              /* CLASS */
            )
          ],
          2
          /* CLASS */
        ),
        vue.createCommentVNode(" 加载指示器 "),
        $data.loading ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading-indicator"
        }, [
          vue.createElementVNode("text", { class: "loading-text" }, "正在加载...")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 收支概览 "),
      vue.createElementVNode("view", { class: "overview-section" }, [
        vue.createElementVNode("view", { class: "overview-card" }, [
          vue.createElementVNode(
            "text",
            { class: "overview-title" },
            vue.toDisplayString($options.periodTitle) + "概览",
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "overview-items" }, [
            vue.createElementVNode("view", { class: "overview-item" }, [
              vue.createElementVNode("view", { class: "overview-indicator income-indicator" }),
              vue.createElementVNode("text", { class: "overview-label" }, "总收入"),
              vue.createElementVNode(
                "text",
                { class: "overview-amount income" },
                "¥" + vue.toDisplayString($options.totalIncomeDisplay),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "overview-item" }, [
              vue.createElementVNode("view", { class: "overview-indicator expense-indicator" }),
              vue.createElementVNode("text", { class: "overview-label" }, "总支出"),
              vue.createElementVNode(
                "text",
                { class: "overview-amount expense" },
                "¥" + vue.toDisplayString($options.totalExpenseDisplay),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "net-income-section" }, [
            vue.createElementVNode("view", { class: "net-income-row" }, [
              vue.createElementVNode("text", { class: "net-label" }, "净收入"),
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["net-amount", { positive: $options.netIncome >= 0, negative: $options.netIncome < 0 }])
                },
                " ¥" + vue.toDisplayString($options.netIncomeDisplay),
                3
                /* TEXT, CLASS */
              )
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 支出分类图表 "),
      vue.createElementVNode("view", { class: "chart-section" }, [
        vue.createElementVNode("view", { class: "chart-card" }, [
          vue.createElementVNode("text", { class: "chart-title" }, "支出分类"),
          vue.createCommentVNode(" 环形图 "),
          vue.createElementVNode("view", { class: "chart-container" }, [
            vue.createElementVNode("view", { class: "donut-chart" }, [
              vue.createElementVNode("view", { class: "chart-center" }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: "chart-total",
                    style: vue.normalizeStyle($options.chartTotalStyle)
                  },
                  "¥" + vue.toDisplayString($options.chartTotalAmount),
                  5
                  /* TEXT, STYLE */
                ),
                vue.createElementVNode("text", { class: "chart-label" }, "总支出")
              ]),
              vue.createCommentVNode(" 动态环形图 "),
              vue.createElementVNode(
                "view",
                {
                  class: "chart-ring",
                  style: vue.normalizeStyle({ background: $options.chartGradient })
                },
                null,
                4
                /* STYLE */
              )
            ])
          ]),
          vue.createCommentVNode(" 分类详情 "),
          $options.expenseCategories.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "category-details"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($options.expenseCategories, (category) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "category-item",
                  key: category.id
                }, [
                  vue.createElementVNode("view", { class: "category-info" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "category-color",
                        style: vue.normalizeStyle({ background: category.color })
                      },
                      null,
                      4
                      /* STYLE */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "category-name" },
                      vue.toDisplayString(category.name),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "category-stats" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "category-amount" },
                      "¥" + vue.toDisplayString($options.formatNumber(category.amount)),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "category-percent" },
                      vue.toDisplayString(category.percent) + "%",
                      1
                      /* TEXT */
                    )
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            { key: 1 },
            [
              vue.createCommentVNode(" 空状态 "),
              vue.createElementVNode("view", { class: "empty-state" }, [
                vue.createElementVNode("view", { class: "empty-icon" }, "📊"),
                vue.createElementVNode("text", { class: "empty-text" }, "暂无支出数据"),
                vue.createElementVNode("text", { class: "empty-hint" }, "开始记账查看分类统计")
              ])
            ],
            2112
            /* STABLE_FRAGMENT, DEV_ROOT_FRAGMENT */
          ))
        ])
      ]),
      vue.createCommentVNode(" 趋势图表 "),
      vue.createElementVNode("view", { class: "trend-section" }, [
        vue.createElementVNode("view", { class: "trend-card" }, [
          vue.createElementVNode("text", { class: "trend-title" }, "支出趋势"),
          vue.createElementVNode("view", { class: "trend-chart" }, [
            vue.createElementVNode("view", { class: "chart-bars" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.trendData, (bar, index) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "bar-item",
                    key: index
                  }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "bar",
                        style: vue.normalizeStyle({ height: bar.height + "rpx" })
                      },
                      null,
                      4
                      /* STYLE */
                    )
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("view", { class: "chart-labels" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($data.trendData, (item, index) => {
                  return vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      class: "chart-label",
                      key: index
                    },
                    vue.toDisplayString(item.period || $options.chartLabels[index] || ""),
                    1
                    /* TEXT */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ])
      ]),
      vue.createCommentVNode(" 底部导航 "),
      vue.createElementVNode("view", { class: "bottom-nav" }, [
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[6] || (_cache[6] = (...args) => $options.goToHome && $options.goToHome(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "🏠"),
          vue.createElementVNode("text", { class: "nav-label" }, "首页")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item active",
          onClick: _cache[7] || (_cache[7] = (...args) => $options.goToAccounting && $options.goToAccounting(...args))
        }, [
          vue.createElementVNode("view", { class: "nav-icon-active" }, [
            vue.createElementVNode("text", { class: "nav-emoji" }, "💰")
          ]),
          vue.createElementVNode("text", { class: "nav-label-active" }, "记账")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[8] || (_cache[8] = (...args) => $options.goToDiary && $options.goToDiary(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "📖"),
          vue.createElementVNode("text", { class: "nav-label" }, "日记")
        ]),
        vue.createElementVNode("view", {
          class: "nav-item",
          onClick: _cache[9] || (_cache[9] = (...args) => $options.goToSettings && $options.goToSettings(...args))
        }, [
          vue.createElementVNode("text", { class: "nav-emoji" }, "⚙️"),
          vue.createElementVNode("text", { class: "nav-label" }, "设置")
        ])
      ])
    ]);
  }
  const PagesAccountingStats = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-ef360c78"], ["__file", "E:/app/oneself/oneself/pages/accounting/stats.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/accounting/index", PagesAccountingIndex);
  __definePage("pages/accounting/add", PagesAccountingAdd);
  __definePage("pages/accounting/detail", PagesAccountingDetail);
  __definePage("pages/accounting/edit", PagesAccountingEdit);
  __definePage("pages/accounting/stats", PagesAccountingStats);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "E:/app/oneself/oneself/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
