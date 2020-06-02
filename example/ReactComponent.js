import React from "react"
import { connect } from "react-redux"
import State from "./example/store"

const PetsView = ({ user, pets, highestRankedPet }) => (
	<div>
		<h1>{`${user.name}'s Pets`}</h1>
		<button onClick={() => State.selectRandomPet()}>Select Random Pet</button>
		<ul>
			<li onClick={() => State.setCurrent(highestRankedPet)}>
				{highestRankedPet.name}
			</li>
			{pets.map(pet => (
				<li onClick={() => State.setCurrent(pet)}>{pet.name}</li>
			))}
		</ul>

		<button onClick={() => State.toggleView()}>Toggle View</button>
	</div>
)

const mapStateToProps = state => ({
	user: state.user,
	pets: state.pets,
	highestRankedPet: state.highestRankedPet,
})

export default connect(mapStateToProps)(PetsView)
