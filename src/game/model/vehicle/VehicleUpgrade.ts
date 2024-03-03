export enum VehicleUpgrade {
    NONE, // useful for truthiness checks
    CARRY,
    SCAN,
    SPEED,
    DRILL,
}

export class VehicleUpgrades {
    static values: VehicleUpgrade[] = [
        VehicleUpgrade.CARRY,
        VehicleUpgrade.SCAN,
        VehicleUpgrade.SPEED,
        VehicleUpgrade.DRILL,
    ]

    static toUpgradeString(upgrades: Set<VehicleUpgrade>): string {
        return (upgrades.has(VehicleUpgrade.CARRY) ? '1' : '0')
            + (upgrades.has(VehicleUpgrade.SCAN) ? '1' : '0')
            + (upgrades.has(VehicleUpgrade.SPEED) ? '1' : '0')
            + (upgrades.has(VehicleUpgrade.DRILL) ? '1' : '0')
    }

    static toCostIndex(upgrade: VehicleUpgrade): number {
        switch (upgrade) {
            case VehicleUpgrade.CARRY:
                return 0
            case VehicleUpgrade.SCAN:
                return 1
            case VehicleUpgrade.SPEED:
                return 2
            case VehicleUpgrade.DRILL:
                return 3
            default:
                throw new Error(`Cannot map upgrade ${upgrade} to cost index`)
        }
    }
}
