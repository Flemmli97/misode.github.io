import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initSimpleQuests } from './SimpleQuests.js'

export * from './ImmersiveWeathering.js'
export * from './SimpleQuests.js'

export function initPartners(schemas: SchemaRegistry, collections: CollectionRegistry) {
	initImmersiveWeathering(schemas, collections)
	initSimpleQuests(schemas, collections)
}
