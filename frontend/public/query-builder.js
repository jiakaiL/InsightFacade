/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */


CampusExplorer.buildQuery = function() {
    let query = {};
    // TODO: implement!
    console.log("CampusExplorer.buildQuery not implemented yet.");
    console.log("start building query");
    let tapinfo = document.getElementsByClassName("tab-panel active")[0];
    console.log(tapinfo.toString());
    let dataset_type = tapinfo.getAttribute("data-type");
    let courses_fields =  ["audit", "avg", "dept", "fail", "id", "instructor", "pass", "title", "uuid", "year"];
    let rooms_fields = ["address", "fullname", "furniture", "href", "lat",
        "lon", "name", "number", "seats", "shortname", "type"];
    let fields = [];
    if (dataset_type === "courses") {
        fields = courses_fields;
    } else if (dataset_type === "rooms"){
        fields = rooms_fields;
    }
    function build_fitler(){
        let condition = tapinfo.querySelector("input[checked]").id;
        console.log(condition.toString());
        if (condition.includes("all")){
            condition = "AND";
        } else if (condition.includes("any")){
            condition = "OR";
        } else {
            condition = "NONE";
        }

        let filters = tapinfo.getElementsByClassName("control-group condition");
        let filterArr = [];
        for (i=0; i<filters.length; i++){
            let obj = {};

            // getting info from UI
            let not = filters[i].getElementsByClassName("control not")[0].querySelector("input[checked]");
            let field = filters[i].getElementsByClassName("control fields")[0].querySelector("option[selected]").value;
            let opt = filters[i].getElementsByClassName("control operators")[0].querySelector("option[selected]").value;
            let term = filters[i].getElementsByClassName("control term")[0].querySelector("input").value;

            if (fields.includes(field)){
                field = dataset_type + "_" + field;
            }

            let sub_query = {};
            let operate = {};
            if (opt != "IS") {
                sub_query[field] = Number(term);
            } else {
                sub_query[field] = term;
            }
            operate[opt] = sub_query;

            if (condition != "NONE") {
                if (not != null){
                    obj["NOT"] = operate;
                } else {
                    obj = operate;
                }
            } else {
                if (not != null){
                    obj = operate;
                } else {
                    obj["NOT"] = operate;
                }
            }
            filterArr.push(obj);
        }
        if (filterArr.length == 0) {
            return {};
        } else {
            if (filterArr.length == 1) {
                return filterArr[0];
            } else {
                if (condition == "NONE") {
                    condition = "AND";
                }
                let a = {};
                a[condition] = filterArr;
                return a;
            }
        }
    }

    function build_column(){
        let control_column = tapinfo.getElementsByClassName("form-group columns")[0];
        let fields_arr = control_column.getElementsByClassName("control field");
        let result = [];
        for (i=0; i<fields_arr.length; i++) {
            let c_field = fields_arr[i].querySelector("input[checked]");
            if (c_field != null) {
                c_field = dataset_type + "_" + c_field.value;
                result.push(c_field);
            }
        }
        return result;
    }
    function build_order(){
        let decs = tapinfo.getElementsByClassName("control descending")[0].querySelector("input[checked]");
        let order_fields = tapinfo.getElementsByClassName("control order fields")[0].querySelectorAll("option[selected]");
        let orders = [];
        let order = {};
        if (order_fields.length > 1) {
        for (i=0; i< order_fields.length; i++){
            let aOrder = dataset_type + "_" + order_fields[i].value;
            console.log(aOrder);
            orders.push(aOrder);
        }
        let dir;
        if (decs != null) {
            dir = "DOWN";
        } else {
            dir = "UP";
        }
        order["dir"] = dir;
        order["keys"] = orders;
        return order;
        } else if (order_fields.length ==1){
            order = dataset_type + "_" + order_fields[0].value;
            return order;
        } else {
            order = null;
        }
        return order;
    }
    function build_group(){
        let group_option = tapinfo.getElementsByClassName("form-group groups")[0];
        let fields = group_option.querySelectorAll("input[checked]");
        let result = [];
        for (i=0; i<fields.length; i++) {
            result.push(dataset_type+"_"+fields[i]);
        }
        return result;
    }
    function build_apply() {
        var applys = [];
        var applyNodes = tapinfo.getElementsByClassName("control-group transformation");
        for (i = 0; i < applyNodes.length; i++) {
            var name = applyNodes[i].querySelectorAll("input")[0].value;
            var opt = applyNodes[i].querySelectorAll("select")[0].value;
            var opton = applyNodes[i].querySelectorAll("select")[1].value;
            if (fields.includes(opton)){
                opton = dataset_type + "_" + opton;
            }
            var obj = {};
            obj[name] = {};
            obj[name][opt] = opton;
            applys.push(obj);
        }
        return applys;
    }

    // WHERE
    query["WHERE"] = {};
    query["WHERE"] = build_fitler();

    // COLUMN
    query["OPTIONS"] = {};
    query.OPTIONS["COLUMNS"]= build_column();

    // ORDER
    let orderObj = build_order();
    if (orderObj != null) {
        query.OPTIONS["ORDER"] = orderObj;
    }

    // GROUP
    if (build_group().length > 0) {
        query["TRANSFORMATION"] = {};
        query["TRANSFORMATION"]["GROUP"]= build_group();
        query["TRANSFORMATIONS"]["APPLY"] =build_apply();
    }

    console.log("showing query");
    console.log(JSON.stringify(query));
    return query;
};
