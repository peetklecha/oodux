/* eslint-disable guard-for-in */
import { createStore, applyMiddleware, combineReducers } from "redux"

export default class Cletus {
	static makeReducer() {
		if (this === Cletus) throw new Error("Failed to subclass Cletus.")

		this.creators = {}

		const types = Object.getOwnPropertyNames(this.prototype).filter(
			name => name !== "constructor" && name[0] !== "_"
		)
		types.forEach(type => {
			if (this.prototype[type].length > 1)
				throw new Error("Reducer methods should have at most one argument.")
			else if (this.prototype[type].length > 0)
				this.creators[type] = data => ({ type, data })
			else this.creators[type] = () => ({ type })
			this[type] = data => this.store.dispatch(this.creators[type](data))
		})

		this.__reducer = (state = new this(), action) => {
			if (action.type in this.creators) return state[action.type](action.data)
			return state
		}
		return this.__reducer
	}

	static applyMiddleware(...middlewares) {
		this.middleware = middlewares
		return this
	}

	static init() {
		this.store = createStore(
			this.makeReducer(),
			applyMiddleware(...this.middleware)
		)
		return this.store
	}

	static combineClasses(...classes) {
		const reducers = classes.reduce(
			(obj, cls) => ({ ...obj, [cls.name.toLowerCase()]: cls.makeReducer() }),
			{}
		)
		this.store = createStore(
			combineReducers(reducers),
			applyMiddleware(...this.middleware)
		)
		classes.forEach(cls => {
			cls.store = this.store
			for (let creatorName in cls.creators) {
				classes.forEach(otherCls => {
					if (otherCls !== cls && !otherCls[creatorName])
						otherCls[creatorName] = cls[creatorName]
				})
			}
		})
		return this.store
	}

	static getState() {
		return this.store.getState()
	}

	imitate(obj) {
		for (let key in obj) {
			this[key] = obj[key]
		}
		return this
	}

	copy() {
		return Object.create(this).imitate(this)
	}

	static from(obj) {
		return new this().imitate(obj)
	}

	update(obj) {
		return this.copy().imitate(obj)
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
