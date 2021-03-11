import Cletus from ".."

export class State extends Cletus {
	constructor() {
		super()
		this.user = {}
		this.pets = []
		this.nightTheme = false
		this.error = null
		this.current = null
	}

	//async actions
	static login = async (email, password) => {
		try {
			const { data } = await axios.post("/auth/login", { email, password })
			this.setUser(data)
		} catch (error) {
			this.setError(error)
		}
	}

	static logout = async () => {
		try {
			await axios.post("/auth/logout")
			this.removeUser()
		} catch (error) {
			this.setError(error)
		}
	}

	static getPets = async () => {
		try {
			const { id } = this.getState().user
			const { data } = await axios.get(`/api/users/${id}/pets`)
			this.setPets(data)
		} catch (error) {
			this.setError(error)
		}
	}

	static addPet = async newPet => {
		try {
			const { id } = this.getState().user
			const { data } = await axios.post(`/api/users/${id}pets`, newPet)
			this.addToPets(data)
		} catch (error) {
			this.setError(error)
		}
	}

	static editPet = async pet => {
		try {
			const { id } = this.getState().user
			const { data } = await axios.put(`/api/users/${id}/pets/${pet.id}`, pet)
			this.updatePetsById(data)
		} catch (error) {
			this.setError(error)
		}
	}

	static deletePet = async pet => {
		try {
			const { id } = this.getState().user
			await axios.delete(`/api/users/${id}/pets/${pet.id}`)
			this.removeFromPets(pet)
		} catch (error) {
			this.setError(error)
		}
	}

	//getter exposes processed data
	get highestRankedPet() {
		return this.pets.reduce((bestPet, currentPet) =>
			currentPet.rank > bestPet.rank ? currentPet : bestPet
		)
	}

	//reducer
	removeUser() {
		//overwrites default removeUser behavior
		return new State()
	}
	_pickRandomPet() {
		//utility function, will not correspond to action creator or dispatcher
		const idx = Math.floor(Math.random() * this.pets.length)
		return this.pets[idx]
	}
	selectRandomPet() {
		//using built-in setCurrent reducing method, but not its corresponding action creator or dispatcher
		return this.setCurrent(this._pickRandomPet())
	}
}

export default State.init()

export const {
	login,
	logout,
	getPets,
	addPet,
	editPet,
	deletePet,
	selectRandomPet,
	setCurrent,
	toggleView,
} = State
