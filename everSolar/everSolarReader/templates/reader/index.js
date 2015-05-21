
function init() {

    $("#days").change(update);
    update();
}

function update() {

    $.ajax({
        url: "/data",
        type: "GET",
        ContentType: "application/json"
    }).success(function(data) {
        diagram(data);
    }).error(function(data) {});

    $.ajax({
        url: "/total",
        type: "GET",
        ContentType: "application/json"
    }).success(function(data) {
        total(data);
        totalScatter(data)
    }).error(function(data) {});

    $.ajax({
        url: "/diff30",
        type: "GET",
        ContentType: "application/json"
    }).success(function(data) {
        scatter30(data);
    }).error(function(data) {});

    $.ajax({
        url: "/diff60",
        type: "GET",
        ContentType: "application/json"
    }).success(function(data) {
        diff(data);
        scatter60(data);
    }).error(function(data) {});

    $.ajax({
        url: "/diff180",
        type: "GET",
        ContentType: "application/json"
    }).success(function(data) {
        scatter180(data);
        diffFullData(data);
    }).error(function(data) {});
}


function hasDataTime(data, d, deadTime) {
    for (var i = 0; i < data.length; i++) {
        var time = data[i].time;
        if (time > d) {
            if (i > 0) {
                var before = data[-1];
                if (d - before < deadTime) {
                    return true;
                }
            }
            if (time - d < deadTime) {
                return true;
            }
            return false;
        }
    }

    if (d - data[data.length] < deadTime) {
        return true;
    } else {
        return false;
    }
}

function hasData(data, d) {
    return hasDataTime(data, d, 5400000);
}

function getClouds(weather, time) {

    for(var i = 0; i < weather.length; i++) {
        var clouds = weather[i];
        if (clouds.time >= time) {
            if(i != 0) {
                return weather[i-1].clouds;
            } else {
                return weather[0].clouds;
            }
        }
    }
}

function notNight(time) {
    return (5 < time.getHours() && time.getHours() < 21)
}

function filter(data) {
    var res = [];

    var d = new Date();
    d.setDate(d.getDate() - $("#days").val());

    for (var i = 0; i < data.length; i++ ) {
        var e = data[i]
        if ((new Date(e.time)) > d) {
            res.push(e);
        }
    }

    return res;
}

function diagram(data) {
    var openWeather = filter(data.openWeather);
    var everSolar = filter(data.everSolar);
    var optimal = filter(data.optimal);

    $("#Diagram").empty();
    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var effectColor = "green";
    var weatherColor = "red";
    var optimalColor = "blue";

    var timeStart = Math.min(d3.min(openWeather, function(d) {
                                 return d.time;
                             }), d3.min(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeEnd = Math.max(d3.max(openWeather, function(d) {
                                 return d.time;
                             }), d3.max(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeScale = d3.time.scale();
    timeScale.range([0, width]);
    timeScale.domain([new Date(timeStart), new Date(timeEnd)]);

    var effectScale = d3.scale.linear();
    effectScale.range([height, 0]);
    effectScale.domain([0, d3.max(everSolar, function(d) {
                               return d.output;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([height, 0]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var timeAxis = d3.svg.axis()
                   .scale(timeScale)
                   .ticks(d3.time.day, 1)
                   .orient("buttom");

    var effectAxis = d3.svg.axis()
                     .scale(effectScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("right");
    
    var effectLine = d3.svg.line()
                     .x(function(d) { return timeScale(new Date(d.time)); })
                     .y(function(d) { return effectScale(d.output); })
                     .defined(function(d) {
                         return hasData(everSolar, d.time);
                     });

    var optimalLine = d3.svg.line()
                     .x(function(d) { return timeScale(new Date(d.time)); })
                     .y(function(d) { return effectScale(d.max); })
                     .defined(function(d) {
                         return hasData(optimal, d.time);
                     });

    var weatherLine = d3.svg.line()
                      .x(function(d) { return timeScale(new Date(d.time)); })
                      .y(function(d) { return weatherScale(d.clouds); })
                      .defined(function(d) {
                          var bool = (hasData(openWeather, d.time) && notNight(new Date(d.time)))
                          return bool;
                      });

    var svg = d3.select("#Diagram").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(timeAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Time");

    svg.append("g")
    .attr("class", "y axis")
    .style("fill", effectColor)
    .call(effectAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Effect");

    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .style("fill", weatherColor)
    .call(weatherAxis)
    .append("text")
    .attr("y", -10)
    .text("Clouds");

    svg.append("path")
    .attr("class", "line")
    .style("stroke", weatherColor)
    .attr("d", weatherLine(openWeather));

    svg.append("path")
    .attr("class", "line")
    .style("stroke", effectColor)
    .attr("d", effectLine(everSolar));

    svg.append("path")
    .attr("class", "line")
    .style("stroke", optimalColor)
    .attr("d", optimalLine(optimal));

}


function diffFullData(data) {
    var openWeather = filter(data.openWeather);
    var everSolar = filter(data.diff);

    $("#DiffFullData").empty();
    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var diffColor = "green";
    var weatherColor = "red";

    var timeStart = Math.min(d3.min(openWeather, function(d) {
                                 return d.time;
                             }), d3.min(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeEnd = Math.max(d3.max(openWeather, function(d) {
                                 return d.time;
                             }), d3.max(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeScale = d3.time.scale();
    timeScale.range([0, width]);
    timeScale.domain([new Date(timeStart), new Date(timeEnd)]);

    var diffScale = d3.scale.linear();
    diffScale.range([height, 0]);
    diffScale.domain([0, d3.max(everSolar, function(d) {
                               return d.diff;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([height, 0]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var timeAxis = d3.svg.axis()
                   .scale(timeScale)
                   .ticks(d3.time.day, 1)
                   .orient("buttom");

    var diffAxis = d3.svg.axis()
                     .scale(diffScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("right");
    
    var diffLine = d3.svg.line()
                     .x(function(d) { return timeScale(new Date(d.time)); })
                     .y(function(d) { return diffScale(d.diff); })
                     .defined(function(d) {
                         return hasDataTime(everSolar, d.time, 11000000);
                     });

    var weatherLine = d3.svg.line()
                      .x(function(d) { return timeScale(new Date(d.time)); })
                      .y(function(d) { return weatherScale(d.clouds); })
                      .defined(function(d) {
                          var bool = (hasData(openWeather, d.time) && notNight(new Date(d.time)))
                          return bool;
                      });

    var svg = d3.select("#DiffFullData").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(timeAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Time");

    svg.append("g")
    .attr("class", "y axis")
    .style("fill", diffColor)
    .call(diffAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Effect");

    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .style("fill", weatherColor)
    .call(weatherAxis)
    .append("text")
    .attr("y", -10)
    .text("Clouds");

    svg.append("path")
    .attr("class", "line")
    .style("stroke", weatherColor)
    .attr("d", weatherLine(openWeather));

    svg.append("path")
    .attr("class", "line")
    .style("stroke", diffColor)
    .attr("d", diffLine(everSolar));

}

function diff(data) {
    var openWeather = filter(data.openWeather);
    var everSolar = filter(data.diff);

    $("#Diff").empty();
    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var diffColor = "green";
    var weatherColor = "red";

    var timeStart = Math.min(d3.min(openWeather, function(d) {
                                 return d.time;
                             }), d3.min(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeEnd = Math.max(d3.max(openWeather, function(d) {
                                 return d.time;
                             }), d3.max(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeScale = d3.time.scale();
    timeScale.range([0, width]);
    timeScale.domain([new Date(timeStart), new Date(timeEnd)]);

    var diffScale = d3.scale.linear();
    diffScale.range([height, 0]);
    diffScale.domain([0, d3.max(everSolar, function(d) {
                               return d.diff;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([height, 0]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var timeAxis = d3.svg.axis()
                   .scale(timeScale)
                   .ticks(d3.time.day, 1)
                   .orient("buttom");

    var diffAxis = d3.svg.axis()
                     .scale(diffScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("right");
    
    var diffLine = d3.svg.line()
                     .x(function(d) { return timeScale(new Date(d.time)); })
                     .y(function(d) { return diffScale(d.diff); })
                     .defined(function(d) {
                         return hasData(openWeather, d.time) && hasData(everSolar, d.time);
                     });

    var weatherLine = d3.svg.line()
                      .x(function(d) { return timeScale(new Date(d.time)); })
                      .y(function(d) { return weatherScale(d.clouds); })
                      .defined(function(d) {
                          var bool = (hasData(openWeather, d.time) && notNight(new Date(d.time)))
                          return bool;
                      });

    var svg = d3.select("#Diff").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(timeAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Time");

    svg.append("g")
    .attr("class", "y axis")
    .style("fill", diffColor)
    .call(diffAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Effect");

    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .style("fill", weatherColor)
    .call(weatherAxis)
    .append("text")
    .attr("y", -10)
    .text("Clouds");

    svg.append("path")
    .attr("class", "line")
    .style("stroke", weatherColor)
    .attr("d", weatherLine(openWeather));

    svg.append("path")
    .attr("class", "line")
    .style("stroke", diffColor)
    .attr("d", diffLine(everSolar));

}

function total(data) {
    var openWeather = data.openWeather;
    var everSolar = data.everSolar;

    $("#Total").empty();
    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var totalColor = "green";
    var weatherColor = "red";

    var timeStart = Math.min(d3.min(openWeather, function(d) {
                                 return d.time;
                             }), d3.min(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeEnd = Math.max(d3.max(openWeather, function(d) {
                                 return d.time;
                             }), d3.max(everSolar, function(d) {
                                     return d.time;
                                 }));

    var timeScale = d3.time.scale();
    timeScale.range([0, width]);
    timeScale.domain([new Date(timeStart - 1 ), new Date(timeEnd + 1)]);
    timeScale.nice(d3.time.day);

    var totalScale = d3.scale.linear();
    totalScale.range([height, 0]);
    totalScale.domain([0, d3.max(everSolar, function(d) {
                               return d.total;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([height, 0]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var timeAxis = d3.svg.axis()
                   .scale(timeScale)
                   .ticks(d3.time.day, 1)
                   .orient("buttom");

    var totalAxis = d3.svg.axis()
                     .scale(totalScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("right");


    var svg = d3.select("#Total").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    var numberOfDays = timeScale.ticks(d3.time.day).length;
    var barWidth = width / (numberOfDays * 2);

    svg.append("g")
    .attr("class", "bars")
    .selectAll("rect")
    .data(everSolar).enter()
    .append("rect")
    .attr("x", function(d) { return timeScale(new Date(d.time)) - barWidth + 1; })
    .attr("y", function(d) { return totalScale(d.total); })
    .attr("width", barWidth - 1)
    .attr("height", function(d) { return height - totalScale(d.total); })
    .attr("fill", totalColor)

    svg.append("g")
    .attr("class", "bars")
    .selectAll("rect")
    .data(openWeather).enter()
    .append("rect")
    .attr("x", function(d) { return timeScale(new Date(d.time)); })
    .attr("y", function(d) { return weatherScale(d.clouds); })
    .attr("width", barWidth - 1)
    .attr("height", function(d) { return height - weatherScale(d.clouds); })
    .attr("fill", weatherColor)

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(timeAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Time");

    svg.append("g")
    .attr("class", "y axis")
    .style("fill", totalColor)
    .call(totalAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Total");

    svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ",0)")
    .style("fill", weatherColor)
    .call(weatherAxis)
    .append("text")
    .attr("y", -10)
    .text("Clouds");

}

function scatter30(data) {
    var openWeather = data.openWeather;
    var everSolar = data.diff;

    $("#Scatter30").empty();
    var margin = 40;

    var width = 500;
    var height = 500;


    var diffScale = d3.scale.linear();
    diffScale.range([height, 0]);
    diffScale.domain([0, d3.max(everSolar, function(d) {
                             return d.diff;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([0, width]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var diffAxis = d3.svg.axis()
                     .scale(diffScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("buttom");


    var svg = d3.select("#Scatter30").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "dot")
    .selectAll("circle")
    .data(everSolar).enter()
    .append("circle")
    .filter(function(d) {
        return hasData(openWeather, d.time) && hasData(everSolar, d.time)
    })
    .attr("cx", function(d) {
        var clouds = getClouds(openWeather, d.time);
        if (clouds == undefined) {
            console.log(new Date(d.time));
        }
        return weatherScale(clouds);
    })
    .attr("cy", function(d) { return diffScale(d.diff); })
    .attr("r", 2);



    svg.append("g")
    .attr("class", "y axis")
    .call(diffAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Total");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(weatherAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Clouds");
}

function scatter60(data) {
    var openWeather = data.openWeather;
    var everSolar = data.diff;

    $("#Scatter60").empty();
    var margin = 40;

    var width = 500;
    var height = 500;


    var diffScale = d3.scale.linear();
    diffScale.range([height, 0]);
    diffScale.domain([0, d3.max(everSolar, function(d) {
                             return d.diff;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([0, width]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var diffAxis = d3.svg.axis()
                     .scale(diffScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("buttom");


    var svg = d3.select("#Scatter60").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "dot")
    .selectAll("circle")
    .data(everSolar).enter()
    .append("circle")
    .filter(function(d) {
        return hasData(openWeather, d.time) && hasData(everSolar, d.time)
    })
    .attr("cx", function(d) {
        var clouds = getClouds(openWeather, d.time);
        if (clouds == undefined) {
            console.log(new Date(d.time));
        }
        return weatherScale(clouds);
    })
    .attr("cy", function(d) { return diffScale(d.diff); })
    .attr("r", 2);



    svg.append("g")
    .attr("class", "y axis")
    .call(diffAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Total");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(weatherAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Clouds");
}

function scatter180(data) {
    var openWeather = data.openWeather;
    var everSolar = data.diff;

    $("#Scatter180").empty();
    var margin = 40;

    var width = 500;
    var height = 500;


    var diffScale = d3.scale.linear();
    diffScale.range([height, 0]);
    diffScale.domain([0, d3.max(everSolar, function(d) {
                             return d.diff;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([0, width]);
    weatherScale.domain([0, d3.max(openWeather, function(d) {
                                return d.clouds;
                            })]);

    var diffAxis = d3.svg.axis()
                     .scale(diffScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("buttom");


    var svg = d3.select("#Scatter180").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "dot")
    .selectAll("circle")
    .data(everSolar).enter()
    .append("circle")
    .filter(function(d) {
        return hasDataTime(openWeather, d.time, 11000000) && hasDataTime(everSolar, d.time, 11000000)
    })
    .attr("cx", function(d) {
        var clouds = getClouds(openWeather, d.time);
        if (clouds == undefined) {
            console.log(new Date(d.time));
        }
        return weatherScale(clouds);
    })
    .attr("cy", function(d) { return diffScale(d.diff); })
    .attr("r", 2);



    svg.append("g")
    .attr("class", "y axis")
    .call(diffAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Total");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(weatherAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Clouds");
}

function totalScatter(data) {
    var openWeather = data.openWeather;
    var everSolar = data.everSolar;

    var combined = []

    var weatherIndex = 0;
    for (var i = 0; i < everSolar.length; i++) {
        var total = everSolar[i];

        while (openWeather[weatherIndex].time < total.time) {
            weatherIndex++;
        }
        if (openWeather[weatherIndex].time == total.time) {
            combined.push({
                total: total.total,
                clouds: openWeather[weatherIndex].clouds
            });
        }
    }
    console.log(combined);
    $("#TotalScatter").empty();
    var margin = 40;

    var width = 500;
    var height = 500;


    var totalScale = d3.scale.linear();
    totalScale.range([height, 0]);
    totalScale.domain([0, d3.max(combined, function(d) {
                               return d.total;
                           })]);

    var weatherScale = d3.scale.linear();
    weatherScale.range([0, width]);
    weatherScale.domain([0, d3.max(combined, function(d) {
                                return d.clouds;
                            })]);

    var totalAxis = d3.svg.axis()
                     .scale(totalScale)
                     .orient("left");

    var weatherAxis = d3.svg.axis()
                      .scale(weatherScale)
                      .orient("buttom");


    var svg = d3.select("#TotalScatter").append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");

    svg.append("g")
    .attr("class", "dot")
    .selectAll("circle")
    .data(combined).enter()
    .append("circle")
    .attr("cx", function(d) { return weatherScale(d.clouds); })
    .attr("cy", function(d) { return totalScale(d.total); })
    .attr("r", 2)

    svg.append("g")
    .attr("class", "y axis")
    .call(totalAxis)
    .append("text")
    .attr("y", -10)
    .attr("text-anchor", "end")
    .text("Total");

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(weatherAxis)
    .append("text")
    .attr("x", width)
    .attr("y", 30)
    .attr("text-anchor", "end")
    .text("Clouds");
}