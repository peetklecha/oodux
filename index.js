import { createStore, applyMiddleware, combineReducers } from "redux"
import {
	methodName,
	allValidProperties,
	allGetters,
	pascalToCamel,
} from "./utils.js"
import ImmutableState from "./immutable.js"

export default class Oodux extends ImmutableState {
	static __init(topLevelClass) {
		if (this === Oodux) throw new Error("Failed to subclass Oodux.")
		this.__creators = {}
		this.__syncClasses(topLevelClass)
		this.__makeUserMethods()
		this.__makeDefaultMethods()
		this.__memoizeGetters()
		this.__reducer = this.__reducer.bind(this)
	}

	static __reducer(state, action) {
		state = state || new this()
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
		else if (args > 0) this.__creators[type] = data => ({ type, data })
		else this.__creators[type] = () => ({ type })
	}

	static __makeDispatcher(type, args) {
		if (args === 1)
			this[type] = data => {
				this.store.dispatch(this.__creators[type](data))
			}
		else
			this[type] = () => {
				this.store.dispatch(this.__creators[type]())
			}
	}

	static __createGetterMemo(getterKey, descriptor) {
		const userGetter = descriptor.get.bind(
			new Proxy(this, {
				get(target, stateKey) {
					const value = target.getSlice()[stateKey]
					target.__getters[getterKey].memo[stateKey] = value
					return value
				},
			})
		)
		this.__getters[getterKey] = {
			userGetter,
			memo: {},
			derivedValue: null,
			used: false,
		}
	}

	static __overrideUserGetter(prototype, getterKey) {
		Object.defineProperty(prototype, getterKey, {
			get: () => {
				const info = this.__getters[getterKey]
				const state = this.getSlice()
				const memos = Object.entries(info.memo)
				if (
					!info.used ||
					!memos.every(([key, value]) => state[key] === value)
				) {
					info.memo = {}
					info.derivedValue = info.userGetter()
					info.used = true
				}
				return info.derivedValue
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

	static __tryToMakeDefaultMethods(prefix, key, callback, suffix = "") {
		const name = methodName(prefix, key) + suffix
		const tlc = this.__topLevelClass
		if (!this.prototype[name]) {
			this.prototype[name] = function (arg) {
				return callback.call(this, arg)
			}
			if (name in tlc.__creators) {
				tlc.__creators[name] = null
				tlc[name] = this.__warnCompetingDefaultMethods(name)
			} else {
				tlc.__makeCreator(name, callback.length)
				tlc.__makeDispatcher(name, callback.length)
			}
		}
	}

	static __warnCompetingDefaultMethods(name) {
		return () => {
			throw new Error(
				`The action type ${name} could not be automatically created because multiple state-slices have the same property name. Instance methods for these state-slices are still available. `
			)
		}
	}

	static __makeDefaultMethods() {
		for (const [key, value] of Object.entries(new this())) {
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
			"update",
			_key,
			function (obj) {
				return this.updateById({ [_key]: obj })
			},
			"ById"
		)
		this.__tryToMakeDefaultMethods("removeFrom", _key, function (data) {
			return this.remove({ [_key]: data })
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
