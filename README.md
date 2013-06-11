Firefox Browser Search Engine Service
===

This is a Mozilla Add-on SDK module for working with the Firefox Search Engine service.

Major Modules
---

These are the major modules this SDK module wraps for you:

* [nsIBrowserSearchService](https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIBrowserSearchService)
* [nsISearchEngine](https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsISearchEngine)

Example Code
---
```javascript
const { BrowserSearchEngines } = require("browser-search-engine");
var google = BrowserSearchEngines.get('google');
var url = google.getSubmission('puppies');
```
