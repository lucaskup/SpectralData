var margin = { top: 30, right: 120, bottom: 30, left: 50 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom,
  tooltip = { width: 100, height: 100, x: 10, y: -30 };

var bisectDate = d3.bisector(function (d) {
    return d.band;
  }).left,
  formatValue = d3.format(",");

var x = d3.scaleTime().range([0, width]);
var y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(x);
var yAxis = d3.axisLeft(y);

var line = d3
  .line()
  .x(function (d) {
    return x(d.band);
  })
  .y(function (d) {
    return y(d.value);
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
  console.log(x_val);
  x.domain(
    d3.extent(x_val, function (d) {
      return d.band;
    })
  );
  y.domain([0, max_value]);

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
    .text("Number of Likes");

  var lineComplete = svg
    .append("path")
    .datum(x_val)
    .attr("class", "line")
    .attr("d", line);

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
    .attr("class", "tooltip-date")
    .attr("x", 95)
    .attr("y", -2);

  focus.append("text").attr("x", 18).attr("y", 18).text("Intensity:");

  focus
    .append("text")
    .attr("class", "tooltip-likes")
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
    focus.select(".tooltip-date").text(d.band);
    focus.select(".tooltip-likes").text(formatValue(d.value));
  }

  // A function that update the chart
  function update(selectedGroup) {
    // Create new data with the selection?
    var dataFilter = x_val.map(function (d) {
      return { band: d.band, value: d[selectedGroup] };
    });
    console.log(dataFilter);
    console.log(line);
    console.log("SVG");
    console.log(svg);
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
    console.log(lineComplete);

    //svg.append("path").datum(x_val).attr("class", "line").attr("d", line);
    //.datum(dataFilter)
    //    .transition()
    //    .duration(1000)
    //.attr("stroke", function (d) {
    //  return myColor(selectedGroup);
    // });
  }

  // When the button is changed, run the updateChart function
  d3.select("#select_sample").on("change", function (d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value");
    // run the updateChart function with this selected option
    update(selectedOption);
  });
});

/*document
  .getElementById("select_sample")
  .addEventListener("change", function (event) {
    console.log(event);
    const new_val = even.target.value;
  });
*/
