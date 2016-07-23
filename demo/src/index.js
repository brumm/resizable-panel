import React from 'react'
import { render } from 'react-dom'
import Flex from 'flex-component'

import ResizablePanel from '../../src'
import styles from './style.css';

const options = {
	initialSize: [200,   null,  200],
	minSize:     [100,   100,  100],
	maxSize:     [300,   null,  300],
	flex:        [false, true,  false],
	resizable:   [true,  true],
	resizeHandleColor: '#cbd0d5',
}

const LOREM = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

class Demo extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      sizes: [1]
    }
  }

	render() {
		return (
			<Flex className={styles.app} direction='column'>
				<Flex className={styles.header} basis={38} shrink={0} alignItems='center'>
					<div style={{marginLeft: this.state.sizes[0]-1}} className={styles.spacer} />
					<button>Button</button>
				</Flex>

				<ResizablePanel {...options} onChange={sizes => this.setState({sizes})}>
					<ResizablePanel
						direction='vertical'
						initialSize={[null, 200]}
						minSize={[null, 200]}
						maxSize={[null, 400]}
						flex={[true, false]}
						resizable={[true]}
						className={styles.sidebar}
						resizeHandleColor={options.resizeHandleColor}
					>
						<Flex className={styles.content}>{LOREM}</Flex>
						<Flex className={styles.content}>{LOREM}</Flex>
					</ResizablePanel>

				  <Flex grow={1} className={styles.canvas}>{LOREM}</Flex>

					<ResizablePanel
						direction='vertical'
						initialSize={[null, null, null]}
						minSize={[null, null, null]}
						maxSize={[null, null, null]}
						flex={[true, true, true]}
						resizable={[true]}
						className={styles.sidebar}
						resizeHandleColor={options.resizeHandleColor}
					>
						<Flex className={styles.content}>{LOREM}</Flex>
						<Flex className={styles.content}>{LOREM}</Flex>
						<Flex className={styles.content}>{LOREM}</Flex>
					</ResizablePanel>
				</ResizablePanel>
			</Flex>
		);
	}
}

render(<Demo />, document.querySelector('#demo'))
