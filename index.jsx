import getCaretCoordinates from 'textarea-caret';
import ReactDOM from 'react-dom';
import throttle from 'lodash.throttle';
import React, { PropTypes } from 'react';

const MAX_PARTICLES = 500;
const PARTICLE_NUM_RANGE = () => 5 + Math.round(Math.random() * 5);
const PARTICLE_GRAVITY = 0.075;
const PARTICLE_ALPHA_FADEOUT = 0.96;
//小点点的坐标
const PARTICLE_VELOCITY_RANGE = {
  x: [-1, 1],
  y: [-3.5, -1.5]
};
//小点点的颜色
const COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#bcbd22',
  '#17becf'
];

class RagePower extends React.Component {
  //一种机制，验证别人使用组件时，提供的参数是否符合要求。
  static propTypes = {
    children: PropTypes.node,// children 必须是node类型
    onInput: PropTypes.func,
    colors: PropTypes.array
  }
//设置默认的props；https://github.com/facebook/react/issues/3725
  static defaultProps = {
    colors: COLORS
//   }
// 子类必须在constructor方法中调用super方法，否则新建实例时会报错。这是因为子类没有自己的this对象，
// 而是继承父类的this对象，然后对其进行加工。如果不调用super方法，子类就得不到this对象。
    
//     关于bind http://wwsun.github.io/posts/react-with-es6-part-3.html
//  关于throttle  创建一个节流函数，在 wait 秒内最多执行 func 一次的函数。  https://www.kancloud.cn/wizardforcel/lodash-doc-45/144227
  constructor(props, context) {
    super(props, context);
    this._drawFrame = this._drawFrame.bind(this);
    this._onInput = this._onInput.bind(this);
    this._shake = throttle(this._shake.bind(this), 100, { trailing: false });
    this._spawnParticles = throttle(this._spawnParticles.bind(this), 25, { trailing: false });
    this._particles = [];
  }

//   HTML5 <canvas> 标签用于绘制图像（通过脚本，通常是 JavaScript）。
//   http://www.runoob.com/jsref/dom-obj-canvas.html
  //   当前唯一的合法值是 "2d"，它指定了二维绘图，并且导致这个方法返回一个环境对象，该对象导出一个二维绘图 API。

//   Window 对象属性
//   http://www.runoob.com/jsref/obj-window.html
  componentDidMount() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvasContext = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    window.requestAnimationFrame(this._drawFrame);
  }
// node insert 
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/appendChild

  componentWillUnmount() {
    document.body.removeChild(this.canvas);
  }
// node remove
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/removeChild

// this.props.children 属性。它表示组件的所有子节点
// others style 在哪里定义的？
  render() {
    const { children, style, colors: _, ...others } = this.props;
    const newChildren = React.cloneElement(children, {
      onInput: this._onInput
    });
//     克隆并返回一个新的 ReactElement （内部子元素也会跟着克隆）
//     ，新返回的元素会保留有旧元素的 props、ref、key，也会集成新的 props（只要在第二个参数中有定义）。
//     而在 cloneElement 里第一个参数应该是 ReactElement：
// this.node ?
    return (
      <div
        {...others}
        style={{ position: 'relative', ...style }}
        ref={(ref) => this.node = ref}
      >
        { newChildren }
      </div>
    );
  }

// 下面代码是摘抄的
  /**
   * Following code is ported from: https://atom.io/packages/power-mode
   */
  _drawFrame() {
    this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._particles.forEach((particle) => {
      particle.velocity.y += PARTICLE_GRAVITY;
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      particle.alpha *= PARTICLE_ALPHA_FADEOUT;

      this.canvasContext.fillStyle = `rgba(${particle.color.join(',')}, ${particle.alpha})`;
      this.canvasContext.fillRect(Math.round(particle.x - 1), Math.round(particle.y - 1), 3, 3);
    });
    this._particles = this._particles
      .slice(Math.max(this._particles.length - MAX_PARTICLES, 0))
      .filter((particle) => particle.alpha > 0.1);
    window.requestAnimationFrame(this._drawFrame);
  }

  _shake() {
    const intensity = 1 + 2 * Math.random();
    const x = intensity * (Math.random() > 0.5 ? -1 : 1);
    const y = intensity * (Math.random() > 0.5 ? -1 : 1);

    this.node.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    setTimeout(() => this.node.style.transform = '', 75);
  }

  _spawnParticles(x, y) {
    const { colors } = this.props;
    const numParticles = PARTICLE_NUM_RANGE();
    for (let i = 0; i < numParticles; i++) {
      const colorCode = colors[i % colors.length];
      const r = parseInt(colorCode.slice(1, 3), 16);
      const g = parseInt(colorCode.slice(3, 5), 16);
      const b = parseInt(colorCode.slice(5, 7), 16);
      const color = [r, g, b];
      this._particles.push(this._createParticle(x, y, color));
    }
  }

  _createParticle(x, y, color) {
    return {
      x,
      y: y,
      alpha: 1,
      color,
      velocity: {
        x: PARTICLE_VELOCITY_RANGE.x[0] + Math.random() *
          (PARTICLE_VELOCITY_RANGE.x[1] - PARTICLE_VELOCITY_RANGE.x[0]),
        y: PARTICLE_VELOCITY_RANGE.y[0] + Math.random() *
          (PARTICLE_VELOCITY_RANGE.y[1] - PARTICLE_VELOCITY_RANGE.y[0])
      }
    };
  }

  _onInput(...args) {
    const { onInput } = this.props;
    onInput && onInput(...args);
    this._shake();
    const target = args[0].target;
    const origin = target.getBoundingClientRect();
    const { top, left } = getCaretCoordinates(target, target.selectionEnd);
    const charHeight = parseInt(getComputedStyle(target)['font-size']);
    setTimeout(() => this._spawnParticles(left + origin.left, top + origin.top + charHeight), 0);
  }
}

export default RagePower;
