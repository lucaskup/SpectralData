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

var xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format("i"));
var yAxis = d3.axisLeft(y);

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

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.dsv(";", "data/ARE_2.csv").then(function (data) {
  //var allGroup = ["ARE_21", "ARE_22", "ARE_23"];
  var x_val = [];
  var hull = [];
  var _keys = Object.keys(data[0]);
  _keys.forEach(function (d) {
    if (!isNaN(d)) {
      x_val.push({
        band: parseFloat(d.replace(",", ".")),
        value: parseFloat(data[0][d].replace(",", ".")),
        ARE_21: parseFloat(data[0][d].replace(",", ".")),
        ARE_22: parseFloat(data[1][d].replace(",", ".")),
        ARE_23: parseFloat(data[2][d].replace(",", ".")),
      });
    }
  });
  const min_value = 0;

  const max_value = d3.max([
    d3.max(x_val, function (d) {
      return d.ARE_21;
    }),
    d3.max(x_val, function (d) {
      return d.ARE_22;
    }),
    d3.max(x_val, function (d) {
      return d.ARE_23;
    }),
  ]);
  hull = calculateHull(x_val);
  x.domain(
    d3.extent(x_val, function (d) {
      return d.band;
    })
  );
  y.domain([min_value, max_value]);

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
});

function getHullOpacity() {
  return d3.select("#chk_hull").property("checked") ? 1 : 0;
}

function calculateHull(data) {
  var hull = [];
  const vertices = data.map(function (d) {
    return [d.band, d.value];
  });

  hull = d3.polygonHull(vertices);
  //hull = hull.slice(hull.length/2 -1,hull.length - 1);
  hull.push(hull[0]);
  const start_index = hull.findIndex((d) => {
    return d[0] == 344.3;
  });
  hull = hull.slice(start_index, hull.length);

  return hull;
}
