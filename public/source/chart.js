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

  createGraph(actualSample) {
    // const actualSample = this.activeSamples[0];
    this.svg = d3
      .select(this.viewID)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right + 30)
      .attr('height', this.height + this.margin.top + this.margin.bottom + 30)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.x.domain(
      d3.extent(actualSample.spectra, function(d) {
        return d.band;
      })
    );
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

    this.createPathsDynamically();

    // this.setUpTooltip();
    return this;
  }

  adjustDomains() {
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
    }
  }

  setUpTooltip() {
    this.focus = this.svg
      .append('g')
      .attr('class', 'focus')
      .style('display', 'none');

    this.focus.append('circle').attr('r', 5);

    this.focus
      .append('rect')
      .attr('class', 'tooltip')
      .attr('width', 140)
      .attr('height', 50)
      .attr('x', 10)
      .attr('y', -22)
      .attr('rx', 4)
      .attr('ry', 4);

    this.focus
      .append('text')
      .attr('x', 18)
      .attr('y', -2)
      .text('Wavelength:');

    this.focus
      .append('text')
      .attr('class', 'tooltip-band')
      .attr('x', 95)
      .attr('y', -2);

    this.focus
      .append('text')
      .attr('x', 18)
      .attr('y', 18)
      .text('Intensity:');

    this.focus
      .append('text')
      .attr('class', 'tooltip-value')
      .attr('x', 95)
      .attr('y', 18);

    this.svg
      .append('rect')
      .attr('class', 'overlay')
      .attr('id', 'tooltipRectangle')
      .attr('width', this.width)
      .attr('height', this.height)
      .datum(this)
      .on('mouseover', () => {
        if (getValueOpacity()) {
          this.focus.style('display', null);
        }
      })
      .on('mouseout', () => {
        this.focus.style('display', 'none');
      })
      // eslint-disable-next-line no-use-before-define
      .on('mousemove', mousemove);

    function mousemove(that) {
      const actualData = that.lineComplete.datum();
      const x0 = that.x.invert(d3.mouse(this)[0]);
      const i = that.bisectDate(actualData, x0, 1);
      const d0 = actualData[i - 1];
      const d1 = actualData[i];
      const d = x0 - d0.band > d1.band - x0 ? d1 : d0;
      that.focus.attr(
        'transform',
        `translate(${that.x(d.band)},${that.y(d.value)})`
      );
      that.focus.select('.tooltip-band').text(d.band);
      that.focus.select('.tooltip-value').text(that.formatValue(d.value));
    }
  }

  addActiveSample(sample) {
    this.activeSamples.push(sample);
    this.createSingleGraphPath(sample);
    this.adjustDomains();
  }

  updateDerivative(derivativeOrder) {
    this.activeSamples.forEach(sample => {
      sample.derivativeOrder = derivativeOrder;
      d3.selectAll(`#line_derivative${sample.id()}`).remove();
      this.createSingleGraphPathDerivative(sample);
    });
  }

  removeActiveSample(sampleID) {
    this.activeSamples = this.activeSamples.filter(s => s.id() !== sampleID);
    d3.selectAll(`#line_value${sampleID}`).remove();
    d3.selectAll(`#line_convex_hull${sampleID}`).remove();
    d3.selectAll(`#line_continum${sampleID}`).remove();
    d3.selectAll(`#line_derivative${sampleID}`).remove();
    this.adjustDomains();
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

  createSingleGraphPathDerivative(sample) {
    const derivative = this.createLineForPathY1();

    this.svg
      .append('path')
      .datum(sample.getFirstOrderDerivative())
      .attr('class', 'line line_derivative')
      .style('stroke', 'black')
      .attr('id', `line_derivative${sample.id()}`)
      .attr('d', derivative)
      .style('opacity', getDerivativeOpacity());
  }

  createSingleGraphPath(sample) {
    const value = this.createLineForPathY();

    const convexHull = this.createLineForPathY();

    const continumRemoved = this.createLineForPathY1();

    this.svg
      .append('path')
      .datum(sample.spectra)
      .attr('class', 'line line_value')
      .attr('d', value)
      .attr('id', `line_value${sample.id()}`)
      .style('opacity', getValueOpacity());

    this.svg
      .append('path')
      .datum(sample.getConvexHull())
      .attr('class', 'line line_convex_hull')
      .style('stroke-dasharray', '3, 3')
      .style('stroke', 'red')
      .attr('id', `line_convex_hull${sample.id()}`)
      .attr('d', convexHull)
      .style('opacity', getHullOpacity());

    this.svg
      .append('path')
      .datum(sample.getContinumRemovedSpectra())
      .attr('class', 'line line_continum')
      .style('stroke', 'pink')
      .attr('id', `line_continum${sample.id()}`)
      .attr('d', continumRemoved)
      .style('opacity', getContinumOpacity());
    this.createSingleGraphPathDerivative(sample);
  }

  refreshAllPaths() {
    d3.selectAll('path').remove();
    this.adjustDomains();
    this.createPathsDynamically();
  }

  createPathsDynamically() {
    this.activeSamples.forEach(sample => {
      this.createSingleGraphPath(sample);
    });
  }
}
