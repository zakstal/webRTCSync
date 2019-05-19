slice = arr => Array.prototype.slice.call(arr);
aTags = slice(document.querySelectorAll('#content a'));

links = aTags.filter(a => a.innerText !== 'Delete')
     .map(a => ({
       title: a.innerText,
       url: a.href,
     }));
copy(JSON.stringify(links));