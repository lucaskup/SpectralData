"use strict";
/**
 * @class
 * Represents a sample point and its spectra
 */
class Sample {
  constructor(name, point) {
    this.name = name;
    this.point = point;
    this.spectra = [];
    this.convexHull = undefined;
    this.continumRemoved = undefined;
    this.firstDerivative = undefined;
    this.derivativeOrder = 0;
  }
  /**
   * @returns a unique id: name + "-" + point
   */
  id() {
    return this.name + "-" + this.point;
  }
  /**
   * Adds a new wavelength to the sample spectra
   * @param {String} band wavelength of the spectra
   * @param {String} value % of reflectance
   * @returns {ThisType} Fluent API
   */
  addToSpectra(band, value) {
    const convertBandValue = (x) => parseFloat(x.replace(",", "."));
    band = convertBandValue(band);
    value = convertBandValue(value);
    this.spectra.push({ band, value });
    return this;
  }
  /**
   * Sorts the spectra according to the wavelength
   */
  sortSpectra() {
    this.spectra = this.spectra.sort((a, b) => {
      if (a.band > b.band) {
        return 1;
      }
      if (a.band < b.band) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });
  }
  /**
   * This method has lazy processing implemented
   * @returns upper convex of this sample spectra
   */
  getConvexHull() {
    if (typeof this.convexHull === "undefined") {
      this.convexHull = calculateHull(this.spectra);
    }
    return this.convexHull;
  }
  /**
   * This method has lazy processing implemented
   * @returns spectra with continum removed
   */
  getContinumRemovedSpectra() {
    if (typeof this.continumRemoved === "undefined") {
      this.continumRemoved = removeContinum(this.spectra, this.getConvexHull());
    }
    return this.continumRemoved;
  }
  /**
   * This method has lazy processing implemented
   * @returns numerical extimation of first derivative by the derivative
   * definition law
   */
  getFirstOrderDerivative() {
    //if (typeof this.firstDerivative === "undefined" ) {
    if (this.derivativeOrder < 5) {
      this.firstDerivative = calculateFirstDerivative(this.spectra);
    } else {
      this.firstDerivative = smothNoiseRobustDifferentiator(
        this.derivativeOrder,
        this.spectra
      );
    }
    //}
    return this.firstDerivative;
  }
}

/**
 * Calculates the upper convex hull of the spectra passed on argument
 * @param {*} data Spectra that will be used to calculate the convex hull
 * @returns Convex Hull upper vertices
 */
function calculateHull(data) {
  let hull = [];
  // the function d3.polygonHull expects a list of vertices
  // (as its supposed to work for polygons)
  // vertices list is created using a map function
  const vertices = data.map((d) => [d.band, d.value]);

  hull = d3.polygonHull(vertices);

  hull.push(hull[0]);
  const start_index = hull.findIndex((d) => d[0] == data[0].band);
  hull = hull.slice(start_index, hull.length);
  return hull;
}

/**
 * Removes the continum from data spectre
 * @param {*} data The reflectances with bands and values
 * @param {vertices} hull The upper convex hull of the data reflectances
 * @returns Spectra with continum removed: value / convex hull
 */
function removeContinum(data, hull) {
  const continumRemoved = [];
  let indexHull = 0;
  /*
  the convex hull points are not as dense as
   the radiometer data, but we can find linear
  equations that describe each of the segments
   of the convex hull
  line equation f(x) = ax + b
  */

  // a = (f(x1) - f(x))/(x1 -x)
  const angularCoeficientA = (idx) =>
    (hull[idx + 1][1] - hull[idx][1]) / (hull[idx + 1][0] - hull[idx][0]);

  // b = f(x) - a*x
  const linearCoeficientB = (idx) =>
    hull[idx][1] - angularCoeficientA(idx) * hull[idx][0];

  //calculates the curified linear function in terms of hull index
  const hullLinearFunction = (idx) => (x) =>
    angularCoeficientA(idx) * x + linearCoeficientB(idx);

  //finally f is the linear function
  let f = hullLinearFunction(0);

  //for (let i = 0; i < data.length; i++) {
  data.forEach((reflectance) => {
    /*
    find the convexhull index, aka bewtween what points
    in the convex hull the current value goes
    eg: hullindexes [0,100,200]
    valueindexes [0,1,2,...,199,200]
    value index 45 is betwen hull indexes
    [0] = 0 and [1] = 100
    */
    if (reflectance.band > hull[indexHull + 1][0]) {
      indexHull++;
      f = hullLinearFunction(indexHull);
    }
    // find the line
    const x = reflectance.band;
    continumRemoved.push([x, +(reflectance.value / f(x)).toFixed(4)]);
  });

  return continumRemoved;
}
function calculateFirstDerivative(spectra) {
  const derivative = [];

  for (let i = 0; i < spectra.length - 1; i++) {
    const fx = spectra[i].value;
    const fxPlusH = spectra[i + 1].value;
    const h = spectra[i + 1].band - spectra[i].band;

    const dx = (fxPlusH - fx) / h;
    derivative.push([spectra[i].band, dx]);
  }
  //console.log(derivative);
  return derivative;
}

/**
 *@param {int} N order of approximation Start in 5 odd numbers only
 * @param {*} spectra that will be used to approximate the derivative
 * @returns {Array<Number>} the derivative approximated by (f(x + h) -f(x))/h
 */
function smothNoiseRobustDifferentiator(N, spectra) {
  //order of approximation

  let firstDerivative = [];
  const M = (N - 1) / 2;
  const m = (N - 3) / 2;

  const nchoosek = (n, k) => {
    if (k < 0) {
      return 0;
    }
    return binomial(n, k);
  };

  for (let i = M; i < spectra.length - M; i++) {
    let somation = 0;
    const h = (spectra[i + M].band - spectra[i - M].band) / (N - 1);
    for (let k = 1; k <= M; k++) {
      //console.log(k);
      const ck =
        (1 / Math.pow(2, 2 * m + 1)) *
        (nchoosek(2 * m, m - k + 1) - nchoosek(2 * m, m - k - 1));
      //console.log(ck);
      somation += ck * (spectra[i + k].value - spectra[i - k].value);
    }
    const dx = somation / h;

    firstDerivative.push([spectra[i].band, dx]);
  }
  return firstDerivative;
}
const size = 1000,
  logf = new Array(size);
logf[0] = 0;
for (var i = 1; i <= size; ++i) logf[i] = logf[i - 1] + Math.log(i);

function logf2(n) {
  return n === 0
    ? 0
    : (n + 0.5) * Math.log(n) -
        n +
        0.9189385332046728 +
        0.08333333333333333 / n -
        0.002777777777777778 * Math.pow(n, -3);
}

function binomial(n, k) {
  return Math.exp(logf[n] - logf[n - k] - logf[k]);
}

/**
 * Creates an array of samples from the csv data
 * @param {*} data information read from d3 tsv function
 */
function createSamples(data) {
  const samples = [];
  // first two columns are reserved for sample name and reading point
  const name_field = data.columns[0];
  const point_field = data.columns[1];
  // for each of the bands in the csv file
  const bandColumns = data.columns.slice(2);
  data.forEach((row) => {
    const s = new Sample(row[name_field], row[point_field]);

    bandColumns.forEach((band) => {
      s.addToSpectra(band, row[band]);
    });
    samples.push(s);
  });
  return samples;
}
