const canvas = document.getElementById("canvasElement");
canvas.width = 500;
canvas.height = (9 / 16) * canvas.width;

function disableScroll() {
	document.body.style.overflow = "hidden";
	document.body.style.height = "100%";
	document.body.style.paddingRight = "17px"; //for webkit browsers

	window.onscroll = function() {
		window.scrollTo(0, 0);
	};
}

function enableScroll() {
	document.body.style.overflow = "auto";
	document.body.style.height = "auto";
	document.body.style.paddingRight = "0";

	window.onscroll = function() {};
}