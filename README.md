# SpectralData
This repository features a webapp to visualize and process hyperspectral data

<p align="center">
<img src="https://github.com/lucaskup/SpectralData/blob/master/images/sampleGraph.png" width="750" alt="Results"> 
</p>

# Table of contents 

- [Requirements](#requirements) 
- [Usage](#usage) 
- [How to cite](#how-to-cite) 
- [Credits](#credits) 
- [License](#license) 

## Requirements

All required libraries are packed in public/lib.

[d3.js](https://d3js.org/)

Besides that just run npm install in the root directory and be done with it :)

## Usage
You can access this app [here](https://spectral-data.herokuapp.com/)

There are options to calculate the continum, continum removed spectra and first derivatives.

The continum removal is based on the paper [Reflectance spectroscopy: Quantitative analysis techniques for remote sensing applications](https://doi.org/10.1029/JB089iB07p06329)

For the derivatives we thank [Pavel Holoborodko](http://www.holoborodko.com/pavel/numerical-methods/numerical-derivative/smooth-low-noise-differentiators/) for the insights on how to differentiate numerical noisy data. The guy knows his stuff!

If you want to run it locally just serve the public folder with a http server of your choice. Other option is to use a node server to host the express app (root folder).


## How to cite

If you find our work useful in your research please consider citing our paper:

L. S. Kupssinskü, T. T. Guimarães, C. L. Cazarin, L. Gonzaga and M. R. Veronez, "Vizspectraldata: a WEB-Based Application for Hyperspectral Data Visualization," 2021 IEEE International Geoscience and Remote Sensing Symposium IGARSS, 2021, pp. 5751-5754, doi: 10.1109/IGARSS47720.2021.9553756.

```
@INPROCEEDINGS{9553756,
    author={Kupssinskü, Lucas Silveira and 
            Guimarães, Tainá Thomassim and 
            Cazarin, Caroline Lessio and 
            Gonzaga, Luiz and 
            Veronez, Maurício Roberto},
    booktitle={2021 IEEE International Geoscience and Remote Sensing Symposium IGARSS}, 
    title={Vizspectraldata: a WEB-Based Application for Hyperspectral Data Visualization}, 
    year={2021},
    volume={},
    number={},
    pages={5751-5754},
    doi={10.1109/IGARSS47720.2021.9553756}
  }
```

## Credits
This work is credited to the [Vizlab | X-Reality and GeoInformatics Lab](http://www.vizlab.unisinos.br/) and the following authors and developers: [Lucas Silveira Kupssinskü](https://www.researchgate.net/profile/Lucas_Kupssinskue).


## License
``` 
MIT Licence (https://mit-license.org/) 
``` 

