console.log('hoooooooo')
var scaleFactor = 0.25;

/**
 * Checks if canvas is tainted. meaning the src has been loaded with another domain
 */
function isTainted(ctx) {
    try {
        var pixel = ctx.getImageData(0, 0, 1, 1);
        return false;
    } catch(err) {
        return (err.code === 18);
    }
}

function capture(video, scaleFactor) {
    if (scaleFactor == null) {
        scaleFactor = 1;
    }
    var w = video.videoWidth * scaleFactor;
    var h = video.videoHeight * scaleFactor;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return canvas;
}

/**
 * Invokes the <code>capture</code> function and attaches the canvas element to the DOM.
 */
function shoot() {
    const video = document.querySelectorAll('video')[0];
    video.origin = 'anonymous';
    var canvas = capture(video, scaleFactor);
    if (isTainted(canvas)) {
      return '';
    }

    return canvas.toDataURL();
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "hello") {
      const video = document.querySelectorAll('video')[0];
      const source = video.children[0].src
      const src = video.src || source
      const screenShot = shoot();
      sendResponse({farewell: src, screenShot: screenShot});
    }
  });


chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
  if (response.farewell) {
    const video = document.querySelectorAll('video')[0];
    const source = video.children[0].src
    const src = video.src || source
    if (window.location.href === src) {
      return ;
    }

    chrome.runtime.sendMessage({greeting: "saveit", src: src, location: window.location.href, title: document.title}, function(response) {
      window.location.href = src;
    })

  }
});