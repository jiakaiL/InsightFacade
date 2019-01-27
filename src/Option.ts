import KeyHelper from "./KeyHelper";
let dict: any = {
    dept: "Subject", id: "Course", avg: "Avg", fail: "Fail",
    instructor: "Professor", title: "Title", pass: "Pass",
    audit: "Audit", uuid: "id", year: "Year"};
export default class Option {
    public static columnizeNoTransform(sections: any[], valueofoption: any, datasetKind: boolean): any[] {
        if (datasetKind === true) {
            return this.OptionsCourseColumns(sections, valueofoption);
        } else {
            return this.OptionsRoomColumns(sections, valueofoption);
        }
    }
    public static OptionsCourseColumns(sections: any[], optionObj: any): any[] {
        let columns: string[] = optionObj["COLUMNS"];
        let results: any[] = [];
        for (let asection of sections) {
            let aresult: any = {};
            for (let acolumn of columns) {
                let datasetID = KeyHelper.getIDFromKey(acolumn);
                let rightkey = acolumn.slice(datasetID.length + 1);
                let searchKey = dict[rightkey];
                let response = asection[searchKey];
                aresult[acolumn] = response;
            }
            results.push(aresult);
        }
        return results;
    }

    public static OptionsRoomColumns(sections: any[], optionObj: any): any[] {
        let columns: string[] = optionObj["COLUMNS"];
        let results: any[] = [];
        for (let asection of sections) {
            let aresult: any = {};
            for (let acolumn of columns) {
                let datasetID = KeyHelper.getIDFromKey(acolumn);
                let rightkey = acolumn.slice(datasetID.length + 1);
                let searchKey = rightkey;
                let response = asection[searchKey];
                aresult[acolumn] = response;
            }
            results.push(aresult);
        }
        return results;
    }

    public static transformationColumns (valueOfTrans: any , valueOfColumns: any[],
                                         groupArr: any[], applyObj: any, datasetID: string): any[] {
        let results: any[] = [];
        for (let index in groupArr) {
            let aresult: any = {};
            for (let acolumn of valueOfColumns) {
                if (valueOfTrans.GROUP.includes(acolumn)) {
                    let rightKey = acolumn.slice(datasetID.length + 1);
                    let searchKey = dict[rightKey];
                    aresult[acolumn] = groupArr[index][0][searchKey];
                } else {
                    aresult[acolumn] = applyObj[acolumn][index];
                }
            }
            results.push(aresult);
        }
        return results;
    }
    public static transformationRoomsColumns (valueOfTrans: any , valueOfColumns: any[],
                                              groupArr: any[], applyObj: any, datasetID: string): any[] {
        let results: any[] = [];
        for (let index in groupArr) {
            let aresult: any = {};
            for (let acolumn of valueOfColumns) {
                if (valueOfTrans.GROUP.includes(acolumn)) {
                    let searchKey = acolumn.slice(datasetID.length + 1);
                    aresult[acolumn] = groupArr[index][0][searchKey];
                } else {
                    aresult[acolumn] = applyObj[acolumn][index];
                }
            }
            results.push(aresult);
        }
        return results;
    }
    public static ordering (valueofOrder: any, sections: any[]): any[] {
        if (typeof valueofOrder === "string") {
            return this.orderingNoTrans(valueofOrder, sections);
        } else {
            return this.orderingWithTrans(valueofOrder, sections);
        }
    }

    public static orderingNoTrans (order: string, sections: any[]): any[] {
        return sections.sort(function (a, b) {
                if (a[order] > b[order]) {
                    return 1;
                } else if (a[order] < b[order]) {
                    return -1;
                } else {
                    return 0;
                }
        });
    }
    public static orderingWithTrans(order: any, sections: any[]): any[] {
        let direction = order.dir;
        let orderingKeys = order.keys;
        if (direction === "UP") {
            return sections.sort(function (a, b) {
                for (let key of orderingKeys) {
                    if (a[key] > b[key]) {
                        return 1;
                    } else if (a[key] < b[key]) {
                        return -1;
                    } else {
                        continue;
                    }
                }
            });
        }
        if (direction === "DOWN") {
            return sections.sort(function (a, b) {
                for (let key of orderingKeys) {
                    if (a[key] < b[key]) {
                        return 1;
                    } else if (a[key] > b[key]) {
                        return -1;
                    } else {
                        continue;
                    }
                }
            });
        }
    }
}
