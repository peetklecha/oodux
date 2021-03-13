import { beforeEach, describe, it, expect } from "@jest/globals"
import _Oodux from "./index.js"

class Oodux extends _Oodux {}
class State extends Oodux {
	constructor() {
		super()
		this.counter = 0
		this.data = []
		this.flag = false
	}

	incrementByTwo() {
		return this.setCounter(this.counter + 2)
	}

	setFlag() {
		return this.update({ flag: true })
	}
}

const singleStore = State.init()

class User extends Oodux {
	constructor() {
		super()
		this.id = 0
		this.friends = []
		this.error = false
		this.data = []
	}

	static fetchFriends = async () => {
		const data = [1, 2, 3, 4, 5]
		this.setFriends(data)
	}

	clearFriends() {
		return this.setFriends([])
	}

	clearUser() {
		return new User()
	}

	recordDate() {
		return this.addToData([new Date()])
	}
}

class Products extends Oodux {
	constructor() {
		super()
		this.products = []
		this.coupons = []
		this.data = []
	}

	clearUser() {
		return new Products()
	}
}

const multiStore = Oodux.initSlices(User, Products)

describe("Oodux.init", () => {
	const state = singleStore.getState()
	it("creates initial state properly", () => {
		expect(state.counter).toBe(0)
		expect(state.data.length).toBe(0)
		expect(state.flag).toBe(false)
	})
	it("creates default reducing methods properly", () => {
		expect(typeof state.setCounter).toBe("function")
		expect(typeof state.incrementCounter).toBe("function")
	})
	it("creates default creators properly", () => {
		expect(typeof State.__creators.setCounter).toBe("function")
		expect(typeof State.__creators.incrementCounter).toBe("function")
		expect(State.__creators.toggleFlag()).toEqual({
			type: "toggleFlag",
		})
		expect(State.__creators.addToData([1, 2, 3])).toEqual({
			type: "addToData",
			data: [1, 2, 3],
		})
	})
	it("creates default dispatchers properly", () => {
		expect(typeof State.setCounter).toBe("function")
	})
	it("default dispatcher-creator-reducer chain works", () => {
		State.toggleFlag()
		expect(state.flag).not.toBe(singleStore.getState().flag)
	})
	it("creates user creators properly", () => {
		expect(typeof State.__creators.incrementByTwo).toBe("function")
	})
	it("creates user dispatching methods properly", () => {
		expect(typeof State.incrementByTwo).toBe("function")
	})
	it("user dispatcher-creator-reducer chain works", () => {
		State.incrementByTwo()
		expect(State.getState().counter - state.counter).toBe(2)
	})
	it("overrides default methods with user-made ones", () => {
		expect(typeof State.setFlag).toBe("function")
		expect(State.setFlag.length).toBe(0)
		expect(State.getState().flag).toBe(true)
		State.setFlag()
		expect(State.getState().flag).toBe(true)
	})
})

describe("Oodux.initSlices", () => {
	it("puts all unique creators onto the parent class", () => {
		expect(typeof Oodux.__creators.setId).toBe("function")
		expect(typeof Oodux.__creators.setProducts).toBe("function")
		expect(typeof Oodux.__creators.clearFriends).toBe("function")
	})
	it("puts all unique dispatchers onto the parent class", () => {
		expect(typeof Oodux.setId).toBe("function")
		expect(typeof Oodux.setProducts).toBe("function")
		expect(typeof Oodux.clearFriends).toBe("function")
	})
	it("dispatches from parent class correctly", () => {
		expect(Oodux.getState().user.id).toBe(0)
		Oodux.setId(7)
		expect(Oodux.getState().user.id).toBe(7)
	})
	it("dispatches from child class correctly", () => {
		expect(Oodux.getState().user.error).toBe(false)
		State.toggleError()
		expect(Oodux.getState().user.error).toBe(true)
	})
	it("dispatches from other child class correctly", () => {
		expect(Oodux.getState().user.error).toBe(true)
		Products.toggleError()
		expect(Oodux.getState().user.error).toBe(false)
	})
	it("makes async actions available on the parent class", () => {
		expect(typeof User.fetchFriends).toBe("function")
		expect(typeof Products.fetchFriends).toBe("function")
		expect(typeof Oodux.fetchFriends).toBe("function")
	})
	it("handles same-named user methods", () => {
		User.setId(12)
		Products.setProducts([1, 2, 3])
		expect(Oodux.getState().user.id).toBe(12)
		expect(Oodux.getState().products.products).toEqual([1, 2, 3])
		Oodux.clearUser()
		expect(Oodux.getState().user.id).toBe(0)
		expect(Oodux.getState().products.products).toEqual([])
	})
	it("handles same-named user properties", () => {
		expect(typeof User.prototype.setData).toBe("function")
		expect(typeof Products.prototype.setData).toBe("function")
		expect(Oodux.__creators.setData).toBe(null)
		let errored
		try {
			User.setData()
			errored = false
		} catch (err) {
			errored = true
		}
		expect(errored).toBe(true)
		expect(Oodux.getState().user.data.length).toBe(0)
		Oodux.recordDate()
		expect(Oodux.getState().user.data.length).toBe(1)
	})
})

class Oodux2 extends _Oodux {}

let calls = 0
class State2 extends Oodux2 {
	constructor() {
		super()
		this.a = 1
		this.b = 2
		this.c = 3
		this.d = 4
	}

	get derived() {
		calls++
		return this.a + this.b + this.c
	}
}

State2.init()

describe("Oodux memoized getters", () => {
	beforeEach(() => {
		calls = 0
	})
	it("only calls user-defined getter when relevant state components have been updated", () => {
		expect(calls).toBe(0)
		expect(State2.getState().derived).toBe(6)
		expect(calls).toBe(1)
		expect(State2.getState().derived).toBe(6)
		expect(calls).toBe(1)
		State2.incrementA(1)
		expect(State2.getState().derived).toBe(7)
		expect(calls).toBe(2)
		State2.incrementD(1)
		expect(State2.getState().derived).toBe(7)
		expect(calls).toBe(2)
	})
})
