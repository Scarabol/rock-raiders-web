/*
 Copycat from https://github.com/jakearchibald/idb-keyval

 - With custom db and object store name
 - No need for npm dependency and some unused functions
 */

import { ASSET_CACHE_DB_NAME, ASSET_CACHE_VERSION } from '../../params'

export function promisifyRequest<T = undefined>(
    request: IDBRequest<T> | IDBTransaction,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        // @ts-ignore - file size hacks
        request.oncomplete = request.onsuccess = () => resolve(request.result)
        // @ts-ignore - file size hacks
        request.onabort = request.onerror = () => reject(request.error)
    })
}

export function createStore(storeName: string): UseStore {
    const request = indexedDB.open(ASSET_CACHE_DB_NAME, ASSET_CACHE_VERSION)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    const dbp = promisifyRequest(request)

    return (txMode, callback) =>
        dbp.then((db) =>
            callback(db.transaction(storeName, txMode).objectStore(storeName)),
        )
}

export type UseStore = <T>(
    txMode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => T | PromiseLike<T>,
) => Promise<T>;

let defaultGetStoreFunc: UseStore | undefined

function defaultGetStore() {
    if (!defaultGetStoreFunc) {
        defaultGetStoreFunc = createStore('assetCache')
    }
    return defaultGetStoreFunc
}

export function cacheGetData<T = any>(
    key: IDBValidKey,
    customStore = defaultGetStore(),
): Promise<T | undefined> {
    return customStore('readonly', (store) => promisifyRequest(store.get(key)))
}

export function cachePutData(
    key: IDBValidKey,
    value: any,
    customStore = defaultGetStore(),
): Promise<void> {
    return customStore('readwrite', (store) => {
        store.put(value, key)
        return promisifyRequest(store.transaction)
    })
}
