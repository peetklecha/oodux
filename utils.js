const excludedNames = new Set(["constructor", "length", "prototype", "name"])

function methodName(prefix, fieldName) {
	if (!fieldName) return prefix
	fieldName = fieldName[0].toUpperCase() + fieldName.slice(1)
	return typeof prefix === "string" ? prefix + fieldName : prefix(fieldName)
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

function pascalToCamel(str) {
	return str[0].toLowerCase() + str.slice(1)
}

function competingDefaultMethods(name) {
	return () => {
		throw new Error(
			`The action type ${name} could not be automatically created because multiple state-slices have the same property name. Instance methods for these state-slices are still available. `
		)
	}
}

module.exports = {
	methodName,
	allValidProperties,
	allGetters,
	pascalToCamel,
	competingDefaultMethods,
}
