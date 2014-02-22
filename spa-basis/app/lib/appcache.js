if (!window.applicationCache)
	return;

window.applicationCache.addEventListener('updateready', function (){
	$('#reloadPrompt').modal({ show: true });
});
