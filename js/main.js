let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

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
  { vpWidth: 320,  width2x: 652, width1x: 326 }]
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  fillCustomSelectBox(neighborhoods, 'neighborhoods-select', 'neighborhoods-select-button', 'Filter results by neighborhoods');
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  fillCustomSelectBox(cuisines, 'cuisines-select', 'cuisines-select-button', 'Filter results by cuisines');
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cuisine = document.getElementById('cuisines-select-button').getAttribute('value');
  const neighborhood = document.getElementById('neighborhoods-select-button').getAttribute('value');

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  let i = 0;
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant, i));
    i += 1;
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant, i) => {
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
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}