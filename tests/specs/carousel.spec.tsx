'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import Carousel from '../../src/Carousel';
import expect from 'expect.js';

describe('Carousel', function () {

  var container, component;

  function setup() {
    // Carousel = require('Carousel');
    container = document.createElement('DIV');
    document.body.appendChild(container);
  }
  function teardown() {
    ReactDOM.unmountComponentAtNode(container);
    document.body.removeChild(container);
    container = null;
  }

  describe('Build', function() {

    beforeEach(function() {
      setup();
    });

    afterEach(function() {
      teardown();
    });

    it('should render a .slider div', function() {
      component = ReactDOM.render(
        <Carousel>
          <p>Slide 1</p>
          <p>Slide 2</p>
          <p>Slide 3</p>
        </Carousel>,
        container
      );
      var list = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'slider'
      );
      expect(list.length).to.equal(1);
    });

    it('should render a .slider-frame div', function() {
      component = ReactDOM.render(
        <Carousel>
          <p>Slide 1</p>
          <p>Slide 2</p>
          <p>Slide 3</p>
        </Carousel>,
        container
      );
      var list = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'slider-frame'
      );
      expect(list.length).to.equal(1);
    });

    it('should render a .slider-list ul', function() {
      component = ReactDOM.render(
        <Carousel>
          <p>Slide 1</p>
          <p>Slide 2</p>
          <p>Slide 3</p>
        </Carousel>,
        container
      );
      var list = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'slider-list'
      );
      expect(list.length).to.equal(1);
    });

    it('should render children with a .slider-slide class', function() {
      component = ReactDOM.render(
        <Carousel>
          <p>Slide 1</p>
          <p>Slide 2</p>
          <p>Slide 3</p>
        </Carousel>,
        container
      );
      var list = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'slider-slide'
      );
      expect(list.length).to.equal(3);
    });

    it('should render decorators by default', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );
        var decorator1 = TestUtils.scryRenderedDOMComponentsWithClass(
          component,
          'slider-decorator-0'
        );
        var decorator2 = TestUtils.scryRenderedDOMComponentsWithClass(
          component,
          'slider-decorator-1'
        );
        var decorator3 = TestUtils.scryRenderedDOMComponentsWithClass(
          component,
          'slider-decorator-2'
        );
        expect(decorator1.length).to.equal(1);
        expect(decorator2.length).to.equal(1);
        expect(decorator3.length).to.equal(1);
    });

  });

  describe('Props', function() {

    beforeEach(function() {
      setup();
    });

    afterEach(function() {
      teardown();
    });

    it('should render with class "slider" with no props supplied', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );
        var slider = TestUtils.scryRenderedDOMComponentsWithClass(
          component,
          'slider'
        );
        expect(slider.length).to.equal(1);
    });

    it('should render with class "test" with className supplied', function() {
        component = ReactDOM.render(
          <Carousel className="test">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );
        var slider = TestUtils.scryRenderedDOMComponentsWithClass(
          component,
          'test'
        );
        expect(slider.length).to.equal(1);
    });

    it('should merge provided styles with the defaults', function() {
        component = ReactDOM.render(
          <Carousel style={{backgroundColor: 'black'}}>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );
        var slider: any = TestUtils.findRenderedDOMComponentWithClass(
          component,
          'slider'
        );
        expect(slider.style.backgroundColor).to.equal('black');
        expect(slider.style.display).to.equal('block');
    });

    it('should align to 0 if cellAlign is left', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={3} cellAlign="left" width="500px">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );
        var slider: any = TestUtils.findRenderedDOMComponentWithClass(
          component,
          'slider-list'
        );
        expect(slider.style.transform).to.equal('translate3d(0px, 0px, 0)');
    });

    it('should align to 200 if cellAlign is center', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={3} cellAlign="center" width="600px">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var slider: any = TestUtils.findRenderedDOMComponentWithClass(
        component,
          'slider-list'
        );
        expect(slider.style.transform).to.equal('translate3d(200px, 0px, 0)');
    });

    it('should align to 400 if cellAlign is right', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={3} cellAlign="right" width="600px">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var slider: any = TestUtils.findRenderedDOMComponentWithClass(
        component,
          'slider-list'
        );
        expect(slider.style.transform).to.equal('translate3d(400px, 0px, 0)');
    });

    it('should set slide width to 200 if cellSpacing is not provided', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={3} width="600px">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var slider: any[] = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
          'slider-slide'
        );
        expect(slider[0].style.width).to.equal('200px');
    });

    it('should set slide width to 180 if cellSpacing is set to 30', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={3} cellSpacing={30} width="600px">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var slider: any[] = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
          'slider-slide'
        );
        expect(slider[0].style.width).to.equal('180px');
    });

    it('should not add mouse handlers if dragging is false', function() {
        component = ReactDOM.render(
          <Carousel dragging={false}>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var frame: any = TestUtils.findRenderedDOMComponentWithClass(
        component,
          'slider-frame'
        );
        expect(frame.onMouseDown).to.be.undefined;
    });

    it('should add mouse handlers if dragging is true', function() {
        component = ReactDOM.render(
          <Carousel dragging={true}>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var frame: any = TestUtils.findRenderedDOMComponentWithClass(
        component,
          'slider-frame'
        );
        expect(frame.onMouseDown).to.be.defined;
    });

    it('should add frame margin if framePadding is supplied a value', function() {
        component = ReactDOM.render(
          <Carousel framePadding="40px">
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var frame: any = TestUtils.findRenderedDOMComponentWithClass(
        component,
          'slider-frame'
        );
        expect(frame.style.margin).to.equal('40px');
    });

    it('should set slideWidth to 1000 if slidesToShow is 1', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={1} width="1000px">
            <p className="test-slide">Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var slide: any[] = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
          'slider-slide'
        );

        expect(slide[0].style.width).to.equal('1000px');
    });

    it('should set slideWidth to 200 if slidesToShow is 3', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={3} width="600px">
            <p className="test-slide">Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        var slide: any[] = TestUtils.scryRenderedDOMComponentsWithClass(
        component,
          'slider-slide'
        );

        expect(slide[0].style.width).to.equal('200px');
    });

    it('should have currentSlide equal 2 for 4 slides if slidesToShow is 2, slidesToScroll is 2, and it advances', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={2} slidesToScroll={2}>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
            <p>Slide 4</p>
          </Carousel>,
          container
        );

        component.nextSlide();

        expect(component.state.currentSlide).to.equal(2);
    });

    it('should have currentSlide equal 1 for 3 slides if slidesToShow is 2, slidesToScroll is 2, and it advances', function() {
        component = ReactDOM.render(
          <Carousel slidesToShow={2} slidesToScroll={2}>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        component.nextSlide();

        expect(component.state.currentSlide).to.equal(1);
    });

    it('should set slidesToScroll to passed in slidesToScroll', function() {
        component = ReactDOM.render(
          <Carousel width="600px" slidesToScroll={3}>
            <p className="test-slider">Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        expect(component.state.slidesToScroll).to.equal(3);
    });

    it('should set slidesToScroll to 2 if slideWidth is 250px and slidesToScroll is auto',
      function() {
        component = ReactDOM.render(
          <Carousel slideWidth="250px" width="600px" slidesToScroll="auto">
            <p className="test-slide">Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        expect(component.state.slidesToScroll).to.equal(2);
    });

    it('should set slidesToScroll to 3 with slideWidth: 100px, cellSpacing: 100, slidesToScroll:auto',
      function() {
        component = ReactDOM.render(
          <Carousel slideWidth="100px" width="600px" slidesToScroll="auto" cellSpacing={100}>
            <p className="test-slide">Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        expect(component.state.slidesToScroll).to.equal(3);
    });

    it('should set slidesToScroll to 6 if slideWidth is 100px and slidesToScroll is auto',
      function() {
        component = ReactDOM.render(
          <Carousel slideWidth="100px" width="600px" slidesToScroll="auto">
            <p className="test-slide">Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        expect(component.state.slidesToScroll).to.equal(6);
    });
  });

  describe('Methods', function() {

    beforeEach(function() {
      setup();
    });

    afterEach(function() {
      teardown();
    });

    it('should advance if nextSlide() is called', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        component.nextSlide();

        expect(component.state.currentSlide).to.equal(1);
    });

    it('should not advance if nextSlide() is called and the currentSlide is the last slide', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        component.nextSlide();
        component.nextSlide();
        component.nextSlide();

        expect(component.state.currentSlide).to.equal(2);
    });

    it('should not go back if previousSlide() is called and the currentSlide is the first slide', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        component.previousSlide();

        expect(component.state.currentSlide).to.equal(0);
    });

    it('should go back if previousSlide() is called', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        component.nextSlide();
        component.previousSlide();

        expect(component.state.currentSlide).to.equal(0);
    });

    it('should go to 2 if goToSlide(2) is called', function() {
        component = ReactDOM.render(
          <Carousel>
            <p>Slide 1</p>
            <p>Slide 2</p>
            <p>Slide 3</p>
          </Carousel>,
          container
        );

        component.goToSlide(2);

        expect(component.state.currentSlide).to.equal(2);
    });

  });

});
