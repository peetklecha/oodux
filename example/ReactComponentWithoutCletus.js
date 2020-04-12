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
