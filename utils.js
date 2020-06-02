export function methodName(prefix, fieldName) {
	fieldName = fieldName[0].toUpperCase() + fieldName.slice(1)
	return prefix + fieldName
}
