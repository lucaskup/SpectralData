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

Yet to be published.

## Credits
This work is credited to the [Vizlab | X-Reality and GeoInformatics Lab](http://www.vizlab.unisinos.br/) and the following authors and developers: [Lucas Silveira Kupssinskü](https://www.researchgate.net/profile/Lucas_Kupssinskue).


## License
``` 
MIT Licence (https://mit-license.org/) 
``` 

