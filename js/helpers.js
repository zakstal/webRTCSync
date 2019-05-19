
function fragmentFromString(strHTML) {
    var temp = document.createElement('template');
    temp.innerHTML = strHTML;
    return temp.content;
}
/**
 * Pub sub
 */
const StateEvents = function (state) {
  this.state = state
  this.notifiers = {};
  this.createNotifiers(state);
};

StateEvents.prototype = {
  createNotifiers: function (state) {
    const keys = Object.keys(state);
    keys.forEach(key => {
      this.notifiers[key] = [];
    })
  },

  /**
   * So a config object can be passed from the element creator
   *
   * @param {Object} elState
   */
  bulkSubscribe: function (elState) {
    const entries = Object.entries(elState);
    entries.forEach(([key, func]) => this.subscribe(key, func));
  },

  /**
   * @param {String} key - key in the state object
   * @param {Function} func - function that will be called when key in state is updated
   */
  subscribe: function(key, func) {
    this.notifiers[key].push(func);
  },

  /**
   * New global state
   */
  setState: function(newState) {
    const updatedKeys = Object.keys(newState);

    // TODO strip keys from updatedKeys if they don't already exist in state
    this.state = {
      ...this.state,
      ...newState
    }

    this.notifyEach(updatedKeys);
  },

  getState: function() {
    return this.state;
  },

  getStateKeys: function () {
    return Object.keys(this.state);
  },

  notifyEach: function (keys) {
    keys.forEach(this.notify.bind(this));
  },

  notify: function (key) {
    this.notifiers[key].forEach(function(func) {
      func(this.state[key])
    }.bind(this));
  }

}


const findById = id => document.getElementById(id);
const find = selector => document.querySelectorAll(selector);

const pick = (originalObj, arr) => {
  return arr.reduce((obj, value) => {
    if (originalObj[value]) {
      obj[value] = originalObj[value];
    }
    return obj
  }, {})
}

/**
 * @param {String} selector
 * @param {Object} config
 */
const CreateElements = function (selector, config, stateEvents) {
  this.config = config;
  selector ? this.els = find(selector)[0] : this.render();
  this.stateEvents = stateEvents;
  this.subscribeAll();
  this.setStyle();
  this.documentNode = null;

  if (this.els.length === 1) {
    return this.els[0];
  }

  return this.els;
}

CreateElements.prototype = {
  subscribeAll: function () {
    this.subscribe(this.els)
  },
  subscribe: function (el) {
    if (!this.config) {
      return;
    }

    const configState = pick(this.config, this.stateEvents.getStateKeys());
    const entries = Object.entries(configState);
    // Maybe confusing. The functions (object values) in config which should be a map to
    // global state values will want to receive changed state and the current objects element.
    const state = entries.reduce((obj, [key, func]) => {

      // this function will be called by Events when the state is changed
      obj[key] = (state) => {
        // func(state, el).bind(this)
        func.apply(this, [state, el]);
        this.config.render && this.render();
      }
      return obj;
    }, {});

    this.stateEvents.bulkSubscribe(state);
  },

  active: function (isActive) {
    if (isActive) {
      this.els.classList.add('active');
      this.els.classList.remove('hidden');
    } else {
      this.els.classList.remove('active');
      this.els.classList.add('hidden');
    }
  },

  innerText: function(text) {
    this.els.innerText = text;
  },

  setStyle: function (style = {}) {
    const newStyle = {
      ...this.style,
      ...style,
    }

    this.style = newStyle;
    const entries = Object.entries(this.style);
    entries.forEach(([key, value]) => {
      this.els.styles[key] = value
    })
  },

  render: function () {
    console.log('render', document.body.contains(this.els))
    // if(document.body.contains(this.els)) {
    //     return
    // }
    const node = this.documentNode || document.createDocumentFragment();
    const nodeString = this.config.render();
    this.els = fragmentFromString(nodeString);
    node.appendChild(this.els);
    const [action, parentSelector] = this.config.parent;
    const parent = find(parentSelector)[0];
    parent[action](node);
  }
}

const createElementCreator = globalState => {
  const stateEvents = new StateEvents(globalState);
  const createEl = (selector, config) => {
    return new CreateElements(selector, config, stateEvents);
  }

  return [
    createEl,
    (state) => stateEvents.setState(state),
    () => stateEvents.getState(),
  ]
}

/**
 * @param {Function} function
 */
const queryActiveTab = callback => {
  chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
  }, callback);
}

/**
 * @param {Object} message
 * @param {Function} response
 */
const messageCurrentTab = (message, response) => {
  queryActiveTab(tabItems => {
    chrome.tabs.sendMessage(tabItems[0].id, message, response);
  })
}

/**
 * @param {Object} message
 * @param {Function} response
 */
const sendMessage = (message, response) => {
  chrome.runtime.sendMessage(message, response);
}

const addMessageListeners = messageTypes => {
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    messageTypes[request.type] && messageTypes[request.type](request, sender, sendResponse)
  });
}
