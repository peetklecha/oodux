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
