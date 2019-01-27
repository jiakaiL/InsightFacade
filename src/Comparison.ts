import Log from "./Util";
import KeyHelper from "./KeyHelper";
let dict: any = {
    dept: "Subject", id: "Course", avg: "Avg", fail: "Fail",
    instructor: "Professor", title: "Title", pass: "Pass",
    audit: "Audit", uuid: "id", year: "Year"};

export default class Comparison {
    public static SComparison(whereobj: any, dataset: any[], datasetKind: boolean): any[] {
        let filterfactor = KeyHelper.getKeys(whereobj)[0];
        let filterObj = whereobj[filterfactor];
        let searchKey: string;
        // Log.trace(key);
        let objKey = KeyHelper.getKeys(filterObj)[0];
        let datasetID = KeyHelper.getIDFromKey(objKey);
        let rightKey = objKey.slice(datasetID.length + 1);
        Log.trace(rightKey);
        let objValue = filterObj[objKey];
        if (datasetKind === true) {
            searchKey = dict[rightKey];
        } else {
            searchKey = rightKey;
        }
        Log.trace(searchKey);
        return this.filterDataset(searchKey, objValue, filterfactor, dataset);
    }

    public static filterDataset(filterKey: string, filterValue: any, filterfactor: string, dataset: any[]): any[] {
        if (filterfactor === "GT") {
            return this.filteringGT(dataset, filterKey, filterValue);
        } else if (filterfactor === "LT") {
            return this.filteringLT(dataset, filterKey, filterValue);
        } else if (filterfactor === "EQ") {
            return this.filteringEQ(dataset, filterKey, filterValue);
        } else if (filterfactor === "IS") {
            return this.filteringIS(dataset, filterKey, filterValue);
        }
    }

    public static filteringGT(dataset: any[], filterKey: string, filterValue: number): any[] {
        let result: any[] = [];
        for (let section of dataset) {
            if (section[filterKey] > filterValue) {
                result.push(section);
            }
        }
        return result;
    }

    public static filteringLT(dataset: any[], filterKey: string, filterValue: number): any[] {
        let result: any[] = [];
        for (let section of dataset) {
            if (section[filterKey] < filterValue) {
                result.push(section);
            }
        }
        return result;
    }
    public static filteringEQ(dataset: any[], filterKey: string, filterValue: number): any[] {
        let result: any[] = [];
        for (let section of dataset) {
            if (section[filterKey] === filterValue) {
                result.push(section);
            }
        }
        return result;
    }
    public static filteringIS(dataset: any[], filterKey: string, filterValue: string): any[] {
        let result: any[] = [];
        let valueLength: number = filterValue.length;
        for (let section of dataset) {
            if (section[filterKey] === filterValue) {
                result.push(section);
            } else if (filterValue === "*") {
                result.push(section);
            } else if (filterValue[0] === "*" && filterValue[valueLength - 1] !== "*") {
                let searchEndPart = filterValue.slice(-(valueLength - 1));
                let sectionEndPart = section[filterKey];
                if (sectionEndPart.endsWith(searchEndPart)) {
                    result.push(section);
                }
            } else if (filterValue[0] !== "*" && filterValue[valueLength - 1] === "*") {
                let searchStartPart = filterValue.slice(0, valueLength - 1);
                let sectionStartPart = section[filterKey];
                if (sectionStartPart.startsWith(searchStartPart)) {
                    result.push(section);
                }
            } else if (filterValue[0] === "*" && filterValue[valueLength - 1] === "*") {
                let searchPart = filterValue.slice(1, valueLength - 1);
                let sectionPart = section[filterKey];
                if (sectionPart.includes(searchPart)) {
                    result.push(section);
                }
            }
        }
        return result;
    }

}
