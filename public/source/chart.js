class SpectralChart {
  constructor(viewID) {
    this.viewID = viewID;
    this.activeSamples = [];

    this.margin = { top: 30, right: 120, bottom: 30, left: 50 };
    this.width = 1060 - this.margin.left - this.margin.right;
    this.height = 550 - this.margin.top - this.margin.bottom;
    this.tooltip = { width: 100, height: 100, x: 10, y: -30 };

    this.bisectDate = d3.bisector(function(d) {
      return d.band;
    }).left;

    this.formatValue = d3.format(',');

    this.x = d3.scaleLinear().range([0, this.width]);
    this.y = d3.scaleLinear().range([this.height, 0]);
    this.y1 = d3.scaleLinear().range([this.height, 0]);

    this.xAxis = d3
      .axisBottom(this.x)
      .ticks(10)
      .tickFormat(d3.format('i'));
    this.yAxis = d3.axisLeft(this.y);
    this.y1Axis = d3.axisRight(this.y1);
  }

  setupXDomain(oneSample) {
    this.x.domain(
      d3.extent(oneSample.spectra, function(d) {
        return d.band;
      })
    );
  }

  createGraph(actualSample) {
    // const actualSample = this.activeSamples[0];
    this.svg = d3
      .select(this.viewID)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right + 30)
      .attr('height', this.height + this.margin.top + this.margin.bottom + 30)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.setupXDomain(actualSample);
    const maxValue = d3.max(actualSample.spectra.map(d => d.value));

    const showNegativeValues = getDerivativeOpacity();
    const minValue = showNegativeValues ? -maxValue : 0;
    const minValueY1 = showNegativeValues ? -1 : 0;
    this.y.domain([minValue, maxValue]);
    this.y1.domain([minValueY1, 1]);

    this.svg
      .append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${this.y(0)})`)
      .call(this.xAxis);

    // text label for the x axis
    this.svg
      .append('text')
      .attr('class', 'axis-text')
      .attr(
        'transform',
        `translate(${this.width / 2} ,${this.height + this.margin.top + 10})`
      )
      .style('text-anchor', 'middle')
      .text('Wavelength [nm]');

    this.svg
      .append('g')
      .attr('class', 'y y0 axis')
      .call(this.yAxis);

    this.svg
      .append('text')
      .attr('class', 'axis-text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left)
      .attr('x', 0 - this.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Reflectance [%]');

    this.svg
      .append('g')
      .attr('transform', `translate(${this.width},0)`)
      .attr('class', 'y y1 axis')
      .call(this.y1Axis);
    this.svg
      .append('text')
      .attr('class', 'axis-text')
      .attr('transform', 'rotate(-90)')
      .attr('y', this.width + 30)
      .attr('x', 0 - this.height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Normalized Reflectance');
    this.clipPath = this.svg.append('g').attr('clip-path', 'url(#clip)');

    this.createPathsDynamically();

    return this;
  }

  adjustYDomain() {
    // const max_domain_y = d3.max(spectra.map((d) => d.value));
    if (this.activeSamples.length >= 1) {
      const maxDomainY = d3.max(
        this.activeSamples.map(d => d3.max(d.spectra.map(p => p.value)))
      );
      this.y = d3.scaleLinear().range([this.height, 0]);

      this.y1 = d3.scaleLinear().range([this.height, 0]);

      const showNegativeValues = getDerivativeOpacity();
      const minValue = showNegativeValues ? -maxDomainY : 0;
      const minValueY1 = showNegativeValues ? -1 : 0;

      this.y.domain([minValue, maxDomainY]);
      this.yAxis = d3.axisLeft(this.y);

      this.y1.domain([minValueY1, 1]);
      this.y1Axis = d3.axisRight(this.y1);
      this.svg
        .select('.y0')
        .transition(d3.transition().duration(500))
        .call(this.yAxis);
      this.svg
        .select('.y1')
        .transition(d3.transition().duration(500))
        .call(this.y1Axis);
      if (this.activeSamples.length >= 1) {
        this.recreateAllPAths();
      }
    }
  }

  /**
   * Used to recreathe all the paths on the graph
   * due to a possible change on domains
   */
  recreateAllPAths() {
    d3.selectAll('.line_value')
      .transition()
      .duration(500)
      .attr('d', this.createLineForPathY());
    d3.selectAll('.line_convex_hull')
      .transition()
      .duration(500)
      .attr('d', this.createLineForPathY());
    d3.selectAll('.line_continum')
      .transition()
      .duration(500)
      .attr('d', this.createLineForPathY1());
    d3.selectAll('.line_derivative')
      .transition()
      .duration(500)
      .attr('d', this.createLineForPathY1());
  }

  addActiveSample(sample) {
    this.activeSamples.push(sample);
    this.createSingleGraphPath(sample);
    this.adjustYDomain();
  }

  updateDerivative(derivativeOrder) {
    this.activeSamples.forEach(sample => {
      const derivativeColor = getLineColors(sample.id()).derivativeLineColor;

      sample.derivativeOrder = derivativeOrder;
      d3.selectAll(`#line_derivative${sample.id()}`).remove();

      this.createSingleGraphPathDerivative(sample, derivativeColor);
    });
  }

  removeActiveSample(sampleID) {
    this.activeSamples = this.activeSamples.filter(s => s.id() !== sampleID);
    d3.selectAll(`#line_value${sampleID}`).remove();
    d3.selectAll(`#line_convex_hull${sampleID}`).remove();
    d3.selectAll(`#line_continum${sampleID}`).remove();
    d3.selectAll(`#line_derivative${sampleID}`).remove();
    this.adjustYDomain();
  }

  createLineForPathY() {
    return d3
      .line()
      .x(d => this.x(d.band))
      .y(d => this.y(d.value));
  }

  createLineForPathY1() {
    return d3
      .line()
      .x(d => this.x(d.band))
      .y(d => this.y1(d.value));
  }

  createSingleGraphPathDerivative(sample, derivativeColor) {
    const derivative = this.createLineForPathY1();

    this.clipPath
      .append('path')
      .datum(sample.getFirstOrderDerivative())
      .attr('class', 'line line_derivative')
      .style('stroke', derivativeColor)
      .attr('id', `line_derivative${sample.id()}`)
      .attr('d', derivative)
      .style('opacity', getDerivativeOpacity());
  }

  createSingleGraphPath(sample) {
    const value = this.createLineForPathY();
    const convexHull = this.createLineForPathY();
    const continumRemoved = this.createLineForPathY1();

    const {
      valueLineColor,
      hullLineColor,
      continumLineColor,
      derivativeLineColor,
    } = getLineColors(sample.id());

    this.clipPath
      .append('path')
      .datum(sample.spectra)
      .attr('class', 'line line_value')
      .style('stroke', valueLineColor)
      .attr('d', value)
      .attr('id', `line_value${sample.id()}`)
      .style('opacity', getValueOpacity());

    this.clipPath
      .append('path')
      .datum(sample.getConvexHull())
      .attr('class', 'line line_convex_hull')
      .style('stroke-dasharray', '3, 3')
      .style('stroke', hullLineColor)
      .attr('id', `line_convex_hull${sample.id()}`)
      .attr('d', convexHull)
      .style('opacity', getHullOpacity());

    this.clipPath
      .append('path')
      .datum(sample.getContinumRemovedSpectra())
      .attr('class', 'line line_continum')
      .style('stroke', continumLineColor)
      .attr('id', `line_continum${sample.id()}`)
      .attr('d', continumRemoved)
      .style('opacity', getContinumOpacity());
    this.createSingleGraphPathDerivative(sample, derivativeLineColor);

    this.setupBrushZoom();
  }

  setupBrushZoom() {
    if (this.defs !== undefined) return;
    // Add a clipPath: everything out of this area won't be drawn.
    this.defs = this.svg
      .append('defs')
      .append('svg:clipPath')
      .attr('id', 'clip')
      .append('svg:rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('x', 0)
      .attr('y', 0);

    // Add brushing
    const brush = d3
      .brush() // Add the brush feature using the d3.brush function
      .extent([[0, 0], [this.width, this.height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on('end', () => {
        // What are the selected boundaries?
        const { selection } = d3.event;

        // If no selection, back to initial coordinate. Otherwise, update X and Y domain
        if (!selection) {
          if (!this.idleTimeout)
            return (this.idleTimeout = setTimeout(() => {
              this.idleTimeout = null;
            }, 350)); // This allows to wait a little bit
        } else {
          const [vertex1, vertex2] = selection;
          const extentX = [vertex1[0], vertex2[0]];
          const extentY = [vertex1[1], vertex2[1]];
          this.x.domain([this.x.invert(extentX[0]), this.x.invert(extentX[1])]);
          this.y.domain([this.y.invert(extentY[1]), this.y.invert(extentY[0])]);
          this.y1.domain([
            this.y1.invert(extentY[1]),
            this.y1.invert(extentY[0]),
          ]);
          console.log(this.width);
          this.clipPath.selectAll('.brush').call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
        }

        // Update axis and line position
        d3.selectAll('.x')
          .transition()
          .duration(500)
          .call(d3.axisBottom(this.x));
        d3.selectAll('.y0')
          .transition()
          .duration(500)
          .call(d3.axisLeft(this.y));
        d3.selectAll('.y1')
          .transition()
          .duration(500)
          .call(d3.axisRight(this.y1));
        this.recreateAllPAths();
      });
    // Add the brushing
    this.clipPath
      .append('g')
      .attr('class', 'brush')
      .call(brush);

    // If user double click, reinitialize the chart
    this.svg.on('dblclick', () => {
      if (this.activeSamples.length > 0) {
        this.setupXDomain(this.activeSamples[0]);
        d3.selectAll('.x')
          .transition()
          .duration(500)
          .call(d3.axisBottom(this.x));

        this.adjustYDomain();
      }
    });
  }

  refreshAllPaths() {
    d3.selectAll('path').remove();
    this.adjustYDomain();
    this.createPathsDynamically();
  }

  createPathsDynamically() {
    this.activeSamples.forEach(sample => {
      this.createSingleGraphPath(sample);
    });
  }

  /**
   * @returns true if there is a sample active and some graph is selected
   */
  isDisplayingSomething() {
    return (
      this.activeSamples.length > 0 &&
      (isReflectanceSelected() ||
        isConvexHullSelected() ||
        isContinumRemovedSelected() ||
        isDerivativeSelected())
    );
  }
}
