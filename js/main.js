
/*
global
DBHelper
fillCustomSelectBox
google
buildPictureEl
MyIDB
appName
fetchRestaurantFromURL
fillBreadcrumb
setRestaurantNameWidth
ScrollButton
ToggleButton
fillRestaurantHTML
Restaurant
getParameterByName
fillReviewsHTML
fillRestaurantHoursHTML
updateReviewAfterNetworkReestablished
DOM_CONTENT_LOADED
*/

/* begin main page specific properties */
self.restaurantIDBName = appName + '_restaurants';
self.restaurantIDB = new MyIDB(self.restaurantIDBName, self.restaurantIDBName, 1, 'id', ['id', 'isPosted']);
self.restaurants;
self.neighborhoods;
self.cuisines;
self.map;
self.markers = [];
self.restaurantEls = [];
/* end main page specific properties */

/* begin restaurant info page specific properties */
self.scrollButton;
self.maxMobileRes = 900;
self.restaurantNameEl;
self.reviewIDBName = appName + '_reviews';
self.reviewIDB = new MyIDB(self.reviewIDBName, self.reviewIDBName, 1, 'id', ['restaurant_id', 'id', 'isPosted', 'isOnServer', 'shouldDelete']);
/* end restaurant info page specific properties */

/* begin shared properties */
self.pathname = window.location.pathname;
self.mapLoaded;
self.idbFetch;
self.networkFetch;
self.snackbarIsVisible = false;
/* end shared properties */


/**
 * Add snackbar to dom.
 */
const addSnackbarHTML = () => {
  const body = document.getElementsByTagName('body')[0];
  const snackbar = document.createElement('div');
  snackbar.id = 'snackbar';
  const snackbarText = document.createElement('p');
  snackbarText.setAttribute('aria-live', 'polite');
  snackbar.appendChild(snackbarText);
  body.appendChild(snackbar);
};

addSnackbarHTML();

const resolveReject = (results, error, resolve, reject, msg) => {
  if (results) {
    resolve(results);
  } else {
    console.error(msg,error);
    reject(error);
  }
};


self.idbFetch = new Promise((idbResolve, idbReject) => {
  self.networkFetch = new Promise((networkResolve, networkReject) => {
    if (self.pathname == '/') {
      // Initialize the main page.
      DBHelper.fetchRestaurants(self.restaurantIDB, (idbResults, idbError) => {
        resolveReject(idbResults, idbError, idbResolve, idbReject, 'fetch restaurants from idb');
      }, (networkResults, networkError) => {
        resolveReject(networkResults, networkError, networkResolve, networkReject, 'fetch restaurants from network');
      });
    } else if (self.pathname == '/restaurant.html') {
    // Initialize the Restaurant Info page.
      fetchRestaurantFromURL((idbResults, idbError) => {
        if (idbResults && idbResults.length) idbResults = idbResults[0];
        resolveReject(idbResults, idbError, idbResolve, idbReject, 'fetch restaurant from idb');
      }, (networkResults, networkError) => {
        if (networkResults && networkResults.length) networkResults = networkResults[0];
        resolveReject(networkResults, networkError, networkResolve, networkReject, 'fetch restaurant from network');
      });
    }
  });
});

/**
 * Initialize Google map, (`self.mapPromise` is defined in ../js-header/header.js).
 */
self.mapLoaded = new Promise((resolve) => {
  self.mapPromise
    .then(() => {
      const pathname = window.location.pathname;
      if (pathname == '/') {

        // Initialize the Main page.
        let loc = {
          lat: 40.722216,
          lng: -73.987501
        };
        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 12,
          center: loc,
          scrollwheel: false
        });
        addMarkersToMap()
          .then(() => resolve());
      } else if (pathname == '/restaurant.html') {
        let currentRestaurant;
        // Initialize the map for the Restaurant Info page.
        for (const promise of [self.idbFetch, self.networkFetch]) {
          promise
            .then(restaurant => {
              if (currentRestaurant) return;
              currentRestaurant = restaurant;
              self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
              });
              fillBreadcrumb(restaurant);
              DBHelper.mapMarkerForRestaurant(restaurant, self.map);
            })
            .catch(error => console.error(error));
        }
        resolve();
      }
    });
});

/**
 * Attempt to submit unsubmitted data every 10 seconds.
 */
const manageOffline = () => {
  DBHelper.manageOffline(
    self.restaurantIDB,
    self.reviewIDB,
    updateReviewAfterNetworkReestablished,
    updateRestaurantAfterNetworkReestablished);
};

const initializePage = (promises = [self.idbFetch, self.networkFetch]) => {
  Promise.race(promises)
    .then(() => manageOffline())
    .catch(() => manageOffline());
  promises.forEach(promise => {
    if (self.pathname == '/') {
      promise
        .then(results => {
          DBHelper.fetchNeighborhoods(results, fetchNeighborhoods);
          DBHelper.fetchCuisines(results, fetchCuisines);
          fillRestaurantsHTML(results);
        })
        .catch(error => console.error(error));
    } else if (self.pathname == '/restaurant.html') {
      // Initialize the Restaurant Info page.
      promise
        .then(restaurant => {

          // Populate the page.
          fillRestaurantHTML(restaurant);
          if (restaurant.operating_hours) {
            fillRestaurantHoursHTML(restaurant.operating_hours);
          }
          const reviewsCallback = (results, error) => {
            if (results) {
              fillReviewsHTML(results);
            } else {
              console.error(error);
              fillReviewsHTML();
            }
          };
          const id = getParameterByName('id');
          DBHelper.fetchAllReviewsForRestuarant(self.reviewIDB, id, reviewsCallback, reviewsCallback);

          // Setup the scroll buttonl
          const offset = 209;
          const buttonScrollThreshold = 15;
          self.restaurantNameEl = document.getElementById('restaurant-name-container');
          self.scrollButton = new ScrollButton(
            self.restaurantNameEl, 
            'as-button', 
            self.maxMobileRes, 
            buttonScrollThreshold, 
            offset);

          setRestaurantNameWidth();

          window.addEventListener('resize', () => {
            setRestaurantNameWidth();
          });
        })
        .catch(error => console.error(error));
    }
  });
};

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
if (DOM_CONTENT_LOADED) {
  initializePage();
} else {
  document.addEventListener('DOMContentLoaded', function () {
    initializePage();
  });
}

/**
 * New thumb images are served according to the follwing criteria:
 ** - Breakpoints
 ** - Mid-point between breakpoints
 ** - As needed to ensure img width in UI won't exceed width provided
 */
const restaurantThumbs = [
  { vpWidth: 1850, width2x: 624, width1x: 312 },
  { vpWidth: 1650, width2x: 460, width1x: 230 },
  { vpWidth: 1450, width2x: 624, width1x: 312 },
  { vpWidth: 1250, width2x: 522, width1x: 261 },
  { vpWidth: 1075, width2x: 624, width1x: 312 },
  { vpWidth: 900,  width2x: 508, width1x: 254 },
  { vpWidth: 740,  width2x: 682, width1x: 341 },
  { vpWidth: 580,  width2x: 522, width1x: 261 },
  { vpWidth: 450,  width2x: 910, width1x: 460 },
  { vpWidth: 320,  width2x: 652, width1x: 326 }];

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = (error, neighborhoods) => {
  if (error) { // Got an error
    console.error(error);
  } else {
    self.neighborhoods = neighborhoods;
    self.mapLoaded
      .then(() => fillNeighborhoodsHTML());
  }
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = (error, cuisines) => {
  if (error) { // Got an error!
    console.error(error);
  } else {
    self.cuisines = cuisines;
    self.mapLoaded
      .then(() => fillCuisinesHTML());
  }
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  fillCustomSelectBox(
    neighborhoods,
    'neighborhoods-select',
    'neighborhoods-select-button',
    'Filter results by neighborhoods',
    filterRestaurants);
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  fillCustomSelectBox(
    cuisines,
    'cuisines-select',
    'cuisines-select-button',
    'Filter results by cuisines',
    filterRestaurants);
};

/**
 * Update restaurant after network connection is restored.
 */
const updateRestaurantAfterNetworkReestablished = () => {
  showSnackbar('Connection restored. Queued data submitted successfully.', 6);
};

const filterRestaurants = () => {
  const cuisine = document.getElementById('cuisines-select-button').getAttribute('value');
  const neighborhood = document.getElementById('neighborhoods-select-button').getAttribute('value');
  const toggleMarker = (state, restaurant) => {
    const markerCheck = m => m.title === restaurant.data.name;
    if (self.markers.some(markerCheck)) {
      const marker = self.markers.filter(markerCheck)[0];
      marker.setVisible(state);
    }
  };
  for (const restaurant of self.restaurantEls) {
    if (
      (cuisine == 'all' || restaurant.data.cuisine_type == cuisine)
      &&
      (neighborhood == 'all' || restaurant.data.neighborhood == neighborhood)
    )
    {
      restaurant.el.style.removeProperty('display');
      toggleMarker(true, restaurant);
    } else {
      restaurant.el.style.display = 'none';
      toggleMarker(false, restaurant);
    }
  }
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    const restaurantEl = getViewByID(self.restaurantEls, restaurant.id);
    if (restaurantEl) {
      this.restaurantEl.update(restaurant);
    } else {
      ul.appendChild(createRestaurantHTML(restaurant));
    }
  });
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  li.appendChild(buildPictureEl(restaurant, restaurantThumbs));
  li.setAttribute('aria-labelledby', 'restaurant-list-items');

  const nameid = `restaurant-name-${restaurant.id}`;
  const name = document.createElement('h4');
  name.setAttribute('id', nameid);
  name.innerHTML = restaurant.name;
  li.appendChild(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.appendChild(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.appendChild(address);

  const favButton = addFavoriteButton(restaurant, li, 'star-inactive-focused', 'star-active-focused');

  const moreLebelID = `more-label-${restaurant.id}`;

  const moreLabel = document.createElement('label');
  moreLabel.setAttribute('id', moreLebelID);
  moreLabel.innerHTML = `View details about ${restaurant.name}`;
  moreLabel.style.display = 'none';
  li.appendChild(moreLabel);

  const more = document.createElement('button');
  more.classList.add('more-details-btn');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-labelledby', moreLebelID);
  more.setAttribute('onclick', `location.href='${DBHelper.urlForRestaurant(restaurant)}';`);
  more.setAttribute('tabindex', '0');
  li.appendChild(more);

  self.restaurantEls.push(new Restaurant(restaurant, li, favButton));

  return li;
};

const getViewByID = (arrayOfViews, id) => { // eslint-disable-line no-unused-vars
  const check = r => r.id === id;
  if (arrayOfViews.some(check)) return arrayOfViews.filter(check)[0];
};

const addFavoriteButton = (restaurant, el, hoverInactiveCls, hoverActiveCls) => {
  const favLabelID = `favorite-label-${restaurant.id}`;

  const favLabel = document.createElement('label');
  favLabel.setAttribute('id', favLabelID);
  favLabel.innerHTML = `Mark ${restaurant.name} as a favorite restaurant`;
  favLabel.style.display = 'none';
  el.appendChild(favLabel);

  const favorite = document.createElement('button');
  favorite.classList.add('blank-button');
  const favContents = document.createElement('div');
  favorite.setAttribute('role', 'checkbox');
  favorite.appendChild(favContents);
  favorite.setAttribute('aria-labelledby', favLabelID);
  el.appendChild(favorite);

  let isOn = restaurant.is_favorite;
  if (isOn == 'false') {
    isOn = false;
  } else if (isOn == 'true') {
    isOn = true;
  }

  const favButton = new ToggleButton(
    favorite,
    favContents,
    restaurant.id,
    favoriteButtonClicked,
    'star-active',
    'star-inactive',
    hoverInactiveCls,
    hoverActiveCls,
    isOn);
  return favButton;
};

/**
 * Post favorite state when favorite button is clicked.
 */
const favoriteButtonClicked = (id, shouldToggleOn) => {
  DBHelper.updateFavorite(self.restaurantIDB, id, shouldToggleOn, (result, error, type) => {
    if (result && type === 'NETWORK') {
      if (shouldToggleOn) {
        showSnackbar('Marked as favorite.', 4);
      } else {
        showSnackbar('Removed from favorites.', 4);
      }
    } else if (error && type === 'NETWORK') {
      if (shouldToggleOn) {
        showSnackbar('No connection. Restaurant will be added to favorites when restored.', 4);
      } else {
        showSnackbar('No connection. Restaurant will be removed from favorites when restored.', 4);
      }
    }
  });
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (promises = [self.idbFetch, self.networkFetch]) => {
  return new Promise((resolve) => {
    for (const promise of promises) {
      promise
        .then(restaurants => {
          for (const restaurant of restaurants) {
            // Add marker to the map
            const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
            google.maps.event.addListener(marker, 'click', () => {
              window.location.href = marker.url;
            });
            self.markers.push(marker);
          }
          resolve();
        })
        .catch(error => {
          console.error(error);
          resolve();
        });
    }
  });
};

/**
 * Notify user when something happens.
 */
const showSnackbar = (message, duration) => { // eslint-disable-line no-unused-vars
  if (self.snackbarIsVisible) return;
  self.snackbarIsVisible = true;
  duration = duration - 0.5;
  const snack = document.getElementById('snackbar');
  // snack.setAttribute('aria-live', 'polite');
  const snackbarText = snack.getElementsByTagName('p')[0];
  snackbarText.innerHTML = message;
  // snackbarText.setAttribute('aria-live', 'polite');
  snack.style.cssText = `visibility: visible; animation: fadein 0.5s, fadeout 0.5s ${duration - 0.5}s;`;
  setTimeout(() => {
    snack.style.cssText = '';
    // snack.setAttribute('aria-live', 'off');
    self.snackbarIsVisible = false;
  }, duration * 1000);
};