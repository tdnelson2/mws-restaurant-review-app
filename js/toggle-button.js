
/**
 * Implements a toggle button which adds/removes an active/inactive css class and triggers a callback when clicked.
 * @param {Element} buttonEl The parent button element.
 * @param {Element} contentEl buttonEl's child. This element recieves the classes.
 * @param {Integer} id The unique id for this element.
 * @param {Function} callback Triggers when buttonEl is clicked. Returns the unique id and a boolen value to indicate state.
 * @param {String} activeCls CSS to use when in an on state.
 * @param {String} inactiveCls CSS to use when in an off state.
 * @param {String} hoverInactiveCls CSS to use when in an off state and hovering.
 * @param {String} hoverActiveCls CSS to use when in an on state and hovering.
 * @param {Boolean} isOn The initial state. Defaults to false.
 */
class ToggleButton { // eslint-disable-line no-unused-vars
  constructor(
    buttonEl, 
    contentEl, 
    id, 
    callback, 
    activeCls, 
    inactiveCls, 
    hoverInactiveCls, 
    hoverActiveCls, 
    isOn=false
  ) {
    this.VK_ENTER = 13;
    this.VK_SPACE = 32;

    this.buttonEl = buttonEl;
    this.id = id;
    this.callback = callback;
    this.activeCls = activeCls;
    this.inactiveCls = inactiveCls;
    this.hoverInactiveCls = hoverInactiveCls;
    this.hoverActiveCls = hoverActiveCls;
    this.isOn = isOn;

    this.classList = contentEl.classList;

    if (isOn) {
      this.classList.add(activeCls);
    } else {
      this.classList.add(inactiveCls);
    }

    this.buttonEl.addEventListener('click', this.handleClick.bind(this), true);
    this.buttonEl.addEventListener('mouseenter', this.mouseenter.bind(this));
    this.buttonEl.addEventListener('mouseleave', this.mouseleave.bind(this));
    this.buttonEl.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    this.buttonEl.addEventListener('focus', this.mouseenter.bind(this), true);
    this.buttonEl.addEventListener('blur', this.mouseleave.bind(this), true);
  }

  handleClick(originIsKeyboard) {
    this.isOn = !this.isOn;
    this.buttonEl.setAttribute('aria-checked', this.isOn
      ? 'true'
      : 'false');
    this.toggle(this.isOn, originIsKeyboard);
    this.callback(this.id, this.isOn);
  }

  toggle(shouldToggleOn, originIsKeyboard=false) {
    let oldClass, newClass;
    if (shouldToggleOn) {
      oldClass = this.classList.contains(this.inactiveCls)
        ? this.inactiveCls
        : this.hoverInactiveCls;
      newClass = originIsKeyboard
        ? this.hoverActiveCls
        : this.activeCls;
    } else {
      newClass = originIsKeyboard
        ? this.hoverInactiveCls
        : this.inactiveCls;
      oldClass = this.hoverActiveCls;
    }
    this.classList.replace(oldClass, newClass);
  }

  hover(shouldHighlight) {
    let oldClass, newClass;
    if (shouldHighlight) {
      if (this.isOn) {
        [oldClass, newClass] = [this.activeCls, this.hoverActiveCls];
      } else {
        [oldClass, newClass] = [this.inactiveCls, this.hoverInactiveCls];
      }
    } else {
      if (this.isOn) {
        [oldClass, newClass] = [this.hoverActiveCls, this.activeCls];
      } else {
        [oldClass, newClass] = [this.hoverInactiveCls, this.inactiveCls];
      }
    }
    this.classList.replace(oldClass, newClass);
  }

  mouseenter() { this.hover(true); }

  mouseleave() { this.hover(false); }

  handleKeyDown(e) {
    if ([this.VK_ENTER, this.VK_SPACE].indexOf(e.keycode) !== -1) {
      this.handleClick(true);
    }
  }
}

