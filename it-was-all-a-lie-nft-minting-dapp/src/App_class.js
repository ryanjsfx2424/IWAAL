import './App.css';
import backgroundImageMobile from "./IMG_6638.png"
import backgroundImageDesktop from "./IMG_6636.png"
import mintButtonImage from "./MintTransparency.png"
import useWindowDimensions from './WindowDimensions';
import React from 'react';
import { Dimensions } from 'react-native'

class App extends React.Component {
  async mint() {
    return
  }
  constructor(props) {
    super(props)
    this.myRef = React.createRef();
  }

  componentDidMount() {
    Dimensions.addEventListener("change", (handler) => this.setState({
      wHeight: handler.window.height,
      wWidth: handler.window.width
    }))
  }

  // 410 x 365 at max
  // 400 x 350 at 1400 vw
  // 350 x 310 at 1300 vw
  // 334 x 293 at 1200 vw
  // 300 x 270 at 1100 vw
  // 280 x 250 at 1000 vw (and vw > vh)

  // let containerWidth = 400 
  // let containerHeight = 400
  // let margin = "0 auto"
  // let top = 0
  // let marginLeft = "0"
  // let backgroundImage = `url(${backgroundImageDesktop})`
  // if (height > width) {
  //     backgroundImage = `url(${backgroundImageMobile})`
  //     marginLeft = Math.round(0.19*width)
  //     margin = "0 0 0 " + marginLeft + "px"
  // }
  // console.log("margin: ", margin)

  // if (width < 1520) {
  //   containerWidth -= (1520-width)
  //   containerHeight -= (1520-width)
  // }



  render() {
    return (
      <div className="screen" style={{ backgroundImage:`url(${backgroundImageMobile})`}}>
      {/* <div className="screen"> */}
      {Dimensions.wHeight > Dimensions.wWidth && 
        <div style={{
            height: 200,
            width: 400
          }}></div>
      }
          <div className="container" 
            ref={this.myRef}
            style= {{
              margin: "0 auto",
              width: 400 + "px",
              height: 400 + "px",
              backgroundColor: "red",
          }}></div>
          {/* <div className="MintButton" style={{ backgroundImage:`url(${mintButtonImage})`}}
            onClick={() => {mint()}}>
          </div> */}
      </div>
    )  
  };
}

export default App;
