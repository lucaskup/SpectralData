/**
 * Creates an array of samples from the csv data
 * @param {*} data information read from d3 tsv function
 */
function createSamples(data) {
  const samples = [];
  // first two columns are reserved for sample name and reading point
  const nameField = data.columns[0];
  const pointField = data.columns[1];
  // for each of the bands in the csv file
  const bandColumns = data.columns.slice(2);
  data.forEach(row => {
    const s = new Sample(row[nameField], row[pointField]);

    bandColumns.forEach(band => {
      s.addToSpectra(band, row[band]);
    });
    samples.push(s);
  });
  return samples;
}

/**
 * Creates a CSV from a list of samples
 * @param {Array<Sample>} samplesToUse list of samples to produce csv content
 * @returns {String} csv content
 */
function createCSV(samplesToUse) {
  const exportReflectance = isReflectanceSelected();
  const exportHull = isConvexHullSelected();
  const exportContinum = isContinumRemovedSelected();
  const exportDerivative = isDerivativeSelected();
  // if nothing is selected return
  if (
    samplesToUse.length === 0 ||
    (!exportReflectance && !exportHull && !exportContinum && !exportDerivative)
  ) {
    return;
  }
  /* It is not trivial to get the columns of the csv file, this
  function is prepared to deal with multi spectral resolutions among the samples
  so it needs to compute the set of all wavelengths among all samples */
  const columnsList = Array.from(
    samplesToUse
      .map(s => s.spectra.map(sp => sp.band))
      .reduce((acumulator, currentValue) => {
        currentValue.forEach(band => acumulator.add(band));
        return acumulator;
      }, new Set())
  ).sort((a, b) => a - b);

  // High order function to create the csv lines
  const getCSVRepresentation = sample => (type, valueList) => {
    let line = `${sample.name};${sample.point};${type};`;
    let i = 0;
    columnsList.forEach(bandValue => {
      if (i < valueList.length && bandValue === valueList[i].band) {
        line += `${valueList[i].value};`;
        i++;
      } else {
        line += ';';
      }
    });
    line += '\r\n';
    return line;
  };
  // creates the header of the csv file
  let csvContent = `Sample;Point;Type;${columnsList.join(';')}\r\n`;
  // Iterates over the samples and creates one line for each of the options
  samplesToUse.forEach(sample => {
    const getCSVLine = getCSVRepresentation(sample);
    if (exportReflectance) {
      csvContent += getCSVLine('Reflectance', sample.spectra);
    }
    if (exportHull) {
      csvContent += getCSVLine('Hull', sample.getConvexHull());
    }
    if (exportContinum) {
      csvContent += getCSVLine('Continum', sample.getContinumRemovedSpectra());
    }
    if (exportDerivative) {
      csvContent += getCSVLine('Derivative', sample.getFirstOrderDerivative());
    }
  });
  return csvContent;
}
