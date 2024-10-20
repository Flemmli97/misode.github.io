import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import type { VersionId } from '../services/Schemas.js'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initLithostitched } from './Lithostitched.js'
import { initNeoForge } from './NeoForge.js'
import { initObsidian } from './Obsidian.js'
import { initOhTheTreesYoullGrow } from './OhTheTreesYoullGrow.js'
import { initRunecraftory } from './RuneCraftory.js'
import { initSimpleQuests } from './SimpleQuests.js'

export * from './ImmersiveWeathering.js'
export * from './Lithostitched.js'
export * from './RuneCraftory.js'
export * from './SimpleQuests.js'

export function initPartners(schemas: SchemaRegistry, collections: CollectionRegistry, version: VersionId) {
	initImmersiveWeathering(schemas, collections)
	initLithostitched(schemas, collections, version)
	initNeoForge(schemas, collections, version)
	initObsidian(schemas, collections)
	initOhTheTreesYoullGrow(schemas, collections)
	initRunecraftory(version, schemas, collections)
	initSimpleQuests(version, schemas, collections)
}
