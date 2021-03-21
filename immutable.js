module.exports = class ImmutableState {
	clear() {
		return new this.constructor()
	}

	__imitate(obj) {
		return this.__map(obj, (_, value) => value, this)
	}

	__imitateExistingProps(obj) {
		for (const key of Object.keys(this)) {
			if (key in obj) this[key] = obj[key]
		}
		return this
	}

	__map(obj, callback, output) {
		output = output || this.copy()
		for (const [key, value] of Object.entries(obj)) {
			output[key] = callback(output[key], value)
		}
		return output
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
		return this.__map(obj, (base, value) => [...base, value])
	}

	remove(obj) {
		return this.__map(obj, (base, value) => base.filter(elem => elem !== value))
	}

	removeBy(key, obj) {
		return this.__map(obj, (base, value) =>
			base.filter(elem => elem[key] !== value)
		)
	}

	removeById(obj) {
		return this.removeBy("id", obj)
	}

	updateById(obj) {
		return this.updateBy("id", obj)
	}

	updateBy(idKey, obj) {
		return this.__map(obj, (base, value) =>
			base.map(elem => {
				if (value[idKey] === elem[idKey]) {
					const newElem = Object.create(elem)
					for (const elemKey in value) {
						newElem[elemKey] = value[elemKey]
					}
					return newElem
				} else return elem
			})
		)
	}

	updateAll(obj) {
		return this.__map(obj, (base, value) =>
			base.map(elem => value({ ...elem }))
		)
	}
}
