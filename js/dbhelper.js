/* global google */

// Taken from https://stackoverflow.com/questions/194846/is-there-any-kind-of-hash-code-function-in-javascript
String.prototype.hashCode = function () {
  var hash = 0;
  for (var i = 0; i < this.length; i++) {
    var character = this.charCodeAt(i);
    hash = ((hash<<5)-hash)+character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const MAKE_ARRAY_IF_NOT = (data) => {
  return typeof data[Symbol.iterator] === 'function'
    ? data
    : [data];
};

const CLONE = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Common database helper functions.
 */
class DBHelper { // eslint-disable-line no-unused-vars

  /**
   * Restaurants Database URL.
   */
  static get RESTAURANTS_DATABASE_URL() {
    return 'http://localhost:1337/restaurants';
  }

  /**
   * Restaurants Database URL.
   */
  static get REVIEWS_DATABASE_URL() {
    return 'http://localhost:1337/reviews';
  }

  /**
   * Use case enums for fetching from idb.
   */
  static get _dataRetrievalUseCase() {
    return {
      GET_ALL: 'GET_ALL',
      GET_ON_INDEX: 'GET_ON_INDEX'
    };
  }

  /**
   * Use case enums for submitting data.
   */
  static get _dataSubmissionUseCase() {
    return {
      UPDATE_FROM_BODY: 'UPDATE_FROM_BODY',
      UPDATE_FROM_URI_PARAM: 'UPDATE_FROM_URI_PARAM',
      CREATE: 'CREATE',
      DELETE: 'DELETE'
    };
  }

  /**
   * Methods used for submitting data.
   */
  static get _method() {
    return {
      POST: 'POST',
      PUT: 'PUT',
      DELETE: 'DELETE'
    };
  }

  /**
   * Keyword arguments for use in `_submitData`.
   */
  static get _submitDataKwargs() {
    return {
      useCase: undefined,             // String
      url: undefined,                 // String
      header: {                       // Object
        method: 'POST',               // String
        body: undefined               // String
      },
      data: {},                       // Object
      primaryKeyName: undefined,      // String
      primaryKey: '',                 // String
      indexKeyName: undefined,        // String
      indexKey: undefined,            // Integer
      shouldThrow: true,              // Boolean
      shouldUpdateDbIfNoNetwork: true // Boolean
    };
  }

  ///////////////////////////////////////////////////////
  //////////////////* RETRIEVING DATA *//////////////////
  ///////////////////////////////////////////////////////

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(restaurantIDB, dbCallback, networkCallback) {
    DBHelper._retrieveData(
      DBHelper._dataRetrievalUseCase.GET_ALL,
      networkCallback, 
      dbCallback, 
      DBHelper.RESTAURANTS_DATABASE_URL, 
      restaurantIDB, 
      'id');
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(restaurantIDB, id, dbCallback, networkCallback) {
    DBHelper._retrieveData(
      DBHelper._dataRetrievalUseCase.GET_ON_INDEX,
      networkCallback, 
      dbCallback, 
      `${DBHelper.RESTAURANTS_DATABASE_URL}/${id}`, 
      restaurantIDB, 
      'id', 
      'id', 
      id);
  }

  /**
   * Fetch all reviews for a restaurant.
   */
  static fetchAllReviewsForRestuarant(reviewsIDB, id, networkCallback, dbCallback) {
    DBHelper._retrieveData(
      DBHelper._dataRetrievalUseCase.GET_ON_INDEX,
      networkCallback, 
      dbCallback, 
      `${DBHelper.REVIEWS_DATABASE_URL}/?restaurant_id=${id}`, 
      reviewsIDB, 
      'id', 
      'restaurant_id', 
      parseInt(id));
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(restaurants, callback) {
    return callback(...DBHelper._getCategories(restaurants, 'neighborhood'));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(restaurants, callback) {
    return callback(...DBHelper._getCategories(restaurants, 'cuisine_type'));
  }

  static _getCategories(restaurants, category) {
    let results = [];
    if (restaurants.length) results = restaurants.map(r => r[category]);

    // Return with duplicates removed.
    const uniqueResults = Array.from(new Set(results));
    return uniqueResults.length 
      ? [null, uniqueResults] 
      : [new Error(`"${category}" could not be fetched.`), null];
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`/restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  static _retrieveData(useCase, networkCallback, dbCallback, url, myIDB, primaryKeyName, index, key) {
    const dataNotYetOnServer          = [];
    const dataNotYetSubmitted         = [];
    const dataNotYetDeleted           = [];
    let   primaryKeysOfModifiedData   = [];
    const untouchedData               = [];
    let   untouchedDataWithoutIDBkeys = [];
    let   filteredNetworkResults      = [];

    const manageOffline = () => {
      const idbFetch = (useCase === DBHelper._dataRetrievalUseCase.GET_ALL)
        ? myIDB.getAllItems()
        : myIDB.getOnIndex(index, key);

      idbFetch
        .then(idbResults => {
          let shouldContinue = true;
          if (idbResults === undefined) shouldContinue = false;
          idbResults = MAKE_ARRAY_IF_NOT(idbResults);
          if (idbResults.length === 0) shouldContinue = false;

          if (shouldContinue) {
            for (const result of idbResults) {
              if (result.shouldDelete) {
                dataNotYetDeleted.push(result);
              } else {
                if (!result.isPosted && result.isOnServer) {
                  dataNotYetSubmitted.push(result);
                } else if (!result.isPosted && !result.isOnServer) {
                  dataNotYetOnServer.push(result);
                } else if (result.isPosted && result.isOnServer) {
                  untouchedData.push(result);
                }
              }
            }
            const clonedData = CLONE(untouchedData);
            untouchedDataWithoutIDBkeys = clonedData.map(d => {
              delete d.isPosted; delete d.isOnServer; delete d.shouldDelete;
              return d;
            });
            const modifiedData = [...dataNotYetSubmitted, ...dataNotYetOnServer, ...dataNotYetDeleted];
            primaryKeysOfModifiedData = modifiedData.map(d => d[primaryKeyName]);
            dbCallback([...untouchedData, ...dataNotYetOnServer, ...dataNotYetSubmitted]);
          }
          manageOnline();
        })
        .catch(err => {
          console.error(err);
          manageOnline();
        });
    };

    const manageOnline = () => {
      fetch(url)
        .then(resp => resp.json())
        .then(networkResults => {
          networkResults = MAKE_ARRAY_IF_NOT(networkResults);
          if (networkResults.length) {

            DBHelper._normalizeNetworkResults(networkResults, primaryKeyName);

            // Remove results where data has been updated locally but not yet submited.
            filteredNetworkResults = networkResults.filter(networkResult => {
              return primaryKeysOfModifiedData.indexOf(networkResult[primaryKeyName]) === -1;
            });

            // If there 'isn't a difference between network data and local data,
            // there's no need to callback, so we check for equality.
            if (!DBHelper._arrayOfObjectsAreEqual(filteredNetworkResults, untouchedDataWithoutIDBkeys, primaryKeyName)) {
              let updatedNetworkResults = filteredNetworkResults.map(d => {
                DBHelper._addIDBKeys(d);
                return d;
              });
              myIDB.update(updatedNetworkResults);
              networkCallback([...dataNotYetOnServer, ...dataNotYetSubmitted, ...updatedNetworkResults]);
            }
          } else {
            networkCallback(null, new Error('No result returned from network'));
          }
        })
        .catch(err => networkCallback(null, err));
    };

    if (self.idb) {
      manageOffline();
    } else {
      manageOnline();
    }
  }

  ///////////////////////////////////////////////////////
  ///////////////////* SUBMITING DATA *//////////////////
  ///////////////////////////////////////////////////////

  /**
   * Update favorite state for restaurant.
   */
  static updateFavorite(restaurantIDB, restaurant_id, isFavorite, callback, shouldThrow = true, shouldUpdateDbIfNoNetwork = true) {
    const k = DBHelper._submitDataKwargs;
    k.useCase = DBHelper._dataSubmissionUseCase.UPDATE_FROM_URI_PARAM;
    k.url = `${DBHelper.RESTAURANTS_DATABASE_URL}/${restaurant_id}/?is_favorite=${isFavorite ? 'true' : 'false'}`;
    k.header.method = DBHelper._method.PUT;
    k.primaryKeyName = 'id';
    k.primaryKey = restaurant_id;
    k.indexKeyName = 'is_favorite';
    k.indexKey = isFavorite ? +true : +false;
    k.shouldThrow = shouldThrow;
    k.shouldUpdateDbIfNoNetwork = shouldUpdateDbIfNoNetwork;

    DBHelper._submitData(callback, restaurantIDB, k);
  }

  /**
   * Update existing review.
   */
  static updateReview(reviewIDB, review_id, data, callback, shouldThrow = true, shouldUpdateDbIfNoNetwork = true) {
    const k = DBHelper._submitDataKwargs;
    k.useCase = DBHelper._dataSubmissionUseCase.UPDATE_FROM_BODY;
    k.url = `${DBHelper.REVIEWS_DATABASE_URL}/${review_id}`;
    k.header.body = JSON.stringify(data);
    k.header.method = DBHelper._method.PUT;
    k.data = data;
    k.primaryKeyName = 'id';
    k.primaryKey = review_id;
    k.shouldThrow = shouldThrow;
    k.shouldUpdateDbIfNoNetwork = shouldUpdateDbIfNoNetwork;

    DBHelper._submitData(callback, reviewIDB, k);
  }

  /**
   * Create new review.
   *///r.createReview(reviewIDB, result.restaurant_id, result, callback, false, false);
  static createReview(reviewIDB, restaurant_id, data, callback, shouldThrow = true, shouldUpdateDbIfNoNetwork = true, offlineID) {
    const k = DBHelper._submitDataKwargs;
    k.useCase = DBHelper._dataSubmissionUseCase.CREATE;
    k.url = DBHelper.REVIEWS_DATABASE_URL;
    k.header.body = JSON.stringify(data);
    k.header.method = DBHelper._method.POST;
    k.data = data;
    k.primaryKeyName = 'id';
    if (offlineID) k.primaryKey = offlineID;
    k.indexKeyName = 'restaurant_id';
    k.indexKey = restaurant_id;
    k.shouldThrow = shouldThrow;
    k.shouldUpdateDbIfNoNetwork = shouldUpdateDbIfNoNetwork;

    DBHelper._submitData(callback, reviewIDB, k);
  }

  static _submitData(callback, myIDB, kwargs) {
    const k = kwargs;

    const manageOnline = () => {
      if (k.data) DBHelper._prepForSubmission(k.data);
      fetch(k.url, k.header)
        .then(resp => resp.json())
        .then(networkResult => {
          if (k.useCase === DBHelper._dataSubmissionUseCase.DELETE) {
            myIDB.remove(k.primaryKey);
            callback(networkResult, null, 'NETWORK');
          } else {
            DBHelper._updateObject(networkResult, k.data || {});
            DBHelper._addIDBKeys(k.data);
            k.data[k.primaryKeyName] = String(k.data[k.primaryKeyName]);
            DBHelper._convertBooleansToInt([k.data], ['is_favorite']);
            if (k.primaryKeyName && k.primaryKey && k.primaryKey.startsWith('UNPOSTED-')) {
              myIDB.swap(k.data, k.primaryKey);
            } else {
              myIDB.update(k.data);
            }
            callback(k.data, null, 'NETWORK');
          }
        })
        .catch(err => {
          if (k.shouldThrow) callback(null, err, 'NETWORK');
          if (k.shouldUpdateDbIfNoNetwork) {
            if (self.idb) manageOffline();
          }
        });
    };

    const manageOffline = () => {
      myIDB.getItem(k.primaryKey)
        .then(result => {
          if (result) {
            if (k.useCase === DBHelper._dataSubmissionUseCase.DELETE) {
              result.shouldDelete = +true;
              myIDB.update(result);
              callback(result, null, 'IDB');
            } else if (k.useCase === DBHelper._dataSubmissionUseCase.UPDATE_FROM_URI_PARAM) {
              result[k.indexKeyName] = k.indexKey;
              result.isPosted = +false;
              myIDB.update(result);
              callback(result, null, 'IDB');
            } else if (k.useCase === DBHelper._dataSubmissionUseCase.UPDATE_FROM_BODY) {
              for (const dataKey of Object.keys(k.data)) {
                result[dataKey] = k.data[dataKey];
              }
              result.isPosted = +false;
              myIDB.update(result);
              callback(result, null, 'IDB');
            }
          } else if (k.useCase !== DBHelper._dataSubmissionUseCase.DELETE) {
            const primaryID = 'UNPOSTED-' + JSON.stringify(k.data).hashCode();
            k.data[k.primaryKeyName] = primaryID;
            [k.data.isOnServer, k.data.isPosted, k.data.shouldDelete] = [+false, +false, +false];
            myIDB.update(k.data);
            callback(k.data, null, 'IDB');
          }
        })
        .catch(err => callback(null, err, 'IDB'));
    };

    if (DBHelper._dataSubmissionUseCase.DELETE
        && k.primaryKey.startsWith('UNPOSTED-')
        && k.shouldUpdateDbIfNoNetwork) {
      manageOffline();
    } else {
      manageOnline();
    }
  }

  ///////////////////////////////////////////////////////
  ///////////////////* DELETING DATA *///////////////////
  ///////////////////////////////////////////////////////

  /**
   * Delete a review.
   */
  static deleteReview(reviewIDB, review_id, callback, shouldThrow = true, shouldUpdateDbIfNoNetwork = true) {
    const k = DBHelper._submitDataKwargs;
    k.useCase = DBHelper._dataSubmissionUseCase.DELETE;
    k.url = `${DBHelper.REVIEWS_DATABASE_URL}/${review_id}`;
    k.header.method = DBHelper._method.DELETE;
    k.primaryKeyName = 'id';
    k.primaryKey = review_id;
    k.shouldThrow = shouldThrow;
    k.shouldUpdateDbIfNoNetwork = shouldUpdateDbIfNoNetwork;

    DBHelper._submitData(callback, reviewIDB, k);
  }

  ///////////////////////////////////////////////////////
  //////////////////* MANAGE OFFLINE *//////////////////
  ///////////////////////////////////////////////////////

  /**
   * Attempt to submit data every 10 seconds.
   */
  static manageOffline(restaurantIDB, reviewIDB, reviewCallback, restaurantCallback) {
    console.log('`manageOffline` started');

    // Tests used in the switch statement.
    //                                              type          index        shouldDelete isOnServer
    const reviewNotOnServer      = JSON.stringify(['review',     'isOnServer', +false,      +false]);
    const reviewNotPosted        = JSON.stringify(['review',     'isPosted',   +false,      +true]);
    const restaurantFavNotPosted = JSON.stringify(['restaurant', 'isPosted',   +false,      +true]);

    const attemptUpdate = (type, myIDB, index, value, callback) => {
      myIDB.getOnIndex(index, value)
        .then(results => {
          if (results && results.length) {
            for (const result of results) {
              const id = result.id;
              if (index === 'shouldDelete') {
                DBHelper.deleteReview(reviewIDB, id, callback, false, false);
                continue;
              }
              const test = JSON.stringify([type, index, result.shouldDelete, result.isOnServer]);
              switch(test) {
              case reviewNotOnServer:
                DBHelper.createReview(reviewIDB, result.restaurant_id, result, callback, false, false, id);
                break;
              case reviewNotPosted:
                DBHelper.updateReview(reviewIDB, id, result, callback, false, false);
                break;
              case restaurantFavNotPosted:
                DBHelper.updateFavorite(restaurantIDB, id, result.is_favorite, restaurantCallback, false, false);
                break;
              }
            }
          }
        })
        .catch(err => console.error(`error trying to retrieve data from ${type}IDB`, err));
    };

    // Call `attemptUpdate` every 10 seconds.
    if (!self.idb) return;
    setInterval(() => {
      for (const params of [
        // type,       myIDB,          index,         value,  callback
        ['restaurant', restaurantIDB, 'isPosted',     +false, restaurantCallback],
        ['review',     reviewIDB,     'isOnServer',   +false, reviewCallback],
        ['review',     reviewIDB,     'isPosted',     +false, reviewCallback],
        ['review',     reviewIDB,     'shouldDelete', +true,  reviewCallback]]) {
        attemptUpdate(...params);
      }
    }, 10000);
  }

  ///////////////////////////////////////////////////////
  /////////////////* HELPER FUNCTIONS *//////////////////
  ///////////////////////////////////////////////////////

  /**
   * Convert booleans and stringified booleans to `0` or `1`.
   * This is necessary for 2 reasons:
   *   To make them indexable in idb.
   *   To ensure they respond correctly to truthy/falsy assertions.
   */
  static _convertBooleansToInt(arrayOfObjects, keys) {
    keys.forEach(key => {
      if (arrayOfObjects.some(r => r.hasOwnProperty(key))) {
        arrayOfObjects.forEach(r => {
          if (r.hasOwnProperty(key)) {
            if (r[key] === 'true' || r[key] === true) {
              r[key] = +true;
            } else if (r[key] === 'false' || r[key] === false) {
              r[key] = +false;
            }
          }
        });
      }
    });
  }

  static _normalizeNetworkResults(networkResults, primaryKeyName) {
    networkResults.forEach(r => r[primaryKeyName] = String(r[primaryKeyName]));
    DBHelper._convertBooleansToInt(networkResults, ['is_favorite']);
  }

  static _addIDBKeys(data) {
    [data.isOnServer, data.isPosted, data.shouldDelete] = [+true, +true, +false];
  }

  static _prepForSubmission(data) {
    for (const key of ['isPosted', 'isOnServer', 'shouldDelete', 'id']) {
      if (data.hasOwnProperty(key)) delete data[key];
    }
    return data;
  }

  static _updateObject(additionalData, fullData) {
    for (const key of Object.keys(additionalData)) {
      fullData[key] = additionalData[key];
    }
  }

  static _arrayOfObjectsAreEqual(arrayOfObjects1, arrayOfObjects2, primaryKeyName) {
    const [array1, array2, pk] = [arrayOfObjects1, arrayOfObjects2, primaryKeyName];
    if (array1.length === 0 && array2.length === 0) return true;
    const array1Keys = array1.map(a => a[pk]);
    let isMatch = true;
    outer: for (let i = 0; i < array1Keys.length; i++) {
      const k = array1Keys[i];
      const [array1R, array2R] = [array1.filter(d => d[pk] === k), array2.filter(d => d[pk] === k)];
      if (!array1R.length || !array2R.length) { isMatch = false; break; }
      const [object1, object2] = [array1R[0], array2R[0]];
      const [object1Keys, object2Keys] = [Object.keys(object1), Object.keys(object2)];
      if (object1Keys.length !== object2Keys.length) { isMatch = false; break; }
      for (const nKey of object1Keys) {
        if (!object2.hasOwnProperty(nKey)) {
          isMatch = false; break outer;
        } else if (JSON.stringify(object1[nKey]) !== JSON.stringify(object2[nKey])) {
          isMatch = false; break outer;
        }
      }
    }
    return isMatch;
  }

}
