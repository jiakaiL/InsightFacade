import {expect} from "chai";

import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the JSON schema described in test/query.schema.json
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: string | string[];
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the Before All hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        courses2: "./test/data/courses2.zip",
        invalidfile: "./test/data/invalid.txt",
        invalid_content: "./test/data/invalid_content.zip",
        no_course: "./test/data/no_course.zip",
        nosection: "./test/data/nosection.zip",
        onesection: "./test/data/onesection.zip",
        notunderName_courses: "./test/data/notunderName_courses.zip",
        rooms: "./test/data/rooms.zip"
        // add another zip file
    };

    let insightFacade: InsightFacade;
    let datasets: { [id: string]: string };

    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToLoad)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return {[Object.keys(datasetsToLoad)[i]]: buf.toString("base64")};
            });
            datasets = Object.assign({}, ...loadedDatasets);
            expect(Object.keys(datasets)).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });
    it("Should list an empty dataset", async () => {
        let response: InsightDataset[];
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([]);
        }
    });
    it("1. Should add dataset rooms", async () => {
        const id: string = "rooms";
        let response: string[];

        try {
            response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms);
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([id]);
        }
    });
    it("Should list rooms dataset", async () => {
        let response: InsightDataset[];
        let aDataset = {
            id: "rooms",
            kind: InsightDatasetKind.Rooms,
            numRows: 364,
        };
        try {
            response = await insightFacade.listDatasets();
        } catch (err) {
            response = err;
        } finally {
            expect(response).to.deep.equal([aDataset]);
        }
    });
    // it("1. Should remove dataset rooms", async () => {
    //     const id: string = "rooms";
    //     let response: string;
    //
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(id);
    //     }
    // });
    // ======================================
    // D1 test
    // =======================================
    // it("1. Should not add unzip file's name is not courses", async () => {
    //     const id: string = "notunderName_courses";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // before 1: removeData: no data added yet -> throw NOTFOUNDERR
    // it("should throw NotFoundError, try to remove data that was not added before", async () => {
    //     const id: string = "courses";
    //     let response: string;
    //
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(NotFoundError);
    //     }
    // });
    //
    // // 1. listDataset with empty dataset
    // it("Should list an empty dataset", async () => {
    //     let response: InsightDataset[];
    //     try {
    //         response = await insightFacade.listDatasets();
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([]);
    //     }
    // });
    // // 5. addDataset: adding another dataset["courses"] already created another zip file courses2.zip
    // it("Should add another different valid dataset so return [id,id2]", async () => {
    //     const id: string = "onesection";
    //     let response: string[];
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([id]);
    //     }
    // });
    // // 4.addDataset trying to add dataset["onesection"] again which will trigger err
    // it("Should throw err cuz trying to add a dataset that is added already", async () => {
    //     const id: string = "onesection";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // it("Should add another different valid dataset so return [id,id2]", async () => {
    //     const id: string = "courses2";
    //     let response: string[];
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(["onesection", id]);
    //     }
    // });
    // // 6. addDataset: when id is null
    // it("Should throw InsightError cuz null id", async () => {
    //     let response: string[];
    //     try {
    //         response = await insightFacade.addDataset(null, datasets["courses"], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 7. addDataset: when id is undefined
    // it("Should throw InsightError cuz undefined id", async () => {
    //     let response: string[];
    //     try {
    //         response = await insightFacade.addDataset(undefined, datasets["courses"], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 8. addDataset: when dataset is null
    // it("should throw InsightError cuz adding a null type datasets", async () => {
    //     const id: string = "courses2";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, null, InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 9. addDataset: when dataset is undefined
    // it("should throw InsightError cuz adding a undefined type datasets", async () => {
    //     const id: string = "courses2";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, undefined, InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 10. addDataset: when dataset is invalid file -> .txt
    // it("should throw InsightError cuz adding a dataset with invalid zipfile", async () => {
    //     const id: string = "invalidfile";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets["invalidfile"], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // // 11. addDataset: when type is null
    // it("should throw InsightError cuz adding a null type kind", async () => {
    //     const id: string = "courses2";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], null);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 12. addDataset: when type is undefined
    // it("should throw InsightError cuz adding an undefined type kind", async () => {
    //     const id: string = "courses2";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], undefined);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 13. listDataset: list two dataset added
    // it("Should show one dataset after addDataset", async () => {
    //     let aDataset = {
    //         id: "onesection",
    //         kind: InsightDatasetKind.Courses,
    //         numRows: 12,
    //     };
    //     let bDataset = {
    //         id: "courses2",
    //         kind: InsightDatasetKind.Courses,
    //         numRows: 64612,
    //     };
    //     let response: InsightDataset[];
    //     try {
    //         response = await insightFacade.listDatasets();
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([aDataset, bDataset]);
    //     }
    // });
    //
    // // 14. removeDataset: remove dataset["courses2"]
    // it("Should remove the courses dataset", async () => {
    //     const id: string = "courses2";
    //     let response: string;
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(id);
    //     }
    // });
    //
    // // 15. listDataset: since dataset[id2] is just removed, so dataset["section"] will be listed here
    // it("Should show only one dataset in the array", async () => {
    //     let aDataset = {
    //         id: "onesection",
    //         kind: InsightDatasetKind.Courses,
    //         numRows: 12,
    //     };
    //     let response: InsightDataset[];
    //     try {
    //         response = await insightFacade.listDatasets();
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal([aDataset]);
    //     }
    // });
    //
    // // 16. removeDataset: try to remove null id -> InsightError
    // it("Should give InsightError cuz try to remove null id", async () => {
    //     let response: string;
    //     try {
    //         response = await insightFacade.removeDataset(null);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 17. removeDataset: try to remove undefined id -> InsightError
    // it("Should give InsightError cuz try to remove null id", async () => {
    //     let response: string;
    //     try {
    //         response = await insightFacade.removeDataset(undefined);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 18. addDataset: when content inside zip file is invalid
    // it("should throw InsightError cuz invalid content in zip file", async () => {
    //     const id: string = "invalid_content";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets["invalid_content"], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 19. addDataset: when no valid course section is in the dataset
    // it("should throw InsightError cuz no valid course", async () => {
    //     const id: string = "no_courses";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    //
    // // 20. removeDataset: remove dataset["courses"]
    // it("Should remove the courses dataset1", async () => {
    //     const id: string = "courses";
    //     let response: string;
    //     try {
    //         response = await insightFacade.removeDataset(id);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(NotFoundError);
    //     }
    // });
    // // 21. addDataset: when dataset does not have valid section
    // it("should throw InsightError cuz no valid course section", async () => {
    //     const id: string = "nosection";
    //     let response: string[];
    //
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.be.instanceOf(InsightError);
    //     }
    // });
    // it("Should add another different valid dataset so return [id,id2]", async () => {
    //     const id: string = "courses2";
    //     let response: string[];
    //     try {
    //         response = await insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
    //     } catch (err) {
    //         response = err;
    //     } finally {
    //         expect(response).to.deep.equal(["onesection", id]);
    //     }
    // });
});

// This test suite dynamically generates tests from the JSON files in test/queries.
// You should not need to modify it; instead, add additional files to the queries directory.
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Create a new instance of InsightFacade, read in the test queries from test/queries and
    // add the datasets specified in datasetsToQuery.
    before(async function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = await TestUtil.readTestQueries();
            expect(testQueries).to.have.length.greaterThan(0);
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${JSON.stringify(err)}`);
        }

        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        } finally {
            expect(insightFacade).to.be.instanceOf(InsightFacade);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Fail if there is a problem reading ANY dataset.
        try {
            const loadDatasetPromises: Array<Promise<Buffer>> = [];
            for (const [id, path] of Object.entries(datasetsToQuery)) {
                loadDatasetPromises.push(TestUtil.readFileAsync(path));
            }
            const loadedDatasets = (await Promise.all(loadDatasetPromises)).map((buf, i) => {
                return { [Object.keys(datasetsToQuery)[i]]: buf.toString("base64") };
            });
            expect(loadedDatasets).to.have.length.greaterThan(0);

            const responsePromises: Array<Promise<string[]>> = [];
            const datasets: { [id: string]: string } = Object.assign({}, ...loadedDatasets);
            for (const [id, content] of Object.entries(datasets)) {
                responsePromises.push(insightFacade.addDataset(id, content, InsightDatasetKind.Courses));
            }

            // This try/catch is a hack to let your dynamic tests execute even if the addDataset method fails.
            // In D1, you should remove this try/catch to ensure your datasets load successfully before trying
            // to run you queries.
            try {
                const responses: string[][] = await Promise.all(responsePromises);
                responses.forEach((response) => expect(response).to.be.an("array"));
            } catch (err) {
                Log.warn(`Ignoring addDataset errors. For D1, you should allow errors to fail the Before All hook.`);
            }
        } catch (err) {
            expect.fail("", "", `Failed to read one or more datasets. ${JSON.stringify(err)}`);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    it("Should run test queries", () => {
        describe("Dynamic InsightFacade PerformQuery tests", () => {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, async () => {
                    let response: any[];

                    try {
                        response = await insightFacade.performQuery(test.query);
                    } catch (err) {
                        response = err;
                    } finally {
                        if (test.isQueryValid) {
                            expect(response).to.deep.equal(test.result);
                        } else {
                            expect(response).to.be.instanceOf(InsightError);
                        }
                    }
                });
            }
        });
    });
});
