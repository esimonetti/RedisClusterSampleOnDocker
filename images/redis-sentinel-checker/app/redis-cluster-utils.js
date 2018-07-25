// Enrico Simonetti
// enricosimonetti.com
// 2018-07-25
//
// Tool to help verify with multiple sentinels which node is Redis' master node

var redis = require('ioredis');
var shuffle = require('shuffle-array');

function redisClusterUtils(sentinelsList, quorum) {

    this.masterSent = false;
    this.quorum = quorum;
    this.sentinels = sentinelsList || [];
    this.mastersIps = [];
    this.sentinelsQueried = {};

    this.lastSentinelIndex = -1;

    this.shuffleSentinels = function() {
        shuffle(this.sentinels);
    };

    this.getNextSentinel = function() {
        if (this.lastSentinelIndex < (sentinelsList.length - 1)) {
            this.lastSentinelIndex++;
            return sentinelsList[this.lastSentinelIndex];
        } else {
            return false;
        }
    };

    this.getRandomSentinel = function() {
        return sentinelsList[Math.floor(Math.random() * sentinels.length)];
    };

    this.connectToSentinel = function(sentinelDetails, callback) {
        var self = this;
        var sen = new redis(sentinelDetails);
        sen.on('error', function(error) {
            console.log('Error for sentinel: ' + sentinelDetails.host);
            // mark errors as completed
            self.sentinelsQueried[sentinelDetails.host + ':' + sentinelDetails.port].completed = 1;
            sen.disconnect();
            callback(false);
        });

        sen.on('ready', function() {
            callback(sen);
        });
    };

    this.sentinelsResponsesReceived = function() {
        // if we have a quorum, dont check, just return true
        if (this.checkMasterQuorum()) {
            return true;
        }

        var responses = 0;
        for (var key in this.sentinelsQueried) {
            if (this.sentinelsQueried[key].completed) {
                responses++;
            } else {
                // still in progress
                return false;
            }

            if (responses == Object.keys(this.sentinelsQueried).length) {
                return true;
            }
        }
        return false;
    };

    this.checkMaster = function(sen, clusterName, sentinelDetails, callback) {
        var self = this;
        if (sen) {
            sen.sentinel('get-master-addr-by-name', clusterName, function(error, result) {
                sentinelDetails.completed = 1;
                self.sentinelsQueried[sentinelDetails.host + ':' + sentinelDetails.port] = sentinelDetails;

                if (error) {
                    callback(false);
                } else {
                    self.mastersIps.push(result[0]);
                    self.checkMasterQuorumWithCallback(callback);
                }
                // disconnecting
                sen.disconnect();
            });
        } else {
            self.checkMasterQuorumWithCallback(callback);
        }
    };

    this.checkMasterQuorum = function() {
        var quorumCalculation = {};
        if (this.mastersIps.length >= this.quorum) {
            var counter = 1;
            for (var i = 0; i < this.mastersIps.length; i++) {
                if (!quorumCalculation[this.mastersIps[i]]) {
                    quorumCalculation[this.mastersIps[i]] = 1;
                } else {
                    quorumCalculation[this.mastersIps[i]]++;
                    if (quorumCalculation[this.mastersIps[i]] >= this.quorum) {
                        return this.mastersIps[i];
                    }
                }
            }

            return false;
        } else {
            return false;
        }
    };

    this.checkMasterQuorumWithCallback = function(callback) {
        var master = this.checkMasterQuorum();
        if (master) {
            callback(master);
        } else {
            callback(false);
        }
    };

    this.connectAndCheckMaster = function(sentinelDetails, clusterName, callback) {
        var self = this;

        sentinelDetails.completed = 0;
        self.sentinelsQueried[sentinelDetails.host + ':' + sentinelDetails.port] = sentinelDetails;

        this.connectToSentinel(sentinelDetails, function(sen) {
            // even when a node connection cannot be estabilished, check for master quorum
            self.checkMaster(sen, clusterName, sentinelDetails, callback);
        });
    };
};

module.exports = redisClusterUtils;
