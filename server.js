/**
 * Created by Chris on 11/1/14.
 */
var express = require("express");
var request = require("request-json");
var Firebase = require("firebase");

var app = express();


var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/client"));

app.post("/payments", function(req, res) {
    if (!req.body.card_hash) {
        res.status(400).send("Missing card_hash");
    } else {
        var guid = getGuid(req.body.card_hash, function(guid) {
            res.send("Guid: " + guid);
        });
        /*
        var transactionDetails = {
            "ip": req.body.ip,
            "user_id": "af00-bc14-1245",
            "amount": req.body.amount,
            "card_hash": req.body.card_hash
        };
        makeRequest(transactionDetails);
        */
    }

});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

function getGuid(card_hash, callback) {
    var userCollection = new Firebase("https://money2020-smu.firebaseio.com");
    var guid = null;
    console.log("Retrieving guid");
    userCollection.once("child_added", function(user) {
        var userData = user.val();
        if (userData.card_hash == card_hash) {
            console.log ("Found user hash: " + user.name());
            guid = user.name();
        }
    });

    userCollection.once("value", function(data) {
        if (guid == null) {
            guid = storeNewUser(userCollection, card_hash);
        }
        callback(guid);
    });
}

function storeNewUser(userCollection, card_hash) {
    console.log("Storing new user");
    var guid = require("node-uuid").v4();
    var data = {};
    data[guid] = {"card_hash": card_hash};
    userCollection.set(data);
    return guid;
}

function makeRequest(transactionDetails) {
    var url = "https://sandbox.feedzai.com/v1/";

    var client = request.newClient(url);
    client.setBasicAuth("0154461f5e54a48e000000007cdd36ea4f2aa524c602f58c97b9cc110267fa6a:", "");
    client.post("payments", { "ip": "212.10.114.18", "user_id": "af00-bc14-1245", "amount": 1150}, function(err, res, body) {
        if (err) {
            console.log(err);
        } else {
            console.log(res.statusCode);
            console.log(body);
        }
    });

    res.send("Done");
}