import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import * as parse5 from "parse5";
import Comparison from "../Comparison";
import Logic from "../Logic";
import Option from "../Option";
import ProcessRoom from "../ProcessRoom";
import ProcessSection from "../ProcessSection";
import Apply from "../Apply";
import KeyHelper from "../KeyHelper";
import Group from "../Group";
import QueryCheck from "../QueryCheck";
import Transformation from "../Transformation";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
let dict: any = {
    dept: "Subject", id: "Course", avg: "Avg", fail: "Fail",
    instructor: "Professor", title: "Title", pass: "Pass",
    audit: "Audit", uuid: "id", year: "Year"};
export default class InsightFacade implements IInsightFacade {
    public datasets: InsightDataset[] = [];
    public savedData: string[] = [];
    public memory: string[] = [];
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise((resolve, reject) => {
            // Check if id is valid
            if (id === null || id === undefined) {
                return reject(new InsightError());
            }
            // check if id is added before
            for (let i of this.memory) {
                if (i === id) {
                    return reject(new InsightError());
                }
            }
            // ============================
            // d2 Room
            // ============================
            if (kind === InsightDatasetKind.Rooms) {
                let zip = new JSZip();
                zip.loadAsync(content, {base64: true}).then((zipContent: any) => {
                    let listFiles: any[] = [];
                    let allRooms: any[] = [];
                    zipContent.file("index.htm").async("string").then((indexContent: any) => {
                        let document: any = parse5.parse(indexContent);
                        let addtbodyNode = ProcessRoom.getNodeInfo(document, "tbody");
                        if (addtbodyNode === false) {
                            return reject (new InsightError());
                        }
                        let buildingArray = ProcessRoom.findIndexArray(addtbodyNode);
                        let addressArray = ProcessRoom.findBuildingAddress(addtbodyNode);
                        let addressObj: any = {};
                        for (let i in buildingArray) {
                            addressObj[buildingArray[i]] = addressArray[i];
                        }
                        let folderpath = "campus/discover/buildings-and-classrooms";
                        let shortNames: string[] = [];
                        zipContent.folder(folderpath)
                            .forEach(function (relativePath: string) {
                                if (buildingArray.includes(relativePath)) {
                                    shortNames.push(relativePath);
                                    let file = zipContent.file(folderpath + "/" + relativePath).async("string");
                                    listFiles.push(file);
                                }
                            });
                        Promise.all(listFiles).then((buildings: any[]) => {
                            for (let index in buildings) {
                                    let buildingObj: any = parse5.parse(buildings[index]);
                                    let fullname: string = ProcessRoom.findFullname(buildingObj);
                                    let findNode = ProcessRoom.getNodeInfo(buildingObj, "tbody");
                                    if (findNode !== false) {
                                        let arr = ProcessRoom.findRoomInfo(findNode,
                                                shortNames[index], addressObj[shortNames[index]], fullname);
                                        if (arr.length > 0) {
                                            for (let a of arr) {
                                                allRooms.push(a);
                                            }
                                        }
                                    }
                            }
                            let listURLAddr: any[] = [];
                            for (let room of allRooms) {
                                let addr = ProcessRoom.urlAddress(room.address);
                                listURLAddr.push(ProcessRoom.getLatLon(ProcessRoom.urlAddress(addr)));
                            }
                            Log.trace("123");
                            Promise.all(listURLAddr).then((geoResps: any) => {
                                Log.trace("456");
                                for (let index in allRooms) {
                                    allRooms[index].lat = geoResps[index].lat;
                                    allRooms[index].lon = geoResps[index].lon;
                                }
                                Log.trace(allRooms.length.toString());
                                if (allRooms.length > 0) {
                                    this.memory.push(id);
                                    let aDataset1 = {
                                        id,
                                        kind,
                                        numRows: allRooms.length,
                                    };
                                    this.datasets.push(aDataset1);
                                    let diskData: any[] = [];
                                    for (let i in allRooms) {
                                        diskData.push(allRooms[i]);
                                    }
                                    let dir = "./data";
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir);
                                    }
                                    let dataToUpdate: any = {};
                                    dataToUpdate.result = diskData;
                                    let diskFilePath = "data/" + id;
                                    try {
                                        fs.writeFileSync(diskFilePath, JSON.stringify(dataToUpdate));
                                    } catch (e) {
                                        return reject(new InsightError(e));
                                    }
                                    return resolve(this.memory);

                                } else {
                                    //
                                    return reject(new InsightError());
                                }
                            }).catch((Error) => {
                                return reject(new InsightError(Error));
                            });
                        }).catch((Error) => {
                           return reject(new InsightError(Error));
                        });
                    });
                });
            }

            // ============================
            // d1: course Dataset
            // ============================
            if (kind === InsightDatasetKind.Courses) {
                let zip = new JSZip();
                // unzip a dataset
                zip.loadAsync(content, {base64: true})
                    .then((zipContent: any) => {
                        let validSections: string[] = [];
                        let listFiles: any[] = [];
                        // check folder is named "courses"
                        if (notjsonsUnderCourses(zipContent)) {
                            return reject(new InsightError());
                        }
                        // push all Promises of file.async to listFiles
                        zipContent.folder("courses").forEach(function (relativePath: string) {
                            // get into courses folder and check format of every JSON file inside
                            let file = zip.file("courses/" + relativePath).async("text");
                            listFiles.push(file);
                        });
                        // Main part dealing with everything
                        Promise.all(listFiles).then((files: any[]) => {
                            for (let a of files) {
                                let jsonObject = JSON.parse(a);
                                let sections: object[] = jsonObject.result;
                                let validSectionArray: any[] = ProcessSection.getvalidateSection(sections);
                                let arrayLength = validSectionArray.length;
                                if (arrayLength === 0) {
                                    continue;
                                } else {
                                    for (let i of validSectionArray) {
                                        validSections.push(i);
                                    }
                                }
                            }
                            if (validSections.length > 0) {
                                this.memory.push(id);
                                let aDataset1 = {
                                    id,
                                    kind,
                                    numRows: validSections.length,
                                };
                                this.datasets.push(aDataset1);
                                let diskData: any[] = [];
                                for (let i in validSections) {
                                    diskData.push(validSections[i]);
                                }
                                let dir = "./data";
                                if (!fs.existsSync(dir)) {
                                    fs.mkdirSync(dir);
                                }
                                let dataToUpdate: any = {};
                                dataToUpdate.result = diskData;
                                let diskFilePath = "data/" + id;
                                try {
                                    fs.writeFileSync(diskFilePath, JSON.stringify(dataToUpdate));
                                } catch (e) {
                                    return reject(new InsightError(e));
                                }
                                return resolve(this.memory);
                            } else {
                                //
                                return reject(new InsightError());
                            }
                        }).catch((err1) => {
                            // // Log.trace(err1);
                            return reject(new InsightError());
                        });
                    }).catch((err2) => {
                    // // Log.trace(err2);
                    return reject(new InsightError());
                });
            }
        });
        function notjsonsUnderCourses(f: any): boolean {
            let resultValue = Object.values(f);
            let path = Object.keys(resultValue[0]);
            return path[0] !== "courses/";
        }
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let result: string = "";
            if (id === null || id === undefined) {
                return reject(new InsightError());
            }
            for ( let i = 0; i < this.memory.length; i++) {
                if (this.memory[i] === id) {
                    result = this.memory[i];
                    this.memory.splice(i, 1);
                    this.datasets.splice(i, 1);
                    this.savedData.splice(i, 1);
                    let filepath: string = "data/" + id;
                    fs.unlink(filepath, (err) => {
                        if (err) {
                            return reject(new InsightError());
                        }
                    });
                    return resolve(result);
                }
            }
            return reject(new NotFoundError());
        });
    }

    public performQuery(query: any): Promise <any[]> {
        return new Promise(async (resolve, reject) => {
            isVaildQ(query)
                .then((id: any) => {
                    Log.trace("123");
                    let valueofwhere = query.WHERE;     // graps the value of WHERE.
                    let valueofoption = query.OPTIONS;  // graps the value of OPTIONS
                    let valueofColumns = valueofoption["COLUMNS"]; // graps the value of COLUMNS.
                    let valueofOrder = valueofoption["ORDER"]; // graps the value of ORDERS.
                    let datasetID = "";
                    if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                        datasetID += getIDFromKey(valueofColumns[0]);
                    } else {
                        datasetID += getIDFromKey(query.TRANSFORMATIONS.GROUP[0]);
                    }
                    let datasetKind: boolean;   // if courses, true; if rooms, false
                    Log.trace("datasetID is " + datasetID);
                    if (checkDatasetKind(datasetID, this.datasets)) {
                        datasetKind = true;
                    } else {
                        datasetKind = false;
                    }
                    let firstSyntax = KeyHelper.getKeys(valueofwhere)[0];

                    let data = fs.readFileSync("data/" + datasetID, {encoding: "utf8"});
                    let dataset: any[] = JSON.parse(data).result;
                    if (isEmpty(valueofwhere)) {
                        if (ResultTooBig(dataset)) {
                            return reject(new InsightError());
                        }
                        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                            let getColumns = Option.columnizeNoTransform(dataset, valueofoption, datasetKind);
                            if (Object.keys(valueofoption).length === 1) {
                                return resolve(getColumns);
                            }
                            let orderColunms = Option.ordering(valueofOrder, getColumns);
                            return resolve(orderColunms);
                        } else {
                            let valueOfTrans = query.TRANSFORMATIONS;
                            let valueOfApply = valueOfTrans.APPLY;
                            if (datasetKind) {
                                let groupArr = Group.groupCourseByMulti(dataset, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            } else {
                                let groupArr = Group.groupRoomsByMulti(dataset, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processRoomsApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationRoomsColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            }
                        }
                    } else if (firstSyntax !== "AND" && firstSyntax !== "OR" && firstSyntax !== "NOT") {
                        let sections = Comparison.SComparison(valueofwhere, dataset, datasetKind);
                        if (ResultTooBig(sections)) {
                            return reject(new InsightError());
                        }
                        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                            let getColumns = Option.columnizeNoTransform(sections, valueofoption, datasetKind);
                            if (Object.keys(valueofoption).length === 1) {
                                return resolve(getColumns);
                            }
                            let orderColunms = Option.ordering(valueofOrder, getColumns);
                            return resolve(orderColunms);
                        } else {
                            let valueOfTrans = query.TRANSFORMATIONS;
                            let valueOfApply = valueOfTrans.APPLY;
                            if (datasetKind) {
                                let groupArr = Group.groupCourseByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            } else {
                                let groupArr = Group.groupRoomsByMulti(sections, valueOfTrans.GROUP, datasetID);
                                Log.trace(JSON.stringify(groupArr));
                                let applyObj = Transformation.processRoomsApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationRoomsColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            }
                        }
                    } else if (firstSyntax === "OR") {
                        let sections = Logic.LogicOR(valueofwhere, dataset, datasetKind);
                        if (ResultTooBig(sections)) {
                            return reject(new InsightError());
                        }
                        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                            let getColumns = Option.columnizeNoTransform(sections, valueofoption, datasetKind);
                            if (Object.keys(valueofoption).length === 1) {
                                return resolve(getColumns);
                            }
                            let orderColunms = Option.ordering(valueofOrder, getColumns);
                            return resolve(orderColunms);
                        } else {
                            let valueOfTrans = query.TRANSFORMATIONS;
                            let valueOfApply = valueOfTrans.APPLY;
                            if (datasetKind) {
                                let groupArr = Group.groupCourseByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            } else {
                                let groupArr = Group.groupRoomsByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processRoomsApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationRoomsColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            }
                        }

                    } else if (firstSyntax === "AND") {
                        let sections = Logic.LogicAND(valueofwhere, dataset, datasetKind);
                        if (ResultTooBig(sections)) {
                            return reject(new InsightError());
                        }
                        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                            let getColumns = Option.columnizeNoTransform(sections, valueofoption, datasetKind);
                            if (Object.keys(valueofoption).length === 1) {
                                return resolve(getColumns);
                            }
                            let orderColunms = Option.ordering(valueofOrder, getColumns);
                            return resolve(orderColunms);
                        } else {
                            let valueOfTrans = query.TRANSFORMATIONS;
                            let valueOfApply = valueOfTrans.APPLY;
                            if (datasetKind) {
                                let groupArr = Group.groupCourseByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            } else {
                                let groupArr = Group.groupRoomsByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processRoomsApply(valueOfApply, groupArr, datasetID);
                                Log.trace(JSON.stringify(applyObj));
                                let results = Option.transformationRoomsColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            }
                        }
                    } else if (firstSyntax === "NOT") {
                        let sections = Logic.LogicNot(valueofwhere, dataset, datasetKind);
                        if (ResultTooBig(sections)) {
                            return reject(new InsightError());
                        }
                        if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                            let getColumns = Option.columnizeNoTransform(sections, valueofoption, datasetKind);
                            if (Object.keys(valueofoption).length === 1) {
                                return resolve(getColumns);
                            }
                            let orderColunms = Option.ordering(valueofOrder, getColumns);
                            return resolve(orderColunms);
                        } else {
                            let valueOfTrans = query.TRANSFORMATIONS;
                            let valueOfApply = valueOfTrans.APPLY;
                            if (datasetKind) {
                                let groupArr = Group.groupCourseByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            } else {
                                let groupArr = Group.groupRoomsByMulti(sections, valueOfTrans.GROUP, datasetID);
                                let applyObj = Transformation.processRoomsApply(valueOfApply, groupArr, datasetID);
                                let results = Option.transformationRoomsColumns(valueOfTrans, valueofColumns,
                                    groupArr, applyObj, datasetID);
                                if (Object.keys(valueofoption).length === 1) {
                                    return resolve(results);
                                }
                                let orderResults = Option.ordering(valueofOrder, results);
                                return resolve(orderResults);
                            }
                        }
                    }
                })

        .catch((err: any) => {
                    return reject(new InsightError());
                });

        });
        // ===========================================================================================
        // Helper functions for vaildation query(syntax check):
        // ================
        // Query part: simple description for query - QUERY(WHERE, OPTIONS, (TRANSFORMATION(added for D2))?)
        // ================
        function isVaildQ(q: any) {
            return new Promise((resolve, reject) => {
                let id = "";
                // =========================
                // find ID from query (no matter where Id is in Where part or Column part)
                let stringQ = JSON.stringify(q);
                Log.trace("stringQ : " + stringQ);
                let grapId = stringQ.match(/[a-z]+_[a-z]+/);
                Log.trace("grapId : " + grapId);
                id = getIDFromKey(grapId.toString()); // Grape ID from WHERE
                // =========================
                Log.trace("id in Query: " + id);
                if (typeof q !== "object" || Array.isArray(q) || q === null) {
                    Log.trace("Unexpected response status 400: Query must be object");
                    return reject(new InsightError());
                }
                let quer = q;
                let isExistWhere = quer.WHERE;
                let isExistOPT = quer.OPTIONS;
                let isExistTran = quer.TRANSFORMATIONS;

                if (isExistWhere === undefined && isExistOPT === undefined) {
                    Log.trace("Unexpected response status 400: Missing WHERE");
                    return reject(new InsightError());
                }
                if (isExistWhere !== undefined && isExistOPT === undefined) {
                    Log.trace("Unexpected response status 400: Missing OPTIONS");
                    return reject(new InsightError());
                }
                if (isExistWhere === undefined && isExistOPT !== undefined) {
                    Log.trace("Unexpected response status 400: Missing WHERE");
                    return reject(new InsightError());
                }
                if (Object.keys(isExistWhere).length > 1) {
                    Log.trace("Unexpected response status 400: " +
                        "WHERE should only have 1 key, has " + Object.keys(isExistWhere).length);
                    return reject(new InsightError());
                }
                if (typeof isExistWhere !== "object" || Array.isArray(isExistWhere) || isExistWhere === null) {
                    Log.trace("Unexpected response status 400: WHERE must be object");
                    return reject(new InsightError());
                }
                // ================================================================== done
                // Where Part is done!!!!
                // working on Option part
                if (isExistWhere !== undefined &&
                    isExistOPT !== undefined &&
                    isExistTran === undefined) {
                    Log.trace("WHERE, OPTIONS exist");
                    // Query Only has WHERE and OPTIONS
                    wherePart(isExistWhere, id)
                        .then((i) => {
                            Log.trace("id in after WP: " + i);
                            return optionPart(isExistOPT, i);
                        })
                        .then((i) => {
                            return resolve(i); // return id
                        })
                        .catch((err: any) => {
                            Log.trace("Some error occurs in where and option part");
                            return reject(new InsightError());
                        });
                } else {
                    Log.trace("WHERE, OPTIONS, TRANSFORMATION exist");
                    // Query Only has WHERE, OPTIONS, and TRANSFORMATIONS
                    wherePart(isExistWhere, id)
                        .then((i) => {
                            // Log.trace("id in after WP: " + id);
                            return optionPart(isExistOPT, i);
                        })
                        .then((i) => {
                            // Log.trace("id in after OP: " + id);
                            // Log.trace( "colum array : " + valuesofquery[1].COLUMNS);
                            return transformationPart(isExistTran, i, isExistOPT.COLUMNS);
                        })
                        .then((i) => {
                            Log.trace("id in after TP: " + id);
                            return resolve(id); // return id
                        })
                        .catch((err: any) => {
                            Log.trace("Some error occurs in where, option transformation part");
                            return reject(new InsightError());
                        });
                }
                // return reject(new InsightError());
            });
        }
        // ================
        // 1. WHERE part:
        // ================
        function wherePart(wq: any, id: string) { // q = query
            return new Promise((resolve, reject) => {
                Log.trace("in wherePart()");
                let i = id;
                let where = wq;      // the value of WHERE.
                if (!(Object.keys(where)[0] === "AND" || Object.keys(where)[0] === "OR" ||
                    Object.keys(where)[0] === "LT" || Object.keys(where)[0] === "GT" ||
                    Object.keys(where)[0] === "EQ" || Object.keys(where)[0] === "IS" ||
                    Object.keys(where)[0] === "NOT")) {
                    Log.trace("Unexpected response status 400: Invalid filter key: " + Object.keys(where)[0]);
                    return reject(new InsightError());
                }

                readTQ(where); // Keyfunction: recursive function: it will return insightError when error finds!!!!
                return resolve(i); // return result id
                // =======================================
                // Helper functions in WHERE PART
                // =======================================
                // Recursive function: excute when reaching to the value being number of string
                // if finding some error in query, return insightError
                // otherwise, stop the recursive
                function readTQ(vow: any) { // vow = value of where
                    // Log.trace("in read TQ");
                    let key = Object.keys(vow);     // object.keys   always returns the array of keys in where
                    let value = Object.values(vow); // object.values always returns the array of values in where
                    let k = key[0];
                    let v = value[0];

                    // Log.trace("key in where : " + k);
                    // Log.trace("value in where : " + JSON.stringify(v));
                    // ================================= the start of vaildation check
                    if (k === "AND" || k === "OR") {
                        if (!Array.isArray(v) || v.length === 0) { // after the key "AND" or "OR", value should an array
                            Log.trace("Unexpected response status 400: " + k + " must be a non-empty array");
                            return reject(new InsightError());
                        }
                        for (let eleinArray of v) {
                            if (typeof eleinArray !== "object" || Array.isArray(eleinArray) || eleinArray === null) {
                                Log.trace("Unexpected response status 400: AND must be object");
                                return reject(new InsightError());
                            }
                            let keyInAndOR = Object.keys(eleinArray)[0];
                            let valueInAndOR = Object.values(eleinArray)[0];
                            if (keyInAndOR === undefined || valueInAndOR === undefined) {
                                Log.trace("Unexpected response status 400: " + k + " should only have 1 key, has 0");
                                return reject(new InsightError());
                            }
                        }
                    }
                    if (k === "LT" || k === "GT" || k === "EQ") {
                        if (typeof v !== "object" || Array.isArray(v) || v === null) {
                            Log.trace("Unexpected response status 400: " + k + " must be object");
                            return reject(new InsightError());
                        }
                        let keys = Object.keys(v);
                        let values = Object.values(v);
                        if (keys.length !== 1 && values.length !== 1) {
                            Log.trace("Unexpected response status 400: " + k + " should" +
                                " only have 1 key, has " + keys.length);
                            return reject(new InsightError());
                        }
                        if (type_str_Valuecheck(keys[0], id)) {
                            Log.trace("Unexpected response status 400: Invalid key type in " + k);
                            return reject(new InsightError());
                        }
                        if (!keycheck(keys[0], id)) {
                            Log.trace("Unexpected response status 400: Invalid key " + keys[0] + " in " + k);
                            return reject(new InsightError());
                        }
                        if (type_num_Valuecheck(keys[0], id) && typeof values[0] !== "number") {
                            Log.trace("Unexpected response status 400: Invalid value type in GT, should be number");
                            return reject(new InsightError());
                        }
                    }
                    if (k === "IS") {
                        if (typeof v !== "object" || Array.isArray(v) || v === null) {
                            Log.trace("Unexpected response status 400: IS must be object");
                            return reject(new InsightError());
                        }
                        let keys = Object.keys(v);
                        let values = Object.values(v);
                        if (keys.length !== 1 && values.length !== 1) {
                            Log.trace("Unexpected response status 400: IS should only have 1 key, has " + keys.length);
                            return reject(new InsightError());
                        }
                        if (type_num_Valuecheck(keys[0], id)) {
                            Log.trace("Unexpected response status 400: Invalid key type in IS");
                            return reject(new InsightError());
                        }
                        if (!keycheck(keys[0], id)) {
                            Log.trace("Unexpected response status 400: Invalid key " + keys[0] + " in IS");
                            return reject(new InsightError());
                        }
                        if (type_str_Valuecheck(keys[0], id) && (typeof values[0] !== "string")) {
                            Log.trace("Unexpected response status 400: Invalid value type in IS, should be string");
                            return reject(new InsightError());
                        }
                        if (type_str_Valuecheck(keys[0], id) &&
                            ((!checkInputString(values[0]) && !checkApplyKey(values[0]))
                                || (values[0].includes("**")))) {
                            Log.trace("Unexpected response status 400: Asterisks (*) can only be the first " +
                                "or last characters of input strings");
                            return reject(new InsightError());
                        }
                    }
                    if (k === "NOT") {
                        if (typeof v !== "object" || Array.isArray(v) || v === null) {
                            Log.trace("Unexpected response status 400: NOT must be object");
                            return reject(new InsightError());
                        }
                        let keysInNOT = Object.keys(v);
                        let valuesInNOT = Object.values(v);
                        if (keysInNOT.length !== 1 && valuesInNOT.length !== 1) {
                            Log.trace("Unexpected response status 400: NOT " +
                                "should only have 1 key, has " + keysInNOT.length);
                            return reject(new InsightError());
                        }
                        if (!(keysInNOT[0] === "AND" || keysInNOT[0] === "OR" ||
                            keysInNOT[0] === "LT" || keysInNOT[0] === "GT" ||
                            keysInNOT[0] === "EQ" || keysInNOT[0] === "NOT" ||
                            keysInNOT[0] === "IS")) {
                            Log.trace("Unexpected response status 400: Invalid filter key: " + keysInNOT[0]);
                            return reject(new InsightError());
                        }
                    }
                    // ================================= the end of vaildation check
                    // reach to the end of query and excute the recursive function
                    if ((typeof k === "string") && (typeof v === "number" || typeof v === "string")) {
                        return;
                    }

                    if (Array.isArray(value)) {
                        value.forEach(function (el: any) {
                            readTQ(el);
                        });
                    }
                    if (typeof key === "object") {
                        readTQ(Object.values(key));
                    }
                }
            });
        }
        // ================
        // 2. OPTIONS part:
        // ================
        function optionPart(vo: any, i: any) {
            return new Promise((resolve, reject) => {
                Log.trace("start option part!!");
                let valueofoption = vo;                         // the value of OPTIONS
                if (typeof valueofoption !== "object" || Array.isArray(valueofoption) || valueofoption === null) {
                    Log.trace("Unexpected response status 400: OPTIONS must be object");
                    return reject(new InsightError());
                }
                let keysinOpt = Object.keys(valueofoption);     // [COLUMNS, (ORDER)?]
                let valuesinOpt = Object.values(valueofoption); // [valueOfCol, (valueOfOrder)?]
                let id = i;

                if (valueofoption.COLUMNS === undefined) {
                    Log.trace("Unexpected response status 400: OPTIONS missing COLUMNS");
                    return reject(new InsightError());
                }
                if  ((keysinOpt[0] === "COLUMNS" && keysinOpt[1] !== "ORDER" && keysinOpt.length === 2) ||
                    (keysinOpt[0] !== "ORDER" && keysinOpt[1] === "COLUMNS"  && keysinOpt.length === 2)) {
                    Log.trace("Unexpected response status 400: Invalid keys in OPTIONS");
                    return reject(new InsightError());
                }
                // done
                if ((keysinOpt[0] === "COLUMNS" && keysinOpt[1] === "ORDER" && keysinOpt.length === 2) ||
                    (keysinOpt[0] === "ORDER" && keysinOpt[1] === "COLUMNS" && keysinOpt.length === 2)) {
                    // Option has COLUMNS and ORDER
                    let valuesofCol;
                    let valuesofOrder;
                    if (keysinOpt[0] === "COLUMNS" && keysinOpt[1] === "ORDER" && keysinOpt.length === 2) {
                        valuesofCol = valuesinOpt[0];
                        valuesofOrder = valuesinOpt[1];
                    } else {
                        valuesofCol = valuesinOpt[1];
                        valuesofOrder = valuesinOpt[0];
                    }

                    if (!Array.isArray(valuesofCol) || (Array.isArray(valuesofCol) && valuesofCol.length === 0)) {
                        Log.trace("Unexpected response status 400: COLUMNS must be a non-empty array");
                        return reject(new InsightError());
                    }
                    // ===================================
                    // filtering key which is not vaild:
                    let notKeysInCol = [];
                    for (let ele of valuesofCol) {
                        if (typeof ele !== "string") {
                            if (ele === null) {
                                Log.trace("Unexpected response status 400: Cannot read property 'includes' of null");
                                return reject(new InsightError());
                            }
                            Log.trace("Unexpected response status 400: key.includes is not a function");
                            return reject(new InsightError());
                        }
                        if (!keycheck(ele, id)) {
                            notKeysInCol.push(ele);
                        }
                    }
                    let invaildKeysInCol = [];
                    for (let ele of notKeysInCol) {
                        if (!checkApplyKey(ele)) {
                            invaildKeysInCol.push(ele);
                        }
                    }
                    // Log.trace("arrayCheck2: " + invaildKeysInCol);
                    for (let ele of invaildKeysInCol) {
                        if (ele.includes("__")) {
                            Log.trace("Unexpected response status 400: Invalid key " + ele + " in COLUMNS");
                            return reject(new InsightError());
                        }
                        if (ele.includes("_")) {
                            if (id !== getIDFromKey(ele)) {
                                Log.trace("Unexpected response status 400: Referenced" +
                                    " dataset " + getIDFromKey(ele) + " not added yet");
                                return reject(new InsightError());
                            }
                            Log.trace("Unexpected response status 400: Invalid key " + ele + " in COLUMNS");
                            return reject(new InsightError());
                        }
                        Log.trace("Unexpected response status 400: Invalid key " + ele + " in COLUMNS");
                        return reject(new InsightError());
                    }
                    // ------------------------
                    // ORDER part:
                    // ------------------------
                    // ORDERKEY: (key | applykey)
                    // valuesofOrder = {dir: DIRECTION, keys:[*(key|applykey)]}| (key | applykey)
                    // is the value of order not string or object
                    if ((typeof valuesofOrder !== "string"
                        && typeof valuesofOrder !== "object") || Array.isArray(valuesofOrder)) {
                        Log.trace("Unexpected response status 400: Invalid ORDER type");
                        return reject(new InsightError());
                    }
                    if (valuesofOrder === undefined || valuesofOrder === null) {
                        Log.trace("Unexpected response status 400: ORDER cannot be null or undefined");
                        return reject(new InsightError());
                    }
                    if (typeof valuesofOrder === "string") {
                        // the keys in ORDER must be in the COLUMNS array
                        if (valuesofCol.includes(valuesofOrder)) {
                            // end of Option part
                            return resolve(id); // return id
                        }
                        Log.trace("Unexpected response status 400: ORDER key must be in COLUMNS");
                        return reject(new InsightError());
                    }
                    // ORDER: {dir: DIRECTION, keys: [ORDERKEY(,ORDERKEY)*]}
                    // valuesofOrder = {dir: DIRECTION, keys: [ORDERKEY(,ORDERKEY)*]}
                    // DIRECTION = UP || DOWN
                    // ORDERKEY = key | applykey
                    if (typeof valuesofOrder === "object") {
                        // the keys in ORDER must be in the COLUMNS array
                        let dir = valuesofOrder.dir;          // DIRECTION
                        let keysInOrder = valuesofOrder.keys; // [ORDERKEY(,ORDERKEY)*]
                        // Order which is an object should has dir and keys - if not, error
                        if (dir === undefined) {
                            Log.trace("Unexpected response status 400: ORDER missing 'dir' key");
                            return reject(new InsightError());
                        }
                        if (keysInOrder === undefined) {
                            Log.trace("Unexpected response status 400: ORDER missing 'keys' key");
                            return reject(new InsightError());
                        }
                        // check the value of dir is UP or DOWN - if not, error
                        if (dir !== "UP" && dir !== "DOWN") {
                            Log.trace("Unexpected response status 400: Invalid ORDER direction");
                            return reject(new InsightError());
                        }
                        // the keys in ORDER must be in the COLUMNS array
                        if (!arrayContainsArray (valuesofCol, keysInOrder)) {
                            Log.trace("Unexpected response status 400: All ORDER keys must be in COLUMNS");
                            return reject(new InsightError());
                        }
                        // end of Option part
                        return resolve(id); // return id
                    }
                }

                if (keysinOpt[0] === "COLUMNS" && keysinOpt.length === 1) {
                    // Option has only COLUMNS
                    let valuesofCol = valuesinOpt[0];
                    if (!Array.isArray(valuesofCol) || (Array.isArray(valuesofCol) && valuesofCol.length === 0)) {
                        Log.trace("Unexpected response status 400: COLUMNS must be a non-empty array");
                        return reject(new InsightError());
                    }
                    // ===================================
                    // filtering key which is not vaild:
                    let notKeysInCol = [];
                    for (let ele of valuesofCol) {
                        if (typeof ele !== "string") {
                            if (ele === null) {
                                Log.trace("Unexpected response status 400: Cannot read property 'includes' of null");
                                return reject(new InsightError());
                            }
                            Log.trace("Unexpected response status 400: key.includes is not a function");
                            return reject(new InsightError());
                        }
                        if (!keycheck(ele, id)) {
                            notKeysInCol.push(ele);
                        }
                    }
                    let invaildKeysInCol = [];
                    for (let ele of notKeysInCol) {
                        if (!checkApplyKey(ele)) {
                            invaildKeysInCol.push(ele);
                        }
                    }
                    // Log.trace("invaildKeysInCol : " + invaildKeysInCol);
                    for (let ele of invaildKeysInCol) {
                        if (ele.includes("__")) {
                            Log.trace("Unexpected response status 400: Excess keys in query");
                            return reject(new InsightError());
                        }
                        if (ele.includes("_")) {
                            if (id !== getIDFromKey(ele)) {
                                Log.trace("Unexpected response status 400: Referenced" +
                                    " dataset" + getIDFromKey(ele) + " not added yet");
                                return reject(new InsightError());
                            }
                            Log.trace("Unexpected response status 400: Invalid key " + ele + " in COLUMNS");
                            return reject(new InsightError());
                        }
                        Log.trace("Unexpected response status 400: Invalid key " + ele + " in COLUMNS");
                        return reject(new InsightError());
                    }
                    // end of Option part
                    return resolve(id); // return id
                }
            });
        }

        // ================
        // 3. TRANSFORMATION part: added for D2!
        // ================
        // ex)
        // TRANSFORMATION - {GROUP, APPLY}
        // vT: value of transformation, i: id, ca: column array
        function transformationPart(vT: any, i: any, ca: any[]) {
            return new Promise((resolve, reject) => {
                Log.trace("Start Transformation part!!");
                let id = i;
                // Log.trace("id in TF: " + JSON.stringify(id));
                Log.trace("column array in trans: " + ca);
                let valueofTransformation = vT;          // graps the values of TRANSFORMATIONS
                let group = valueofTransformation.GROUP;
                let apply = valueofTransformation.APPLY;

                if (typeof valueofTransformation !== "object" || Array.isArray(valueofTransformation)
                    || valueofTransformation === null) {
                    Log.trace("Unexpected response status 400: TRANSFORMATIONS missing GROUP");
                    // Log.trace("Unexpected response status 400: TRANSFORMATIONS must be object");
                    return reject(new InsightError());
                }
                if (group === undefined) {
                    Log.trace("Unexpected response status 400: TRANSFORMATIONS missing GROUP");
                    return reject(new InsightError());
                }
                if (group !== undefined && apply === undefined) {
                    Log.trace("Unexpected response status 400: TRANSFORMATIONS missing APPLY");
                    return reject(new InsightError());
                }
                if ((Array.isArray(group) && group.length === 0) || typeof group !== "object" || group === null) {
                    Log.trace("Unexpected response status 400: GROUP must be a non-empty array");
                    return reject(new InsightError());
                    // return reject("Unexpected response status 400: GROUP must be a non-empty array");
                }
                if (!Array.isArray(group) || !Array.isArray(apply)) {
                    Log.trace("Unexpected response status 400: APPLY must be an array");
                    return reject(new InsightError());
                }
                // -----------------------------
                let vaildKeysInTrans = [];
                if (Array.isArray(group) && Array.isArray(apply)) {
                    for (let ele of group) {
                        if (!keycheck(ele, id)) {
                            Log.trace("keys in group are not the key");
                            Log.trace("Unexpected response status 400: " +
                                "Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
                            return reject(new InsightError());
                        }
                        vaildKeysInTrans.push(ele);
                    }
                    Log.trace("vaild keys from group array : " + vaildKeysInTrans);
                    if (apply.length !== 0) {
                        let applykeysInAPPLY: string[] = [];
                        for (let ele of apply) {
                            if (typeof ele !== "object" || ele === null) {
                                Log.trace("element in apply array is not object");
                                Log.trace("Unexpected response status 400: Apply rule must be object");
                                return reject(new InsightError());
                            }
                            let applykeyInApplyRule = Object.keys(ele)[0];          // ex) applykey
                            let valueOfApplykeyInApplyRule = Object.values(ele)[0]; // ex) {APPLYTOKEN : key}
                            if (applykeyInApplyRule.includes("_")) {
                                Log.trace("applykey in Applyrule is not the applykey");
                                Log.trace("Unexpected response status 400: Cannot have underscore in applyKey");
                                return reject(new InsightError());
                            }
                            applykeysInAPPLY.push(applykeyInApplyRule);
                            if (typeof valueOfApplykeyInApplyRule !== "object"
                                || valueOfApplykeyInApplyRule === null
                                || Array.isArray(valueOfApplykeyInApplyRule)) {
                                Log.trace("the value of applykey in Applyrule is not object");
                                return reject(new InsightError());
                            }
                            let applytoken = Object.keys(valueOfApplykeyInApplyRule)[0]; // ex) APPLYTOKEN
                            let key = Object.values(valueOfApplykeyInApplyRule)[0];      // ex) key
                            if (!keycheck(key, id)) {
                                Log.trace("Unexpected response status 400: Invalid key " + key + " in "
                                    + applytoken);
                                return reject(new InsightError());
                            }
                            if (!(applytoken === "MAX" || applytoken === "MIN" || applytoken === "AVG" ||
                                applytoken === "COUNT" || applytoken === "SUM")) {
                                Log.trace("applytoken is not one of max, min, avg, count or sum");
                                Log.trace("Unexpected response status 400: Invalid transformation operator");
                                return reject(new InsightError());
                            }
                            if ((applytoken === "COUNT") && !keycheck(key, i)) {
                                Log.trace("count should be requested for all keys, but it is not satisfied");
                                return reject(new InsightError());
                            }
                            if ((applytoken === "MAX" || applytoken === "MIN" || applytoken === "AVG" ||
                                applytoken === "SUM") && !type_num_Valuecheck(key, i)) {
                                Log.trace("max, min avg, sum should be requested for numberickeys");
                                Log.trace("Unexpected response status 400: Invalid key type in " + applytoken);
                                return reject(new InsightError());
                            }
                            vaildKeysInTrans.push(applykeyInApplyRule);
                            vaildKeysInTrans.push(key);
                        }
                        if (hasDuplicates(applykeysInAPPLY)) {
                            let result: any[] = [];
                            applykeysInAPPLY.forEach(function (element, index) {
                                // Find if there is a duplicate or not
                                if (applykeysInAPPLY.indexOf(element, index + 1) > -1) {
                                    // Find if the element is already in the result array or not
                                    if (result.indexOf(element) === -1) {
                                        result.push(element);
                                    }
                                }
                            });
                            Log.trace("Unexpected response status 400: Duplicate APPLY key " + result[0]);
                            return reject(new InsightError());
                        }
                    }
                    Log.trace("eles in vaildKeysInTrans after apply : " + vaildKeysInTrans);
                    if (!arrayContainsArray(vaildKeysInTrans, ca)) {
                        Log.trace("all COLUMNS terms must correspond to either GROUP keys or to applykeys");
                        Log.trace("Unexpected response status 400: " +
                            "Keys in COLUMNS must be in GROUP or APPLY when TRANSFORMATIONS is present");
                        Log.trace("Unexpected response status 400: Invalid key overallAvg in COLUMNS");
                        return reject(new InsightError());
                    }
                    return resolve(id);
                }
            });
        }
        // Reference: https://github.com/lodash/lodash/issues/1743
        // Goal: return true if the first specified array contains all element from the second one
        //       False otherwise.
        function arrayContainsArray(superset: any[], subset: any[]): boolean {
            // Log.trace("in arrayContainsArray() superset" + superset);
            // Log.trace("in arrayContainsArray() subset " + subset);
            return subset.every(function (value) {
                return (superset.indexOf(value) >= 0);
            });
        }
        // Reference:
        // https://stackoverflow.com/questions/7376598/in-javascript-how-do-i-check-if-an-array-has-duplicate-values
        // Goal: check if an array has a duplicate value
        // return true if duplicate values exists
        // return false otherwise
        function hasDuplicates(array: any): boolean {
            let valuesSoFar = [];
            for (let i of array) {
                let value = i;
                if (valuesSoFar.indexOf(value) !== -1) {
                    return true;
                }
                valuesSoFar.push(value);
            }
            return false;
        }
        function checkInputString(is: string): boolean {
            let vaildAK = /^[*]?[a-z]+[*]?$/;
            return vaildAK.test(is);
        }
        // Goal: check whether the apply key is vaild or not
        // ex) applykey ::= [^_]+ // one or more of any character except underscore.
        // return true if apply key is that one or more of any character except underscore
        function  checkApplyKey(ak: string): boolean {
            let vaildAK = /^[^_]+$/;
            return vaildAK.test(ak);
        }
        // Goal: check the applyToken, "at", whether it is vaild or not
        // return true if "at" is one of "MAX"/"MIN"/"AVG"/"COUNT"/"SUM"
        function checkApplyToken(at: string): boolean {
            // MAX|MIN|AVG|COUNT|SUM
            return at === "MAX" || at === "MIN" || at === "AVG" ||
                at === "COUNT" || at === "SUM";
        }
        // Goal: check the key of "courses" - if the key is one of below, it is vaild key.
        // return true if the key is one of below
        function keycheck(st: string, i: string): boolean {
            return (
                // check the key of "courses" - if the key is one of below, return true.
                // the type of value should be "string"
                st === i + "_dept" ||
                st === i + "_id" ||
                st === i + "_instructor" ||
                st === i + "_title" ||
                st === i + "_uuid" ||
                // the type of value should be "number"
                st === i + "_avg" ||
                st === i + "_pass" ||
                st === i + "_fail" ||
                st === i + "_audit" ||
                st === i + "_year" ||
                // check the key of "rooms", if the key is one of below, return true.
                // the type of value should be "string"
                st === i + "_fullname" ||
                st === i + "_shortname" ||
                st === i + "_name" ||
                st === i + "_address" ||
                st === i + "_type" ||
                st === i + "_furniture" ||
                st === i + "_href" ||
                st === i + "_number" ||
                // the type of value should be "number"
                st === i + "_lat" ||
                st === i + "_lon" ||
                st === i + "_seats"
            );
        }
        // 123
        function type_str_Valuecheck(st: string, i: string): boolean {
            return ( // if the type of all these keys's value is "string", return true
                // for courses:
                st === i + "_dept" ||
                st === i + "_id" ||
                st === i + "_instructor" ||
                st === i + "_title" ||
                st === i + "_uuid" ||
                // for rooms:
                st === i + "_fullname" ||
                st === i + "_shortname" ||
                st === i + "_number" ||
                st === i + "_name" ||
                st === i + "_address" ||
                st === i + "_type" ||
                st === i + "_furniture" ||
                st === i + "_href"
            );
        }
        function type_num_Valuecheck(st: string, i: string): boolean {
            return ( // if the type of all these keys's value is "number", return true
                // for courses:
                st === i + "_avg" ||
                st === i + "_pass" ||
                st === i + "_fail" ||
                st === i + "_audit" ||
                st === i + "_year" ||
                // for rooms:
                st === i + "_lat" ||
                st === i + "_lon" ||
                st === i + "_seats" ||
                st === "MAX" ||
                st === "MIN" ||
                st === "AVG" ||
                st === "SUM" ||
                st === "COUNT"
            );
        }

        function getIDFromKey(key: string): string {
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
        function ResultTooBig(results: any[]): boolean {
            if (results.length > 5000) {
                return true;
            }
        }
        function isEmpty(obj: any) {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return false;
                }
            }
            return true;
        }
        // given a datasetID, check it through dataset in memory
        // if kind is course, return true; if kind is room, return false
        function checkDatasetKind(datasetName: string, datasetMemory: InsightDataset[]) {
                for (let aDataset of datasetMemory) {
                    if (aDataset.id === datasetName) {
                        if (aDataset.kind === InsightDatasetKind.Courses) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
        }

    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise((resolve) => {
            return resolve(this.datasets);
        });
    }
}
