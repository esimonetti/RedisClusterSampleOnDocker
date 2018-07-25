// Enrico Simonetti
// enricosimonetti.com
// 2018-07-25
//
// Tool to help verify with multiple sentinels which node is Redis' master node
//
// Usage: telnet localhost 9999\ncheckmaster\n

var net = require('net');
var redisClusterUtils = require('./redis-cluster-utils');

var cluster = 'redis-ha-cluster';
var quorum = 2;

var sentinels = [
    { host: 'sentinel1', port: 26379 },
    { host: 'sentinel2', port: 26379 },
    { host: 'sentinel3', port: 26379 }
]

var HOST = '0.0.0.0';
var PORT = 9999;

net.createServer(function(sock) {
    
    console.log('Connection open for: ' + sock.remoteAddress + ':' + sock.remotePort);
    var rc = new redisClusterUtils(sentinels, quorum);
    rc.shuffleSentinels();

    sock.on('data', function(data) {

        console.log('Received data: ' + sock.remoteAddress + ': ' + data);

        if (data.toString().trim() == 'checkmaster') {
            for (var i = 0; i < sentinels.length; i++) {
                var sentinelDetails = rc.getNextSentinel();
                if (sentinelDetails) {
                    rc.connectAndCheckMaster(sentinelDetails, cluster, function(response) {
                        if (response && !rc.masterSent) {
                            rc.masterSent = true;
                            sock.write(response + '\n');
                            console.log('Master identified: ' + response);
                        }

                        if (rc.sentinelsResponsesReceived()) {
                            console.log('Closing connection, all responses received');
                            sock.destroy();
                        }
                    });
                }
            }
        } else {
            sock.write('The only command available is: "checkmaster", received: "' + data.toString().trim() + '" instead\n');
        }
    });

    sock.on('error', function(data) {
        console.log('Connection error: ' + sock.remoteAddress + ':' + sock.remotePort + ' :' + data);
    });
    
    sock.on('close', function(data) {
        console.log('Connection closed for: ' + sock.remoteAddress + ':' + sock.remotePort);
    });
    
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);
