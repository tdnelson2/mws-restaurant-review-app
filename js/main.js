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
const thumbSrcset = [
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
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
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
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
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
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

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
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const buildImgUrl = (name, extension, suffix) => {
    return `${name}-${suffix}w.${extension}`
  }

  const addSrcset = (el, name, extension, width1x, width2x) => {
    el.setAttribute('srcset', `${buildImgUrl(name, extension, width2x)} 2x, `+
                              `${buildImgUrl(name, extension, width1x)} 1x`);
  }

  const createSourceEl = (name, extension, width1x, width2x, vpWidth, mediaQuery) => {
    const source = document.createElement('source');
    source.setAttribute('media', `(${mediaQuery}: ${vpWidth}px)`);
    addSrcset(source, name, extension, width1x, width2x);
    return source;
  }

  const pictureEl = document.createElement('picture');

  const img = DBHelper.imageUrlForRestaurant(restaurant);
  const imgUrl = img.split('.').slice(0, -1).join();
  const extension = img.split('.').slice(-1)[0];
  const srcsetImgs = thumbSrcset.slice(0, -1);
  for (const mg of srcsetImgs) {
    pictureEl.append(
      createSourceEl(imgUrl, extension, mg.width1x, mg.width2x, mg.vpWidth, 'min-width')
      );
  }

  const imgEl = document.createElement('img');
  imgEl.className = 'restaurant-img';
  imgEl.alt = `A photo showing the restaurant named "${restaurant.name}"`;
  imgEl.src = buildImgUrl(imgUrl, extension, thumbSrcset[0].width2x);
  const fallback = thumbSrcset.slice(-1)[0];
  addSrcset(imgEl, imgUrl, extension, fallback.width1x, fallback.width2x);

  pictureEl.append(imgEl);

  li.append(pictureEl);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
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
