import Cletus from ".."
import { createStore } from "redux"

const initialState = {
	me: {},
	pets: [],
	nightTheme: false,
	error: null,
	current: null,
}

const LOGGED_IN = "LOGGED_IN"
const LOGGED_OUT = "LOGGED_OUT"
const TOGGLE_VIEW = "TOGGLE_VIEW"
const GOT_PETS = "GOT_PETS"
const ADDED_PET = "ADDED_PET"
const EDITED_PET = "EDITED_PET"
const DELETED_PET = "DELETED_PET"
const SELECT_RANDOM_PET = "SELECT_RANDOM_PET"
const ERROR = "ERROR"

const loggedIn = me => ({ type: LOGGED_IN, me })
const loggedOut = () => ({ type: LOGGED_OUT })
export const toggleView = () => ({ type: TOGGLE_VIEW })
const gotPets = pets => ({ type: GOT_PETS, pets })
const addedPet = pet => ({ type: ADDED_PET, pet })
const editedPet = pet => ({ type: EDITED_PET, pet })
const deletedPet = pet => ({ type: DELETED_PET, pet })
export const selectRandomPet = () => ({ type: SELECT_RANDOM_PET })
const error = err => ({ type: ERROR, err })

export const login = (email, password) => async dispatch => {
	try {
		const { data } = await axios.post("/auth/login", { email, password })
		dispatch(loggedIn(data))
	} catch (err) {
		dispatch(error(err))
	}
}

export const logout = () => async dispatch => {
	try {
		await axios.post("/auth/logout")
		dispatch(loggedOut())
	} catch (err) {
		dispatch(error(err))
	}
}

export const getPets = () => async (dispatch, getState) => {
	try {
		const { id } = getState().me
		const { data } = await axios.get(`/api/users/${id}/pets`)
		dispatch(gotPets(data))
	} catch (error) {
		dispatch(error(error))
	}
}

export const addPet = newPet => async (dispatch, getState) => {
	try {
		const { id } = getState().me
		const { data } = await axios.post(`/api/users/${id}pets`, newPet)
		dispatch(addedPet(data))
	} catch (error) {
		dispatch(error(error))
	}
}

export const editPet = pet => async (dispatch, getState) => {
	try {
		const { id } = getState().me
		const { data } = await axios.put(`/api/users/${id}/pets/${pet.id}`, pet)
		dispatch(editedPet(data))
	} catch (error) {
		dispatch(error(error))
	}
}

export const deletePet = pet => async (dispatch, getState) => {
	try {
		const { id } = getState().me
		await axios.delete(`/api/usres/${id}/pets/${pet.id}`)
		dispatch(deletedPet(pet))
	} catch (error) {
		dispatch(error(error))
	}
}

const pickRandomPet = state => {
	const idx = Math.floor(Math.random() * this.pets.length)
	return state.pets[idx]
}

const reducer = (state = initialState, action) => {
	switch (action.type) {
		case LOGGED_IN:
			return { ...state, me: action.me }
		case LOGGED_OUT:
			return initialState
		case TOGGLE_VIEW:
			return { ...state, nightTheme: !state.nightTheme }
		case GOT_PETS:
			return { ...state, pets: action.pets }
		case ADDED_PET:
			return { ...state, pets: [...state.pets, action.pet] }
		case EDITED_PET:
			return {
				...state,
				pets: state.pets.map(pet =>
					pet.id === action.pet.id ? action.pet : pet
				),
			}
		case DELETED_PET:
			return {
				...state,
				pets: state.pets.filter(pet => pet !== action.pet),
			}
		case SELECT_RANDOM_PET:
			return { ...state, current: pickRandomPet(state) }
		case ERROR:
			return { ...state, error: action.error }
		default:
			return state
	}
}

export default createStore(reducer)

//3223 characters
