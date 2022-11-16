import './App.css';
import backgroundImageMobile from "./IMG_6623_words.png"
import backgroundImageDesktop from "./IMG_6611_words.png"
import mintButtonImage from "./MintTransparency.png"
import useWindowDimensions from './WindowDimensions';

function App() {
  const { height, width } = useWindowDimensions()

  async function mint() {
    return
  }

  console.log("h: ", height)
  console.log("w: ", width)
  console.log("w/h: ", width/height)

  // 410 x 365 at max
  // 400 x 350 at 1400 vw
  // 350 x 310 at 1300 vw
  // 334 x 293 at 1200 vw
  // 300 x 270 at 1100 vw
  // 280 x 250 at 1000 vw (and vw > vh)

  let topDivHeight = 200
  let containerWidth = 420 
  let containerHeight = 400
  let top = 0
  let marginLeft = Math.round(0.36*width)
  let backgroundImage = `url(${backgroundImageDesktop})`
  if (height > width) {
    containerWidth = 360
    containerHeight = 320
    backgroundImage = `url(${backgroundImageMobile})`
    marginLeft = Math.round(0.19*width)
    topDivHeight = 150
    if (width < 900) {
      containerWidth = 360
      containerHeight = 320
      marginLeft -= Math.floor((900 - width)/8.0)
      containerWidth -= Math.floor((900 - width)/6.0)
      containerHeight -= Math.floor((900 - width)/6.0)
    }
  } else if (width < 1520) {
    containerWidth = 400
    containerHeight = 400
    containerWidth  -= Math.floor((1520-width)/4.0)
    containerHeight -= Math.floor((1520-width)/4.0)
  } else if (height < 1000) {
    containerWidth = 400
    containerHeight = 400
    marginLeft = Math.round(0.36*width)
    containerWidth  -= Math.floor((1000-height)/4.0)
    containerHeight -= Math.floor((1000-height)/4.0)
    marginLeft += Math.floor((1000-height)/4.0)
  }
  if (width > height && width/height > 1.593 && height < 1000) {
    console.log("in if")
    containerWidth = 400
    containerHeight = 400
    marginLeft = Math.round(0.36*width)
    containerHeight -= Math.floor((1000-height)/2.5)
    containerWidth -= Math.floor((1000-height)/2.5)
    marginLeft += Math.floor((1000-height)/4.0)
    if (width < 1520) {
      marginLeft -= Math.floor((1520-width)/5.0)
    }
  }
  let margin = "0 0 0 " + marginLeft + "px"
  console.log("margin: ", margin)
  console.log("topDivHeight: ", topDivHeight)

  // if (width < 1520) {
  //   containerWidth -= (1520-width)
  //   containerHeight -= (1520-width)
  // }



  return (
    <div className="screen" style={{ 
      backgroundImage:backgroundImage,
    }}>
    <a style={{
      marginLeft: Math.round(width/2)}} href="https://raritysniper.com/nft-drops-calendar"></a>
    {/* <div className="screen"> */}
    {height > width && 
      <div style={{
          height: {topDivHeight} + "px",
          width: 400
        }}></div>
    }
        <audio src="./itwasallalie_music.mp3" autoPlay loop></audio>
        <div className="container" style= {{
            margin: margin,
            width: containerWidth + "px",
            height: containerHeight + "px",
            backgroundColor: "transparent"
        }}></div>
        {/* <div className="MintButton" style={{ backgroundImage:`url(${mintButtonImage})`}}
          onClick={() => {mint()}}>
        </div> */}
    </div>
  );
}

export default App;
