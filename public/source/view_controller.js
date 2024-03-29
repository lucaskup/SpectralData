let chart;
let samples;

// Plug events on download csv button
//data-toggle="modal" data-target="#exampleModalCenter"
d3.select('#btn_download_csv').on('click', () => {

  $('#navdrawerDefault').navdrawer('toggle')

  const sampleNames = samples.map(sample => sample.id());
  tabulate_download_data(sampleNames);
  $('#exampleModalCenter').modal('toggle')
  d3.selectAll('.table_download_csvchk').property('checked', false)
});

// plugs events on modal download

d3.select('#btn_check_all').on('click', () => {
  d3.selectAll('.table_download_csvchk').property('checked', true)
});
d3.select('#btn_uncheck_all').on('click', () => {
  d3.selectAll('.table_download_csvchk').property('checked', false)
});
d3.select('#btn_toggle').on('click', () => {
  d3.selectAll('.table_download_csvchk').each(function (p, j) {
    selected_check = d3.select(this)
    new_chk_state = !selected_check.property('checked')
    selected_check.property('checked', new_chk_state)
  })
});

function returnSelectedDownloadSamples() {
  const samplesToDownload = []
  d3.selectAll('.table_download_csvchk').each(function (p, j) {
    isMarked = d3.select(this).property('checked')
    if (isMarked) {
      const selectedSampleId = d3.select(this).attr('data-id');
      const sample = samples.find(s => s.id() === selectedSampleId);
      samplesToDownload.push(sample)
    }
  })
  return samplesToDownload
}
d3.select('#btn_download_modal').on('click', () => {

  selected_samples_download = returnSelectedDownloadSamples()
  if (selected_samples_download.length > 0) {

    const csv = createCSV(selected_samples_download);
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
      'Apenas amostras selecionadas são consideradas no CSV.\nSelecione amostras e dados.'
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
d3.select('#select_approx_order').on('change', function (d) {
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
    ? 'data/Espectro_Todos.csv'
    : 'data/sample_data.csv';
// Read csv files and creates the graph
d3.dsv(';', fileNameCSVData).then(function (data) {
  samples = createSamples(data);
  const sampleNames = samples.map(sample => sample.id());
  tabulate_sample_data(sampleNames);
  chart = new SpectralChart('#main_section');
  chart.createGraph(samples[0]);
});


function asserTableExists(containerID, tableObjectId, cols) {
  const tableNotCreated = d3.select(`#${tableObjectId}`).empty();
  if (tableNotCreated) {
    const table = d3
      .select(`#${containerID}`)
      .append('table')
      .property('id', tableObjectId);
    const thead = table.append('thead');
    const tbody = table.append('tbody');

    // append the header row
    thead
      .append('tr')
      .selectAll('th')
      .data(cols)
      .enter()
      .append('th')
      .text(function (column) {
        return column;
      });
    return tbody;
  }
  return d3.select(`#${tableObjectId}`).select('tbody');

}

/**
 * Appends to #table_hold a table that holds all the samples
 * @param {*} data
 * @param {Array<String>} columns indicate the table collumns
 */
function tabulate(data, columns, containerID, useColorColumn, className) {
  const tableObjectId = `${containerID}table`;

  let tbody;
  const cols = columns;
  if (useColorColumn) {
    cols.push('Color');
  }
  tbody = asserTableExists(containerID, tableObjectId, cols)

  // create a row for each object in the data
  const rows = tbody
    .selectAll('tr')
    .data(data, d => d)
    .enter()
    .append('tr');

  // create a cell in each row for each column
  // At this point, the rows have data associated.
  // So the data function accesses it.
  rows
    .selectAll('td')
    .data(function (row) {
      // he does it this way to guarantee you only use the
      // values for the columns you provide.
      return columns.map(function (column) {
        // return a new object with a value set to the row's column value.
        if (column === 'Sample ID') {
          const idCheck = `${containerID}chk${row}`;
          return getCheckBoxHTML(idCheck, row, row, className);
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

    .html(function (cell) {
      return cell;
    });
  d3.selectAll('.chk_new_sample').on('change', function addNew() {
    const selectedSampleId = d3.select(this).attr('data-id');
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

  return this;
}

/**
 * Defines the color of the lines of the graph
 * @param {Int} sampleId
 * @returns object with with colors for all lines
 */
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
function tabulate_sample_data(sampleNames) {
  tabulate(sampleNames, ['Sample ID'], 'table_hold', true, 'chk_new_sample')
}

function tabulate_download_data(sampleNames) {
  tabulate(sampleNames, ['Sample ID'], 'table_download_csv', false, 'table_download_csvchk');
}

d3.select('#csv_import').on('change', function readCSVButton() {
  if (this.files.length === 1) {
    const file = this.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', event => {
      const fileUrl = event.target.result;
      d3.dsv(';', fileUrl).then(function (data) {
        const newSamples = createSamples(data);
        newSamples.forEach(s => samples.push(s));
        const sampleNames = newSamples.map(sample => sample.id());
        tabulate_sample_data(sampleNames);
      });
    });
    reader.readAsDataURL(file);
    this.value = '';
  }
});

d3.select('#btn_import_csv_visible').on('click', () => {
  document.getElementById('csv_import').dispatchEvent(new MouseEvent('click'));
});

d3.select('#inpLineWidth').on('input', () => {
  const lineStrokeWidth = getLineStrokeWidth();
  d3.selectAll('.line').style('stroke-width', lineStrokeWidth);
});

function getLineStrokeWidth() {
  return d3.select('#inpLineWidth').property('value');
}
function getCheckBoxHTML(idCheck, label, dataID, classEventListener) {
  return `<div class="custom-control custom-checkbox custom-control-check">
  <input type="checkbox" class="custom-control-input ${classEventListener}" id="${idCheck}" data-id="${dataID}">
  <label class="custom-control-label custom-control-check-label" for="${idCheck}">${label}</label>
</div>`;
}
