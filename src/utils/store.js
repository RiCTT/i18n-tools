export default {
	saveObject(key, object) {
		window.localStorage[`${key}`] = JSON.stringify(object);
	},
	loadObject(key) {
		let objectString = window.localStorage[`${key}`];
		return objectString == null ? null : JSON.parse(objectString);
	},
	deleteObject(key) {
		window.localStorage[`${key}`] = null;
	},
	clear() {
		window.localStorage.clear();
	}
}
