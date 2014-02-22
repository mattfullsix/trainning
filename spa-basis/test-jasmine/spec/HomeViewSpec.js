/* global describe, it, sinon, expect, beforeEach, afterEach */

describe("HomeView", function() {
  var homeView, clock, prompt;

  beforeEach(function() {
    prompt = sinon.stub(window, 'prompt').returns('Matt');
    clock = sinon.useFakeTimers(1392989471023);
    moment.lang('fr');
    window.io = {connect: function() {return {on: $.noop }; } };

    var HomeView = require('views/home_view');
    homeView = new HomeView();
    homeView.render();
  });

  afterEach(function() {
    clock.restore();
    prompt.restore();
  });

  it("should render the clock at startup", function() {
    expect(homeView.$('#ticker').text()).toEqual('vendredi 21 février 2014 14:31:11');
  });

  it("should update the clock every second", function() {
    clock.tick(1001);
    expect(homeView.$('#ticker').text()).toEqual('vendredi 21 février 2014 14:31:12');
    clock.tick(1000);
    expect(homeView.$('#ticker').text()).toEqual('vendredi 21 février 2014 14:31:13');
  });
});
