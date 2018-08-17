/* global google */

/**
 * Common database helper functions.
 */
class DBHelper { // eslint-disable-line no-unused-vars

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static performFetch(restaurantIDB, id, url, shouldGetAllRestaurants=false) {
    return new Promise((resolve, reject) => {
      const idbFetch = 
        shouldGetAllRestaurants
          ? restaurantIDB.getItems()
          : restaurantIDB.getItem(parseInt(id));

      // Respond with an entry from the IndexedDB if there is one.
      // If there isn't, fetch from the network, store it and respond.
      idbFetch
        .then(result => {
          if (!result || shouldGetAllRestaurants && result.length < 10) {
            fetch(url)
              .then(resp => resp.json())
              .then(responseData => {
                restaurantIDB.update(responseData);
                resolve(responseData);
              })
              .catch(err => reject(err));
          } else {

            // `results` passed the checks so we return it 
            // without going to the network.
            restaurantIDB.addToBuffer(result);
            resolve(result);
          }
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Fetch all restaurants.
   */

  static fetchRestaurants(restaurantIDB) {
    return DBHelper.performFetch(restaurantIDB, null, DBHelper.DATABASE_URL, true);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(restaurantIDB, id) {
    return DBHelper.performFetch(restaurantIDB, id, `${DBHelper.DATABASE_URL}/${id}`);
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(restaurantsPromise, cuisine, neighborhood, callback) {
    // Fetch all restaurants
    restaurantsPromise
      .then(results => {
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(restaurants, callback) {
    return callback(...DBHelper.getCategories(restaurants, 'neighborhood'));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(restaurants, callback) {
    return callback(...DBHelper.getCategories(restaurants, 'cuisine_type'));
  }

  static getCategories(restaurants, category) {
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
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
