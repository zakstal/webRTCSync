
console.log('injected', sendMessage)
var injectedId = Math.floor(Math.random() * 0xFFFFFF).toString(16).substring(1)

// const sendMessage = (message, response) => {
//   chrome.runtime.sendMessage(message, response);
// }

const [
  createElement,
  setState,
  getState,
]= createElementCreator({
  error: false,
  message: ''
})

createElement('', {
  parent: ['appendChild', 'body'],
  render: function () {
    return `
      <div id="message" style="position: fixed; top: 0; left: 0; height: 15px; min-width: 10px; background: #fff">
        Welcome!
      </div>
    `
  },
  message: function (message) {
    this.innerText(message);
    // this.setStyle({
    //   color: 'green'
    // })
  },
  error: function(error) {
    // this.setStyle({
    //   color: 'red'
    // })
  }
})

let video = null;

const preventEmit = {
  seek: false,
  play: false,
  pause: false,
}

const seekThrottle = createThrottle();
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

  video.onseeking = e => {
    if (preventEmit.seek || preventEmit.play) {
      preventEmit.seek = false;
      return
    }
    // console.log('progress', e)
    seekThrottle(() => {
      sendMessage({
        type: 'playState',
        error: false,
        message: 'Video seeked',
        playState: 'seeked',
        progress: video.currentTime,
        event: e,
        injectedId
      });
    });
  }

  // video.onprogress = e => {
  //   // console.log('progress', e)
  //   sendMessage({
  //     type: 'playState',
  //     error: false,
  //     message: 'Video playing',
  //     playState: 'progress',
  //     progress: video.currentTime,
  //     now: Date.now(),
  //     event: e
  //   })
  // }

  video.onpause = e => {
    if (preventEmit.pause) {
      preventEmit.pause = false;
      return
    }
    // console.log('progress', e)
    sendMessage({
      type: 'playState',
      error: false,
      message: 'Video paused',
      playState: 'pause',
      event: e,
      injectedId
    })
  }

  video.onplay = e => {
    if (preventEmit.play) {
      preventEmit.play = false;
      return
    }
    // console.log('progress', e)
    sendMessage({
      type: 'playState',
      error: false,
      message: 'Play video',
      playState: 'play',
      progress: video.currentTime,
      event: e,
      injectedId
    })
  }

  sendResponse({
    type: 'activate',
    error: false,
    message: 'video found!'
  })
}

// const progress = (message) => {
//   console.log('progressing')
//   const millisec = message.now;
//   const nowMill = Date.now();
//   const lagSeconds = (nowMill - millisec) / 1000;

//   // adjust for the time delay in sending the message
//   const progress = message.progress + lagSeconds;
//   const currentTime = video.currentTime;

//   // current time more than a second ahead of the other players current time
//   const lowEnd = currentTime > (progress - 1)

//   // current time less than a second behind the other players current time
//   const highEnd = currentTime < (progress + 1)
//   if (lowEnd && highEnd) {
//     video.currentTime = message.progress;
//     setState({
//       message: 'Progress updated'
//     })
//   }
// }

const seeked = (message) => {
  console.log('seeked')
    console.log('message.injectedId', message.injectedId )
  console.log('injectedId', injectedId )
  console.log('message.injectedId === injectedId', message.injectedId === injectedId )
  if (message.injectedId === injectedId) {
    return;
  }
  preventEmit.seek = false;
  video.currentTime = message.progress;
  setState({
    message: 'Seeked by other player'
  })
}

const play = (message) => {
  console.log('play', message.injectedId )
  console.log('message.injectedId', message.injectedId )
  console.log('injectedId', injectedId )
  console.log('message.injectedId === injectedId', message.injectedId === injectedId )
  if (message.injectedId === injectedId) {
    return;
  }
  preventEmit.play = false;
  video.currentTime = message.progress;
  video.play();
  setState({
    message: 'Playing by other player'
  })
}

const pause = (message) => {
  console.log('pause')
  if (message.injectedId === injectedId) {
    return;
  }
  preventEmit.pause = false;
  video.pause();
  setState({
    message: 'Paused by other player'
  })
}

const playStateTypes = {
  // progress,
  pause,
  play,
  seeked,
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


document.body.addEventListener("change", function(e) {
    console.log(e.target);
})