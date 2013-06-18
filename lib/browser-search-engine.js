/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:true, browser:true, 
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, esnext: true */

/*global */

"use strict";

const { Cc, Ci } = require('chrome');

const { Class } = require('sdk/core/heritage'),
      { off, emit } = require('sdk/event/core'),
      { EventTarget } = require('sdk/event/target'),
      SystemEvents = require('sdk/system/events'),
      { ns } = require('sdk/core/namespace');

const URLTYPE_SEARCH_HTML = exports.URLTYPE_SEARCH_HTML = "text/html",
      URLTYPE_SUGGEST_JSON = exports.URLTYPE_SUGGEST_JSON = "application/x-suggestions+json";

const SearchService = Cc["@mozilla.org/browser/search-service;1"]
                      .getService(Ci.nsIBrowserSearchService);

const namespace = ns();

// Mapping Search Engine Names to their Suggest URLs
var SuggestMap = {};

/**
 * This is a module for working with the system nsIBrowserSearchService
 *
 * It emits several events for monitoring the state of the current search
 * engines available
 *
 * @event 'changed' is emitted when an engine is removed, added, or the current is changed
 * @event 'removed' is emitted when an engine is removed
 * @event 'added' is emitted when an engine is added
 *
 * @example
 *  BrowserSearchEngines.once("changed", function(engine) {
 *    console.log('got a change event from engine ' + engine.name);
 *  });
 *
 * @see https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIBrowserSearchService
 */
var BrowserSearchEngines = Class({
  extends : EventTarget,
  type : 'BrowserSearchEngines',

  /**
   * Returns the currently active (and visible) search engine
   * May return null if there are no visible search engines
   */
  get currentEngine() {
    if (SearchService.currentEngine !== null) {
      return new SearchEngine(SearchService.currentEngine);
    }
    return null;
  },
  /*
   * Sets the currently active search engine, expects a {SearchEngine} object
   */
  set currentEngine(engine) {
    SearchService.currentEngine = engine.nsISearchEngine;
  },

  /**
   * Returns the default search engine.
   * May return the first visible engine if the default engine is hidden
   * Will return null if there are no visible engines
   */
  get defaultEngine() {
    if (SearchService.defaultEngine !== null) {
      return new SearchEngine(SearchService.defaultEngine);
    }
    return null;
  },

  /**
   * Returns the original default search engine, not necessarily the user set default engine
   * Will always return an engine even if it is not visible
   */
  get originalDefaultEngine() {
    return new SearchEngine(SearchService.originalDefaultEngine);
  },

  initialize : function initialize(options) {
    EventTarget.prototype.initialize.call(this, options);
    SystemEvents.on("browser-search-engine-modified", this._observer.bind(this), true);
    require("sdk/system/unload").ensure(this);
  },

  /**
   * Adds (or shows) an engine to the Browser list of OpenSearch engines available
   *
   * Engine objects passed to this method are required to have a `name` and `url`.
   * The `method` attribute will be assumed "get" if not specified, the other option is "post"
   * Optional additional attributes are `icon`, `alias`, `description`, and `suggest`
   *
   * For engines which are default they will be made visible.
   *
   * @example
   *  BrowserSearchEngines.add({ name : 'DuckDuckGo', url : 'https://duckduckgo.com/?q={searchTerms}'});
   *
   * @param {Object|SearchEngine} engine a hash object that represents an engine
   */
  add : function add(engine) {
    // Only default engines can be 'hidden', others are removed from the system
    if (engine.hidden) {
      engine.hidden = !engine.hidden;
      this._emit("added", engine);
    } else {
      SearchService.addEngineWithDetails(engine.name, engine.icon || "",
                                         engine.alias || "", engine.description || "",
                                         engine.method || "get", engine.url);
      if (engine.suggest) {
        this.get(engine.name).addSuggest(engine.suggest);
      }
    }
  },

  /**
   * Removes (or hides) an engine from the Browser list of OpenSearch engines
   *
   * Engines which are installed by default will only be "hidden" and not actually removed
   * User installed engines will be removed from the system via this method
   *
   * @example
   *  BrowserSearchEngines.remove(engine);
   *
   * @param {SearchEngine} engine The search engine object
   */
  remove : function remove(engine) {
    SearchService.removeEngine(engine.nsISearchEngine);
    delete SuggestMap[engine.name];
  },

  /**
   * Returns a search engine by its name or alias
   *
   * Will return null if no engine of that name or alias is found
   *
   * @example
   *  BrowserSearchEngines.get('Google');
   *
   * @param {String} name Name or alias of the search engine
   */
  get : function get(name) {
    var engine = SearchService.getEngineByName(name) || SearchService.getEngineByAlias(name);
    if (engine) {
      return new SearchEngine(engine);
    }
    return null;
  },

  /**
   * Returns an Array of the default SearchEngine objects
   *
   * Default engines may not all be visible
   *
   * @example
   *  BrowserSearchEngines.getDefaults();
   *
   * @returns {Array} of {SearchEngine} objects
   */
  getDefaults : function getDefaults() {
    return SearchService.getDefaultEngines().map(function (e) {
      return new SearchEngine(e);
    });
  },

  /**
   * Returns an Array of the currently visible SearchEngine objects
   *
   * This is the most commonly used function for accessing a users engines
   *
   * @example
   *  BrowserSearchEngines.getVisible();
   *
   * @returns {Array} of {SearchEngine} objects
   */
  getVisible : function getVisible() {
    return SearchService.getVisibleEngines().map(function (e) {
      return new SearchEngine(e);
    });
  },
  /**
   * Internal utility function to emit the desired event along with a changed event
   */
  _emit : function _emit(type, engine) {
    emit(this, type, engine);
    emit(this, "changed", engine);
  },
  /**
   * Internal observer for the system search service events
   */
  _observer : function _observer(event) {
    var subject = event.data,
        engine = new SearchEngine(event.subject); // data = nsISearchEngine

    // This is the removal of a non-default installed engine, defaults are "changed"
    if ("engine-removed" === subject) {
      this._emit("removed", engine);

    // This is the removal of a non-default installed engine, defaults are "changed"
    } else if ("engine-added" === subject) {
      this._emit("added", engine);

    // This is a grab bag of possible events from edits to removal depending on the type of engine
    } else if ("engine-changed" === subject) {

      // removing a default engine only actually hides it, they are not removed
      // which is why we've given a 'changed' event instead of a 'remove'
      if (engine.hidden) {
        this._emit("removed", engine);
      } else {
        // This event could just be about the order of the engines changing
        this._emit("order", engine);
      }

    // This sets the current engine in use
    } else if ("engine-current" === subject) {
      this._emit("current", engine);
    }
  },

  unload : function unload(reason) {
    SystemEvents.off("browser-search-engine-modified", this._observer);
    off(this);
  }

})();

/**
 * This is an object that maps to the nsISearchEngine system object.
 *
 * This object is mostly used for the getSubmission() function which
 * converts search terms into a URL that can be loaded to get to a search
 * results page for that search engine.
 *
 * @example
 *  SearchEngine.getSubmission("puppies');
 *
 * @see https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsISearchEngine
 */
var SearchEngine = Class({

  /**
   * @returns {Boolean} if this Search Engine is the currently active engine
   */
  get isCurrent() {
    return BrowserSearchEngines.currentEngine.isEqualTo(this);
  },

  /**
   * @returns {Boolean} if this Search Engine is the default visible engine
   */
  get isDefault() {
    return BrowserSearchEngines.defaultEngine.isEqualTo(this);
  },

  /**
   * @returns {Boolean} if this Search Engine is the original default engine (visible or not)
   */
  get isOriginalDefault() {
    return BrowserSearchEngines.originalDefaultEngine.isEqualTo(this);
  },

  get nsISearchEngine() { return namespace(this).engine; },

  initialize : function initialize(nsISearchEngine) {
    namespace(this).engine = nsISearchEngine.QueryInterface(Ci.nsISearchEngine);
  },

  get alias() { return namespace(this).engine.alias; },
  get description() { return namespace(this).engine.description; },
  get hidden() { return namespace(this).engine.hidden; },
  // this allows us to change the state of a default engine
  set hidden(hidden) { namespace(this).engine.hidden = hidden; },
  get iconURI() { return namespace(this).engine.iconURI; },
  get icon() {
    return (namespace(this).engine.iconURI) ? namespace(this).engine.iconURI.spec : "";
  },
  get name() { return namespace(this).engine.name; },
  get searchForm() { return namespace(this).engine.searchForm; },
  get type() { return namespace(this).engine.type; },
  get readOnly() {
    return BrowserSearchEngines.getDefaults().some(function (e) { return this.name === e.name; }, this);
  },
  /**
   * Main function of these engines is to return a "submission" url for use
   * in searching.
   *
   *
   * @example
   *  var engine = BrowserSearchEngines.get('Google');
   *  var url = engine.getSubmission('puppies');
   *
   * @param {String} terms is the terms you'd like to search for
   * @param {String} the type of search you'd like to perform (optional - defaults to URLTYPE_SEARCH_HTML)
   * @returns {String} url encoded with the search terms provided
   */
  getSubmission : function getSubmission(terms, type) {
    var submission = this.getSubmissionURI(terms, type),
        url = null;
    if (submission) {
      url = submission.uri.spec;
    }
    return url;
  },
  /**
   * Returns the nsIURI object of the search submission.  Most useful if the method of
   * searching is not a "get" but a "post" which requires the postData in a different format.
   *
   * @example
   *  var engine = BrowserSearchEngines.get('Google');
   *  var uri = engine.getSubmissionURI('puppies');
   *  var data = uri.postData;
   *
   * @param {String} terms is the terms you'd like to search for
   * @param {String} the type of search you'd like to perform (optional - defaults to URLTYPE_SEARCH_HTML)
   * @returns {nsIURI} uri of the search terms provided
   */
  getSubmissionURI : function getSubmissionURI(terms, type) {
    type = type || URLTYPE_SEARCH_HTML;
    var submission = namespace(this).engine.getSubmission(terms, type);
    return submission;
  },
  /**
   * Similar to getSubmission() but this will use the internal SuggestMap for engines which
   * may have a suggestion type url added but are default engines / read-only.
   *
   *
   * @example
   *  var engine = BrowserSearchEngines.get('Google');
   *  var url = engine.getSuggestion('puppies');
   *
   * @param {String} terms is the terms you'd like to search for
   * @returns {String} url encoded with the search terms provided
   */
  getSuggestion : function getSuggestion(terms) {
    var url = null;
    // If this is part of our map hack then use that
    if (SuggestMap[this.name]) {
      // Do our own submission engine
      url = SuggestMap[this.name].replace("{searchTerms}", encodeURIComponent(terms));
    } else {
      url = this.getSubmission(terms, URLTYPE_SUGGEST_JSON);
    }
    return url;
  },
  /*
   * Adds parameters to a search engine's submission data
   *
   * Engine objects passed to this method are required to have a `name` and `url`.
   * The `method` attribute will be assumed "get" if not specified, the other option is "post"
   *
   * @example
   *  BrowserSearchEngines.addParam({ name : 'DuckDuckGo', 
   *                                  value : 'https://duckduckgo.com/?q={searchTerms}', 
   *                                  responseType : URLTYPE_SEARCH_HTML });
   *
   * @param {Object} engine a hash object with name, value, and responseType
   */
  addParam : function addParam(params) {
    // Firefox will ASSERT FAIL which can't be caught so we need to test if our
    // engine is read-only before trying to change it.
    if (this.readOnly) {
      if (params.name === "suggest") {
        this.addSuggest(params.value);
      }
    } else {
      namespace(this).engine.addParam(params.name, params.value, params.responseType);
    }
  },
  /**
   * Similar to `addParam()` this is designed for the suggest type params to prevent
   * 
   *
   * Engine objects passed to this method are required to have a `name` and `url`.
   * The `method` attribute will be assumed "get" if not specified, the other option is "post"
   *
   * @example
   *  BrowserSearchEngines.addSuggest('https://duckduckgo.com/suggeset?q={searchTerms}');
   *
   * @param {String} url with Open Search type parameters
   */
  addSuggest : function addSuggest(url) {
    // Map these out because read-only engines will barf at the param addition
    SuggestMap[this.name] = url;
    BrowserSearchEngines._emit("suggest", this);
  },
  /**
   * Rarely used function that can check if an engine supports a certain responseType
   *
   * @param {String} type of response you are hoping this engine supports
   */
  supportsResponseType : function supportsResponseType(type) {
    if (type !== URLTYPE_SEARCH_HTML && type !== URLTYPE_SUGGEST_JSON) {
      return false;
    }
    if (SuggestMap[this.name]) {
      return true;
    }
    return namespace(this).engine.supportsResponseType(type);
  },
  /*
   * Simply an '==' operator check for engines. Engine names must be unique so that
   * is all this function tests for.
   *
   * @param {SearchEngine} engine to check for equality
   */
  isEqualTo : function isEqualTo(engine) {
    return this.name === engine.name;
  },
  toString : function toString() {
    return "[ Search Engine " + this.name + " ]";
  },
  toJSON : function toJSON() {
    return { name : this.name,
             icon : this.icon,
             alias : this.alias,
             hidden : this.hidden,
             description: this.description,
             search : this.searchForm,
             url : this.getSubmission("__SEARCH__")
            };
  }
});

exports.BrowserSearchEngines = BrowserSearchEngines;
exports.SearchEngine = SearchEngine;
