import { createStore, applyMiddleware, combineReducers } from "redux"
import thunks from "redux-thunk"
import { createLogger } from "redux-logger"

export default class Cletus {
	static makeReducer() {
		if (this === Cletus) throw new Error("Failed to subclass Cletus.")

		this.__initialState = Reflect.construct(this, [])
		this.creators = {}

		const types = Object.getOwnPropertyNames(this.prototype).filter(
			name => name !== "constructor" && name[0] !== "_"
		)
		types.forEach(type => {
			if (this.prototype[type].length > 0)
				this.creators[type] = data => ({ type, data })
			else this.creators[type] = () => ({ type })
			this[type] = data => this.store.dispatch(this.creators[type](data))
		})

		this.__reducer = (state = this.__initialState, action) => {
			if (action.type in this.creators) return state[action.type](action.data)
			return state
		}
		return this.__reducer
	}

	static init() {
		this.makeReducer()
		this.store = createStore(
			this.__reducer,
			applyMiddleware(thunks, createLogger({ collapsed: true }))
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
			applyMiddleware(thunks, createLogger({ collapsed: true }))
		)
		classes.forEach(cls => {
			cls.store = this.store
			Object.keys(cls.creators).forEach(creatorName => {
				classes.forEach(otherCls => {
					if (otherCls !== cls && !otherCls[creatorName])
						otherCls[creatorName] = cls[creatorName]
				})
			})
		})
		return this.store
	}

	static getState() {
		return this.store.getState()
	}

	copy() {
		const that = Object.create(this)
		Object.keys(this).forEach(key => {
			that[key] = this[key]
		})
		return that
	}

	static from(obj) {
		const that = new this()
		Object.keys(obj).forEach(key => {
			that[key] = obj[key]
		})
		return that
	}

	update(obj) {
		const that = this.copy()
		Object.keys(obj).forEach(key => {
			that[key] = obj[key]
		})
		return that
	}

	add(obj) {
		const that = this.copy()
		Object.keys(obj).forEach(key => {
			that[key] = [...that[key], obj[key]]
		})
		return that
	}

	remove(obj) {
		const that = this.copy()
		Object.keys(obj).forEach(key => {
			that[key] = that[key].filter(elem => elem !== obj[key])
		})
		return that
	}

	removeById(obj) {
		const that = this.copy()
		Object.keys(obj).forEach(key => {
			that[key] = that[key].filter(elem => elem.id !== obj[key].id)
		})
	}

	updateById(obj) {
		const that = this.copy()
		Object.keys(obj).forEach(key => {
			that[key] = that[key].map(elem => {
				if (obj[key].id === elem.id) {
					const newElem = Object.create(elem)
					Object.keys(obj[key]).forEach(key_ => {
						newElem[key_] = obj[key][key_]
					})
					return newElem
				} else return elem
			})
		})
		return that
	}

	updateBy(key, obj) {
		const that = this.copy()
		Object.keys(obj).forEach(field => {
			that[field] = that[field].map(elem => {
				if (obj[field][key] === elem[key]) {
					const newElem = Object.create(elem)
					Object.keys(obj[field]).forEach(key__ => {
						newElem[key__] = obj[field][key__]
					})
					return newElem
				} else return elem
			})
		})
		return that
	}

	updateAll(obj) {
		const that = this.copy()
		Object.keys(obj).forEach(key => {
			that[key] = that[key].map(elem => obj[key]({ ...elem }))
		})
		return that
	}
}
