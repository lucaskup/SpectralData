"use strict";

let chart = undefined;
let samples = undefined;
/**
 * From the avaliable samples, updates the select control
 * on the view (html)
 * @param {Array<Sample>} samples list of samples
 */
function updateSelectOptions(samples) {
  const sampleNames = samples.map((sample) => sample.id());
  d3.select("#select_sample")
    .selectAll("option")
    .data(sampleNames)
    .enter()
    .append("option")
    .text((d) => d);
}

// Plug events on the check controls of the view
d3.select("#chk_value").on("change", () => {
  d3.select("#lineValue")
    .transition()
    .duration(100)
    .style("opacity", getValueOpacity());
});

// Plug events on the check controls of the view
d3.select("#chk_hull").on("change", () => {
  d3.select("#lineConvexHull")
    .transition()
    .duration(100)
    .style("opacity", getHullOpacity());
});

// Plug events on the check controls of the view
d3.select("#chk_cont").on("change", () => {
  d3.select("#lineContinum")
    .transition()
    .duration(100)
    .style("opacity", getContinumOpacity());
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

// When the selected sample button is changed, run the updateChart function
d3.select("#select_sample").on("change", function (d) {
  // recover the option that has been chosen
  const selectedSampleId = d3.select(this).property("value");
  // run the updateChart function with this selected option
  const sample = samples.find((s) => s.id() == selectedSampleId);
  chart.updateActiveLine(sample);
});

// Read csv files and creates the graph
d3.dsv(";", "data/Espectro_Todos.csv").then(function (data) {
  samples = createSamples(data);
  updateSelectOptions(samples);
  chart = new SpectralChart("#main_section");
  chart.createGraph(samples);
});
