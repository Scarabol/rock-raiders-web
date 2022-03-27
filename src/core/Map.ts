declare global {
    interface Map<K, V> {
        getOrUpdate(key: K, updateCallback: () => V): V

        getOrDefault(key: K, fallback: V): V

        some(predicate: (value: V) => boolean): boolean
    }
}

Map.prototype.getOrUpdate = function <K, V>(key: K, updateCallback: () => V): V {
    let value = this.get(key)
    if (value === undefined) {
        value = updateCallback()
        this.set(key, value)
    }
    return value
}

Map.prototype.getOrDefault = function <K, V>(key: K, fallback: V): V {
    return this.has(key) ? this.get(key) : fallback
}

Map.prototype.some = function <K, V>(predicate: (element: V) => boolean): boolean {
    for (const value of this.values()) {
        if (predicate(value)) return true
    }
    return false
}

export {}
