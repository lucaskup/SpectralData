let chart;
let samples;

// Plug events on download csv button
d3.select('#btn_download_csv').on('click', () => {
  if (chart.isDisplayingSomething()) {
    const { activeSamples } = chart;
    const csv = createCSV(activeSamples);
    const csvContent = `data:text/csv;charset=utf-8,${csv}`;
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('id', 'id_hidden_download');
    link.setAttribute('download', 'spectral_data.csv');
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv".
    document.body.removeChild(link); // Required for FF
  } else {
    alert(
      'Apenas dados exibidos no gráfico serão exportados em csv.\nSelecione amostras e dados.'
    );
  }
});

// Plug events on the check controls of the view
d3.select('#chk_value').on('change', () => {
  d3.selectAll('.line_value')
    .transition()
    .duration(100)
    .style('opacity', getValueOpacity());
});

// Plug events on the check controls of the view
d3.select('#chk_hull').on('change', () => {
  d3.selectAll('.line_convex_hull')
    .transition()
    .duration(100)
    .style('opacity', getHullOpacity());
});

// Plug events on the check controls of the view
d3.select('#chk_cont').on('change', () => {
  d3.selectAll('.line_continum')
    .transition()
    .duration(100)
    .style('opacity', getContinumOpacity());
});

// Plug events on the check controls of the view
d3.select('#chk_derivative').on('change', () => {
  d3.selectAll('.line_derivative').style('opacity', getDerivativeOpacity());
  chart.adjustYDomain();
});

function isReflectanceSelected() {
  return d3.select('#chk_value').property('checked');
}
function isConvexHullSelected() {
  return d3.select('#chk_hull').property('checked');
}
function isContinumRemovedSelected() {
  return d3.select('#chk_cont').property('checked');
}
function isDerivativeSelected() {
  return d3.select('#chk_derivative').property('checked');
}

// Functions that control opacity of graph lines
function getValueOpacity() {
  return isReflectanceSelected() ? 1 : 0;
}
function getHullOpacity() {
  return isConvexHullSelected() ? 1 : 0;
}
function getContinumOpacity() {
  return isContinumRemovedSelected() ? 1 : 0;
}
function getDerivativeOpacity() {
  return isDerivativeSelected() ? 1 : 0;
}

// When the derivative order button is changed, run the updateChart function
d3.select('#select_approx_order').on('change', function(d) {
  // console.log(d3.select("#select_approx_order"));
  const derivativeOrder = d3.select(this).property('value');
  for (let i = 0; i < samples.length; i++) {
    samples[i].derivativeOrder = derivativeOrder;
  }
  chart.updateDerivative(derivativeOrder);
});

// Temporary workaround to see different files
const urlUsed = window.location.href;
const fileNameCSVData =
  urlUsed[urlUsed.length - 1] === 'x'
    ? 'data/DadosCompleto.csv'
    : 'data/Espectro_Todos.csv';
// Read csv files and creates the graph
d3.dsv(';', fileNameCSVData).then(function(data) {
  samples = createSamples(data);
  const sampleNames = samples.map(sample => sample.id());
  tabulate(sampleNames, ['Sample ID']);
  chart = new SpectralChart('#main_section');
  chart.createGraph(samples[0]);
});

/**
 * Appends to #table_hold a table that holds all the samples
 * @param {*} data
 * @param {Array<String>} columns indicate the table collumns
 */
function tabulate(data, columns) {
  const table = d3.select('#table_hold').append('table');
  const thead = table.append('thead');
  const tbody = table.append('tbody');
  const cols = columns;
  cols.push('Color');

  // append the header row
  thead
    .append('tr')
    .selectAll('th')
    .data(cols)
    .enter()
    .append('th')
    .text(function(column) {
      return column;
    });

  // create a row for each object in the data
  const rows = tbody
    .selectAll('tr')
    .data(data)
    .enter()
    .append('tr');

  // create a cell in each row for each column
  // At this point, the rows have data associated.
  // So the data function accesses it.
  const cells = rows
    .selectAll('td')
    .data(function(row) {
      // he does it this way to guarantee you only use the
      // values for the columns you provide.
      return columns.map(function(column) {
        // return a new object with a value set to the row's column value.
        if (column === 'Sample ID') {
          const idCheck = `chk${row}`;
          return `<input type="checkbox" class="chk_new_sample" id="${idCheck}" name="continum" /><label for="${idCheck}">${row}</label>`;
        }
        const idElement = column.slice(0, 3) + row;
        return (
          `<div class="input_color_container">` +
          `<input type="color" id="${idElement}" class="clrp_sample_color input_color" value="#ffffff"></input>` +
          `</div>`
        );
      });
    })
    .enter()
    .append('td')

    .html(function(cell) {
      return cell;
    });
  d3.selectAll('.chk_new_sample').on('change', function addNew() {
    const selectedSampleId = this.id.slice(3);
    if (this.checked) {
      const sample = samples.find(s => s.id() === selectedSampleId);
      sample.derivativeOrder = d3
        .select('#select_approx_order')
        .property('value');
      chart.addActiveSample(sample);
    } else {
      chart.removeActiveSample(selectedSampleId);
    }
  });
  d3.selectAll('.clrp_sample_color').on('input', function changeColor() {
    const selectedSampleId = this.id.slice(3);
    const {
      valueLineColor,
      hullLineColor,
      continumLineColor,
      derivativeLineColor,
    } = getLineColors(selectedSampleId);
    changeLineColor(`#line_value${selectedSampleId}`, valueLineColor);
    changeLineColor(`#line_convex_hull${selectedSampleId}`, hullLineColor);
    changeLineColor(`#line_continum${selectedSampleId}`, continumLineColor);
    changeLineColor(`#line_derivative${selectedSampleId}`, derivativeLineColor);
  });

  return table;
}
function getLineColors(sampleId) {
  const selectedColor = d3.select(`#Col${sampleId}`).property('value');
  const isColorSelectedOnFrontEnd = selectedColor === '#ffffff';
  const valueLineColor = isColorSelectedOnFrontEnd
    ? 'steelblue'
    : selectedColor;
  const hullLineColor = isColorSelectedOnFrontEnd ? 'red' : selectedColor;
  const continumLineColor = isColorSelectedOnFrontEnd ? 'pink' : selectedColor;
  const derivativeLineColor = isColorSelectedOnFrontEnd
    ? 'black'
    : selectedColor;
  return {
    valueLineColor,
    hullLineColor,
    continumLineColor,
    derivativeLineColor,
  };
}

function changeLineColor(lineName, lineColor) {
  d3.selectAll(lineName).style('stroke', lineColor);
}
