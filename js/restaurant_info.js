/* global google, DBHelper, buildPictureEl, ScrollButton */

self.restaurant;
self.map;

/**
 * New thumb images are served according to the follwing criteria:
 ** - Breakpoints
 ** - Mid-point between breakpoints
 ** - As needed to ensure img width in UI won't exceed width provided
 */
const restaurantImgSizes = [
  { vpWidth: 2240, width1x: 615, width2x: 1230 },
  { vpWidth: 1920, width1x: 539, width2x: 1078 },
  { vpWidth: 1585, width1x: 455, width2x: 910 },
  { vpWidth: 1250, width1x: 372, width2x: 744 },
  { vpWidth: 1075, width1x: 584, width2x: 1168 },
  { vpWidth: 900,  width1x: 498, width2x: 996 },
  { vpWidth: 740,  width1x: 425, width2x: 850 },
  { vpWidth: 580,  width1x: 345, width2x: 690 },
  { vpWidth: 490,  width1x: 539, width2x: 1078 },
  { vpWidth: 400,  width1x: 455, width2x: 910 },
  { vpWidth: 320,  width1x: 360, width2x: 720 } ];
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
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
  });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageContainer = document.getElementById('restaurant-img-container');
  imageContainer.append(buildPictureEl(restaurant, restaurantImgSizes));

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Adjust restaurant name width so elipses is added correctly.
 */
const setRestaurantNameWidth = () => {
  document.getElementById('restaurant-name').style.width = `${window.innerWidth-20}px`;
};

setRestaurantNameWidth();

window.addEventListener('resize', () => {
  setRestaurantNameWidth();
});

/**
 * Listen for when user clicks "More details".
 */
const offset = 209;
const maxMobileRes = 900;
const buttonScrollThreshold = 15;
const restaurantNameEl = document.getElementById('restaurant-name-container');
const scrollButton = new ScrollButton(restaurantNameEl, 'as-button', maxMobileRes, buttonScrollThreshold, offset);

/**
 * Handle accessibility button "Skip to main content".
 */
const skipToMainContent = () => { // eslint-disable-line no-unused-vars
  if (window.innerWidth < maxMobileRes) {
    scrollButton.executeScroll();
  } else {
    restaurantNameEl.focus();
  }
};
