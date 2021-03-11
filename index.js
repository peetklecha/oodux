/* eslint-disable guard-for-in */
const { createStore, applyMiddleware, combineReducers } = require("redux")
const { methodName, allValidProperties, allGetters } = require("./utils")

class Cletus {
	static __getters = null
	static __makeReducer(topLevelClass) {
		if (this === Cletus) throw new Error("Failed to subclass Cletus.")

		this.topLevelClass = topLevelClass || this
		if (topLevelClass) {
			const userStatics = allValidProperties(this)
			this.__shareStatics(userStatics)
		}

		this.creators = {}
		const userTypes = allValidProperties(this.prototype)

		const initialState = new this()
		const fields = Object.entries(initialState)
		this.__tryToMakeDefaultMethods("clear", "", function () {
			return new this.constructor()
		})
		for (const entry of fields) this.__makeDefaultMethods(entry)

		userTypes.forEach(type =>
			this.topLevelClass.__makeUserMethods(type, this.prototype[type].length)
		)
		this.topLevelClass.__memoizeGetters(this.prototype)

		// userGetters.forEach(getter => this.topLevelClass.__memoizeGetter(getter))

		this.__reducer = (state = initialState, action) => {
			if (state[action.type]) return state[action.type](action.data)
			return state
		}
		return this.__reducer
	}

	static __makeUserMethods(type, numberOfArgs) {
		numberOfArgs = Math.max(
			numberOfArgs,
			this.creators[type] ? this.creators[type].length : 0
		)
		this.__makeCreator(type, numberOfArgs)
		this.__makeDispatcher(type, numberOfArgs)
	}

	static __makeCreator(type, args) {
		if (args > 1)
			throw new Error("Reducer methods should take at most one argument.")
		else if (args > 0) this.creators[type] = data => ({ type, data })
		else this.creators[type] = () => ({ type })
	}

	static __makeDispatcher(type, args) {
		if (args === 1)
			this[type] = data => {
				this.store.dispatch(this.creators[type](data))
			}
		else
			this[type] = () => {
				this.store.dispatch(this.creators[type]())
			}
	}

	static __memoizeGetters(prototype) {
		for (const [getterKey, descriptor] of allGetters(prototype)) {
			const _this = this
			this.__getters = this.__getters || {}
			const proxy = new Proxy(
				{},
				{
					get(_, stateKey) {
						const value = _this.getState()[stateKey]
						_this.__getters[getterKey].memo[stateKey] = value
						return value
					},
				}
			)
			this.__getters[getterKey] = {
				userGetter: descriptor.get.bind(proxy),
				memo: {},
				derivedValue: null,
				used: false,
			}
			Object.defineProperty(prototype, getterKey, {
				get() {
					const info = _this.__getters[getterKey]
					const state = _this.getState()
					const entries = Object.entries(info.memo)
					if (
						!info.used ||
						!entries.all(([key, value]) => state[key] === value)
					) {
						info.memo = {}
						const value = info.userGetter()
						info.derivedValue = value
					}
					info.used = true
					return info.derivedValue
				},
			})
		}
	}

	static __shareStatics(userStatics) {
		userStatics.forEach(method => (this.topLevelClass[method] = this[method]))
	}

	static __tryToMakeDefaultMethods(prefix, key, callback, suffix = "") {
		const name = methodName(prefix, key) + suffix
		const tlc = this.topLevelClass
		if (!this.prototype[name]) {
			this.prototype[name] = function (arg) {
				return callback.bind(this)(arg)
			}
			if (name in tlc.creators) {
				tlc.creators[name] = null
				tlc[name] = this.__warnCompetingDefaultMethods(name)
			} else {
				tlc.__makeCreator(name, callback.length)
				tlc.__makeDispatcher(name, callback.length)
				if (tlc.creatorSources) tlc.creatorSources[name] = this
			}
		}
	}

	static __warnOverloadedStaticMethod(name) {
		return () => {
			throw new Error(
				`Method ${name} is defined on multiple Cletus subclasses; you must invoke the method you want from the corresponding subclass directly.`
			)
		}
	}

	static __warnCompetingDefaultMethods(name) {
		return () => {
			throw new Error(
				`The action type ${name} could not be automatically created because multiple state-slices have the same property name. Instance methods for these state-slices are still available. `
			)
		}
	}

	static __makeDefaultMethods([_key, value]) {
		this.__tryToMakeDefaultMethods("set", _key, function (data) {
			return this.update({ [_key]: data })
		})

		if (typeof value === "boolean") {
			this.__tryToMakeDefaultMethods("toggle", _key, function () {
				return this.update({ [_key]: !this[_key] })
			})
		} else if (typeof value === "number") {
			this.__tryToMakeDefaultMethods("increment", _key, function (num) {
				return this.update({ [_key]: this[_key] + num })
			})
		} else if (typeof value === "object") {
			if (value.constructor === Array) {
				this.__tryToMakeDefaultMethods("addTo", _key, function (arr) {
					const newState = this.copy()
					newState[_key] = [...newState[_key], ...arr]
					return newState
				})
				this.__tryToMakeDefaultMethods(
					"update",
					_key,
					function ({ key, data }) {
						return this.updateBy(key, { [_key]: data })
					}
				)
				this.__tryToMakeDefaultMethods(
					"update",
					_key,
					function (obj) {
						return this.updateById({ [_key]: obj })
					},
					"ById"
				)
				this.__tryToMakeDefaultMethods("removeFrom", _key, function (data) {
					return this.remove({ [key]: data })
				})
				this.__tryToMakeDefaultMethods(
					"removeFrom",
					_key,
					function (id) {
						return this.removeById({ [_key]: id })
					},
					"ById"
				)
			}
		}
	}

	static wrapMiddleware(...middlewares) {
		this.wrappingMiddleware = middlewares
		return this
	}

	static applyMiddleware(...middlewares) {
		this.middleware = middlewares
		return this
	}

	static __makeMiddleware() {
		let middleware = applyMiddleware(...this.middleware)
		for (const wrapper of this.wrappingMiddleware) {
			middleware = wrapper(middleware)
		}
		return middleware
	}

	static init() {
		if (this.store)
			throw new Error(
				"Store has already been initialized. If using combineClasses, do not call Cletus.init."
			)
		this.store = createStore(this.__makeReducer(), this.__makeMiddleware())
		return this.store
	}

	static combineClasses(...classes) {
		this.creators = {}
		this.creatorSources = {}
		const reducers = classes.reduce(
			(obj, cls) => ({
				...obj,
				[cls.name.toLowerCase()]: cls.__makeReducer(this),
			}),
			{}
		)
		this.store = createStore(combineReducers(reducers), this.__makeMiddleware())
		return this.store
	}

	static getState() {
		return this.store.getState()
	}

	__imitate(obj) {
		for (let key of Object.keys(obj)) {
			this[key] = obj[key]
		}
		return this
	}

	__imitateExistingProps(obj) {
		for (let key of Object.keys(this)) {
			if (key in obj) this[key] = obj[key]
		}
		return this
	}

	copy() {
		const output = new this.constructor()
		output.__imitate(this)
		return output
	}

	static from(obj) {
		return new this().__imitateExistingProps(obj)
	}

	update(obj) {
		const copy = this.copy()
		const output = copy.__imitateExistingProps(obj)
		return output
	}

	add(obj) {
		const that = this.copy()
		for (let key in obj) {
			that[key] = [...that[key], obj[key]]
		}
		return that
	}

	remove(obj) {
		const that = this.copy()
		for (let key in obj) {
			that[key] = that[key].filter(elem => elem !== obj[key])
		}
		return that
	}

	removeById(obj) {
		const that = this.copy()
		for (let key in obj) {
			that[key] = that[key].filter(elem => elem.id !== obj[key])
		}
	}

	updateById(obj) {
		const that = this.copy()
		for (let key in obj) {
			that[key] = that[key].map(elem => {
				if (obj[key].id === elem.id) {
					const newElem = Object.create(elem)
					for (let key_ in obj[key]) {
						newElem[key_] = obj[key][key_]
					}
					return newElem
				} else return elem
			})
		}
		return that
	}

	updateBy(key, obj) {
		const that = this.copy()
		for (let field in obj) {
			that[field] = that[field].map(elem => {
				if (obj[field][key] === elem[key]) {
					const newElem = Object.create(elem)
					for (let key_ in obj[field]) {
						newElem[key_] = obj[field][key_]
					}
					return newElem
				} else return elem
			})
		}
		return that
	}

	updateAll(obj) {
		const that = this.copy()
		for (let key in obj) {
			that[key] = that[key].map(elem => obj[key]({ ...elem }))
		}
		return that
	}
}

Cletus.middleware = []
Cletus.wrappingMiddleware = []
Cletus.topLevelClass = Cletus
module.exports = Cletus
