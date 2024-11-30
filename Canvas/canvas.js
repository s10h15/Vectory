export function clearCanvas(context, canvasElement)
{
	context.fillStyle = "black";
	context.fillRect(0, 0, canvasElement.width, canvasElement.height);
}