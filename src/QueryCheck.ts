import {InsightError} from "./controller/IInsightFacade";
import Log from "./Util";
import KeyHelper from "./KeyHelper";
export default class QueryCheck {
    // ===========================================================================================
    // Helper functions for vaildation query(syntax check):
    // ================
    // Query part: simple description for query - QUERY(WHERE, OPTIONS, (TRANSFORMATION(added for D2))?)
    // ================
    public static isVaildQ(q: any) {
        return new Promise((resolve, reject) => {
            let quer = q;
            let isExistWhere = quer.WHERE;
            let isExistOPT = quer.OPTIONS;

            if (isExistWhere === undefined || isExistOPT === undefined) {
                return reject(new InsightError());
            }

            let keyofquery = Object.keys(quer); // will return [WHERE, OPTION, (TRANSFORMATION)?]
            let valuesofquery = Object.values(quer);

            if (keyofquery[0] === "WHERE" && keyofquery[1] === "OPTIONS"
                && keyofquery.length === 2 && valuesofquery.length === 2) {
                Log.trace("WHERE, OPTIONS exist");
                // Query Only has WHERE and OPTIONS
                this.wherePart(valuesofquery[0])
                    .then((id) => {
                        Log.trace("id in after WP: " + id);
                        return this.optionPart(valuesofquery[1], id);
                    })
                    .then((id) => {
                        Log.trace("id in after OP: " + id);
                        return resolve(id); // return id
                    })
                    .catch((err: any) => {
                        return reject(new InsightError());
                    });
            }
            if (keyofquery[0] === "WHERE"
                && keyofquery[1] === "OPTIONS"
                && keyofquery[2] === "TRANSFORMATIONS"
                && keyofquery.length === 3
                && valuesofquery.length === 3) {
                Log.trace("WHERE, OPTIONS, TRANSFORMATION exist");
                // Query Only has WHERE, OPTIONS, and TRANSFORMATIONS
                this.wherePart(valuesofquery[0])
                    .then((id) => {
                        Log.trace("id in after WP: " + id);
                        return this.optionPart(valuesofquery[1], id);
                    })
                    .then((id) => {
                        Log.trace("id in after OP: " + id);
                        return this.transformationPart(valuesofquery[2], id);
                    })
                    .then((id) => {
                        Log.trace("id in after TP: " + id);
                        return resolve(id); // return id
                    })
                    .catch((err: any) => {
                        return reject(new InsightError());
                    });
            }
            // return reject(new InsightError());
        });
    }

    public static wherePart(q: any) { // q = query
        return new Promise((resolve, reject) => {
            // Log.trace("id!!!!!:" + id);
            let id = "";
            let valueofwhere = q;      // the value of WHERE.
            let valuesinW: any[] = [];
            // let checkinginW: any[] = [];
            if (typeof valueofwhere !== "object") {
                return reject(new InsightError());
            }
            if (KeyHelper.isEmpty(valueofwhere)) {
                return resolve(id); // return id = "" when filter doesn't exist
            }
            // =========================
            // find ID
            findId(valueofwhere);
            let iskey = valuesinW.find((value) => /^[a-z]+_[a-z]+$/.test(value));
            // =========================
            // Log.trace("ID: " + iskey);
            // for (let ele of valuesinW0) {
            //     Log.trace("1.: " + JSON.stringify(ele));
            // }
            id = KeyHelper.getIDFromKey(iskey); // Grape ID from WHERE
            Log.trace("id in WHERE: " + id);
            if (id === "") { // if id doesn't exist, err
                return reject(new InsightError());
            }

            // excuting readTQ(): read though Query with id which is a recursive function
            if (readTQ(valueofwhere)) {
                return reject(new InsightError());
            }

            return resolve(id); // return result id
            // Goal: find ID from WHERE PART
            // Recursive function: excute when reaching to the value being number or string
            function findId(vow0: any) {
                let key = Object.keys(vow0);     // object.keys   always returns the array of keys in where
                let value = Object.values(vow0); // object.values always returns the array of values in where
                let v = value[0];

                // reach to the end of query and excute the recursive function
                if (typeof v === "number" || typeof v === "string") {
                    // let key1 = Object.keys(vow0)[0];
                    // let value1 = Object.values((vow0)[0]);
                    valuesinW.push(key[0]);
                    valuesinW.push(value[0]);
                    return;
                }

                valuesinW.push(key);

                if (Array.isArray(value)) {
                    value.forEach(function (el: any) {
                        findId(el);
                    });
                }
                if (typeof key === "object") {
                    findId(Object.values(key));
                }
            }

            // Recursive function: excute when reaching to the value being number of string
            // if finding some error in query, return true
            // not finding any error in query, save all keys and values into valueinW array and return false
            function readTQ(vow: any): boolean { // vow = value of where
                // Log.trace("2. in read TQ");
                let key = Object.keys(vow);     // object.keys   always returns the array of keys in where
                let value = Object.values(vow); // object.values always returns the array of values in where
                let k = key[0];
                let v = value[0];
                // 1-1 check the vaildation:
                // if vaildationCheckforW() is true meaning that there is err, it will return true
                if (this.vaildataionCheckforW(key, value, id)) {
                    reject(new InsightError());
                    // reject(new InsightError());
                }
                // reach to the end of query and excute the recursive function
                if ((typeof k === "string") && (typeof v === "number" || typeof v === "string")) {
                    // checkinginW.push(k);
                    // checkinginW.push(v);
                    return false;
                }

                // checkinginW.push(k);
                if (Array.isArray(value)) {
                    value.forEach(function (el: any) {
                        // if (typeof el === "object" && isEmpty(el)) {
                        //     reject(new InsightError()); // !!!!!!!!!!!!!!!
                        // }
                        return readTQ(el);
                    });
                }
                if (typeof key === "object") {
                    return readTQ(Object.values(key));
                }
            }
        });
    }

    public static vaildataionCheckforW(key: any, value: any, i: string): boolean {
        let id = i;
        let k = key[0];
        let v = value[0];

        if (k === undefined || v === undefined) {
            return true;
        }
        if (k === "AND" || k === "OR") {
            if (Array.isArray(v)) { // after the key "AND" or "OR", value is an array
                return v.length === 0 || v.length === 1;
            } else { // value is not array
                return true;
            }
        }
        if (k === "LT" || k === "GT" || k === "EQ") {
            if (typeof v === "object" && v !== null && Object.keys(v).length === 1) {
                return !(this.type_num_Valuecheck(Object.keys(v)[0], id) && typeof Object.values(v)[0] === "number");
            } else {
                return true;
            }
        }
        if (k === "IS") {
            if (typeof v === "object" && v !== null) {
                if (this.type_str_Valuecheck(Object.keys(v)[0], id)
                    && typeof Object.values(v)[0] === "string") {
                    if (Object.values(v)[0].includes("**")) {
                        return true;
                    }
                    return false;
                }
                return true;
            } else {
                return true;
            }
        }
        if (k === "NOT") {
            if (typeof v === "object" && v !== null) {
                return !(Object.keys(v)[0] === "LT" || Object.keys(v)[0] === "GT"
                    || Object.keys(v)[0] === "EQ" || Object.keys(v)[0] === "AND"
                    || Object.keys(v)[0] === "OR");
            } else {
                return true;
            }
        }
    }

    public static optionPart(vo: any, i: any) {
        return new Promise((resolve, reject) => {
            Log.trace("start option part!!");
            Log.trace("id in OPTION: " + JSON.stringify(i));
            let valueofoption = vo;                         // the value of OPTIONS
            if (vo.COLUMNS === undefined) {
                return reject(new InsightError());
            }
            let keysinOpt = Object.keys(valueofoption);     // [COLUMNS, (ORDER)?]
            let valuesinOpt = Object.values(valueofoption); // [valueOfCol, (valueOfOrder)?]
            let id = "";
            if (i === "") { // when there is no where part, i is empty string
                id = KeyHelper.getIDFromKey(vo["COLUMNS"][0]); // Grape ID from COLUMNS in OPTIONS
            } else {
                id = i;
            }

            if (keysinOpt[0] === "COLUMNS" && keysinOpt[1] === "ORDER" && keysinOpt.length === 2) {
                // Option has COLUMNS and ORDER
                let valuesofCol = valuesinOpt[0];
                let valuesofOrder = valuesinOpt[1];
                if (!Array.isArray(valuesofCol)) {
                    Log.trace("1. reject in option part!!");
                    return reject(new InsightError());
                }
                // Does the value of Column has?
                if (valuesofCol.length === 0) {
                    Log.trace("2. reject in option part!!");
                    return reject(new InsightError());
                }
                // is the value of order not string or object
                if (typeof valuesofOrder !== "string"
                    && typeof valuesofOrder !== "object") {
                    Log.trace("3. reject in option part!!");
                    return reject(new InsightError());
                }
                // ------------------------
                // check the colum array:
                let countNumkey = 0;
                let countNumapplykey = 0;
                for (let ele of valuesofCol) {
                    if (this.keycheck(ele, id)) {
                        countNumkey ++;
                    }
                    if (this.checkApplyKey(ele)) {
                        countNumapplykey ++;
                    }
                    // colArray.push(ele);
                }
                if (countNumkey + countNumapplykey !== valuesofCol.length) {
                    return reject(new InsightError());
                }
                // ------------------------
                // ORDERKEY: (key | applykey)
                // valuesofOrder = key | applykey
                if (typeof valuesofOrder === "string") {
                    // the keys in ORDER must be in the COLUMNS array
                    for (let ele of valuesofCol) {
                        if (ele === valuesofOrder) {
                            return resolve(id);
                        }
                    }
                    Log.trace("5. reject in option part!!");
                    return reject(new InsightError());
                }
                // ORDER: {dir: DIRECTION, keys: [ORDERKEY(,ORDERKEY)*]}
                // valuesofOrder = {dir: DIRECTION, keys: [ORDERKEY(,ORDERKEY)*]}
                // DIRECTION = UP || DOWN
                // ORDERKEY = key | applykey
                if (typeof valuesofOrder === "object" && valuesofOrder !== null) {
                    // the keys in ORDER must be in the COLUMNS array
                    let dir = valuesofOrder.dir;          // DIRECTION
                    let keysInOrder = valuesofOrder.keys; // [ORDERKEY(,ORDERKEY)*]
                    // Order which is an object should has dir and keys - if not, error
                    if (dir === undefined || keysInOrder === undefined) {
                        Log.trace("6. reject in option part!!");
                        return reject(new InsightError());
                    }
                    // check the value of dir is UP or DOWN - if not, error
                    if (dir !== "UP" && dir !== "DOWN") {
                        Log.trace("7. reject in option part!!");
                        return reject(new InsightError());
                    }
                    // the keys in ORDER must be in the COLUMNS array
                    if (!this.arrayContainsArray (valuesofCol, keysInOrder)) {
                        Log.trace("8. reject in option part!!");
                        return reject(new InsightError());
                    }
                    return resolve(id);
                }
                Log.trace("9. reject in option part!!");
                return reject(new InsightError());
            }
            if (keysinOpt[0] === "COLUMNS" && keysinOpt.length === 1) {
                // Option has only COLUMNS
                let valuesofCol = valuesinOpt[0];
                if (!Array.isArray(valuesofCol)) {
                    Log.trace("10. reject in option part!!");
                    return reject(new InsightError());
                }
                // the value of Column is an array
                if (valuesofCol.length === 0) {
                    Log.trace("11. reject in option part!!");
                    return reject(new InsightError());
                }
                // ------------------------
                // check the colum array:
                let countNumkey = 0;
                let countNumapplykey = 0;
                for (let ele of valuesofCol) {
                    if (this.keycheck(ele, id)) {
                        countNumkey ++;
                    }
                    if (this.checkApplyKey(ele)) {
                        countNumapplykey ++;
                    }
                    // colArray.push(ele);
                }
                if (countNumkey + countNumapplykey !== valuesofCol.length) {
                    return reject(new InsightError());
                }
                // ------------------------
                Log.trace("end option part!!");
                return resolve(id);
            }
            Log.trace("13. reject in option part!!");
            return reject(new InsightError());
        });
    }

    public static transformationPart(vT: any, i: any) {
        return new Promise((resolve, reject) => {
            Log.trace("Start Transformation part!!");
            let id = i;
            Log.trace("id in TF: " + JSON.stringify(id));
            let valueofTransformation = vT;          // graps the values of TRANSFORMATIONS
            if (typeof valueofTransformation === "object" && valueofTransformation !== null) {
                let keysinTrans = Object.keys(valueofTransformation); // [GROUP, APPLY]
                // GROUP: [(key, )* key]
                // APPLY:[((APPLYRULE (, APPLYRULE)*)?]
                // APPLYRULE: {applykey: {APPLYTOKEN : key}}
                // APPLYTOKEN = MAX|MIN|AVG|COUNT|SUM
                // applykey = [^_]+
                // key = string'_'string
                if (keysinTrans[0] === "GROUP" && keysinTrans[1] === "APPLY") {
                    let valuesofGroup = valueofTransformation.GROUP; // graps the value of GROUP => [key, *]
                    let valuesofApply = valueofTransformation.APPLY; // graps the values of APPLY => [APPLYRULE, *]
                    let groupArray = [];
                    let applyruleArray = [];
                    if (Array.isArray(valuesofGroup) && Array.isArray(valuesofApply)) {
                        if (valuesofGroup.length === 0 || valuesofApply.length === 0) {
                            Log.trace("1. reject Transformation part!!");
                            return reject(new InsightError());
                        }
                        for (let ele of valuesofGroup) {
                            Log.trace("value of Group: " + ele);
                            if (!this.keycheck(ele, i)) {
                                // Log.trace("2. reject Transformation part!!");
                                return reject(new InsightError());
                            }
                            groupArray.push(ele);
                        }
                        for (let ele of valuesofApply) {
                            if (!this.isApplyrule(ele, id)) {
                                // Log.trace("3. reject Transformation part!!");
                                return reject(new InsightError());
                            }
                            let applykey = Object.keys(ele)[0];
                            applyruleArray.push(applykey); // checking for applykey's uniqueness
                        }
                        if (this.hasDuplicates(applyruleArray)) {
                            // Log.trace("4. reject Transformation part!!");
                            return reject(new InsightError());
                        }
                        // Log.trace("End Transformation part!!");
                        return resolve(id);
                    }
                    // Log.trace("6. reject Transformation part!!");
                    return reject(new InsightError());
                }
                // Log.trace("7.reject Transformation part!!");
                return reject(new InsightError());
            }
            // Log.trace("8. reject Transformation part!!");
            return reject(new InsightError());
        });
    }

    public static isApplyrule(ar: any, id: any): boolean {
        let applyrule = ar;
        if (typeof applyrule === "object" && applyrule !== null) {
            let keyOfAR = Object.keys(applyrule)[0];     // applykey
            // Log.trace("key of AR: " + keyOfAR);
            let valueOfAR = Object.values(applyrule)[0]; // {APPLYTOKEN: key}
            // Log.trace("value of AR: " + JSON.stringify(valueOfAR));
            if (typeof keyOfAR === "string" && (typeof valueOfAR === "object" && valueOfAR !== null)) {
                // Log.trace("111111111");
                if (this.checkApplyKey(keyOfAR)) {
                    // Log.trace("222222222");
                    let applyToken = Object.keys(valueOfAR)[0]; // APPLYTOKEN
                    let key = Object.values(valueOfAR)[0];      // key
                    return this.checkApplyToken(applyToken) && this.type_num_Valuecheck(key, id);
                }
                return false;
            }
            return false;
        }
        return false;
    }
    public static hasDuplicates(array: any): boolean {
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
    // Goal: check whether the apply key is vaild or not
    // ex) applykey ::= [^_]+ // one or more of any character except underscore.
    // return true if apply key is that one or more of any character except underscore
    public static  checkApplyKey(ak: string): boolean {
        let vaildAK = /^[^_]+$/;
        return vaildAK.test(ak);
    }
    // Goal: check the applyToken, "at", whether it is vaild or not
    // return true if "at" is one of "MAX"/"MIN"/"AVG"/"COUNT"/"SUM"
    public static checkApplyToken(at: string): boolean {
        // MAX|MIN|AVG|COUNT|SUM
        return at === "MAX" || at === "MIN" || at === "AVG" ||
            at === "COUNT" || at === "SUM";
    }
    // Goal: check the key of "courses" - if the key is one of below, it is vaild key.
    // return true if the key is one of below
    public static keycheck(st: string, i: string): boolean {
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
    public static type_str_Valuecheck(st: string, i: string): boolean {
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
            st === i + "_name" ||
            st === i + "_address" ||
            st === i + "_type" ||
            st === i + "_furniture" ||
            st === i + "_href"
        );
    }
    public static type_num_Valuecheck(st: string, i: string): boolean {
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
    public static arrayContainsArray(superset: any, subset: any): boolean {
        return subset.every(function (value: any) {
            return (superset.indexOf(value) >= 0);
        });
    }
}
