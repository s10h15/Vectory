export const version = "16.7.24";
const title = "Vectory";

document.title = title + " " + version;

export function getVersion() {
	return document.title;
}