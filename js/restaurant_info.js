/* global
DBHelper
buildPictureEl
Review
getViewByID
showSnackbar
addFavoriteButton */

self.restaurant;
self.map;
self.reviews = [];
self.newReview;
self.newReviewInProgress = false;

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
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (idbCallback, networkCallback) => { // eslint-disable-line no-unused-vars
  if (self.restaurant) { // restaurant already fetched!
    networkCallback(self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    networkCallback(null, error);
  } else {
    DBHelper.fetchRestaurantById(self.restaurantIDB, id, idbCallback, networkCallback);
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant) => { // eslint-disable-line no-unused-vars
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  const favButtonContainer = document.getElementById('favorite-button-container');

  addFavoriteButton(restaurant, favButtonContainer, 'star-inactive', 'star-active');

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageContainer = document.getElementById('restaurant-img-container');
  imageContainer.appendChild(buildPictureEl(restaurant, restaurantImgSizes));

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours) => { // eslint-disable-line no-unused-vars
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
const fillReviewsHTML = (reviews) => { // eslint-disable-line no-unused-vars

  if (!document.getElementById('review-section-title')) {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.setAttribute('id', 'review-section-title');
    title.innerHTML = 'Reviews';
    container.prepend(title);

    const newReviewButton = document.createElement('button');
    newReviewButton.classList = 'add-review-button';
    newReviewButton.setAttribute('onclick', 'showNewReviewForm()');
    newReviewButton.innerHTML = 'Add Review';
    container.prepend(newReviewButton);
  }

  const ul = document.getElementById('reviews-list');

  if (reviews && reviews.length) {
    for (const review of reviews) {
      const reviewView = getViewByID(self.reviews, review.id);
      if (reviewView) {
        reviewView.update(review); 
      } else {
        const reviewEl = document.createElement('li');
        self.reviews.push(new Review(
          reviewEl,
          ul,
          review.restaurant_id,
          addNewReview,
          updateReview,
          deleteReview,
          review));
      }
    }
    sortReviewsByDate();
  } else if (!self.reviews.length) {
    addEmptyReviewPlaceholder();
  }
  if (self.reviews.length) removeEmptyReviewPlaceholder();
};

const addEmptyReviewPlaceholder = () => {
  if (!document.getElementById('empty-review-placeholder')) {
    const ul = document.getElementById('reviews-list');
    const reviewEl = document.createElement('li');
    reviewEl.className = 'review-item';
    reviewEl.setAttribute('id', 'empty-review-placeholder');
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    reviewEl.appendChild(noReviews);
    ul.appendChild(reviewEl);
  }
};


const removeEmptyReviewPlaceholder = () => {
  const emptyReview = document.getElementById('empty-review-placeholder');
  if (emptyReview) emptyReview.parentNode.removeChild(emptyReview);
};

/**
 * Update ordering so newest appear at the top.
 */
const sortReviewsByDate = () => {
  const currentOrder = () => JSON.stringify(self.reviews.map(r => r.id));
  const before = currentOrder();
  self.reviews.sort((rev1, rev2) => {
    const [a, b] = [rev1.data.createdAt, rev2.data.createdAt];
    if      (a > b)   { return -1; }
    else if (a < b)   { return  1; }
    else if (a === b) { return  0; }
  });

  // If no change, no need to update.
  if (self.reviews.length > 1 && before !== currentOrder()) {
    for (let i = 0; i < self.reviews.length; i++) {
      const liEls = document.getElementsByClassName('review-item');
      const r = self.reviews;
      r[i].li.parentNode.insertBefore(r[i].li, liEls[i]);
    }
  }
};

/**
 * Show a form for adding a new review.
 */
window.showNewReviewForm = () => { // eslint-disable-line no-unused-vars
  if (self.newReviewInProgress) {
    self.newReview.submit();
  } else {
    self.newReviewInProgress = true;
    const ul = document.getElementById('reviews-list');
    const reviewEl = document.createElement('li');
    reviewEl.setAttribute('id', 'new-review-form');
    const restaurantID = parseInt(getParameterByName('id'));
    self.newReview = new Review(
      reviewEl,
      ul,
      restaurantID,
      addNewReview);
  }
};

/**
 * Create a brand new review.
 */
const addNewReview = (restaurant_id, data) => {
  self.newReviewInProgress = false;
  self.newReview = undefined;
  const newReviewForm = document.getElementById('new-review-form');
  newReviewForm.parentNode.removeChild(newReviewForm);
  if (!restaurant_id || !data) return;
  DBHelper.createReview(self.reviewIDB, restaurant_id, data, (review, error, type) => {
    if (review) {
      const ul = document.getElementById('reviews-list');
      const reviewEl = document.createElement('li');
      self.reviews.push(new Review(
        reviewEl,
        ul,
        review.restaurant_id,
        addNewReview,
        updateReview,
        deleteReview,
        review));
      removeEmptyReviewPlaceholder();
      sortReviewsByDate();
      if (type === 'NETWORK') showSnackbar('Review added.', 4);
    }
    if (error) {
      showSnackbar('No connection. Post will be submitted when connection is restored.', 10);
      console.error(error);
    }
  });
};

/**
 * Update existing review with new data.
 */
const updateReview = (restaurant_id, review_id, data) => {
  const performViewUpdate = (review, error, type) => {
    if (review) {
      const reviewView = getViewByID(self.reviews, review.id);
      if (reviewView) reviewView.update(review);
      sortReviewsByDate();
      if (type === 'NETWORK') showSnackbar('Review updated.', 4);
    } else {
      showSnackbar('No connection. Post will be updated when connection is restored.', 10);
      console.error(error);
    }
  };

  console.log(review_id);
  if (review_id.startsWith('UNPOSTED')) {
    DBHelper.createReview(self.reviewIDB, restaurant_id, data, (review, error, type) => {
      performViewUpdate(review, error, type);
    }, true, true, review_id);
  } else {
    DBHelper.updateReview(self.reviewIDB, review_id, data, (review, error, type) => {
      performViewUpdate(review, error, type);
    });
  }
};

/**
 * Delete review.
 */
const deleteReview = (review_id) => {
  const reviewView = getViewByID(self.reviews, review_id);
  if (reviewView) {
    reviewView.ul.removeChild(reviewView.li);
    const index = self.reviews.indexOf(reviewView);
    self.reviews.splice(index, 1);
    if (self.reviews.length === 0) addEmptyReviewPlaceholder();
  }
  DBHelper.deleteReview(self.reviewIDB, review_id, (review, error, type) => {
    if (error) {
      showSnackbar('No connection. Post will be removed when connection is restored.', 10);
      console.error(error);
    } else {
      if (type === 'NETWORK') showSnackbar('Review deleted.', 4);
    }
  });
};

/**
 * Update review after network connection is restored.
 */
const updateReviewAfterNetworkReestablished = (networkResult, offlineID) => { // eslint-disable-line no-unused-vars
  const id = offlineID === undefined
    ? networkResult.id
    : offlineID;
  const reviewView = getViewByID(self.reviews, id);
  if (reviewView) reviewView.update(networkResult);
  showSnackbar('Connection restored. Queued data submitted successfully.', 6);
};

/**
 * Add restaurant name to the breadcrumb navigation menu.
 */
const fillBreadcrumb = (restaurant) => { // eslint-disable-line no-unused-vars
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url = window.location.href) => {
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
const setRestaurantNameWidth = () => { // eslint-disable-line no-unused-vars
  document.getElementById('restaurant-name').style.width = `${window.innerWidth-68}px`;
};

/**
 * Handle accessibility button "Skip to main content".
 */
window.skipToMainContent = () => { // eslint-disable-line no-unused-vars
  if (window.innerWidth < self.maxMobileRes) {
    self.scrollButton.executeScroll();
  } else {
    self.restaurantNameEl.focus();
  }
};
