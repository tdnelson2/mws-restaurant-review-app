/* global DBHelper */

const buildPictureEl = (restaurant, srcImgs) => { // eslint-disable-line no-unused-vars
  const buildImgUrl = (name, extension, suffix) => {
    return `${name}-${suffix}w.${extension}`;
  };

  const addSrcset = (el, name, extension, width1x, width2x) => {
    el.setAttribute('srcset', `${buildImgUrl(name, extension, width2x)} 2x, `+
                              `${buildImgUrl(name, extension, width1x)} 1x`);
  };

  const createSourceEl = (name, extension, width1x, width2x, vpWidth, mediaQuery) => {
    const source = document.createElement('source');
    source.setAttribute('media', `(${mediaQuery}: ${vpWidth}px)`);
    addSrcset(source, name, extension, width1x, width2x);
    return source;
  };

  const pictureEl = document.createElement('picture');

  const img = DBHelper.imageUrlForRestaurant(restaurant);
  const imgUrl = img.split('.').slice(0, -1).join();
  const extension = img.split('.').slice(-1)[0];
  const srcsetImgs = srcImgs.slice(0, -1);
  for (const mg of srcsetImgs) {
    pictureEl.appendChild(
      createSourceEl(imgUrl, extension, mg.width1x, mg.width2x, mg.vpWidth, 'min-width')
    );
  }

  const imgEl = document.createElement('img');
  imgEl.className = 'restaurant-img';
  imgEl.alt = `This photo might show a dish from the restaurant named "${restaurant.name}". `+
              'Otherwise it may show the interior or exterior.';
  imgEl.src = buildImgUrl(imgUrl, extension, srcImgs.slice(-1)[0].width2x);
  const fallback = srcImgs.slice(-1)[0];
  addSrcset(imgEl, imgUrl, extension, fallback.width1x, fallback.width2x);

  pictureEl.appendChild(imgEl);

  return pictureEl;
};
