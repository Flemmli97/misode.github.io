import type { CollectionRegistry, NestedNodeChildren, SchemaRegistry } from '@mcschema/core'
import { BooleanNode, Case, ListNode, MapNode, Mod, NumberNode, ObjectNode, Opt, Reference as RawReference, StringNode as RawStringNode, Switch } from '@mcschema/core'
import { VersionId } from '../services/Schemas.js'
import { addAdditionalQuestEntries, addAdditionalQuestTypes } from './SimpleQuests.js'

const ID = 'runecraftory'

export function initRunecraftory(_version: VersionId, schemas: SchemaRegistry, collections: CollectionRegistry) {
	const Reference = RawReference.bind(undefined, schemas)
	const StringNode = RawStringNode.bind(undefined, collections)

	register_collections(collections)

	const ItemStack = ObjectNode({
		item: StringNode({ validator: 'resource', params: { pool: 'item' } }),
		count: Opt(NumberNode({ integer: true, min: 1 })),
		tag: Opt(StringNode({ validator: 'nbt_path' }))
	}, { context: `${ID}.itemstack` })

	const SKILLS = [
		'SHORTSWORD',
		'LONGSWORD',
		'SPEAR',
		'HAMMERAXE',
		'DUAL',
		'FIST',
		'FIRE',
		'WATER',
		'EARTH',
		'WIND',
		'DARK',
		'LIGHT',
		'LOVE',
		'FARMING',
		'LOGGING',
		'MINING',
		'FISHING',
		'COOKING',
		'FORGING',
		'CHEMISTRY',
		'CRAFTING',
		'SLEEPING',
		'SEARCHING',
		'WALKING',
		'EATING',
		'DEFENCE',
		'RES_POISON',
		'RES_SEAL',
		'RES_PARA',
		'RES_SLEEP',
		'RES_FATIGUE',
		'RES_COLD',
		'BATH',
		'TAMING',
		'LEADER'
	]

	schemas.register(`${ID}:crops`, ObjectNode({
		item: StringNode({ validator: 'resource', params: { pool: 'item', allowTag: true } }),
		growth: NumberNode({ integer: true }),
		maxDrops: NumberNode({ integer: true }),
		regrowable: BooleanNode(),
		giantCrop: Opt(StringNode({ validator: 'resource', params: { pool: 'block' } })),
		bestSeason: Opt(ListNode(StringNode({ enum: ['SPRING', 'SUMMER', 'FALL', 'WINTER'] }))),
		badSeason: Opt(ListNode(StringNode({ enum: ['SPRING', 'SUMMER', 'FALL', 'WINTER'] }))),
	}, { context: `${ID}.crops` }))

	schemas.register(`${ID}:food`, ObjectNode({
		item: StringNode({ validator: 'resource', params: { pool: 'item', allowTag: true } }),
		duration: NumberNode({ integer: true }),
		effects: MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false })),
		effectsPercentage: MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false })),
		cookingBonus: MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false })),
		cookingBonusPercent: MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false })),
		potionApply: ListNode(ObjectNode({
			item: StringNode({ validator: 'resource', params: { pool: 'mob_effect' } }),
			duration: NumberNode({ integer: true, min: 1 }),
			amplifier: NumberNode({ integer: true })
		})),
		potionRemove: ListNode(StringNode({ validator: 'resource', params: { pool: 'mob_effect' } })),
	}, { context: `${ID}.food` }))

	schemas.register(`${ID}:item_stats`, ObjectNode({
		item: StringNode({ validator: 'resource', params: { pool: 'item', allowTag: true } }),
		buyPrice: NumberNode({ integer: true, min: 0 }),
		sellPrice: NumberNode({ integer: true, min: 0 }),
		upgradeDifficulty: NumberNode({ integer: true, min: 0 }),
		itemStats: MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false })),
		monsterBonus: MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false })),
		element: Mod(StringNode({ enum: ['NONE', 'WATER', 'EARTH', 'WIND', 'FIRE', 'LIGHT', 'DARK', 'LOVE'] }), { default: () => ('NONE') }),
		tier1Spell: Opt(StringNode({ validator: 'resource', params: { pool: `${ID}:spells` as any } })),
		tier2Spell: Opt(StringNode({ validator: 'resource', params: { pool: `${ID}:spells` as any } })),
		tier3Spell: Opt(StringNode({ validator: 'resource', params: { pool: `${ID}:spells` as any } })),
		armorEffect: Opt(StringNode({ validator: 'resource', params: { pool: `${ID}:armor_effects` as any } })),
	}, { context: `${ID}.item_stats` }))

	schemas.register(`${ID}:gate_spawning`, ObjectNode({
		entity: StringNode({ validator: 'resource', params: { pool: 'item', allowTag: true } }),
		minDistanceFromSpawn: NumberNode({ integer: true, min: 0 }),
		minGateLevel: NumberNode({ integer: true, min: 0 }),
		allowUnderwater: BooleanNode(),
		biomes: MapNode(StringNode({ validator: 'resource', params: { pool: '$worldgen/biome', allowTag: true } }), NumberNode({ integer: false, min: 1 })),
		structures: MapNode(StringNode({ validator: 'resource', params: { pool: '$worldgen/structure', allowTag: true } }), NumberNode({ integer: false, min: 1 })),
		gatePredicate: Opt(Reference('entity_predicate')),
		playerPredicate: Opt(Reference('entity_predicate')),
	}, { context: `${ID}.gate_spawning` }))

	// All currrently registered npc actions
	const NPC_ACTIONS: NestedNodeChildren = {
		[`${ID}:do_nothing`]: {
			duration: Reference('number_provider'),
			cooldown: Opt(Reference('number_provider')),
		},
		[`${ID}:melee_attack`]: {
			walkTime: Reference('number_provider'),
			cooldown: Opt(Reference('number_provider')),
		},
		[`${ID}:spell_attack`]: {
			spell: StringNode({ validator: 'resource', params: { pool: `${ID}:spells` as any } }),
			range: NumberNode({ min: 0 }),
			ignoreSeal: BooleanNode(),
			walkTime: Reference('number_provider'),
			cooldown: Opt(Reference('number_provider')),
		},
		[`${ID}:party_target_action`]: {
			spell: StringNode({ validator: 'resource', params: { pool: `${ID}:spells` as any } }),
			ignoreSeal: BooleanNode(),
			cooldown: Reference('number_provider'),
		},
		[`${ID}:food_throw_action`]: {
			items: ListNode(ItemStack),
			walkTime: Reference('number_provider'),
			cooldown: Reference('number_provider'),
		},
		[`${ID}:run_away`]: {
			maxDist: NumberNode(),
			duration: Reference('number_provider'),
			cooldown: Reference('number_provider'),
		},
		[`${ID}:walk_around`]: {
			duration: Reference('number_provider'),
			cooldown: Reference('number_provider'),
		},
		[`${ID}:run_to_leader`]: {
			duration: Reference('number_provider'),
			cooldown: Reference('number_provider'),
		},
	}

	schemas.register(`${ID}:npc_actions`, ObjectNode({
		actions: ListNode(ObjectNode({
			weight: NumberNode({ integer: true, min: 1 }),
			predicate: Opt(Reference('entity_predicate')),
			concurrent_actions: Opt(ListNode(Mod(ObjectNode({
				type: StringNode({ enum: Object.keys(NPC_ACTIONS) }),
				[Switch]: [{ push: 'type' }],
				[Case]: NPC_ACTIONS
			}, { context: `${ID}.npc_actions.action`, disableSwitchContext: true }), {
				default: () => ({
					type: `${ID}:do_nothing`,
				}),
			}))),
		})),
	}, { context: `${ID}.npc_actions` }))

	const CONDITION_TYPES = [
		...collections.get('loot_condition_type'),
		...[`${ID}:biome`, `${ID}:friend_points`, `${ID}:interacting_player`, `${ID}:season`, `${ID}:skill_check`, `${ID}:talk_count`]
	]
	const VANILLA_CONDITION = fetchFromSchema(schemas, "loot_condition", d => d.cases);
	schemas.register(`${ID}:loot_condition`, Mod(ObjectNode({
		loot_condition_type: StringNode({ enum: CONDITION_TYPES }),
		[Switch]: [{ push: 'loot_condition_type' }],
		[Case]: {
			...VANILLA_CONDITION,
			[`${ID}:biome`]: {
				biome_tag: StringNode({ validator: 'resource', params: { pool: '$tag/worldgen/biome' } })
			},
			[`${ID}:friend_points`]: {
				points: NumberNode({ integer: true, min: 0 })
			},
			[`${ID}:interacting_player`]: {
				relation: StringNode({ enum: ['NORMAL', 'DATING', 'MARRIED'] })
			},
			[`${ID}:season`]: {
				season: StringNode({ enum: ['SPRING', 'SUMMER', 'FALL', 'WINTER'] })
			},
			[`${ID}:skill_check`]: {
				skill: StringNode({ enum: SKILLS }),
				min_required_level: NumberNode({ integer: true, min: 0 })
			},
			[`${ID}:talk_count`]: {
				count: NumberNode({ integer: true, min: 0 })
			},
		}
	}, { category: 'predicate', context: `condition` }), {
		default: () => ({
			loot_condition_type: 'minecraft:random_chance',
			chance: 0.5
		}),
	}))

	schemas.register(`${ID}:conversations`, ObjectNode({
		fallbackKey: StringNode(),
		conversations: MapNode(StringNode(), ObjectNode({
			translationKey: StringNode(),
			minHearts: NumberNode({ integer: true, min: 0 }),
			maxHearts: NumberNode({ integer: true, min: 0 }),
			startingConversation: Opt(BooleanNode()),
			actions: Opt(ListNode(ObjectNode({
				translationKey: StringNode(),
				action: StringNode({ enum: ['ANSWER', 'QUEST'] }),
				actionValue: StringNode(),
				friendXP: NumberNode({ integer: true, min: 0 }),
			}))),
			conditions: ListNode(Reference(`${ID}:loot_condition`)),
		}))
	}, { context: `${ID}.conversations` }))

	const LookFeatures: NestedNodeChildren = {
		[`${ID}:slim_feature`]: {
		},
		[`${ID}:size_feature`]: {
			size: Reference('number_provider'),
		},
	}

	schemas.register(`${ID}:npc_looks`, ObjectNode({
		gender: Mod(StringNode({ enum: ['UNDEFINED', 'MALE', 'FEMALE'] }), { default: () => ('UNDEFINED') }),
		texture: Opt(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, })),
		playerSkin: Opt(StringNode()),
		weight: NumberNode({ integer: true, min: 0 }),
		additionalFeatures: ListNode(ObjectNode({
			type: StringNode({ enum: Object.keys(LookFeatures) }),
			[Switch]: [{ push: 'type' }],
			[Case]: {
				...LookFeatures,
			}
		}))
	}, { context: `${ID}.npc_looks` }))

	const ConversationContexts = [
		`${ID}:greeting`,
		`${ID}:talk`,
		`${ID}:follow_yes`,
		`${ID}:follow_no`,
		`${ID}:follow_stop`,
		`${ID}:dating_accept`,
		`${ID}:dating_deny`,
		`${ID}:marriage_accept`,
		`${ID}:marriage_deny`,
		`${ID}:divorce`,
		`${ID}:divorce_error`,
		`${ID}:procreation_cooldown`,
	]

	schemas.register(`${ID}:npc_data`, ObjectNode({
		name: Opt(StringNode()),
		surname: Opt(StringNode()),
		gender: Mod(StringNode({ enum: ['UNDEFINED', 'MALE', 'FEMALE'] }), { default: () => ('UNDEFINED') }),
		profession: Opt(ListNode(StringNode({ validator: 'resource', params: { pool: `${ID}:professions` as any } }))),
		look: Opt(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, })),
		birthday: Opt(ObjectNode({
			season: StringNode({ enum: ['SPRING', 'SUMMER', 'FALL', 'WINTER'] }),
			day: NumberNode({ integer: true, min: 1, max: 30 })
		})),
		weight: NumberNode({ integer: true, min: 1 }),
		neutralGiftResponse: StringNode(),
		interactions: Mod(MapNode(StringNode({ enum: ConversationContexts }), StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, })), {
			validate: (path, value, err, _) => {
				let arr: string[] | undefined = value === undefined ? undefined : Object.keys(value);
				if (!arr || !ConversationContexts.every((val,_)=> arr!.includes(val))) {
					err.add(path, `${ID}.error.missing.contexts`)
				}
				return value
			}
		}),
		questHandler: ObjectNode({
			responses: MapNode(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }), ObjectNode({
				startID: StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }),
				activeID: StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }),
				hasSequence: BooleanNode(),
				endID: StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }),
			})),
			requiredQuests: ListNode(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }))
		}),
		giftItems: MapNode(StringNode(), ObjectNode({
			items: Opt(StringNode({ validator: 'resource', params: { pool: 'item', allowTag: true } })),
			responseKey: StringNode(),
			xp: NumberNode({ integer: true }),
		})),
		schedule: Opt(ObjectNode({
			wakeUpTime: NumberNode({ integer: true, min: 0 }),
			workTime: NumberNode({ integer: true, min: 0 }),
			breakTime: NumberNode({ integer: true, min: 0 }),
			workTimeAfter: NumberNode({ integer: true, min: 0 }),
			doneWorkTime: NumberNode({ integer: true, min: 0 }),
			meetTime: NumberNode({ integer: true, min: 0 }),
			meetTimeAfter: NumberNode({ integer: true, min: 0 }),
			sleepTime: NumberNode({ integer: true, min: 0 }),
			workDays: ListNode(StringNode({ enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] }))
		})),
		combat: Opt(ObjectNode({
			baseStats: Opt(MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false }))),
			statIncrease: Opt(MapNode(StringNode({ validator: 'resource', params: { pool: 'attribute' } }), NumberNode({ integer: false }))),
			baseLevel: NumberNode({ integer: true, min: 1 }),
			combatActions: Opt(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, })),
		})),
		unique: Opt(NumberNode({ integer: true, min: 0 })),
		relation: ObjectNode({
			relationShipState: Mod(StringNode({ enum: ['DEFAULT', 'NON_ROMANCEABLE', 'NO_ROMANCE_NPC', 'NO_ROMANCE'] }), { default: () => ('DEFAULT') }),
			possibleChildren: Opt(ListNode(StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }))),
		}),
	}, { context: `${ID}.npc_data` }))

	addAdditionalQuestTypes({
		[`${ID}:npc_quest`]: {
			npc_id: StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }),
			quest: StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }),
		},
		[`${ID}:quest_board_quest`]: {
			wrappedQuest: StringNode({ validator: 'resource', params: { pool: [], allowUnknown: true }, }),
		},
	})

	addAdditionalQuestEntries({
		[`${ID}:shipping`]: {
			predicate: Reference('item_predicate'),
			amount: NumberNode({ integer: true, min: 1 }),
			description: Opt(StringNode()),
		},
		[`${ID}:level`]: {
			level: NumberNode({ integer: true, min: 1 }),
		},
		[`${ID}:skill_level`]: {
			skill: StringNode({ enum: SKILLS }),
			level: NumberNode({ integer: true, min: 1 }),
		},
		[`${ID}:taming`]: {
			predicate: Opt(Reference('entity_predicate')),
			amount: NumberNode({ integer: true, min: 1 }),
			description: Opt(StringNode()),
		},
		[`${ID}:npc_talk`]: {
		},
	})
}

function register_collections(collections: CollectionRegistry) {
	var attributes = collections.get('attribute')
	attributes = [
		...attributes,
		`${ID}:health_gain`,
		`${ID}:rp_gain`,
		`${ID}:rp_increase`,
		`${ID}:attack_speed_modifier`,
		`${ID}:attack_range`,
		`${ID}:defence`,
		`${ID}:magic_attack`,
		`${ID}:magic_defence`,
		`${ID}:paralysis`,
		`${ID}:poison`,
		`${ID}:seal`,
		`${ID}:sleep`,
		`${ID}:fatigue`,
		`${ID}:cold`,
		`${ID}:dizzy`,
		`${ID}:crit`,
		`${ID}:stun`,
		`${ID}:faint`,
		`${ID}:drain`,
		`${ID}:knockback`,
		`${ID}:res_water`,
		`${ID}:res_earth`,
		`${ID}:res_wind`,
		`${ID}:res_fire`,
		`${ID}:res_dark`,
		`${ID}:res_light`,
		`${ID}:res_love`,
		`${ID}:res_paralysis`,
		`${ID}:res_poison`,
		`${ID}:res_seal`,
		`${ID}:res_sleep`,
		`${ID}:res_fatigue`,
		`${ID}:res_cold`,
		`${ID}:res_dizzy`,
		`${ID}:res_crit`,
		`${ID}:res_stun`,
		`${ID}:res_faint`,
		`${ID}:res_drain`,
		`${ID}:res_knockback`,
	]
	collections.register('attribute', attributes)

	collections.register(`${ID}:spells`, [
		`${ID}:empty_spell`,
		`${ID}:base_staff_spell`,
		`${ID}:vanilla_arrow`,
		`${ID}:triple_arrow`,
		`${ID}:vanilla_wither_skull`,
		`${ID}:vanilla_evoker_fang`,
		`${ID}:vanilla_snowball`,
		`${ID}:fireball`,
		`${ID}:big_fireball`,
		`${ID}:explosion`,
		`${ID}:water_laser`,
		`${ID}:parallel_laser`,
		`${ID}:delta_laser`,
		`${ID}:screw_rock`,
		`${ID}:earth_spike`,
		`${ID}:avenger_rock`,
		`${ID}:sonic`,
		`${ID}:double_sonic`,
		`${ID}:penetrate_sonic`,
		`${ID}:light_barrier`,
		`${ID}:shine`,
		`${ID}:prism`,
		`${ID}:dark_snake`,
		`${ID}:dark_ball`,
		`${ID}:darkness`,
		`${ID}:cure`,
		`${ID}:cure_all`,
		`${ID}:master_cure`,
		`${ID}:medi_poison`,
		`${ID}:medi_paralysis`,
		`${ID}:medi_seal`,
		`${ID}:power_wave`,
		`${ID}:dash_slash`,
		`${ID}:rush_attack`,
		`${ID}:round_break`,
		`${ID}:mind_thrust`,
		`${ID}:blitz`,
		`${ID}:twin_attack`,
		`${ID}:storm`,
		`${ID}:gust`,
		`${ID}:rail_strike`,
		`${ID}:wind_slash`,
		`${ID}:flash_strike`,
		`${ID}:steel_heart`,
		`${ID}:delta_strike`,
		`${ID}:naive_blade`,
		`${ID}:hurricane`,
		`${ID}:reaper_slash`,
		`${ID}:million_strike`,
		`${ID}:axel_disaster`,
		`${ID}:stardust_upper`,
		`${ID}:grand_impact`,
		`${ID}:tornado_swing`,
		`${ID}:giga_swing`,
		`${ID}:upper_cut`,
		`${ID}:double_kick`,
		`${ID}:straight_punch`,
		`${ID}:neko_damashi`,
		`${ID}:rush_punch`,
		`${ID}:cyclone`,
		`${ID}:rapid_move`,
		`${ID}:teleport`,
		`${ID}:spore_circle`,
		`${ID}:gust_wind`,
		`${ID}:stone_throw`,
		`${ID}:web_shot`,
		`${ID}:spirit_flame`,
		`${ID}:ignis_flame`,
		`${ID}:pollen_puff`,
		`${ID}:sleep_balls`,
		`${ID}:wave`,
		`${ID}:butterfly`,
		`${ID}:laser_3`,
		`${ID}:laser_5`,
		`${ID}:laser_aoe`,
		`${ID}:big_lightning`,
		`${ID}:card_attack`,
		`${ID}:throw_plush`,
		`${ID}:furniture_summon`,
		`${ID}:dark_beam`,
		`${ID}:big_plate`,
		`${ID}:dark_bullets`,
		`${ID}:poison_ball`,
		`${ID}:poison_needle`,
		`${ID}:sleep_aura`,
		`${ID}:double_bullet`,
		`${ID}:throw_held_item`,
		`${ID}:triple_fire_bullet`,
		`${ID}:triple_fire_ball`,
		`${ID}:apple_shield`,
		`${ID}:apple_rain`,
		`${ID}:apple_rain_big`,
		`${ID}:apple_rain_more`,
		`${ID}:root_spike`,
		`${ID}:root_spike_triple`,
		`${ID}:fireball_barrage`,
		`${ID}:bubble_beam`,
		`${ID}:slash`,
		`${ID}:big_leaf_spell_single`,
		`${ID}:big_leaf_spell_double`,
		`${ID}:small_leaf_spell_x3`,
		`${ID}:small_leaf_spell_x5`,
		`${ID}:small_leaf_spell_x7`,
		`${ID}:bone_needles`,
		`${ID}:energy_orb_spell`,
		`${ID}:rafflesia_poison`,
		`${ID}:rafflesia_para`,
		`${ID}:rafflesia_sleep`,
		`${ID}:rafflesia_cicle`,
		`${ID}:wind_circle_x8`,
		`${ID}:wind_circle_x16`,
	])

	collections.register(`${ID}:armor_effects`, [
		`${ID}:piyo_sandals`,
	])

	// All npc professions
	collections.register(`${ID}:professions`, [
		`${ID}:jobless`,
		`${ID}:general`,
		`${ID}:flowers`,
		`${ID}:smith`,
		`${ID}:doctor`,
		`${ID}:cook`,
		`${ID}:magic`,
		`${ID}:rune_skills`,
		`${ID}:bath_house`,
		`${ID}:random`,
	])
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
