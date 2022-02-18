---
title: 'VizSpectralData: a WEB-Based Application for Hyperspectral Data Visualization'
tags:
  - nodejs
  - spectroscopy
  - continuum removal
  - reflectance spectra
  - spectroradiometer
authors:
  - name: Lucas Silveira Kupssinskü^[corresponding author]
    orcid: 0000-0003-2580-3996
    affiliation: 1 # (Multiple affiliations must be quoted)
  - name: Taina Thomassim Guimaraes # note this makes a footnote saying 'co-first author'
    orcid: 0000-0002-6362-6591
    affiliation: 1
  - name: Mauricio Roberto Veronez
    orcid: 0000-0002-5914-3546
    affiliation: 1
  - name: Luiz Gonzaga Jr.
    orcid: 0000-0002-7661-2447
    affiliation: 1
affiliations:
 - name: Vizlab | X-Reality and Geoinformatics Lab, Graduate Programme in Applied Computing, Unisinos University, São Leopoldo, 93022-750, RS, Brazil
   index: 1
date: 18 february 2022
bibliography: paper.bib


---

# Summary

To visualize and manipulate hyperspectral data collected mostly with 
spectroradiometers and imagining sensors, one relays mainly in proprietery 
and closed source options. This paper presents an alternative. VizSpectralData 
is an open source nodejs webapp that allows spectral data collected in 
csv files to be imported, visualized and processed in the web browser. 
It allows data import, visualize the reflectance signature as svg graphs, 
to apply continuum removal by division, and to compute derivative of the 
spectra. It also offers the possibility to download the continuum removal, 
derivative, convexhull and raw data.

# Statement of need

`VizSpectralData` is a web application designed for rapid and easy to use
visualization and simple processing of hyperspectral data. It is already
in use by several researchers and was used in data exploration in many
scientific publications such as [@kupssinsku2021; @taina2021].

In it present form it allows continuum removal by division as presented by
@clark1984reflectance, it estimates the continuum of the reflectance
spectra using the monotone algorithm proposed by @andrew1979another and
it allows numeric calculation of derivatives following the method of
@snrd. One example of such computations is found in Figure \autoref{fig:example} 

![Visualization of two distinct spectral signatures with continuun removal, convex hull and derivative.\label{fig:example}](images\sampleGraph.png)

The idea of the application is to provide fast access for simple
computations regarding the reflectance spectra without the need of installation 
of proprietary (often expensive) systems. 

# Acknowledgements

This research was funded by Petróleo Brasileiro S.A. (PETROBRAS) and Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP) grant Numbers 4600556376 and 4600583791;

# References