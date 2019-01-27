import Log from "./Util";
let dict: any = {
    dept: "Subject", id: "Course", avg: "Avg", fail: "Fail",
    instructor: "Professor", title: "Title", pass: "Pass",
    audit: "Audit", uuid: "id", year: "Year"};
export default class Group {
    // reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
    // public static groupByOne(objectArray: any[], property: any) {
    //     let a = objectArray.reduce(function (acc, obj) {
    //         let key = obj[property];
    //         if (!acc[key]) {
    //             acc[key] = [];
    //         }
    //         acc[key].push(obj);
    //         // Log.trace(JSON.stringify(acc));
    //         return acc;
    //     }, {});
    //     return (Object.values(a));
    // }
    // reference :
    // stackoverflow.com/questions/46794232/group-objects-by-multiple-properties-in-array-then-sum-up-their-values
    public static groupCourseByMulti(objectArray: any[], groupArr: any[], datasetID: string): any {
        let a = objectArray.reduce(function (acc, obj) {
            let key: string = "";
            for (let element of groupArr) {
                let rightKey = element.slice(datasetID.length + 1);
                let searchKey = dict[rightKey];
                key += obj[searchKey];
            }
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj);
            return acc;
        }, {});
        return (Object.values(a));
    }

    public static groupRoomsByMulti(objectArray: any[], groupArr: any[], datasetID: string): any {
        let a = objectArray.reduce(function (acc, obj) {
            let key: string = "";
            for (let element of groupArr) {
                let rightKey = element.slice(datasetID.length + 1);
                key += obj[rightKey];
            }
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj);
            return acc;
        }, {});
        return (Object.values(a));
    }
}
