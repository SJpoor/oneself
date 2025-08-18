/**
 * 本地存储工具类
 * 支持uni-app跨平台存储，后续可扩展SQLite插件
 */

class StorageManager {
  constructor() {
    this.storagePrefix = 'accounting_'
  }

  /**
   * 同步设置数据
   * @param {string} key 键名
   * @param {any} data 数据
   */
  setSync(key, data) {
    try {
      const fullKey = this.storagePrefix + key
      uni.setStorageSync(fullKey, JSON.stringify(data))
      console.log(`[Storage] 保存数据成功: ${key}`)
      return true
    } catch (error) {
      console.error(`[Storage] 保存数据失败: ${key}`, error)
      return false
    }
  }

  /**
   * 同步获取数据
   * @param {string} key 键名
   * @param {any} defaultValue 默认值
   */
  getSync(key, defaultValue = null) {
    try {
      const fullKey = this.storagePrefix + key
      const data = uni.getStorageSync(fullKey)
      if (data) {
        return JSON.parse(data)
      }
      return defaultValue
    } catch (error) {
      console.error(`[Storage] 获取数据失败: ${key}`, error)
      return defaultValue
    }
  }

  /**
   * 异步设置数据
   * @param {string} key 键名
   * @param {any} data 数据
   */
  async set(key, data) {
    return new Promise((resolve, reject) => {
      const fullKey = this.storagePrefix + key
      uni.setStorage({
        key: fullKey,
        data: JSON.stringify(data),
        success: () => {
          console.log(`[Storage] 异步保存数据成功: ${key}`)
          resolve(true)
        },
        fail: (error) => {
          console.error(`[Storage] 异步保存数据失败: ${key}`, error)
          reject(error)
        }
      })
    })
  }

  /**
   * 异步获取数据
   * @param {string} key 键名
   * @param {any} defaultValue 默认值
   */
  async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      const fullKey = this.storagePrefix + key
      uni.getStorage({
        key: fullKey,
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (error) {
            console.error(`[Storage] 解析数据失败: ${key}`, error)
            resolve(defaultValue)
          }
        },
        fail: () => {
          resolve(defaultValue)
        }
      })
    })
  }

  /**
   * 删除数据
   * @param {string} key 键名
   */
  remove(key) {
    try {
      const fullKey = this.storagePrefix + key
      uni.removeStorageSync(fullKey)
      console.log(`[Storage] 删除数据成功: ${key}`)
      return true
    } catch (error) {
      console.error(`[Storage] 删除数据失败: ${key}`, error)
      return false
    }
  }

  /**
   * 清空所有记账相关数据
   */
  clear() {
    try {
      const info = uni.getStorageInfoSync()
      const keys = info.keys.filter(key => key.startsWith(this.storagePrefix))
      keys.forEach(key => {
        uni.removeStorageSync(key)
      })
      console.log('[Storage] 清空数据成功')
      return true
    } catch (error) {
      console.error('[Storage] 清空数据失败', error)
      return false
    }
  }

  /**
   * 获取存储信息
   */
  getInfo() {
    try {
      const info = uni.getStorageInfoSync()
      const accountingKeys = info.keys.filter(key => key.startsWith(this.storagePrefix))
      return {
        totalKeys: info.keys.length,
        accountingKeys: accountingKeys.length,
        currentSize: info.currentSize,
        limitSize: info.limitSize,
        keys: accountingKeys
      }
    } catch (error) {
      console.error('[Storage] 获取存储信息失败', error)
      return null
    }
  }
}

// 导出单例实例
export default new StorageManager()