/**
 * Created by Chris on 11/1/14.
 */
var express = require("express");
var request = require("request-json");
var Firebase = require("firebase");
var ref = new Firebase("https://money2020-smu.firebaseio.com");
var _ = require("lodash");

var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/client"));

app.post("/payments", function(req, res) {
    if (!req.body.card_hash) {
        res.status(400).send("Missing card_hash");
    } else {
        getGuid(req.body, function(guid) {
            req.body.user_id = guid;
            makeFeedzaiRequest(req.body, function(result) {
                res.send(result);
            });
        });
    }

});

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});





function getGuid(params, callback) {
    var card_hash = params.card_hash;
    var user_fullname = params.user_fullname;
    var userCollection = ref.child("users");
    var GUID = null;
    console.log("Retrieving guid");

    ref.once("value", function(userList) {
        if (userList.val() == null) {
            GUID = storeNewUser(card_hash, userCollection);
            userList = {};
            userList[GUID] = {card_hash: [card_hash]};
        } else {
            userList = userList.val().users;
        }
        _.forOwn(userList, function(userData, guid) {
            if (userData.card_hash.indexOf(card_hash) > -1) {
                console.log ("Found user hash: " + guid);
                GUID = guid;
                if (user_fullname != null && !userData.user_fullname) {
                    updateUserName(GUID, user_fullname, userCollection);
                }
                addIPAddress(GUID, params.ip, userData, userCollection);
                callback(GUID);
            }
        });
    });


    /*
    userCollection.on("child_added", function(user) {
        var userData = user.val();

        if (userData.card_hash.indexOf(card_hash) > -1) {
            console.log ("Found user hash: " + user.name());
            guid = user.name();
            if (user_fullname != null && !userData.user_fullname) {
                updateUserName(guid, user_fullname, userCollection);
            }
            addIPAddress(guid, params.ip, userData, userCollection);
            callback(guid);
        }
    });

    userCollection.once("value", function(data) {
        if (guid == null) {
            guid = storeNewUser(card_hash, userCollection);

        }
    });*/
}

function storeNewUser(card_hash, userCollection) {
    var guid = require("node-uuid").v1();
    console.log("Storing new user: " + guid);
    userCollection.child(guid).update({"card_hash": [card_hash]});
    return guid;
}

function updateUserName(guid, user_fullname, userCollection) {
    console.log("Updating user's full name");
    userCollection.child(guid).update({user_fullname: user_fullname});
}

function addIPAddress(guid, ip, userData, userCollection) {

    console.log("Trying to add current IP address:" + ip);
    var ipAddresses = userData.ipAddresses ? userData.ipAddresses : [];
    if (ipAddresses.indexOf(ip) == -1) {
        console.log("New IP found, adding");
        ipAddresses.push(ip);
        userCollection.child(guid).update({ipAddresses: ipAddresses});
    }
}

function makeFeedzaiRequest(transactionDetails, callback) {
    var url = "https://sandbox.feedzai.com/v1/";

    var client = request.newClient(url);
    client.setBasicAuth("0154461f5e54a48e000000007cdd36ea4f2aa524c602f58c97b9cc110267fa6a:", "");
    client.post("payments", transactionDetails, function(err, res, body) {
        if (err) {
            console.log(err);
            callback("Error: " + err);
        } else {
            console.log(res.statusCode);
            console.log(body);
            callback(body);
        }
    });

}