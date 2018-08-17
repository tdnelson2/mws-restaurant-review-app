
/*global DBHelper, fillCustomSelectBox, google, buildPictureEl MyIDB appName fetchRestaurantFromURL fillBreadcrumb setRestaurantNameWidth ScrollButton*/

/* main page */
self.restaurantsPromise;
self.restaurantIDB;
self.restaurants;
self.neighborhoods;
self.cuisines;
self.map;
self.markers = [];

/* restaurant info page */
self.scrollButton;
self.maxMobileRes = 900;
self.restaurantNameEl;

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
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  self.restaurantIDB = new MyIDB(appName, appName, 1, 'id', 'createdAt', 20);
  if (window.location.pathname == '/') {
    self.restaurantsPromise = DBHelper.fetchRestaurants(self.restaurantIDB);
    self.restaurantsPromise
      .then(results => {
        DBHelper.fetchNeighborhoods(results, fetchNeighborhoods);
        DBHelper.fetchCuisines(results, fetchCuisines);
        updateRestaurants();
      })
      .catch(err => console.error(err));
  }
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = (error, neighborhoods) => {
  if (error) { // Got an error
    console.error(error);
  } else {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  fillCustomSelectBox(neighborhoods, 'neighborhoods-select', 'neighborhoods-select-button', 'Filter results by neighborhoods', updateRestaurants);
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = (error, cuisines) => {
  if (error) { // Got an error!
    console.error(error);
  } else {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  fillCustomSelectBox(cuisines, 'cuisines-select', 'cuisines-select-button', 'Filter results by cuisines', updateRestaurants);
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  const pathname = window.location.pathname;
  if (pathname == '/') {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    updateRestaurants();
  } else if (pathname == '/restaurant.html') {
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        self.map = new google.maps.Map(document.getElementById('map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      }

      /**
       * Listen for when user clicks "More details".
       */
      const offset = 209;
      const buttonScrollThreshold = 15;
      self.restaurantNameEl = document.getElementById('restaurant-name-container');
      self.scrollButton = new ScrollButton(self.restaurantNameEl, 'as-button', self.maxMobileRes, buttonScrollThreshold, offset);

      setRestaurantNameWidth();

      window.addEventListener('resize', () => {
        setRestaurantNameWidth();
      });
    });
  }
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cuisine = document.getElementById('cuisines-select-button').getAttribute('value');
  const neighborhood = document.getElementById('neighborhoods-select-button').getAttribute('value');
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(self.restaurantsPromise, cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  let i = 0;
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant, i));
    i += 1;
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant, i) => {
  const li = document.createElement('li');

  li.append(buildPictureEl(restaurant, restaurantThumbs));
  li.setAttribute('aria-labelledby', 'restaurant-list-items');

  const nameid = `restaurant-name-${i}`;
  const name = document.createElement('h4');
  name.setAttribute('id', nameid);
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-labelledby', `restaurant-list-items ${nameid}`);
  more.setAttribute('onclick', `location.href='${DBHelper.urlForRestaurant(restaurant)}';`);
  more.setAttribute('tabindex', '0');
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};