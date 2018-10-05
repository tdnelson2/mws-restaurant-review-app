
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

  constructor(dbName, dbStoreName, dbVersion, primaryKey, indices, dateKey, limit) {
    this.dbName        = dbName;
    this.dbStoreName   = dbStoreName;
    this.dbVersion     = dbVersion;
    this.primaryKey    = primaryKey;
    this.indices       = indices;
    this.dateKey       = dateKey;
    this.limit         = limit;
    this.dbPromise     = this.open();
  }

  _upgradeDB(upgradeDb) {
    const store = upgradeDb.createObjectStore(this.dbStoreName, { keyPath: this.primaryKey });
    if (this.dateKey && this.limit) {
      store.createIndex('by-date', this.dateKey);
    }

    for (let index of this.indices) {
      store.createIndex(index, index);
    }
  }

  open() {
    if (!self.idb) return Promise.resolve();
    return self.idb.open(this.dbName, this.dbVersion, upgradeDb => {
      switch (upgradeDb.oldVersion) {
      case 0:
        this._upgradeDB(upgradeDb);
      }
    });
  }

  update(data) {
    const items = this._makeArrayIfNot(data);

    return this.dbPromise.then(db => {
      if (!db) return Promise.resolve();

      const tx = db
        .transaction(this.dbStoreName, 'readwrite')
        .objectStore(this.dbStoreName);

      for (let item of items) {
        tx.put(item);
      }
      return tx.complete;
    });
  }

  swap(newData, oldKey) {
    return this.dbPromise.then(db => {
      if (!db) return Promise.resolve();

      const tx = db
        .transaction(this.dbStoreName, 'readwrite')
        .objectStore(this.dbStoreName);
      tx.delete(oldKey);
      tx.put(newData);
      return tx.complete;
    });
  }

  remove(key) {
    return this.dbPromise.then(db => {
      if (!db) return Promise.resolve();

      const tx = db
        .transaction(this.dbStoreName, 'readwrite');
      tx.objectStore(this.dbStoreName).delete(key);
      return tx.complete;
    });
  }

  getOnIndex(index, key) {
    return this.dbPromise.then(db => {
      if (!db) return Promise.resolve();
      const tx = db
        .transaction(this.dbStoreName)
        .objectStore(this.dbStoreName);
      return tx
        .index(index)
        .getAll(key);
    });
  }

  _makeArrayIfNot(data) {
    return typeof data[Symbol.iterator] === 'function'
      ? data
      : [data];
  }

  getItem(key, shouldGetAll) {
    return this.dbPromise.then(db => {
      if (!db) return Promise.resolve();
      const tx = db
        .transaction(this.dbStoreName)
        .objectStore(this.dbStoreName);
      if (shouldGetAll) return tx.getAll();
      return tx.get(key);
    });
  }

  getAllItems() {
    return this.getItem(null, true);
  }
}

