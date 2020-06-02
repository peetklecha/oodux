import { createStore } from "redux"

const initialState = {
	me: {},
	pets: [],
	nightTheme: false,
	error: null,
	current: null,
}

const SET_USER = "SET_USER"
const REMOVE_USER = "REMOVE_USER"
const TOGGLE_NIGHT_THEME = "TOGGLE_NIGHT_THEME"
const SET_PETS = "SET_PETS"
const ADDED_PET = "ADDED_PET"
const EDITED_PET = "EDITED_PET"
const DELETED_PET = "DELETED_PET"
const SELECT_PET = "SELECT_PET"
const SELECT_RANDOM_PET = "SELECT_RANDOM_PET"
const ERROR = "ERROR"

const loggedIn = me => ({ type: SET_USER, me })
const loggedOut = () => ({ type: REMOVE_USER })
export const toggleView = () => ({ type: TOGGLE_NIGHT_THEME })
const gotPets = pets => ({ type: SET_PETS, pets })
const addedPet = pet => ({ type: ADDED_PET, pet })
const editedPet = pet => ({ type: EDITED_PET, pet })
const deletedPet = pet => ({ type: DELETED_PET, pet })
export const selectPet = pet => ({ type: SELECT_PET, pet })
export const selectRandomPet = () => ({ type: SELECT_RANDOM_PET })
const error = err => ({ type: ERROR, err })

//thunks
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
		case SET_USER:
			return { ...state, me: action.me }
		case REMOVE_USER:
			return initialState
		case TOGGLE_NIGHT_THEME:
			return { ...state, nightTheme: !state.nightTheme }
		case SET_PETS:
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
		case SELECT_PET:
			return {
				...state,
				current: action.pet,
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
