'use strict';

import React from 'react';
import decorators from './decorators';
import ExecutionEnvironment from 'exenv';
import requestAnimationFrame from 'raf';

// from https://github.com/chenglou/tween-functions
function easeOutCirc(t, b, _c, d) {
  var c = _c - b;
  return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
}
function linear(t, b, _c, d) {
  var c = _c - b;
  return c * t / d + b;
}

const DEFAULT_STACK_BEHAVIOR = 'ADDITIVE';
const DEFAULT_DURATION = 300;
const DEFAULT_DELAY = 0;

const stackBehavior = {
  ADDITIVE: 'ADDITIVE',
  DESTRUCTIVE: 'DESTRUCTIVE',
};

const addEvent = (elem, type, eventHandle) => {
  if (elem === null || typeof (elem) === 'undefined') {
    return;
  }
  if (elem.addEventListener) {
    elem.addEventListener(type, eventHandle, false);
  } else if (elem.attachEvent) {
    elem.attachEvent('on' + type, eventHandle);
  } else {
    elem['on' + type] = eventHandle;
  }
};

const removeEvent = (elem, type, eventHandle) => {
  if (elem === null || typeof (elem) === 'undefined') {
    return;
  }
  if (elem.removeEventListener) {
    elem.removeEventListener(type, eventHandle, false);
  } else if (elem.detachEvent) {
    elem.detachEvent('on' + type, eventHandle);
  } else {
    elem['on' + type] = null;
  }
};

export type IDecoratorPosition = 'TopLeft' | 'TopCenter' | 'TopRight' | 'CenterLeft' | 'CenterCenter' |
  'CenterRight' | 'BottomLeft' | 'BottomCenter' | 'BottomRight';

export interface ICarouselProps {
  className?: string;
  style?: any;
  afterSlide?: (index: number) => void;
  autoplay?: boolean;
  resetAutoplay?: boolean;
  swipeSpeed?: number;
  autoplayInterval?: number;
  beforeSlide?: (currentIndex: number, endIndex: number) => void;
  cellAlign?: 'left' | 'center' | 'right';
  cellSpacing?: number;
  data?: () => void;
  decorators?: any[];
  dragging?: boolean;
  easing?: Function;
  edgeEasing?: Function;
  framePadding?: string;
  frameOverflow?: string;
  initialSlideHeight?: number;
  initialSlideWidth?: number;
  slideIndex?: number;
  slidesToShow?: number;
  slidesToScroll?: number | 'auto';
  slideWidth?: string | number;
  speed?: number;
  swiping?: boolean;
  vertical?: boolean;
  width?: string;
  wrapAround?: boolean;
}

class Carousel extends React.Component<ICarouselProps, any> {
  static defaultProps = {
    afterSlide: () => {},
    autoplay: false,
    resetAutoplay: true,
    swipeSpeed: 5,
    autoplayInterval: 3000,
    beforeSlide: () => {},
    cellAlign: 'left',
    cellSpacing: 0,
    data: () => {},
    decorators,
    dragging: true,
    easing: easeOutCirc,
    edgeEasing: linear,
    framePadding: '0px',
    frameOverflow: 'hidden',
    slideIndex: 0,
    slidesToScroll: 1,
    slidesToShow: 1,
    slideWidth: 1,
    speed: 500,
    swiping: true,
    vertical: false,
    width: '100%',
    wrapAround: false,
    style: {},
  } as ICarouselProps;

  touchObject: any;
  autoplayPaused: any;
  clickSafe: boolean;
  autoplayID: any;
  _rafID: any;

  constructor(props) {
    super(props);

    this.state = {
      currentSlide: this.props.slideIndex,
      dragging: false,
      frameWidth: 0,
      left: 0,
      slideCount: 0,
      slidesToScroll: this.props.slidesToScroll,
      slideWidth: 0,
      top: 0,
      tweenQueue: [],
    };
    this.touchObject = {};
    this.clickSafe = true;
  }

  componentWillMount() {
    this.setInitialDimensions();
  }

  componentDidMount() {
    this.setDimensions();
    this.bindEvents();
    this.setExternalData();
    if (this.props.autoplay) {
      this.startAutoplay();
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      slideCount: nextProps.children.length,
    });
    this.setDimensions(nextProps);
    if (this.props.slideIndex !== nextProps.slideIndex && nextProps.slideIndex !== this.state.currentSlide) {
      this.goToSlide(nextProps.slideIndex);
    }
    if (this.props.autoplay !== nextProps.autoplay) {
      if (nextProps.autoplay) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }
  }

  componentWillUnmount() {
    this.unbindEvents();
    this.stopAutoplay();
    requestAnimationFrame.cancel(this._rafID);
    this._rafID = -1;
  }

  // react-tween-state
  tweenState (path, { easing, duration, delay, beginValue, endValue, onEnd, stackBehavior: configSB }) {
    this.setState((state: any) => {
      let cursor = state;
      let stateName;
      // see comment below on pash hash
      let pathHash;
      if (typeof path === 'string') {
        stateName = path;
        pathHash = path;
      } else {
        for (let i = 0; i < path.length - 1; i++) {
          cursor = cursor[path[i]];
        }
        stateName = path[path.length - 1];
        pathHash = path.join('|');
      }
      // see the reasoning for these defaults at the top of file
      const newConfig = {
        easing,
        duration: duration == null ? DEFAULT_DURATION : duration,
        delay: delay == null ? DEFAULT_DELAY : delay,
        beginValue: beginValue == null ? cursor[stateName] : beginValue,
        endValue,
        onEnd,
        stackBehavior: configSB || DEFAULT_STACK_BEHAVIOR,
      };

      let newTweenQueue = state.tweenQueue;
      if (newConfig.stackBehavior === stackBehavior.DESTRUCTIVE) {
        newTweenQueue = state.tweenQueue.filter(item => item.pathHash !== pathHash);
      }

      // we store path hash, so that during value retrieval we can use hash
      // comparison to find the path. See the kind of shitty thing you have to
      // do when you don't have value comparison for collections?
      newTweenQueue.push({
        pathHash,
        config: newConfig,
        initTime: Date.now() + newConfig.delay,
      });

      // sorry for mutating. For perf reasons we don't want to deep clone.
      // guys, can we please all start using persistent collections so that
      // we can stop worrying about nonesense like this
      cursor[stateName] = newConfig.endValue;
      if (newTweenQueue.length === 1) {
        this._rafID = requestAnimationFrame(this._rafCb);
      }

      // this will also include the above mutated update
      return { tweenQueue: newTweenQueue };
    });
  }

  getTweeningValue(path) {
    const state: any = this.state;

    let tweeningValue;
    let pathHash;
    if (typeof path === 'string') {
      tweeningValue = state[path];
      pathHash = path;
    } else {
      tweeningValue = state;
      for (let i = 0; i < path.length; i++) {
        tweeningValue = tweeningValue[path[i]];
      }
      pathHash = path.join('|');
    }
    let now = Date.now();

    for (let i = 0; i < state.tweenQueue.length; i++) {
      const { pathHash: itemPathHash, initTime, config } = state.tweenQueue[i];
      if (itemPathHash !== pathHash) {
        continue;
      }

      const progressTime = now - initTime > config.duration
        ? config.duration
        : Math.max(0, now - initTime);
      // `now - initTime` can be negative if initTime is scheduled in the
      // future by a delay. In this case we take 0

      // if duration is 0, consider that as jumping to endValue directly. This
      // is needed because the easing functino might have undefined behavior for
      // duration = 0
      const easeValue = config.duration === 0 ? config.endValue : config.easing(
        progressTime,
        config.beginValue,
        config.endValue,
        config.duration,
        // TODO: some funcs accept a 5th param
      );
      const contrib = easeValue - config.endValue;
      tweeningValue += contrib;
    }

    return tweeningValue;
  }

  _rafCb = () => {
    const state: any = this.state;
    if (state.tweenQueue.length === 0) {
      return;
    }

    const now = Date.now();
    let newTweenQueue: Array<{}> = [];

    for (let i = 0; i < state.tweenQueue.length; i++) {
      const item = state.tweenQueue[i];
      const { initTime, config } = item;
      if (now - initTime < config.duration) {
        newTweenQueue.push(item);
      } else {
        if (config.onEnd) {
          config.onEnd();
        }
      }
    }

    // onEnd might trigger a parent callback that removes this component
    // -1 means we've canceled it in componentWillUnmount
    if (this._rafID === -1) {
      return;
    }

    this.setState({
      tweenQueue: newTweenQueue,
    });

    this._rafID = requestAnimationFrame(this._rafCb);
  }

  render() {
    const children = React.Children.count(this.props.children) > 1 ? this.formatChildren(
      this.props.children,
    ) : this.props.children;

    return (
      <div
        className={['slider', this.props.className || ''].join(' ')}
        ref="slider"
        style={{ ...this.getSliderStyles(), ...this.props.style }}
      >
        <div className="slider-frame"
          ref="frame"
          style={this.getFrameStyles()}
          {...this.getTouchEvents()}
          {...this.getMouseEvents()}
          onClick={this.handleClick}
        >
          <ul className="slider-list" ref="list" style={this.getListStyles()}>
            {children}
          </ul>
        </div>
        {this.props.decorators ?
          this.props.decorators.map((Decorator, index) => (
            <div
              style={{...this.getDecoratorStyles(Decorator.position), ...(Decorator.style || {})}}
              className={'slider-decorator-' + index}
              key={index}>
              <Decorator.component
                currentSlide={this.state.currentSlide}
                slideCount={this.state.slideCount}
                frameWidth={this.state.frameWidth}
                slideWidth={this.state.slideWidth}
                slidesToScroll={this.state.slidesToScroll}
                cellSpacing={this.props.cellSpacing}
                slidesToShow={this.props.slidesToShow}
                wrapAround={this.props.wrapAround}
                nextSlide={this.nextSlide}
                previousSlide={this.previousSlide}
                goToSlide={this.goToSlide} />
            </div>
          )) : null}
        <style type="text/css" dangerouslySetInnerHTML={{__html: this.getStyleTagStyles()}}/>
      </div>
    );
  }

  // Touch Events
  getTouchEvents() {
    let self = this;
    if (this.props.swiping === false) {
      return null;
    }

    return {
      onTouchStart(e) {
        self.touchObject = {
          startX: e.touches[0].pageX,
          startY: e.touches[0].pageY,
        };
        self.handleMouseOver();
      },
      onTouchMove(e) {
        const direction = self.swipeDirection(
          self.touchObject.startX,
          e.touches[0].pageX,
          self.touchObject.startY,
          e.touches[0].pageY,
        );

        if (direction !== 0) {
          e.preventDefault();
        }

        const length = self.props.vertical ? Math.round(
          Math.sqrt(Math.pow(e.touches[0].pageY - self.touchObject.startY, 2)),
        ) : Math.round(
          Math.sqrt(Math.pow(e.touches[0].pageX - self.touchObject.startX, 2)),
        );

        self.touchObject = {
          startX: self.touchObject.startX,
          startY: self.touchObject.startY,
          endX: e.touches[0].pageX,
          endY: e.touches[0].pageY,
          length,
          direction,
        };

        self.setState({
          left: self.props.vertical ? 0 : self.getTargetLeft(self.touchObject.length * self.touchObject.direction),
          top: self.props.vertical ? self.getTargetLeft(self.touchObject.length * self.touchObject.direction) : 0,
        });
      },
      onTouchEnd(e) {
        self.handleSwipe(e);
        self.handleMouseOut();
      },
      onTouchCancel(e) {
        self.handleSwipe(e);
      },
    };
  }

  getMouseEvents() {
    let self = this;
    if (this.props.dragging === false) {
      return null;
    }

    return {
      onMouseOver() {
        self.handleMouseOver();
      },
      onMouseOut() {
        self.handleMouseOut();
      },
      onMouseDown(e) {
        self.touchObject = {
          startX: e.clientX,
          startY: e.clientY,
        };

        self.setState({
          dragging: true,
        });
      },
      onMouseMove(e) {
        if (!self.state.dragging) {
          return;
        }

        const direction = self.swipeDirection(
          self.touchObject.startX,
          e.clientX,
          self.touchObject.startY,
          e.clientY,
        );

        if (direction !== 0) {
          e.preventDefault();
        }

        const length = self.props.vertical ? Math.round(
          Math.sqrt(Math.pow(e.clientY - self.touchObject.startY, 2)),
        ) : Math.round(
          Math.sqrt(Math.pow(e.clientX - self.touchObject.startX, 2)),
        );

        self.touchObject = {
          startX: self.touchObject.startX,
          startY: self.touchObject.startY,
          endX: e.clientX,
          endY: e.clientY,
          length,
          direction,
        };

        self.setState({
          left: self.props.vertical ? 0 : self.getTargetLeft(self.touchObject.length * self.touchObject.direction),
          top: self.props.vertical ? self.getTargetLeft(self.touchObject.length * self.touchObject.direction) : 0,
        });
      },
      onMouseUp(e) {
        if (!self.state.dragging) {
          return;
        }

        self.handleSwipe(e);
      },
      onMouseLeave(e) {
        if (!self.state.dragging) {
          return;
        }

        self.handleSwipe(e);
      },
    };
  }

  handleMouseOver() {
    if (this.props.autoplay) {
      this.autoplayPaused = true;
      this.stopAutoplay();
    }
  }

  handleMouseOut() {
    if (this.props.autoplay && this.autoplayPaused) {
      this.startAutoplay();
      this.autoplayPaused = null;
    }
  }

  handleClick = (e) => {
    if (this.clickSafe === true) {
      e.preventDefault();
      e.stopPropagation();

      if (e.nativeEvent) {
        e.nativeEvent.stopPropagation();
      }
    }
  }

  handleSwipe(_) {
    if (typeof (this.touchObject.length) !== 'undefined' && this.touchObject.length > 44) {
      this.clickSafe = true;
    } else {
      this.clickSafe = false;
    }

    let { slidesToShow, slidesToScroll, swipeSpeed } = this.props;
    // var slidesToShow = this.props.slidesToShow;
    if (slidesToScroll === 'auto') {
      slidesToShow = this.state.slidesToScroll;
    }

    if (this.touchObject.length > (this.state.slideWidth / slidesToShow!) / swipeSpeed!) {
      if (this.touchObject.direction === 1) {
        if (
          this.state.currentSlide >= React.Children.count(this.props.children) - slidesToShow! &&
          !this.props.wrapAround
        ) {
          this.animateSlide(this.props.edgeEasing);
        } else {
          this.nextSlide();
        }
      } else if (this.touchObject.direction === -1) {
        if (this.state.currentSlide <= 0 && !this.props.wrapAround) {
          this.animateSlide(this.props.edgeEasing);
        } else {
          this.previousSlide();
        }
      }
    } else {
      this.goToSlide(this.state.currentSlide);
    }

    this.touchObject = {};

    this.setState({
      dragging: false,
    });
  }

  swipeDirection(x1, x2, y1, y2) {
    let xDist = x1 - x2;
    let yDist = y1 - y2;
    let r = Math.atan2(yDist, xDist);
    let swipeAngle = Math.round(r * 180 / Math.PI);

    if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
    }
    if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
      return 1;
    }
    if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
      return 1;
    }
    if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
      return -1;
    }
    if (this.props.vertical === true) {
      if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
        return 1;
      } else {
        return -1;
      }
    }
    return 0;

  }

  autoplayIterator = () => {
    if (this.props.wrapAround) {
      return this.nextSlide();
    }
    if (this.state.currentSlide !== this.state.slideCount - this.state.slidesToShow) {
      this.nextSlide();
    } else {
      this.stopAutoplay();
    }
  }

  startAutoplay() {
    this.autoplayID = setInterval(this.autoplayIterator, this.props.autoplayInterval);
  }

  resetAutoplay() {
    if (this.props.resetAutoplay && this.props.autoplay && !this.autoplayPaused) {  // by warmhug
      this.stopAutoplay();
      this.startAutoplay();
    }
  }

  stopAutoplay() {
    if (this.autoplayID) {
      clearInterval(this.autoplayID);
    }
  }

  // Action Methods

  goToSlide = (index) => {
    let { beforeSlide, afterSlide } = this.props;
    if ((index >= React.Children.count(this.props.children) || index < 0)) {
      if (!this.props.wrapAround) { return; };
      if (index >= React.Children.count(this.props.children)) {
        beforeSlide!(this.state.currentSlide, 0);
        return this.setState({
          currentSlide: 0,
        }, () => {
          this.animateSlide(null, null, this.getTargetLeft(null, index), () => {
            this.animateSlide(null, 0.01);
            afterSlide!(0);
            this.resetAutoplay();
            this.setExternalData();
          });
        });
      } else {
        const endSlide = React.Children.count(this.props.children) - this.state.slidesToScroll;
        beforeSlide!(this.state.currentSlide, endSlide);
        return this.setState({
          currentSlide: endSlide,
        }, () => {
          this.animateSlide(null, null, this.getTargetLeft(null, index), () => {
            this.animateSlide(null, 0.01);
            afterSlide!(endSlide);
            this.resetAutoplay();
            this.setExternalData();
          });
        });
      }
    }

    beforeSlide!(this.state.currentSlide, index);

    this.setState({
      currentSlide: index,
    }, () => {
      this.animateSlide();
      this.props.afterSlide!(index);
      this.resetAutoplay();
      this.setExternalData();
    });
  }

  nextSlide = () => {
    const childrenCount = React.Children.count(this.props.children);
    let slidesToShow: number = this.props.slidesToShow!;
    if (this.props.slidesToScroll === 'auto') {
      slidesToShow = this.state.slidesToScroll;
    }
    if (this.state.currentSlide >= childrenCount - slidesToShow && !this.props.wrapAround) {
      return;
    }

    if (this.props.wrapAround) {
      this.goToSlide(this.state.currentSlide + this.state.slidesToScroll);
    } else {
      if (this.props.slideWidth !== 1) {
        return this.goToSlide(this.state.currentSlide + this.state.slidesToScroll);
      }
      this.goToSlide(
        Math.min(this.state.currentSlide + this.state.slidesToScroll, childrenCount - slidesToShow),
      );
    }
  }

  previousSlide = () => {
    if (this.state.currentSlide <= 0 && !this.props.wrapAround) {
      return;
    }

    if (this.props.wrapAround) {
      this.goToSlide(this.state.currentSlide - this.state.slidesToScroll);
    } else {
      this.goToSlide(Math.max(0, this.state.currentSlide - this.state.slidesToScroll));
    }
  }

  // Animation

  animateSlide(easing?: any, duration?: any, endValue?: any, callback?: Function) {
    this.tweenState(this.props.vertical ? 'top' : 'left', {
      easing: easing || this.props.easing,
      duration: duration || this.props.speed,
      endValue: endValue || this.getTargetLeft(),
      delay: null,
      beginValue: null,
      onEnd: callback || null,
      stackBehavior,
    });
  }

  getTargetLeft(touchOffset?: any, slide?: any) {
    let offset;
    let target = slide || this.state.currentSlide;
    let cellSpacing: number = this.props.cellSpacing!;
    switch (this.props.cellAlign) {
      case 'left': {
        offset = 0;
        offset -= cellSpacing * (target);
        break;
      }
      case 'center': {
        offset = (this.state.frameWidth - this.state.slideWidth) / 2;
        offset -= cellSpacing * (target);
        break;
      }
      case 'right': {
        offset = this.state.frameWidth - this.state.slideWidth;
        offset -= cellSpacing * (target);
        break;
      }
      default:
        break;
    }

    let left = this.state.slideWidth * target;

    let lastSlide = this.state.currentSlide > 0 && target + this.state.slidesToScroll >= this.state.slideCount;

    if (lastSlide && this.props.slideWidth !== 1 && !this.props.wrapAround && this.props.slidesToScroll === 'auto') {
      left = (this.state.slideWidth * this.state.slideCount) - this.state.frameWidth;
      offset = 0;
      offset -= cellSpacing * (this.state.slideCount - 1);
    }

    offset -= touchOffset || 0;

    return (left - offset) * -1;
  }

  // Bootstrapping

  bindEvents() {
    if (ExecutionEnvironment.canUseDOM) {
      addEvent(window, 'resize', this.onResize);
      addEvent(document, 'readystatechange', this.onReadyStateChange);
    }
  }

  onResize = () => {
    this.setDimensions();
  }

  onReadyStateChange = () => {
    this.setDimensions();
  }

  unbindEvents() {
    if (ExecutionEnvironment.canUseDOM) {
      removeEvent(window, 'resize', this.onResize);
      removeEvent(document, 'readystatechange', this.onReadyStateChange);
    }
  }

  formatChildren(children) {
    const positionValue = this.props.vertical ? this.getTweeningValue('top') : this.getTweeningValue('left');
    return React.Children.map(children, (child, index) => {
      return <li className="slider-slide" style={this.getSlideStyles(index, positionValue)} key={index}>{child}</li>;
    });
  }

  setInitialDimensions() {
    let { vertical, initialSlideHeight, initialSlideWidth, slidesToShow, cellSpacing, children } = this.props;
    const slideWidth = vertical ? (initialSlideHeight || 0) : (initialSlideWidth || 0);
    const slideHeight = initialSlideHeight ? initialSlideHeight * slidesToShow! : 0;
    const frameHeight = slideHeight + (cellSpacing! * (slidesToShow! - 1));

    this.setState({
      slideHeight,
      frameWidth: vertical ? frameHeight : '100%',
      slideCount: React.Children.count(children),
      slideWidth,
    }, () => {
      this.setLeft();
      this.setExternalData();
    });
  }

  setDimensions(props?: any) {
    props = props || this.props;

    let frameWidth;
    let frameHeight;
    let slideHeight;
    let slideWidth;
    let slidesToScroll = props.slidesToScroll;
    let frame = this.refs.frame;
    let firstSlide = (frame as any).childNodes[0].childNodes[0];

    if (firstSlide) {
      firstSlide.style.height = 'auto';
      slideHeight = this.props.vertical ?
        firstSlide.offsetHeight * props.slidesToShow :
        firstSlide.offsetHeight;
    } else {
      slideHeight = 100;
    }

    if (typeof props.slideWidth !== 'number') {
      slideWidth = parseInt(props.slideWidth, 10);
    } else {
      if (props.vertical) {
        slideWidth = (slideHeight / props.slidesToShow) * props.slideWidth;
      } else {
        slideWidth = ((frame as any).offsetWidth / props.slidesToShow) * props.slideWidth;
      }
    }

    if (!props.vertical) {
      slideWidth -= props.cellSpacing * ((100 - (100 / props.slidesToShow)) / 100);
    }

    frameHeight = slideHeight + (props.cellSpacing * (props.slidesToShow - 1));
    frameWidth = props.vertical ? frameHeight : (frame as any).offsetWidth;

    if (props.slidesToScroll === 'auto') {
      slidesToScroll = Math.floor(frameWidth / (slideWidth + props.cellSpacing));
    }

    this.setState({
      slideHeight,
      frameWidth,
      slideWidth,
      slidesToScroll,
      left: props.vertical ? 0 : this.getTargetLeft(),
      top: props.vertical ? this.getTargetLeft() : 0,
    }, () => {
      this.setLeft();
    });
  }

  setLeft() {
    this.setState({
      left: this.props.vertical ? 0 : this.getTargetLeft(),
      top: this.props.vertical ? this.getTargetLeft() : 0,
    });
  }

  // Data

  setExternalData() {
    if (this.props.data) {
      this.props.data();
    }
  }

  // Styles

  getListStyles() {
    let listWidth = this.state.slideWidth * React.Children.count(this.props.children);
    let cellSpacing = this.props.cellSpacing!;
    let spacingOffset = cellSpacing * React.Children.count(this.props.children);
    let transform = 'translate3d(' +
      this.getTweeningValue('left') + 'px, ' +
      this.getTweeningValue('top') + 'px, 0)';
    return {
      transform,
      WebkitTransform: transform,
      msTransform: 'translate(' +
        this.getTweeningValue('left') + 'px, ' +
        this.getTweeningValue('top') + 'px)',
      position: 'relative',
      display: 'block',
      margin: this.props.vertical ? (cellSpacing / 2) * -1 + 'px 0px'
                                  : '0px ' + (cellSpacing / 2) * -1 + 'px',
      padding: 0,
      height: this.props.vertical ? listWidth + spacingOffset : this.state.slideHeight,
      width: this.props.vertical ? 'auto' : listWidth + spacingOffset,
      cursor: this.state.dragging === true ? 'pointer' : 'inherit',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
    } as React.CSSProperties;
  }

  getFrameStyles() {
    return {
      position: 'relative',
      display: 'block',
      overflow: this.props.frameOverflow,
      height: this.props.vertical ? this.state.frameWidth || 'initial' : 'auto',
      margin: this.props.framePadding,
      padding: 0,
      transform: 'translate3d(0, 0, 0)',
      WebkitTransform: 'translate3d(0, 0, 0)',
      msTransform: 'translate(0, 0)',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
    } as React.CSSProperties;
  }

  getSlideStyles(index, positionValue) {
    let targetPosition = this.getSlideTargetPosition(index, positionValue);
    let cellSpacing: number = this.props.cellSpacing!;
    return {
      position: 'absolute',
      left: this.props.vertical ? 0 : targetPosition,
      top: this.props.vertical ? targetPosition : 0,
      display: this.props.vertical ? 'block' : 'inline-block',
      listStyleType: 'none',
      verticalAlign: 'top',
      width: this.props.vertical ? '100%' : this.state.slideWidth,
      height: 'auto',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      marginLeft: this.props.vertical ? 'auto' : cellSpacing / 2,
      marginRight: this.props.vertical ? 'auto' : cellSpacing / 2,
      marginTop: this.props.vertical ? cellSpacing / 2 : 'auto',
      marginBottom: this.props.vertical ? cellSpacing / 2 : 'auto',
    } as React.CSSProperties;
  }

  getSlideTargetPosition(index, positionValue) {
    let slidesToShow = (this.state.frameWidth / this.state.slideWidth);
    let targetPosition = (this.state.slideWidth + this.props.cellSpacing) * index;
    let end = ((this.state.slideWidth + this.props.cellSpacing) * slidesToShow) * -1;

    if (this.props.wrapAround) {
      let slidesBefore = Math.ceil(positionValue / (this.state.slideWidth));
      if (this.state.slideCount - slidesBefore <= index) {
        return (this.state.slideWidth + this.props.cellSpacing) *
          (this.state.slideCount - index) * -1;
      }

      let slidesAfter = Math.ceil((Math.abs(positionValue) - Math.abs(end)) / this.state.slideWidth);

      if (this.state.slideWidth !== 1) {
        slidesAfter = Math.ceil((Math.abs(positionValue) - (this.state.slideWidth)) / this.state.slideWidth);
      }

      if (index <= slidesAfter - 1) {
        return (this.state.slideWidth + this.props.cellSpacing) * (this.state.slideCount + index);
      }
    }

    return targetPosition;
  }

  getSliderStyles() {
    return {
      position: 'relative',
      display: 'block',
      width: this.props.width,
      height: 'auto',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      visibility: this.state.slideWidth ? 'visible' : 'hidden',
    };
  }

  getStyleTagStyles() {
    return '.slider-slide > img {width: 100%; display: block;}';
  }

  getDecoratorStyles(position) {
    switch (position) {
    case 'TopLeft':
      {
        return {
          position: 'absolute',
          top: 0,
          left: 0,
        };
      }
    case 'TopCenter':
      {
        return {
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          WebkitTransform: 'translateX(-50%)',
          msTransform: 'translateX(-50%)',
        };
      }
    case 'TopRight':
      {
        return {
          position: 'absolute',
          top: 0,
          right: 0,
        };
      }
    case 'CenterLeft':
      {
        return {
          position: 'absolute',
          top: '50%',
          left: 0,
          transform: 'translateY(-50%)',
          WebkitTransform: 'translateY(-50%)',
          msTransform: 'translateY(-50%)',
        };
      }
    case 'CenterCenter':
      {
        return {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          WebkitTransform: 'translate(-50%, -50%)',
          msTransform: 'translate(-50%, -50%)',
        };
      }
    case 'CenterRight':
      {
        return {
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          WebkitTransform: 'translateY(-50%)',
          msTransform: 'translateY(-50%)',
        };
      }
    case 'BottomLeft':
      {
        return {
          position: 'absolute',
          bottom: 0,
          left: 0,
        };
      }
    case 'BottomCenter':
      {
        return {
          position: 'absolute',
          bottom: 0,
          width: '100%',
          textAlign: 'center',
        };
      }
    case 'BottomRight':
      {
        return {
          position: 'absolute',
          bottom: 0,
          right: 0,
        };
      }
    default:
      {
        return {
          position: 'absolute',
          top: 0,
          left: 0,
        };
      }
    }
  }
}

export default Carousel;
