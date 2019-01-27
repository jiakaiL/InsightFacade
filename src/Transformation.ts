import Apply from "./Apply";
import Log from "./Util";

let dict: any = {
    dept: "Subject", id: "Course", avg: "Avg", fail: "Fail",
    instructor: "Professor", title: "Title", pass: "Pass",
    audit: "Audit", uuid: "id", year: "Year"};
export default class Transformation {
    public static processApply(valueOfApply: any, groupArr: any[], datasetID: string): any {
        let applyObj: any = {};
        for (let applyRule of valueOfApply) {
            let applykey = Object.keys(applyRule)[0];
            let applytoken = Object.keys(Object.values(applyRule)[0])[0];
            let tokenKey = Object.values(Object.values(applyRule)[0])[0].slice(datasetID.length + 1);
            let searchKey = dict[tokenKey];
            let resultArr: number[] = [];
            for (let oneGroup of groupArr) {
                let valueArr: any[] = [];
                for (let section of oneGroup) {
                    valueArr.push(section[searchKey]);
                }
                if (applytoken === "AVG") {
                    resultArr.push(Apply.applyIsAVG(valueArr));
                }
                if (applytoken === "MAX") {
                    resultArr.push(Apply.applyIsMAX(valueArr));
                }
                if (applytoken === "MIN") {
                    resultArr.push(Apply.applyIsMIN(valueArr));
                }
                if (applytoken === "SUM") {
                    resultArr.push(Apply.applyIsSUM(valueArr));
                }
                if (applytoken === "COUNT") {
                    resultArr.push(Apply.applyIsCOUNT(valueArr));
                }
            }
            applyObj[applykey] = resultArr;
        }
        return applyObj;
    }
    public static processRoomsApply(valueOfApply: any, groupArr: any[], datasetID: string): any {
        let applyObj: any = {};
        for (let applyRule of valueOfApply) {
            let applykey = Object.keys(applyRule)[0];
            Log.trace(applykey);
            let applytoken = Object.keys(Object.values(applyRule)[0])[0];
            let searchKey = Object.values(Object.values(applyRule)[0])[0].slice(datasetID.length + 1);
            let resultArr: number[] = [];
            for (let oneGroup of groupArr) {
                let valueArr: any[] = [];
                for (let section of oneGroup) {
                    valueArr.push(section[searchKey]);
                }
                if (applytoken === "AVG") {
                    resultArr.push(Apply.applyIsAVG(valueArr));
                }
                if (applytoken === "MAX") {
                    resultArr.push(Apply.applyIsMAX(valueArr));
                }
                if (applytoken === "MIN") {
                    resultArr.push(Apply.applyIsMIN(valueArr));
                }
                if (applytoken === "SUM") {
                    resultArr.push(Apply.applyIsSUM(valueArr));
                }
                if (applytoken === "COUNT") {
                    resultArr.push(Apply.applyIsCOUNT(valueArr));
                }
            }
            applyObj[applykey] = resultArr;
        }
        return applyObj;
    }
}
