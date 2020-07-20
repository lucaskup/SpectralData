"use strict";

class Sample {
  constructor(name, point) {
    this.name = name;
    this.point = point;
    this.spectra = [];
  }

  id() {
    return this.name + "-" + this.point;
  }
  addToSpectra(band, value) {
    this.spectra.push({ band, value });
  }
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
}
//const s = new Sample("Minha amostra",25);
