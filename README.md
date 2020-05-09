# Cletus

Cletus is a class-based Redux streamliner. It is meant to reduce Redux setup time by eliminating the need for the user to define action types, action creators, and mapDispatchToProps functions in react-redux. The user needs only to define reducers, their initial states, and any async actions, and Cletus will do the rest. Check out the walkthrough below.

## Example

This shows a simple example of how to use Cletus, using a single reducer. Cletus also supports multiple reducers -- see below.

### Initial State

First, create a class which extends Cletus. Instances of this class will serve as the state representations held in the store by Redux, so its constructor should create your initial/default state.

```js
class State extends Cletus {
	constructor() {
		super()
		this.me = {}
		this.pets = []
		this.nightTheme = false
		this.error = null
		this.current = null
	}

```

### Reducer

Next, create instance methods for your class. Each instance method should correspond to a "case" in your reducer. Note that we have not (and will not) make action types or action creators.

So if when using Redux your reducer looks like this...

```js
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
```

...your Cletus class should have the following instance methods:

```js

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


```

Note that Cletus comes with a number of methods to simplify immutable "editing". Note also that there is no need for a method corresponding to the `default` case.

Cletus will automatically create action types corresponding to the name of each instance method you create. It will then also create corresponding action creators for each action type. Any instance method with no arguments will yield an action creator which takes no arguments and returns an action which contains only a type key. Any instance method with one argument will yield an action creator which takes one argument and returns an action which contains two keys: `type` and `data`. The action creators are stored on your class under the static property `creators`. Creators can only take zero or one arguments.

Cletus also creates a reducer for you which takes in the action, checks whether there is an instance method by the same name, and if there is, invokes it on the action's payload. If no method matches the action, it returns the current state.

If you want to create a utility instance method but you do not want Cletus to turn it into an action or use it in the reducer, simply prefix it with an underscore.

```js

	_pickRandomPet(){
		const idx = Math.floor(Math.random() * this.pets.length)
		return this.pets[idx]
	}

	selectRandomPet(){
		return this.update({current: this._pickRandomPet()})
	}

```

### Async Actions

There is no need to use thunk middleware. Async actions should be static methods on your Cletus subclass. Cletus subclasses also have direct access to the store, dispatch, and state, so there is no need to abstract over the dispatch or getState functions.

```js

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

```

These methods should simply implement the async logic you need, then dispatch directly to the store by calling the static methods which correspond to the instance methods you created for the reducer. Note that because these are static methods, `this` refers to the class, not an instance -- so `this.gotPets(data)` above is not actually an invocation of the instance method that the user created -- it is invoking a static method created by Cletus.

In addition to action types and action creators, Cletus also creates a static method by the same name as your instance method which dispatches the corresponding action. So the line `this.gotPets(data)` above is equivalent to the following line in a Redux thunk:

```js
dispatch(gotPets(data))
```

Note that the current state is also accessible from your Cletus subclass by calling the `getState` method as in the `getPets` static method above.

### React-Redux

When using React-Redux, Cletus eliminates the need to mapDispatchToProps. Consider the following React component using plain Redux:

```js
import React from "react"
import { connect } from "react-redux"
import { toggleView, deletePet } from "./example/storeWithoutCletus"

const DeletePetsView = ({ me, pets, toggleView, deletePet }) => (
	<div>
		<h1>{`${me.name}'s Pets: Click to Delete`}</h1>
		<ul>
			{pets.map(pet => (
				<li onClick={() => deletePet(pet)}>{pet.name}</li>
			))}
		</ul>

		<button onClick={toggleView}>Toggle View</button>
	</div>
)

const mapStateToProps = state => ({ me: state.me, pets: state.pets })

const mapDispatchToProps = dispatch => ({
	toggleView: () => dispatch(toggleView),
	deletePet: pet => dispatch(deletePet(pet)),
})

export default connect(mapStateToProps, mapDispatchToProps)(DeletePetsView)
```

Here is the same component using Cletus:

```js
import React from "react"
import { connect } from "react-redux"
import State from "./example/store"

const DeletePetsView = ({ me, pets }) => (
	<div>
		<h1>{`${me.name}'s Pets: Click to Delete`}</h1>
		<ul>
			{pets.map(pet => (
				<li onClick={() => State.deletePet(pet)}>{pet.name}</li>
			))}
		</ul>

		<button onClick={() => State.toggleView()}>Toggle View</button>
	</div>
)

const mapStateToProps = state => ({ me: state.me, pets: state.pets })

export default connect(mapStateToProps)(DeletePetsView)
```

Note that the whole State class must be imported in order to access its static dispatching methods.

### Initializing

Instead of invoking the Redux function `createStore`, call the `init` method on your Cletus subclass; this returns the Redux store.

```js
export default State.init()
```

If you want to combine multiple reducers, call the `combineClasses` method on the Cletus class itself, passing in your reducer classes as arguments.

```js
export default Cletus.combineClasses(Users, Pets, Parks)
```

To use any Redux Middleware, simply call the `applyMiddleware` static method on your Cletus class.

```js
export default State.applyMiddleware(createLogger({ collapsed: true })).init()
```

```js
export default Cletus.applyMiddleware(
	createLogger({ collapsed: true })
).combineClasses(Users, Pets, Parks)
```
