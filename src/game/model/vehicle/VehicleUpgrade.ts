export const VEHICLE_UPGRADE = {
    none: 0, // useful for truthiness checks
    carry: 1,
    scan: 2,
    speed: 3,
    drill: 4,
}
export type VehicleUpgrade = typeof VEHICLE_UPGRADE[keyof typeof VEHICLE_UPGRADE]

export class VehicleUpgrades {
    static values: VehicleUpgrade[] = [
        VEHICLE_UPGRADE.carry,
        VEHICLE_UPGRADE.scan,
        VEHICLE_UPGRADE.speed,
        VEHICLE_UPGRADE.drill,
    ]

    static toUpgradeString(upgrades: Set<VehicleUpgrade>): string {
        return (upgrades.has(VEHICLE_UPGRADE.carry) ? '1' : '0')
            + (upgrades.has(VEHICLE_UPGRADE.scan) ? '1' : '0')
            + (upgrades.has(VEHICLE_UPGRADE.speed) ? '1' : '0')
            + (upgrades.has(VEHICLE_UPGRADE.drill) ? '1' : '0')
    }

    static toCostIndex(upgrade: VehicleUpgrade): number {
        switch (upgrade) {
            case VEHICLE_UPGRADE.carry:
                return 0
            case VEHICLE_UPGRADE.scan:
                return 1
            case VEHICLE_UPGRADE.speed:
                return 2
            case VEHICLE_UPGRADE.drill:
                return 3
            default:
                throw new Error(`Cannot map upgrade (${upgrade}) to cost index`)
        }
    }
}
