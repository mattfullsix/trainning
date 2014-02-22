// throttle - un genre de threshold sur un nombre de call

// missing code
Function.prototype.throttle = function(/* … */) {
  var f = this;
  // …
 
  return function() {
    // …
    return f.apply(this, arguments);
  };
};
 
// Protocole de test
 
function sayHi() { console.log(Date.now(), "Hiiiii…"); }
 
console.log(Date.now());
hiCoquine = setInterval(sayHi.throttle(1000), 100);
 
setTimeout(function() { clearInterval(hiCoquine); }, 10000);



// correct
Function.prototype.throttle = function(minInterval) {
  var f = this;
  var lastCall = 0;

  return function() {
  	if (Date.now() - lastCall < minInterval) {return;}
  	lastCall = Date.now();
    return f.apply(this, arguments);
  };
};
 
// Protocole de test
 
function sayHi() { console.log(Date.now(), "Hiiiii…"); }
 
console.log(Date.now());
hiCoquine = setInterval(sayHi.throttle(1000), 100);
 
setTimeout(function() { clearInterval(hiCoquine); }, 10000);