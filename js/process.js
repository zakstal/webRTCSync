
const mapAsync = async (arr, callback) => {
  const newArr = [];
  for (i = 0; i < arr.length; i++) {
    const newItem = await callback(arr[i]);
    newArr.push(newItem);
  }

  return newArr;
}
const appendToParent = parent => child => parent.appendChild(child);
function fragmentFromString(strHTML) {
    var temp = document.createElement('template');
    temp.innerHTML = strHTML;
    return temp.content;
}

const itemTemplate = ({
  title = '',
  imgSrc = '',
  urlSrc = '',
  index = '',
  onDelete,
  onClick,
}) => {
  const deleteIndex = `${title} ${index}`
  const frag = fragmentFromString(`
    <p>
      <img
        style="width: 100px; padding-right: 10px;"
        src="${imgSrc}"/>
      <span id="${index}" data-url="${urlSrc}" style="cursor: pointer">
        ${title}
      </span>
      <span>|</span>
      <a id="${deleteIndex}" href="#" style="color: red;">
        Delete
      </a>
      <span></span>
    </p>
  `);

  const p = frag.querySelectorAll('p')[0];
  frag.getElementById(index).addEventListener("click", () => onClick(urlSrc));
  frag.getElementById(deleteIndex).addEventListener("click", () => {
    p.innerHTML = '';
    onDelete()
  });

  return frag;
}

const contentTemplate = (
  children
) => {
  const emptyMessage = "You have no bookmarks. Create some using the right-click context menu on any page."

  if (children.length) {
    const frag = fragmentFromString('');
    children.forEach(appendToParent(frag));
    return frag;
  } else {
    return fragmentFromString(emptyMessage);
  }
}

/* Function to verify that a user has created a keypair, and alter the page accordingly. */
function checkForNewUser(){
  chrome.storage.local.get('publicKey', function(passwordCheck){
    if(passwordCheck.publicKey !== undefined){
      document.getElementById("create-password").style.display = 'none';
      document.getElementById("decrypt").addEventListener("click", loadBookmarks);
    }
    else{
      document.getElementById("submit").style.display = 'none';
      document.getElementById("setup-account").addEventListener("click", generateKeyPair);
    }
  });
}

/* Function to generate a keypair. */
function generateKeyPair(){
  var newPassword = document.getElementById("new-password").value;
  var newPasswordRepeat = document.getElementById("new-password-repeat").value;

  /* Verify private key encryption password. */
  if(newPassword === ""){
    alert("Password cannot be null");
    return;
  }

  if(newPassword !== newPasswordRepeat){
    alert("Passwords do not match.");
    return;
  }

  document.getElementById("setup-account").innerHTML = "Generating keys";
  document.getElementById("setup-account").disabled = true;

  /* Prepare to generate keypair. */
  var options = {
    userIds: [{ name:'Encrypted Bookmarks User', email:'example@example.com' }],
    numBits: 2048,
    passphrase: newPassword
  };

  /* Generate keypair, store, and reload the page. */
  openpgp.generateKey(options).then(function(key){
    var privkey = key.privateKeyArmored;
    var pubkey = key.publicKeyArmored;

    chrome.storage.local.set({privateKey: privkey});
    chrome.storage.local.set({publicKey: pubkey});

    location.reload();
  });
}

/* Function to retrieve and decrypt bookmarks. */
function loadBookmarks(){
  chrome.storage.local.get({
    privateKey: "",
    bookmarks: []
  }, async function(items){
    var password = document.getElementById("password").value;

    if(password === ""){
      alert("Password cannot be null");
      return;
    }

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
      if (request.greeting == "hello")
        sendResponse({farewell: true});
    });

    /* Decrypt private key with entered password. */
    var privKeyObj = openpgp.key.readArmored(items.privateKey).keys[0];
    privKeyObj.decrypt(password);

    /* Hide submit button. */
    document.getElementById("submit").style.display = 'none';

    /* Manual loop to resolve asynchronous issues. */
    var store = items.bookmarks;
    console.log('store!!!', store);

    const bookmarks = store['bookmarks'];

    const itemFragments = await mapAsync(bookmarks, async (bookMark, i) => {

      var urlEnc = bookMark.url;
      var titleEnc = bookMark.title;

      /* Prepare url for decryption. */
      optionsUrl = {
        message: openpgp.message.readArmored(urlEnc),
        privateKey: privKeyObj
      };

      optionsTitle = {
        message: openpgp.message.readArmored(titleEnc),
        privateKey: privKeyObj
      };

      /* Decrypt url, and then proceed. */
      const plaintextUrl = await openpgp.decrypt(optionsUrl)
      const [url, screenShot] = JSON.parse(plaintextUrl.data);
      const plaintextTitle = await openpgp.decrypt(optionsTitle)


      return itemTemplate({
        title: plaintextTitle.data,
        urlSrc: url,
        imgSrc: screenShot,
        index: i,
        onDelete: deleteBookmark,
        onClick: openIncognito
      });
    });


    var display = document.getElementById("content");
    const content = contentTemplate(itemFragments)
    display.appendChild(content);
  });
}

function openIncognito(url) {
  chrome.windows.create({url: url, incognito: true})
}

/* Function to delete a bookmark. */
function deleteBookmark(){
  chrome.storage.local.get('bookmarks', function(items){
    var set = items.bookmarks;
    set['bookmarks'].splice(0, 1);
    chrome.storage.local.set({bookmarks: items.bookmarks});

    if(set['bookmarks'].length == 0){
      document.getElementById("content").textContent = "You have no bookmarks. Create some using the right-click context menu on any page.";
    }
  });
}

/* Call checkForNewUser on page load. */
document.addEventListener('DOMContentLoaded', checkForNewUser);
