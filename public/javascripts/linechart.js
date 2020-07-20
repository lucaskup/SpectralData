var margin = { top: 30, right: 120, bottom: 30, left: 50 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom,
  tooltip = { width: 100, height: 100, x: 10, y: -30 };

var bisectDate = d3.bisector(function (d) {
    return d.band;
  }).left,
  formatValue = d3.format(",");

var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);
var y1 = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("i"));
var yAxis = d3.axisLeft(y);
var y1Axis = d3.axisRight(y1);

var line = d3
  .line()
  .x(function (d) {
    return x(d.band);
  })
  .y(function (d) {
    return y(d.value);
  });

var LineConvexHull = d3
  .line()
  .x(function (d) {
    return x(d[0]);
  })
  .y(function (d) {
    return y(d[1]);
  });

var LineContinumRemoved = d3
  .line()
  .x(function (d) {
    return x(d[0]);
  })
  .y(function (d) {
    return y1(d[1]);
  });

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Espectro_Roncador
//Espectro_Taubaté
//Espectro_Torres

d3.dsv(";", "data/Espectro_Todos.csv").then(function (data) {
  //var allGroup = ["ARE_21", "ARE_22", "ARE_23"];
  var x_val = [];
  var hull = [];
  var continum = [];

  const min_value = 0;
  var max_value = min_value;
  //function to convert the string read in csv file to float
  const convertBandValue = (x) => {
    return parseFloat(x.replace(",", "."));
  };

  //for each of the bands in the csv file
  const _keys = data.columns;
  //console.log(data.columns);
  //first two columns are reserved for sample name and reading point
  const name_field = data.columns[0];
  const point_field = data.columns[1];

  _keys.forEach(function (band_column) {
    const band = convertBandValue(band_column);
    if (!isNaN(band)) {
      //creates the default visualization for the first register
      var row = {
        band: band,
        value: convertBandValue(data[0][band_column]),
      };
      //for each sample in the file
      data.forEach(function (sample_line) {
        const sample = sample_line[name_field] + sample_line[point_field];
        //console.log(sample);
        const value = convertBandValue(sample_line[band_column]);
        row[sample] = value;
        if (value > max_value) {
          max_value = value;
          max_sampleName = sample;
        }
      });
      x_val.push(row);
    }
  });
  updateSelectOptions(Object.keys(x_val[0]).slice(2));
  hull = calculateHull(x_val);
  continum = removeContinum(x_val, hull);
  x.domain(
    d3.extent(x_val, function (d) {
      return d.band;
    })
  );

  y.domain([min_value, max_value]);
  y1.domain([0, 1]);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Wavelength");
  svg
    .append("g")
    .attr("transform", "translate(" + width + ",0)")
    .attr("class", "y axis")
    .call(y1Axis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Wavelength");

  var lineComplete = svg
    .append("path")
    .datum(x_val)
    .attr("class", "line")
    .attr("d", line);

  var lineHullComplete = svg
    .append("path")
    .datum(hull)
    .attr("class", "line")
    .style("stroke-dasharray", "3, 3")
    .style("stroke", "red")
    .attr("id", "lineConvexHull")
    .attr("d", LineConvexHull)
    .style("opacity", getHullOpacity());

  var lineContinumRemovedComplete = svg
    .append("path")
    .datum(continum)
    .attr("class", "line")
    .style("stroke", "pink")
    .attr("id", "lineContinum")
    .attr("d", LineContinumRemoved)
    .style("opacity", getContinumOpacity());

  var focus = svg.append("g").attr("class", "focus").style("display", "none");

  focus.append("circle").attr("r", 5);

  focus
    .append("rect")
    .attr("class", "tooltip")
    .attr("width", 140)
    .attr("height", 50)
    .attr("x", 10)
    .attr("y", -22)
    .attr("rx", 4)
    .attr("ry", 4);

  focus.append("text").attr("x", 18).attr("y", -2).text("Wavelength:");

  focus
    .append("text")
    .attr("class", "tooltip-band")
    .attr("x", 95)
    .attr("y", -2);

  focus.append("text").attr("x", 18).attr("y", 18).text("Intensity:");

  focus
    .append("text")
    .attr("class", "tooltip-value")
    .attr("x", 95)
    .attr("y", 18);

  svg
    .append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .on("mouseover", function () {
      focus.style("display", null);
    })
    .on("mouseout", function () {
      focus.style("display", "none");
    })
    .on("mousemove", mousemove);

  function mousemove() {
    const actual_data = lineComplete.datum();
    var x0 = x.invert(d3.mouse(this)[0]),
      i = bisectDate(actual_data, x0, 1),
      d0 = actual_data[i - 1],
      d1 = actual_data[i],
      d = x0 - d0.band > d1.band - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + x(d.band) + "," + y(d.value) + ")");
    focus.select(".tooltip-band").text(d.band);
    focus.select(".tooltip-value").text(formatValue(d.value));
  }

  // A function that update the chart
  function update(selectedGroup) {
    // Create new data with the selection?
    var dataFilter = x_val.map(function (d) {
      return { band: d.band, value: d[selectedGroup] };
    });

    //Start find upper convex hull
    hull = calculateHull(dataFilter);
    //stop convex hull
    continum = removeContinum(dataFilter, hull);
    // Give these new data to update line
    lineComplete
      .datum(dataFilter)
      .transition()
      .duration(1000)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(+d.band);
          })
          .y(function (d) {
            return y(+d.value);
          })
      );

    lineHullComplete
      .datum(hull)
      .transition()
      .duration(1000)
      .style("stroke-dasharray", "3, 3")
      .style("stroke", "red")
      .style("opacity", getHullOpacity())
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(+d[0]);
          })
          .y(function (d) {
            return y(+d[1]);
          })
      );

    lineContinumRemovedComplete
      .datum(continum)
      .transition()
      .duration(1000)
      .style("stroke", "pink")
      .style("opacity", getContinumOpacity())
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return x(+d[0]);
          })
          .y(function (d) {
            return y1(+d[1]);
          })
      );
  }

  // When the button is changed, run the updateChart function
  d3.select("#select_sample").on("change", function (d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
    update(selectedOption);
  });

  d3.select("#chk_hull").on("change", function () {
    d3.select("#lineConvexHull")
      .transition()
      .duration(100)
      .style("opacity", getHullOpacity());
  });

  d3.select("#chk_cont").on("change", function () {
    d3.select("#lineContinum")
      .transition()
      .duration(100)
      .style("opacity", getContinumOpacity());
  });
});

function getHullOpacity() {
  return d3.select("#chk_hull").property("checked") ? 1 : 0;
}

function getContinumOpacity() {
  return d3.select("#chk_cont").property("checked") ? 1 : 0;
}

function calculateHull(data) {
  var hull = [];
  //the function d3.polygonHull expects a list of vertices
  //(as its supposed to work for polygons)
  //vertices list is created using a map function
  const vertices = data.map(function (d) {
    return [d.band, d.value];
  });
  hull = d3.polygonHull(vertices);
  //hull = hull.slice(hull.length/2 -1,hull.length - 1);
  //console.log(data);
  hull.push(hull[0]);
  const start_index = hull.findIndex((d) => {
    return d[0] == data[0].band;
  });
  hull = hull.slice(start_index, hull.length);

  return hull;
}

function removeContinum(data, hull) {
  var continumRemoved = [];
  var indexHull = 0;
  //the convex hull points are not as dense as
  //the radiometer data, but we can find linear
  //equations that describe each of the segments
  //of the convex hull
  //line equation f(x) = ax + b
  var a = 0;
  var b = 0;
  const f = (x) => {
    return a * x + b;
  };

  for (var i = 0; i < data.length; i++) {
    //find the convexhull index, aka bewtween what points
    //in the convex hull the current value goes
    // eg: hullindexes [0,100,200]
    //     valueindexes [0,1,2,...,199,200]
    //     value index 45 is betwen hull indexes
    //     [0] = 0 and [1] = 100
    //console.log(data[i]);
    //console.log(hull[indexHull + 1]);
    if (data[i].band > hull[indexHull + 1][0]) {
      indexHull++;
    }
    //find the line
    a =
      (hull[indexHull + 1][1] - hull[indexHull][1]) /
      (hull[indexHull + 1][0] - hull[indexHull][0]);
    b = hull[indexHull][1] - a * hull[indexHull][0];

    const x = data[i].band;
    continumRemoved.push([x, +(data[i].value / f(x)).toFixed(4)]);
  }
  return continumRemoved;
}
function updateSelectOptions(sampleNames) {
  d3.select("#select_sample")
    .selectAll("option")
    .data(sampleNames)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    });
}
