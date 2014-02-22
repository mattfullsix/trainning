/* global define */
define("three", function() {
    function three() {
		console.log('Three!');
    }
    return { run: three };
});