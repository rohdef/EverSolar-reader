var d3 = require("d3");
var xmldom = require("xmldom");
var jsdom = require("node-jsdom").jsdom;
var http = require("http");
var fs = require("fs");

var DOMParser = xmldom.DOMParser;
update();




function ajaxCall(path, callback) {
    var options = {
        hostname: "127.0.0.1",
        port: 8000,
        path: path,
        method: 'Get'
    }

    http.get(options, function(res) {
        var recievedData = "";
        res.on('data', function (chunk) {
            recievedData += chunk;
        });
        res.on('end', function() {
            callback(JSON.parse(recievedData));
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

function writeToFile(fileName, svg) {
    var htmlsvg = svg.node().ownerDocument.getElementById("svg");


    var docString = "<?xml version=\"1.0\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 20010904//EN\" \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\"><svg id=\"svg\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\"><defs><style type=\"text/css\"><![CDATA[.axis path,.axis line { fill: none; stroke: black; shape-rendering: crispEdges; } .axis text { font-family: sans-serif; font-size: 12px; } .line { stroke-width: 2; fill: none; } ]]></style> </defs></svg>"

    var doc = new DOMParser().parseFromString(docString);
    var svgElement = doc.getElementById("svg");

    svgElement.setAttribute("width", htmlsvg.getAttribute("width"));
    svgElement.setAttribute("height", htmlsvg.getAttribute("height"));
    var children = htmlsvg.childNodes
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        htmlsvg.removeChild(child);
        svgElement.insertBefore(child, null);
    }


    var xmlStr = (new xmldom.XMLSerializer()).serializeToString(doc)

    fs.writeFile(fileName + ".svg" , xmlStr, function(){console.log('done')})

}

function update() {
    ajaxCall("/data/", function(data) {
        var svg = diagram(data, 10, 600, 300);
        writeToFile("diagram", svg);
    });
/*
    ajaxCall("/noise/", function(data) {
        noise(data, 5, 800, 500);
    });
*/

    ajaxCall("/diff30/",function(data) {
        var svg = scatter(data, "#Scatter30", 30, 300, 300);
        writeToFile("diff30", svg);
    });

    ajaxCall("/diff60/",function(data) {
        var svg1 = scatter(data, "#Scatter60", 60, 300, 300);
        var svg2 = diff(data, 10, 600, 300);
        writeToFile("diff60", svg1);
        writeToFile("diff", svg2);
    });

    ajaxCall("/diff180/",function(data){
        var svg = scatter(data, "#Scatter180", 180, 300, 300);
        writeToFile("diff180", svg);
        //diffFullData(data);
    });
    ajaxCall("/cloudStats/", function(data) {
        var svg = cloudStats(data,"#CloudStats", 300, 300);
        writeToFile("cloudStats", svg);
    });

    ajaxCall("/cloudStatsIntervals/",function(data){
        var svg1 = cloudStats(data["06_10"], "#CloudStats_06_10", 300, 300);
        var svg2 = cloudStats(data["10_14"], "#CloudStats_10_14", 300, 300);
        var svg3 = cloudStats(data["14_18"], "#CloudStats_14_18", 300, 300);
        writeToFile("cloudStats06_10", svg1);
        writeToFile("cloudStats10_14", svg2);
        writeToFile("cloudStats14_18", svg3);
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

function filter(data, days) {
    var res = [];

    var d = new Date();
    d.setDate(d.getDate() - days);

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
    var doc = jsdom("<svg id=\"svg\"></svg>");


    var svgElement = doc.getElementById("svg");

    var svg = d3.select(svgElement)
              .attr('width',  width + 2 * margin)
              .attr('height', height + 2 * margin)
              .append('g')
              .attr("transform", "translate(" + margin + "," + margin + ")");
    return svg;
}

function appendAxis(svg, width, height, scale, color, orient, text, timeDayIntervels){

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
    if (timeDayIntervels) {
        axis.ticks(d3.time.day, 1)
    }

    svg.append("g")
    .attr("class", "axis")
    .attr("style", "fill:" + color + ";")
   // .style("fill", color)
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
    .attr("style", "stroke:" + color + ";")
    .attr("d", line(data));
}

function appendTimeLine(svg, color, timeScale, yScale, data, gety, defined) {
    appendLine(svg, color, timeScale, yScale, data,
               function(d) { return new Date(d.time) },
               gety, defined)
}

function noise(data, days, width, height) {
    var openWeather = filter(data.openWeather, days);
    var everSolar = filter(data.everSolar, days);

    var margin = 40;

    var effectColor = "green";
    var weatherColor = "red";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar]);
    var effectScale = getLinearScale(height, 0, everSolar, function(d) { return d.output; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#noise", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time", true);
    appendAxis(svg, width, height, effectScale, effectColor, "left", "Effect")
    appendAxis(svg, width, height, weatherScale, weatherColor, "right", "Clouds")


    appendTimeLine(svg, weatherColor, timeScale, weatherScale, openWeather,
                   function(d) { return d.clouds; },
                   function(d) { return (hasData(openWeather, d.time) &&
                                         notNight(new Date(d.time)))});

    appendTimeLine(svg, effectColor, timeScale, effectScale, everSolar,
                   function(d) { return d.output},
                   function(d) { return hasData(everSolar, d.time); });

    return svg;
}

function diagram(data, days, width, height) {
    var openWeather = filter(data.openWeather, days);
    var everSolar = filter(data.everSolar, days);
    var optimal = filter(data.optimal, days);

    var margin = 40;

    var effectColor = "green";
    var weatherColor = "red";
    var optimalColor = "blue";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar, optimal]);
    var effectScale = getLinearScale(height, 0, everSolar, function(d) { return d.output; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#Diagram", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time", true);
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

    return svg;
}



function diff(data, days, width, height) {
    var openWeather = filter(data.openWeather, days);
    var everSolar = filter(data.diff, days);

    var margin = 40;

    var diffColor = "green";
    var weatherColor = "red";

    var timeScale = getTimeScale(0, width, [openWeather, everSolar]);
    var diffScale = getLinearScale(height, 0, everSolar, function(d) { return d.diff; })
    var weatherScale = getLinearScale(height, 0, openWeather, function(d) { return d.clouds; })

    var svg = getSvg("#Diff", width, height, margin);

    appendAxis(svg, width, height, timeScale, "black", "buttom", "Time", true);
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
    return svg;
}

function scatter(data, selector, interval, width, height) {
    var openWeather = data.openWeather;
    var everSolar = data.diff;

    var margin = 40;


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
    return svg;

}

function cloudStats(data, selector, width, height) {
    var margin = 40;


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
    return svg;
}