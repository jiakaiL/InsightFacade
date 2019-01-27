import Log from "./Util";
import Comparison from "./Comparison";
import KeyHelper from "./KeyHelper";
export default class Logic {
    public static LogicOR(whereobj: any, dataset: any[], datasetKind: boolean): any[] {
        Log.trace("Doing OR array");
        let filterObj: any[] = whereobj ["OR"];
        let ORresult: any [] = [];
        for (let member of filterObj) {
            let key = KeyHelper.getKeys(member)[0];
            if (key !== "AND" && key !== "OR" && key !== "NOT") {
                let temp = Comparison.SComparison(member, dataset, datasetKind);
                ORresult = this.findDiff(temp, ORresult);
            } else if (key === "OR") {
                let temp = this.LogicOR(member, dataset, datasetKind);
                ORresult = this.findDiff(temp, ORresult);
            } else if (key === "AND") {
                let temp = this.LogicAND(member, dataset, datasetKind);
                ORresult = this.findDiff(temp, ORresult);
            } else if (key === "NOT") {
                let temp = this.LogicNot(member, dataset, datasetKind);
                ORresult = this.findDiff(temp, ORresult);
            }
        }
        return ORresult;
    }

    public static LogicAND(whereobj: any, dataset: any[], datasetKind: boolean): any[] {
        let filterObj: any[] = whereobj ["AND"];
        let ANDresult: any [] = dataset;
        for (let member of filterObj) {
            let key = KeyHelper.getKeys(member)[0];
            if (key !== "AND" && key !== "OR" && key !== "NOT") {
                let temp = Comparison.SComparison(member, ANDresult, datasetKind);
                ANDresult = this.findCommon(ANDresult, temp);
            } else if (key === "OR") {
                let temp = this.LogicOR(member, ANDresult, datasetKind);
                ANDresult = this.findCommon(ANDresult, temp);
            } else if (key === "AND") {
                let temp = this.LogicAND(member, ANDresult, datasetKind);
                ANDresult = this.findCommon(ANDresult, temp);
            } else if (key === "NOT") {
                let temp = this.LogicNot(member, ANDresult, datasetKind);
                ANDresult = this.findCommon(ANDresult, temp);
            }
        }
        return ANDresult;
    }

    public static LogicNot(whereobj: any, dataset: any[], datasetKind: boolean): any[] {
        let filterObj: any = whereobj["NOT"];
        let NOTresult: any [] = [];
        let key = KeyHelper.getKeys(filterObj)[0];
        if (key !== "AND" && key !== "OR" && key !== "NOT") {
            let sections = Comparison.SComparison(filterObj, dataset, datasetKind);
            NOTresult = dataset.filter((item) => sections.indexOf(item) < 0);
            return NOTresult;
        } else if (key === "OR") {
            let sections = this.LogicOR(filterObj, dataset, datasetKind);
            NOTresult = dataset.filter((item) => sections.indexOf(item) < 0);
            return NOTresult;
        } else if (key === "AND") {
            let sections = this.LogicAND(filterObj, dataset, datasetKind);
            NOTresult = dataset.filter((item) => sections.indexOf(item) < 0);
            return NOTresult;
        } else if (key === "NOT") {
            let sections = this.LogicNot(filterObj, dataset, datasetKind);
            NOTresult = dataset.filter((item) => sections.indexOf(item) < 0);
            return NOTresult;
        }
    }

    public static findDiff(temp: any[], result: any[]): any[] {
        for (let i of temp) {
            if (!result.includes(i)) {
                result.push(i);
            }
        }
        return result;
    }

    public static findCommon(temp: any[], result: any[]): any[] {
        let commonObjs: any[] = [];
        for (let i of temp) {
            if (result.includes(i)) {
                commonObjs.push(i);
            }
        }
        return commonObjs;
    }
}
