import type { CollectionRegistry, SchemaRegistry } from '@mcschema/core'
import { VersionId } from '../services/Schemas.js'
import { initImmersiveWeathering } from './ImmersiveWeathering.js'
import { initSimpleQuests } from './SimpleQuests.js'

export * from './ImmersiveWeathering.js'
export * from './SimpleQuests.js'

export function initPartners(id: VersionId, schemas: SchemaRegistry, collections: CollectionRegistry) {
	initImmersiveWeathering(schemas, collections)
	initSimpleQuests(id, schemas, collections)
}
