"use strict";

let chart = undefined;
let samples = undefined;
/**
 * From the avaliable samples, updates the select control
 * on the view (html)
 * @param {Array<Sample>} samples list of samples
 */
/*function updateSelectOptions(samples) {
  const sampleNames = samples.map((sample) => sample.id());
  tabulate(sampleNames, ["#", "Sample ID"]);
  d3.select("#select_sample")
    .selectAll("option")
    .data(sampleNames)
    .enter()
    .append("option")
    .text((d) => d);
}*/

// Plug events on the check controls of the view
d3.select("#chk_value").on("change", () => {
  d3.selectAll(".line_value")
    .transition()
    .duration(100)
    .style("opacity", getValueOpacity());
});

// Plug events on the check controls of the view
d3.select("#chk_hull").on("change", () => {
  d3.selectAll(".line_convex_hull")
    .transition()
    .duration(100)
    .style("opacity", getHullOpacity());
});

// Plug events on the check controls of the view
d3.select("#chk_cont").on("change", () => {
  d3.selectAll(".line_continum")
    .transition()
    .duration(100)
    .style("opacity", getContinumOpacity());
});

// Plug events on the check controls of the view
d3.select("#chk_derivative").on("change", () => {
  d3.selectAll(".line_derivative").style("opacity", getDerivativeOpacity());
  chart.adjustDomains();
});

// Functions that control opacity of graph lines
function getValueOpacity() {
  return d3.select("#chk_value").property("checked") ? 1 : 0;
}
function getHullOpacity() {
  return d3.select("#chk_hull").property("checked") ? 1 : 0;
}
function getContinumOpacity() {
  return d3.select("#chk_cont").property("checked") ? 1 : 0;
}
function getDerivativeOpacity() {
  return d3.select("#chk_derivative").property("checked") ? 1 : 0;
}

/*// When the selected sample button is changed, run the updateChart function
d3.select("#select_sample").on("change", function (d) {
  // recover the option that has been chosen
  const selectedSampleId = d3.select(this).property("value");
  // run the updateChart function with this selected option
  const sample = samples.find((s) => s.id() == selectedSampleId);
  sample.derivativeOrder = d3.select("#select_approx_order").property("value");
  chart.updateActiveLine(sample);
});*/

// When the derivative order button is changed, run the updateChart function
d3.select("#select_approx_order").on("change", function (d) {
  //console.log(d3.select("#select_approx_order"));
  const derivativeOrder = d3.select(this).property("value");

  for (let i = 0; i < samples.length; i++) {
    samples[i].derivativeOrder = derivativeOrder;
  }
  chart.updateDerivative(derivativeOrder);
});

// Read csv files and creates the graph
d3.dsv(";", "data/Espectro_Todos.csv").then(function (data) {
  samples = createSamples(data);
  //updateSelectOptions(samples);
  const sampleNames = samples.map((sample) => sample.id());
  tabulate(sampleNames, ["Sample ID"]);
  chart = new SpectralChart("#main_section");
  chart.createGraph(samples[0]);
});

function tabulate(data, columns) {
  var table = d3.select("#table_hold").append("table"),
    thead = table.append("thead"),
    tbody = table.append("tbody");

  // append the header row
  thead
    .append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text(function (column) {
      return column;
    });

  // create a row for each object in the data
  var rows = tbody.selectAll("tr").data(data).enter().append("tr");

  // create a cell in each row for each column
  // At this point, the rows have data associated.
  // So the data function accesses it.
  var cells = rows
    .selectAll("td")
    .data(function (row) {
      // he does it this way to guarantee you only use the
      // values for the columns you provide.
      return columns.map(function (column) {
        // return a new object with a value set to the row's column value.
        return row;
      });
    })
    .enter()
    .append("td")

    .html(function (cell) {
      const idCheck = "chk" + cell;
      return `<input type="checkbox" class="chk_new_sample" id="${idCheck}" name="continum" /><label for="${idCheck}">${cell}</label>`;
    });
  d3.selectAll(".chk_new_sample").on("change", function addNew() {
    const selectedSampleId = this.id.slice(3);
    if (this.checked) {
      const sample = samples.find((s) => s.id() == selectedSampleId);
      sample.derivativeOrder = d3
        .select("#select_approx_order")
        .property("value");
      chart.addActiveSample(sample);
      //chart.updateActiveLine(sample);
    } else {
      chart.removeActiveSample(selectedSampleId);
    }
  });

  return table;
}
