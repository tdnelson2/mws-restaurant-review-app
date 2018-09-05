
/*global DBHelper, fillCustomSelectBox, google, buildPictureEl MyIDB appName fetchRestaurantFromURL fillBreadcrumb setRestaurantNameWidth ScrollButton ToggleButton Restaurant*/

/* main page */
self.restaurantsPromise;
self.restaurantIDB;
self.restaurants;
self.neighborhoods;
self.cuisines;
self.map;
self.markers = [];


self.restaurantEls = [];

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
  fillCustomSelectBox(neighborhoods, 'neighborhoods-select', 'neighborhoods-select-button', 'Filter results by neighborhoods', filterRestaurants);
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
  fillCustomSelectBox(cuisines, 'cuisines-select', 'cuisines-select-button', 'Filter results by cuisines', filterRestaurants);
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
    self.restaurantsPromise
      .then(results => {
        addMarkersToMap(results);
      })
      .catch(error => {
        console.error(error);
      });
    // updateRestaurants();
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
  self.restaurantsPromise
    .then(results => {
      resetRestaurants(results);
      fillRestaurantsHTML();
    })
    .catch(error => {
      console.error(error);
    });
};

const filterRestaurants = () => {
  const cuisine = document.getElementById('cuisines-select-button').getAttribute('value');
  const neighborhood = document.getElementById('neighborhoods-select-button').getAttribute('value');
  for (let restaurant of self.restaurantEls) {
    if (
      (cuisine == 'all' || restaurant.data.cuisine_type == cuisine)
      &&
      (neighborhood == 'all' || restaurant.data.neighborhood == neighborhood)
    ) {
      restaurant.el.removeAttribute('style');
    } else {
      restaurant.el.style.display = 'none';
    }
  }
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
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

const favoriteButtonClicked = (id, shouldToggleOn) => {
  console.log(`"${id}" was toggled ${shouldToggleOn ? 'on' : 'off'}`);

  self.restaurantIDB.getItem(id)
    .then(data => {
      data.is_favorite = shouldToggleOn;
      return self.restaurantIDB.update(data);
    })
    .then(() => {
      console.log('fav updated successfully');
    })
    .catch(err => console.log(err));

  fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=${shouldToggleOn ? 'true' : 'false'}`,
    {
      method: 'PUT',
      mode: 'cors'
    })
    .then(resp => {
      console.log(resp);
    })
    .catch(err => console.log(err));
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  li.append(buildPictureEl(restaurant, restaurantThumbs));
  li.setAttribute('aria-labelledby', 'restaurant-list-items');

  const nameid = `restaurant-name-${restaurant.id}`;
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

  const favLabelID = `favorite-label-${restaurant.id}`;

  const favLabel = document.createElement('label');
  favLabel.setAttribute('id', favLabelID);
  favLabel.innerHTML = `Mark ${restaurant.name} as a favorite restaurant`;
  favLabel.style.display = 'none';
  li.append(favLabel);

  const favorite = document.createElement('button');
  favorite.classList.add('blank-button');
  const favContents = document.createElement('div');
  favorite.setAttribute('role', 'checkbox');
  favorite.append(favContents);
  favorite.setAttribute('aria-labelledby', favLabelID);
  li.append(favorite);
  console.log(`${restaurant.name}: ${restaurant.is_favorite}`);

  let isOn = restaurant.is_favorite;
  if (isOn == 'false') {
    isOn = false;
  } else if (isOn == 'true') {
    isOn = true;
  }

  new ToggleButton(
    favorite,
    favContents,
    restaurant.id,
    favoriteButtonClicked,
    'star-active',
    'star-inactive',
    'star-inactive-focused',
    'star-active-focused',
    isOn);

  const moreLebelID = `more-label-${restaurant.id}`;

  const moreLabel = document.createElement('label');
  moreLabel.setAttribute('id', moreLebelID);
  moreLabel.innerHTML = `View details about ${restaurant.name}`;
  moreLabel.style.display = 'none';
  li.append(moreLabel);

  const more = document.createElement('button');
  more.classList.add('more-details-btn');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-labelledby', moreLebelID);
  more.setAttribute('onclick', `location.href='${DBHelper.urlForRestaurant(restaurant)}';`);
  more.setAttribute('tabindex', '0');
  li.append(more);

  self.restaurantEls.push(new Restaurant(restaurant, li));

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