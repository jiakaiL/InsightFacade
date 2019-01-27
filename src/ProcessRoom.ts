import Log from "./Util";
import {InsightError} from "./controller/IInsightFacade";

export default class ProcessRoom {
    public static getLatLon(address: string): Promise<any> {
        return new Promise ((resolve, reject) => {
            let server = "http://cs310.ugrad.cs.ubc.ca:11316/api/v1/project_n7y9a_x5n0b/" + address;
            const https = require("http");
            https.get(server, (resp: any) => {
                resp.setEncoding("utf8");
                let rawData = "";
                resp.on("data", (chunk: any) => {
                    rawData += chunk;
                });
                resp.on("end", () => {
                    try {
                        const parsedData: any = JSON.parse(rawData);
                        // Log.trace(address);
                        // Log.trace(JSON.stringify(parsedData));
                        resolve (parsedData);
                    } catch (e) {
                        Log.trace(e);
                    }
                });
            }).on("error", (e: any) => {
                resolve("error");
            });
        });
    }

    public static urlAddress(address: string): string {
        return address.replace(/ /gi, "%20");
    }

    public static findFullname(buildingObj: any): string {
        let result: string = "";
        if (buildingObj.nodeName === "span") {
            let attribute = buildingObj.attrs;
            if (attribute.length === 1) {
                if (Object.keys(attribute[0]).includes("value")) {
                    if (attribute[0].value === "field-content") {
                        let a = buildingObj.childNodes[0].value;
                        return a;
                    }
                }
            }
        } else if (Object.keys(buildingObj).includes("childNodes")) {
            let nodes = buildingObj.childNodes;
            for (let node of nodes) {
                result += this.findFullname(node);
            }
        }
        return result;
    }

    public static findRoomInfo(buildingObj: any, shortName: string, address: string,
                               fullname: string): string[] {
        let result: string[] = [];
        let Rnumber: string[] = [];
        let Rhref: string[] = [];
        let Rseat: number[] = [];
        let Rfurniture: string[] = [];
        let Rtype: string[] = [];
        for (let input of buildingObj.childNodes) {
            if (input.nodeName === "tr") {
                let trArray = input.childNodes;
                for (let node of trArray) {
                    if (node.nodeName === "td") {
                        let attribute = node.attrs;
                        if (attribute[0].value === "views-field views-field-field-room-number") {
                            Rnumber.push(node.childNodes[1].childNodes[0].value);
                            Rhref.push(node.childNodes[1].attrs[0].value);
                        }
                        if (attribute[0].value === "views-field views-field-field-room-capacity") {
                            Rseat.push(+node.childNodes[0].value.trim());
                        }
                        if (attribute[0].value === "views-field views-field-field-room-furniture") {
                            Rfurniture.push(node.childNodes[0].value.trim());
                        }
                        if (attribute[0].value === "views-field views-field-field-room-type") {
                            Rtype.push(node.childNodes[0].value.trim());
                        }
                    }
                }
            }
        }
        for (let index in Rnumber) {
            let rooms: any = {};
            rooms.fullname = fullname;
            rooms.shortname = shortName;
            rooms.number = Rnumber[index];
            rooms.name = rooms.shortname + "_" + rooms.number;
            rooms.address = address;
            rooms.seats = Rseat[index];
            rooms.type = Rtype[index];
            rooms.furniture = Rfurniture[index];
            rooms.href = Rhref[index];
            result.push(rooms);
        }
        return result;
    }

    public static getNodeInfo(node: any, name: string): any {
        if (node.hasOwnProperty("nodeName")) {
            if (node.nodeName === name) {
                return node;
            } else {
                if (node.hasOwnProperty("childNodes")) {
                    {
                        let children = node.childNodes;
                        for (let child of children) {
                            let target = this.getNodeInfo(child, name);
                            if (target !== false) {
                                return target;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    public static findBuildingAddress(indexObj: any): any {
        let result: string[] = [];
        for (let input of indexObj.childNodes) {
            if (input.nodeName === "tr") {
                let trArray = input.childNodes;
                for (let node of trArray) {
                    if (node.nodeName === "td") {
                        let attribute = node.attrs;
                        if (attribute[0].value === "views-field views-field-field-building-address") {
                            result.push(node.childNodes[0].value.trim());
                            // Log.trace(node.childNodes[0].value.trim());
                        }
                    }
                }
            }
        }
        return result;
    }
    public static findIndexArray(indexObj: any): any {
        let result: any[] = [];
        for (let input of indexObj.childNodes) {
            if (input.nodeName === "tr") {
                let trArray = input.childNodes;
                for (let node of trArray) {
                    if (node.nodeName === "td") {
                        let attribute = node.attrs;
                        if (attribute[0].value === "views-field views-field-field-building-code") {
                            result.push(node.childNodes[0].value.trim());
                            // Log.trace(node.childNodes[0].value.trim());
                        }
                    }
                }
            }
        }
        return result;
    }
}
