
import * as zip from '@zip.js/zip.js'

const questDir = "simplequests"
const catDir = "simplequests_categories"

export async function convert(input: File): Promise<[Blob, { [file: string]: string[] }]> {
	const reader = new zip.ZipReader(new zip.BlobReader(new Blob([input])))
	const entries = await reader.getEntries()
	const writer = new zip.ZipWriter(new zip.BlobWriter('application/zip'))
	const errors: { [file: string]: string[] } = {}
	await Promise.all(entries
		.map(async e => {
			if (e.directory) {
				return
			}
			const d = new zip.TextWriter()
			let data: string = await e.getData?.(d)
			if (!e.filename.endsWith(".json")
				|| (!e.filename.includes(questDir) && !e.filename.includes(catDir))) {
				await writer.add(e.filename, new zip.TextReader(data))
				return
			}
			const fileErrors: string[] = []
			let conv = e.filename.includes(catDir) ? convertCat(data, fileErrors) : convertQuest(data, fileErrors)
			if (fileErrors.length > 0)
				errors[e.filename] = fileErrors
			await writer.add(e.filename, new zip.TextReader(conv))
		})
	)

	const blob: Blob = await writer.close()
	return [blob, errors]
}

const EntryConverter_2_0_0: {
	[type: string]: (input: any, errors: string[]) => any
} = {
	"simplequests:advancement": (input, _err) => replace(input, k => k === "advancement" ? "advancements" : k,
		(k, v) => k === "advancement" ? [v] : v
	),
	"simplequests:multi_advancements": (input, _err) => replace(input, k => k,
		(k, v) => k === "id" ? "simplequests:advancement" : v
	),
	"simplequests:block_interact": (input, _err) => {
		const res = replaceWith(input, { "consumeItem": "consume", "block": "block_predicates", "item": "item_predicates" })
		res.block_predicates = [{
			description: res.block_description ?? "",
			value: res.block_predicates
		}]
		if (res.item_predicates) {
			res.item_predicates = [{
				description: res.held_description ?? "",
				value: res.item_predicates
			}]
		}
		return res
	},
	"simplequests:multi_block_interaction": (input, _err) => {
		const res = replace(input, k => k, (k, v) => k === "id" ? "simplequests:block_interact" : v)
		if (!("block_predicates" in res)) {
			res.block_predicates = []
		}
		return res
	},
	"simplequests:crafting": (input, _err) => {
		const res = replaceWith(input, { "item": "item_predicates" })
		res.item_predicates = [{
			description: res.held_description ?? "",
			value: res.item_predicates
		}]
		return res
	},
	"simplequests:fishing": (input, _err) => {
		const res = replaceWith(input, { "item": "item_predicates" })
		res.item_predicates = [{
			description: res.held_description ?? "",
			value: res.item_predicates
		}]
		delete res.entity_description
		return res
	},
	"simplequests:multi_crafting": (input, _err) => {
		const res = replaceWith(input, { "item": "item_predicates" })
		delete res.task_description
		res.id = "simplequests:crafting"
		return res
	},
	"simplequests:multi_fishing": (input, _err) => {
		const res = replaceWith(input, { "item": "item_predicates" })
		delete res.task_description
		res.id = "simplequests:fishing"
		return res
	},
	"simplequests:entity_interact": (input, _err) => {
		const res = replaceWith(input, { "predicate": "entity_predicates", "item": "item_predicates" })
		res.entity_predicates = [{
			description: res.entity_description ?? "",
			value: res.entity_predicates
		}]
		if (res.item_predicates) {
			res.item_predicates = [{
				description: res.held_description ?? "",
				value: res.item_predicates
			}]
		}
		return res
	},
	"simplequests:multi_entity_interaction": (input, _err) => {
		const res = replaceWith(input, {})
		delete res.task_description
		res.id = "simplequests:entity_interact"
		return res
	},
	"simplequests:item": (input, _err) => {
		const res = replaceWith(input, { "predicate": "predicates" })
		res.predicates = [{
			description: res.description ?? "",
			value: res.predicates
		}]
		delete res.description
		return res
	},
	"simplequests:multi_item": (input, _err) => {
		const res = replaceWith(input, {})
		res.id = "simplequests:item"
		return res
	},
	"simplequests:entity": (input, _err) => {
		const res = replaceWith(input, { "predicate": "predicates" })
		res.predicates = [{
			description: res.description ?? "",
			value: res.predicates
		}]
		delete res.description
		res.id = "simplequests:kill"
		return res
	},
	"simplequests:multi_kill": (input, _err) => {
		const res = replaceWith(input, {})
		res.id = "simplequests:kill"
		return res
	},
	"simplequests:xp": (input, _err) => {
		const res = replaceWith(input, {})
		return res
	},
	"simplequests:multi_xp": (input, _err) => {
		const res = replaceWith(input, {})
		res.id = "simplequests:xp"
		return res
	},
	"simplequests:location": (input, _err) => {
		const res = replaceWith(input, { "predicate": "predicates" })
		res.predicates = [{
			description: res.description,
			value: {
				location: res.predicates
			}
		}]
		delete res.description
		res.submit = false
		res.id = "simplequests:predicates"
		return res
	},
	"simplequests:multi_location": (input, _err) => {
		const res = replaceWith(input, { "locations": "predicates" })
		const locs = res.predicates as any[]
		res.predicates = locs.map(v => {
			return {
				description: v.description,
				value: {
					location: {
						structures: v.value.structures
					}
				}
			}
		})
		res.submit = false
		res.id = "simplequests:predicates"
		return res
	},
	"simplequests:position": (input, err) => {
		const res = replaceWith(input, { "pos": "predicates" })
		const dist = res.min_dist
		const pos: {
			x: number,
			y: number,
			z: number
		} = res.predicates
		delete res.min_dist
		res.predicates = [{
			description: "",
			value: {
				location: {
					position: {
						x: {
							min: pos.x - dist,
							max: pos.x + dist
						},
						y: {
							min: pos.y - dist,
							max: pos.y + dist
						},
						z: {
							min: pos.z - dist,
							max: pos.z + dist
						}
					}
				}
			}
		}]
		err.push("Missing predicate description for positions")
		res.submit = false
		res.id = "simplequests:predicates"
		return res
	},
	"simplequests:multi_position": (input, err) => {
		const res = replaceWith(input, { "positions": "predicates" })
		const dist = res.min_dist
		const poss: any[] = res.predicates
		delete res.min_dist
		res.predicates = poss.map(v => {
			if ("value" in v) {
				return {
					description: v.description,
					value: {
						location: {
							position: {
								x: {
									min: v.value.x - dist,
									max: v.value.x + dist
								},
								y: {
									min: v.value.y - dist,
									max: v.value.y + dist
								},
								z: {
									min: v.value.z - dist,
									max: v.value.z + dist
								}
							}
						}
					}
				}
			} else {
				err.push("Missing predicate description for positions")
				return {
					description: "",
					value: {
						location: {
							position: {
								x: {
									min: v.x - dist,
									max: v.x + dist
								},
								y: {
									min: v.y - dist,
									max: v.y + dist
								},
								z: {
									min: v.z - dist,
									max: v.z + dist
								}
							}
						}
					}
				}
			}
		})
		res.submit = false
		res.id = "simplequests:predicates"
		return res
	},
}

const replacement: { [key: string]: string } = { "task": "name" }

function convertQuest(input: string, errors: string[]): string {
	const obj = JSON.parse(input)
	const res: any = {}
	Object.keys(obj).forEach(key => {
		if (key === "type") {
			res[key] = obj[key].replace("simplequests", "simplequests_api")
		}
		else if (key === "entries") {
			res["tasks"] = convertTasks(obj[key], errors)
		}
		else if (replacement[key])
			res[replacement[key]] = obj[key]
		else
			res[toSnakeCase(key)] = obj[key]
	})
	if ("icon" in res) {
		res.icon = replaceWith(res.icon, { "count": "Count" })
	}
	return JSON.stringify(res, undefined, 2).replace("simplequests:context_multiplier", "simplequests_api:context_multiplier")
}

function convertTasks(entries: any, errors: string[]): any {
	var typed: {
		[type: string]: any,
	} = entries
	var tasks: {
		[type: string]: any,
	} = {}
	Object.keys(typed).forEach(key => {
		const task = typed[key]
		const taskType = task.id
		const converted = taskType in EntryConverter_2_0_0 ? EntryConverter_2_0_0[taskType](task, errors) : task
		converted.id = converted.id.replace("simplequests", "simplequests_api")
		tasks[key] = converted
	})
	return tasks
}

function toSnakeCase(val: string): string {
	return val.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

function replaceWith(obj: any, mapper: { [key: string]: string }, value?: (key: string, val: any) => any) {
	return replace(obj, k => mapper[k] ?? k, value)
}

function replace(obj: any, mapper: (key: string) => string, value?: (key: string, val: any) => any) {
	const res: any = {}
	Object.keys(obj).forEach(key => {
		res[toSnakeCase(mapper(key))] = value ? value(key, obj[key]) : obj[key]
	})
	return res
}

function convertCat(input: string, _errors: string[]): string {
	const obj = JSON.parse(input)
	if ("icon" in obj) {
		obj.icon = replaceWith(obj.icon, { "count": "Count" })
	}
	return JSON.stringify(obj, undefined, 2)
}
