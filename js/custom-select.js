

let LAST_ID = 0;

/**
 * Generate a unique DOM ID.
 * @return {string}
 */
const nextId = () => {
  let id = ':' + LAST_ID;
  LAST_ID++;
  return id;
};

/**
 * Implements a minimal custom select button: a button with a list of options which pops up whent the button is focused
 * Use arrow keys or mouse to choose from available options.
 * Adapted from the combobox example in the Udacity ARIA lesson: https://github.com/udacity/ud891/tree/gh-pages/lesson5-semantics-aria/13-combobox
 * @param {Element} el The text field element to decorate.
 * @param {Element} listEl The listbox element to associate with this customSelect field; also decorates
 *     it with the `ListBox` pattern.
 */
class CustomSelect {
  constructor(el, listEl, ariaLblPrefix, callback) {
    this.VK_ENTER = 13;
    this.VK_ESC = 27;
    this.VK_SPACE = 32;
    this.VK_LEFT = 37;
    this.VK_UP = 38;
    this.VK_RIGHT = 39;
    this.VK_DOWN = 40;

    this.el = el;
    this.listEl = listEl;
    this.ariaLblPrefix = ariaLblPrefix;
    this.callback = callback;
    this.el.setAttribute('aria-expanded', false);
    this.listbox = new ListBox(listEl, this);
    this.listEl.id = nextId();

    this.el.addEventListener('click', this.handleClick.bind(this), true);
    this.el.addEventListener('blur', this.handleBlur.bind(this), true);
    this.el.addEventListener('keydown', this.handleKeyDown.bind(this), true);
  }

  set value(val) {
    this.el.value = val;
  }

  showListbox() {
    this.listbox.show();
    this.el.setAttribute('aria-expanded', true);
  }

  hideListbox() {
    this.listbox.hide();
    this.el.setAttribute('aria-expanded', false);
    this.el.removeAttribute('aria-activedescendant');
  }

  handleClick() {
    this.showListbox();
  }

  handleBlur() {
    this.hideListbox();
  }

  handleKeyDown(e) {
    if ([this.VK_LEFT, this.VK_UP, this.VK_RIGHT, this.VK_DOWN, this.VK_ENTER].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
    e.cancelBubble = true;
    switch (e.keyCode) {
    case this.VK_SPACE:
      if (this.listbox.hidden) this.showListbox();
      break;
    case this.VK_DOWN:
      if (this.listbox.hidden) this.showListbox();
      this.listbox.nextActiveListItem();
      break;
    case this.VK_UP:
      if (this.listbox.hidden) this.showListbox();
      this.listbox.previousActiveListItem();
      break;
    case this.VK_ENTER:
      var active = this.listbox.activeItem;
      if (!active)
        break;
      this.setSelected(active);
      this.hideListbox();
      break;
    case this.VK_ESC:
      this.hideListbox();
      break;
    }

    return;
  }

  setSelected(el) {
    this.el.textContent = el.textContent;
    this.el.setAttribute('value', el.getAttribute('value'));
    this.el.setAttribute('aria-label', `${this.ariaLblPrefix}: ${el.textContent}`);
    this.callback();
  }

  setActiveDescendant(el) {
    if (!el.id)
      return;
    this.el.setAttribute('aria-activedescendant', el.id);
  }
}

class ListBox {
  constructor(el, customSelect) {
    this.el = el;
    this.customSelect = customSelect;
    this.items = Array.prototype.slice.call(el.querySelectorAll('[role=option]'));
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      item.id = nextId();

      item.addEventListener('mouseover', this.handleHoverOnItem.bind(this));
      item.addEventListener('mousedown', this.handleClickOnItem.bind(this), true);
    }

    this.visibleItems = this.items.slice();
  }

  toggle() {
    if (this.hidden) {
      this.show();
    } else {
      this.hide();
    }
  }

  get hidden() {
    return this.el.hasAttribute('hidden');
  }

  get activeItem() {
    return this.el.querySelector('[role=option].active');
  }

  show() {
    if (!this.hidden)
      return;

    this.el.removeAttribute('hidden');
  }

  hide() {
    if (this.hidden)
      return;

    if (this.activeItem)
      this.activeItem.classList.remove('active');
    this.el.setAttribute('hidden', '');
  }

  handleHoverOnItem(e) {
    const newIdx = this.visibleItems.indexOf(e.target);
    if (newIdx < 0)
      return;
    this.changeActiveListitem(newIdx);
  }

  handleClickOnItem(e) {
    const item = e.target;
    if (this.items.indexOf(item) < 0)
      return;
    this.customSelect.setSelected(item);
    this.hide();
  }

  nextActiveListItem() {
    const active = this.activeItem;
    let activeIdx = -1;
    if (active)
      activeIdx = this.visibleItems.indexOf(active);

    let newIdx = activeIdx;
    newIdx = (newIdx + 1) % this.visibleItems.length;
    this.changeActiveListitem(newIdx);
  }

  previousActiveListItem() {
    const active = this.activeItem;
    let activeIdx = -1;
    if (active)
      activeIdx = this.visibleItems.indexOf(active);

    let newIdx = activeIdx;
    newIdx--;
    if (newIdx < 0)
      newIdx += this.visibleItems.length;

    this.changeActiveListitem(newIdx);
  }

  changeActiveListitem(newIdx) {
    const active = this.activeItem;
    const newActive = this.visibleItems[newIdx];
    if (active)
      active.classList.remove('active');
    newActive.classList.add('active');
    this.customSelect.setActiveDescendant(newActive);
  }
}



const fillCustomSelectBox = (items, listboxID, buttonID, ariaLblPrefix, callback) => { // eslint-disable-line no-unused-vars
  const listbox = document.getElementById(listboxID);
  const ul = listbox.querySelector('[role=presentation]');
  const button = document.getElementById(buttonID);
  items.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('value', item);
    li.innerHTML = item;
    ul.append(li);
  });
  new CustomSelect(button, listbox, ariaLblPrefix, callback);
};