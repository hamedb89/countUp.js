var global = Function("return this;")();
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// pakmanager:countUp
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  /*
    
        countUp.js
        by @inorganik
    
    */
    
    // target = id of html element or var of previously selected html element where counting occurs
    // startVal = the value you want to begin at
    // endVal = the value you want to arrive at
    // decimals = number of decimal places, default 0
    // duration = duration of animation in seconds, default 2
    // options = optional object of options (see below)
    
    function countUp(target, startVal, endVal, decimals, duration, options) {
    
        // make sure requestAnimationFrame and cancelAnimationFrame are defined
        // polyfill for browsers without native support
        // by Opera engineer Erik Möller
        var lastTime = 0;
        var vendors = ['webkit', 'moz', 'ms', 'o'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame =
              window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            }
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            }
        }
    
         // default options
        this.options = options || {
            useEasing : true, // toggle easing
            useGrouping : true, // 1,000,000 vs 1000000
            separator : ',', // character to use as a separator
            decimal : '.', // character to use as a decimal
        }
        if (this.options.separator == '') this.options.useGrouping = false;
        if (this.options.prefix == null) this.options.prefix = '';
        if (this.options.suffix == null) this.options.suffix = '';
    
        var self = this;
    
        this.d = (typeof target === 'string') ? document.getElementById(target) : target;
        this.startVal = Number(startVal);
        this.endVal = Number(endVal);
        this.countDown = (this.startVal > this.endVal) ? true : false;
        this.startTime = null;
        this.timestamp = null;
        this.remaining = null;
        this.frameVal = this.startVal;
        this.rAF = null;
        this.decimals = Math.max(0, decimals || 0);
        this.dec = Math.pow(10, this.decimals);
        this.duration = duration * 1000 || 2000;
    
        this.version = function () { return '1.3.2' }
    
        // Print value to target
        this.printValue = function(value) {
            var result = (!isNaN(value)) ? self.formatNumber(value) : '--';
            if (self.d.tagName == 'INPUT') {
                this.d.value = result;
            }
            else if (self.d.tagName == 'text') {
                this.d.textContent = result;
            }
            else {
                this.d.innerHTML = result;
            }
        }
    
        // Robert Penner's easeOutExpo
        this.easeOutExpo = function(t, b, c, d) {
            return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
        }
        this.count = function(timestamp) {
    
            if (self.startTime === null) self.startTime = timestamp;
    
            self.timestamp = timestamp;
    
            var progress = timestamp - self.startTime;
            self.remaining = self.duration - progress;
    
            // to ease or not to ease
            if (self.options.useEasing) {
                if (self.countDown) {
                    var i = self.easeOutExpo(progress, 0, self.startVal - self.endVal, self.duration);
                    self.frameVal = self.startVal - i;
                } else {
                    self.frameVal = self.easeOutExpo(progress, self.startVal, self.endVal - self.startVal, self.duration);
                }
            } else {
                if (self.countDown) {
                    var i = (self.startVal - self.endVal) * (progress / self.duration);
                    self.frameVal = self.startVal - i;
                } else {
                    self.frameVal = self.startVal + (self.endVal - self.startVal) * (progress / self.duration);
                }
            }
    
            // don't go past endVal since progress can exceed duration in the last frame
            if (self.countDown) {
                self.frameVal = (self.frameVal < self.endVal) ? self.endVal : self.frameVal;
            } else {
                self.frameVal = (self.frameVal > self.endVal) ? self.endVal : self.frameVal;
            }
    
            // decimal
            self.frameVal = Math.round(self.frameVal*self.dec)/self.dec;
    
            // format and print value
            self.printValue(self.frameVal);
    
            // whether to continue
            if (progress < self.duration) {
                self.rAF = requestAnimationFrame(self.count);
            } else {
                if (self.callback != null) self.callback();
            }
        }
        this.start = function(callback) {
            self.callback = callback;
            // make sure values are valid
            if (!isNaN(self.endVal) && !isNaN(self.startVal)) {
                self.rAF = requestAnimationFrame(self.count);
            } else {
                console.log('countUp error: startVal or endVal is not a number');
                self.printValue();
            }
            return false;
        }
        this.stop = function() {
            cancelAnimationFrame(self.rAF);
        }
        this.reset = function() {
            self.startTime = null;
            self.startVal = startVal;
            cancelAnimationFrame(self.rAF);
            self.printValue(self.startVal);
        }
        this.resume = function() {
            self.stop();
            self.startTime = null;
            self.duration = self.remaining;
            self.startVal = self.frameVal;
            requestAnimationFrame(self.count);
        }
        this.formatNumber = function(nStr) {
            nStr = nStr.toFixed(self.decimals);
            nStr += '';
            var x, x1, x2, rgx;
            x = nStr.split('.');
            x1 = x[0];
            x2 = x.length > 1 ? self.options.decimal + x[1] : '';
            rgx = /(\d+)(\d{3})/;
            if (self.options.useGrouping) {
                while (rgx.test(x1)) {
                    x1 = x1.replace(rgx, '$1' + self.options.separator + '$2');
                }
            }
            return self.options.prefix + x1 + x2 + self.options.suffix;
        }
    
        // format startVal on initialization
        self.printValue(self.startVal);
    }
    
    exports.countUp = countUp;
    
    // Example:
    // var numAnim = new countUp("SomeElementYouWantToAnimate", 0, 99.99, 2, 2.5);
    // numAnim.start();
    // with optional callback:
    // numAnim.start(someMethodToCallOnComplete);
    
  provide("countUp", module.exports);
}(global));