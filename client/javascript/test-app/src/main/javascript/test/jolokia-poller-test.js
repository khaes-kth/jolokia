/*
 * Copyright 2009-2010 Roland Huss
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Test for testing the poller

$(document).ready(function() {

    module("Poller");
    asyncTest("Simple registered request",function() {
        var counter1 = 1,
            counter2 = 1;
        var j4p = new Jolokia("/jolokia");

        j4p.registerRequest(function(resp) {
            counter1++;
        },{ type: "READ", mbean: "java.lang:type=Memory", attribute: "HeapMemoryUsage", path: "used"});
        j4p.registerRequest(function(resp) {
            counter2++;
        },{ type: "READ", mbean: "java.lang:type=Memory", attribute: "HeapMemoryUsage", path: "max"});

        ok(!j4p.isRunning(),"Poller should not be running");
        j4p.start(100);
        ok(j4p.isRunning(),"Poller should be running");
        setTimeout(function() {
            j4p.stop();
            ok(!j4p.isRunning(),"Poller should be stopped");
            equals(counter1,3,"Request should have been called 3 times");
            equals(counter2,3,"Request should have been called 3 times");
            start();
        },250);
    });

    asyncTest("Starting and stopping",function() {
        var j4p = new Jolokia("/jolokia");
        var counter = 1;

        j4p.registerRequest(function(resp) {
            counter++;
            },{ type: "READ", mbean: "java.lang:type=Memory", attribute: "HeapMemoryUsage", path: "used"},
            { type: "SEARCH", mbean: "java.lang:type=*"});
        j4p.start(100);
        setTimeout(function() {
            j4p.stop();
            setTimeout(function() {
                equals(counter,4,"Request should have been called 4 times")
                ok(!j4p.isRunning(),"Poller should be stopped");
                start();
            },300);
        },350);

    });

    asyncTest("Registering- and Deregistering",function() {
        var j4p = new Jolokia("/jolokia");
        var counter1 = 1,
            counter2 = 1;
        var id1 = j4p.registerRequest(function(resp) {
            counter1++;
        },{ type: "READ", mbean: "java.lang:type=Memory", attribute: "HeapMemoryUsage", path: "used"});
        var id2 = j4p.registerRequest(function(resp) {
            counter2++;
        },{ type: "EXEC", mbean: "java.lang:type=Memory", operation: "gc"});
        j4p.start(200);
        setTimeout(function() {
            equals(counter1,3,"Req1 should be called 3 times");
            equals(counter2,3,"Req2 should be called 3 times");
            j4p.unregisterRequest(id2);
            setTimeout(function() {
                j4p.stop();
                equals(counter1,4,"Req1 should continue to be requested, now for 4 times");
                equals(counter2,3,"Req2 stays at 3 times since it was unregistered");
                start();
            },300);
        },500)
    });

    asyncTest("Multiple requests",function() {
        var j4p = new Jolokia("/jolokia");
        var counter = 1;
        j4p.registerRequest(function(resp1,resp2,resp3,resp4) {
                equals(resp1.status,200);
                equals(resp2.status,200);
                ok(resp1.value > 0);
                ok(resp2.value > 0);
                equals(resp1.request.attribute,"HeapMemoryUsage");
                equals(resp2.request.attribute,"ThreadCount");
                equals(resp3.status,404);
                ok(!resp4);
                counter++
            },{ type: "READ", mbean: "java.lang:type=Memory", attribute: "HeapMemoryUsage", path: "used"},
            { type: "READ", mbean: "java.lang:type=Threading", attribute: "ThreadCount"},
            { type: "READ", mbean: "bla.blu:type=foo", attribute: "blubber"});
        j4p.start(200);
        setTimeout(function() {
            j4p.stop();
            equals(counter,3,"Req should be called 3 times");
            start();
        },500);
    })

});
