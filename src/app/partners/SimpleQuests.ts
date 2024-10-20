import type { CollectionRegistry, INode, NestedNodeChildren, SchemaRegistry } from '@mcschema/core'
import { BooleanNode, Case, ChoiceNode, ListNode, MapNode, Mod, NumberNode, ObjectNode, Opt, Reference as RawReference, StringNode as RawStringNode, Switch } from '@mcschema/core'
import { VersionId } from '../services/Schemas.js'

const ID = 'simplequests'

const NUM = new RegExp("^([0-9]+)$")

const DATE = new RegExp("^(?:(?<weeks>[0-9]{1,2})w)?" +
	"(?:(?:^|:)(?<days>[0-9])d)?" +
	"(?:(?:^|:)(?<hours>[0-9]{1,2})h)?" +
	"(?:(?:^|:)(?<minutes>[0-9]{1,2})m)?" +
	"(?:(?:^|:)(?<seconds>[0-9]{1,2})s)?$")

const ADDITIONAL_QUESTS: NestedNodeChildren = {}
const ADDITIONAL_QUEST_ENTRIES: NestedNodeChildren = {}

export const addAdditionalQuestTypes = (add: NestedNodeChildren) => {
	Object.entries(add).forEach(v => {
		ADDITIONAL_QUESTS[v[0]] = v[1]
	})
}

export const addAdditionalQuestEntries = (add: NestedNodeChildren) => {
	Object.entries(add).forEach(v => {
		ADDITIONAL_QUEST_ENTRIES[v[0]] = v[1]
	})
}

export function initSimpleQuests(version: VersionId, schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)

	const mVer = modVersion(version)
	const stack_id_key = mVer < 2 ? "item" : "id"
	const ItemStack = ObjectNode({
		[stack_id_key]: StringNode({ validator: 'resource', params: { pool: 'item' } }),
		count: Opt(NumberNode({ integer: true, min: 1 })),
		tag: Opt(StringNode({ validator: 'nbt_path' }))
	}, { context: `${ID}.itemstack` })

	schemas.register(`${ID}:quest_category`, ObjectNode({
		name: StringNode(),
		description: Opt(ListNode(StringNode())),
		icon: Opt(ItemStack),
		only_same_category: Opt(BooleanNode()),
		max_concurrent_quests: Opt(NumberNode({ integer: true })),
		sorting_id: Opt(NumberNode({ integer: true })),
		max_daily: Opt(NumberNode({ integer: true })),
		selectable: Opt(BooleanNode()),
		is_visible: Opt(BooleanNode()),
		is_silent: Opt(BooleanNode()),
	}, { context: `${ID}.quest_category` }))

	const DescriptiveListOpt = (node: () => INode) => {
		var c = ChoiceNode([
			{
				type: 'simple',
				priority: 1,
				match: (v) => {
					const type = v === null || v === void 0 ? void 0 : v.type
					if (type === null || type === void 0 || type == 'simple')
						return true
					return false
				},
				node: node(),
				change: _ => ({ type: 'simple' })
			},
			{
				type: 'with_description',
				match: (v) => {
					var _a
					const type = (_a = v === null || v === void 0 ? void 0 : v.type) === null || _a === void 0 ? void 0 : _a
					if (type == 'with_description')
						return true
					const keys = v ? Object.keys(v) : []
					return typeof v == 'object' && ((keys === null || keys === void 0 ? void 0 : keys.length) === 0 || ((keys === null || keys === void 0 ? void 0 : keys.length) === 1 && (keys === null || keys === void 0 ? void 0 : keys[0]) === 'type'))
				},
				node: ObjectNode({
					description: StringNode(),
					value: node()
				}),
				change: _ => ({ type: 'with_description' })
			}
		])
		return ListNode(c, { minLength: 1 })
	}

	const DescriptiveList = (node: INode) => {
		return ListNode(ObjectNode({
			description: StringNode(),
			value: node
		}), { minLength: 1 })
	}

	const BlockPos = ObjectNode({
		x: NumberNode({ integer: true }),
		y: NumberNode({ integer: true }),
		z: NumberNode({ integer: true })
	})

	const ObjectWithType = (choices: any, context: any, cases: { [x: string]: { [x: string]: any } }) => {
		let pool = [
			...collections.get("loot_number_provider_type"),
			...Object.keys(cases)
		]
		const provider = ObjectNode({
            type: Mod(Opt(StringNode({ enum: pool })), {
                hidden: () => true
            }),
            [Switch]: [{ push: 'type' }],
            [Case]: cases,
        }, { context });
        Object.keys(cases).forEach(k => {
            choices.push({
                type: k,
                match: (v: { type?: any } | null | undefined) => {
                    var _a;
					console.log("aaa ", v);
                    const type = ((_a = v === null || v === void 0 ? void 0 : v.type) === null || _a === void 0 ? void 0 : _a.replace(/^minecraft:/, ''));
					if (type === k || 'minecraft:' + type === k)
                        return true;
                    const keys = v ? Object.keys(v) : [];
                    let t = typeof v === 'object' && ((keys === null || keys === void 0 ? void 0 : keys.length) === 0 || ((keys === null || keys === void 0 ? void 0 : keys.length) === 1 && (keys === null || keys === void 0 ? void 0 : keys[0]) === 'type'));
					return t;
                },
                node: provider,
                change: (_v: any) => ({ type: k, v: 0 }) // Having just type seems to not update
            });
        });
        return ChoiceNode(choices, { context, choiceContext: `number_provider.type` });
    };

	// Attempts to get the nodes from vanilla providers.
	// IDK if there is an easy way to extend existing vanilla schemas
	const choices = fetchFromSchema(schemas, "number_provider", d => d.choices);
	schemas.register(`${ID}:number_provider`, ObjectWithType(choices, 'number_provider', {
        'simplequests:context_multiplier': {
            base: Reference('number_provider'),
            multiplier: NumberNode(),
            max: Opt(NumberNode())
		}
    }))

	let playerPredicate_updated = Opt(Reference('entity_predicate'))
	playerPredicate_updated.enabled = (_p) => version == "1.18.2" || version >= "1.20.1"

	//Quest-entry types
	const QUEST_ENTRIES: NestedNodeChildren = {
		[modidPrefix("item")]: {
			predicate: Reference('item_predicate'),
			description: Opt(StringNode()),
			amount: NumberNode({ integer: true, min: 1 }),
			consumeItems: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_item")]: {
			predicates: DescriptiveListOpt(() => Reference('item_predicate')),
			description: StringNode(),
			amount: Reference(`${ID}:number_provider`),
			consumeItems: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("entity")]: {
			predicate: Reference('entity_predicate'),
			description: Opt(StringNode()),
			amount: NumberNode({ integer: true, min: 1 }),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_kill")]: {
			predicates: DescriptiveListOpt(() => Reference('entity_predicate')),
			description: StringNode(),
			amount: Reference(`${ID}:number_provider`),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("xp")]: {
			amount: NumberNode({ integer: true, min: 1 }),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_xp")]: {
			amount: Reference(`${ID}:number_provider`),
			description: StringNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("advancement")]: {
			advancement: StringNode({ validator: 'resource', params: { pool: "$advancement" } }),
			reset: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_advancements")]: {
			advancements: ListNode(StringNode({ validator: 'resource', params: { pool: "$advancement" } }), { minLength: 1 }),
			description: StringNode(),
			reset: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("position")]: {
			pos: BlockPos,
			minDist: NumberNode({ min: 0, integer: true }),
			description: Opt(StringNode()),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_position")]: {
			positions: DescriptiveListOpt(() => BlockPos),
			minDist: NumberNode({ min: 0, integer: true }),
			description: Opt(StringNode()),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("location")]: {
			predicate: Reference('location_predicate'),
			description: StringNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_location")]: {
			locations: DescriptiveList(Reference('location_predicate')),
			description: StringNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("entity_interact")]: {
			description: StringNode(),
			//heldDescription: Opt(StringNode()), Just for record. shouldnt be used
			//entityDescription: Opt(StringNode()),
			item: Opt(Reference('item_predicate')),
			predicate: Opt(Reference('entity_predicate')),
			amount: NumberNode({ min: 1, integer: true }),
			consume: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_entity_interaction")]: {
			description: StringNode(),
			taskDescription: StringNode(),
			itemPredicates: Opt(DescriptiveList(Reference('item_predicate'))),
			entityPredicates: Opt(DescriptiveList(Reference('entity_predicate'))),
			amount: Reference(`${ID}:number_provider`),
			consume: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("block_interact")]: {
			description: StringNode(),
			//heldDescription: Opt(StringNode()), Just for record. shouldnt be used
			//blockDescription: Opt(StringNode()),
			item: Opt(Reference('item_predicate')),
			block: Opt(Reference('block_predicate')),
			amount: NumberNode({ min: 1, integer: true }),
			use: BooleanNode(),
			consumeItem: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("multi_block_interaction")]: {
			description: StringNode(),
			taskDescription: StringNode(),
			itemPredicates: Opt(DescriptiveList(Reference('item_predicate'))),
			blockPredicates: Opt(DescriptiveList(Reference('block_predicate'))),
			amount: Reference(`${ID}:number_provider`),
			use: BooleanNode(),
			consumeItem: BooleanNode(),
			playerPredicate: playerPredicate_updated,
		},
		[modidPrefix("crafting")]: {
			description: StringNode(),
			//heldDescription: Opt(StringNode()), Just for record. shouldnt be used
			//blockDescription: Opt(StringNode()),
			item: Reference('item_predicate'),
			playerPredicate: Opt(Reference('entity_predicate')),
			amount: NumberNode({ min: 1, integer: true })
		},
		[modidPrefix("multi_crafting")]: {
			description: StringNode(),
			taskDescription: StringNode(),

			itemPredicates: DescriptiveList(Reference('item_predicate')),
			entityPredicates: Opt(DescriptiveList(Reference('entity_predicate'))),
			amount: Reference(`${ID}:number_provider`),
		},
		[modidPrefix("fishing")]: {
			description: StringNode(),
			//heldDescription: Opt(StringNode()), Just for record. shouldnt be used
			//blockDescription: Opt(StringNode()),
			item: Reference('item_predicate'),
			playerPredicate: Opt(Reference('entity_predicate')),
			amount: NumberNode({ min: 1, integer: true })
		},
		[modidPrefix("multi_fishing")]: {
			description: StringNode(),
			taskDescription: StringNode(),

			itemPredicates: DescriptiveList(Reference('item_predicate')),
			entityPredicates: Opt(DescriptiveList(Reference('entity_predicate'))),
			amount: Reference(`${ID}:number_provider`),
		}
	}

	schemas.register(`${ID}:quest_entries`, ObjectNode({
		id: StringNode({ enum: Object.keys(QUEST_ENTRIES).concat(Object.keys(ADDITIONAL_QUEST_ENTRIES)) }),
		[Switch]: [{ push: 'id' }],
		[Case]: {
			...QUEST_ENTRIES,
			...ADDITIONAL_QUEST_ENTRIES
		}
	}, { context: `${ID}.quest_entries`, disableSwitchContext: true }))

	const QUEST_TYPES: NestedNodeChildren = {
		[modidPrefix("quest")]: {
			loot_table: StringNode({ validator: 'resource', params: { pool: '$loot_table', allowUnknown: true } }),
			command: Opt(StringNode()),
			submission_trigger: Opt(StringNode()),
			entries: MapNode(StringNode(), Reference(`${ID}:quest_entries`)),
		},
		[modidPrefix("composite_quest")]: {
			quests: ListNode(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true } }), { minLength: 1 }),
		},
		[modidPrefix("sequential_quest")]: {
			loot_table: StringNode({ validator: 'resource', params: { pool: '$loot_table', allowUnknown: true } }),
			command: Opt(StringNode()),
			quests: ListNode(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true } }), { minLength: 1 }),
		},
	}

	const TIME = StringNode({ validator: "regex_pattern", params: { 0: "[0-9]" } })
	TIME.validate = (path, value, err, _) => {
		if (NUM.test(value) || value === '-1')
			return parseInt(value)
		if (!DATE.test(value))
			err.add(path, "error.invalid.value.time")
		else
			return value
	}

	schemas.register(`${ID}:quest`, ObjectNode({
		category: Opt(StringNode({ validator: 'resource', params: { pool: collections.get(`${ID}.quest_category`) } })),
		task: StringNode(),
		description: Opt(ListNode(StringNode())),
		parent: Opt(ListNode(StringNode({ validator: 'resource', params: { pool: collections.get(`${ID}.quest`) } }))),
		redo_parent: Opt(BooleanNode()),
		need_unlock: Opt(BooleanNode()),
		unlock_condition: Opt(Reference('entity_predicate')),
		icon: Opt(ItemStack),
		repeat_delay: Opt(TIME),
		repeat_daily: Opt(NumberNode({ integer: true })),
		sorting_id: Opt(NumberNode({ integer: true })),
		daily_quest: Opt(BooleanNode()),
		visibility: Opt(StringNode({ enum: ['DEFAULT', 'ALWAYS', 'NEVER'] })),
		type: StringNode({ enum: Object.keys(QUEST_TYPES).concat(Object.keys(ADDITIONAL_QUESTS)) }),
		[Switch]: [{ push: 'type' }],
		[Case]: {
			...QUEST_TYPES,
			...ADDITIONAL_QUESTS
		}
	}, { context: `${ID}.quest` }))
}

function modidPrefix(name: string, list?: string[]): string {
	var id = ID + ':' + name
	if (list) {
		list.push(id)
	}
	return id
}

function fetchFromSchema(schemas: SchemaRegistry, id: string, getter: (data: any) => any): any {
	const hook: any = schemas.get(id).hook
	let value;
	hook({ 
		base: {
			call: (_hook: any, data: any) => value = data
		}
	}, undefined);
	return getter(value)
}

function modVersion(version: VersionId) {
	if (version < "1.20.5") {
		return 1 // icon field changed from "item" to "id"
	} else  {
		return 2
	}
}
