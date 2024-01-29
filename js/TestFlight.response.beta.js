/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ENV/ENV.mjs":
/*!*************************!*\
  !*** ./src/ENV/ENV.mjs ***!
  \*************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Http: () => (/* binding */ Http),
/* harmony export */   "default": () => (/* binding */ ENV)
/* harmony export */ });
class ENV {
	constructor(name, opts) {
		this.name = `${name}, ENV v1.0.0`
		this.http = new Http(this)
		this.data = null
		this.dataFile = 'box.dat'
		this.logs = []
		this.isMute = false
		this.isNeedRewrite = false
		this.logSeparator = '\n'
		this.encoding = 'utf-8'
		this.startTime = new Date().getTime()
		Object.assign(this, opts)
		this.log('', `🏁 ${this.name}, 开始!`)
	}

	Platform() {
		if ('undefined' !== typeof $environment && $environment['surge-version'])
			return 'Surge'
		if ('undefined' !== typeof $environment && $environment['stash-version'])
			return 'Stash'
		if ('undefined' !== typeof $task) return 'Quantumult X'
		if ('undefined' !== typeof $loon) return 'Loon'
		if ('undefined' !== typeof $rocket) return 'Shadowrocket'
	}

	isQuanX() {
		return 'Quantumult X' === this.Platform()
	}

	isSurge() {
		return 'Surge' === this.Platform()
	}

	isLoon() {
		return 'Loon' === this.Platform()
	}

	isShadowrocket() {
		return 'Shadowrocket' === this.Platform()
	}

	isStash() {
		return 'Stash' === this.Platform()
	}

	toObj(str, defaultValue = null) {
		try {
			return JSON.parse(str)
		} catch {
			return defaultValue
		}
	}

	toStr(obj, defaultValue = null) {
		try {
			return JSON.stringify(obj)
		} catch {
			return defaultValue
		}
	}

	getjson(key, defaultValue) {
		let json = defaultValue
		const val = this.getdata(key)
		if (val) {
			try {
				json = JSON.parse(this.getdata(key))
			} catch { }
		}
		return json
	}

	setjson(val, key) {
		try {
			return this.setdata(JSON.stringify(val), key)
		} catch {
			return false
		}
	}

	getScript(url) {
		return new Promise((resolve) => {
			this.get({ url }, (error, response, body) => resolve(body))
		})
	}

	runScript(script, runOpts) {
		return new Promise((resolve) => {
			let httpapi = this.getdata('@chavy_boxjs_userCfgs.httpapi')
			httpapi = httpapi ? httpapi.replace(/\n/g, '').trim() : httpapi
			let httpapi_timeout = this.getdata(
				'@chavy_boxjs_userCfgs.httpapi_timeout'
			)
			httpapi_timeout = httpapi_timeout ? httpapi_timeout * 1 : 20
			httpapi_timeout =
				runOpts && runOpts.timeout ? runOpts.timeout : httpapi_timeout
			const [key, addr] = httpapi.split('@')
			const opts = {
				url: `http://${addr}/v1/scripting/evaluate`,
				body: {
					script_text: script,
					mock_type: 'cron',
					timeout: httpapi_timeout
				},
				headers: { 'X-Key': key, 'Accept': '*/*' },
				timeout: httpapi_timeout
			}
			this.post(opts, (error, response, body) => resolve(body))
		}).catch((e) => this.logErr(e))
	}

	loaddata() {
		if (this.isNode()) {
			this.fs = this.fs ? this.fs : require('fs')
			this.path = this.path ? this.path : require('path')
			const curDirDataFilePath = this.path.resolve(this.dataFile)
			const rootDirDataFilePath = this.path.resolve(
				process.cwd(),
				this.dataFile
			)
			const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
			const isRootDirDataFile =
				!isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
			if (isCurDirDataFile || isRootDirDataFile) {
				const datPath = isCurDirDataFile
					? curDirDataFilePath
					: rootDirDataFilePath
				try {
					return JSON.parse(this.fs.readFileSync(datPath))
				} catch (e) {
					return {}
				}
			} else return {}
		} else return {}
	}

	writedata() {
		if (this.isNode()) {
			this.fs = this.fs ? this.fs : require('fs')
			this.path = this.path ? this.path : require('path')
			const curDirDataFilePath = this.path.resolve(this.dataFile)
			const rootDirDataFilePath = this.path.resolve(
				process.cwd(),
				this.dataFile
			)
			const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath)
			const isRootDirDataFile =
				!isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath)
			const jsondata = JSON.stringify(this.data)
			if (isCurDirDataFile) {
				this.fs.writeFileSync(curDirDataFilePath, jsondata)
			} else if (isRootDirDataFile) {
				this.fs.writeFileSync(rootDirDataFilePath, jsondata)
			} else {
				this.fs.writeFileSync(curDirDataFilePath, jsondata)
			}
		}
	}

	lodash_get(source, path, defaultValue = undefined) {
		const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.')
		let result = source
		for (const p of paths) {
			result = Object(result)[p]
			if (result === undefined) {
				return defaultValue
			}
		}
		return result
	}

	lodash_set(obj, path, value) {
		if (Object(obj) !== obj) return obj
		if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []
		path
			.slice(0, -1)
			.reduce(
				(a, c, i) =>
					Object(a[c]) === a[c]
						? a[c]
						: (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {}),
				obj
			)[path[path.length - 1]] = value
		return obj
	}

	getdata(key) {
		let val = this.getval(key)
		// 如果以 @
		if (/^@/.test(key)) {
			const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key)
			const objval = objkey ? this.getval(objkey) : ''
			if (objval) {
				try {
					const objedval = JSON.parse(objval)
					val = objedval ? this.lodash_get(objedval, paths, '') : val
				} catch (e) {
					val = ''
				}
			}
		}
		return val
	}

	setdata(val, key) {
		let issuc = false
		if (/^@/.test(key)) {
			const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key)
			const objdat = this.getval(objkey)
			const objval = objkey
				? objdat === 'null'
					? null
					: objdat || '{}'
				: '{}'
			try {
				const objedval = JSON.parse(objval)
				this.lodash_set(objedval, paths, val)
				issuc = this.setval(JSON.stringify(objedval), objkey)
			} catch (e) {
				const objedval = {}
				this.lodash_set(objedval, paths, val)
				issuc = this.setval(JSON.stringify(objedval), objkey)
			}
		} else {
			issuc = this.setval(val, key)
		}
		return issuc
	}

	getval(key) {
		switch (this.Platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Shadowrocket':
				return $persistentStore.read(key)
			case 'Quantumult X':
				return $prefs.valueForKey(key)
			default:
				return (this.data && this.data[key]) || null
		}
	}

	setval(val, key) {
		switch (this.Platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Shadowrocket':
				return $persistentStore.write(val, key)
			case 'Quantumult X':
				return $prefs.setValueForKey(val, key)
			default:
				return (this.data && this.data[key]) || null
		}
	}

	initGotEnv(opts) {
		this.got = this.got ? this.got : require('got')
		this.cktough = this.cktough ? this.cktough : require('tough-cookie')
		this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar()
		if (opts) {
			opts.headers = opts.headers ? opts.headers : {}
			if (undefined === opts.headers.Cookie && undefined === opts.cookieJar) {
				opts.cookieJar = this.ckjar
			}
		}
	}

	get(request, callback = () => { }) {
		delete request.headers?.['Content-Length']
		delete request.headers?.['content-length']

		switch (this.Platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Shadowrocket':
			default:
				if (this.isSurge() && this.isNeedRewrite) {
					this.lodash_set(request, 'headers.X-Surge-Skip-Scripting', false)
				}
				$httpClient.get(request, (error, response, body) => {
					if (!error && response) {
						response.body = body
						response.statusCode = response.status ? response.status : response.statusCode
						response.status = response.statusCode
					}
					callback(error, response, body)
				})
				break
			case 'Quantumult X':
				if (this.isNeedRewrite) {
					this.lodash_set(request, 'opts.hints', false)
				}
				$task.fetch(request).then(
					(response) => {
						const {
							statusCode: status,
							statusCode,
							headers,
							body,
							bodyBytes
						} = response
						callback(
							null,
							{ status, statusCode, headers, body, bodyBytes },
							body,
							bodyBytes
						)
					},
					(error) => callback((error && error.erroror) || 'UndefinedError')
				)
				break
		}
	}

	post(request, callback = () => { }) {
		const method = request.method
			? request.method.toLocaleLowerCase()
			: 'post'

		// 如果指定了请求体, 但没指定 `Content-Type`、`content-type`, 则自动生成。
		if (
			request.body &&
			request.headers &&
			!request.headers['Content-Type'] &&
			!request.headers['content-type']
		) {
			// HTTP/1、HTTP/2 都支持小写 headers
			request.headers['content-type'] = 'application/x-www-form-urlencoded'
		}
		// 为避免指定错误 `content-length` 这里删除该属性，由工具端 (HttpClient) 负责重新计算并赋值
			delete request.headers?.['Content-Length']
			delete request.headers?.['content-length']
		switch (this.Platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Shadowrocket':
			default:
				if (this.isSurge() && this.isNeedRewrite) {
					this.lodash_set(request, 'headers.X-Surge-Skip-Scripting', false)
				}
				$httpClient[method](request, (error, response, body) => {
					if (!error && response) {
						response.body = body
						response.statusCode = response.status ? response.status : response.statusCode
						response.status = response.statusCode
					}
					callback(error, response, body)
				})
				break
			case 'Quantumult X':
				request.method = method
				if (this.isNeedRewrite) {
					this.lodash_set(request, 'opts.hints', false)
				}
				$task.fetch(request).then(
					(response) => {
						const {
							statusCode: status,
							statusCode,
							headers,
							body,
							bodyBytes
						} = response
						callback(
							null,
							{ status, statusCode, headers, body, bodyBytes },
							body,
							bodyBytes
						)
					},
					(error) => callback((error && error.erroror) || 'UndefinedError')
				)
				break
		}
	}
	/**
	 *
	 * 示例:$.time('yyyy-MM-dd qq HH:mm:ss.S')
	 *    :$.time('yyyyMMddHHmmssS')
	 *    y:年 M:月 d:日 q:季 H:时 m:分 s:秒 S:毫秒
	 *    其中y可选0-4位占位符、S可选0-1位占位符，其余可选0-2位占位符
	 * @param {string} format 格式化参数
	 * @param {number} ts 可选: 根据指定时间戳返回格式化日期
	 *
	 */
	time(format, ts = null) {
		const date = ts ? new Date(ts) : new Date()
		let o = {
			'M+': date.getMonth() + 1,
			'd+': date.getDate(),
			'H+': date.getHours(),
			'm+': date.getMinutes(),
			's+': date.getSeconds(),
			'q+': Math.floor((date.getMonth() + 3) / 3),
			'S': date.getMilliseconds()
		}
		if (/(y+)/.test(format))
			format = format.replace(
				RegExp.$1,
				(date.getFullYear() + '').substr(4 - RegExp.$1.length)
			)
		for (let k in o)
			if (new RegExp('(' + k + ')').test(format))
				format = format.replace(
					RegExp.$1,
					RegExp.$1.length == 1
						? o[k]
						: ('00' + o[k]).substr(('' + o[k]).length)
				)
		return format
	}

	/**
	 * 系统通知
	 *
	 * > 通知参数: 同时支持 QuanX 和 Loon 两种格式, EnvJs根据运行环境自动转换, Surge 环境不支持多媒体通知
	 *
	 * 示例:
	 * $.msg(title, subt, desc, 'twitter://')
	 * $.msg(title, subt, desc, { 'open-url': 'twitter://', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
	 * $.msg(title, subt, desc, { 'open-url': 'https://bing.com', 'media-url': 'https://github.githubassets.com/images/modules/open_graph/github-mark.png' })
	 *
	 * @param {*} title 标题
	 * @param {*} subt 副标题
	 * @param {*} desc 通知详情
	 * @param {*} opts 通知参数
	 *
	 */
	msg(title = name, subt = '', desc = '', opts) {
		const toEnvOpts = (rawopts) => {
			switch (typeof rawopts) {
				case undefined:
					return rawopts
				case 'string':
					switch (this.Platform()) {
						case 'Surge':
						case 'Stash':
						default:
							return { url: rawopts }
						case 'Loon':
						case 'Shadowrocket':
							return rawopts
						case 'Quantumult X':
							return { 'open-url': rawopts }
					}
				case 'object':
					switch (this.Platform()) {
						case 'Surge':
						case 'Stash':
						case 'Shadowrocket':
						default: {
							let openUrl =
								rawopts.url || rawopts.openUrl || rawopts['open-url']
							return { url: openUrl }
						}
						case 'Loon': {
							let openUrl =
								rawopts.openUrl || rawopts.url || rawopts['open-url']
							let mediaUrl = rawopts.mediaUrl || rawopts['media-url']
							return { openUrl, mediaUrl }
						}
						case 'Quantumult X': {
							let openUrl =
								rawopts['open-url'] || rawopts.url || rawopts.openUrl
							let mediaUrl = rawopts['media-url'] || rawopts.mediaUrl
							let updatePasteboard =
								rawopts['update-pasteboard'] || rawopts.updatePasteboard
							return {
								'open-url': openUrl,
								'media-url': mediaUrl,
								'update-pasteboard': updatePasteboard
							}
						}
					}
				default:
					return undefined
			}
		}
		if (!this.isMute) {
			switch (this.Platform()) {
				case 'Surge':
				case 'Loon':
				case 'Stash':
				case 'Shadowrocket':
				default:
					$notification.post(title, subt, desc, toEnvOpts(opts))
					break
				case 'Quantumult X':
					$notify(title, subt, desc, toEnvOpts(opts))
					break
			}
		}
		if (!this.isMuteLog) {
			let logs = ['', '==============📣系统通知📣==============']
			logs.push(title)
			subt ? logs.push(subt) : ''
			desc ? logs.push(desc) : ''
			console.log(logs.join('\n'))
			this.logs = this.logs.concat(logs)
		}
	}

	log(...logs) {
		if (logs.length > 0) {
			this.logs = [...this.logs, ...logs]
		}
		console.log(logs.join(this.logSeparator))
	}

	logErr(error) {
		switch (this.Platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Shadowrocket':
			case 'Quantumult X':
			default:
				this.log('', `❗️ ${this.name}, 错误!`, error)
				break
		}
	}

	wait(time) {
		return new Promise((resolve) => setTimeout(resolve, time))
	}

	done(val = {}) {
		const endTime = new Date().getTime()
		const costTime = (endTime - this.startTime) / 1000
		this.log('', `🚩 ${this.name}, 结束! 🕛 ${costTime} 秒`)
		this.log()
		switch (this.Platform()) {
			case 'Surge':
			case 'Loon':
			case 'Stash':
			case 'Shadowrocket':
			case 'Quantumult X':
			default:
				$done(val)
				break
		}
	}

	/**
	 * Get Environment Variables
	 * @link https://github.com/VirgilClyne/GetSomeFries/blob/main/function/getENV/getENV.js
	 * @author VirgilClyne
	 * @param {String} key - Persistent Store Key
	 * @param {Array} names - Platform Names
	 * @param {Object} database - Default Database
	 * @return {Object} { Settings, Caches, Configs }
	 */
	getENV(key, names, database) {
		//this.log(`☑️ ${this.name}, Get Environment Variables`, "");
		/***************** BoxJs *****************/
		// 包装为局部变量，用完释放内存
		// BoxJs的清空操作返回假值空字符串, 逻辑或操作符会在左侧操作数为假值时返回右侧操作数。
		let BoxJs = this.getjson(key, database);
		//this.log(`🚧 ${this.name}, Get Environment Variables`, `BoxJs类型: ${typeof BoxJs}`, `BoxJs内容: ${JSON.stringify(BoxJs)}`, "");
		/***************** Argument *****************/
		let Argument = {};
		if (typeof $argument !== "undefined") {
			if (Boolean($argument)) {
				//this.log(`🎉 ${this.name}, $Argument`);
				let arg = Object.fromEntries($argument.split("&").map((item) => item.split("=").map(i => i.replace(/\"/g, ''))));
				//this.log(JSON.stringify(arg));
				for (let item in arg) this.setPath(Argument, item, arg[item]);
				//this.log(JSON.stringify(Argument));
			};
			//this.log(`✅ ${this.name}, Get Environment Variables`, `Argument类型: ${typeof Argument}`, `Argument内容: ${JSON.stringify(Argument)}`, "");
		};
		/***************** Store *****************/
		const Store = { Settings: database?.Default?.Settings || {}, Configs: database?.Default?.Configs || {}, Caches: {} };
		if (!Array.isArray(names)) names = [names];
		//this.log(`🚧 ${this.name}, Get Environment Variables`, `names类型: ${typeof names}`, `names内容: ${JSON.stringify(names)}`, "");
		for (let name of names) {
			Store.Settings = { ...Store.Settings, ...database?.[name]?.Settings, ...Argument, ...BoxJs?.[name]?.Settings };
			Store.Configs = { ...Store.Configs, ...database?.[name]?.Configs };
			if (BoxJs?.[name]?.Caches && typeof BoxJs?.[name]?.Caches === "string") BoxJs[name].Caches = JSON.parse(BoxJs?.[name]?.Caches);
			Store.Caches = { ...Store.Caches, ...BoxJs?.[name]?.Caches };
		};
		//this.log(`🚧 ${this.name}, Get Environment Variables`, `Store.Settings类型: ${typeof Store.Settings}`, `Store.Settings: ${JSON.stringify(Store.Settings)}`, "");
		this.traverseObject(Store.Settings, (key, value) => {
			//this.log(`🚧 ${this.name}, traverseObject`, `${key}: ${typeof value}`, `${key}: ${JSON.stringify(value)}`, "");
			if (value === "true" || value === "false") value = JSON.parse(value); // 字符串转Boolean
			else if (typeof value === "string") {
				if (value.includes(",")) value = value.split(",").map(item => this.string2number(item)); // 字符串转数组转数字
				else value = this.string2number(value); // 字符串转数字
			};
			return value;
		});
		//this.log(`✅ ${this.name}, Get Environment Variables`, `Store: ${typeof Store.Caches}`, `Store内容: ${JSON.stringify(Store)}`, "");
		return Store;
	};

	/***************** function *****************/
	setPath(object, path, value) { path.split(".").reduce((o, p, i) => o[p] = path.split(".").length === ++i ? value : o[p] || {}, object) }
	traverseObject(o, c) { for (var t in o) { var n = o[t]; o[t] = "object" == typeof n && null !== n ? this.traverseObject(n, c) : c(t, n) } return o }
	string2number(string) { if (string && !isNaN(string)) string = parseInt(string, 10); return string }
}

class Http {
	constructor(env) {
		this.env = env
	}

	send(opts, method = 'GET') {
		opts = typeof opts === 'string' ? { url: opts } : opts
		let sender = this.get
		if (method === 'POST') {
			sender = this.post
		}
		return new Promise((resolve, reject) => {
			sender.call(this, opts, (error, response, body) => {
				if (error) reject(error)
				else resolve(response)
			})
		})
	}

	get(opts) {
		return this.send.call(this.env, opts)
	}

	post(opts) {
		return this.send.call(this.env, opts, 'POST')
	}
}


/***/ }),

/***/ "./src/URI/URI.mjs":
/*!*************************!*\
  !*** ./src/URI/URI.mjs ***!
  \*************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ URI)
/* harmony export */ });
class URI {
	constructor(opts = []) {
		this.name = "URI v1.2.6";
		this.opts = opts;
		this.json = { scheme: "", host: "", path: "", query: {} };
	};

	parse(url) {
		const URLRegex = /(?:(?<scheme>.+):\/\/(?<host>[^/]+))?\/?(?<path>[^?]+)?\??(?<query>[^?]+)?/;
		let json = url.match(URLRegex)?.groups ?? null;
		if (json?.path) json.paths = json.path.split("/"); else json.path = "";
		//if (json?.paths?.at(-1)?.includes(".")) json.format = json.paths.at(-1).split(".").at(-1);
		if (json?.paths) {
			const fileName = json.paths[json.paths.length - 1];
			if (fileName?.includes(".")) {
				const list = fileName.split(".");
				json.format = list[list.length - 1];
			}
		}
		if (json?.query) json.query = Object.fromEntries(json.query.split("&").map((param) => param.split("=")));
		return json
	};

	stringify(json = this.json) {
		let url = "";
		if (json?.scheme && json?.host) url += json.scheme + "://" + json.host;
		if (json?.path) url += (json?.host) ? "/" + json.path : json.path;
		if (json?.query) url += "?" + Object.entries(json.query).map(param => param.join("=")).join("&");
		return url
	};
}


/***/ }),

/***/ "./src/function/setENV.mjs":
/*!*********************************!*\
  !*** ./src/function/setENV.mjs ***!
  \*********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ setENV)
/* harmony export */ });
/* harmony import */ var _ENV_ENV_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../ENV/ENV.mjs */ "./src/ENV/ENV.mjs");
/*
README: https://github.com/VirgilClyne/iRingo
*/


const $ = new _ENV_ENV_mjs__WEBPACK_IMPORTED_MODULE_0__["default"](" iRingo: Set Environment Variables beta");

/**
 * Set Environment Variables
 * @author VirgilClyne
 * @param {String} name - Persistent Store Key
 * @param {Array} platforms - Platform Names
 * @param {Object} database - Default DataBase
 * @return {Object} { Settings, Caches, Configs }
 */
function setENV(name, platforms, database) {
	$.log(`☑️ ${$.name}`, "");
	let { Settings, Caches, Configs } = $.getENV(name, platforms, database);
	/***************** Settings *****************/
	if (Settings?.Tabs && !Array.isArray(Settings?.Tabs)) $.lodash_set(Settings, "Tabs", (Settings?.Tabs) ? [Settings.Tabs.toString()] : []);
	if (Settings?.Domains && !Array.isArray(Settings?.Domains)) $.lodash_set(Settings, "Domains", (Settings?.Domains) ? [Settings.Domains.toString()] : []);
	if (Settings?.Functions && !Array.isArray(Settings?.Functions)) $.lodash_set(Settings, "Functions", (Settings?.Functions) ? [Settings.Functions.toString()] : []);
	$.log(`✅ ${$.name}`, `Settings: ${typeof Settings}`, `Settings内容: ${JSON.stringify(Settings)}`, "");
	/***************** Caches *****************/
	//$.log(`✅ ${$.name}`, `Caches: ${typeof Caches}`, `Caches内容: ${JSON.stringify(Caches)}`, "");
	/***************** Configs *****************/
	Configs.Storefront = new Map(Configs.Storefront);
	if (Configs.Locale) Configs.Locale = new Map(Configs.Locale);
	if (Configs.i18n) for (let type in Configs.i18n) Configs.i18n[type] = new Map(Configs.i18n[type]);
	return { Settings, Caches, Configs };
};


/***/ }),

/***/ "./src/database/Default.json":
/*!***********************************!*\
  !*** ./src/database/Default.json ***!
  \***********************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":true},"Configs":{"Storefront":[["AE","143481"],["AF","143610"],["AG","143540"],["AI","143538"],["AL","143575"],["AM","143524"],["AO","143564"],["AR","143505"],["AT","143445"],["AU","143460"],["AZ","143568"],["BA","143612"],["BB","143541"],["BD","143490"],["BE","143446"],["BF","143578"],["BG","143526"],["BH","143559"],["BJ","143576"],["BM","143542"],["BN","143560"],["BO","143556"],["BR","143503"],["BS","143539"],["BT","143577"],["BW","143525"],["BY","143565"],["BZ","143555"],["CA","143455"],["CD","143613"],["CG","143582"],["CH","143459"],["CI","143527"],["CL","143483"],["CM","143574"],["CN","143465"],["CO","143501"],["CR","143495"],["CV","143580"],["CY","143557"],["CZ","143489"],["DE","143443"],["DK","143458"],["DM","143545"],["DO","143508"],["DZ","143563"],["EC","143509"],["EE","143518"],["EG","143516"],["ES","143454"],["FI","143447"],["FJ","143583"],["FM","143591"],["FR","143442"],["GA","143614"],["GB","143444"],["GD","143546"],["GF","143615"],["GH","143573"],["GM","143584"],["GR","143448"],["GT","143504"],["GW","143585"],["GY","143553"],["HK","143463"],["HN","143510"],["HR","143494"],["HU","143482"],["ID","143476"],["IE","143449"],["IL","143491"],["IN","143467"],["IQ","143617"],["IS","143558"],["IT","143450"],["JM","143511"],["JO","143528"],["JP","143462"],["KE","143529"],["KG","143586"],["KH","143579"],["KN","143548"],["KP","143466"],["KR","143466"],["KW","143493"],["KY","143544"],["KZ","143517"],["TC","143552"],["TD","143581"],["TJ","143603"],["TH","143475"],["TM","143604"],["TN","143536"],["TO","143608"],["TR","143480"],["TT","143551"],["TW","143470"],["TZ","143572"],["LA","143587"],["LB","143497"],["LC","143549"],["LI","143522"],["LK","143486"],["LR","143588"],["LT","143520"],["LU","143451"],["LV","143519"],["LY","143567"],["MA","143620"],["MD","143523"],["ME","143619"],["MG","143531"],["MK","143530"],["ML","143532"],["MM","143570"],["MN","143592"],["MO","143515"],["MR","143590"],["MS","143547"],["MT","143521"],["MU","143533"],["MV","143488"],["MW","143589"],["MX","143468"],["MY","143473"],["MZ","143593"],["NA","143594"],["NE","143534"],["NG","143561"],["NI","143512"],["NL","143452"],["NO","143457"],["NP","143484"],["NR","143606"],["NZ","143461"],["OM","143562"],["PA","143485"],["PE","143507"],["PG","143597"],["PH","143474"],["PK","143477"],["PL","143478"],["PT","143453"],["PW","143595"],["PY","143513"],["QA","143498"],["RO","143487"],["RS","143500"],["RU","143469"],["RW","143621"],["SA","143479"],["SB","143601"],["SC","143599"],["SE","143456"],["SG","143464"],["SI","143499"],["SK","143496"],["SL","143600"],["SN","143535"],["SR","143554"],["ST","143598"],["SV","143506"],["SZ","143602"],["UA","143492"],["UG","143537"],["US","143441"],["UY","143514"],["UZ","143566"],["VC","143550"],["VE","143502"],["VG","143543"],["VN","143471"],["VU","143609"],["XK","143624"],["YE","143571"],["ZA","143472"],["ZM","143622"],["ZW","143605"]]}}');

/***/ }),

/***/ "./src/database/Location.json":
/*!************************************!*\
  !*** ./src/database/Location.json ***!
  \************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":true,"PEP":{"GCC":"US"},"Services":{"PlaceData":"CN","Directions":"AUTO","Traffic":"AUTO","RAP":"XX","Tiles":"AUTO"},"Geo_manifest":{"Dynamic":{"Config":{"Country_code":{"default":"AUTO","iOS":"CN","iPadOS":"CN","watchOS":"US","macOS":"CN"}}}},"Config":{"Announcements":{"Environment:":{"default":"AUTO","iOS":"CN","iPadOS":"CN","watchOS":"XX","macOS":"CN"}},"Defaults":{"LagunaBeach":true,"DrivingMultiWaypointRoutesEnabled":true,"GEOAddressCorrection":true,"LookupMaxParametersCount":true,"LocalitiesAndLandmarks":true,"POIBusyness":true,"PedestrianAR":true,"6694982d2b14e95815e44e970235e230":true,"OpticalHeading":true,"UseCLPedestrianMapMatchedLocations":true,"TransitPayEnabled":true,"SupportsOffline":true,"SupportsCarIntegration":true,"WiFiQualityNetworkDisabled":false,"WiFiQualityTileDisabled":false}}}}');

/***/ }),

/***/ "./src/database/News.json":
/*!********************************!*\
  !*** ./src/database/News.json ***!
  \********************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":true,"CountryCode":"US","newsPlusUser":true}}');

/***/ }),

/***/ "./src/database/PrivateRelay.json":
/*!****************************************!*\
  !*** ./src/database/PrivateRelay.json ***!
  \****************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":true,"CountryCode":"US","canUse":true}}');

/***/ }),

/***/ "./src/database/Siri.json":
/*!********************************!*\
  !*** ./src/database/Siri.json ***!
  \********************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":true,"CountryCode":"SG","Domains":["web","itunes","app_store","movies","restaurants","maps"],"Functions":["flightutilities","lookup","mail","messages","news","safari","siri","spotlight","visualintelligence"],"Safari_Smart_History":true},"Configs":{"VisualIntelligence":{"enabled_domains":["pets","media","books","art","nature","landmarks"],"supported_domains":["ART","BOOK","MEDIA","LANDMARK","ANIMALS","BIRDS","FOOD","SIGN_SYMBOL","AUTO_SYMBOL","DOGS","NATURE","NATURAL_LANDMARK","INSECTS","REPTILES","ALBUM","STOREFRONT","LAUNDRY_CARE_SYMBOL","CATS","OBJECT_2D","SCULPTURE","SKYLINE","MAMMALS"]}}}');

/***/ }),

/***/ "./src/database/TV.json":
/*!******************************!*\
  !*** ./src/database/TV.json ***!
  \******************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":true,"Third-Party":false,"HLSUrl":"play-edge.itunes.apple.com","ServerUrl":"play.itunes.apple.com","Tabs":["WatchNow","Originals","MLS","Sports","Kids","Store","Movies","TV","ChannelsAndApps","Library","Search"],"CountryCode":{"Configs":"AUTO","Settings":"AUTO","View":["SG","TW"],"WatchNow":"AUTO","Channels":"AUTO","Originals":"AUTO","Sports":"US","Kids":"US","Store":"AUTO","Movies":"AUTO","TV":"AUTO","Persons":"SG","Search":"AUTO","Others":"AUTO"}},"Configs":{"Locale":[["AU","en-AU"],["CA","en-CA"],["GB","en-GB"],["KR","ko-KR"],["HK","yue-Hant"],["JP","ja-JP"],["MO","zh-Hant"],["TW","zh-Hant"],["US","en-US"],["SG","zh-Hans"]],"Tabs":[{"title":"主页","type":"WatchNow","universalLinks":["https://tv.apple.com/watch-now","https://tv.apple.com/home"],"destinationType":"Target","target":{"id":"tahoma_watchnow","type":"Root","url":"https://tv.apple.com/watch-now"},"isSelected":true},{"title":"Apple TV+","type":"Originals","universalLinks":["https://tv.apple.com/channel/tvs.sbd.4000","https://tv.apple.com/atv"],"destinationType":"Target","target":{"id":"tvs.sbd.4000","type":"Brand","url":"https://tv.apple.com/us/channel/tvs.sbd.4000"}},{"title":"MLS Season Pass","type":"MLS","universalLinks":["https://tv.apple.com/mls"],"destinationType":"Target","target":{"id":"tvs.sbd.7000","type":"Brand","url":"https://tv.apple.com/us/channel/tvs.sbd.7000"}},{"title":"体育节目","type":"Sports","universalLinks":["https://tv.apple.com/sports"],"destinationType":"Target","target":{"id":"tahoma_sports","type":"Root","url":"https://tv.apple.com/sports"}},{"title":"儿童","type":"Kids","universalLinks":["https://tv.apple.com/kids"],"destinationType":"Target","target":{"id":"tahoma_kids","type":"Root","url":"https://tv.apple.com/kids"}},{"title":"电影","type":"Movies","universalLinks":["https://tv.apple.com/movies"],"destinationType":"Target","target":{"id":"tahoma_movies","type":"Root","url":"https://tv.apple.com/movies"}},{"title":"电视节目","type":"TV","universalLinks":["https://tv.apple.com/tv-shows"],"destinationType":"Target","target":{"id":"tahoma_tvshows","type":"Root","url":"https://tv.apple.com/tv-shows"}},{"title":"商店","type":"Store","universalLinks":["https://tv.apple.com/store"],"destinationType":"SubTabs","subTabs":[{"title":"电影","type":"Movies","universalLinks":["https://tv.apple.com/movies"],"destinationType":"Target","target":{"id":"tahoma_movies","type":"Root","url":"https://tv.apple.com/movies"}},{"title":"电视节目","type":"TV","universalLinks":["https://tv.apple.com/tv-shows"],"destinationType":"Target","target":{"id":"tahoma_tvshows","type":"Root","url":"https://tv.apple.com/tv-shows"}}]},{"title":"频道和 App","destinationType":"SubTabs","subTabsPlacementType":"ExpandedList","type":"ChannelsAndApps","subTabs":[]},{"title":"资料库","type":"Library","destinationType":"Client"},{"title":"搜索","type":"Search","universalLinks":["https://tv.apple.com/search"],"destinationType":"Target","target":{"id":"tahoma_search","type":"Root","url":"https://tv.apple.com/search"}}],"i18n":{"WatchNow":[["en","Home"],["zh","主页"],["zh-Hans","主頁"],["zh-Hant","主頁"]],"Movies":[["en","Movies"],["zh","电影"],["zh-Hans","电影"],["zh-Hant","電影"]],"TV":[["en","TV"],["zh","电视节目"],["zh-Hans","电视节目"],["zh-Hant","電視節目"]],"Store":[["en","Store"],["zh","商店"],["zh-Hans","商店"],["zh-Hant","商店"]],"Sports":[["en","Sports"],["zh","体育节目"],["zh-Hans","体育节目"],["zh-Hant","體育節目"]],"Kids":[["en","Kids"],["zh","儿童"],["zh-Hans","儿童"],["zh-Hant","兒童"]],"Library":[["en","Library"],["zh","资料库"],["zh-Hans","资料库"],["zh-Hant","資料庫"]],"Search":[["en","Search"],["zh","搜索"],["zh-Hans","搜索"],["zh-Hant","蒐索"]]}}}');

/***/ }),

/***/ "./src/database/TestFlight.json":
/*!**************************************!*\
  !*** ./src/database/TestFlight.json ***!
  \**************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"Settings":{"Switch":"true","CountryCode":"US","MultiAccount":"false","Universal":"true"}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*****************************************!*\
  !*** ./src/TestFlight.response.beta.js ***!
  \*****************************************/
var _database_Default_json__WEBPACK_IMPORTED_MODULE_3___namespace_cache;
var _database_Location_json__WEBPACK_IMPORTED_MODULE_4___namespace_cache;
var _database_News_json__WEBPACK_IMPORTED_MODULE_5___namespace_cache;
var _database_PrivateRelay_json__WEBPACK_IMPORTED_MODULE_6___namespace_cache;
var _database_Siri_json__WEBPACK_IMPORTED_MODULE_7___namespace_cache;
var _database_TestFlight_json__WEBPACK_IMPORTED_MODULE_8___namespace_cache;
var _database_TV_json__WEBPACK_IMPORTED_MODULE_9___namespace_cache;
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _ENV_ENV_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ENV/ENV.mjs */ "./src/ENV/ENV.mjs");
/* harmony import */ var _URI_URI_mjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./URI/URI.mjs */ "./src/URI/URI.mjs");
/* harmony import */ var _function_setENV_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./function/setENV.mjs */ "./src/function/setENV.mjs");
/* harmony import */ var _database_Default_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./database/Default.json */ "./src/database/Default.json");
/* harmony import */ var _database_Location_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./database/Location.json */ "./src/database/Location.json");
/* harmony import */ var _database_News_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./database/News.json */ "./src/database/News.json");
/* harmony import */ var _database_PrivateRelay_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./database/PrivateRelay.json */ "./src/database/PrivateRelay.json");
/* harmony import */ var _database_Siri_json__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./database/Siri.json */ "./src/database/Siri.json");
/* harmony import */ var _database_TestFlight_json__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./database/TestFlight.json */ "./src/database/TestFlight.json");
/* harmony import */ var _database_TV_json__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./database/TV.json */ "./src/database/TV.json");
/*
README: https://github.com/VirgilClyne/iRingo
*/













const $ = new _ENV_ENV_mjs__WEBPACK_IMPORTED_MODULE_0__["default"](" iRingo: ✈ TestFlight v3.1.1(1) response.beta");
const URI = new _URI_URI_mjs__WEBPACK_IMPORTED_MODULE_1__["default"]();
const DataBase = {
	"Default": /*#__PURE__*/ (_database_Default_json__WEBPACK_IMPORTED_MODULE_3___namespace_cache || (_database_Default_json__WEBPACK_IMPORTED_MODULE_3___namespace_cache = __webpack_require__.t(_database_Default_json__WEBPACK_IMPORTED_MODULE_3__, 2))),
	"Location": /*#__PURE__*/ (_database_Location_json__WEBPACK_IMPORTED_MODULE_4___namespace_cache || (_database_Location_json__WEBPACK_IMPORTED_MODULE_4___namespace_cache = __webpack_require__.t(_database_Location_json__WEBPACK_IMPORTED_MODULE_4__, 2))),
	"News": /*#__PURE__*/ (_database_News_json__WEBPACK_IMPORTED_MODULE_5___namespace_cache || (_database_News_json__WEBPACK_IMPORTED_MODULE_5___namespace_cache = __webpack_require__.t(_database_News_json__WEBPACK_IMPORTED_MODULE_5__, 2))),
	"PrivateRelay": /*#__PURE__*/ (_database_PrivateRelay_json__WEBPACK_IMPORTED_MODULE_6___namespace_cache || (_database_PrivateRelay_json__WEBPACK_IMPORTED_MODULE_6___namespace_cache = __webpack_require__.t(_database_PrivateRelay_json__WEBPACK_IMPORTED_MODULE_6__, 2))),
	"Siri": /*#__PURE__*/ (_database_Siri_json__WEBPACK_IMPORTED_MODULE_7___namespace_cache || (_database_Siri_json__WEBPACK_IMPORTED_MODULE_7___namespace_cache = __webpack_require__.t(_database_Siri_json__WEBPACK_IMPORTED_MODULE_7__, 2))),
	"TestFlight": /*#__PURE__*/ (_database_TestFlight_json__WEBPACK_IMPORTED_MODULE_8___namespace_cache || (_database_TestFlight_json__WEBPACK_IMPORTED_MODULE_8___namespace_cache = __webpack_require__.t(_database_TestFlight_json__WEBPACK_IMPORTED_MODULE_8__, 2))),
	"TV": /*#__PURE__*/ (_database_TV_json__WEBPACK_IMPORTED_MODULE_9___namespace_cache || (_database_TV_json__WEBPACK_IMPORTED_MODULE_9___namespace_cache = __webpack_require__.t(_database_TV_json__WEBPACK_IMPORTED_MODULE_9__, 2))),
};

/***************** Processing *****************/
// 解构URL
const URL = URI.parse($request.url);
$.log(`⚠ ${$.name}`, `URL: ${JSON.stringify(URL)}`, "");
// 获取连接参数
const METHOD = $request.method, HOST = URL.host, PATH = URL.path, PATHs = URL.paths;
$.log(`⚠ ${$.name}`, `METHOD: ${METHOD}`, "");
// 解析格式
const FORMAT = ($response.headers?.["Content-Type"] ?? $response.headers?.["content-type"])?.split(";")?.[0];
$.log(`⚠ ${$.name}`, `FORMAT: ${FORMAT}`, "");
(async () => {
	const { Settings, Caches, Configs } = (0,_function_setENV_mjs__WEBPACK_IMPORTED_MODULE_2__["default"])("iRingo", "TestFlight", DataBase);
	$.log(`⚠ ${$.name}`, `Settings.Switch: ${Settings?.Switch}`, "");
	switch (Settings.Switch) {
		case true:
		default:
			// 创建空数据
			let body = {};
			// 格式判断
			switch (FORMAT) {
				case undefined: // 视为无body
					break;
				case "application/x-www-form-urlencoded":
				case "text/plain":
				case "text/html":
				default:
					break;
				case "application/x-mpegURL":
				case "application/x-mpegurl":
				case "application/vnd.apple.mpegurl":
				case "audio/mpegurl":
					//body = M3U8.parse($response.body);
					//$.log(`🚧 ${$.name}`, `body: ${JSON.stringify(body)}`, "");
					//$response.body = M3U8.stringify(body);
					break;
				case "text/xml":
				case "text/plist":
				case "application/xml":
				case "application/plist":
				case "application/x-plist":
					//body = XML.parse($response.body);
					//$.log(`🚧 ${$.name}`, `body: ${JSON.stringify(body)}`, "");
					//$response.body = XML.stringify(body);
					break;
				case "text/vtt":
				case "application/vtt":
					//body = VTT.parse($response.body);
					//$.log(`🚧 ${$.name}`, `body: ${JSON.stringify(body)}`, "");
					//$response.body = VTT.stringify(body);
					break;
				case "text/json":
				case "application/json":
					body = JSON.parse($response.body ?? "{}");
					$.log(`🚧 ${$.name}`, `body: ${JSON.stringify(body)}`, "");
					// 主机判断
					switch (HOST) {
						case "testflight.apple.com":
							// 路径判断
							switch (PATH) {
								case "v1/session/authenticate":
									switch (Settings.MultiAccount) { // MultiAccount
										case true:
											$.log(`⚠ ${$.name}, 启用多账号支持`, "");
											const XRequestId = $request?.headers?.["X-Request-Id"] ?? $request?.headers?.["x-request-id"];
											const XSessionId = $request?.headers?.["X-Session-Id"] ?? $request?.headers?.["x-session-id"];
											const XSessionDigest = $request?.headers?.["X-Session-Digest"] ?? $request?.headers?.["x-session-digest"];
											if (Caches?.data) { //有data
												$.log(`⚠ ${$.name}, 有Caches.data`, "");
												if (body?.data?.accountId === Caches?.data?.accountId) { // Account ID相等，刷新缓存
													$.log(`⚠ ${$.name}, Account ID相等，刷新缓存`, "");
													Caches.headers = {
														"X-Request-Id": XRequestId,
														"X-Session-Id": XSessionId,
														"X-Session-Digest": XSessionDigest
													};
													Caches.data = body.data;
													Caches.data.termsAndConditions = null;
													Caches.data.hasNewTermsAndConditions = false;
													$.setjson(Caches, "@iRingo.TestFlight.Caches");
												}
												/*
												else { // Account ID不相等，覆盖
													$.log(`⚠ ${$.name}, Account ID不相等，覆盖data(accountId和sessionId)`, "");
													body.data = Caches.data;
												}
												*/
											} else { // Caches空
												$.log(`⚠ ${$.name}, Caches空，写入`, "");
												Caches.headers = {
													"X-Request-Id": XRequestId,
													"X-Session-Id": XSessionId,
													"X-Session-Digest": XSessionDigest
												};
												Caches.data = body.data;
												Caches.data.termsAndConditions = null;
												Caches.data.hasNewTermsAndConditions = false;
												$.setjson(Caches, "@iRingo.TestFlight.Caches");
											};
											break;
										case false:
										default:
											break;
									};
									break;
								case "v1/devices":
								case "v1/devices/apns":
								case "v1/devices/add":
								case "v1/devices/remove":
									break;
								default:
									switch (PATHs[0]) {
										case "v1":
										case "v2":
										case "v3":
											switch (PATHs[1]) {
												case "accounts":
													switch (PATHs[2]) {
														case "settings":
															switch (PATHs[3]) {
																case undefined:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/settings`, "");
																	break;
																case "notifications":
																	switch (PATHs[4]) {
																		case "apps":
																			$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/settings/notifications/apps/`, "");
																			break;
																	};
																	break;
																default:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/settings/${PATHs[3]}/`, "");
																	break;
															};
															break;
														case Caches?.data?.accountId: // UUID
														default:
															switch (PATHs[3]) {
																case undefined:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}`, "");
																	break;
																case "apps":
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/`, "");
																	switch (PATHs[4]) {
																		case undefined:
																			$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps`, "");
																			switch (Settings.Universal) { // 通用
																				case true:
																					$.log(`🚧 ${$.name}, 启用通用应用支持`, "");
																					if (body.error === null) { // 数据无错误
																						$.log(`🚧 ${$.name}, 数据无错误`, "");
																						body.data = body.data.map(app => {
																							if (app.previouslyTested !== false) { // 不是前测试人员
																								$.log(`🚧 ${$.name}, 不是前测试人员`, "");
																								app.platforms = app.platforms.map(platform => {
																									platform.build = modBuild(platform.build);
																									return platform
																								});
																							}
																							return app
																						});
																					};
																					break;
																				case false:
																				default:
																					break;
																			};
																			break;
																		default:
																			switch (PATHs[5]) {
																				case undefined:
																					$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}`, "");
																					break;
																				case "builds":
																					switch (PATHs[7]) {
																						case undefined:
																							$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/builds/${PATHs[6]}`, "");
																							switch (Settings.Universal) { // 通用
																								case true:
																									$.log(`🚧 ${$.name}, 启用通用应用支持`, "");
																									if (body.error === null) { // 数据无错误
																										$.log(`🚧 ${$.name}, 数据无错误`, "");
																										// 当前Bulid
																										body.data.currentBuild = modBuild(body.data.currentBuild);
																										// Build列表
																										body.data.builds = body.data.builds.map(build => modBuild(build));
																									};
																									break;
																								case false:
																								default:
																									break;
																							};
																							break;
																						case "install":
																							$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/builds/${PATHs[6]}/install`, "");
																							break;
																						default:
																							$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/builds/${PATHs[6]}/${PATHs[7]}`, "");
																							break;
																					};
																					break;
																				case "platforms":
																					switch (PATHs[6]) {
																						case "ios":
																						case "osx":
																						case "appletvos":
																						default:
																							switch (PATHs[7]) {
																								case undefined:
																									$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/platforms/${PATHs[6]}`, "");
																									break;
																								case "trains":
																									switch (PATHs[9]) {
																										case undefined:
																											$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/platforms/${PATHs[6]}/trains/${PATHs[8]}`, "");
																											break;
																										case "builds":
																											switch (PATHs[10]) {
																												case undefined:
																													$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/platforms/${PATHs[6]}/trains/${PATHs[8]}/builds`, "");
																													switch (Settings.Universal) { // 通用
																														case true:
																															$.log(`🚧 ${$.name}, 启用通用应用支持`, "");
																															if (body.error === null) { // 数据无错误
																																$.log(`🚧 ${$.name}, 数据无错误`, "");
																																// 当前Bulid
																																body.data = body.data.map(data => modBuild(data));
																															};
																															break;
																														case false:
																														default:
																															break;
																													};
																													break;
																												default:
																													$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/platforms/${PATHs[6]}/trains/${PATHs[8]}/builds/${PATHs[10]}`, "");
																													break;
																											};
																											break;
																										default:
																											$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/platforms/${PATHs[6]}/trains/${PATHs[8]}/${PATHs[9]}`, "");
																											break;
																									};
																									break;
																								default:
																									$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/platforms/${PATHs[6]}/${PATHs[7]}`, "");
																									break;
																							};
																							break;
																					};
																					break;
																				default:
																					$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/apps/${PATHs[4]}/${PATHs[5]}`, "");
																					break;
																			};
																			break;
																	};
																	break;
																default:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/accounts/${PATHs[2]}/${PATHs[3]}/`, "");
																	break;
															};
															break;
													};
													break;
												case "apps":
													switch (PATHs[3]) {
														case "install":
															switch (PATHs[4]) {
																case undefined:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/apps/install`, "");
																	break;
																case "status":
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/apps/install/status`, "");
																	break;
																default:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/apps/install/${PATHs[4]}`, "");
																	break;
															};
															break;
													};
													break;
												case "messages":
													switch (PATHs[2]) {
														case Caches?.data?.accountId: // UUID
														default:
															$.log(`🚧 ${$.name}, ${PATHs[0]}/messages/${PATHs[2]}`, "");
															switch (PATHs[3]) {
																case undefined:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/messages/${PATHs[2]}`, "");
																	break;
																case "read":
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/messages/${PATHs[2]}/read`, "");
																	break;
																default:
																	$.log(`🚧 ${$.name}, ${PATHs[0]}/messages/${PATHs[2]}/${PATHs[3]}`, "");
																	break;
															};
															break;
													};
													break;
											};
											break;
									};
									break;
							};
							break;
					};
					$response.body = JSON.stringify(body);
					break;
				case "application/protobuf":
				case "application/x-protobuf":
				case "application/vnd.google.protobuf":
				case "application/grpc":
				case "application/grpc+proto":
				case "applecation/octet-stream":
					break;
			};
			break;
		case false:
			break;
	};
})()
	.catch((e) => $.logErr(e))
	.finally(() => {
		switch ($response) {
			default: { // 有回复数据，返回回复数据
				//const FORMAT = ($response?.headers?.["Content-Type"] ?? $response?.headers?.["content-type"])?.split(";")?.[0];
				$.log(`🎉 ${$.name}, finally`, `$response`, `FORMAT: ${FORMAT}`, "");
				//$.log(`🚧 ${$.name}, finally`, `$response: ${JSON.stringify($response)}`, "");
				if ($response?.headers?.["Content-Encoding"]) $response.headers["Content-Encoding"] = "identity";
				if ($response?.headers?.["content-encoding"]) $response.headers["content-encoding"] = "identity";
				if ($.isQuanX()) {
					switch (FORMAT) {
						case undefined: // 视为无body
							// 返回普通数据
							$.done({ status: $response.status, headers: $response.headers });
							break;
						default:
							// 返回普通数据
							$.done({ status: $response.status, headers: $response.headers, body: $response.body });
							break;
						case "application/protobuf":
						case "application/x-protobuf":
						case "application/vnd.google.protobuf":
						case "application/grpc":
						case "application/grpc+proto":
						case "applecation/octet-stream":
							// 返回二进制数据
							//$.log(`${$response.bodyBytes.byteLength}---${$response.bodyBytes.buffer.byteLength}`);
							$.done({ status: $response.status, headers: $response.headers, bodyBytes: $response.bodyBytes.buffer.slice($response.bodyBytes.byteOffset, $response.bodyBytes.byteLength + $response.bodyBytes.byteOffset) });
							break;
					};
				} else $.done($response);
				break;
			};
			case undefined: { // 无回复数据
				break;
			};
		};
	})

/***************** Function *****************/
/**
 * mod Build
 * @author VirgilClyne
 * @param {Object} build - Build
 * @return {Object}
 */
function modBuild(build) {
	switch (build.platform || build.name) {
		case "ios":
			$.log(`🚧 ${$.name}, ios`, "");
			build = Build(build);
			break;
		case "osx":
			$.log(`🚧 ${$.name}, osx`, "");
			if (build?.macBuildCompatibility?.runsOnAppleSilicon === true) { // 是苹果芯片
				$.log(`🚧 ${$.name}, runsOnAppleSilicon`, "");
				build = Build(build);
			};
			break;
		case "appletvos":
			$.log(`🚧 ${$.name}, appletvos`, "");
			break;
		default:
			$.log(`🚧 ${$.name}, unknown platform: ${build.platform || build.name}`, "");
			break;
	};
	return build

	function Build(build) {
		//if (build.universal === true) {
			build.compatible = true;
			build.platformCompatible = true;
			build.hardwareCompatible = true;
			build.osCompatible = true;
			if (build?.permission) build.permission = "install";
			if (build?.deviceFamilyInfo) {
				build.deviceFamilyInfo = [
					{
						"number": 1,
						"name": "iOS",
						"iconUrl": "https://itunesconnect-mr.itunes.apple.com/itc/img/device-icons/device_family_icon_1.png"
					},
					{
						"number": 2,
						"name": "iPad",
						"iconUrl": "https://itunesconnect-mr.itunes.apple.com/itc/img/device-icons/device_family_icon_2.png"
					},
					{
						"number": 3,
						"name": "Apple TV",
						"iconUrl": "https://itunesconnect-mr.itunes.apple.com/itc/img/device-icons/device_family_icon_3.png"
					}
				];
			};
			if (build?.compatibilityData?.compatibleDeviceFamilies) {
				build.compatibilityData.compatibleDeviceFamilies = [
					{
						"name": "iPad",
						"minimumSupportedDevice": null,
						"unsupportedDevices": []
					},
					{
						"name": "iPhone",
						"minimumSupportedDevice": null,
						"unsupportedDevices": []
					},
					{
						"name": "iPod",
						"minimumSupportedDevice": null,
						"unsupportedDevices": []
					},
					{
						"name": "Mac",
						"minimumSupportedDevice": null,
						"unsupportedDevices": []
					}
				];
			};
			if (build.macBuildCompatibility) {
				build.macBuildCompatibility.runsOnIntel = true;
				build.macBuildCompatibility.runsOnAppleSilicon = true;
				/*
				build.macBuildCompatibility = {
					"macArchitectures": ["AppleSilicon", "Intel"],
					"rosettaCompatible": true,
					"runsOnIntel": true,
					"runsOnAppleSilicon": true,
					"requiresRosetta": false
				};
				*/
			};
		//};
		return build
	};
};

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVzdEZsaWdodC5yZXNwb25zZS5iZXRhLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFlO0FBQ2Y7QUFDQSxpQkFBaUIsS0FBSztBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixVQUFVO0FBQy9COztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGNBQWMsS0FBSztBQUNuQixHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLEtBQUs7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsZUFBZSwrQkFBK0I7QUFDOUM7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUk7QUFDSjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRUFBcUU7QUFDckU7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0I7QUFDcEIsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsa0NBQWtDO0FBQ2xDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBLFNBQVMsOENBQThDO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7O0FBRUE7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QUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaXJpbmdvLy4vc3JjL0VOVi9FTlYubWpzIiwid2VicGFjazovL2lyaW5nby8uL3NyYy9VUkkvVVJJLm1qcyIsIndlYnBhY2s6Ly9pcmluZ28vLi9zcmMvZnVuY3Rpb24vc2V0RU5WLm1qcyIsIndlYnBhY2s6Ly9pcmluZ28vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaXJpbmdvL3dlYnBhY2svcnVudGltZS9jcmVhdGUgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2lyaW5nby93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vaXJpbmdvL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vaXJpbmdvL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vaXJpbmdvLy4vc3JjL1Rlc3RGbGlnaHQucmVzcG9uc2UuYmV0YS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBjbGFzcyBFTlYge1xuXHRjb25zdHJ1Y3RvcihuYW1lLCBvcHRzKSB7XG5cdFx0dGhpcy5uYW1lID0gYCR7bmFtZX0sIEVOViB2MS4wLjBgXG5cdFx0dGhpcy5odHRwID0gbmV3IEh0dHAodGhpcylcblx0XHR0aGlzLmRhdGEgPSBudWxsXG5cdFx0dGhpcy5kYXRhRmlsZSA9ICdib3guZGF0J1xuXHRcdHRoaXMubG9ncyA9IFtdXG5cdFx0dGhpcy5pc011dGUgPSBmYWxzZVxuXHRcdHRoaXMuaXNOZWVkUmV3cml0ZSA9IGZhbHNlXG5cdFx0dGhpcy5sb2dTZXBhcmF0b3IgPSAnXFxuJ1xuXHRcdHRoaXMuZW5jb2RpbmcgPSAndXRmLTgnXG5cdFx0dGhpcy5zdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXHRcdE9iamVjdC5hc3NpZ24odGhpcywgb3B0cylcblx0XHR0aGlzLmxvZygnJywgYPCfj4EgJHt0aGlzLm5hbWV9LCDlvIDlp4shYClcblx0fVxuXG5cdFBsYXRmb3JtKCkge1xuXHRcdGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mICRlbnZpcm9ubWVudCAmJiAkZW52aXJvbm1lbnRbJ3N1cmdlLXZlcnNpb24nXSlcblx0XHRcdHJldHVybiAnU3VyZ2UnXG5cdFx0aWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgJGVudmlyb25tZW50ICYmICRlbnZpcm9ubWVudFsnc3Rhc2gtdmVyc2lvbiddKVxuXHRcdFx0cmV0dXJuICdTdGFzaCdcblx0XHRpZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiAkdGFzaykgcmV0dXJuICdRdWFudHVtdWx0IFgnXG5cdFx0aWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgJGxvb24pIHJldHVybiAnTG9vbidcblx0XHRpZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiAkcm9ja2V0KSByZXR1cm4gJ1NoYWRvd3JvY2tldCdcblx0fVxuXG5cdGlzUXVhblgoKSB7XG5cdFx0cmV0dXJuICdRdWFudHVtdWx0IFgnID09PSB0aGlzLlBsYXRmb3JtKClcblx0fVxuXG5cdGlzU3VyZ2UoKSB7XG5cdFx0cmV0dXJuICdTdXJnZScgPT09IHRoaXMuUGxhdGZvcm0oKVxuXHR9XG5cblx0aXNMb29uKCkge1xuXHRcdHJldHVybiAnTG9vbicgPT09IHRoaXMuUGxhdGZvcm0oKVxuXHR9XG5cblx0aXNTaGFkb3dyb2NrZXQoKSB7XG5cdFx0cmV0dXJuICdTaGFkb3dyb2NrZXQnID09PSB0aGlzLlBsYXRmb3JtKClcblx0fVxuXG5cdGlzU3Rhc2goKSB7XG5cdFx0cmV0dXJuICdTdGFzaCcgPT09IHRoaXMuUGxhdGZvcm0oKVxuXHR9XG5cblx0dG9PYmooc3RyLCBkZWZhdWx0VmFsdWUgPSBudWxsKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiBKU09OLnBhcnNlKHN0cilcblx0XHR9IGNhdGNoIHtcblx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWVcblx0XHR9XG5cdH1cblxuXHR0b1N0cihvYmosIGRlZmF1bHRWYWx1ZSA9IG51bGwpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iailcblx0XHR9IGNhdGNoIHtcblx0XHRcdHJldHVybiBkZWZhdWx0VmFsdWVcblx0XHR9XG5cdH1cblxuXHRnZXRqc29uKGtleSwgZGVmYXVsdFZhbHVlKSB7XG5cdFx0bGV0IGpzb24gPSBkZWZhdWx0VmFsdWVcblx0XHRjb25zdCB2YWwgPSB0aGlzLmdldGRhdGEoa2V5KVxuXHRcdGlmICh2YWwpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGpzb24gPSBKU09OLnBhcnNlKHRoaXMuZ2V0ZGF0YShrZXkpKVxuXHRcdFx0fSBjYXRjaCB7IH1cblx0XHR9XG5cdFx0cmV0dXJuIGpzb25cblx0fVxuXG5cdHNldGpzb24odmFsLCBrZXkpIHtcblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2V0ZGF0YShKU09OLnN0cmluZ2lmeSh2YWwpLCBrZXkpXG5cdFx0fSBjYXRjaCB7XG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHR9XG5cdH1cblxuXHRnZXRTY3JpcHQodXJsKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHR0aGlzLmdldCh7IHVybCB9LCAoZXJyb3IsIHJlc3BvbnNlLCBib2R5KSA9PiByZXNvbHZlKGJvZHkpKVxuXHRcdH0pXG5cdH1cblxuXHRydW5TY3JpcHQoc2NyaXB0LCBydW5PcHRzKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRsZXQgaHR0cGFwaSA9IHRoaXMuZ2V0ZGF0YSgnQGNoYXZ5X2JveGpzX3VzZXJDZmdzLmh0dHBhcGknKVxuXHRcdFx0aHR0cGFwaSA9IGh0dHBhcGkgPyBodHRwYXBpLnJlcGxhY2UoL1xcbi9nLCAnJykudHJpbSgpIDogaHR0cGFwaVxuXHRcdFx0bGV0IGh0dHBhcGlfdGltZW91dCA9IHRoaXMuZ2V0ZGF0YShcblx0XHRcdFx0J0BjaGF2eV9ib3hqc191c2VyQ2Zncy5odHRwYXBpX3RpbWVvdXQnXG5cdFx0XHQpXG5cdFx0XHRodHRwYXBpX3RpbWVvdXQgPSBodHRwYXBpX3RpbWVvdXQgPyBodHRwYXBpX3RpbWVvdXQgKiAxIDogMjBcblx0XHRcdGh0dHBhcGlfdGltZW91dCA9XG5cdFx0XHRcdHJ1bk9wdHMgJiYgcnVuT3B0cy50aW1lb3V0ID8gcnVuT3B0cy50aW1lb3V0IDogaHR0cGFwaV90aW1lb3V0XG5cdFx0XHRjb25zdCBba2V5LCBhZGRyXSA9IGh0dHBhcGkuc3BsaXQoJ0AnKVxuXHRcdFx0Y29uc3Qgb3B0cyA9IHtcblx0XHRcdFx0dXJsOiBgaHR0cDovLyR7YWRkcn0vdjEvc2NyaXB0aW5nL2V2YWx1YXRlYCxcblx0XHRcdFx0Ym9keToge1xuXHRcdFx0XHRcdHNjcmlwdF90ZXh0OiBzY3JpcHQsXG5cdFx0XHRcdFx0bW9ja190eXBlOiAnY3JvbicsXG5cdFx0XHRcdFx0dGltZW91dDogaHR0cGFwaV90aW1lb3V0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ1gtS2V5Jzoga2V5LCAnQWNjZXB0JzogJyovKicgfSxcblx0XHRcdFx0dGltZW91dDogaHR0cGFwaV90aW1lb3V0XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnBvc3Qob3B0cywgKGVycm9yLCByZXNwb25zZSwgYm9keSkgPT4gcmVzb2x2ZShib2R5KSlcblx0XHR9KS5jYXRjaCgoZSkgPT4gdGhpcy5sb2dFcnIoZSkpXG5cdH1cblxuXHRsb2FkZGF0YSgpIHtcblx0XHRpZiAodGhpcy5pc05vZGUoKSkge1xuXHRcdFx0dGhpcy5mcyA9IHRoaXMuZnMgPyB0aGlzLmZzIDogcmVxdWlyZSgnZnMnKVxuXHRcdFx0dGhpcy5wYXRoID0gdGhpcy5wYXRoID8gdGhpcy5wYXRoIDogcmVxdWlyZSgncGF0aCcpXG5cdFx0XHRjb25zdCBjdXJEaXJEYXRhRmlsZVBhdGggPSB0aGlzLnBhdGgucmVzb2x2ZSh0aGlzLmRhdGFGaWxlKVxuXHRcdFx0Y29uc3Qgcm9vdERpckRhdGFGaWxlUGF0aCA9IHRoaXMucGF0aC5yZXNvbHZlKFxuXHRcdFx0XHRwcm9jZXNzLmN3ZCgpLFxuXHRcdFx0XHR0aGlzLmRhdGFGaWxlXG5cdFx0XHQpXG5cdFx0XHRjb25zdCBpc0N1ckRpckRhdGFGaWxlID0gdGhpcy5mcy5leGlzdHNTeW5jKGN1ckRpckRhdGFGaWxlUGF0aClcblx0XHRcdGNvbnN0IGlzUm9vdERpckRhdGFGaWxlID1cblx0XHRcdFx0IWlzQ3VyRGlyRGF0YUZpbGUgJiYgdGhpcy5mcy5leGlzdHNTeW5jKHJvb3REaXJEYXRhRmlsZVBhdGgpXG5cdFx0XHRpZiAoaXNDdXJEaXJEYXRhRmlsZSB8fCBpc1Jvb3REaXJEYXRhRmlsZSkge1xuXHRcdFx0XHRjb25zdCBkYXRQYXRoID0gaXNDdXJEaXJEYXRhRmlsZVxuXHRcdFx0XHRcdD8gY3VyRGlyRGF0YUZpbGVQYXRoXG5cdFx0XHRcdFx0OiByb290RGlyRGF0YUZpbGVQYXRoXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0cmV0dXJuIEpTT04ucGFyc2UodGhpcy5mcy5yZWFkRmlsZVN5bmMoZGF0UGF0aCkpXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRyZXR1cm4ge31cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHJldHVybiB7fVxuXHRcdH0gZWxzZSByZXR1cm4ge31cblx0fVxuXG5cdHdyaXRlZGF0YSgpIHtcblx0XHRpZiAodGhpcy5pc05vZGUoKSkge1xuXHRcdFx0dGhpcy5mcyA9IHRoaXMuZnMgPyB0aGlzLmZzIDogcmVxdWlyZSgnZnMnKVxuXHRcdFx0dGhpcy5wYXRoID0gdGhpcy5wYXRoID8gdGhpcy5wYXRoIDogcmVxdWlyZSgncGF0aCcpXG5cdFx0XHRjb25zdCBjdXJEaXJEYXRhRmlsZVBhdGggPSB0aGlzLnBhdGgucmVzb2x2ZSh0aGlzLmRhdGFGaWxlKVxuXHRcdFx0Y29uc3Qgcm9vdERpckRhdGFGaWxlUGF0aCA9IHRoaXMucGF0aC5yZXNvbHZlKFxuXHRcdFx0XHRwcm9jZXNzLmN3ZCgpLFxuXHRcdFx0XHR0aGlzLmRhdGFGaWxlXG5cdFx0XHQpXG5cdFx0XHRjb25zdCBpc0N1ckRpckRhdGFGaWxlID0gdGhpcy5mcy5leGlzdHNTeW5jKGN1ckRpckRhdGFGaWxlUGF0aClcblx0XHRcdGNvbnN0IGlzUm9vdERpckRhdGFGaWxlID1cblx0XHRcdFx0IWlzQ3VyRGlyRGF0YUZpbGUgJiYgdGhpcy5mcy5leGlzdHNTeW5jKHJvb3REaXJEYXRhRmlsZVBhdGgpXG5cdFx0XHRjb25zdCBqc29uZGF0YSA9IEpTT04uc3RyaW5naWZ5KHRoaXMuZGF0YSlcblx0XHRcdGlmIChpc0N1ckRpckRhdGFGaWxlKSB7XG5cdFx0XHRcdHRoaXMuZnMud3JpdGVGaWxlU3luYyhjdXJEaXJEYXRhRmlsZVBhdGgsIGpzb25kYXRhKVxuXHRcdFx0fSBlbHNlIGlmIChpc1Jvb3REaXJEYXRhRmlsZSkge1xuXHRcdFx0XHR0aGlzLmZzLndyaXRlRmlsZVN5bmMocm9vdERpckRhdGFGaWxlUGF0aCwganNvbmRhdGEpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmZzLndyaXRlRmlsZVN5bmMoY3VyRGlyRGF0YUZpbGVQYXRoLCBqc29uZGF0YSlcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRsb2Rhc2hfZ2V0KHNvdXJjZSwgcGF0aCwgZGVmYXVsdFZhbHVlID0gdW5kZWZpbmVkKSB7XG5cdFx0Y29uc3QgcGF0aHMgPSBwYXRoLnJlcGxhY2UoL1xcWyhcXGQrKVxcXS9nLCAnLiQxJykuc3BsaXQoJy4nKVxuXHRcdGxldCByZXN1bHQgPSBzb3VyY2Vcblx0XHRmb3IgKGNvbnN0IHAgb2YgcGF0aHMpIHtcblx0XHRcdHJlc3VsdCA9IE9iamVjdChyZXN1bHQpW3BdXG5cdFx0XHRpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuIGRlZmF1bHRWYWx1ZVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0XG5cdH1cblxuXHRsb2Rhc2hfc2V0KG9iaiwgcGF0aCwgdmFsdWUpIHtcblx0XHRpZiAoT2JqZWN0KG9iaikgIT09IG9iaikgcmV0dXJuIG9ialxuXHRcdGlmICghQXJyYXkuaXNBcnJheShwYXRoKSkgcGF0aCA9IHBhdGgudG9TdHJpbmcoKS5tYXRjaCgvW14uW1xcXV0rL2cpIHx8IFtdXG5cdFx0cGF0aFxuXHRcdFx0LnNsaWNlKDAsIC0xKVxuXHRcdFx0LnJlZHVjZShcblx0XHRcdFx0KGEsIGMsIGkpID0+XG5cdFx0XHRcdFx0T2JqZWN0KGFbY10pID09PSBhW2NdXG5cdFx0XHRcdFx0XHQ/IGFbY11cblx0XHRcdFx0XHRcdDogKGFbY10gPSBNYXRoLmFicyhwYXRoW2kgKyAxXSkgPj4gMCA9PT0gK3BhdGhbaSArIDFdID8gW10gOiB7fSksXG5cdFx0XHRcdG9ialxuXHRcdFx0KVtwYXRoW3BhdGgubGVuZ3RoIC0gMV1dID0gdmFsdWVcblx0XHRyZXR1cm4gb2JqXG5cdH1cblxuXHRnZXRkYXRhKGtleSkge1xuXHRcdGxldCB2YWwgPSB0aGlzLmdldHZhbChrZXkpXG5cdFx0Ly8g5aaC5p6c5LulIEBcblx0XHRpZiAoL15ALy50ZXN0KGtleSkpIHtcblx0XHRcdGNvbnN0IFssIG9iamtleSwgcGF0aHNdID0gL15AKC4qPylcXC4oLio/KSQvLmV4ZWMoa2V5KVxuXHRcdFx0Y29uc3Qgb2JqdmFsID0gb2Jqa2V5ID8gdGhpcy5nZXR2YWwob2Jqa2V5KSA6ICcnXG5cdFx0XHRpZiAob2JqdmFsKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3Qgb2JqZWR2YWwgPSBKU09OLnBhcnNlKG9ianZhbClcblx0XHRcdFx0XHR2YWwgPSBvYmplZHZhbCA/IHRoaXMubG9kYXNoX2dldChvYmplZHZhbCwgcGF0aHMsICcnKSA6IHZhbFxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0dmFsID0gJydcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdmFsXG5cdH1cblxuXHRzZXRkYXRhKHZhbCwga2V5KSB7XG5cdFx0bGV0IGlzc3VjID0gZmFsc2Vcblx0XHRpZiAoL15ALy50ZXN0KGtleSkpIHtcblx0XHRcdGNvbnN0IFssIG9iamtleSwgcGF0aHNdID0gL15AKC4qPylcXC4oLio/KSQvLmV4ZWMoa2V5KVxuXHRcdFx0Y29uc3Qgb2JqZGF0ID0gdGhpcy5nZXR2YWwob2Jqa2V5KVxuXHRcdFx0Y29uc3Qgb2JqdmFsID0gb2Jqa2V5XG5cdFx0XHRcdD8gb2JqZGF0ID09PSAnbnVsbCdcblx0XHRcdFx0XHQ/IG51bGxcblx0XHRcdFx0XHQ6IG9iamRhdCB8fCAne30nXG5cdFx0XHRcdDogJ3t9J1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3Qgb2JqZWR2YWwgPSBKU09OLnBhcnNlKG9ianZhbClcblx0XHRcdFx0dGhpcy5sb2Rhc2hfc2V0KG9iamVkdmFsLCBwYXRocywgdmFsKVxuXHRcdFx0XHRpc3N1YyA9IHRoaXMuc2V0dmFsKEpTT04uc3RyaW5naWZ5KG9iamVkdmFsKSwgb2Jqa2V5KVxuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRjb25zdCBvYmplZHZhbCA9IHt9XG5cdFx0XHRcdHRoaXMubG9kYXNoX3NldChvYmplZHZhbCwgcGF0aHMsIHZhbClcblx0XHRcdFx0aXNzdWMgPSB0aGlzLnNldHZhbChKU09OLnN0cmluZ2lmeShvYmplZHZhbCksIG9iamtleSlcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aXNzdWMgPSB0aGlzLnNldHZhbCh2YWwsIGtleSlcblx0XHR9XG5cdFx0cmV0dXJuIGlzc3VjXG5cdH1cblxuXHRnZXR2YWwoa2V5KSB7XG5cdFx0c3dpdGNoICh0aGlzLlBsYXRmb3JtKCkpIHtcblx0XHRcdGNhc2UgJ1N1cmdlJzpcblx0XHRcdGNhc2UgJ0xvb24nOlxuXHRcdFx0Y2FzZSAnU3Rhc2gnOlxuXHRcdFx0Y2FzZSAnU2hhZG93cm9ja2V0Jzpcblx0XHRcdFx0cmV0dXJuICRwZXJzaXN0ZW50U3RvcmUucmVhZChrZXkpXG5cdFx0XHRjYXNlICdRdWFudHVtdWx0IFgnOlxuXHRcdFx0XHRyZXR1cm4gJHByZWZzLnZhbHVlRm9yS2V5KGtleSlcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiAodGhpcy5kYXRhICYmIHRoaXMuZGF0YVtrZXldKSB8fCBudWxsXG5cdFx0fVxuXHR9XG5cblx0c2V0dmFsKHZhbCwga2V5KSB7XG5cdFx0c3dpdGNoICh0aGlzLlBsYXRmb3JtKCkpIHtcblx0XHRcdGNhc2UgJ1N1cmdlJzpcblx0XHRcdGNhc2UgJ0xvb24nOlxuXHRcdFx0Y2FzZSAnU3Rhc2gnOlxuXHRcdFx0Y2FzZSAnU2hhZG93cm9ja2V0Jzpcblx0XHRcdFx0cmV0dXJuICRwZXJzaXN0ZW50U3RvcmUud3JpdGUodmFsLCBrZXkpXG5cdFx0XHRjYXNlICdRdWFudHVtdWx0IFgnOlxuXHRcdFx0XHRyZXR1cm4gJHByZWZzLnNldFZhbHVlRm9yS2V5KHZhbCwga2V5KVxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0cmV0dXJuICh0aGlzLmRhdGEgJiYgdGhpcy5kYXRhW2tleV0pIHx8IG51bGxcblx0XHR9XG5cdH1cblxuXHRpbml0R290RW52KG9wdHMpIHtcblx0XHR0aGlzLmdvdCA9IHRoaXMuZ290ID8gdGhpcy5nb3QgOiByZXF1aXJlKCdnb3QnKVxuXHRcdHRoaXMuY2t0b3VnaCA9IHRoaXMuY2t0b3VnaCA/IHRoaXMuY2t0b3VnaCA6IHJlcXVpcmUoJ3RvdWdoLWNvb2tpZScpXG5cdFx0dGhpcy5ja2phciA9IHRoaXMuY2tqYXIgPyB0aGlzLmNramFyIDogbmV3IHRoaXMuY2t0b3VnaC5Db29raWVKYXIoKVxuXHRcdGlmIChvcHRzKSB7XG5cdFx0XHRvcHRzLmhlYWRlcnMgPSBvcHRzLmhlYWRlcnMgPyBvcHRzLmhlYWRlcnMgOiB7fVxuXHRcdFx0aWYgKHVuZGVmaW5lZCA9PT0gb3B0cy5oZWFkZXJzLkNvb2tpZSAmJiB1bmRlZmluZWQgPT09IG9wdHMuY29va2llSmFyKSB7XG5cdFx0XHRcdG9wdHMuY29va2llSmFyID0gdGhpcy5ja2phclxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGdldChyZXF1ZXN0LCBjYWxsYmFjayA9ICgpID0+IHsgfSkge1xuXHRcdGRlbGV0ZSByZXF1ZXN0LmhlYWRlcnM/LlsnQ29udGVudC1MZW5ndGgnXVxuXHRcdGRlbGV0ZSByZXF1ZXN0LmhlYWRlcnM/LlsnY29udGVudC1sZW5ndGgnXVxuXG5cdFx0c3dpdGNoICh0aGlzLlBsYXRmb3JtKCkpIHtcblx0XHRcdGNhc2UgJ1N1cmdlJzpcblx0XHRcdGNhc2UgJ0xvb24nOlxuXHRcdFx0Y2FzZSAnU3Rhc2gnOlxuXHRcdFx0Y2FzZSAnU2hhZG93cm9ja2V0Jzpcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGlmICh0aGlzLmlzU3VyZ2UoKSAmJiB0aGlzLmlzTmVlZFJld3JpdGUpIHtcblx0XHRcdFx0XHR0aGlzLmxvZGFzaF9zZXQocmVxdWVzdCwgJ2hlYWRlcnMuWC1TdXJnZS1Ta2lwLVNjcmlwdGluZycsIGZhbHNlKVxuXHRcdFx0XHR9XG5cdFx0XHRcdCRodHRwQ2xpZW50LmdldChyZXF1ZXN0LCAoZXJyb3IsIHJlc3BvbnNlLCBib2R5KSA9PiB7XG5cdFx0XHRcdFx0aWYgKCFlcnJvciAmJiByZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzcG9uc2UuYm9keSA9IGJvZHlcblx0XHRcdFx0XHRcdHJlc3BvbnNlLnN0YXR1c0NvZGUgPSByZXNwb25zZS5zdGF0dXMgPyByZXNwb25zZS5zdGF0dXMgOiByZXNwb25zZS5zdGF0dXNDb2RlXG5cdFx0XHRcdFx0XHRyZXNwb25zZS5zdGF0dXMgPSByZXNwb25zZS5zdGF0dXNDb2RlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNhbGxiYWNrKGVycm9yLCByZXNwb25zZSwgYm9keSlcblx0XHRcdFx0fSlcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgJ1F1YW50dW11bHQgWCc6XG5cdFx0XHRcdGlmICh0aGlzLmlzTmVlZFJld3JpdGUpIHtcblx0XHRcdFx0XHR0aGlzLmxvZGFzaF9zZXQocmVxdWVzdCwgJ29wdHMuaGludHMnLCBmYWxzZSlcblx0XHRcdFx0fVxuXHRcdFx0XHQkdGFzay5mZXRjaChyZXF1ZXN0KS50aGVuKFxuXHRcdFx0XHRcdChyZXNwb25zZSkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3Qge1xuXHRcdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiBzdGF0dXMsXG5cdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGUsXG5cdFx0XHRcdFx0XHRcdGhlYWRlcnMsXG5cdFx0XHRcdFx0XHRcdGJvZHksXG5cdFx0XHRcdFx0XHRcdGJvZHlCeXRlc1xuXHRcdFx0XHRcdFx0fSA9IHJlc3BvbnNlXG5cdFx0XHRcdFx0XHRjYWxsYmFjayhcblx0XHRcdFx0XHRcdFx0bnVsbCxcblx0XHRcdFx0XHRcdFx0eyBzdGF0dXMsIHN0YXR1c0NvZGUsIGhlYWRlcnMsIGJvZHksIGJvZHlCeXRlcyB9LFxuXHRcdFx0XHRcdFx0XHRib2R5LFxuXHRcdFx0XHRcdFx0XHRib2R5Qnl0ZXNcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdChlcnJvcikgPT4gY2FsbGJhY2soKGVycm9yICYmIGVycm9yLmVycm9yb3IpIHx8ICdVbmRlZmluZWRFcnJvcicpXG5cdFx0XHRcdClcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cdH1cblxuXHRwb3N0KHJlcXVlc3QsIGNhbGxiYWNrID0gKCkgPT4geyB9KSB7XG5cdFx0Y29uc3QgbWV0aG9kID0gcmVxdWVzdC5tZXRob2Rcblx0XHRcdD8gcmVxdWVzdC5tZXRob2QudG9Mb2NhbGVMb3dlckNhc2UoKVxuXHRcdFx0OiAncG9zdCdcblxuXHRcdC8vIOWmguaenOaMh+WumuS6huivt+axguS9kywg5L2G5rKh5oyH5a6aIGBDb250ZW50LVR5cGVg44CBYGNvbnRlbnQtdHlwZWAsIOWImeiHquWKqOeUn+aIkOOAglxuXHRcdGlmIChcblx0XHRcdHJlcXVlc3QuYm9keSAmJlxuXHRcdFx0cmVxdWVzdC5oZWFkZXJzICYmXG5cdFx0XHQhcmVxdWVzdC5oZWFkZXJzWydDb250ZW50LVR5cGUnXSAmJlxuXHRcdFx0IXJlcXVlc3QuaGVhZGVyc1snY29udGVudC10eXBlJ11cblx0XHQpIHtcblx0XHRcdC8vIEhUVFAvMeOAgUhUVFAvMiDpg73mlK/mjIHlsI/lhpkgaGVhZGVyc1xuXHRcdFx0cmVxdWVzdC5oZWFkZXJzWydjb250ZW50LXR5cGUnXSA9ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG5cdFx0fVxuXHRcdC8vIOS4uumBv+WFjeaMh+WumumUmeivryBgY29udGVudC1sZW5ndGhgIOi/memHjOWIoOmZpOivpeWxnuaAp++8jOeUseW3peWFt+erryAoSHR0cENsaWVudCkg6LSf6LSj6YeN5paw6K6h566X5bm26LWL5YC8XG5cdFx0XHRkZWxldGUgcmVxdWVzdC5oZWFkZXJzPy5bJ0NvbnRlbnQtTGVuZ3RoJ11cblx0XHRcdGRlbGV0ZSByZXF1ZXN0LmhlYWRlcnM/LlsnY29udGVudC1sZW5ndGgnXVxuXHRcdHN3aXRjaCAodGhpcy5QbGF0Zm9ybSgpKSB7XG5cdFx0XHRjYXNlICdTdXJnZSc6XG5cdFx0XHRjYXNlICdMb29uJzpcblx0XHRcdGNhc2UgJ1N0YXNoJzpcblx0XHRcdGNhc2UgJ1NoYWRvd3JvY2tldCc6XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRpZiAodGhpcy5pc1N1cmdlKCkgJiYgdGhpcy5pc05lZWRSZXdyaXRlKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2Rhc2hfc2V0KHJlcXVlc3QsICdoZWFkZXJzLlgtU3VyZ2UtU2tpcC1TY3JpcHRpbmcnLCBmYWxzZSlcblx0XHRcdFx0fVxuXHRcdFx0XHQkaHR0cENsaWVudFttZXRob2RdKHJlcXVlc3QsIChlcnJvciwgcmVzcG9uc2UsIGJvZHkpID0+IHtcblx0XHRcdFx0XHRpZiAoIWVycm9yICYmIHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNwb25zZS5ib2R5ID0gYm9keVxuXHRcdFx0XHRcdFx0cmVzcG9uc2Uuc3RhdHVzQ29kZSA9IHJlc3BvbnNlLnN0YXR1cyA/IHJlc3BvbnNlLnN0YXR1cyA6IHJlc3BvbnNlLnN0YXR1c0NvZGVcblx0XHRcdFx0XHRcdHJlc3BvbnNlLnN0YXR1cyA9IHJlc3BvbnNlLnN0YXR1c0NvZGVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y2FsbGJhY2soZXJyb3IsIHJlc3BvbnNlLCBib2R5KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAnUXVhbnR1bXVsdCBYJzpcblx0XHRcdFx0cmVxdWVzdC5tZXRob2QgPSBtZXRob2Rcblx0XHRcdFx0aWYgKHRoaXMuaXNOZWVkUmV3cml0ZSkge1xuXHRcdFx0XHRcdHRoaXMubG9kYXNoX3NldChyZXF1ZXN0LCAnb3B0cy5oaW50cycsIGZhbHNlKVxuXHRcdFx0XHR9XG5cdFx0XHRcdCR0YXNrLmZldGNoKHJlcXVlc3QpLnRoZW4oXG5cdFx0XHRcdFx0KHJlc3BvbnNlKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCB7XG5cdFx0XHRcdFx0XHRcdHN0YXR1c0NvZGU6IHN0YXR1cyxcblx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZSxcblx0XHRcdFx0XHRcdFx0aGVhZGVycyxcblx0XHRcdFx0XHRcdFx0Ym9keSxcblx0XHRcdFx0XHRcdFx0Ym9keUJ5dGVzXG5cdFx0XHRcdFx0XHR9ID0gcmVzcG9uc2Vcblx0XHRcdFx0XHRcdGNhbGxiYWNrKFxuXHRcdFx0XHRcdFx0XHRudWxsLFxuXHRcdFx0XHRcdFx0XHR7IHN0YXR1cywgc3RhdHVzQ29kZSwgaGVhZGVycywgYm9keSwgYm9keUJ5dGVzIH0sXG5cdFx0XHRcdFx0XHRcdGJvZHksXG5cdFx0XHRcdFx0XHRcdGJvZHlCeXRlc1xuXHRcdFx0XHRcdFx0KVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0KGVycm9yKSA9PiBjYWxsYmFjaygoZXJyb3IgJiYgZXJyb3IuZXJyb3JvcikgfHwgJ1VuZGVmaW5lZEVycm9yJylcblx0XHRcdFx0KVxuXHRcdFx0XHRicmVha1xuXHRcdH1cblx0fVxuXHQvKipcblx0ICpcblx0ICog56S65L6LOiQudGltZSgneXl5eS1NTS1kZCBxcSBISDptbTpzcy5TJylcblx0ICogICAgOiQudGltZSgneXl5eU1NZGRISG1tc3NTJylcblx0ICogICAgeTrlubQgTTrmnIggZDrml6UgcTrlraMgSDrml7YgbTrliIYgczrnp5IgUzrmr6vnp5Jcblx0ICogICAg5YW25LiteeWPr+mAiTAtNOS9jeWNoOS9jeespuOAgVPlj6/pgIkwLTHkvY3ljaDkvY3nrKbvvIzlhbbkvZnlj6/pgIkwLTLkvY3ljaDkvY3nrKZcblx0ICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdCDmoLzlvI/ljJblj4LmlbBcblx0ICogQHBhcmFtIHtudW1iZXJ9IHRzIOWPr+mAiTog5qC55o2u5oyH5a6a5pe26Ze05oiz6L+U5Zue5qC85byP5YyW5pel5pyfXG5cdCAqXG5cdCAqL1xuXHR0aW1lKGZvcm1hdCwgdHMgPSBudWxsKSB7XG5cdFx0Y29uc3QgZGF0ZSA9IHRzID8gbmV3IERhdGUodHMpIDogbmV3IERhdGUoKVxuXHRcdGxldCBvID0ge1xuXHRcdFx0J00rJzogZGF0ZS5nZXRNb250aCgpICsgMSxcblx0XHRcdCdkKyc6IGRhdGUuZ2V0RGF0ZSgpLFxuXHRcdFx0J0grJzogZGF0ZS5nZXRIb3VycygpLFxuXHRcdFx0J20rJzogZGF0ZS5nZXRNaW51dGVzKCksXG5cdFx0XHQncysnOiBkYXRlLmdldFNlY29uZHMoKSxcblx0XHRcdCdxKyc6IE1hdGguZmxvb3IoKGRhdGUuZ2V0TW9udGgoKSArIDMpIC8gMyksXG5cdFx0XHQnUyc6IGRhdGUuZ2V0TWlsbGlzZWNvbmRzKClcblx0XHR9XG5cdFx0aWYgKC8oeSspLy50ZXN0KGZvcm1hdCkpXG5cdFx0XHRmb3JtYXQgPSBmb3JtYXQucmVwbGFjZShcblx0XHRcdFx0UmVnRXhwLiQxLFxuXHRcdFx0XHQoZGF0ZS5nZXRGdWxsWWVhcigpICsgJycpLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aClcblx0XHRcdClcblx0XHRmb3IgKGxldCBrIGluIG8pXG5cdFx0XHRpZiAobmV3IFJlZ0V4cCgnKCcgKyBrICsgJyknKS50ZXN0KGZvcm1hdCkpXG5cdFx0XHRcdGZvcm1hdCA9IGZvcm1hdC5yZXBsYWNlKFxuXHRcdFx0XHRcdFJlZ0V4cC4kMSxcblx0XHRcdFx0XHRSZWdFeHAuJDEubGVuZ3RoID09IDFcblx0XHRcdFx0XHRcdD8gb1trXVxuXHRcdFx0XHRcdFx0OiAoJzAwJyArIG9ba10pLnN1YnN0cigoJycgKyBvW2tdKS5sZW5ndGgpXG5cdFx0XHRcdClcblx0XHRyZXR1cm4gZm9ybWF0XG5cdH1cblxuXHQvKipcblx0ICog57O757uf6YCa55+lXG5cdCAqXG5cdCAqID4g6YCa55+l5Y+C5pWwOiDlkIzml7bmlK/mjIEgUXVhblgg5ZKMIExvb24g5Lik56eN5qC85byPLCBFbnZKc+agueaNrui/kOihjOeOr+Wig+iHquWKqOi9rOaNoiwgU3VyZ2Ug546v5aKD5LiN5pSv5oyB5aSa5aqS5L2T6YCa55+lXG5cdCAqXG5cdCAqIOekuuS+izpcblx0ICogJC5tc2codGl0bGUsIHN1YnQsIGRlc2MsICd0d2l0dGVyOi8vJylcblx0ICogJC5tc2codGl0bGUsIHN1YnQsIGRlc2MsIHsgJ29wZW4tdXJsJzogJ3R3aXR0ZXI6Ly8nLCAnbWVkaWEtdXJsJzogJ2h0dHBzOi8vZ2l0aHViLmdpdGh1YmFzc2V0cy5jb20vaW1hZ2VzL21vZHVsZXMvb3Blbl9ncmFwaC9naXRodWItbWFyay5wbmcnIH0pXG5cdCAqICQubXNnKHRpdGxlLCBzdWJ0LCBkZXNjLCB7ICdvcGVuLXVybCc6ICdodHRwczovL2JpbmcuY29tJywgJ21lZGlhLXVybCc6ICdodHRwczovL2dpdGh1Yi5naXRodWJhc3NldHMuY29tL2ltYWdlcy9tb2R1bGVzL29wZW5fZ3JhcGgvZ2l0aHViLW1hcmsucG5nJyB9KVxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IHRpdGxlIOagh+mimFxuXHQgKiBAcGFyYW0geyp9IHN1YnQg5Ymv5qCH6aKYXG5cdCAqIEBwYXJhbSB7Kn0gZGVzYyDpgJrnn6Xor6bmg4Vcblx0ICogQHBhcmFtIHsqfSBvcHRzIOmAmuefpeWPguaVsFxuXHQgKlxuXHQgKi9cblx0bXNnKHRpdGxlID0gbmFtZSwgc3VidCA9ICcnLCBkZXNjID0gJycsIG9wdHMpIHtcblx0XHRjb25zdCB0b0Vudk9wdHMgPSAocmF3b3B0cykgPT4ge1xuXHRcdFx0c3dpdGNoICh0eXBlb2YgcmF3b3B0cykge1xuXHRcdFx0XHRjYXNlIHVuZGVmaW5lZDpcblx0XHRcdFx0XHRyZXR1cm4gcmF3b3B0c1xuXHRcdFx0XHRjYXNlICdzdHJpbmcnOlxuXHRcdFx0XHRcdHN3aXRjaCAodGhpcy5QbGF0Zm9ybSgpKSB7XG5cdFx0XHRcdFx0XHRjYXNlICdTdXJnZSc6XG5cdFx0XHRcdFx0XHRjYXNlICdTdGFzaCc6XG5cdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRyZXR1cm4geyB1cmw6IHJhd29wdHMgfVxuXHRcdFx0XHRcdFx0Y2FzZSAnTG9vbic6XG5cdFx0XHRcdFx0XHRjYXNlICdTaGFkb3dyb2NrZXQnOlxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmF3b3B0c1xuXHRcdFx0XHRcdFx0Y2FzZSAnUXVhbnR1bXVsdCBYJzpcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHsgJ29wZW4tdXJsJzogcmF3b3B0cyB9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRjYXNlICdvYmplY3QnOlxuXHRcdFx0XHRcdHN3aXRjaCAodGhpcy5QbGF0Zm9ybSgpKSB7XG5cdFx0XHRcdFx0XHRjYXNlICdTdXJnZSc6XG5cdFx0XHRcdFx0XHRjYXNlICdTdGFzaCc6XG5cdFx0XHRcdFx0XHRjYXNlICdTaGFkb3dyb2NrZXQnOlxuXHRcdFx0XHRcdFx0ZGVmYXVsdDoge1xuXHRcdFx0XHRcdFx0XHRsZXQgb3BlblVybCA9XG5cdFx0XHRcdFx0XHRcdFx0cmF3b3B0cy51cmwgfHwgcmF3b3B0cy5vcGVuVXJsIHx8IHJhd29wdHNbJ29wZW4tdXJsJ11cblx0XHRcdFx0XHRcdFx0cmV0dXJuIHsgdXJsOiBvcGVuVXJsIH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNhc2UgJ0xvb24nOiB7XG5cdFx0XHRcdFx0XHRcdGxldCBvcGVuVXJsID1cblx0XHRcdFx0XHRcdFx0XHRyYXdvcHRzLm9wZW5VcmwgfHwgcmF3b3B0cy51cmwgfHwgcmF3b3B0c1snb3Blbi11cmwnXVxuXHRcdFx0XHRcdFx0XHRsZXQgbWVkaWFVcmwgPSByYXdvcHRzLm1lZGlhVXJsIHx8IHJhd29wdHNbJ21lZGlhLXVybCddXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7IG9wZW5VcmwsIG1lZGlhVXJsIH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNhc2UgJ1F1YW50dW11bHQgWCc6IHtcblx0XHRcdFx0XHRcdFx0bGV0IG9wZW5VcmwgPVxuXHRcdFx0XHRcdFx0XHRcdHJhd29wdHNbJ29wZW4tdXJsJ10gfHwgcmF3b3B0cy51cmwgfHwgcmF3b3B0cy5vcGVuVXJsXG5cdFx0XHRcdFx0XHRcdGxldCBtZWRpYVVybCA9IHJhd29wdHNbJ21lZGlhLXVybCddIHx8IHJhd29wdHMubWVkaWFVcmxcblx0XHRcdFx0XHRcdFx0bGV0IHVwZGF0ZVBhc3RlYm9hcmQgPVxuXHRcdFx0XHRcdFx0XHRcdHJhd29wdHNbJ3VwZGF0ZS1wYXN0ZWJvYXJkJ10gfHwgcmF3b3B0cy51cGRhdGVQYXN0ZWJvYXJkXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdFx0J29wZW4tdXJsJzogb3BlblVybCxcblx0XHRcdFx0XHRcdFx0XHQnbWVkaWEtdXJsJzogbWVkaWFVcmwsXG5cdFx0XHRcdFx0XHRcdFx0J3VwZGF0ZS1wYXN0ZWJvYXJkJzogdXBkYXRlUGFzdGVib2FyZFxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWRcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKCF0aGlzLmlzTXV0ZSkge1xuXHRcdFx0c3dpdGNoICh0aGlzLlBsYXRmb3JtKCkpIHtcblx0XHRcdFx0Y2FzZSAnU3VyZ2UnOlxuXHRcdFx0XHRjYXNlICdMb29uJzpcblx0XHRcdFx0Y2FzZSAnU3Rhc2gnOlxuXHRcdFx0XHRjYXNlICdTaGFkb3dyb2NrZXQnOlxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdCRub3RpZmljYXRpb24ucG9zdCh0aXRsZSwgc3VidCwgZGVzYywgdG9FbnZPcHRzKG9wdHMpKVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHRcdGNhc2UgJ1F1YW50dW11bHQgWCc6XG5cdFx0XHRcdFx0JG5vdGlmeSh0aXRsZSwgc3VidCwgZGVzYywgdG9FbnZPcHRzKG9wdHMpKVxuXHRcdFx0XHRcdGJyZWFrXG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICghdGhpcy5pc011dGVMb2cpIHtcblx0XHRcdGxldCBsb2dzID0gWycnLCAnPT09PT09PT09PT09PT3wn5Oj57O757uf6YCa55+l8J+Toz09PT09PT09PT09PT09J11cblx0XHRcdGxvZ3MucHVzaCh0aXRsZSlcblx0XHRcdHN1YnQgPyBsb2dzLnB1c2goc3VidCkgOiAnJ1xuXHRcdFx0ZGVzYyA/IGxvZ3MucHVzaChkZXNjKSA6ICcnXG5cdFx0XHRjb25zb2xlLmxvZyhsb2dzLmpvaW4oJ1xcbicpKVxuXHRcdFx0dGhpcy5sb2dzID0gdGhpcy5sb2dzLmNvbmNhdChsb2dzKVxuXHRcdH1cblx0fVxuXG5cdGxvZyguLi5sb2dzKSB7XG5cdFx0aWYgKGxvZ3MubGVuZ3RoID4gMCkge1xuXHRcdFx0dGhpcy5sb2dzID0gWy4uLnRoaXMubG9ncywgLi4ubG9nc11cblx0XHR9XG5cdFx0Y29uc29sZS5sb2cobG9ncy5qb2luKHRoaXMubG9nU2VwYXJhdG9yKSlcblx0fVxuXG5cdGxvZ0VycihlcnJvcikge1xuXHRcdHN3aXRjaCAodGhpcy5QbGF0Zm9ybSgpKSB7XG5cdFx0XHRjYXNlICdTdXJnZSc6XG5cdFx0XHRjYXNlICdMb29uJzpcblx0XHRcdGNhc2UgJ1N0YXNoJzpcblx0XHRcdGNhc2UgJ1NoYWRvd3JvY2tldCc6XG5cdFx0XHRjYXNlICdRdWFudHVtdWx0IFgnOlxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhpcy5sb2coJycsIGDinZfvuI8gJHt0aGlzLm5hbWV9LCDplJnor68hYCwgZXJyb3IpXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXHR9XG5cblx0d2FpdCh0aW1lKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKVxuXHR9XG5cblx0ZG9uZSh2YWwgPSB7fSkge1xuXHRcdGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXHRcdGNvbnN0IGNvc3RUaW1lID0gKGVuZFRpbWUgLSB0aGlzLnN0YXJ0VGltZSkgLyAxMDAwXG5cdFx0dGhpcy5sb2coJycsIGDwn5qpICR7dGhpcy5uYW1lfSwg57uT5p2fISDwn5WbICR7Y29zdFRpbWV9IOenkmApXG5cdFx0dGhpcy5sb2coKVxuXHRcdHN3aXRjaCAodGhpcy5QbGF0Zm9ybSgpKSB7XG5cdFx0XHRjYXNlICdTdXJnZSc6XG5cdFx0XHRjYXNlICdMb29uJzpcblx0XHRcdGNhc2UgJ1N0YXNoJzpcblx0XHRcdGNhc2UgJ1NoYWRvd3JvY2tldCc6XG5cdFx0XHRjYXNlICdRdWFudHVtdWx0IFgnOlxuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0JGRvbmUodmFsKVxuXHRcdFx0XHRicmVha1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBHZXQgRW52aXJvbm1lbnQgVmFyaWFibGVzXG5cdCAqIEBsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9WaXJnaWxDbHluZS9HZXRTb21lRnJpZXMvYmxvYi9tYWluL2Z1bmN0aW9uL2dldEVOVi9nZXRFTlYuanNcblx0ICogQGF1dGhvciBWaXJnaWxDbHluZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0gUGVyc2lzdGVudCBTdG9yZSBLZXlcblx0ICogQHBhcmFtIHtBcnJheX0gbmFtZXMgLSBQbGF0Zm9ybSBOYW1lc1xuXHQgKiBAcGFyYW0ge09iamVjdH0gZGF0YWJhc2UgLSBEZWZhdWx0IERhdGFiYXNlXG5cdCAqIEByZXR1cm4ge09iamVjdH0geyBTZXR0aW5ncywgQ2FjaGVzLCBDb25maWdzIH1cblx0ICovXG5cdGdldEVOVihrZXksIG5hbWVzLCBkYXRhYmFzZSkge1xuXHRcdC8vdGhpcy5sb2coYOKYke+4jyAke3RoaXMubmFtZX0sIEdldCBFbnZpcm9ubWVudCBWYXJpYWJsZXNgLCBcIlwiKTtcblx0XHQvKioqKioqKioqKioqKioqKiogQm94SnMgKioqKioqKioqKioqKioqKiovXG5cdFx0Ly8g5YyF6KOF5Li65bGA6YOo5Y+Y6YeP77yM55So5a6M6YeK5pS+5YaF5a2YXG5cdFx0Ly8gQm94SnPnmoTmuIXnqbrmk43kvZzov5Tlm57lgYflgLznqbrlrZfnrKbkuLIsIOmAu+i+keaIluaTjeS9nOespuS8muWcqOW3puS+p+aTjeS9nOaVsOS4uuWBh+WAvOaXtui/lOWbnuWPs+S+p+aTjeS9nOaVsOOAglxuXHRcdGxldCBCb3hKcyA9IHRoaXMuZ2V0anNvbihrZXksIGRhdGFiYXNlKTtcblx0XHQvL3RoaXMubG9nKGDwn5qnICR7dGhpcy5uYW1lfSwgR2V0IEVudmlyb25tZW50IFZhcmlhYmxlc2AsIGBCb3hKc+exu+WeizogJHt0eXBlb2YgQm94SnN9YCwgYEJveEpz5YaF5a65OiAke0pTT04uc3RyaW5naWZ5KEJveEpzKX1gLCBcIlwiKTtcblx0XHQvKioqKioqKioqKioqKioqKiogQXJndW1lbnQgKioqKioqKioqKioqKioqKiovXG5cdFx0bGV0IEFyZ3VtZW50ID0ge307XG5cdFx0aWYgKHR5cGVvZiAkYXJndW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdGlmIChCb29sZWFuKCRhcmd1bWVudCkpIHtcblx0XHRcdFx0Ly90aGlzLmxvZyhg8J+OiSAke3RoaXMubmFtZX0sICRBcmd1bWVudGApO1xuXHRcdFx0XHRsZXQgYXJnID0gT2JqZWN0LmZyb21FbnRyaWVzKCRhcmd1bWVudC5zcGxpdChcIiZcIikubWFwKChpdGVtKSA9PiBpdGVtLnNwbGl0KFwiPVwiKS5tYXAoaSA9PiBpLnJlcGxhY2UoL1xcXCIvZywgJycpKSkpO1xuXHRcdFx0XHQvL3RoaXMubG9nKEpTT04uc3RyaW5naWZ5KGFyZykpO1xuXHRcdFx0XHRmb3IgKGxldCBpdGVtIGluIGFyZykgdGhpcy5zZXRQYXRoKEFyZ3VtZW50LCBpdGVtLCBhcmdbaXRlbV0pO1xuXHRcdFx0XHQvL3RoaXMubG9nKEpTT04uc3RyaW5naWZ5KEFyZ3VtZW50KSk7XG5cdFx0XHR9O1xuXHRcdFx0Ly90aGlzLmxvZyhg4pyFICR7dGhpcy5uYW1lfSwgR2V0IEVudmlyb25tZW50IFZhcmlhYmxlc2AsIGBBcmd1bWVudOexu+WeizogJHt0eXBlb2YgQXJndW1lbnR9YCwgYEFyZ3VtZW505YaF5a65OiAke0pTT04uc3RyaW5naWZ5KEFyZ3VtZW50KX1gLCBcIlwiKTtcblx0XHR9O1xuXHRcdC8qKioqKioqKioqKioqKioqKiBTdG9yZSAqKioqKioqKioqKioqKioqKi9cblx0XHRjb25zdCBTdG9yZSA9IHsgU2V0dGluZ3M6IGRhdGFiYXNlPy5EZWZhdWx0Py5TZXR0aW5ncyB8fCB7fSwgQ29uZmlnczogZGF0YWJhc2U/LkRlZmF1bHQ/LkNvbmZpZ3MgfHwge30sIENhY2hlczoge30gfTtcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkobmFtZXMpKSBuYW1lcyA9IFtuYW1lc107XG5cdFx0Ly90aGlzLmxvZyhg8J+apyAke3RoaXMubmFtZX0sIEdldCBFbnZpcm9ubWVudCBWYXJpYWJsZXNgLCBgbmFtZXPnsbvlnos6ICR7dHlwZW9mIG5hbWVzfWAsIGBuYW1lc+WGheWuuTogJHtKU09OLnN0cmluZ2lmeShuYW1lcyl9YCwgXCJcIik7XG5cdFx0Zm9yIChsZXQgbmFtZSBvZiBuYW1lcykge1xuXHRcdFx0U3RvcmUuU2V0dGluZ3MgPSB7IC4uLlN0b3JlLlNldHRpbmdzLCAuLi5kYXRhYmFzZT8uW25hbWVdPy5TZXR0aW5ncywgLi4uQXJndW1lbnQsIC4uLkJveEpzPy5bbmFtZV0/LlNldHRpbmdzIH07XG5cdFx0XHRTdG9yZS5Db25maWdzID0geyAuLi5TdG9yZS5Db25maWdzLCAuLi5kYXRhYmFzZT8uW25hbWVdPy5Db25maWdzIH07XG5cdFx0XHRpZiAoQm94SnM/LltuYW1lXT8uQ2FjaGVzICYmIHR5cGVvZiBCb3hKcz8uW25hbWVdPy5DYWNoZXMgPT09IFwic3RyaW5nXCIpIEJveEpzW25hbWVdLkNhY2hlcyA9IEpTT04ucGFyc2UoQm94SnM/LltuYW1lXT8uQ2FjaGVzKTtcblx0XHRcdFN0b3JlLkNhY2hlcyA9IHsgLi4uU3RvcmUuQ2FjaGVzLCAuLi5Cb3hKcz8uW25hbWVdPy5DYWNoZXMgfTtcblx0XHR9O1xuXHRcdC8vdGhpcy5sb2coYPCfmqcgJHt0aGlzLm5hbWV9LCBHZXQgRW52aXJvbm1lbnQgVmFyaWFibGVzYCwgYFN0b3JlLlNldHRpbmdz57G75Z6LOiAke3R5cGVvZiBTdG9yZS5TZXR0aW5nc31gLCBgU3RvcmUuU2V0dGluZ3M6ICR7SlNPTi5zdHJpbmdpZnkoU3RvcmUuU2V0dGluZ3MpfWAsIFwiXCIpO1xuXHRcdHRoaXMudHJhdmVyc2VPYmplY3QoU3RvcmUuU2V0dGluZ3MsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHQvL3RoaXMubG9nKGDwn5qnICR7dGhpcy5uYW1lfSwgdHJhdmVyc2VPYmplY3RgLCBgJHtrZXl9OiAke3R5cGVvZiB2YWx1ZX1gLCBgJHtrZXl9OiAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX1gLCBcIlwiKTtcblx0XHRcdGlmICh2YWx1ZSA9PT0gXCJ0cnVlXCIgfHwgdmFsdWUgPT09IFwiZmFsc2VcIikgdmFsdWUgPSBKU09OLnBhcnNlKHZhbHVlKTsgLy8g5a2X56ym5Liy6L2sQm9vbGVhblxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdGlmICh2YWx1ZS5pbmNsdWRlcyhcIixcIikpIHZhbHVlID0gdmFsdWUuc3BsaXQoXCIsXCIpLm1hcChpdGVtID0+IHRoaXMuc3RyaW5nMm51bWJlcihpdGVtKSk7IC8vIOWtl+espuS4sui9rOaVsOe7hOi9rOaVsOWtl1xuXHRcdFx0XHRlbHNlIHZhbHVlID0gdGhpcy5zdHJpbmcybnVtYmVyKHZhbHVlKTsgLy8g5a2X56ym5Liy6L2s5pWw5a2XXG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH0pO1xuXHRcdC8vdGhpcy5sb2coYOKchSAke3RoaXMubmFtZX0sIEdldCBFbnZpcm9ubWVudCBWYXJpYWJsZXNgLCBgU3RvcmU6ICR7dHlwZW9mIFN0b3JlLkNhY2hlc31gLCBgU3RvcmXlhoXlrrk6ICR7SlNPTi5zdHJpbmdpZnkoU3RvcmUpfWAsIFwiXCIpO1xuXHRcdHJldHVybiBTdG9yZTtcblx0fTtcblxuXHQvKioqKioqKioqKioqKioqKiogZnVuY3Rpb24gKioqKioqKioqKioqKioqKiovXG5cdHNldFBhdGgob2JqZWN0LCBwYXRoLCB2YWx1ZSkgeyBwYXRoLnNwbGl0KFwiLlwiKS5yZWR1Y2UoKG8sIHAsIGkpID0+IG9bcF0gPSBwYXRoLnNwbGl0KFwiLlwiKS5sZW5ndGggPT09ICsraSA/IHZhbHVlIDogb1twXSB8fCB7fSwgb2JqZWN0KSB9XG5cdHRyYXZlcnNlT2JqZWN0KG8sIGMpIHsgZm9yICh2YXIgdCBpbiBvKSB7IHZhciBuID0gb1t0XTsgb1t0XSA9IFwib2JqZWN0XCIgPT0gdHlwZW9mIG4gJiYgbnVsbCAhPT0gbiA/IHRoaXMudHJhdmVyc2VPYmplY3QobiwgYykgOiBjKHQsIG4pIH0gcmV0dXJuIG8gfVxuXHRzdHJpbmcybnVtYmVyKHN0cmluZykgeyBpZiAoc3RyaW5nICYmICFpc05hTihzdHJpbmcpKSBzdHJpbmcgPSBwYXJzZUludChzdHJpbmcsIDEwKTsgcmV0dXJuIHN0cmluZyB9XG59XG5cbmV4cG9ydCBjbGFzcyBIdHRwIHtcblx0Y29uc3RydWN0b3IoZW52KSB7XG5cdFx0dGhpcy5lbnYgPSBlbnZcblx0fVxuXG5cdHNlbmQob3B0cywgbWV0aG9kID0gJ0dFVCcpIHtcblx0XHRvcHRzID0gdHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnID8geyB1cmw6IG9wdHMgfSA6IG9wdHNcblx0XHRsZXQgc2VuZGVyID0gdGhpcy5nZXRcblx0XHRpZiAobWV0aG9kID09PSAnUE9TVCcpIHtcblx0XHRcdHNlbmRlciA9IHRoaXMucG9zdFxuXHRcdH1cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0c2VuZGVyLmNhbGwodGhpcywgb3B0cywgKGVycm9yLCByZXNwb25zZSwgYm9keSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyb3IpIHJlamVjdChlcnJvcilcblx0XHRcdFx0ZWxzZSByZXNvbHZlKHJlc3BvbnNlKVxuXHRcdFx0fSlcblx0XHR9KVxuXHR9XG5cblx0Z2V0KG9wdHMpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kLmNhbGwodGhpcy5lbnYsIG9wdHMpXG5cdH1cblxuXHRwb3N0KG9wdHMpIHtcblx0XHRyZXR1cm4gdGhpcy5zZW5kLmNhbGwodGhpcy5lbnYsIG9wdHMsICdQT1NUJylcblx0fVxufVxuIiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgVVJJIHtcblx0Y29uc3RydWN0b3Iob3B0cyA9IFtdKSB7XG5cdFx0dGhpcy5uYW1lID0gXCJVUkkgdjEuMi42XCI7XG5cdFx0dGhpcy5vcHRzID0gb3B0cztcblx0XHR0aGlzLmpzb24gPSB7IHNjaGVtZTogXCJcIiwgaG9zdDogXCJcIiwgcGF0aDogXCJcIiwgcXVlcnk6IHt9IH07XG5cdH07XG5cblx0cGFyc2UodXJsKSB7XG5cdFx0Y29uc3QgVVJMUmVnZXggPSAvKD86KD88c2NoZW1lPi4rKTpcXC9cXC8oPzxob3N0PlteL10rKSk/XFwvPyg/PHBhdGg+W14/XSspP1xcPz8oPzxxdWVyeT5bXj9dKyk/Lztcblx0XHRsZXQganNvbiA9IHVybC5tYXRjaChVUkxSZWdleCk/Lmdyb3VwcyA/PyBudWxsO1xuXHRcdGlmIChqc29uPy5wYXRoKSBqc29uLnBhdGhzID0ganNvbi5wYXRoLnNwbGl0KFwiL1wiKTsgZWxzZSBqc29uLnBhdGggPSBcIlwiO1xuXHRcdC8vaWYgKGpzb24/LnBhdGhzPy5hdCgtMSk/LmluY2x1ZGVzKFwiLlwiKSkganNvbi5mb3JtYXQgPSBqc29uLnBhdGhzLmF0KC0xKS5zcGxpdChcIi5cIikuYXQoLTEpO1xuXHRcdGlmIChqc29uPy5wYXRocykge1xuXHRcdFx0Y29uc3QgZmlsZU5hbWUgPSBqc29uLnBhdGhzW2pzb24ucGF0aHMubGVuZ3RoIC0gMV07XG5cdFx0XHRpZiAoZmlsZU5hbWU/LmluY2x1ZGVzKFwiLlwiKSkge1xuXHRcdFx0XHRjb25zdCBsaXN0ID0gZmlsZU5hbWUuc3BsaXQoXCIuXCIpO1xuXHRcdFx0XHRqc29uLmZvcm1hdCA9IGxpc3RbbGlzdC5sZW5ndGggLSAxXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGpzb24/LnF1ZXJ5KSBqc29uLnF1ZXJ5ID0gT2JqZWN0LmZyb21FbnRyaWVzKGpzb24ucXVlcnkuc3BsaXQoXCImXCIpLm1hcCgocGFyYW0pID0+IHBhcmFtLnNwbGl0KFwiPVwiKSkpO1xuXHRcdHJldHVybiBqc29uXG5cdH07XG5cblx0c3RyaW5naWZ5KGpzb24gPSB0aGlzLmpzb24pIHtcblx0XHRsZXQgdXJsID0gXCJcIjtcblx0XHRpZiAoanNvbj8uc2NoZW1lICYmIGpzb24/Lmhvc3QpIHVybCArPSBqc29uLnNjaGVtZSArIFwiOi8vXCIgKyBqc29uLmhvc3Q7XG5cdFx0aWYgKGpzb24/LnBhdGgpIHVybCArPSAoanNvbj8uaG9zdCkgPyBcIi9cIiArIGpzb24ucGF0aCA6IGpzb24ucGF0aDtcblx0XHRpZiAoanNvbj8ucXVlcnkpIHVybCArPSBcIj9cIiArIE9iamVjdC5lbnRyaWVzKGpzb24ucXVlcnkpLm1hcChwYXJhbSA9PiBwYXJhbS5qb2luKFwiPVwiKSkuam9pbihcIiZcIik7XG5cdFx0cmV0dXJuIHVybFxuXHR9O1xufVxuIiwiLypcblJFQURNRTogaHR0cHM6Ly9naXRodWIuY29tL1ZpcmdpbENseW5lL2lSaW5nb1xuKi9cblxuaW1wb3J0IEVOVnMgZnJvbSBcIi4uL0VOVi9FTlYubWpzXCI7XG5jb25zdCAkID0gbmV3IEVOVnMoXCLvo78gaVJpbmdvOiBTZXQgRW52aXJvbm1lbnQgVmFyaWFibGVzIGJldGFcIik7XG5cbi8qKlxuICogU2V0IEVudmlyb25tZW50IFZhcmlhYmxlc1xuICogQGF1dGhvciBWaXJnaWxDbHluZVxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBQZXJzaXN0ZW50IFN0b3JlIEtleVxuICogQHBhcmFtIHtBcnJheX0gcGxhdGZvcm1zIC0gUGxhdGZvcm0gTmFtZXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhYmFzZSAtIERlZmF1bHQgRGF0YUJhc2VcbiAqIEByZXR1cm4ge09iamVjdH0geyBTZXR0aW5ncywgQ2FjaGVzLCBDb25maWdzIH1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2V0RU5WKG5hbWUsIHBsYXRmb3JtcywgZGF0YWJhc2UpIHtcblx0JC5sb2coYOKYke+4jyAkeyQubmFtZX1gLCBcIlwiKTtcblx0bGV0IHsgU2V0dGluZ3MsIENhY2hlcywgQ29uZmlncyB9ID0gJC5nZXRFTlYobmFtZSwgcGxhdGZvcm1zLCBkYXRhYmFzZSk7XG5cdC8qKioqKioqKioqKioqKioqKiBTZXR0aW5ncyAqKioqKioqKioqKioqKioqKi9cblx0aWYgKFNldHRpbmdzPy5UYWJzICYmICFBcnJheS5pc0FycmF5KFNldHRpbmdzPy5UYWJzKSkgJC5sb2Rhc2hfc2V0KFNldHRpbmdzLCBcIlRhYnNcIiwgKFNldHRpbmdzPy5UYWJzKSA/IFtTZXR0aW5ncy5UYWJzLnRvU3RyaW5nKCldIDogW10pO1xuXHRpZiAoU2V0dGluZ3M/LkRvbWFpbnMgJiYgIUFycmF5LmlzQXJyYXkoU2V0dGluZ3M/LkRvbWFpbnMpKSAkLmxvZGFzaF9zZXQoU2V0dGluZ3MsIFwiRG9tYWluc1wiLCAoU2V0dGluZ3M/LkRvbWFpbnMpID8gW1NldHRpbmdzLkRvbWFpbnMudG9TdHJpbmcoKV0gOiBbXSk7XG5cdGlmIChTZXR0aW5ncz8uRnVuY3Rpb25zICYmICFBcnJheS5pc0FycmF5KFNldHRpbmdzPy5GdW5jdGlvbnMpKSAkLmxvZGFzaF9zZXQoU2V0dGluZ3MsIFwiRnVuY3Rpb25zXCIsIChTZXR0aW5ncz8uRnVuY3Rpb25zKSA/IFtTZXR0aW5ncy5GdW5jdGlvbnMudG9TdHJpbmcoKV0gOiBbXSk7XG5cdCQubG9nKGDinIUgJHskLm5hbWV9YCwgYFNldHRpbmdzOiAke3R5cGVvZiBTZXR0aW5nc31gLCBgU2V0dGluZ3PlhoXlrrk6ICR7SlNPTi5zdHJpbmdpZnkoU2V0dGluZ3MpfWAsIFwiXCIpO1xuXHQvKioqKioqKioqKioqKioqKiogQ2FjaGVzICoqKioqKioqKioqKioqKioqL1xuXHQvLyQubG9nKGDinIUgJHskLm5hbWV9YCwgYENhY2hlczogJHt0eXBlb2YgQ2FjaGVzfWAsIGBDYWNoZXPlhoXlrrk6ICR7SlNPTi5zdHJpbmdpZnkoQ2FjaGVzKX1gLCBcIlwiKTtcblx0LyoqKioqKioqKioqKioqKioqIENvbmZpZ3MgKioqKioqKioqKioqKioqKiovXG5cdENvbmZpZ3MuU3RvcmVmcm9udCA9IG5ldyBNYXAoQ29uZmlncy5TdG9yZWZyb250KTtcblx0aWYgKENvbmZpZ3MuTG9jYWxlKSBDb25maWdzLkxvY2FsZSA9IG5ldyBNYXAoQ29uZmlncy5Mb2NhbGUpO1xuXHRpZiAoQ29uZmlncy5pMThuKSBmb3IgKGxldCB0eXBlIGluIENvbmZpZ3MuaTE4bikgQ29uZmlncy5pMThuW3R5cGVdID0gbmV3IE1hcChDb25maWdzLmkxOG5bdHlwZV0pO1xuXHRyZXR1cm4geyBTZXR0aW5ncywgQ2FjaGVzLCBDb25maWdzIH07XG59O1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsInZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiA/IChvYmopID0+IChPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKSkgOiAob2JqKSA9PiAob2JqLl9fcHJvdG9fXyk7XG52YXIgbGVhZlByb3RvdHlwZXM7XG4vLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3Rcbi8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuLy8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4vLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3Rcbi8vIG1vZGUgJiAxNjogcmV0dXJuIHZhbHVlIHdoZW4gaXQncyBQcm9taXNlLWxpa2Vcbi8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbl9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG5cdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IHRoaXModmFsdWUpO1xuXHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuXHRpZih0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlKSB7XG5cdFx0aWYoKG1vZGUgJiA0KSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG5cdFx0aWYoKG1vZGUgJiAxNikgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZTtcblx0fVxuXHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuXHR2YXIgZGVmID0ge307XG5cdGxlYWZQcm90b3R5cGVzID0gbGVhZlByb3RvdHlwZXMgfHwgW251bGwsIGdldFByb3RvKHt9KSwgZ2V0UHJvdG8oW10pLCBnZXRQcm90byhnZXRQcm90byldO1xuXHRmb3IodmFyIGN1cnJlbnQgPSBtb2RlICYgMiAmJiB2YWx1ZTsgdHlwZW9mIGN1cnJlbnQgPT0gJ29iamVjdCcgJiYgIX5sZWFmUHJvdG90eXBlcy5pbmRleE9mKGN1cnJlbnQpOyBjdXJyZW50ID0gZ2V0UHJvdG8oY3VycmVudCkpIHtcblx0XHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhjdXJyZW50KS5mb3JFYWNoKChrZXkpID0+IChkZWZba2V5XSA9ICgpID0+ICh2YWx1ZVtrZXldKSkpO1xuXHR9XG5cdGRlZlsnZGVmYXVsdCddID0gKCkgPT4gKHZhbHVlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBkZWYpO1xuXHRyZXR1cm4gbnM7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvKlxuUkVBRE1FOiBodHRwczovL2dpdGh1Yi5jb20vVmlyZ2lsQ2x5bmUvaVJpbmdvXG4qL1xuXG5pbXBvcnQgRU5WcyBmcm9tIFwiLi9FTlYvRU5WLm1qc1wiO1xuaW1wb3J0IFVSSXMgZnJvbSBcIi4vVVJJL1VSSS5tanNcIjtcbmltcG9ydCBzZXRFTlYgZnJvbSBcIi4vZnVuY3Rpb24vc2V0RU5WLm1qc1wiO1xuXG5pbXBvcnQgKiBhcyBEZWZhdWx0IGZyb20gXCIuL2RhdGFiYXNlL0RlZmF1bHQuanNvblwiO1xuaW1wb3J0ICogYXMgTG9jYXRpb24gZnJvbSBcIi4vZGF0YWJhc2UvTG9jYXRpb24uanNvblwiO1xuaW1wb3J0ICogYXMgTmV3cyBmcm9tIFwiLi9kYXRhYmFzZS9OZXdzLmpzb25cIjtcbmltcG9ydCAqIGFzIFByaXZhdGVSZWxheSBmcm9tIFwiLi9kYXRhYmFzZS9Qcml2YXRlUmVsYXkuanNvblwiO1xuaW1wb3J0ICogYXMgU2lyaSBmcm9tIFwiLi9kYXRhYmFzZS9TaXJpLmpzb25cIjtcbmltcG9ydCAqIGFzIFRlc3RGbGlnaHQgZnJvbSBcIi4vZGF0YWJhc2UvVGVzdEZsaWdodC5qc29uXCI7XG5pbXBvcnQgKiBhcyBUViBmcm9tIFwiLi9kYXRhYmFzZS9UVi5qc29uXCI7XG5cbmNvbnN0ICQgPSBuZXcgRU5WcyhcIu+jvyBpUmluZ286IOKciCBUZXN0RmxpZ2h0IHYzLjEuMSgxKSByZXNwb25zZS5iZXRhXCIpO1xuY29uc3QgVVJJID0gbmV3IFVSSXMoKTtcbmNvbnN0IERhdGFCYXNlID0ge1xuXHRcIkRlZmF1bHRcIjogRGVmYXVsdCxcblx0XCJMb2NhdGlvblwiOiBMb2NhdGlvbixcblx0XCJOZXdzXCI6IE5ld3MsXG5cdFwiUHJpdmF0ZVJlbGF5XCI6IFByaXZhdGVSZWxheSxcblx0XCJTaXJpXCI6IFNpcmksXG5cdFwiVGVzdEZsaWdodFwiOiBUZXN0RmxpZ2h0LFxuXHRcIlRWXCI6IFRWLFxufTtcblxuLyoqKioqKioqKioqKioqKioqIFByb2Nlc3NpbmcgKioqKioqKioqKioqKioqKiovXG4vLyDop6PmnoRVUkxcbmNvbnN0IFVSTCA9IFVSSS5wYXJzZSgkcmVxdWVzdC51cmwpO1xuJC5sb2coYOKaoCAkeyQubmFtZX1gLCBgVVJMOiAke0pTT04uc3RyaW5naWZ5KFVSTCl9YCwgXCJcIik7XG4vLyDojrflj5bov57mjqXlj4LmlbBcbmNvbnN0IE1FVEhPRCA9ICRyZXF1ZXN0Lm1ldGhvZCwgSE9TVCA9IFVSTC5ob3N0LCBQQVRIID0gVVJMLnBhdGgsIFBBVEhzID0gVVJMLnBhdGhzO1xuJC5sb2coYOKaoCAkeyQubmFtZX1gLCBgTUVUSE9EOiAke01FVEhPRH1gLCBcIlwiKTtcbi8vIOino+aekOagvOW8j1xuY29uc3QgRk9STUFUID0gKCRyZXNwb25zZS5oZWFkZXJzPy5bXCJDb250ZW50LVR5cGVcIl0gPz8gJHJlc3BvbnNlLmhlYWRlcnM/LltcImNvbnRlbnQtdHlwZVwiXSk/LnNwbGl0KFwiO1wiKT8uWzBdO1xuJC5sb2coYOKaoCAkeyQubmFtZX1gLCBgRk9STUFUOiAke0ZPUk1BVH1gLCBcIlwiKTtcbihhc3luYyAoKSA9PiB7XG5cdGNvbnN0IHsgU2V0dGluZ3MsIENhY2hlcywgQ29uZmlncyB9ID0gc2V0RU5WKFwiaVJpbmdvXCIsIFwiVGVzdEZsaWdodFwiLCBEYXRhQmFzZSk7XG5cdCQubG9nKGDimqAgJHskLm5hbWV9YCwgYFNldHRpbmdzLlN3aXRjaDogJHtTZXR0aW5ncz8uU3dpdGNofWAsIFwiXCIpO1xuXHRzd2l0Y2ggKFNldHRpbmdzLlN3aXRjaCkge1xuXHRcdGNhc2UgdHJ1ZTpcblx0XHRkZWZhdWx0OlxuXHRcdFx0Ly8g5Yib5bu656m65pWw5o2uXG5cdFx0XHRsZXQgYm9keSA9IHt9O1xuXHRcdFx0Ly8g5qC85byP5Yik5patXG5cdFx0XHRzd2l0Y2ggKEZPUk1BVCkge1xuXHRcdFx0XHRjYXNlIHVuZGVmaW5lZDogLy8g6KeG5Li65pegYm9keVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCI6XG5cdFx0XHRcdGNhc2UgXCJ0ZXh0L3BsYWluXCI6XG5cdFx0XHRcdGNhc2UgXCJ0ZXh0L2h0bWxcIjpcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL3gtbXBlZ1VSTFwiOlxuXHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24veC1tcGVndXJsXCI6XG5cdFx0XHRcdGNhc2UgXCJhcHBsaWNhdGlvbi92bmQuYXBwbGUubXBlZ3VybFwiOlxuXHRcdFx0XHRjYXNlIFwiYXVkaW8vbXBlZ3VybFwiOlxuXHRcdFx0XHRcdC8vYm9keSA9IE0zVTgucGFyc2UoJHJlc3BvbnNlLmJvZHkpO1xuXHRcdFx0XHRcdC8vJC5sb2coYPCfmqcgJHskLm5hbWV9YCwgYGJvZHk6ICR7SlNPTi5zdHJpbmdpZnkoYm9keSl9YCwgXCJcIik7XG5cdFx0XHRcdFx0Ly8kcmVzcG9uc2UuYm9keSA9IE0zVTguc3RyaW5naWZ5KGJvZHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwidGV4dC94bWxcIjpcblx0XHRcdFx0Y2FzZSBcInRleHQvcGxpc3RcIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL3htbFwiOlxuXHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24vcGxpc3RcIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL3gtcGxpc3RcIjpcblx0XHRcdFx0XHQvL2JvZHkgPSBYTUwucGFyc2UoJHJlc3BvbnNlLmJvZHkpO1xuXHRcdFx0XHRcdC8vJC5sb2coYPCfmqcgJHskLm5hbWV9YCwgYGJvZHk6ICR7SlNPTi5zdHJpbmdpZnkoYm9keSl9YCwgXCJcIik7XG5cdFx0XHRcdFx0Ly8kcmVzcG9uc2UuYm9keSA9IFhNTC5zdHJpbmdpZnkoYm9keSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJ0ZXh0L3Z0dFwiOlxuXHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24vdnR0XCI6XG5cdFx0XHRcdFx0Ly9ib2R5ID0gVlRULnBhcnNlKCRyZXNwb25zZS5ib2R5KTtcblx0XHRcdFx0XHQvLyQubG9nKGDwn5qnICR7JC5uYW1lfWAsIGBib2R5OiAke0pTT04uc3RyaW5naWZ5KGJvZHkpfWAsIFwiXCIpO1xuXHRcdFx0XHRcdC8vJHJlc3BvbnNlLmJvZHkgPSBWVFQuc3RyaW5naWZ5KGJvZHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwidGV4dC9qc29uXCI6XG5cdFx0XHRcdGNhc2UgXCJhcHBsaWNhdGlvbi9qc29uXCI6XG5cdFx0XHRcdFx0Ym9keSA9IEpTT04ucGFyc2UoJHJlc3BvbnNlLmJvZHkgPz8gXCJ7fVwiKTtcblx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX1gLCBgYm9keTogJHtKU09OLnN0cmluZ2lmeShib2R5KX1gLCBcIlwiKTtcblx0XHRcdFx0XHQvLyDkuLvmnLrliKTmlq1cblx0XHRcdFx0XHRzd2l0Y2ggKEhPU1QpIHtcblx0XHRcdFx0XHRcdGNhc2UgXCJ0ZXN0ZmxpZ2h0LmFwcGxlLmNvbVwiOlxuXHRcdFx0XHRcdFx0XHQvLyDot6/lvoTliKTmlq1cblx0XHRcdFx0XHRcdFx0c3dpdGNoIChQQVRIKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInYxL3Nlc3Npb24vYXV0aGVudGljYXRlXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFNldHRpbmdzLk11bHRpQWNjb3VudCkgeyAvLyBNdWx0aUFjY291bnRcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB0cnVlOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDimqAgJHskLm5hbWV9LCDlkK/nlKjlpJrotKblj7fmlK/mjIFgLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBYUmVxdWVzdElkID0gJHJlcXVlc3Q/LmhlYWRlcnM/LltcIlgtUmVxdWVzdC1JZFwiXSA/PyAkcmVxdWVzdD8uaGVhZGVycz8uW1wieC1yZXF1ZXN0LWlkXCJdO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IFhTZXNzaW9uSWQgPSAkcmVxdWVzdD8uaGVhZGVycz8uW1wiWC1TZXNzaW9uLUlkXCJdID8/ICRyZXF1ZXN0Py5oZWFkZXJzPy5bXCJ4LXNlc3Npb24taWRcIl07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgWFNlc3Npb25EaWdlc3QgPSAkcmVxdWVzdD8uaGVhZGVycz8uW1wiWC1TZXNzaW9uLURpZ2VzdFwiXSA/PyAkcmVxdWVzdD8uaGVhZGVycz8uW1wieC1zZXNzaW9uLWRpZ2VzdFwiXTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoQ2FjaGVzPy5kYXRhKSB7IC8v5pyJZGF0YVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYOKaoCAkeyQubmFtZX0sIOaciUNhY2hlcy5kYXRhYCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoYm9keT8uZGF0YT8uYWNjb3VudElkID09PSBDYWNoZXM/LmRhdGE/LmFjY291bnRJZCkgeyAvLyBBY2NvdW50IElE55u4562J77yM5Yi35paw57yT5a2YXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDimqAgJHskLm5hbWV9LCBBY2NvdW50IElE55u4562J77yM5Yi35paw57yT5a2YYCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdENhY2hlcy5oZWFkZXJzID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiWC1SZXF1ZXN0LUlkXCI6IFhSZXF1ZXN0SWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XCJYLVNlc3Npb24tSWRcIjogWFNlc3Npb25JZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcIlgtU2Vzc2lvbi1EaWdlc3RcIjogWFNlc3Npb25EaWdlc3Rcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Q2FjaGVzLmRhdGEgPSBib2R5LmRhdGE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdENhY2hlcy5kYXRhLnRlcm1zQW5kQ29uZGl0aW9ucyA9IG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdENhY2hlcy5kYXRhLmhhc05ld1Rlcm1zQW5kQ29uZGl0aW9ucyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLnNldGpzb24oQ2FjaGVzLCBcIkBpUmluZ28uVGVzdEZsaWdodC5DYWNoZXNcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZWxzZSB7IC8vIEFjY291bnQgSUTkuI3nm7jnrYnvvIzopobnm5Zcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYOKaoCAkeyQubmFtZX0sIEFjY291bnQgSUTkuI3nm7jnrYnvvIzopobnm5ZkYXRhKGFjY291bnRJZOWSjHNlc3Npb25JZClgLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keS5kYXRhID0gQ2FjaGVzLmRhdGE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7IC8vIENhY2hlc+epulxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYOKaoCAkeyQubmFtZX0sIENhY2hlc+epuu+8jOWGmeWFpWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Q2FjaGVzLmhlYWRlcnMgPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiWC1SZXF1ZXN0LUlkXCI6IFhSZXF1ZXN0SWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiWC1TZXNzaW9uLUlkXCI6IFhTZXNzaW9uSWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFwiWC1TZXNzaW9uLURpZ2VzdFwiOiBYU2Vzc2lvbkRpZ2VzdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdENhY2hlcy5kYXRhID0gYm9keS5kYXRhO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Q2FjaGVzLmRhdGEudGVybXNBbmRDb25kaXRpb25zID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdENhY2hlcy5kYXRhLmhhc05ld1Rlcm1zQW5kQ29uZGl0aW9ucyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5zZXRqc29uKENhY2hlcywgXCJAaVJpbmdvLlRlc3RGbGlnaHQuQ2FjaGVzXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgZmFsc2U6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInYxL2RldmljZXNcIjpcblx0XHRcdFx0XHRcdFx0XHRjYXNlIFwidjEvZGV2aWNlcy9hcG5zXCI6XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInYxL2RldmljZXMvYWRkXCI6XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInYxL2RldmljZXMvcmVtb3ZlXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0c3dpdGNoIChQQVRIc1swXSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwidjFcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInYyXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJ2M1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbMV0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJhY2NvdW50c1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFBBVEhzWzJdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInNldHRpbmdzXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFBBVEhzWzNdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgdW5kZWZpbmVkOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vYWNjb3VudHMvc2V0dGluZ3NgLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcIm5vdGlmaWNhdGlvbnNcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFBBVEhzWzRdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiYXBwc1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzL3NldHRpbmdzL25vdGlmaWNhdGlvbnMvYXBwcy9gLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzL3NldHRpbmdzLyR7UEFUSHNbM119L2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgQ2FjaGVzPy5kYXRhPy5hY2NvdW50SWQ6IC8vIFVVSURcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3dpdGNoIChQQVRIc1szXSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIHVuZGVmaW5lZDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzLyR7UEFUSHNbMl19YCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJhcHBzXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS9hcHBzL2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbNF0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgdW5kZWZpbmVkOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzLyR7UEFUSHNbMl19L2FwcHNgLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3dpdGNoIChTZXR0aW5ncy5Vbml2ZXJzYWwpIHsgLy8g6YCa55SoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB0cnVlOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCDlkK/nlKjpgJrnlKjlupTnlKjmlK/mjIFgLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChib2R5LmVycm9yID09PSBudWxsKSB7IC8vIOaVsOaNruaXoOmUmeivr1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIOaVsOaNruaXoOmUmeivr2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRib2R5LmRhdGEgPSBib2R5LmRhdGEubWFwKGFwcCA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGFwcC5wcmV2aW91c2x5VGVzdGVkICE9PSBmYWxzZSkgeyAvLyDkuI3mmK/liY3mtYvor5XkurrlkZhcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwg5LiN5piv5YmN5rWL6K+V5Lq65ZGYYCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhcHAucGxhdGZvcm1zID0gYXBwLnBsYXRmb3Jtcy5tYXAocGxhdGZvcm0gPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRwbGF0Zm9ybS5idWlsZCA9IG1vZEJ1aWxkKHBsYXRmb3JtLmJ1aWxkKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHBsYXRmb3JtXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGFwcFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIGZhbHNlOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFBBVEhzWzVdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB1bmRlZmluZWQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzLyR7UEFUSHNbMl19L2FwcHMvJHtQQVRIc1s0XX1gLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJidWlsZHNcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbN10pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB1bmRlZmluZWQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS9hcHBzLyR7UEFUSHNbNF19L2J1aWxkcy8ke1BBVEhzWzZdfWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoU2V0dGluZ3MuVW5pdmVyc2FsKSB7IC8vIOmAmueUqFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB0cnVlOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIOWQr+eUqOmAmueUqOW6lOeUqOaUr+aMgWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoYm9keS5lcnJvciA9PT0gbnVsbCkgeyAvLyDmlbDmja7ml6DplJnor69cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIOaVsOaNruaXoOmUmeivr2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOW9k+WJjUJ1bGlkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keS5kYXRhLmN1cnJlbnRCdWlsZCA9IG1vZEJ1aWxkKGJvZHkuZGF0YS5jdXJyZW50QnVpbGQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIEJ1aWxk5YiX6KGoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keS5kYXRhLmJ1aWxkcyA9IGJvZHkuZGF0YS5idWlsZHMubWFwKGJ1aWxkID0+IG1vZEJ1aWxkKGJ1aWxkKSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBmYWxzZTpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJpbnN0YWxsXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS9hcHBzLyR7UEFUSHNbNF19L2J1aWxkcy8ke1BBVEhzWzZdfS9pbnN0YWxsYCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS9hcHBzLyR7UEFUSHNbNF19L2J1aWxkcy8ke1BBVEhzWzZdfS8ke1BBVEhzWzddfWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJwbGF0Zm9ybXNcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbNl0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcImlvc1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwib3N4XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJhcHBsZXR2b3NcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFBBVEhzWzddKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIHVuZGVmaW5lZDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS9hcHBzLyR7UEFUSHNbNF19L3BsYXRmb3Jtcy8ke1BBVEhzWzZdfWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJ0cmFpbnNcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3dpdGNoIChQQVRIc1s5XSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgdW5kZWZpbmVkOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS9hcHBzLyR7UEFUSHNbNF19L3BsYXRmb3Jtcy8ke1BBVEhzWzZdfS90cmFpbnMvJHtQQVRIc1s4XX1gLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJidWlsZHNcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbMTBdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgdW5kZWZpbmVkOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vYWNjb3VudHMvJHtQQVRIc1syXX0vYXBwcy8ke1BBVEhzWzRdfS9wbGF0Zm9ybXMvJHtQQVRIc1s2XX0vdHJhaW5zLyR7UEFUSHNbOF19L2J1aWxkc2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoU2V0dGluZ3MuVW5pdmVyc2FsKSB7IC8vIOmAmueUqFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB0cnVlOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIOWQr+eUqOmAmueUqOW6lOeUqOaUr+aMgWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoYm9keS5lcnJvciA9PT0gbnVsbCkgeyAvLyDmlbDmja7ml6DplJnor69cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIOaVsOaNruaXoOmUmeivr2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOW9k+WJjUJ1bGlkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ym9keS5kYXRhID0gYm9keS5kYXRhLm1hcChkYXRhID0+IG1vZEJ1aWxkKGRhdGEpKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIGZhbHNlOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzLyR7UEFUSHNbMl19L2FwcHMvJHtQQVRIc1s0XX0vcGxhdGZvcm1zLyR7UEFUSHNbNl19L3RyYWlucy8ke1BBVEhzWzhdfS9idWlsZHMvJHtQQVRIc1sxMF19YCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vYWNjb3VudHMvJHtQQVRIc1syXX0vYXBwcy8ke1BBVEhzWzRdfS9wbGF0Zm9ybXMvJHtQQVRIc1s2XX0vdHJhaW5zLyR7UEFUSHNbOF19LyR7UEFUSHNbOV19YCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sICR7UEFUSHNbMF19L2FjY291bnRzLyR7UEFUSHNbMl19L2FwcHMvJHtQQVRIc1s0XX0vcGxhdGZvcm1zLyR7UEFUSHNbNl19LyR7UEFUSHNbN119YCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vYWNjb3VudHMvJHtQQVRIc1syXX0vYXBwcy8ke1BBVEhzWzRdfS8ke1BBVEhzWzVdfWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hY2NvdW50cy8ke1BBVEhzWzJdfS8ke1BBVEhzWzNdfS9gLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiYXBwc1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKFBBVEhzWzNdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcImluc3RhbGxcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbNF0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB1bmRlZmluZWQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9hcHBzL2luc3RhbGxgLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInN0YXR1c1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vYXBwcy9pbnN0YWxsL3N0YXR1c2AsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vYXBwcy9pbnN0YWxsLyR7UEFUSHNbNF19YCwgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcIm1lc3NhZ2VzXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbMl0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIENhY2hlcz8uZGF0YT8uYWNjb3VudElkOiAvLyBVVUlEXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vbWVzc2FnZXMvJHtQQVRIc1syXX1gLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoUEFUSHNbM10pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSB1bmRlZmluZWQ6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5sb2coYPCfmqcgJHskLm5hbWV9LCAke1BBVEhzWzBdfS9tZXNzYWdlcy8ke1BBVEhzWzJdfWAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwicmVhZFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vbWVzc2FnZXMvJHtQQVRIc1syXX0vcmVhZGAsIFwiXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgJHtQQVRIc1swXX0vbWVzc2FnZXMvJHtQQVRIc1syXX0vJHtQQVRIc1szXX1gLCBcIlwiKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHQkcmVzcG9uc2UuYm9keSA9IEpTT04uc3RyaW5naWZ5KGJvZHkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24vcHJvdG9idWZcIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL3gtcHJvdG9idWZcIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL3ZuZC5nb29nbGUucHJvdG9idWZcIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL2dycGNcIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL2dycGMrcHJvdG9cIjpcblx0XHRcdFx0Y2FzZSBcImFwcGxlY2F0aW9uL29jdGV0LXN0cmVhbVwiOlxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgZmFsc2U6XG5cdFx0XHRicmVhaztcblx0fTtcbn0pKClcblx0LmNhdGNoKChlKSA9PiAkLmxvZ0VycihlKSlcblx0LmZpbmFsbHkoKCkgPT4ge1xuXHRcdHN3aXRjaCAoJHJlc3BvbnNlKSB7XG5cdFx0XHRkZWZhdWx0OiB7IC8vIOacieWbnuWkjeaVsOaNru+8jOi/lOWbnuWbnuWkjeaVsOaNrlxuXHRcdFx0XHQvL2NvbnN0IEZPUk1BVCA9ICgkcmVzcG9uc2U/LmhlYWRlcnM/LltcIkNvbnRlbnQtVHlwZVwiXSA/PyAkcmVzcG9uc2U/LmhlYWRlcnM/LltcImNvbnRlbnQtdHlwZVwiXSk/LnNwbGl0KFwiO1wiKT8uWzBdO1xuXHRcdFx0XHQkLmxvZyhg8J+OiSAkeyQubmFtZX0sIGZpbmFsbHlgLCBgJHJlc3BvbnNlYCwgYEZPUk1BVDogJHtGT1JNQVR9YCwgXCJcIik7XG5cdFx0XHRcdC8vJC5sb2coYPCfmqcgJHskLm5hbWV9LCBmaW5hbGx5YCwgYCRyZXNwb25zZTogJHtKU09OLnN0cmluZ2lmeSgkcmVzcG9uc2UpfWAsIFwiXCIpO1xuXHRcdFx0XHRpZiAoJHJlc3BvbnNlPy5oZWFkZXJzPy5bXCJDb250ZW50LUVuY29kaW5nXCJdKSAkcmVzcG9uc2UuaGVhZGVyc1tcIkNvbnRlbnQtRW5jb2RpbmdcIl0gPSBcImlkZW50aXR5XCI7XG5cdFx0XHRcdGlmICgkcmVzcG9uc2U/LmhlYWRlcnM/LltcImNvbnRlbnQtZW5jb2RpbmdcIl0pICRyZXNwb25zZS5oZWFkZXJzW1wiY29udGVudC1lbmNvZGluZ1wiXSA9IFwiaWRlbnRpdHlcIjtcblx0XHRcdFx0aWYgKCQuaXNRdWFuWCgpKSB7XG5cdFx0XHRcdFx0c3dpdGNoIChGT1JNQVQpIHtcblx0XHRcdFx0XHRcdGNhc2UgdW5kZWZpbmVkOiAvLyDop4bkuLrml6Bib2R5XG5cdFx0XHRcdFx0XHRcdC8vIOi/lOWbnuaZrumAmuaVsOaNrlxuXHRcdFx0XHRcdFx0XHQkLmRvbmUoeyBzdGF0dXM6ICRyZXNwb25zZS5zdGF0dXMsIGhlYWRlcnM6ICRyZXNwb25zZS5oZWFkZXJzIH0pO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRcdC8vIOi/lOWbnuaZrumAmuaVsOaNrlxuXHRcdFx0XHRcdFx0XHQkLmRvbmUoeyBzdGF0dXM6ICRyZXNwb25zZS5zdGF0dXMsIGhlYWRlcnM6ICRyZXNwb25zZS5oZWFkZXJzLCBib2R5OiAkcmVzcG9uc2UuYm9keSB9KTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24vcHJvdG9idWZcIjpcblx0XHRcdFx0XHRcdGNhc2UgXCJhcHBsaWNhdGlvbi94LXByb3RvYnVmXCI6XG5cdFx0XHRcdFx0XHRjYXNlIFwiYXBwbGljYXRpb24vdm5kLmdvb2dsZS5wcm90b2J1ZlwiOlxuXHRcdFx0XHRcdFx0Y2FzZSBcImFwcGxpY2F0aW9uL2dycGNcIjpcblx0XHRcdFx0XHRcdGNhc2UgXCJhcHBsaWNhdGlvbi9ncnBjK3Byb3RvXCI6XG5cdFx0XHRcdFx0XHRjYXNlIFwiYXBwbGVjYXRpb24vb2N0ZXQtc3RyZWFtXCI6XG5cdFx0XHRcdFx0XHRcdC8vIOi/lOWbnuS6jOi/m+WItuaVsOaNrlxuXHRcdFx0XHRcdFx0XHQvLyQubG9nKGAkeyRyZXNwb25zZS5ib2R5Qnl0ZXMuYnl0ZUxlbmd0aH0tLS0keyRyZXNwb25zZS5ib2R5Qnl0ZXMuYnVmZmVyLmJ5dGVMZW5ndGh9YCk7XG5cdFx0XHRcdFx0XHRcdCQuZG9uZSh7IHN0YXR1czogJHJlc3BvbnNlLnN0YXR1cywgaGVhZGVyczogJHJlc3BvbnNlLmhlYWRlcnMsIGJvZHlCeXRlczogJHJlc3BvbnNlLmJvZHlCeXRlcy5idWZmZXIuc2xpY2UoJHJlc3BvbnNlLmJvZHlCeXRlcy5ieXRlT2Zmc2V0LCAkcmVzcG9uc2UuYm9keUJ5dGVzLmJ5dGVMZW5ndGggKyAkcmVzcG9uc2UuYm9keUJ5dGVzLmJ5dGVPZmZzZXQpIH0pO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9IGVsc2UgJC5kb25lKCRyZXNwb25zZSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fTtcblx0XHRcdGNhc2UgdW5kZWZpbmVkOiB7IC8vIOaXoOWbnuWkjeaVsOaNrlxuXHRcdFx0XHRicmVhaztcblx0XHRcdH07XG5cdFx0fTtcblx0fSlcblxuLyoqKioqKioqKioqKioqKioqIEZ1bmN0aW9uICoqKioqKioqKioqKioqKioqL1xuLyoqXG4gKiBtb2QgQnVpbGRcbiAqIEBhdXRob3IgVmlyZ2lsQ2x5bmVcbiAqIEBwYXJhbSB7T2JqZWN0fSBidWlsZCAtIEJ1aWxkXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbmZ1bmN0aW9uIG1vZEJ1aWxkKGJ1aWxkKSB7XG5cdHN3aXRjaCAoYnVpbGQucGxhdGZvcm0gfHwgYnVpbGQubmFtZSkge1xuXHRcdGNhc2UgXCJpb3NcIjpcblx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgaW9zYCwgXCJcIik7XG5cdFx0XHRidWlsZCA9IEJ1aWxkKGJ1aWxkKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJvc3hcIjpcblx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgb3N4YCwgXCJcIik7XG5cdFx0XHRpZiAoYnVpbGQ/Lm1hY0J1aWxkQ29tcGF0aWJpbGl0eT8ucnVuc09uQXBwbGVTaWxpY29uID09PSB0cnVlKSB7IC8vIOaYr+iLueaenOiKr+eJh1xuXHRcdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIHJ1bnNPbkFwcGxlU2lsaWNvbmAsIFwiXCIpO1xuXHRcdFx0XHRidWlsZCA9IEJ1aWxkKGJ1aWxkKTtcblx0XHRcdH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIFwiYXBwbGV0dm9zXCI6XG5cdFx0XHQkLmxvZyhg8J+apyAkeyQubmFtZX0sIGFwcGxldHZvc2AsIFwiXCIpO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdCQubG9nKGDwn5qnICR7JC5uYW1lfSwgdW5rbm93biBwbGF0Zm9ybTogJHtidWlsZC5wbGF0Zm9ybSB8fCBidWlsZC5uYW1lfWAsIFwiXCIpO1xuXHRcdFx0YnJlYWs7XG5cdH07XG5cdHJldHVybiBidWlsZFxuXG5cdGZ1bmN0aW9uIEJ1aWxkKGJ1aWxkKSB7XG5cdFx0Ly9pZiAoYnVpbGQudW5pdmVyc2FsID09PSB0cnVlKSB7XG5cdFx0XHRidWlsZC5jb21wYXRpYmxlID0gdHJ1ZTtcblx0XHRcdGJ1aWxkLnBsYXRmb3JtQ29tcGF0aWJsZSA9IHRydWU7XG5cdFx0XHRidWlsZC5oYXJkd2FyZUNvbXBhdGlibGUgPSB0cnVlO1xuXHRcdFx0YnVpbGQub3NDb21wYXRpYmxlID0gdHJ1ZTtcblx0XHRcdGlmIChidWlsZD8ucGVybWlzc2lvbikgYnVpbGQucGVybWlzc2lvbiA9IFwiaW5zdGFsbFwiO1xuXHRcdFx0aWYgKGJ1aWxkPy5kZXZpY2VGYW1pbHlJbmZvKSB7XG5cdFx0XHRcdGJ1aWxkLmRldmljZUZhbWlseUluZm8gPSBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJudW1iZXJcIjogMSxcblx0XHRcdFx0XHRcdFwibmFtZVwiOiBcImlPU1wiLFxuXHRcdFx0XHRcdFx0XCJpY29uVXJsXCI6IFwiaHR0cHM6Ly9pdHVuZXNjb25uZWN0LW1yLml0dW5lcy5hcHBsZS5jb20vaXRjL2ltZy9kZXZpY2UtaWNvbnMvZGV2aWNlX2ZhbWlseV9pY29uXzEucG5nXCJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwibnVtYmVyXCI6IDIsXG5cdFx0XHRcdFx0XHRcIm5hbWVcIjogXCJpUGFkXCIsXG5cdFx0XHRcdFx0XHRcImljb25VcmxcIjogXCJodHRwczovL2l0dW5lc2Nvbm5lY3QtbXIuaXR1bmVzLmFwcGxlLmNvbS9pdGMvaW1nL2RldmljZS1pY29ucy9kZXZpY2VfZmFtaWx5X2ljb25fMi5wbmdcIlxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJudW1iZXJcIjogMyxcblx0XHRcdFx0XHRcdFwibmFtZVwiOiBcIkFwcGxlIFRWXCIsXG5cdFx0XHRcdFx0XHRcImljb25VcmxcIjogXCJodHRwczovL2l0dW5lc2Nvbm5lY3QtbXIuaXR1bmVzLmFwcGxlLmNvbS9pdGMvaW1nL2RldmljZS1pY29ucy9kZXZpY2VfZmFtaWx5X2ljb25fMy5wbmdcIlxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XTtcblx0XHRcdH07XG5cdFx0XHRpZiAoYnVpbGQ/LmNvbXBhdGliaWxpdHlEYXRhPy5jb21wYXRpYmxlRGV2aWNlRmFtaWxpZXMpIHtcblx0XHRcdFx0YnVpbGQuY29tcGF0aWJpbGl0eURhdGEuY29tcGF0aWJsZURldmljZUZhbWlsaWVzID0gW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwibmFtZVwiOiBcImlQYWRcIixcblx0XHRcdFx0XHRcdFwibWluaW11bVN1cHBvcnRlZERldmljZVwiOiBudWxsLFxuXHRcdFx0XHRcdFx0XCJ1bnN1cHBvcnRlZERldmljZXNcIjogW11cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwibmFtZVwiOiBcImlQaG9uZVwiLFxuXHRcdFx0XHRcdFx0XCJtaW5pbXVtU3VwcG9ydGVkRGV2aWNlXCI6IG51bGwsXG5cdFx0XHRcdFx0XHRcInVuc3VwcG9ydGVkRGV2aWNlc1wiOiBbXVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJuYW1lXCI6IFwiaVBvZFwiLFxuXHRcdFx0XHRcdFx0XCJtaW5pbXVtU3VwcG9ydGVkRGV2aWNlXCI6IG51bGwsXG5cdFx0XHRcdFx0XHRcInVuc3VwcG9ydGVkRGV2aWNlc1wiOiBbXVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJuYW1lXCI6IFwiTWFjXCIsXG5cdFx0XHRcdFx0XHRcIm1pbmltdW1TdXBwb3J0ZWREZXZpY2VcIjogbnVsbCxcblx0XHRcdFx0XHRcdFwidW5zdXBwb3J0ZWREZXZpY2VzXCI6IFtdXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdO1xuXHRcdFx0fTtcblx0XHRcdGlmIChidWlsZC5tYWNCdWlsZENvbXBhdGliaWxpdHkpIHtcblx0XHRcdFx0YnVpbGQubWFjQnVpbGRDb21wYXRpYmlsaXR5LnJ1bnNPbkludGVsID0gdHJ1ZTtcblx0XHRcdFx0YnVpbGQubWFjQnVpbGRDb21wYXRpYmlsaXR5LnJ1bnNPbkFwcGxlU2lsaWNvbiA9IHRydWU7XG5cdFx0XHRcdC8qXG5cdFx0XHRcdGJ1aWxkLm1hY0J1aWxkQ29tcGF0aWJpbGl0eSA9IHtcblx0XHRcdFx0XHRcIm1hY0FyY2hpdGVjdHVyZXNcIjogW1wiQXBwbGVTaWxpY29uXCIsIFwiSW50ZWxcIl0sXG5cdFx0XHRcdFx0XCJyb3NldHRhQ29tcGF0aWJsZVwiOiB0cnVlLFxuXHRcdFx0XHRcdFwicnVuc09uSW50ZWxcIjogdHJ1ZSxcblx0XHRcdFx0XHRcInJ1bnNPbkFwcGxlU2lsaWNvblwiOiB0cnVlLFxuXHRcdFx0XHRcdFwicmVxdWlyZXNSb3NldHRhXCI6IGZhbHNlXG5cdFx0XHRcdH07XG5cdFx0XHRcdCovXG5cdFx0XHR9O1xuXHRcdC8vfTtcblx0XHRyZXR1cm4gYnVpbGRcblx0fTtcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=