/*
 Inspired by https://gist.github.com/mbforbes/5604a426a7f9b054d0308ac3cc170037
 */

export type GameEntity = number

export abstract class AbstractGameComponent {
    markDirty: () => void = () => {
    }
}

export abstract class AbstractGameSystem {
    abstract readonly componentsRequired: Set<Function>
    readonly dirtyComponents: Set<Function> = new Set()

    abstract update(ecs: ECS, elapsedMs: number, entities: Set<GameEntity>, dirty: Set<GameEntity>): void
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
    private systems = new Map<AbstractGameSystem, Set<GameEntity>>()
    private nextEntityID = 1
    private entitiesToDestroy = new Array<GameEntity>()
    private dirtySystemsCare = new Map<Function, Set<AbstractGameSystem>>()
    private dirtyEntities = new Map<AbstractGameSystem, Set<GameEntity>>()

    reset(): void {
        this.entities.clear()
        this.nextEntityID = 1
        this.entitiesToDestroy.length = 0
        this.systems.forEach((s) => s.clear())
        this.dirtyEntities.forEach((m) => m.clear())
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
        component.markDirty = () => {
            this.componentDirty(entity, component)
        }

        this.checkEntity(entity)
        component.markDirty()
        return component
    }

    getComponents(entity: GameEntity): ComponentContainer {
        const container = this.entities.get(entity)
        if (container) return container
        console.warn(`Entity (${entity}) unknow to ECS; must be referenced otherwise`)
        return new ComponentContainer()
    }

    removeComponent(entity: GameEntity, componentClass: Function): void {
        this.entities.get(entity)?.delete(componentClass)
        this.dirtyEntities.forEach((entities, system) => {
            if (system.dirtyComponents.has(componentClass)) entities.delete(entity)
        })
        this.checkEntity(entity)
    }

    addSystem<T extends AbstractGameSystem>(system: T): T {
        if (system.componentsRequired.size == 0) {
            console.warn('System not added: empty Components list.')
            console.warn(system)
            return system
        }
        this.systems.set(system, new Set())
        for (const entity of this.entities.keys()) {
            this.checkEntityWithSystem(entity, system)
        }
        for (const c of system.dirtyComponents) {
            if (!this.dirtySystemsCare.has(c)) {
                this.dirtySystemsCare.set(c, new Set())
            }
            this.dirtySystemsCare.get(c)?.add(system)
        }
        this.dirtyEntities.set(system, new Set())
        return system
    }

    update(elapsedMs: number): void {
        for (const [system, entities] of this.systems.entries()) {
            const dirtySystemEntities = this.dirtyEntities.get(system) ?? new Set()
            system.update(this, elapsedMs, entities, dirtySystemEntities)
            dirtySystemEntities?.clear()
        }
        while (this.entitiesToDestroy.length > 0) {
            this.destroyEntity(this.entitiesToDestroy.pop())
        }
    }

    private destroyEntity(entity: GameEntity | undefined): void {
        if (entity === undefined) return
        this.entities.delete(entity)
        for (const [system, entities] of this.systems.entries()) {
            entities.delete(entity)
            if (this.dirtyEntities.has(system)) {
                this.dirtyEntities.get(system)?.delete(entity)
            }
        }
    }

    private checkEntity(entity: GameEntity): void {
        for (const system of this.systems.keys()) {
            this.checkEntityWithSystem(entity, system)
        }
    }

    private checkEntityWithSystem(entity: GameEntity, system: AbstractGameSystem): void {
        if (this.entities.get(entity)?.hasAll(system.componentsRequired)) {
            this.systems.get(system)?.add(entity)
        } else {
            this.systems.get(system)?.delete(entity)
            if (this.dirtyEntities.has(system)) {
                this.dirtyEntities.get(system)?.delete(entity)
            }
        }
    }

    private componentDirty(entity: GameEntity, component: AbstractGameComponent): void {
        if (!this.dirtySystemsCare.has(component.constructor)) {
            return
        }
        for (const system of this.dirtySystemsCare.get(component.constructor) ?? []) {
            if (this.systems.get(system)?.has(entity)) {
                this.dirtyEntities.get(system)?.add(entity)
            }
        }
    }
}
