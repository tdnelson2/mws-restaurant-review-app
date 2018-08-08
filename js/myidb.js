

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
    this.dbPromise     = this.open();
  }

  open() {
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
    const items = 
      typeof data[Symbol.iterator] === 'function'
        ? data
        : [data];

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

  getItem(key, shouldGetAll) {
    return this.dbPromise.then(db => {
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

