declare global {
    interface Map<K, V> {
        getOrUpdate(key: K, updateCallback: () => V): V

        upsert(key: K, updateCallback: (prevVal?: V) => V): V
    }
}

// XXX Might be replaced with Map.prototype.emplace one day, see https://github.com/tc39/proposal-upsert
Map.prototype.getOrUpdate = function <K, V>(key: K, insertCallback: () => V): V {
    let value = this.get(key)
    if (value === undefined) {
        value = insertCallback()
        this.set(key, value)
    }
    return value
}

// XXX Might be replaced with Map.prototype.emplace one day, see https://github.com/tc39/proposal-upsert
Map.prototype.upsert = function <K, V>(key: K, updateCallback: (prevVal?: V) => V): V {
    const value = updateCallback(this.get(key)) // if used with Map.prototype.has this becomes incompatible with MapWithDefault
    this.set(key, value)
    return value
}

export {}
