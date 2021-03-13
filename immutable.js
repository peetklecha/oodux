export default class ImmutableState {
	clear() {
		return new this.constructor()
	}

	__imitate(obj) {
		for (const [key, value] of Object.entries(obj)) {
			this[key] = value
		}
		return this
	}

	__imitateExistingProps(obj) {
		for (const key of Object.keys(this)) {
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
		const output = this.copy()
		for (const key in obj) {
			output[key] = [...output[key], obj[key]]
		}
		return output
	}

	remove(obj) {
		const output = this.copy()
		for (const key in obj) {
			output[key] = output[key].filter(elem => elem !== obj[key])
		}
		return output
	}

	removeById(obj) {
		const output = this.copy()
		for (const key in obj) {
			output[key] = output[key].filter(elem => elem.id !== obj[key])
		}
		return output
	}

	updateById(obj) {
		return this.updateBy("id", obj)
	}

	updateBy(idKey, obj) {
		const output = this.copy()
		for (const key in obj) {
			output[key] = output[key].map(elem => {
				if (obj[key][idKey] === elem[idKey]) {
					const newElem = Object.create(elem)
					for (const elemKey in obj[key]) {
						newElem[elemKey] = obj[key][elemKey]
					}
					return newElem
				} else return elem
			})
		}
		return output
	}

	updateAll(obj) {
		const output = this.copy()
		for (const key in obj) {
			output[key] = output[key].map(elem => obj[key]({ ...elem }))
		}
		return output
	}
}

function mapToObj(obj, callback, initialValue = {}) {
	for (const key in obj) {
		initialValue[key] = callback(key, initialValue, obj)
	}
	return initialValue
}
