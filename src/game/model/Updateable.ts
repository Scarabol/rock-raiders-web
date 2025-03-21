export interface Updatable {
    update(elapsedMs: number): void
}

export function updateSafe(updatable: Updatable | undefined, elapsedMs: number) {
    try {
        if (!updatable) return
        updatable.update(elapsedMs)
    } catch (e) {
        console.error(e)
    }
}
