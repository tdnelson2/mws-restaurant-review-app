

/**
 * Implements an IndexedDB instance.
 * Dependency: `idb` (https://www.npmjs.com/package/idb).
 * @param {String}  dbName      The name to be given to the database.
 * @param {String}  dbStoreName The name to be given to the database store.
 * @param {Integer} dbVersion   The database version.
 * @param {String}  primaryKey  The object key to use as the primary key in the database.
 * @param {String}  dateKey     The object key to use as the date key in the database.
 * @param {Integer} limit       The maximum number of items allowed in the database.
 */
class MyIDB { // eslint-disable-line no-unused-vars

  constructor(dbName, dbStoreName, dbVersion, primaryKey, dateKey, limit) {
    this.dbName        = dbName;
    this.dbStoreName   = dbStoreName;
    this.dbVersion     = dbVersion;
    this.primaryKey    = primaryKey;
    this.dateKey       = dateKey;
    this.limit         = limit;
    this.items         = []; // Allows items to be saved even if IndexedDB isn't supported.
    this.dbPromise     = this.open();
  }

  open() {
    if (!navigator.serviceWorker) return Promise.resolve();
    return self.idb.open(this.dbName, this.dbVersion, upgradeDb => {
      switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb
          .createObjectStore(this.dbStoreName, { keyPath: this.primaryKey })
          .createIndex('by-date', this.dateKey);
      }
    });
  }

  update(data) {
    // Add to buffer in case IndexedDB isn't supported.
    const items = this.addToBuffer(data);

    for (const item of items) {
      const result = this.getItemFromBuffer(item[this.primaryKey]);
      if (result.length === 0) {
        // console.log('adding to buffer: ', item);
        this.items.push(item);
      }
    }

    return this.dbPromise.then(db => {
      if (!db) return Promise.resolve();

      const store = db
        .transaction(this.dbStoreName, 'readwrite')
        .objectStore(this.dbStoreName);

      for (let item of items) {
        store.put(item);
      }

      // limit to the specified number of items
      return store
        .index('by-date')
        .openCursor(null, 'prev')
        .then(cursor => {
          return cursor.advance(this.limit);
        }).then(function deleteRest(cursor) {
          if (!cursor) return;
          cursor.delete();
          return cursor
            .continue()
            .then(deleteRest);
        });
    });
  }

  addToBuffer(data) {
    const items = this._makeArrayIfNot(data);
    for (const item of items) {
      const result = this.getItemFromBuffer(item[this.primaryKey]);
      if (result.length === 0) {
        // console.log('adding to buffer: ', item);
        this.items.push(item);
      }
    }
    return items;
  }

  getItemFromBuffer(key) {
    return this.items.filter(r => r[this.primaryKey] == key);
  }

  _makeArrayIfNot(data) {
    return typeof data[Symbol.iterator] === 'function'
      ? data
      : [data];
  }

  getItem(key, shouldGetAll) {
    return this.dbPromise.then(db => {
      if (this.items.length !== 0) {
        if (shouldGetAll) {
          // console.log('get ALL from buffer: ', this.items);
          return Promise.resolve(this.items);
        }
        const result = this.getItemFromBuffer(key);
        // console.log(`get id: ${key} from buffer: `, result);
        return Promise.resolve(result.length > 0 ? result[0] : undefined);
      }
      if (!db) return Promise.resolve();
      const tx = db
        .transaction(this.dbStoreName)
        .objectStore(this.dbStoreName);
      if (shouldGetAll) return tx.getAll();
      return tx.get(key);
    });
  }

  getItems() {
    return this.getItem(null, true);
  }
}

