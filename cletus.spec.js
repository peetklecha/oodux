const { expect } = require("chai")
const Cletus = require("./index.js")

class Cletus_ extends Cletus {}
class State extends Cletus_ {
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

class User extends Cletus {
	constructor() {
		super()
		this.id = 0
		this.friends = []
		this.error = false
		this.data = []
	}

	static async fetchFriends() {
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

class Products extends Cletus {
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

const multiStore = Cletus.combineClasses(User, Products)

describe("{CletusSubclass}.init", () => {
	const state = singleStore.getState()
	it("creates initial state properly", () => {
		expect(state.counter).to.be.equal(0)
		expect(state.data.length).to.be.equal(0)
		expect(state.flag).to.be.equal(false)
	})
	it("creates default reducing methods properly", () => {
		expect(state.setCounter).to.be.a("function")
		expect(state.incrementCounter).to.be.a("function")
	})
	it("creates default creators properly", () => {
		expect(State.creators.setCounter).to.be.a("function")
		expect(State.creators.incrementCounter).to.be.a("function")
		expect(State.creators.toggleFlag()).to.deep.equal({
			type: "toggleFlag",
		})
		expect(State.creators.addToData([1, 2, 3])).to.deep.equal({
			type: "addToData",
			data: [1, 2, 3],
		})
	})
	it("creates default dispatchers properly", () => {
		expect(State.setCounter).to.be.a("function")
	})
	it("default dispatcher-creator-reducer chain works", () => {
		State.toggleFlag()
		expect(state.flag).to.not.equal(singleStore.getState().flag)
	})
	it("creates user creators properly", () => {
		expect(State.creators.incrementByTwo).to.be.a("function")
	})
	it("creates user dispatching methods properly", () => {
		expect(State.incrementByTwo).to.be.a("function")
	})
	it("user dispatcher-creator-reducer chain works", () => {
		State.incrementByTwo()
		expect(State.getState().counter - state.counter).to.equal(2)
	})
	it("overrides default methods with user-made ones", () => {
		expect(State.setFlag).to.be.a("function")
		expect(State.setFlag.length).to.be.equal(0)
		expect(State.getState().flag).to.be.equal(true)
		State.setFlag()
		expect(State.getState().flag).to.be.equal(true)
	})
})

describe("Cletus.combineClasses", () => {
	it("puts all unique creators onto the parent class", () => {
		expect(Cletus.creators.setId).to.be.a("function")
		expect(Cletus.creators.setProducts).to.be.a("function")
		expect(Cletus.creators.clearFriends).to.be.a("function")
	})
	it("puts all unique dispatchers onto the parent class", () => {
		expect(Cletus.setId).to.be.a("function")
		expect(Cletus.setProducts).to.be.a("function")
		expect(Cletus.clearFriends).to.be.a("function")
	})
	it("dispatches from parent class correctly", () => {
		expect(Cletus.getState().user.id).to.equal(0)
		Cletus.setId(7)
		expect(Cletus.getState().user.id).to.equal(7)
	})
	it("dispatches from child class correctly", () => {
		expect(Cletus.getState().user.error).to.equal(false)
		State.toggleError()
		expect(Cletus.getState().user.error).to.equal(true)
	})
	it("dispatches from other child class correctly", () => {
		expect(Cletus.getState().user.error).to.equal(true)
		Products.toggleError()
		expect(Cletus.getState().user.error).to.equal(false)
	})
	it("makes async actions available on the parent class", () => {
		expect(User.fetchFriends).to.be.a("function")
		expect(Products.fetchFriends).to.be.a("function")
		expect(Cletus.fetchFriends).to.be.a("function")
	})
	it("handles same-named user methods", () => {
		User.setId(12)
		Products.setProducts([1, 2, 3])
		expect(Cletus.getState().user.id).to.be.equal(12)
		expect(Cletus.getState().products.products).to.deep.equal([1, 2, 3])
		Cletus.clearUser()
		expect(Cletus.getState().user.id).to.be.equal(0)
		expect(Cletus.getState().products.products).to.deep.equal([])
	})
	it("handles same-named user properties", () => {
		expect(User.prototype.setData).to.be.a("function")
		expect(Products.prototype.setData).to.be.a("function")
		expect(Cletus.creators.setData).to.be.equal(null)
		let errored
		try {
			User.setData()
			errored = false
		} catch (err) {
			errored = true
		}
		expect(errored).to.be.equal(true)
		expect(Cletus.getState().user.data.length).to.equal(0)
		Cletus.recordDate()
		expect(Cletus.getState().user.data.length).to.equal(1)
	})
})
