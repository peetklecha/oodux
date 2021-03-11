const excludedNames = new Set(["constructor", "length", "prototype", "name"])

function methodName(prefix, fieldName) {
	if (!fieldName) return prefix
	fieldName = fieldName[0].toUpperCase() + fieldName.slice(1)
	return prefix + fieldName
}

function allValidProperties(obj) {
	const properties = Object.getOwnPropertyDescriptors(obj)
	return Object.keys(properties).filter(
		name =>
			!excludedNames.has(name) && !name.startsWith("_") && !properties[name].get
	)
}

function allGetters(obj) {
	const descriptors = Object.getOwnPropertyDescriptors(obj)
	return Object.entries(descriptors).filter(
		([name, descriptor]) =>
			!excludedNames.has(name) && !name.startsWith("_") && descriptor.get
	)
}

module.exports = { methodName, allValidProperties, allGetters }
