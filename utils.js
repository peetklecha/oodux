function methodName(prefix, fieldName) {
	fieldName = fieldName[0].toUpperCase() + fieldName.slice(1)
	return prefix + fieldName
}

function allValidProperties(obj) {
	const excludedNames = new Set(["constructor", "length", "prototype", "name"])
	const properties = Object.getOwnPropertyDescriptors(obj)
	return Object.keys(properties).filter(
		name =>
			!excludedNames.has(name) && !name.startsWith("_") && !properties[name].get
	)
}

module.exports = { methodName, allValidProperties }
