import React from "react"
import { connect } from "react-redux"
import { selectRandomPet, setCurrent, toggleView } from "./example/store"

const PetsView = ({ user, pets, highestRankedPet }) => (
	<div>
		<h1>{`${user.name}'s Pets`}</h1>
		<button onClick={selectRandomPet}>Select Random Pet</button>
		<ul>
			<li onClick={() => setCurrent(highestRankedPet)}>
				{highestRankedPet.name}
			</li>
			{pets.map(pet => (
				<li onClick={() => setCurrent(pet)}>{pet.name}</li>
			))}
		</ul>

		<button onClick={toggleView}>Toggle View</button>
	</div>
)

const mapStateToProps = state => ({
	user: state.user,
	pets: state.pets,
	highestRankedPet: state.highestRankedPet,
})

export default connect(mapStateToProps)(PetsView)
