import React from "react"
import { connect } from "react-redux"
import {
	toggleView,
	selectPet,
	selectRandomPet,
} from "./example/storeWithoutOodux"

const PetsView = ({
	user,
	pets,
	highestRankedPet,
	toggleView,
	selectPet,
	selectRandomPet,
}) => (
	<div>
		<h1>{`${user.name}'s Pets`}</h1>
		<button onClick={selectRandomPet}>Select Random Pet</button>
		<ul>
			<li onClick={() => selectPet(highestRankedPet)}>
				{highestRankedPet.name}
			</li>
			{pets.map(pet => (
				<li onClick={() => selectPet(pet)}>{pet.name}</li>
			))}
		</ul>

		<button onClick={toggleView}>Toggle View</button>
	</div>
)

const mapStateToProps = state => ({
	user: state.user,
	pets: state.pets,
	highestRankedPet: state.pets.reduce((bestPet, currentPet) =>
		currentPet.rank > bestPet.rank ? currentPet : bestPet
	),
})

const mapDispatchToProps = dispatch => ({
	toggleView: () => dispatch(toggleView),
	selectPet: pet => dispatch(selectPet(pet)),
	selectRandomPet: () => dispatch(selectRandomPet()),
})

export default connect(mapStateToProps, mapDispatchToProps)(PetsView)
