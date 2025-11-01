/*
 Inspired by https://gist.github.com/mbforbes/5604a426a7f9b054d0308ac3cc170037
 */

export type GameEntity = number

export abstract class AbstractGameComponent {
    markDirty: () => void = () => {
    }
}

export type FilteredEntities = Map<GameEntity, ComponentContainer>

export class EntityFilter {
    readonly entities: FilteredEntities = new Map()
    readonly componentsRequired: Set<Function>

    constructor(components: Function[]) {
        this.componentsRequired = new Set(components)
    }
}

export abstract class AbstractGameSystem {
    readonly filters: Set<EntityFilter> = new Set()

    abstract update(ecs: ECS, elapsedMs: number): void

    addEntityFilter(...components: Function[]): FilteredEntities {
        const filter = new EntityFilter(components)
        this.filters.add(filter)
        return filter.entities
    }
}

export type ComponentClass<T extends AbstractGameComponent> = new (...args: any[]) => T

export class ComponentContainer {
    private map = new Map<Function, AbstractGameComponent>()

    add(component: AbstractGameComponent): void {
        this.map.set(component.constructor, component)
    }

    get<T extends AbstractGameComponent>(componentClass: ComponentClass<T>): T {
        const component = this.map.get(componentClass)
        if (!component) throw new Error(`Component ${componentClass.name} not found`)
        return component as T
    }

    getOptional<T extends AbstractGameComponent>(componentClass: ComponentClass<T>): T | undefined {
        return this.map.get(componentClass) as T | undefined
    }

    has(componentClass: Function): boolean {
        return this.map.has(componentClass)
    }

    hasAll(componentClasses: Iterable<Function>): boolean {
        for (const cls of componentClasses) {
            if (!this.map.has(cls)) {
                return false
            }
        }
        return true
    }

    delete(componentClass: Function): void {
        this.map.delete(componentClass)
    }
}

export class ECS {
    private entities = new Map<GameEntity, ComponentContainer>()
    private systems = new Map<AbstractGameSystem, Set<EntityFilter>>()
    private nextEntityID = 1
    private entitiesToDestroy = new Array<GameEntity>()

    reset(): void {
        this.entities.clear()
        this.nextEntityID = 1
        this.entitiesToDestroy.length = 0
        this.systems.forEach((filters) => filters.forEach((f) => f.entities.clear()))
    }

    addEntity(): GameEntity {
        const entity = this.nextEntityID
        this.nextEntityID++
        this.entities.set(entity, new ComponentContainer())
        return entity
    }

    removeEntity(entity: GameEntity): void {
        this.entitiesToDestroy.push(entity)
    }

    addComponent<T extends AbstractGameComponent>(entity: GameEntity, component: T): T {
        this.entities.get(entity)?.add(component)
        this.checkEntity(entity)
        return component
    }

    public getComponents(entity: GameEntity): ComponentContainer {
        const container = this.entities.get(entity)
        if (container) return container
        console.warn(`Entity (${entity}) unknow to ECS; must be referenced otherwise`)
        return new ComponentContainer()
    }

    removeComponent(entity: GameEntity, component: Function): void {
        this.entities.get(entity)?.delete(component)
        this.checkEntity(entity)
    }

    addSystem<T extends AbstractGameSystem>(system: T): T {
        if (system.filters.size == 0) {
            console.warn('System not added: no filter', system)
            return system
        }
        this.systems.set(system, system.filters)
        for (const entity of this.entities.keys()) {
            this.checkEntityWithSystem(entity, system)
        }
        return system
    }

    update(elapsedMs: number): void {
        for (const system of this.systems.keys()) {
            system.update(this, elapsedMs)
        }
        while (this.entitiesToDestroy.length > 0) {
            this.destroyEntity(this.entitiesToDestroy.pop())
        }
    }

    private destroyEntity(entity: GameEntity | undefined): void {
        if (entity === undefined) return
        this.entities.delete(entity)
        this.systems.values().forEach((filters) => filters.forEach((f) => f.entities.delete(entity)))
    }

    private checkEntity(entity: GameEntity): void {
        for (const system of this.systems.keys()) {
            this.checkEntityWithSystem(entity, system)
        }
    }

    private checkEntityWithSystem(entity: GameEntity, system: AbstractGameSystem): void {
        const components = this.entities.get(entity)
        if (!components) return
        system.filters.forEach((filter) => {
            if (components.hasAll(filter.componentsRequired)) {
                filter.entities.set(entity, components)
            } else {
                filter.entities.delete(entity)
            }
        })
    }
}
