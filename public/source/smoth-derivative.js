// Defines logarithm version, calculated or extimated
// 1 = Stirling's approximation O(1) time and space complexity (some error on decimal places)
// 0 = Precomputed lookup table O(1) time and O(n) space complexity
const LOG_VERSION = 1;

/**
 *@param {int} N order of approximation Start in 5 odd numbers only
 * @param {*} spectra that will be used to approximate the derivative
 * @returns {Array<Number>} the derivative approximated by (f(x + h) -f(x))/h
 */
function smothNoiseRobustDifferentiator(N, spectra) {
  const firstDerivative = [];
  const M = (N - 1) / 2;
  const m = (N - 3) / 2;

  // nchoosek as defined in the equations differs from binomial
  // because it is defined for k<0
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
      const ck =
        (1 / Math.pow(2, 2 * m + 1)) *
        (nchoosek(2 * m, m - k + 1) - nchoosek(2 * m, m - k - 1));
      somation += ck * (spectra[i + k].value - spectra[i - k].value);
    }
    const dx = somation / h;

    firstDerivative.push([spectra[i].band, dx]);
  }
  return firstDerivative;
}

// precomputes the lookup table
if (LOG_VERSION === 0) {
  const size = 1000;
  const logLookup = new Array(size);
  logLookup[0] = 0;
  for (let i = 1; i <= size; ++i) logLookup[i] = logLookup[i - 1] + Math.log(i);
}

/**
 * This function will use a pre-computed lookup table
 * or Stirling's approximation for logf
 * @param {Number} n
 * @returns {Number} log(n)
 */
function logf(n) {
  if (LOG_VERSION === 0) {
    return logLookup[n];
  }
  return n === 0
    ? 0
    : (n + 0.5) * Math.log(n) -
        n +
        0.9189385332046728 +
        0.08333333333333333 / n -
        0.002777777777777778 * Math.pow(n, -3);
}

function binomial(n, k) {
  return Math.exp(logf(n) - logf(n - k) - logf(k));
}
