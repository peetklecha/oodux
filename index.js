/* eslint-disable guard-for-in */
import { createStore, applyMiddleware, combineReducers } from "redux"
import { methodName } from "./utils"

export default class Cletus {
	static __makeReducer(topLevelClass) {
		if (this === Cletus) throw new Error("Failed to subclass Cletus.")

		this.topLevelClass = topLevelClass || this
		this.creators = {}
		const initialState = new this()
		const fields = Object.entries(initialState)
		for (const entry of fields) this.__makeDefaultCreators(entry)

		const properties = Object.getOwnPropertyDescriptors(this.prototype)
		const types = Object.keys(properties).filter(
			name => name !== "constructor" && name[0] !== "_" && !properties[name].get
		)
		types.forEach(type => this.__makeCreator(type, this.prototype[type].length))

		this.__reducer = (state = initialState, action) => {
			if (action.type in this.creators) return state[action.type](action.data)
			return state
		}
		return this.__reducer
	}

	static __makeCreator(type, args) {
		if (args > 1)
			throw new Error("Reducer methods should have at most one argument.")
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

	static __makeAllDispatchers(classes) {
		this.creators = {}
		const types = {}
		for (const cls of classes) {
			for (const type in cls.creators) {
				types[type] = types[type] || []
				types[type].push(cls)
			}
		}
		for (const type in types) {
			const length = +types[type].some(cls => cls.prototype[type].length > 0)
			// if (types[type].length > 1) {
			// 	this[type] = this.__warnOverloadedStaticMethod(type)
			// 	for (const cls of types[type]) cls.__makeDispatcher(type, length)
			// } else {
			this.__makeCreator(type, length)
			this.__makeDispatcher(type, length)
			// }
		}
	}

	static __shareAllStaticMethods(classes) {}

	static __tryToMakeDefaultCreator(prefix, key, callback, suffix = "") {
		const name = methodName(prefix, key) + suffix
		if (!this.prototype[name]) {
			this.prototype[name] = function (arg) {
				return callback.bind(this)(arg)
			}
			this.__makeCreator(name, callback.length)
		}
	}

	static __warnOverloadedStaticMethod(name) {
		return () => {
			throw new Error(
				`Method ${name} is defined on multiple Cletus subclasses; you must invoke the method you want from the corresponding subclass directly.`
			)
		}
	}

	static __makeDefaultCreators([_key, value]) {
		this.__tryToMakeDefaultCreator("set", _key, function (data) {
			return this.update({ [_key]: data })
		})

		if (typeof value === "boolean") {
			this.__tryToMakeDefaultCreator("toggle", _key, function () {
				return this.update({ [_key]: !this[_key] })
			})
		} else if (typeof value === "number") {
			this.__tryToMakeDefaultCreator("increment", _key, function (num) {
				return this.update({ [_key]: this[_key] + num })
			})
		} else if (typeof value === "object") {
			if (value.constructor === Array) {
				this.__tryToMakeDefaultCreator("addTo", _key, function (...objs) {
					const newState = this.copy()
					newState[_key] = [...newState[_key], ...objs]
					return newState
				})
				this.__tryToMakeDefaultCreator("update", _key, function ({
					key,
					data,
				}) {
					return this.updateBy(key, { [_key]: data })
				})
				this.__tryToMakeDefaultCreator(
					"update",
					_key,
					function (obj) {
						return this.updateById({ [_key]: obj })
					},
					"ById"
				)
				this.__tryToMakeDefaultCreator("removeFrom", _key, function (data) {
					return this.remove({ [key]: data })
				})
				this.__tryToMakeDefaultCreator(
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
		for (const key in this.creators)
			this.__makeDispatcher(key, this.creators[key].length)
		return this.store
	}

	static combineClasses(...classes) {
		const reducers = classes.reduce(
			(obj, cls) => ({ ...obj, [cls.name.toLowerCase()]: cls.__makeReducer() }),
			{}
		)
		this.store = createStore(combineReducers(reducers), this.__makeMiddleware())
		this.__makeAllDispatchers(classes)
		this.__shareAllStaticMethods(classes)
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
		console.log("obj", obj)
		console.log("this", this)
		const copy = this.copy()
		console.log("copy", copy)
		const output = copy.__imitateExistingProps(obj)
		console.log("output", output)
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
