
const defaultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
const data = {}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == "saveit") {
      console.log('request', request)
      const src = request.src;
      const location = request.location;
      const title = request.title;
      data[src] = {location, title};
    }
  });
/* Function to verify that a user has created a keypair, and act accordingly. */
function userVerify(){
  chrome.storage.local.get('publicKey', function(verify){
    if(verify.publicKey !== undefined){
      addBookmark();
    }
    else{
      chrome.tabs.create({ url: "/html/bookmarks.html" });
    }
  });
}

/* Function to encrypt and add a bookmark. */
function addBookmark(){
  /* Query active tab. */
  chrome.tabs.query({
    'active': true,
    'lastFocusedWindow': true
  }, function(tabItems){
    chrome.storage.local.get({
      bookmarks: [],
      publicKey: ""
    }, function(bookmarkItems){
      /* Generate bookmark from tab. */
      var tempTitle = tabItems[0].title;
      var url = tabItems[0].url;
      chrome.tabs.sendMessage(tabItems[0].id, {greeting: "hello"}, async function(response) {

        const videoUrl = response && response.farewell
        const screenShot = response && response.screenShot
        const dataRes = data[videoUrl] || {};

        var title = prompt("Bookmark title", dataRes.title || tempTitle);


        if(title !== null){
          alert("Title cannot be null.");
          return;
        }

        const data = {
          title,
          url: dataRes.location || url,
          screenShot: screenShot || defaultImage
        }

          /* Prepare tab title for encryption. */
        var optionsTitle = {
          data: JSON.stringify(data),
          publicKeys: openpgp.key.readArmored(bookmarkItems.publicKey).keys
        };
        // var optionsTitle = {
        //   data: title,
        //   publicKeys: openpgp.key.readArmored(bookmarkItems.publicKey).keys
        // };

        /* Encrypt tab title, and then proceed further. */
        const cipherText = await openpgp.encrypt(optionsTitle)//.then(function(ciphertextTitle){
          /* Prepare tab url for encryption. */
          // var optionsUrl = {
          //   data: JSON.stringify([dataRes.location || url, screenShot || defaultImage]),
          //   publicKeys: openpgp.key.readArmored(bookmarkItems.publicKey).keys
          // };

          /* Encrypt tab title, and then store encrypted bookmark. */
          // openpgp.encrypt(optionsUrl).then(function(ciphertextUrl){
          bookmarkItems.bookmarks['bookmarks'].push(cipherText.data);

          chrome.storage.local.set({bookmarks: bookmarkItems.bookmarks});
          // });
        // });
        // openpgp.encrypt(optionsTitle).then(function(ciphertextTitle){
        //   /* Prepare tab url for encryption. */
        //   var optionsUrl = {
        //     data: JSON.stringify([dataRes.location || url, screenShot || defaultImage]),
        //     publicKeys: openpgp.key.readArmored(bookmarkItems.publicKey).keys
        //   };

        //   /* Encrypt tab title, and then store encrypted bookmark. */
        //   openpgp.encrypt(optionsUrl).then(function(ciphertextUrl){
        //     bookmarkItems.bookmarks['bookmarks'].push({"title": ciphertextTitle.data, "url": ciphertextUrl.data});

        //     chrome.storage.local.set({bookmarks: bookmarkItems.bookmarks});
        //   });
        // });
      });
    });
  });
}

/* Preform various tasks on first installation. */
chrome.runtime.onInstalled.addListener(function(details){
  if(details.reason == "install"){
    chrome.storage.local.set({bookmarks: {"bookmarks": []}});

    var context = "page";
    chrome.contextMenus.create({"title": "Add to zak Bookmarks", "contexts":[context], "id": "context" + context});

    chrome.tabs.create({url: "/html/bookmarks.html"});
  }
});

/* Call userVerify() on context meny click. */
chrome.contextMenus.onClicked.addListener(userVerify);

/* Open bookmarks page on extension toolbar icon click. */
chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.create({url: "/html/bookmarks.html"});
});
