<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
/* 全局样式 */
page {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* H5端特殊样式 */
/* #ifdef H5 */
page {
	background: #f5f5f5;
}
/* #endif */

/* 非H5端背景设置为淡白色 */
/* #ifndef H5 */
page {
	background: #FAFAFA;
}
/* #endif */

/* 重置一些默认样式 */
view, text, image {
	box-sizing: border-box;
}

/* 全局字体设置 */
.uni-app-body {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
</style>
