/* global CustomSelect */


class Review { // eslint-disable-line no-unused-vars
  constructor(liEl, ulEl, restaurantID, createReviewCallback, updateReviewCallback, deleteReviewCallback, data) {
    this.id;

    this.VK_ENTER = 13;
    this.VK_SPACE = 32;

    this.id = data
      ? data.id
      : 'brand-new-review';
    this.restaurantID = restaurantID;
    this.li = liEl;
    this.ul = ulEl;
    this.reviewEl = document.createElement('div');
    this.formEl = document.createElement('form');

    this.li.classList.add('review-item');

    this.createReviewCallback = createReviewCallback;
    this.updateReviewCallback = updateReviewCallback;
    this.deleteReviewCallback = deleteReviewCallback;

    this.data;

    if (data) {
      this.id = data.id;
      this.initReviewView(data);
      this.initReviewForm();
      this.ul.appendChild(this.li);
    } else {
      this.initReviewForm();
      this.ul.prepend(this.li);
      this.nameInput.focus();
    }
  }

  update(data) {
    const keys = Object.keys(data);
    keys.forEach(key => {
      this.data[key] = data[key];
      switch(key) {
      case 'id':
        this.id = data.id;
        break;
      case 'name':
        this.updateName();
        break;
      case 'updatedAt':
        this.updateDate();
        break;
      case 'rating':
        this.updateRating();
        break;
      case 'comments':
        this.updateComments();
        break;
      }
    });
  }

  updateOrder(index) {
    this.li.setAttribute('style', `order: ${index};`);
  }

  // Review Form
  initReviewForm() {
    this.nameInput = this.createInputGroup(
      'input',
      'Tell us your name!',
      'Your name here',
      this.formEl,
      ['review-lbl'],
      ['review-input', 'name-input']);

    this.ratingSelectAriaLabelPrefix = 'Rate this restaurant. Current rating is: ';
    this.ratingOptions = [1, 2, 3, 4, 5];
    this.ratingSelect = this.createSelectGroup(
      'How would you rate this restaurant?',
      this.ratingOptions,
      this.formEl,
      ['review-lbl']);

    this.commentsLbl = this.createLabel('Tell us about it!');
    this.commentBox = this.createInputGroup('textarea',
      'Tell us about your experience!',
      'Put your comments here.',
      this.formEl,
      ['review-lbl'],
      ['review-input', 'comment-box']);

    this.submitButton = this.createButton('Submit', this.formEl);
    this.cancelButton = this.createButton('Cancel', this.formEl);

    this.formInputEls = [
      this.nameInput,
      this.ratingSelect,
      this.commentBox,
      this.submitButton,
      this.cancelButton];

    if (this.data) this.hide([this.formEl], this.formInputEls);

    if (this.data) this.update(this.data);
    this.li.appendChild(this.formEl);

    this.submitButton.addEventListener('click', this.submit.bind(this), true);
    this.submitButton.addEventListener('keydown', this.submit.bind(this), true);
    this.cancelButton.addEventListener('click', this.cancel.bind(this), true);
    this.cancelButton.addEventListener('keydown', this.cancel.bind(this), true);
  }

  createSelectGroup(labelText, options, parentEl, lblClasses) {
    const lbl = this.createLabel(labelText);
    const [select, button] = this.createSelect(...options);
    this.addAriaRelationship('dropdown', lbl, button);
    this.addClasses([lbl], [lblClasses]);
    this.createGroup([lbl, select], parentEl);
    return button;
  }

  createInputGroup(type, labelText, placeholder, parentEl, lblClasses, inputClasses) {
    const lbl = this.createLabel(labelText);
    const input = document.createElement(type);
    this.addAriaRelationship(type, lbl, input);
    this.addClasses([lbl, input], [lblClasses, inputClasses]);
    input.setAttribute('placeholder', placeholder);
    this.createGroup([lbl, input], parentEl);
    return input;
  }

  createGroup(els, parentEl, classList) {
    const grp = document.createElement('div');
    grp.classList.add('review-input-group');
    if (classList) classList.forEach(c => grp.classList.add(c));
    els.forEach(el => grp.appendChild(el));
    return parentEl.appendChild(grp);
  }

  addAriaRelationship(idPrefix, label, input) {
    const id = `${idPrefix}-${this.id}`;
    input.setAttribute('id', id);
    label.setAttribute('for', id);
  }

  addClasses(els, classes) {
    for (let i = 0; i < els.length; i++) {
      if (classes && classes.length > i) classes[i].forEach(c => els[i].classList.add(c));
    }
  }

  createSelect(...options) {
    const selectContainer = document.createElement('div');
    selectContainer.setAttribute('class', 'rating-select-container');
    const button = document.createElement('button');
    const existingRating = this.data
      ? this.data.rating
      : 1;
    this.setMultipleAttributes(button, [
      ['class', 'rating-select'],
      ['type', 'button'],
      ['aria-haspopup', 'listbox'],
      ['value', existingRating],
      ['aria-label', `${this.ratingSelectAriaLabelPrefix} ${existingRating}`],
      ['aria-expanded', 'false']]);
    button.innerHTML = existingRating;
    const listbox = document.createElement('div');
    this.setMultipleAttributes(listbox, [
      ['role', 'listbox'],
      ['hidden', ''],
      ['tabindex', '-1']
    ]);
    const ul = document.createElement('ul');
    this.setMultipleAttributes(ul, [
      ['role', 'presentation'],
      ['class', 'rating-select-dropdown']]);

    options.forEach(option => {
      const li = document.createElement('li');
      this.setMultipleAttributes(li, [
        ['role', 'option'],
        ['value', option]]);
      li.innerHTML = option;
      ul.append(li);
    });
    selectContainer.appendChild(button);
    listbox.appendChild(ul);
    selectContainer.appendChild(listbox);
    new CustomSelect(button, listbox, this.ratingSelectAriaLabelPrefix);
    return [selectContainer, button];
  }

  setMultipleAttributes(el, attributeList) {
    attributeList.forEach(attr => el.setAttribute(...attr));
  }

  createLabel(text) {
    const lbl = document.createElement('label');
    lbl.innerHTML = text;
    return lbl;
  }

  createButton(text, parentEl) {
    const b = document.createElement('button');
    // b.setAttribute('type', 'button');
    this.setMultipleAttributes(b, [
      ['type', 'button'],
      ['class', 'review-form-button']]);
    b.innerHTML = text;
    parentEl.appendChild(b);
    return b;
  }

  // View review

  initReviewView(data) {
    this.data = data;

    // Elements for displaying the review.
    this.name = document.createElement('p');
    this.name.classList.add('review-name');
    this.reviewEl.appendChild(this.name);

    [this.editBtn, this.deleteBtn] = this.createLinkButtonGroup(['Edit', 'Delete'], this.reviewEl, ['button-group']);

    this.date = document.createElement('p');
    this.reviewEl.appendChild(this.date);

    this.rating = document.createElement('p');
    this.reviewEl.appendChild(this.rating);

    this.comments = document.createElement('p');
    this.reviewEl.appendChild(this.comments);

    this.reviewEls = [this.reviewEl];
    this.buttonEls = [this.editBtn, this.deleteBtn];
    this.li.appendChild(this.reviewEl);

    this.editBtn.addEventListener('click', this.edit.bind(this), true);
    this.editBtn.addEventListener('keydown', this.edit.bind(this), true);
    this.deleteBtn.addEventListener('click', this.delete.bind(this), true);
    this.deleteBtn.addEventListener('keydown', this.delete.bind(this), true);
  }

  createLinkButtonGroup(buttonTexts, parentEl, classList) {
    const btnEls = [];
    buttonTexts.forEach(text => {
      const b = document.createElement('button');
      b.innerHTML = text;
      b.classList.add('link-button');
      btnEls.push(b);
    });
    this.createGroup(btnEls, parentEl, classList);
    return btnEls;
  }

  updateName() {
    this.name.innerHTML = this.data.name;
    this.nameInput.value = this.data.name;
  }

  updateDate() {
    const d = new Date(this.data.updatedAt);
    this.date.innerHTML = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  }

  updateRating() {
    this.rating.innerHTML = `Rating: ${this.data.rating}`;
    const selectedIndex = this.ratingOptions.indexOf(this.data.rating);
    if (selectedIndex !== -1) this.ratingSelect.selectedIndex = selectedIndex;
  }

  updateComments() {
    this.comments.innerHTML = this.data.comments;
    this.commentBox.value = this.data.comments;
  }

  sanitize(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Buttons

  edit(e) {
    if (!this.shouldContinue(e)) return;
    this.showForm();
  }

  delete(e) {
    if (!this.shouldContinue(e)) return;
    this.deleteReviewCallback(this.data.id);
  }

  submit(e) {
    if (!this.shouldContinue(e)) return;
    if (!this.nameInput.value || !this.commentBox.value) return;
    const data = {};
    data.name = this.sanitize(this.nameInput.value);
    data.rating = parseInt(this.ratingSelect.value) || 1;
    data.comments = this.sanitize(this.commentBox.value);
    data.updatedAt = Date.now();

    if (this.data) {
      this.update(data);
      this.updateReviewCallback(this.data.id, data);
      this.showReview();
    } else {
      data.createdAt = data.updatedAt;
      data.restaurant_id = this.restaurantID;
      this.createReviewCallback(this.restaurantID, data);
    }
  }

  cancel(e) {
    if (!this.shouldContinue(e)) return;
    if (this.data) {
      this.showReview();
    } else {
      // Call `createReviewCallback` with no params to close.
      this.createReviewCallback();
    }
  }

  shouldContinue(e) {
    if (e === undefined || e.type === 'click' || [this.VK_ENTER, this.VK_SPACE].indexOf(e.keycode) !== -1) return true;
  }

  // Visibilty controls

  showReview() {
    this.hide([this.formEl], this.formInputEls);
    this.show(this.reviewEls, this.buttonEls);
    this.editBtn.focus();
  }

  showForm() {
    this.hide(this.reviewEls, this.buttonEls);
    this.show([this.formEl], this.formInputEls);
    this.nameInput.focus();
  }

  hide(nonFocusableEls, focasableEls) {
    this.makeUnfocusable(focasableEls);
    this.moveOffScreen(nonFocusableEls);
  }

  show(nonFocusableEls, focasableEls) {
    this.moveOnScreen(nonFocusableEls);
    this.makeFocusable(focasableEls);
  }

  moveOffScreen(els) {
    els.forEach(el => {
      el.classList.add('off-screen');
    });
  }

  moveOnScreen(els) {
    els.forEach(el => {
      el.classList.remove('off-screen');
    });
  }

  makeUnfocusable(els) {
    els.forEach(el => {
      el.setAttribute('tabindex', '-1');
    });
  }

  makeFocusable(els) {
    els.forEach(el => {
      el.removeAttribute('tabindex');
    });
  }
}