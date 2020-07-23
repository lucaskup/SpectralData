"use strict";
class SpectralChart {
  constructor(viewID) {
    this.viewID = viewID;

    this.margin = { top: 30, right: 120, bottom: 30, left: 50 };
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 550 - this.margin.top - this.margin.bottom;
    this.tooltip = { width: 100, height: 100, x: 10, y: -30 };

    this.bisectDate = d3.bisector(function (d) {
      return d.band;
    }).left;

    this.formatValue = d3.format(",");

    this.x = d3.scaleLinear().range([0, this.width]);
    this.y = d3.scaleLinear().range([this.height, 0]);
    this.y1 = d3.scaleLinear().range([this.height, 0]);

    this.xAxis = d3.axisBottom(this.x).ticks(10).tickFormat(d3.format("i"));
    this.yAxis = d3.axisLeft(this.y);
    this.y1Axis = d3.axisRight(this.y1);

    this.line = d3
      .line()
      .x((d) => this.x(d.band))
      .y((d) => this.y(d.value));

    this.LineConvexHull = d3
      .line()
      .x((d) => this.x(d[0]))
      .y((d) => this.y(d[1]));

    this.LineContinumRemoved = d3
      .line()
      .x((d) => this.x(d[0]))
      .y((d) => this.y1(d[1]));

    this.LineDerivative = d3
      .line()
      .x((d) => this.x(d[0]))
      .y((d) => this.y1(d[1]));
  }

  createGraph(samples) {
    const actualSample = samples[0];
    this.svg = d3
      .select(this.viewID)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right + 30)
      .attr("height", this.height + this.margin.top + this.margin.bottom + 30)
      .append("g")
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );

    this.x.domain(
      d3.extent(actualSample.spectra, function (d) {
        return d.band;
      })
    );
    const min_value = -5;
    const max_value = d3.max(
      actualSample.spectra.map((d) => {
        return d.value;
      })
    );

    this.y.domain([-max_value, max_value]);
    this.y1.domain([-1, 1]);

    this.svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.y(0) + ")")
      .call(this.xAxis);

    // text label for the x axis
    this.svg
      .append("text")
      .attr("class", "axis-text")
      .attr(
        "transform",
        "translate(" +
          this.width / 2 +
          " ," +
          (this.height + this.margin.top + 10) +
          ")"
      )
      .style("text-anchor", "middle")
      .text("Wavelength [nm]");

    this.svg.append("g").attr("class", "y axis").call(this.yAxis);

    this.svg
      .append("text")
      .attr("class", "axis-text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - this.margin.left)
      .attr("x", 0 - this.height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Reflectance [%]");

    this.svg
      .append("g")
      .attr("transform", "translate(" + this.width + ",0)")
      .attr("class", "y axis")
      .call(this.y1Axis);
    this.svg
      .append("text")
      .attr("class", "axis-text")
      .attr("transform", "rotate(-90)")
      .attr("y", this.width + 30)
      .attr("x", 0 - this.height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Normalized Reflectance");

    this.lineComplete = this.svg
      .append("path")
      .datum(actualSample.spectra)
      .attr("class", "line")
      .attr("d", this.line)
      .attr("id", "lineValue")
      .style("opacity", getValueOpacity());

    this.lineHullComplete = this.svg
      .append("path")
      .datum(actualSample.getConvexHull())
      .attr("class", "line")
      .style("stroke-dasharray", "3, 3")
      .style("stroke", "red")
      .attr("id", "lineConvexHull")
      .attr("d", this.LineConvexHull)
      .style("opacity", getHullOpacity());

    this.lineContinumRemovedComplete = this.svg
      .append("path")
      .datum(actualSample.getContinumRemovedSpectra())
      .attr("class", "line")
      .style("stroke", "pink")
      .attr("id", "lineContinum")
      .attr("d", this.LineContinumRemoved)
      .style("opacity", getContinumOpacity());

    this.lineDerivativeComplete = this.svg
      .append("path")
      .datum(actualSample.getFirstOrderDerivative())
      .attr("class", "line")
      .style("stroke", "black")
      .attr("id", "lineDerivative")
      .attr("d", this.LineDerivative)
      .style("opacity", getDerivativeOpacity());
    this.setUpTooltip();
    return this;
  }
  // A function that update the chart
  updateActiveLine(sample) {
    // Create new data with the selection?

    const spectra = sample.spectra;

    this.y = d3.scaleLinear().range([this.height, 0]);
    const max_domain_y = d3.max(spectra.map((d) => d.value));
    this.y.domain([-max_domain_y, max_domain_y]);
    this.yAxis = d3.axisLeft(this.y);

    this.svg
      .select(".y")
      .transition(d3.transition().duration(500))
      .call(this.yAxis);

    // Give these new data to update line
    this.lineComplete
      .datum(spectra)
      .transition()
      .duration(1000)
      .style("opacity", getValueOpacity())
      .attr(
        "d",
        d3
          .line()
          .x((d) => this.x(+d.band))
          .y((d) => this.y(+d.value))
      );

    this.lineHullComplete
      .datum(sample.getConvexHull())
      .transition()
      .duration(1000)
      .style("stroke-dasharray", "3, 3")
      .style("stroke", "red")
      .style("opacity", getHullOpacity())
      .attr(
        "d",
        d3
          .line()
          .x((d) => this.x(+d[0]))
          .y((d) => this.y(+d[1]))
      );

    this.lineContinumRemovedComplete
      .datum(sample.getContinumRemovedSpectra())
      .transition()
      .duration(1000)
      .style("stroke", "pink")
      .style("opacity", getContinumOpacity())
      .attr(
        "d",
        d3
          .line()
          .x((d) => this.x(+d[0]))
          .y((d) => this.y1(+d[1]))
      );
    this.lineDerivativeComplete
      .datum(sample.getFirstOrderDerivative())
      .transition()
      .duration(1000)
      .style("stroke", "black")
      .style("opacity", getDerivativeOpacity())
      .attr(
        "d",
        d3
          .line()
          .x((d) => this.x(+d[0]))
          .y((d) => this.y1(+d[1]))
      );
  }
  setUpTooltip() {
    this.focus = this.svg
      .append("g")
      .attr("class", "focus")
      .style("display", "none");

    this.focus.append("circle").attr("r", 5);

    this.focus
      .append("rect")
      .attr("class", "tooltip")
      .attr("width", 140)
      .attr("height", 50)
      .attr("x", 10)
      .attr("y", -22)
      .attr("rx", 4)
      .attr("ry", 4);

    this.focus.append("text").attr("x", 18).attr("y", -2).text("Wavelength:");

    this.focus
      .append("text")
      .attr("class", "tooltip-band")
      .attr("x", 95)
      .attr("y", -2);

    this.focus.append("text").attr("x", 18).attr("y", 18).text("Intensity:");

    this.focus
      .append("text")
      .attr("class", "tooltip-value")
      .attr("x", 95)
      .attr("y", 18);

    this.svg
      .append("rect")
      .attr("class", "overlay")
      .attr("id", "tooltipRectangle")
      .attr("width", this.width)
      .attr("height", this.height)
      .datum(this)
      .on("mouseover", () => {
        if (getValueOpacity()) {
          this.focus.style("display", null);
        }
      })
      .on("mouseout", () => {
        this.focus.style("display", "none");
      })
      .on("mousemove", mousemove);

    function mousemove(that) {
      const actual_data = that.lineComplete.datum();
      let x0 = that.x.invert(d3.mouse(this)[0]),
        i = that.bisectDate(actual_data, x0, 1),
        d0 = actual_data[i - 1],
        d1 = actual_data[i],
        d = x0 - d0.band > d1.band - x0 ? d1 : d0;
      that.focus.attr(
        "transform",
        "translate(" + that.x(d.band) + "," + that.y(d.value) + ")"
      );
      that.focus.select(".tooltip-band").text(d.band);
      that.focus.select(".tooltip-value").text(that.formatValue(d.value));
    }
  }
}
