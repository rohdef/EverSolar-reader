
function init() {

    $("#days").change(update);
    update();
}
function ajaxCall(path, callback) {    
    $.ajax({
        url: path,
        type: "GET",
        ContentType: "application/json"
    }).success(function(data) {
        callback(data);
    }).error(function(data) {});

}
function update() {
    ajaxCall("/data",diagram);
    ajaxCall("/noise",noise);
    ajaxCall("/total",function(data){
        total(data);
        totalScatter(data);
    });

    ajaxCall("/diff30",function(data) {
        scatter(data, "#Scatter30", 30);
    });

    ajaxCall("/diff60",function(data) {
        scatter(data, "#Scatter60", 60);
        diff(data);
    });

    ajaxCall("/diff180",function(data){
        scatter(data, "#Scatter180", 180);
        //diffFullData(data);
    });
    ajaxCall("/cloudStats", function(data) {
        cloudStats(data,"#CloudStats");
    });

    ajaxCall("/cloudStatsIntervals",function(data){
        cloudStats(data["06_10"], "#CloudStats_06_10");
        cloudStats(data["10_14"], "#CloudStats_10_14");
        cloudStats(data["14_18"], "#CloudStats_14_18");
    });

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
function getTimeScale(start, end, data) {
    var timeStart = d3.min(data, function(d) {
                        return d3.min(d, function(t) {
                                   return t.time;
                               });
                    })

    var timeEnd = d3.max(data, function(d) {
                      return d3.max(d, function(t) {
                                 return t.time;
                             });
                  })
    var timeScale = d3.time.scale();
    timeScale.range([start, end]);
    timeScale.domain([new Date(timeStart - 1), new Date(timeEnd + 1)]);
    timeScale.nice(d3.time.day);
    return timeScale;
}

function getLinearScale(start, end, data, getPoint) {
    var scale = d3.scale.linear();
    scale.range([start, end]);
    scale.domain([0, d3.max(data, getPoint)]);
    return scale;
}

function getSvg(selector, width, height, margin) {
    $(selector).empty();
    var svg = d3.select(selector).append("svg")
              .attr("width", width + 2 * margin)
              .attr("height", height + 2 * margin)
              .append("g")
              .attr("transform", "translate(" + margin + "," + margin + ")");
    return svg;
}

function appendAxis(svg, width, height, scale, color, orient, text){

    var translate;
    var x;
    var y;
    var anchor;

    switch(orient) {
      case "left":
        translate = "";
        x = 0;
        y = -10
        anchor = "end"
        break;
      case "buttom":
        translate = "translate(0," + height + ")"
        x = width;
        y = 30
        anchor = "end"
        break;
      case "right":
        translate = "translate(" + width + ",0)"
        x = 0;
        y = -10;
        anchor = "start"
    }


    var axis = d3.svg.axis()
               .scale(scale)
               .orient(orient);
//.ticks(d3.time.day, 1)

    svg.append("g")
    .attr("class", "axis")
    .style("fill", color)
    .attr("transform", translate)
    .call(axis)
    .append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", anchor)
    .text(text);

}

function appendLine(svg, color, xScale, yScale, data, getx, gety, defined) {

    var line = d3.svg.line()
               .x(function(d) { return xScale(getx(d)); })
               .y(function(d) { return yScale(gety(d)); })
               .defined(defined);


    svg.append("path")
    .attr("class", "line")
    .style("stroke", color)
    .attr("d", line(data));
}

function appendTimeLine(svg, color, timeScale, yScale, data, gety, defined) {
    appendLine(svg, color, timeScale, yScale, data,
               function(d) { return new Date(d.time) },
               gety, defined)
}

function noise(data) {
    var openWeather = filter(data.openWeather);
    var everSolar = filter(data.everSolar);

    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var effectColor = "green";
    var weatherColor = "red";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar]);
    var effectScale = getLinearScale(height, 0, everSolar, function(d) { return d.output; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#noise", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time");
    appendAxis(svg, width, height, effectScale, effectColor, "left", "Effect")
    appendAxis(svg, width, height, weatherScale, weatherColor, "right", "Clouds")


    appendTimeLine(svg, weatherColor, timeScale, weatherScale, openWeather,
                   function(d) { return d.clouds; },
                   function(d) { return (hasData(openWeather, d.time) &&
                                         notNight(new Date(d.time)))});

    appendTimeLine(svg, effectColor, timeScale, effectScale, everSolar,
                   function(d) { return d.output},
                   function(d) { return hasData(everSolar, d.time); });
}

function diagram(data) {
    var openWeather = filter(data.openWeather);
    var everSolar = filter(data.everSolar);
    var optimal = filter(data.optimal);

    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var effectColor = "green";
    var weatherColor = "red";
    var optimalColor = "blue";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar, optimal]);
    var effectScale = getLinearScale(height, 0, everSolar, function(d) { return d.output; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#Diagram", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time");
    appendAxis(svg, width, height, effectScale, effectColor, "left", "Effect")
    appendAxis(svg, width, height, weatherScale, weatherColor, "right", "Clouds")


    appendTimeLine(svg, weatherColor, timeScale, weatherScale, openWeather,
                   function(d) { return d.clouds; },
                   function(d) { return (hasData(openWeather, d.time) &&
                                         notNight(new Date(d.time)))});

    appendTimeLine(svg, optimalColor, timeScale, effectScale, optimal,
                   function(d) { return d.max},
                   function(d) { return hasData(optimal, d.time); });

    appendTimeLine(svg, effectColor, timeScale, effectScale, everSolar,
                   function(d) { return d.output},
                   function(d) { return hasData(everSolar, d.time); });
}


function diffFullData(data) {
    var openWeather = filter(data.openWeather);
    var everSolar = filter(data.diff);

    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var diffColor = "green";
    var weatherColor = "red";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar]);
    var diffScale = getLinearScale(height, 0, everSolar, function(d) { return d.diff; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#DiffFullData", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time");
    appendAxis(svg, width, height, diffScale, diffColor, "left", "Effect")
    appendAxis(svg, width, height, weatherScale, weatherColor, "right", "Clouds")


    appendTimeLine(svg, weatherColor, timeScale, weatherScale, openWeather,
                   function(d) { return d.clouds; },
                   function(d) { return (hasData(openWeather, d.time) &&
                                         notNight(new Date(d.time)))});

    appendTimeLine(svg, diffColor, timeScale, diffScale, everSolar,
                   function(d) { return d.diff},
                   function(d) { return hasDataTime(everSolar, d.time, 11000000) });
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

    var timeScale = getTimeScale(0, width, [openWeather, everSolar]);
    var diffScale = getLinearScale(height, 0, everSolar, function(d) { return d.diff; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#Diff", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time");
    appendAxis(svg, width, height, diffScale, diffColor, "left", "Effect")
    appendAxis(svg, width, height, weatherScale, weatherColor, "right", "Clouds")


    appendTimeLine(svg, weatherColor, timeScale, weatherScale, openWeather,
                   function(d) { return d.clouds; },
                   function(d) { return (hasData(openWeather, d.time) &&
                                         notNight(new Date(d.time)))});

    appendTimeLine(svg, diffColor, timeScale, diffScale, everSolar,
                   function(d) { return d.diff},
                   function(d) { return (hasData(openWeather, d.time) &&
                                         hasData(everSolar, d.time)); });
}

function total(data) {
    var openWeather = data.openWeather;
    var everSolar = data.everSolar;

    var margin = 40;

    var width = $(window).width() - 200;
    var height = 500;

    var totalColor = "green";
    var weatherColor = "red";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar]);
    var totalScale = getLinearScale(height, 0, everSolar, function(d) { return d.total; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#Total", width, height, margin);

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

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time");
    appendAxis(svg, width, height, totalScale, totalColor, "left", "Total")
    appendAxis(svg, width, height, weatherScale, weatherColor, "right", "Clouds")
}

function scatter(data, selector, interval) {
    var openWeather = data.openWeather;
    var everSolar = data.diff;

    var margin = 40;

    var width = 500;
    var height = 500;

    var diffScale = getLinearScale(height, 0, everSolar, function(d) { return d.diff; })
    var weatherScale = getLinearScale(0, width, openWeather, function(d) { return d.clouds; })

    var svg = getSvg(selector, width, height, margin);

    appendAxis(svg, width, height, weatherScale, "black", "buttom", "Clouds");
    appendAxis(svg, width, height, diffScale, "black", "left", "Effect")

    var deadTime = (interval * 60 + 1000) * 1000

    var counter = 0;

    svg.append("g")
    .attr("class", "dot")
    .selectAll("circle")
    .data(everSolar).enter()
    .append("circle")
    .filter(function(d) {
        var bool = (hasDataTime(openWeather, d.time, deadTime) &&
                    hasDataTime(everSolar, d.time, deadTime))
        if (bool) {
            counter++;
        }
        return bool;
    })
    .attr("cx", function(d) {
        return weatherScale(getClouds(openWeather, d.time));
    })
    .attr("cy", function(d) { return diffScale(d.diff); })
    .attr("r", 2);

    console.log("Scatter" + interval + ": " + counter);

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

    var margin = 40;

    var width = 500;
    var height = 500;

    var totalScale = getLinearScale(height, 0, combined, function(d) { return d.total; })
    var weatherScale = getLinearScale(0, width, combined, function(d) { return d.clouds; })

    var svg = getSvg("#TotalScatter", width, height, margin);

    appendAxis(svg, width, height, weatherScale, "black", "buttom", "Clouds");
    appendAxis(svg, width, height, totalScale, "black", "left", "Total")


    svg.append("g")
    .attr("class", "dot")
    .selectAll("circle")
    .data(combined).enter()
    .append("circle")
    .attr("cx", function(d) { return weatherScale(d.clouds); })
    .attr("cy", function(d) { return totalScale(d.total); })
    .attr("r", 2)

}

function cloudStats(data, selector) {
    var margin = 40;

    var width = 500;
    var height = 500;

    var meanColor = "green";
    var stdDevColor = "red";

    var meanScale = getLinearScale(height, 0, data, function(d) {
                        return Math.max(d.mean, d.std_dev_plus, d.std_dev_minus);
                    })
    var weatherScale = getLinearScale(0, width, data, function(d) { return d.clouds; })

    var svg = getSvg(selector, width, height, margin);

    appendAxis(svg, width, height, weatherScale, "black", "buttom", "Clouds");
    appendAxis(svg, width, height, meanScale, "black", "left", "Effect")


    appendLine(svg, meanColor, weatherScale, meanScale, data,
               function(d) { return d.clouds; },
               function(d) { return d.mean; },
               function(d) { return true});

    appendLine(svg, stdDevColor, weatherScale, meanScale, data,
               function(d) { return d.clouds; },
               function(d) { return d.std_dev_plus},
               function(d) {
                   if (d.std_dev_plus != null) {
                       return true;
                   } else {
                       return false;
                   }
               });

    appendLine(svg, stdDevColor, weatherScale, meanScale, data,
               function(d) { return d.clouds; },
               function(d) { return d.std_dev_minus},
               function(d) {
                   if (d.std_dev_plus != null) {
                       return true;
                   } else {
                       return false;
                   }
               });
}