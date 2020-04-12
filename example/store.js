import Cletus from ".."

export class State extends Cletus {
	constructor() {
		super()
		this.me = {}
		this.pets = []
		this.nightTheme = false
		this.error = null
		this.current = null
	}

	async static login(email, password) {
		try {
			const { data } = await axios.post("/auth/login", {email, password})
			this.loggedIn(data)
		} catch (error) {
			this.error(error)
		}
	}

	async static logout() {
		try {
			await axios.post("/auth/logout")
			this.loggedOut()
		} catch (error) {
			this.error(error)
		}
	}

	async static getPets() {
		try {
			const { id } = this.getState().me
			const { data } = await axios.get(`/api/users/${id}/pets`)
			this.gotPets(data)
		} catch (error) {
			this.error(error)
		}
	}

	async static addPet(newPet) {
		try {
			const { id } = this.getState().me
			const { data } = await axios.post(`/api/users/${id}pets`, newPet)
			this.addedPet(data)
		} catch (error) {
			this.error(error)
		}
	}

	async static editPet(pet){
		try {
			const { id } = this.getState().me
			const {data} = await axios.put(`/api/users/${id}/pets/${pet.id}`, pet)
			this.editedPet(data)
		} catch (error){
			this.error(error)
		}
	}

	async static deletePet(pet) {
		try {
			const { id } = this.getState().me
			await axios.delete(`/api/usres/${id}/pets/${pet.id}`)
			this.deletedPet(pet)
		} catch (error) {
			this.error(error)
		}
	}

	loggedIn(me){
		return this.update({me})
	}
	loggedOut(){
		return new State()
	}
	toggleView(){
		return this.update({nightTheme: !this.nightTheme})
	}
	gotPets(pets){
		return this.update({pets})
	}
	addedPet(newPet){
		return this.add({pets: newPet})
	}
	editedPet(editedPet){
		return this.updateById({pets: editedPet})
	}
	deletedPet(deletedPet){
		return this.remove({pets: deletedPet})
	}
	error(error){
		return this.update({error})
	}
	_pickRandomPet(){
		const idx =Math.floor(Math.random() * this.pets.length)
		return this.pets[idx]
	}
	selectRandomPet(){
		return this.update({current: this._pickRandomPet()})
	}
}

export default State.init()

//2026 characters
