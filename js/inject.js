
console.log('injected')

const sendMessage = (message, response) => {
  chrome.runtime.sendMessage(message, response);
}

let video = null;

// Assume there is only one video on the page
const activate = (request, sender, sendResponse) => {
  video = document.getElementsByTagName('video')[0];
  if (!video) {
    console.log('no video found!')
    sendResponse({
      type: 'activate',
      error: true,
      message: 'Video element not found'
    })
  }
  console.log('video found!')

  video.onprogress = e => {
    // console.log('progress', e)
    sendMessage({
      type: 'playState',
      error: false,
      message: 'Video playing',
      playState: 'progress',
      progress: video.currentTime,
      event: e
    })
  }

  video.onpause = e => {
    // console.log('progress', e)
    sendMessage({
      type: 'playState',
      error: false,
      message: 'Video paused',
      playState: 'pause',
      event: e
    })
  }

  video.onplay = e => {
    // console.log('progress', e)
    sendMessage({
      type: 'playState',
      error: false,
      message: 'Play video',
      playState: 'play',
      event: e
    })
  }

  sendResponse({
    type: 'activate',
    error: false,
    message: 'video found!'
  })
}

const progress = (message) => {
  if (video.currentTime !== message.progress) {
    video.currentTime = message.progress
  }
}

const play = (message) => {
  video.play();
}

const pause = (message) => {
  video.pause();
}

const playStateTypes = {
  progress,
  pause,
  play,
}

const receiveData = (data) => {
  if (!playStateTypes[data.message.playState]) {
    console.log('missing', data.message.type)
  }

  playStateTypes[data.message.playState] && playStateTypes[data.message.playState](data.message)
}

const messageTypes = {
  activate,
  receiveData
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!messageTypes[request.type]) {
      console.log('no message of type', request.type)
    }

    messageTypes[request.type] && messageTypes[request.type](request, sender, sendResponse)
  });

