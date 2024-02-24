import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import { VersionId } from '../services/Schemas.js'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initLithostitched } from './Lithostitched.js'
import { initObsidian } from './Obsidian.js'
import { initOhTheTreesYoullGrow } from './OhTheTreesYoullGrow.js'
import { initRunecraftory } from './RuneCraftory.js'
import { initSimpleQuests } from './SimpleQuests.js'

export * from './ImmersiveWeathering.js'
export * from './Lithostitched.js'
export * from './RuneCraftory.js'
export * from './SimpleQuests.js'

export function initPartners(id: VersionId, schemas: SchemaRegistry, collections: CollectionRegistry) {
	initImmersiveWeathering(schemas, collections)
	initLithostitched(schemas, collections)
	initObsidian(schemas, collections)
	initOhTheTreesYoullGrow(schemas, collections)
	initRunecraftory(id, schemas, collections)
	initSimpleQuests(id, schemas, collections)
}
