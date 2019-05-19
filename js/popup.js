//--------------- application code --------------//

const activateVideo = () => {

  const message = {
    type: 'activate'
  }

  const callback = res => {
    setState({
      createVideoError: res.error,
      createVideoMessage: res.message,
    })
  }

  const startWebRTCCallback = res => {
    setState({
      createVideoError: res.error,
      createVideoMessage: res.message,
    })
  }

  sendMessage({
    type: 'startWebRTC',
    hash: getState().inputValue
  }, webRTCLocation)

  messageCurrentTab(message, callback)
}

const start = () => {

  const input = createElement('#idInput');
  input.addEventListener('keyup', e => {
    console.log('keyUp', e.target.value)
    setState({
      inputValue: e.target.value,
      webrtcId: e.target.value
    })
  })

  const link = createElement('#link')
  link.addEventListener('click', activateVideo);


  createElement('#error', {
    createVideoError: function(isError, el) {
      this.active(isError);
    },
    createVideoMessage: function(message) {
      this.innerText(message);
    }
  })

  createElement('#message', {
    createVideoError: function(isError, el) {
      this.active(!isError);
    },
    createVideoMessage: function(message) {
      this.innerText(message);
    }
  })

  createElement('#webrtcId', {
    webrtcId: function(webrtcId, el) {
      this.active(Boolean(webrtcId));
      this.innerText(webrtcId)
    },
  })
}

const playState = (request, sender, sendResponse) => {
   setState({
      createVideoError: request.error,
      createVideoMessage: request.message,
    })
}

const error = (request, sender, sendResponse) => {
   setState({
      createVideoError: request.error,
      createVideoMessage: request.message,
    })
}

const webRTCLocation = (request) => {
  setState({
      createVideoError: request.error,
      createVideoMessage: request.message,
      webrtcId: request.message,
    })
}

const messageTypes = {
  playState,
  webRTCLocation,
  error
}

addMessageListeners(messageTypes)

document.addEventListener('DOMContentLoaded', start);
