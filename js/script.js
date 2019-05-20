var p = null;
var drone = null

const startWebRTC = (request, sender, sendResponse) => {
  if (!request.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
  }
  const roomHash = request.hash || location.hash.substring(1);

  sendResponse({
    type: 'webRTCLocation',
    error: false,
    message: `Send this: ${roomHash}`,
  })

  // TODO: Replace with your own channel ID
  drone = new ScaleDrone('yiS12Ts5RdNhebyM');
  // Room name needs to be prefixed with 'observable-'
  const roomName = 'observable-' + roomHash;
  let room;
  let pc;

  function onSuccess() {};
  function onError(error) {
     sendMessage({
      type: 'error',
      error: true,
      message: `Error in webRTC ${error}`,
    })
  };

  drone.on('open', error => {
    if (error) {
      return console.error(error);
    }
    room = drone.subscribe(roomName);
    room.on('open', error => {
      if (error) {
        onError(error);
      }
    });
    // We're connected to the room and received an array of 'members'
    // connected to the room (including us). Signaling server is ready.
    room.on('members', members => {
      // If we are the second user to connect to the room we will be creating the offer
      if (members.length < 2) {
        return;
      }

      startWebRTCC();
    });

    room.on('member_join', function(member) {
      // Member object
      startWebRTCC();
    });
  });

    // Send signaling data via Scaledrone
  function sendMessageScaleDrone(message) {
    drone.publish({
      room: roomName,
      message
    });
  }

  function startWebRTCC() {
    p = new SimplePeer({ initiator: !request.hash })

    p.on('error', err => {
      setIcon('error');
      sendMessage({
        type: 'error',
        error: true,
        message: `Error in webRTC ${err}`,
      })
    })

    p.on('signal', data => {
      setIcon('waiting');
      sendMessageScaleDrone(JSON.stringify(data))
    })

    p.on('close', () => {
      setIcon('waiting');
    });

    p.on('connect', () => {
      setIcon('connected');
       sendMessage({
        type: 'webRTCLocation',
        error: false,
        message: `Connected!`,
      })
      // p.send('whatever' + Math.random())
    })

    p.on('data', data => {
      // console.log('data: ' + data)
      sendMessage({
        type: 'receiveData',
        error: false,
        message: JSON.parse(data),
      })

      messageCurrentTab({
        type: 'receiveData',
        error: false,
        message: JSON.parse(data),
      })
    })

    // Listen to signaling data from Scaledrone
    room.on('message', (message, client) => {
      // Message was sent by us
      if (message.clientId === drone.clientId) {
        return;
      }

      p.signal(JSON.parse(message.data))

    });
  }
}

const playState = (data) => {
  // console.log('data', data)
  p && p.send(JSON.stringify(data))
}

const messageTypes = {
  playState,
  startWebRTC,
}

addMessageListeners(messageTypes)