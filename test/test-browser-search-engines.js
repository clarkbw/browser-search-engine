/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:true, browser:false,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:true, esnext: true */

"use strict";

const { BrowserSearchEngines,
        SearchEngine,
        URLTYPE_SUGGEST_JSON,
        URLTYPE_SEARCH_HTML } = require("browser-search-engine");

const WIKIPEDIA_NAME = "Wikipedia (en)";
const AMAZON_NAME = "Amazon.com";
const GOOGLE_NAME = "Google";
const AMAZON_SUGGEST_URL = "http://completion.amazon.com/search/complete?method=completion&search-alias=aps&mkt=1&q={searchTerms}";
const YELP_SUGGEST_URL = "http://www.yelp.ca/search_suggest?prefix={searchTerms}&loc={geo:name}";
const YELP_ENGINE = {
  "name" : "Yelp",
  "icon" : "data:image/x-icon;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsQCQEAEhsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsMAQAAAAAMGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbDgAAAAAAAAwbGxsbGxoFCxsbGxsbGxsbGxsbGxsbGxsXAQAAAAAADBsbGxsbBQAACRsbGxsbGxsbGxsbGxsbGxsVAAAAAAAMGxsbGw4AAAAACRsbGxsbGxsbGxsbGxsbGxsPAAAAAAwbGxsYAQAAAAAAEhsbGxsbGxsbGxsbGxsbGxsPAAAADBsbGwcAAAAAAAACGxsbGxsbGxsbGxsbGxsbGxsJAAAMGxsSAAAAAAAAAAMbGxsbGxsbGxsWDBQbGxsbGxsKBhUbGwEAAAAAAgoTGxsbGxsbGxsbGwMAAAEJEhobGxsbGxsbBwACChUbGxsbGxsbGxsbGxsbAAAAAAAAAAcSGxsbGxsbFRcbGxsbGxsbGxsbGxsbGxsAAAAAAAAAAAAbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGwAAAAAAAAAABRsbGxsbFBAYGxsbGxsbGxsbGxsbGxsbAwAAAAABChUbGxsbGxYAAAACBw4WGxsbGxsbGxsbGxsLAAAFDxsbGxsbGxsbFwEAAAAAAAABDBsbGxsbGxsbGxkNERsbGxsbGwsAEhsbDwAAAAAAAAAFGxsbGxsbGxsbGxsbGxsbGxsQAAAHGxsbCwAAAAAAABAbGxsbGxsbGxsbGxsbGxsbGgEAAAUbGxsbAwAAAAAFGxsbGxsbGxsbGxsbGxsbGxsHAAAABRsbGxsXAQAAARcbGxsbGxsbGxsbGxsbGxsbEgAAAAAJGxsbGxsTAAEVGxsbGxsbGxsbGxsbGxsbGxgBAAAAAAwbGxsbGxsVFxsbGxsbGxsbGxsbGxsbGxsbAwAAAAAADBsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGwkAAAAAAAAMGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsOAAAAAAAAAAwbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGwIAAAAAAAAADBsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbFwgBAAAAAAAMGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsRCgQAAREbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbGxv////////////wf///wH///4B8f/+AfD//wHgf/+BwD//wcA//+GAP+PxgH/gP4P/4A/P/+AP///gD4//4B8A/+D/AD/j8YA//+HAP//B4H//weB//4Hw//8B+f//Af///gH///wB///8Af///AH///+B//////////////////w==",
  "alias" : "YelpAlias",
  "description" : "Yelp - Connecting people with great local businesses",
  "method" : "get",
  "url" : "http://www.yelp.ca/search?ns=1&find_desc={searchTerms}&find_loc={geo:name}"
};

exports['test check current engine'] = function (assert, done) {
  BrowserSearchEngines.once("current", function(engine) {
    assert.equal(engine.name, AMAZON_NAME);
    BrowserSearchEngines.once("current", function(e) {
      assert.equal(e.name, GOOGLE_NAME);
      done();
    });
  });
  var google = BrowserSearchEngines.get(GOOGLE_NAME),
      amazon = BrowserSearchEngines.get(AMAZON_NAME);
  // default is currently Google
  assert.equal(BrowserSearchEngines.currentEngine.name, google.name);
  // check that this engine knows it is the current engine
  assert.ok(google.isCurrent);

  // Change the default to Amazon
  BrowserSearchEngines.currentEngine = amazon;
  // default should now be Amazon
  assert.equal(BrowserSearchEngines.currentEngine.name, amazon.name);
  // check that this engine knows it is the current engine
  assert.ok(amazon.isCurrent);
  // Reset the default back to Google
  BrowserSearchEngines.currentEngine = BrowserSearchEngines.get(GOOGLE_NAME);
  // default should be back to Google
  assert.equal(BrowserSearchEngines.currentEngine.name, google.name);
  // check that this engine knows it is the current engine
  assert.ok(google.isCurrent);
};

exports['test check default engine'] = function (assert, done) {
  BrowserSearchEngines.once("removed", function(engine) {
    assert.equal(engine.name, GOOGLE_NAME);
    BrowserSearchEngines.once("added", function(engine) {
      assert.equal(engine.name, GOOGLE_NAME);
      done();
    });
  });

  var google = BrowserSearchEngines.get(GOOGLE_NAME),
      yahoo = BrowserSearchEngines.get('Yahoo');
  assert.equal(BrowserSearchEngines.defaultEngine.name, google.name);
  assert.ok(google.isDefault);

  // this doesn't actually remove the engine, only "hides" it
  BrowserSearchEngines.remove(google);

  // default should be the next visible engine
  assert.equal(BrowserSearchEngines.defaultEngine.name, yahoo.name);
  assert.ok(yahoo.isDefault);

  // the original default should still be Google
  assert.equal(BrowserSearchEngines.originalDefaultEngine.name, google.name);
  assert.ok(google.isOriginalDefault);

  // this doesn't actually add the engine back as much as "shows" it
  BrowserSearchEngines.add(google);

  // everything should be back to normal now
  assert.equal(BrowserSearchEngines.defaultEngine.name, google.name);
  assert.ok(google.isDefault);
};

exports['test default visible engines'] = function (assert) {
  var visible = [
    AMAZON_NAME,
    WIKIPEDIA_NAME,
    GOOGLE_NAME,
    "Yahoo",
    "Bing",
    "eBay",
    "Twitter"
  ];
  // Check that the engines we assume exist actually do exist
  BrowserSearchEngines.getVisible().forEach(function (engine) {
    assert.ok(visible.indexOf(engine.name) >= 0);
  });
  // Check that we only have 7 default visible engines (en-us)
  assert.equal(BrowserSearchEngines.getVisible().length, visible.length);
};

// for default profiles this test is exactly the same as for visible engines
exports['test default engines'] = function (assert) {
  var defaults = [
    AMAZON_NAME,
    WIKIPEDIA_NAME,
    GOOGLE_NAME,
    "Yahoo",
    "Bing",
    "eBay",
    "Twitter"
  ];
  // Check that the engines we assume exist actually do exist
  BrowserSearchEngines.getVisible().forEach(function (engine) {
    assert.ok(defaults.indexOf(engine.name) >= 0);
  });
  // Check that we only have 7 default visible engines (en-us)
  assert.equal(BrowserSearchEngines.getVisible().length, defaults.length);
};

exports['test missing suggest'] = function (assert) {
  ["Twitter", "Amazon.com"].forEach(function (engine) {
    assert.notEqual(BrowserSearchEngines.get(engine), null, engine + " exists");
    assert.equal(BrowserSearchEngines.get(engine).getSuggestion("search"), null, engine + " should not have a suggestion URL");
  });
};

exports['test has suggest'] = function (assert) {
  [
    { name : "Wikipedia (en)", url : "http://en.wikipedia.org/w/api.php?action=opensearch&search=search" },
    { name : "Google", url : "https://www.google.com/complete/search?client=firefox&q=search" },
    { name : "Yahoo", url : "http://ff.search.yahoo.com/gossip?output=fxjson&command=search" },
    { name : "Bing", url : "http://api.bing.com/osjson.aspx?query=search&form=OSDJAS" },
    { name : "eBay", url : "http://anywhere.ebay.com/services/suggest/?s=0&q=search" }
  ].forEach(function (engine) {
    assert.notEqual(BrowserSearchEngines.get(engine.name), null, engine.name + " exists");
    assert.equal(BrowserSearchEngines.get(engine.name).getSuggestion("search"), engine.url, engine.name + " does not have the correct suggestion URL");
  });
};

exports['test incorrect siteURLs'] = function (assert) {
  [
    { name : "Wikipedia (en)", incorrect : "http://en.wikipedia.org/wiki/Special:Search", correct : "http://en.wikipedia.org/w/opensearch_desc.php" },
    // this Amazon one seems backwards but in reality they list their rel="self" template as this url instead of the default domain dunno
    { name : "Amazon.com", incorrect : "http://www.amazon.com/", correct : "http://d2lo25i6d3q8zm.cloudfront.net/browser-plugins/AmazonSearchSuggestionsOSD.Firefox.xml" }
  ].forEach(function (engine) {
    assert.notEqual(BrowserSearchEngines.get(engine.name), null, engine.name + " exists");
    assert.equal(BrowserSearchEngines.get(engine.name).searchForm, engine.incorrect, 
      engine.name + " has " + BrowserSearchEngines.get(engine.name).searchForm + " and wants to have " + engine.correct + " instead of the searchForm URL we expected: " + engine.incorrect);
  });
};

exports['test get engine'] = function (assert) {
  var amazon = BrowserSearchEngines.get(AMAZON_NAME);
  assert.notEqual(amazon, null, "Amazon get");
  assert.equal(amazon.name, AMAZON_NAME, "Amazon engine name matches");
};

exports['test yelp 001 add engine'] = function (assert, done) {
  BrowserSearchEngines.once("added", function(engine) {
    assert.equal(engine.name, YELP_ENGINE.name);
    done();
  });
  BrowserSearchEngines.add(YELP_ENGINE);
  var yelp = BrowserSearchEngines.get(YELP_ENGINE.alias);
  assert.notEqual(yelp, null, "Yelp wasn't added or an Alias get didn't match!");
  assert.equal(yelp.name, YELP_ENGINE.name, "Yelp name matches");
  assert.equal(yelp.icon, YELP_ENGINE.icon, "Yelp icon matches");
  assert.equal(yelp.alias, YELP_ENGINE.alias, "Yelp alias matches");
  assert.equal(yelp.description, YELP_ENGINE.description, "Yelp description matches");
  assert.equal(yelp.getSubmission("search"), YELP_ENGINE.url.replace("{searchTerms}", "search"), "Yelp Query URL matches");
};

exports['test yelp 002 get engine by alias'] = function (assert) {
  var yelp = BrowserSearchEngines.get(YELP_ENGINE.alias);
  assert.notEqual(yelp, null, "Could not find the Yelp Engine by alias");
};

exports['test yelp 003 get engine by name'] = function (assert) {
  var yelp = BrowserSearchEngines.get(YELP_ENGINE.name);
  assert.notEqual(yelp, null, "Found the Yelp Engine by name");
};

exports['test yelp 004 add suggest'] = function (assert, done) {
  BrowserSearchEngines.once("suggest", function(engine) {
    assert.equal(engine.name, YELP_ENGINE.name);
    done();
  });
  var yelp = BrowserSearchEngines.get(YELP_ENGINE.alias);
  assert.notEqual(yelp, null, "Found the Yelp Engine");
  yelp.addSuggest(YELP_SUGGEST_URL);
  assert.equal(yelp.getSuggestion("search"), YELP_SUGGEST_URL.replace("{searchTerms}", "search"));
};

exports['test yelp 005 remove engine'] = function (assert, done) {
  BrowserSearchEngines.once("removed", function(engine) {
    assert.equal(engine.name, YELP_ENGINE.name);
    done();
  });
  BrowserSearchEngines.remove(BrowserSearchEngines.get(YELP_ENGINE.name));
  var yelp = BrowserSearchEngines.get(YELP_ENGINE.name);
  assert.equal(yelp, null, "Yelp removed");
};

exports['test yelp 006 add engine with suggest'] = function (assert) {
  var engine = YELP_ENGINE;
  engine["suggest"] = YELP_SUGGEST_URL;
  BrowserSearchEngines.add(engine);
  var yelp = BrowserSearchEngines.get(engine.alias);
  assert.notEqual(yelp, null, "Found the Yelp Engine");
  assert.ok(yelp.supportsResponseType(URLTYPE_SUGGEST_JSON));

};

exports['test yelp 007 engine submission types'] = function (assert, done) {
  BrowserSearchEngines.once("removed", function(engine) {
    assert.equal(engine.name, YELP_ENGINE.name);
    done();
  });
  var yelp = BrowserSearchEngines.get(YELP_ENGINE.name);
  var submission = yelp.getSubmission("__SEARCH__").replace("__SEARCH__", "{searchTerms}");;
  var suggestion = yelp.getSuggestion("__SEARCH__").replace("__SEARCH__", "{searchTerms}");
  assert.equal(submission, YELP_ENGINE.url);
  assert.equal(suggestion, YELP_SUGGEST_URL);

  BrowserSearchEngines.remove(yelp);
};

exports['test check supports suggest'] = function (assert) {
  var google = BrowserSearchEngines.get(GOOGLE_NAME);
  assert.ok(google.supportsResponseType(URLTYPE_SUGGEST_JSON));
};

exports['test check supports approved types'] = function (assert) {
  var google = BrowserSearchEngines.get(GOOGLE_NAME);
  assert.ok(google.supportsResponseType(URLTYPE_SEARCH_HTML));
  assert.ok(!google.supportsResponseType("text/xml"));
};

exports['test try adding suggest'] = function (assert, done) {
  BrowserSearchEngines.once("suggest", function(engine) {
    assert.equal(engine.name, AMAZON_NAME);
    done();
  });
  var amazon = BrowserSearchEngines.get(AMAZON_NAME);
  amazon.addParam({ name : 'suggest', value : AMAZON_SUGGEST_URL, responseType : URLTYPE_SUGGEST_JSON });
  assert.ok(amazon.supportsResponseType(URLTYPE_SUGGEST_JSON));
};

require('test').run(exports);
