let chai = require("chai")
let expect = chai.expect
let mocha = require("mocha")
let describe = mocha.describe
const { JSDOM } = require("jsdom");

describe("Cookies function tests", () => {
  beforeEach(async() => {
    const dom = new JSDOM("");
    global.document = dom.window.document;
    global.window = {};
    require("../cookies");
  });

  afterEach(() => {

  })

  it("can check user has given consent for analytics", () => {
    // Arrange
    const cookies = window.DI.Cookies("trackingId", "analyticsCookieDomain");

    // Act
    let result = cookies.hasConsentForAnalytics();

    // Assert
    expect(result).to.equal(false);
  });
});