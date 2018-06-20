
// Define values for keycodes
const VK_ENTER      = 13;
const VK_TAB        = 9;


/**
 * Implements a button whose action is to scroll the page by a distance of a full view height.
 * After the scoll is complete the role switches from a button to a regular element 
 * but focus is maintained for accessibility purposes.
 * @param {Element} el The element to decorate.
 * @param {String} asButtonClass The css class to add when element is a button.
 * @param {Integer} maxEnableWidth The max width in which element is a button.
 * @param {Integer} verticalScrollThreshold The max amount of vertical scrolling before element is no longer a button.
 * @param {Integer} scrollOffset The amount of overlap to maintain when the scroll button is pressed.
 */
class ScrollButton {
  constructor(el, 
              asButtonClass, 
              maxEnableWidth=10000,
              verticalScrollThreshold=10000,
              scrollOffset=0) {
    this.el = el;
    this.asButtonClass = asButtonClass
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
        this.executeScroll()
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
    this.shouldBeOn = !this.shouldBeOn
    if (this.shouldBeOn) {
      this.el.classList.add(this.asButtonClass);
      this.el.setAttribute('role', 'button');
      this.el.setAttribute('tabindex', '0');
    } else {
      this.el.classList.remove(this.asButtonClass);
      this.el.removeAttribute('role');
      if (!this.buttonWasPressed) {
        this.el.setAttribute('tabindex', '-1');
      }
    }
  }

  executeScroll() { 
    this.buttonWasPressed = true;
    window.scrollBy({ "behavior": "smooth", "top": this.calcDestination() });
  }

  handleKeyDown(e) {
      switch (e.keyCode) {
      case VK_ENTER:
        this.executeScroll()
        break;
      case VK_TAB:
        if (window.scrollY > this.verticalScrollThreshold) {
          this.el.setAttribute('tabindex', '-1');
        }
      }
      return;
  }
}
