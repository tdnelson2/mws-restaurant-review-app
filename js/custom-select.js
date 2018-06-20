

// Define values for keycodes
const VK_ENTER      = 13;
const VK_ESC        = 27;
const VK_SPACE      = 32;
const VK_LEFT       = 37;
const VK_UP         = 38;
const VK_RIGHT      = 39;
const VK_DOWN       = 40;
const VK_TAB        = 9;

let LAST_ID = 0;

/**
 * Generate a unique DOM ID.
 * @return {string}
 */
function nextId() {
    let id = ':' + LAST_ID;
    LAST_ID++;
    return id;
}

/**
 * Implements a minimal custom select button: a button with a list of options which pops up whent the button is focused
 * Use arrow keys or mouse to choose from available options.
 * @param {Element} el The text field element to decorate.
 * @param {Element} listEl The listbox element to associate with this customSelect field; also decorates
 *     it with the `ListBox` pattern.
 */
class CustomSelect {
    constructor(el, listEl, ariaLblPrefix) {
        this.el = el;
        this.listEl = listEl;
        this.ariaLblPrefix = ariaLblPrefix;
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
        console.log('hideListbox()');
        this.listbox.hide();
        this.el.setAttribute('aria-expanded', false);
        this.el.removeAttribute('aria-activedescendant');
    }

    handleClick(e) {
        this.showListbox();
    }

    handleBlur(e) {
        this.hideListbox();
    }

    handleKeyDown(e) {
        if ([VK_LEFT, VK_UP, VK_RIGHT, VK_DOWN, VK_ENTER].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
        e.cancelBubble = true;
        switch (e.keyCode) {
        case VK_SPACE:
            if (this.listbox.hidden) this.showListbox()
        case VK_DOWN:
            if (this.listbox.hidden) this.showListbox()
            this.listbox.nextActiveListItem();
            break;
        case VK_UP:
            if (this.listbox.hidden) this.showListbox()
            this.listbox.previousActiveListItem();
            break;
        case VK_ENTER:
            var active = this.listbox.activeItem;
            if (!active)
                break;
            this.setSelected(active);
            console.log('VK_ENTER');
            this.hideListbox();
            break;
        case VK_ESC:
            this.hideListbox();
            break;
        }

        return;
    }

    setSelected(el) {
        this.el.textContent = el.textContent;
        this.el.setAttribute('value', el.getAttribute('value'));
        this.el.setAttribute('aria-label', `${this.ariaLblPrefix}: ${el.textContent}`);
        updateRestaurants();
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
        console.log('hidden()', this.el.hasAttribute('hidden'));
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
        console.log('hide()');
        if (this.hidden)
            return;

        if (this.activeItem)
            this.activeItem.classList.remove('active');
        this.el.setAttribute('hidden', '');
    }

    handleHoverOnItem(e) {
        var newIdx = this.visibleItems.indexOf(e.target);
        if (newIdx < 0)
            return;
        this.changeActiveListitem(newIdx);
    }

    handleClickOnItem(e) {
        var item = e.target;
        if (this.items.indexOf(item) < 0)
            return;
        this.customSelect.setSelected(item);
        this.hide();
    }

    nextActiveListItem() {
        var active = this.activeItem;
        var activeIdx = -1;
        if (active)
            activeIdx = this.visibleItems.indexOf(active);

        var newIdx = activeIdx;
        newIdx = (newIdx + 1) % this.visibleItems.length;
        this.changeActiveListitem(newIdx);
    }

    previousActiveListItem() {
        var active = this.activeItem;
        var activeIdx = -1;
        if (active)
            activeIdx = this.visibleItems.indexOf(active);

        var newIdx = activeIdx;
        newIdx--;
        if (newIdx < 0)
            newIdx += this.visibleItems.length;

        this.changeActiveListitem(newIdx);
    }

    changeActiveListitem(newIdx) {
        var active = this.activeItem;
        var newActive = this.visibleItems[newIdx];
        if (active)
            active.classList.remove('active');
        newActive.classList.add('active');
        this.customSelect.setActiveDescendant(newActive);
    }
}



fillCustomSelectBox = (items, listboxID, buttonID, ariaLblPrefix) => {
  const listbox = document.getElementById(listboxID);
  const ul = listbox.querySelector('[role=presentation]');
  const button = document.getElementById(buttonID);
  items.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('value', item)
    li.innerHTML = item;
    ul.append(li);
  });
  new CustomSelect(button, listbox, ariaLblPrefix)
}
