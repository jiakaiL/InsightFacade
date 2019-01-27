export default class KeyHelper {
    public static getKeys(obj: any): string[] {
        return Object.keys(obj);
    }

    public static getIDFromKey(key: string): string {
        let id: string = "";
        for (let s of key) {
            if (s === "_") {
                break;
            } else {
                id += s;
            }
        }
        // Log.trace(id);
        return id;
    }

    public static isEmpty(obj: any) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
}
