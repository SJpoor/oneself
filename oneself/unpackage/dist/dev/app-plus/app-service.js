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
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$1 = {
    data() {
      return {};
    },
    onLoad() {
    },
    methods: {
      navigateToAccounting() {
        formatAppLog("log", "at pages/index/index.vue:179", "导航到记账页面");
      },
      navigateToDiary() {
        formatAppLog("log", "at pages/index/index.vue:183", "导航到日记页面");
      },
      navigateToTodo() {
        formatAppLog("log", "at pages/index/index.vue:187", "导航到待办页面");
      },
      navigateToSettings() {
        formatAppLog("log", "at pages/index/index.vue:191", "导航到设置页面");
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
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
            vue.createElementVNode("text", { class: "action-title" }, "记账"),
            vue.createElementVNode("text", { class: "action-subtitle" }, "快速记录")
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
              vue.createElementVNode("text", { class: "stat-number number-gradient" }, "¥127"),
              vue.createElementVNode("text", { class: "stat-label" }, "今日支出"),
              vue.createElementVNode("view", { class: "progress-bar" }, [
                vue.createElementVNode("view", { class: "progress-fill" })
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
        vue.createElementVNode("view", { class: "activity-list" }, [
          vue.createCommentVNode(" 活动项 1 "),
          vue.createElementVNode("view", { class: "activity-item" }, [
            vue.createElementVNode("view", { class: "activity-dot dot-primary" }),
            vue.createElementVNode("view", { class: "activity-content" }, [
              vue.createElementVNode("view", { class: "activity-card glass-card" }, [
                vue.createElementVNode("view", { class: "activity-header" }, [
                  vue.createElementVNode("text", { class: "activity-title" }, "午餐 - 海底捞"),
                  vue.createElementVNode("text", { class: "activity-time" }, "2小时前")
                ]),
                vue.createElementVNode("text", { class: "activity-desc" }, "支出 ¥89")
              ])
            ])
          ]),
          vue.createCommentVNode(" 活动项 2 "),
          vue.createElementVNode("view", { class: "activity-item" }, [
            vue.createElementVNode("view", { class: "activity-dot dot-secondary" }),
            vue.createElementVNode("view", { class: "activity-content" }, [
              vue.createElementVNode("view", { class: "activity-card glass-card" }, [
                vue.createElementVNode("view", { class: "activity-header" }, [
                  vue.createElementVNode("text", { class: "activity-title" }, "完成工作任务"),
                  vue.createElementVNode("text", { class: "activity-time" }, "3小时前")
                ]),
                vue.createElementVNode("text", { class: "activity-desc" }, "待办任务已完成")
              ])
            ])
          ]),
          vue.createCommentVNode(" 活动项 3 "),
          vue.createElementVNode("view", { class: "activity-item" }, [
            vue.createElementVNode("view", { class: "activity-dot dot-accent" }),
            vue.createElementVNode("view", { class: "activity-content" }, [
              vue.createElementVNode("view", { class: "activity-card glass-card" }, [
                vue.createElementVNode("view", { class: "activity-header" }, [
                  vue.createElementVNode("text", { class: "activity-title" }, "写了今日感想"),
                  vue.createElementVNode("text", { class: "activity-time" }, "昨天")
                ]),
                vue.createElementVNode("text", { class: "activity-desc" }, "心情：开心 😊")
              ])
            ])
          ])
        ])
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
          onClick: _cache[3] || (_cache[3] = (...args) => $options.navigateToAccounting && $options.navigateToAccounting(...args))
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
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "E:/app/oneself/oneself/pages/index/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
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
