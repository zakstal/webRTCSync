## Encrypted Bookmarks
**Version 2.0 | July 5 2017**

Encrypted Bookmarks allows Chromium users to store private bookmarks encrypted in the browser's local storage. Bookmarks are added using the right-click context menu, and bookmarks are accessed via the extension toolbar.

The required permissions are explained [here](/DOCUMENTATION.md#permissions).

#### How it works

The extension generates a keypair on installation using asymmetric encryption (OpenPGP.js) - encrypting the private key with a user passphrase. To add a bookmark the `title` and `url` of a tab are encrypted using the public key. Bookmarks are decrypted on access using the private key - that is decrypted using the user passphrase.

#### Download

[Chrome Web Store](https://chrome.google.com/webstore/detail/encrypted-bookmarks/gdbjccpleamopncgakdgkbpejffpmoia)

---

To put into incognito mode.
in Chrome extensions, Load unpacked, go to details, click switch to off, switch incognito on, click switch back on.