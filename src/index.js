import React from 'react'
import isEqual from 'lodash.isequal'

export default class ResizablePanel extends React.Component {

  constructor(props) {
    super(props)
    let childCount = React.Children.count(props.children)

    this.renderPanel = this.renderPanel.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)

    this.state = {
      panels: Array.from({length: childCount}).map((child, index) => null)
    }
  }

  componentDidMount() {
    this.computeInitialState()
  }

  computeInitialState() {
    let panels = [...this.state.panels]
    let clientSize = this.isHorizontal
      ? 'clientWidth'
      : 'clientHeight'

    // let's resolve all permutations of possible panel arrangements
    // note the -1 on the iteration condition:
    // we're iterating by overlapping sets of two!

    for (let index = 0; index < this.props.children.length-1; index++) {
      let [currentFlex, nextFlex] = [this.isFlex(index), this.isFlex(index + 1)]

      // flex, flex
      if (currentFlex && nextFlex) {
        let [currentPanel, nextPanel] = [this.refs[`panel-${index}`], this.refs[`panel-${index + 1}`]]
        let [currentRatio, nextRatio] = this.calcRatio([currentPanel[clientSize], nextPanel[clientSize]])
        panels[index] = currentRatio
        panels[index + 1] = nextRatio
      }
      // flex, no-flex
      if (currentFlex && !nextFlex) {
        panels[index] = 1
        panels[index + 1] = this.props.initialSize[index + 1]
      }
      // no-flex, flex
      if (!currentFlex && nextFlex) {
        panels[index] = this.props.initialSize[index]
        panels[index + 1] = 1
      }
      // no-flex, no-flex
      if (!currentFlex && !nextFlex) {
        panels[index] = this.props.initialSize[index]
        panels[index + 1] = this.props.initialSize[index + 1]
      }
    }


    this.setState({panels})
    this.props.onChange(this.allActualSizes(clientSize))
  }

  allActualSizes(clientSize) {
    return this.state.panels.map((panel, index) => this.refs[`panel-${index}`][clientSize])
  }

  calcRatio([...sizes]) {
    let amount = sizes.length
    var totalSize = sizes.reduce((accumulator, item) => accumulator + item)
    return sizes.map(size => amount * size / totalSize)
  }

  get isHorizontal() {
    return this.props.direction === 'horizontal'
  }

  isResizable(index) {
    let isResizable = this.props.resizable[index]
    return isResizable === undefined
      ? true
      : isResizable
  }

  isFlex(index) {
    let isFlex = this.props.flex[index]
    return isFlex === undefined
      ? true
      : isFlex
  }

  panelStyle(index) {
    let isFlex = this.isFlex(index)
    let style = {
      display: 'flex',
      position: 'relative',
      flexShrink: 0,
      [this.isHorizontal ? 'maxWidth' : 'maxHeight']: this.props.maxSize[index],
      [this.isHorizontal ? 'minWidth' : 'minHeight']: this.props.minSize[index]

    }
    // minSize/maxSize is not supported by flexbox?
    // http://www.w3.org/TR/css3-flexbox/#min-size-auto
    if (isFlex) {
      style = {
        ...style,
        flexBasis: 0
      }
    }

    // did we already resolve sizes after mount
    if (this.state.panels[index] !== null) {
      // use resolved size value for either flexGrow or width/height
      if (isFlex) {
        style.flexGrow = this.state.panels[index]
      } else {
        style[this.isHorizontal ? 'width' : 'height'] = this.state.panels[index]
      }
    // no, this is our first time drawing
    } else {
      if (isFlex) {
        if (this.props.initialSize[index] === null) {
          style.flexGrow = 1
        } else {
          style[this.isHorizontal ? 'width' : 'height'] = this.props.initialSize[index]
        }
      } else {
        style[this.isHorizontal ? 'width' : 'height'] = this.props.initialSize[index]
      }
    }

    return style
  }

  resizeHandleStyle() {
    return {
      position: 'absolute',
      [this.isHorizontal ? 'width'        : 'height'      ]: 1,
      [this.isHorizontal ? 'height'       : 'width'       ]: '100%',
      [this.isHorizontal ? 'borderLeft'   : 'borderTop'   ]: `${this.props.resizeHandlePadding}px solid transparent`,
      [this.isHorizontal ? 'borderRight'  : 'borderBottom']: `${this.props.resizeHandlePadding}px solid transparent`,
      [this.isHorizontal ? 'marginRight'  : 'marginBottom']: -this.props.resizeHandlePadding,
      [this.isHorizontal ? 'right'        : 'bottom'      ]: 0,
      [this.isHorizontal ? 'top'          : 'left'        ]: 0,
      cursor: [this.isHorizontal ? 'col-resize' : 'row-resize'],
      backgroundClip: 'padding-box',
      boxSizing: 'content-box',
      backgroundColor: this.props.resizeHandleColor,
      zIndex: 1
    };
  }

  panelGroupStyle() {
    return {
      ...this.props.style,
      display: 'flex',
      flexGrow: 1,
      flexDirection: this.isHorizontal ? 'row' : 'column',
      overflow: 'hidden',
      position: 'relative'
    }
  }

  onMouseDown(index, e) {
    e.stopPropagation();

    let {clientX, clientY, which} = e
    let clientSize = this.isHorizontal
      ? 'clientWidth'
      : 'clientHeight'

    this.setState({
      currentIndex: index,
      initialAxis: this.isHorizontal
        ? clientX
        : clientY,
      currentPanel: this.refs[`panel-${index}`],
      nextPanel: this.refs[`panel-${index + 1}`],
      currentPanelInitialSize: this.refs[`panel-${index}`][clientSize],
      nextPanelInitialSize: this.refs[`panel-${index + 1}`][clientSize]
    });

    document.documentElement.addEventListener('mousemove', this.onMouseMove, false);
    document.documentElement.addEventListener('mouseup', this.onMouseUp, false);
  }

  onMouseMove({clientX, clientY, which}) {
    if (which !== 1) { return this.onMouseUp(); }

    let currentSize = null
    let index = this.state.currentIndex
    let [currentFlex, nextFlex] = [this.isFlex(index), this.isFlex(index + 1)]
    let panels = [...this.state.panels]
    let clientAxis = this.isHorizontal
      ? clientX
      : clientY

    let clientSize = this.isHorizontal
      ? 'clientWidth'
      : 'clientHeight'

    let clientOffset = this.isHorizontal
      ? 'left'
      : 'top'

    let mouseDelta = clientAxis - this.state.initialAxis

    // flex flex
    if (currentFlex && nextFlex) {
      let totalSize = this.state.currentPanel[clientSize] + this.state.nextPanel[clientSize]
      currentSize = clientAxis - this.state.currentPanel.getBoundingClientRect()[clientOffset]
      currentSize = this.clampToRange(currentSize, 0, totalSize)
      let nextSize = totalSize - currentSize

      let sizes = this.allActualSizes(clientSize)
      sizes[index] = currentSize
      sizes[index + 1] = nextSize
      let _panels = this.calcRatio(sizes)
      panels[index] = _panels[index]
      panels[index + 1] = _panels[index + 1]
    }
    // flex no-flex
    if (currentFlex && !nextFlex) {
      panels[index + 1] = this.state.nextPanelInitialSize - mouseDelta
    }
    // no-flex flex
    if (!currentFlex && nextFlex) {
      panels[index] = this.state.currentPanelInitialSize + mouseDelta
    }
    // no-flex no-flex
    if (!currentFlex && !nextFlex) {
      let totalSize = this.state.currentPanel.clientWidth + this.state.nextPanel[clientSize]
      currentSize = clientAxis - this.state.currentPanel.getBoundingClientRect()[clientOffset]
      currentSize = this.clampToRange(currentSize, 0, totalSize)

      let nextSize = totalSize - currentSize

      panels[index] = currentSize
      panels[index + 1] = nextSize
    }



    this.setState({panels})
    let sizes = this.allActualSizes(clientSize)
    this.props.onChange(sizes)
  }

  onMouseUp() {
    this.setState({ currentIndex: null, currentPanel: null, nextPanel: null });
    document.documentElement.removeEventListener('mousemove', this.onMouseMove, false);
    document.documentElement.removeEventListener('mouseup', this.onMouseUp, false);
  }

  clampToRange(val, minValue, maxValue) {
    return Math.min(Math.max(val, minValue), maxValue);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return isEqual(this.props, nextProps)
  }

	renderPanel(child, index, children) {
		child = child instanceof Object
			? child
			: <span>{child}</span>

    let resizeHandle = index + 1 !== children.length
      ? React.createElement('div', {
        className: 'resizable-panel-resize-handle',
        onMouseDown: this.isResizable(index)
          ? this.onMouseDown.bind(this, index)
          : null,
        style: this.resizeHandleStyle()
      })
      : null

    return React.createElement('div', {
      className: 'resizable-panel',
      key: index,
      ref: `panel-${index}`,
      style: this.panelStyle(index)
    }, child, resizeHandle)
	}

	render() {
		let {
      initialSize,
      minSize,
      maxSize,
      flex,
      resizable,
      resizeHandlePadding,
      resizeHandleColor,
			tagName, children,
			...props
		} = this.props

		children = children instanceof Array
			? children
			: [children]

    props = {
      ...props,
      style: this.panelGroupStyle()
    }

		return React.createElement(tagName, {
      ...props,
    }, children.map(this.renderPanel));
	}
}

ResizablePanel.propTypes = {
	tagName: React.PropTypes.string,
	className: React.PropTypes.string,
	initialSize: React.PropTypes.array.isRequired,
	minSize: React.PropTypes.array,
	maxSize: React.PropTypes.array,
	resizable: React.PropTypes.array.isRequired,
	direction: React.PropTypes.string,
	onChange: React.PropTypes.func,
	children: React.PropTypes.oneOfType([
		React.PropTypes.node,
		React.PropTypes.array,
		React.PropTypes.func
	]).isRequired
}

ResizablePanel.defaultProps = {
	tagName: 'div',
	className: 'resizable-panel',
  initialSize: [],
  minSize: [],
  maxSize: [],
  flex: [],
  resizable: [],
  resizeHandlePadding: 4,
  resizeHandleColor: 'grey',
	direction: 'horizontal',
	onChange() {},
}
