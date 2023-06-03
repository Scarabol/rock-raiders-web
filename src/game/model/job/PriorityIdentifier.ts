import { MaterialEntityType } from '../../entity/MaterialSpawner'
import { EntityType } from '../EntityType'

export enum PriorityIdentifier { // This needs to be an actual enum, because it is serialized between workers
    NONE = 0, // useful for truthiness checks
    TRAIN,
    GET_IN,
    CRYSTAL,
    ORE,
    REPAIR,
    CLEARING,
    DESTRUCTION,
    CONSTRUCTION,
    REINFORCE,
    RECHARGE,
}

export function priorityIdentifierFromString(name: string) {
    if (name.equalsIgnoreCase('AI_Priority_Train')) {
        return PriorityIdentifier.TRAIN
    } else if (name.equalsIgnoreCase('AI_Priority_GetIn')) {
        return PriorityIdentifier.GET_IN
    } else if (name.equalsIgnoreCase('AI_Priority_Crystal')) {
        return PriorityIdentifier.CRYSTAL
    } else if (name.equalsIgnoreCase('AI_Priority_Ore')) {
        return PriorityIdentifier.ORE
    } else if (name.equalsIgnoreCase('AI_Priority_Repair')) {
        return PriorityIdentifier.REPAIR
    } else if (name.equalsIgnoreCase('AI_Priority_Clearing')) {
        return PriorityIdentifier.CLEARING
    } else if (name.equalsIgnoreCase('AI_Priority_Destruction')) {
        return PriorityIdentifier.DESTRUCTION
    } else if (name.equalsIgnoreCase('AI_Priority_Construction')) {
        return PriorityIdentifier.CONSTRUCTION
    } else if (name.equalsIgnoreCase('AI_Priority_Reinforce')) {
        return PriorityIdentifier.REINFORCE
    } else if (name.equalsIgnoreCase('AI_Priority_Recharge')) {
        return PriorityIdentifier.RECHARGE
    } else {
        throw new Error(`Unexpected priority identifier ${name}`)
    }
}

export function priorityIdentifierFromMaterialType(entityType: MaterialEntityType): PriorityIdentifier {
    switch (entityType) {
        case EntityType.CRYSTAL:
            return PriorityIdentifier.CRYSTAL
        case EntityType.ORE:
        case EntityType.BRICK:
            return PriorityIdentifier.ORE
        case EntityType.BARRIER:
        case EntityType.ELECTRIC_FENCE:
            return PriorityIdentifier.CONSTRUCTION
        case EntityType.DYNAMITE:
            return PriorityIdentifier.DESTRUCTION
        default:
            console.error(`Unexpected entity type ${EntityType[entityType]}`)
            return PriorityIdentifier.NONE
    }
}
