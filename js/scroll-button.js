

/**
 * Implements a button whose action is to scroll the page by a distance of a full view height.
 * After the scroll is complete the role switches from a button to a regular element
 * but focus is maintained for accessibility purposes.
 * @param {Element} el The element to decorate.
 * @param {String} asButtonClass The css class to add when the element is a button.
 * @param {Integer} maxEnableWidth The max width in which the element is a button.
 * @param {Integer} verticalScrollThreshold The max amount of vertical scrolling before element is no longer a button.
 * @param {Integer} scrollOffset The amount to subtract from the full view height scroll.
 */
class ScrollButton { // eslint-disable-line no-unused-vars
  constructor(el, asButtonClass, maxEnableWidth=10000, verticalScrollThreshold=10000, scrollOffset=0) {
    this.VK_ENTER = 13;
    this.VK_TAB = 9;

    this.el = el;
    this.asButtonClass = asButtonClass;
    this.maxEnableWidth = maxEnableWidth;
    this.verticalScrollThreshold = verticalScrollThreshold;
    this.scrollOffset = scrollOffset;
    this.buttonWasPressed = false;

    // Since change only propagates when the `shouldBeOn` property
    // changes, we set initial value of `shouldBeOn` to the opposite
    // of what the value should be
    this.shouldBeOn = !this.isMobile();
    this.toggleMobile();
    this.startListeners();
  }

  startListeners() {
    this.el.addEventListener('click', () => {
      if (!this.isMobile()) return;
      this.executeScroll();
    });

    window.addEventListener('resize', () => this.toggleMobile());

    window.addEventListener('scroll', () => {
      if (!this.isMobile()) return;
      const pos = window.scrollY;
      if (pos > this.verticalScrollThreshold) {
        this.toggleOff();
      } else {
        this.toggleOn();
      }
      if (this.calcDestination() === 0 && this.buttonWasPressed) {
        this.buttonWasPressed = false;
        this.el.setAttribute('tabindex', '0');
        this.el.focus();
      }
    });

    this.el.addEventListener('keydown', this.handleKeyDown.bind(this), true);
  }

  isMobile() { return window.innerWidth < this.maxEnableWidth; }

  toggleMobile() { this.isMobile() ? this.toggleOn() : this.toggleOff(); }

  calcDestination() { return (window.innerHeight - this.scrollOffset) - window.scrollY; }

  toggleOn() { if (!this.shouldBeOn) this.toggleState(); }

  toggleOff() { if (this.shouldBeOn) this.toggleState(); }

  toggleState() {
    this.shouldBeOn = !this.shouldBeOn;
    if (this.shouldBeOn) {
      const currentClasses = this.el.getAttribute('class');
      this.el.setAttribute('class', `${currentClasses} ${this.asButtonClass}`);
      this.el.setAttribute('role', 'button');
      this.el.setAttribute('tabindex', '0');
    } else {
      let currentClasses = this.el.getAttribute('class');
      currentClasses = currentClasses.replace(this.asButtonClass, '');
      this.el.setAttribute('class', currentClasses);
      this.el.removeAttribute('role');
      if (!this.buttonWasPressed) {
        this.el.setAttribute('tabindex', '-1');
      }
    }
  }

  executeScroll() {
    this.buttonWasPressed = true;
    try {
      window.scrollBy({ 'behavior': 'smooth', 'top': this.calcDestination() });
    } catch(error) {
      window.scrollBy(0, this.calcDestination());
    }
  }

  handleKeyDown(e) {
    switch (e.keyCode) {
    case this.VK_ENTER:
      this.executeScroll();
      break;
    case this.VK_TAB:
      if (window.scrollY > this.verticalScrollThreshold) {
        this.el.setAttribute('tabindex', '-1');
      }
    }
    return;
  }
}
