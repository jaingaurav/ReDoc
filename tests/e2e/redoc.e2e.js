'use strict';
const verifyNoBrowserErrors = require('./helpers').verifyNoBrowserErrors;
const scrollToEl = require('./helpers').scrollToEl;
const fixFFTest = require('./helpers').fixFFTest;
const eachNth = require('./helpers').eachNth;

const URL = 'index.html';

function waitForInit() {
  var EC = protractor.ExpectedConditions;
  var $apiInfo = $('api-info');
  var $errorMessage = $('.redoc-error')
  browser.wait(EC.or(EC.visibilityOf($apiInfo), EC.visibilityOf($errorMessage)), 60000);
}

function basicTests(swaggerUrl, title) {
  describe(`Basic suite for ${title}`, () => {
    let specUrl = URL;
    if (swaggerUrl) {
      specUrl += `?url=${encodeURIComponent(swaggerUrl)}`;
    }

    beforeEach((done) => {
      browser.get(specUrl);
      waitForInit();
      fixFFTest(done);
    });

    afterEach(() => {
      verifyNoBrowserErrors();
    });

    it('should init redoc without errors', (done) => {
      let $redoc = $('redoc');
      expect($redoc.isPresent()).toBe(true);
      setTimeout(() => {
        let $methods = $$('method');
        expect($methods.count()).toBeGreaterThan(0);
        done();
      });
    });
  });
}

basicTests(null, 'Extended Petstore');


describe('Scroll sync', () => {
  let specUrl = URL;

  beforeEach((done) => {
    browser.get(specUrl);
    waitForInit();
    fixFFTest(done);
  });

  it('should update active menu entries on page scroll forwards', () => {
    scrollToEl('[section="tag/store"]').then(() => {
      expect($('.menu-cat-header.active').getInnerHtml()).toContain('store');
      expect($('.selected-tag').getInnerHtml()).toContain('store');
    });
  });

  it('should update active menu entries on page scroll backwards', () => {
    scrollToEl('[operation-id="getPetById"]').then(() => {
      expect($('.menu-cat-header.active').getInnerHtml()).toContain('pet');
      expect($('.selected-tag').getInnerHtml()).toContain('pet');
      expect($('.menu-cat li.active').getInnerHtml()).toContain('Find pet by ID');
      expect($('.selected-endpoint').getInnerHtml()).toContain('Find pet by ID');
    });
  });
});

describe('Language tabs sync', () => {
  let specUrl = URL;

  beforeEach((done) => {
    browser.get(specUrl);
    waitForInit();
    fixFFTest(done);
  });

  it('should sync language tabs', () => {
    var $item = $$('[operation-id="addPet"] tabs > ul > li').last();
    // check if correct item
    expect($item.getText()).toContain('PHP');
    var EC = protractor.ExpectedConditions;
    browser.wait(EC.elementToBeClickable($item), 2000);
    $item.click().then(() => {
      expect($('[operation-id="updatePet"] li.active').getText()).toContain('PHP');
    });
  });
});

if (process.env.JOB === 'e2e-guru') {
  describe('APIs.guru specs test', ()=> {

    // global.apisGuruList was loaded in onPrepare method of protractor config
    let apisGuruList = global.apisGuruList;

    // Remove certain APIs that are known to cause problems
    delete apisGuruList['motaword.com']; // invalid (see https://github.com/BigstickCarpet/swagger-parser/issues/26)
    delete apisGuruList['learnifier.com']; // allof object and no type
    delete apisGuruList['googleapis.com:mirror']; // bad urls in images
    delete apisGuruList['googleapis.com:discovery']; // non-string references
    delete apisGuruList['clarify.io']; // non-string references
    //delete apisGuruList['pushpay.com']; // https://github.com/Rebilly/ReDoc/issues/30
    delete apisGuruList['bbci.co.uk']; // too big
    delete apisGuruList['bbc.com']; // too big

    // run quick version of e2e test on all builds except releases
    if (process.env.TRAVIS && !process.env.TRAVIS_TAG) {
      console.log('Running on short APIs guru list');
      apisGuruList = eachNth(apisGuruList, 10);
    } else {
      console.log('Running on full APIs guru list')
    }

    for (let apiName of Object.keys(apisGuruList)) {
      let apiInfo = apisGuruList[apiName].versions[apisGuruList[apiName].preferred];
      let url = apiInfo.swaggerUrl;

      // temporary hack due to this issue: https://github.com/substack/https-browserify/issues/6
      url = url.replace('https://', 'http://');
      url = url.replace('apis-guru.github.io/', 'apis-guru.github.io:80/');
      basicTests(url, `${apiName}:${apiInfo.info.version}\n${url}`);
    }
  });
}
