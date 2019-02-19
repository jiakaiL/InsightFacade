/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        // TODO: implement!
        try {
            let request = new XMLHttpRequest();
            request.open("POST", "/query", true);

            request.setRequestHeader("Content-Type", "application/JSON");

            request.onload = function() {
                let result = JSON.parse(request.responseText);
                if (request.status === 200) {
                    fulfill(result);
                } else {
                    reject(result);
                }

            };

            request.onerror = function() {
                reject("The request failed");
            };

            request.send(JSON.stringify(query));
            // console.log("CampusExplorer.sendQuery not implemented yet.");
        } catch (e) {
            reject(e);
        }
    });
};
