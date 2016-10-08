(function () {

    /**
     ** Hardcoded data
     **/

    var locations = ["HELSINKI", "HÄMEENLINNA", "TAMPERE", "KOKKOLA", "OULU"];

    var app = angular.module('train', ['ngAnimate']);

    /**
     ** Socket
     **/

    app.factory('socket', function ($rootScope) {
        var socket = io.connect();
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    });

    /**
     ** Main Controller
     **/


    app.controller('SeatsController', ['socket', '$timeout', function (socket, $timeout) {


        var controller = this;
        this.seats = {};
        this.locationIndex = 0;
        this.locationData = ["HELSINKI", "HÄMEENLINNA", "TAMPERE", "KOKKOLA", "OULU"];
        this.locationMap = {"HELSINKI": 0, "HÄMEENLINNA": 1, "TAMPERE": 2, "KOKKOLA": 3, "OULU": 4};
        this.idConverter = {};


        /* Starting a game
         **/

        this.nameSent = false;

        this.nameSentAndApproved = false;

        this.demoName = undefined;

        this.newDemo = undefined;

        this.startDemo = function() {
            console.log(this.newDemo);
            var name = this.demoName.trim().toLowerCase();
            if (name !== undefined && this.newDemo !== undefined) {
                this.nameSent = true;
                if(this.newDemo == "true") {
                    console.log(this.newDemo);
                    socket.emit('newDemo', name);
                } else {
                    socket.emit('signInDemo', name)
                }
            } else {
                this.demoName = undefined;
            }
        };


        socket.on('nameIsInUse', function () {
            console.log('demoNotFound');
            controller.nameSent = false;
            controller.demoName = undefined;
        });

        socket.on('demoNotFound', function() {
            console.log('demoNotFound');
            controller.nameSent = false;
            controller.demoName = undefined;
        });

        // Panel section

        this.summaryHasBeenClicked = false;
        this.tasksHasBeenClicked = false;

        this.updateSummaries = function () {
            for (var i in carriageArray) {
                this.carriageArray[i].summaries = [{description: "Tarvitaan vessasiivous"}, {description: "Vaunun lämpötila matala"}, {description: "Vaunun lämpötila korkea"}, {description: "Vaunusta kuuluu melua"}];
            }
        };
        /** Ehtoja, joiden avulla pystytään hallinoimaan datan generoimista ylläpitö
         **/

        this.demoIsGoing = false;
        /** Voidaan hyödyntää lisäämällä latausikkuna, kun serveri lähettää uutta dataa
         TODO: latausikkuna
         */

        this.dataHasGenerated = false;
        /** Estää, ettei pystytä aloittamaan uutta kierrosta, ennen kuin data on muutettu
         TODO: latausikkuna
         */


        this.pageIndex = 0;

        this.canContinue = function () {
            return this.demoIsGoing && this.dataHasGenerated;
        };


        this.dataRestart = function () {
            this.dataHasGenerated = false;
            this.closeFooter();
            this.demoIsGoing = false;
            this.booleanCarriages[this.pageIndex] = false;
            this.booleanCarriages[0] = true;
            this.pageIndex = 0;
            this.updateSummaries();
            var reset = {};
            for (var seat in this.seats) {
                if (this.seats.hasOwnProperty(seat)) {
                    reset[seat] = {id: seat, number: this.seats[seat].number};
                }

            }
            this.seats = {};
            this.seats = reset;
            this.locationIndex = 0;
            socket.emit('newData')
        };


        this.closeFooter = function () {
            this.isSelected = false;
        };


        this.generateSeatData = function (carriage, part, row, seat) {
            this.updateSummaries();
            if (carriage !== "t" + carriageIterator) {
                carriageIterator++;
                seatNumber = 0;
            }
            seatNumber++;
            var newId = nextId();
            if (this.seats.hasOwnProperty(newId)) {
                this.seats[newId]["number"] = seatNumber;
            } else {
                this.seats[newId] = {number: seatNumber};
            }
            this.idConverter[carriage + part + row + seat] = newId;
            this.carriageArray[carriageIterator - 1].seats.push(newId);

            return newId;
        };

        this.hasTask = function (id) {

            return this.seats !== undefined && this.seats[id]["description"] !== undefined && this.location === this.seats[id].start.toUpperCase();
        };


        this.selectedSeatIsEmpty = function () {
            if (this.selectedSeat === undefined) {
                return false;
            } else {
                return !(this.selectedSeat.start !== undefined && this.locationIndex >= this.locationMap[this.selectedSeat.start] && this.locationIndex < this.locationMap[this.selectedSeat.end]);
            }
        };

        this.buySeat = function (locatn) {
            if (locatn !== undefined) {
                this.selectedSeat.start = this.location;
                this.selectedSeat.end = locatn;
                socket.emit('seatBought', this.selectedSeat);
                this.closeFooter();
            }

        };

        this.launchDemo = function () {
            console.log("launchDemo");
            this.demoIsGoing = true;
            socket.emit('isGoing', true);
            this.moveDown(0);
        };

        this.location = locations[this.locationIndex];

        this.travelSection = locations[this.locationIndex] + " - " + locations[1];

        this.image = seatImages;

        this.carriagesImages = carriageImages;

        this.carriageArray = carriageArray;

        this.emptySeats = function (carriageNumber) {
            var seatList = carriageArray[carriageNumber - 1].seats;
            var result = 0;
            for (var i in seatList) {
                var sId = seatList[i];
                if (this.seats[sId].start === undefined || (this.locationIndex < valueOfLocation(this.seats[sId].start) || this.locationIndex >= valueOfLocation(this.seats[sId].end))) {
                    result++;
                }
            }
            return result;
        };

        /**
         Hyödynnetään paneelissa.
         **/

        this.tasks = function (carriageNumber) {
            var seatList = carriageArray[carriageNumber - 1].seats;
            var taskId = [];
            for (var i in seatList) {
                var sId = seatList[i];
                if (this.seats[sId].start !== undefined && this.locationIndex === valueOfLocation(this.seats[sId].start) && this.seats[sId].description !== undefined) {
                    taskId.push(sId);
                }
            }
            return taskId;
        };

        this.carriageHasTasks = function (carriageNumber) {
            var r = this.tasks(carriageNumber);
            return r.length !== 0;
        };

        function valueOfLocation(loctn) {
            if (loctn === undefined) {
                return undefined;
            } else {
                return locations.indexOf(loctn);
            }
        }
        this.selectedSeat = this.seats[2];


        this.seatSelect = function (carriage, part, row, seat) {

            var seatId = this.idConverter[carriage + part + row + seat];
            var bool = this.selectedSeat !== this.seats[seatId];
            this.selectedSeat = this.seats[seatId];
            console.log(this.selectedSeat);
            this.searchButtonIsClicked = false;
            this.searchingIsGoing = false;
            this.isSelected = !this.isSelected || bool;
        };

        this.changeLocation = function () {
            console.log("changeLocation clicked");
            this.updateSummaries();
            this.searchingIsGoing = false;
            // Estää sen ettei käyttäjä voi tuplaklikata.
            if (!this.dataHasGenerated) {
                console.log("et pysty siirtymään seuraavaan");

            } else {
                this.dataHasGenerated = false;
                if (this.locationIndex < (locations.length - 2)) {
                    socket.emit('nextConnection');
                    controller.locationIndex++;
                    controller.location = locations[controller.locationIndex];
                    controller.travelSection = locations[controller.locationIndex] + " - " + locations[controller.locationIndex + 1];
                } else if (this.locationIndex === (locations.length - 2)) {
                    this.travelSection = "Kiitos Matkasta!";
                    socket.emit('nextConnection');
                    controller.dataRestart();
                }
            }
        };

        this.isSelected = false;

        this.isBooked = function (carriage, part, row, seat) {
            var seatId = this.idConverter[carriage + part + row + seat];
            var result = this.seats[seatId].start !== undefined && this.locationIndex >= this.locationMap[this.seats[seatId].start] && this.locationIndex < this.locationMap[this.seats[seatId].end];

            return result;
        };

        // Palauttaa kaikki mahdolliset paikkakunnat mihin matkustaja voi ostaa lipun.

        this.canTravel = function (boolean) {
            var lastLocIndex = locations.length;
            if (this.locationIndex === lastLocIndex - 1) {
                return [];
            }

            console.log(this.locationIndex);
            if (this.selectedSeat !== undefined && this.selectedSeat.next !== undefined) {
                console.log(valueOfLocation(this.selectedSeat.next) < this.locationIndex);
            }

            if (!boolean && this.selectedSeat !== undefined && (this.selectedSeat.next !== undefined && valueOfLocation(this.selectedSeat.next) > this.locationIndex)) {
                lastLocIndex = valueOfLocation(this.selectedSeat.next) + 1;
            }
            var result = locations.slice(this.locationIndex + 1, lastLocIndex);
            return result;
        };


        this.searchingIsGoing = false;
        this.seatSection = [];

        this.searchButtonIsClicked = false;

        this.searchClicked = function () {
            this.searchButtonIsClicked = !this.searchButtonIsClicked;
        };


        this.showFreeSeatsFromCarriage = function (travelLocation) {

            var carriageId = "t" + this.pageIndex;
            var index = 0;
            for (var seatIndex in this.seatSection) {
                var seatId = this.seatSection[seatIndex];
                this.seats[seatId].isFreeFromSearchingRange = false;
            }
            this.seatSection = [];
            console.log(this.carriageArray);
            for (var i in this.carriageArray) {
                if (this.carriageArray[i].id === carriageId) {

                    this.seatSection = this.carriageArray[i].seats;
                    index = i;
                }
            }
            var counter = 0;

            for (var seatIndex in this.seatSection) {
                var seatId = this.seatSection[seatIndex];

                if ((this.seats[seatId].start == undefined || this.locationIndex >= valueOfLocation(this.seats[seatId].end)) && (this.seats[seatId].next === undefined || valueOfLocation(this.seats[seatId].next) <= this.locationIndex || valueOfLocation(travelLocation) <= valueOfLocation(this.seats[seatId].next))) {
                    this.seats[seatId].isFreeFromSearchingRange = true;
                    counter++;
                } else {
                    console.log(this.seats[seatId]);
                }
            }
            this.closeFooter();
            this.searchingIsGoing = true;
        };

        /**
         Tämän voisi muokkaa paremmaksi. Löytyy istuin objectilta suoraan tieto, joka ottaa huomioon searchingIsGoing
         **/

        this.isValid = function (seatId) {
            return this.searchingIsGoing && this.seats[seatId].isFreeFromSearchingRange;
        };

        this.nextIsDefined = function () {
            if (this.selectedSeat === undefined) {
                return false;
            } else {
                return this.selectedSeat.next !== undefined && valueOfLocation(this.selectedSeat.next) > this.locationIndex;
            }
        };

        /**
         Notification window
         **/

        this.notificationDescriptions = [];
        /**
         Serveri lähettää yksittäisen notificaation
         **/
        socket.on("newNotification", function (data) {
            console.log('newNotification ' + data);
            if (data !== undefined && data.description !== undefined) {
                data["visible"] = true;
                $timeout(
                    function () {
                        data.visible = false;
                        console.log('Notification end');
                    }, 15000);
                controller.notificationDescriptions.push(data);
            }
        });


        /**
         Vaunusta toiseen liikkuminen
         **/


        this.booleanCarriages = [true, false, false, false, false];

        this.isNotLastCarriage = function (index) {
            return index < this.booleanCarriages.size;
        };

        this.moveDown = function (index) {
            this.searchingIsGoing = false;
            this.pageIndex++;
            this.closeFooter();
            this.booleanCarriages[index] = false;
            this.booleanCarriages[index + 1] = true;
        };

        this.moveUp = function (index) {
            this.searchingIsGoing = false;
            this.closeFooter();
            this.pageIndex--;
            this.booleanCarriages[index] = false;
            this.booleanCarriages[index - 1] = true;
        };

        this.carriageSelected = function (index) {
            console.log("carriageSelected");
            this.searchingIsGoing = false;
            this.closeFooter();
            this.booleanCarriages[index] = true;
            this.booleanCarriages[this.pageIndex] = false;
            this.pageIndex = index;

        };

        this.nextCarriage = function (index) {
            return index !== this.booleanCarriages.length - 2;
        };

        /* Sokettikomennot
         **/

        /** Lähettää missä kohta junan reittiä olemme
         */

        socket.on("locationIndex", function (data) {
            console.log('locationIndex');
            controller.locationIndex = data;
            if (data < (locations.length - 2)) {
                controller.locationIndex = data;
                controller.location = locations[controller.locationIndex];
                controller.travelSection = locations[controller.locationIndex] + " - " + locations[controller.locationIndex + 1];
            } else {
                controller.booleanCarriages[0] = true;
                controller.booleanCarriages[controller.pageIndex] = false;
                controller.demoIsGoing = false;
                controller.travelSection = "Kiitos matkasta!";
                controller.closeFooter();
                controller.pageIndex = 0;
            }
        });

        /** Serveri lähettää käyttäjälle setin dataa
         TODO: Kun seatData lähetys on valmis annetaan käyttäjälle vaihtoehtoja
         */


        socket.on("seatData", function (data) {
            console.log("SeatData");
            controller.nameSentAndApproved = true;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    for (prop in data[key]) {
                        if (data[key].hasOwnProperty(prop)) {
                            //console.log(key);
                            //console.log(controller.seats[key]);
                            //console.log(prop);
                            controller.seats[key][prop] = data[key][prop];
                        }
                    }
                }
            }
            controller.closeFooter();
            controller.dataHasGenerated = true;
        });

        /** Serveri lähettää uuden setin dataa Sama kuin ylempi, mutta client-side muuttaa locationIndexiä
         */

        socket.on('nextConnection', function (data) {
            controller.nameSentAndApproved = true;
            console.log("nextConnection");
            controller.updateSummaries();
            controller.dataHasGenerated = false;
            controller.locationIndex++;
            controller.location = locations[controller.locationIndex];
            controller.travelSection = locations[controller.locationIndex] + " - " + locations[controller.locationIndex + 1];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    for (var prop in data[key]) {
                        if (data[key].hasOwnProperty(prop)) {
                            if (controller.seats[key].description !== undefined) {

                                controller.seats[key].description = undefined
                            }
                            controller.seats[key][prop] = data[key][prop];
                        }
                    }
                }
            }

            controller.dataHasGenerated = true;

        });


        socket.on('seatBought', function (data) {
            console.log('seatBought');
            controller.seats[data.id] = data;
        });

        socket.on('isGoing', function (data) {
            console.log("isgoing");
            if (data) {
                controller.demoIsGoing = true;
            } else {
                this.demoIsGoing = false;
                controller.dataRestart();
            }
        });


    }]);


    /**
     * SeatDatageneation helper
     * */

    var seatNumber = 0;
    var carriageIterator = 1;
    var iteratorId = 0;

    function nextId() {
        iteratorId++;
        return iteratorId;
    }

    /**
     * Train Structure
     * */

    //Carriage 1
    var row1 = ["A"];
    var row2 = ["A", "B"];
    var row3 = ["A", "B", "C"];
    var row4 = ["A", "B", "C", "D"];

    var c1p1 = {id: "p1", size: new Array(1), row: row2};
    var c1p2 = {id: "p2", size: new Array(13), row: row4};
    var c1p3 = {id: "p3", size: new Array(3), row: row3};

    var c1Parts = [c1p1, c1p2, c1p3];

    var t1 = {
        id: "t1",
        parts: c1Parts,
        seats: [],
        summaries: [{description: "Vessa likainen"}, {description: "Vaunun lämpötila matala"}, {description: "Vaunun lämpötila korkea"}, {description: "Vaunusta kuuluu melua"}]
    };

    //Carriage 2

    var c2p1 = {id: "p1", size: new Array(20), row: row4};

    var c2Parts = [c2p1];

    var t2 = {
        id: "t2",
        parts: c2Parts,
        seats: [],
        summaries: [{description: "Vessa likainen"}, {description: "Vaunun lämpötila matala"}, {description: "Vaunun lämpötila korkea"}, {description: "Vaunusta kuuluu melua"}]
    };

    //carriage 3

    var c3p1 = {id: "p1", size: new Array(5), row: row2};
    var c3p2 = {id: "p2", size: new Array(1), row: row2};
    var c3p3 = {id: "p3", size: new Array(11), row: row4};

    var c3Parts = [c3p1, c3p2, c3p3];

    var t3 = {
        id: "t3",
        parts: c3Parts,
        seats: [],
        summaries: [{description: "Vessa likainen"}, {description: "Vaunun lämpötila matala"}, {description: "Vaunun lämpötila korkea"}, {description: "Vaunusta kuuluu melua"}]
    };

    //carriage 4

    var c4p1 = {id: "p1", size: new Array(1), row: row2};
    var c4p2 = {id: "p2", size: new Array(2), row: row3};
    var c4p3 = {id: "p3", size: new Array(2), row: row2};
    var c4p4 = {id: "p4", size: new Array(15), row: row4};

    var c4Parts = [c4p1, c4p2, c4p3, c4p4];

    var t4 = {
        id: "t4",
        parts: c4Parts,
        seats: [],
        summaries: [{description: "Vessa likainen"}, {description: "Vaunun lämpötila matala"}, {description: "Vaunun lämpötila korkea"}, {description: "Vaunusta kuuluu melua"}]
    };


    var carriageArray = [t1, t2, t3, t4];


    /** Image data TODO seatImages on pahasti hardcodattu.
     * */

    var seatImages = ["/images/red-seat.svg", "/images/green-seat.svg", "/images/siemens-logo.png", "/images/menu.jpg"];

    var carriageImages = ["/images/carriage_fix_1.svg", "/images/carriage_fix_2.svg", "/images/carriage_fix_3.svg", "/images/carriage_fix_4.svg"];

})();
