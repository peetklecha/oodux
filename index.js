const { createStore, applyMiddleware, combineReducers } = require("redux")
const {
	methodName,
	allValidProperties,
	allGetters,
	pascalToCamel,
	competingDefaultMethods,
} = require("./utils.js")
const ImmutableState = require("./immutable.js")

class Oodux extends ImmutableState {
	static __init(topLevelClass) {
		if (this === Oodux) throw new Error("Failed to subclass Oodux.")
		this.__creators = {}
		this.__initialState = new this()
		this.__syncClasses(topLevelClass)
		this.__makeUserMethods()
		this.__makeDefaultMethods()
		this.__memoizeGetters()
		this.__reducer = this.__reducer.bind(this)
	}

	static __reducer(state, action) {
		state = state || this.__initialState
		if (state[action.type]) return state[action.type](action.data)
		return state
	}

	static __makeUserMethods() {
		const cls = this.__topLevelClass
		for (const type of allValidProperties(this.prototype)) {
			const numberOfArgs = Math.max(
				this.prototype[type].length,
				cls.__creators[type] ? cls.__creators[type].length : 0
			)
			cls.__makeCreator(type, numberOfArgs)
			cls.__makeDispatcher(type, numberOfArgs)
		}
	}

	static __makeCreator(type, args) {
		if (args > 1)
			throw new Error("Reducer methods should take at most one argument.")
		this.__creators[type] =
			args === 1 ? data => ({ type, data }) : () => ({ type })
	}

	static __makeDispatcher(type, args) {
		this[type] =
			args === 1
				? data => {
						this.store.dispatch(this.__creators[type](data))
				  }
				: () => {
						this.store.dispatch(this.__creators[type]())
				  }
	}

	static __createGetterMemo(getterKey, descriptor) {
		const userGetter = descriptor.get.bind(
			new Proxy(this, {
				get(target, stateKey) {
					const value = target.getSlice()[stateKey]
					target.__getters[getterKey].componentValues[stateKey] = value
					return value
				},
			})
		)
		this.__getters[getterKey] = {
			userGetter,
			componentValues: {},
			targetValue: null,
			used: false,
		}
	}

	static __overrideUserGetter(prototype, getterKey) {
		Object.defineProperty(prototype, getterKey, {
			get: () => {
				const memo = this.__getters[getterKey]
				const state = this.getSlice()
				const values = Object.entries(memo.componentValues)
				if (
					!memo.used ||
					!values.every(([key, value]) => state[key] === value)
				) {
					memo.componentValues = {}
					memo.targetValue = memo.userGetter()
					memo.used = true
				}
				return memo.targetValue
			},
		})
	}

	static __memoizeGetters() {
		const getters = allGetters(this.prototype)
		if (getters.length) this.__getters = this.__getters || {}
		for (const [getterKey, descriptor] of getters) {
			this.__createGetterMemo(getterKey, descriptor)
			this.__overrideUserGetter(this.prototype, getterKey)
		}
	}

	static __syncClasses(topLevelClass) {
		this.__topLevelClass = topLevelClass || this
		if (topLevelClass)
			for (const method of allValidProperties(this)) {
				this.__topLevelClass[method] = this[method]
			}
	}

	static __tryToMakeDefaultMethods(prefix, key, callback) {
		const name = methodName(prefix, key)
		const tlc = this.__topLevelClass
		if (!this.prototype[name]) {
			this.prototype[name] = function (arg) {
				return callback.call(this, arg)
			}
			if (name in tlc.__creators) {
				tlc.__creators[name] = null
				tlc[name] = competingDefaultMethods(name)
			} else {
				tlc.__makeCreator(name, callback.length)
				tlc.__makeDispatcher(name, callback.length)
			}
		}
	}

	static __makeDefaultMethods() {
		for (const [key, value] of Object.entries(this.__initialState)) {
			this.__makeUniversalDefaultMethods(key)
			if (typeof value === "boolean") this.__makeBooleanDefaultMethods(key)
			else if (typeof value === "number") this.__makeNumberDefaultMethods(key)
			else if (typeof value === "object") {
				if (Array.isArray(value)) this.__makeArrayDefaultMethods(key)
			}
		}
	}

	static __makeUniversalDefaultMethods(key) {
		this.__tryToMakeDefaultMethods("set", key, function (data) {
			return this.update({ [key]: data })
		})
		const defaultValue = this.__initialState[key]
		this.__tryToMakeDefaultMethods("clear", key, function () {
			return this.update({ [key]: defaultValue })
		})
	}

	static __makeBooleanDefaultMethods(key) {
		this.__tryToMakeDefaultMethods("toggle", key, function () {
			return this.update({ [key]: !this[key] })
		})
	}

	static __makeNumberDefaultMethods(key) {
		this.__tryToMakeDefaultMethods("increment", key, function (num) {
			return this.update({ [key]: this[key] + num })
		})
	}

	static __makeArrayDefaultMethods(_key) {
		this.__tryToMakeDefaultMethods("addTo", _key, function (arr) {
			const newState = this.copy()
			newState[_key] = [...newState[_key], ...arr]
			return newState
		})
		this.__tryToMakeDefaultMethods("update", _key, function ({ key, data }) {
			return this.updateBy(key, { [_key]: data })
		})
		this.__tryToMakeDefaultMethods(
			k => `update${k}ById`,
			_key,
			function (obj) {
				return this.updateById({ [_key]: obj })
			}
		)
		this.__tryToMakeDefaultMethods("removeFrom", _key, function (data) {
			return this.remove({ [_key]: data })
		})
		this.__tryToMakeDefaultMethods(
			k => `removeFrom${k}ById`,
			_key,
			function (id) {
				return this.removeById({ [_key]: id })
			}
		)
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
				"Store has already been initialized. If using initSlices, do not call Oodux.init."
			)
		this.__slices = false

		this.__init()
		this.store = createStore(this.__reducer, this.__makeMiddleware())
		return this.store
	}

	static initSlices(...classes) {
		this.__creators = {}
		this.__slices = true

		const reducers = {}
		for (const cls of classes) {
			cls.__init(this)
			reducers[pascalToCamel(cls.name)] = cls.__reducer
		}
		this.store = createStore(combineReducers(reducers), this.__makeMiddleware())
		return this.store
	}

	static getState() {
		return this.store.getState()
	}

	static getSlice() {
		return this.__slices
			? this.store.getState()[pascalToCamel(this.name)]
			: this.store.getState()
	}
}

Oodux.middleware = []
Oodux.wrappingMiddleware = []
Oodux.__topLevelClass = Oodux
Oodux.__getters = null

module.exports = Oodux
