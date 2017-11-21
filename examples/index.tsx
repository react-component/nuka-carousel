'use strict';

import Carousel from '../src/carousel';
import React from 'react';
import ReactDom from 'react-dom';
import easingTypes, { easeOutElastic } from 'tween-functions';

class App extends React.Component<any, any> {
  state = {
    slideIndex: 0,
  };

  render() {
    return (<div>
      <Carousel
        style={{ minHeight: 100 }}
        autoplay
        wrapAround
        autoplayInterval={2000}
        resetAutoplay={false}
        slideIndex={this.state.slideIndex}
        afterSlide={newSlideIndex => this.setState({ slideIndex: newSlideIndex })}>
        <img src="http://placehold.it/1000x400&text=slide1" style={{ maxWidth: '100%' }} />
        <img src="http://placehold.it/1000x400&text=slide2" style={{ maxWidth: '100%' }} />
        <img src="http://placehold.it/1000x400&text=slide3" style={{ maxWidth: '100%' }} />
        <img src="http://placehold.it/1000x400&text=slide4" style={{ maxWidth: '100%' }} />
        <img src="http://placehold.it/1000x400&text=slide5" style={{ maxWidth: '100%' }} />
        <img src="http://placehold.it/1000x400&text=slide6" style={{ maxWidth: '100%' }} />
      </Carousel>
      <div style={{width: '50%', margin: 'auto'}}>
        <button onClick={() => this.setState({ slideIndex: 0 })}>1</button>
        <button onClick={() => this.setState({ slideIndex: 1 })}>2</button>
        <button onClick={() => this.setState({ slideIndex: 2 })}>3</button>
        <button onClick={() => this.setState({ slideIndex: 3 })}>4</button>
        <button onClick={() => this.setState({ slideIndex: 4 })}>5</button>
        <button onClick={() => this.setState({ slideIndex: 5 })}>6</button>
      </div>
    </div>);
  }
}

ReactDom.render(<App />, document.getElementById('__react-content'));
