
class Restaurant { // eslint-disable-line no-unused-vars
  constructor(data, el, favButton) {
    this.data = data;
    this.el = el;
    this.id = this.data.id;
    this.favButton = favButton;
  }

  update(data) {
    this.data = data;
    this.favButton.update(data.is_favorite);
  }
}