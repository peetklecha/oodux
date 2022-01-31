import { Store } from "redux"

type ArrayElement<ArrayType> = ArrayType extends readonly (infer ElementType)[]
	? ElementType
	: never

type OnlyArrayProperties<T> = {
	[Property in keyof T as T[Property] extends readonly unknown[]
		? Property
		: never]: T[Property]
}

// from https://stackoverflow.com/questions/54979161/is-it-possible-to-filter-out-getters-using-mapped-types-in-typescript
type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
	T
>() => T extends Y ? 1 : 2
	? A
	: B

// from https://stackoverflow.com/questions/54979161/is-it-possible-to-filter-out-getters-using-mapped-types-in-typescript
type MinusReadonly<T> = {
	[P in keyof T]: IfEquals<
		{ [Q in P]: T[P] },
		{ -readonly [Q in P]: T[P] },
		T[P],
		never
	>
}

type OnlyDataProperties<T> = {
	[Property in keyof MinusReadonly<T> as MinusReadonly<T>[Property] extends Function
		? never
		: Property]: MinusReadonly<T>[Property]
}

type DataPropsPlusGetters<T> = {
	[Property in keyof T as T[Property] extends Function
		? never
		: Property]: T[Property]
}

type OnlyMethods<T> = {
	[Property in keyof T as T[Property] extends Function
		? Property
		: never]: T[Property]
}

type ArrayPropertyElementTypes<T> = {
	[Property in keyof OnlyArrayProperties<T>]: ArrayElement<
		OnlyArrayProperties<T>[Property]
	>
}

type OnlyArrayOfObjectProperties<T> = {
	[Property in keyof OnlyArrayProperties<T> as ArrayElement<
		OnlyArrayProperties<T>[Property]
	> extends object
		? Property
		: never]: OnlyArrayProperties<T>[Property]
}

type PropertyToElement<
	T,
	OuterKey extends keyof OnlyArrayOfObjectProperties<T>,
> = {
	[Property in OuterKey]: ArrayElement<
	OnlyArrayOfObjectProperties<T>[OuterKey]
	>
}

type PropertyToElementPropertyValue<
	T,
	OuterKey extends keyof OnlyArrayOfObjectProperties<T>,
	InnerKey extends keyof ArrayElement<OnlyArrayOfObjectProperties<T>[OuterKey]>
> = {
	[Property in OuterKey]: ArrayElement<
		OnlyArrayOfObjectProperties<T>[OuterKey]
	>[InnerKey]
}

type OnlyArrayOfIdedObjectProperties<T> = {
	[Property in keyof OnlyArrayOfObjectProperties<T> as ArrayElement<
		OnlyArrayOfObjectProperties<T>[Property]
	> extends { id: any }
		? Property
		: never]: OnlyArrayOfObjectProperties<T>[Property]
}

type TypeOfId<T extends { id: any }> = T["id"]

type ObjectToArrayPropElementId<T, U extends keyof OnlyArrayOfIdedObjectProperties<T>> =
	ArrayElement<OnlyArrayOfIdedObjectProperties<T>[U]> extends { id: any } ? ArrayElement<OnlyArrayOfIdedObjectProperties<T>[U]> : never

type PropertiesToElementIdValue<T> = {
	[Property in keyof OnlyArrayOfIdedObjectProperties<T>]: TypeOfId<
		ObjectToArrayPropElementId<T, Property>
	>
}

type Modifiers<T> = {
	[Property in keyof OnlyArrayOfObjectProperties<T>]: (
		base: ArrayElement<OnlyArrayOfObjectProperties<T>[Property]>
	) => ArrayElement<OnlyArrayOfObjectProperties<T>[Property]>
}

type MinusOoduxBuiltins<T> = Omit<
	T,
	| "clear"
	| "copy"
	| "update"
	| "add"
	| "remove"
	| "removeBy"
	| "removeById"
	| "updateBy"
	| "updateById"
	| "updateAll"
>

type MinusPrivateMethods<T> = {
	[Property in keyof T as Property extends `_${string}`
		? never
		: Property]: T[Property]
}

type Setter<T> = {
	[Property in keyof T as `set${Capitalize<string & Property>}`]: (
		value: T[Property]
	) => T
}

type Clearer<T> = {
	[Property in keyof T as `clear${Capitalize<string & Property>}`]: () => T
}

type Toggler<T> = {
	[Property in keyof T as T[Property] extends boolean
		? `toggle${Capitalize<string & Property>}`
		: never]: () => T
}

type Incrementer<T> = {
	[Property in keyof T as T[Property] extends number
		? `increment${Capitalize<string & Property>}`
		: never]: (value: number) => T
}

type Appender<T> = {
	[Property in keyof OnlyArrayProperties<T> as `addTo${Capitalize<
		string & Property
	>}`]: (value: OnlyArrayProperties<T>[Property]) => T
}

type Updater<T> = {
	[Property in keyof OnlyArrayOfObjectProperties<T> as `update${Capitalize<
		string & Property
	>}`]: (value: {
		key: keyof ArrayElement<OnlyArrayOfObjectProperties<T>[Property]>
		data: ArrayElement<OnlyArrayOfObjectProperties<T>[Property]>
	}) => T
}

type IdUpdater<T> = {
	[Property in keyof OnlyArrayOfIdedObjectProperties<T> as `update${Capitalize<
		string & Property
	>}ById`]: (
		obj: ArrayElement<OnlyArrayOfIdedObjectProperties<T>[Property]>
	) => T
}

type Remover<T> = {
	[Property in keyof OnlyArrayProperties<T> as `removeFrom${Capitalize<
		string & Property
	>}`]: (obj: ArrayElement<OnlyArrayProperties<T>[Property]>) => T
}

type IdRemover<T> = {
	[Property in keyof OnlyArrayOfIdedObjectProperties<T> as `removeFrom${Capitalize<
		string & Property
	>}ById`]: (
		id: TypeOfId<ObjectToArrayPropElementId<T, Property>>
	) => T
}

export type Magic<T> = T &
	Setter<T> &
	Clearer<T> &
	Toggler<T> &
	Incrementer<T> &
	Appender<T> &
	Updater<T> &
	IdUpdater<T> &
	Remover<T> &
	IdRemover<T>

type UserInstanceData<T extends new (...args: any) => any> = MinusOoduxBuiltins<
	OnlyDataProperties<InstanceType<T>>
>

type UserInstanceDataPlusGetters<T extends new (...args: any) => any> =
	MinusOoduxBuiltins<DataPropsPlusGetters<InstanceType<T>>>

type UserInstanceMethods<T extends new (...args: any) => any> =
	MinusPrivateMethods<MinusOoduxBuiltins<OnlyMethods<InstanceType<T>>>>

type SetterDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof UserInstanceData<T> as `set${Capitalize<
		string & Property
	>}`]: (value: InstanceType<T>[Property]) => void
}

type ClearerDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof UserInstanceData<T> as `clear${Capitalize<
		string & Property
	>}`]: () => void
}

type TogglerDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof UserInstanceData<T> as InstanceType<T>[Property] extends boolean
		? `toggle${Capitalize<string & Property>}`
		: never]: () => void
}

type IncrementerDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof UserInstanceData<T> as UserInstanceData<T>[Property] extends number
		? `increment${Capitalize<string & Property>}`
		: never]: (value: number) => void
}

type AppenderDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof OnlyArrayProperties<
		UserInstanceData<T>
	> as `addTo${Capitalize<string & Property>}`]: (
		value: OnlyArrayProperties<UserInstanceData<T>>[Property]
	) => void
}

type UpdaterDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof OnlyArrayOfObjectProperties<
		UserInstanceData<T>
	> as `update${Capitalize<string & Property>}`]: (value: {
		key: keyof ArrayElement<
			OnlyArrayOfObjectProperties<UserInstanceData<T>>[Property]
		>
		data: ArrayElement<
			OnlyArrayOfObjectProperties<UserInstanceData<T>>[Property]
		>
	}) => void
}

type IdUpdaterDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof OnlyArrayOfIdedObjectProperties<
		UserInstanceData<T>
	> as `update${Capitalize<string & Property>}ById`]: (
		obj: ArrayElement<
			OnlyArrayOfIdedObjectProperties<UserInstanceData<T>>[Property]
		>
	) => void
}

type RemoverDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof OnlyArrayProperties<
		UserInstanceData<T>
	> as `removeFrom${Capitalize<string & Property>}`]: (
		obj: ArrayElement<OnlyArrayProperties<UserInstanceData<T>>[Property]>
	) => void
}

type IdRemoverDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof OnlyArrayOfIdedObjectProperties<
		UserInstanceData<T>
	> as `removeFrom${Capitalize<string & Property>}ById`]: (
		id: TypeOfId<ObjectToArrayPropElementId<UserInstanceData<T>, Property>>
	) => void
}

type UserMethodDispatcher<T extends new (...args: any) => any> = {
	[Property in keyof UserInstanceMethods<T> as UserInstanceMethods<T>[Property] extends Function
		? Property
		: never]: (...args: Parameters<UserInstanceMethods<T>[Property]>) => void
}

export type MagicClass<T extends new (...args: any) => any> = T &
	SetterDispatcher<T> &
	ClearerDispatcher<T> &
	TogglerDispatcher<T> &
	IncrementerDispatcher<T> &
	AppenderDispatcher<T> &
	UpdaterDispatcher<T> &
	IdUpdaterDispatcher<T> &
	RemoverDispatcher<T> &
	IdRemoverDispatcher<T> &
	UserMethodDispatcher<T> &
	{ clear(): void }

interface SliceInitObj {
	[key: string]: new () => any
}

export type TopLevelState<
	T extends { [key: string]: new (...args: unknown[]) => unknown }
> = {
	[Property in keyof T &
		string as Uncapitalize<Property>]: UserInstanceDataPlusGetters<T[Property]>
}

export type MagicTopLevel<
	T extends { [key: string]: new (...args: unknown[]) => unknown }
> = & {
	[Property in keyof T &
		string as `set${Property}`]: (obj: Partial<InstanceType<T[Property]>>) => void
} & {
	[Property in keyof T &
		string as `clear${Property}`]: () => void
}


declare class Oodux {
	static from<T>(obj: Partial<T>): T
	static init(): Store
	static getState<T>(): T
	static getSlice(): any
	static initSlices(obj: SliceInitObj): Store
	static store: Store
	clear(): this
	copy(): this
	update(obj: Partial<this>): this
	add(obj: Partial<ArrayPropertyElementTypes<this>>): this
	remove(obj: Partial<ArrayPropertyElementTypes<this>>): this
	removeBy<
		OuterKey extends keyof OnlyArrayOfObjectProperties<this>,
		InnerKey extends keyof ArrayElement<
			OnlyArrayOfObjectProperties<this>[OuterKey]
		>
	>(
		key: InnerKey,
		obj: Partial<PropertyToElement<this, OuterKey>>
	): this
	removeById(obj: Partial<PropertiesToElementIdValue<this>>): this
	updateBy<
		OuterKey extends keyof OnlyArrayOfObjectProperties<this>,
		InnerKey extends keyof ArrayElement<
			OnlyArrayOfObjectProperties<this>[OuterKey]
		>
	>(
		key: InnerKey,
		obj: Partial<PropertyToElement<this, OuterKey>>
	): this
	updateById(obj: Partial<PropertiesToElementIdValue<this>>): this
	updateAll(obj: Partial<Modifiers<this>>): this
}

export default Oodux

// interface Element {
// 	a: string,
// 	b: number
// }

// interface State {
// 	elements: Element[]
// }

// type X = Partial<PropertyToElement<State, "elements">>
