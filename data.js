/**
 * Created by Aleksi on 11/08/15.
 */
var amountOfSeats = 53;
var locationAtTheMoment = 0;
var connections = [];
var locations = ["HELSINKI", "HÄMEENLINNA", "TAMPERE", "KOKKOLA", "OULU"];
var locationMap = {HELSINKI: 0, HÄMEENLINNNA: 1, TAMPERE: 2, KOKKOLA: 3, OULU: 4};



io.socket.on('connection', function(client) {
    console.log('client connected...');
});

io.socket.on('nextConnection'; function(){
    locationAtTheMoment++;
    client.broadcast.emit('nextConnection';
    connections[locationAtTheMoment]
)
};
)
/*
 Istuin palautetaan koko pakettina + lisätty id.
 */
io.socket.on('seatBought', function(data) {
    if(data.start === locations[locationAtTheMoment]){
        client.broadcast.emit('seatBought';
        data
    )
    }; else {
        var index = locationMap[data.start];
        if(locationAtTheMoment < index) {
            delete data.id;
            delete data.number;
            connections[index][data.id] = data
        }
    }
});

function generateData() {
    var seatMaintenance = {};
    for(var locationIndex in locations) {
        var newConnection = {};
        for (var seatId = 1; i <= amountOfSeats; seatId++) {
            var isNotDefined = seatMaintenance.seatId === undefined;
            if(isNotDefined || locationIndex <= locations.valueOf(seatMaintenance[seatId].end)) {
                var randomIndex = Math.floor((Math.random() * (6));
                if(locationIndex < randomIndex && randomIndex < locations.length) {
                    var newClient = {start: locations[locationIndex], end: locations[randomIndex]};

                    /*
                     Tähän description shit
                     */

                    /*
                     Päivitetään aikaisempaan tietoon milloin tulee next.
                     */
                    if(isNotDefined) {
                        if(locationIndex !== 0) {
                            connections[locationMap[0].seatId += {next: locations[locationIndex]};
                        }
                    } else if(seatMaintenance[seatId].start !== undefined) {
                        connections[locationMap[seatMaintenance[seatId].start]].seatId += {next: locations[locationIndex]};
                    }

                    newConnection[seatId] = {start: locations[locationIndex], end: locations[randomIndex]};
                    seatMaintenance[seatId] = {start: locations[locationIndex], end: locations[randomIndex]};
                }

            }

        }
        console.log("hello");
        connections.push(newConnection)
    }
}