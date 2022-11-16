import './App.css';
import backgroundImageMobileBeforeMint from "./IMG_6623_words.png"
import backgroundImageDesktopBeforeMint from "./IMG_6611_words.png"
import backgroundImageMobile from "./IMG_6638.png"
import backgroundImageDesktop from "./IMG_6636.png"
import mintButtonImage from "./MintTransparency_cropped.png"
import mintedDisplayImage from "./MintedTransparency_cropped.png"
import openseaLogo from "./OpenseaTransparency_cropped.png"
import twitterLogo from "./TwitterTransparency_cropped.png"
import plusButtonImage from "./PlusTransparency_cropped.png"
import minusButtonImage from "./MinusTransparency_cropped.png"
import toMintIndicatorImage from "./IndicatorTransparency_cropped.png"
import mintedIndicatorImage from "./MintedIndicatorTransparency_cropped.png"
import useWindowDimensions from './WindowDimensions';
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import keccak256 from 'keccak256'
import MerkleTree from 'merkletreejs'
import Web3 from 'web3'
import Web3EthContract from 'web3-eth-contract'
import contractABI from './abi_v3p2.json';
import wlt from './TEAM.json';
import wlp from './WL.json';

// require('dotenv').config()
const CHAIN_ID = 5 // GOERLI
const CHAIN_NAME = "GOERLI TESTNET"
// const CHAIN_ID = 0x1 // ETH
// const CHAIN_NAME = "ETH MAINNET"
const contractAddress = "0xf401B5a716519cf35B8066aB8eAA692f66849E91"
const ETHERSCAN_LINK = "https://goerli.etherscan.io/address/" + contractAddress

function App() {
    const [mintAmount,       setMintAmount]         = useState(1)
    const [supplyMinted,     setSupplyMinted]       = useState("?/8888")
    const [isButtonDisabled, setIsButtonDisabled]   = useState(false)
    const [isWalletConnected, setIsWalletConnected] = useState(false)
    const [isCorrectChain,    setIsCorrectChain]    = useState(false)

    const { height, width } = useWindowDimensions()

    const connectWallet = async () => {
      if (window.ethereum) {
          console.log("has window ethereum");
  
          var account;
          try {
              // account = await window.ethereum.request({method: 'eth_accounts'})
              let accounts = await window.ethereum.request({method: 'eth_requestAccounts'})
              console.log("accounts: ", accounts)
              account = accounts[0]
              console.log("got account: ", account)
          } catch {
              alert("error grabbing account")
              console.log("error grabbing account");
              account = "";
              return {success: false}
          }
  
          if (account.length > 0) {
              var chainId;
              try {
                  chainId = await window.ethereum.request({method: 'net_version'})
              } catch {
                  alert("error grabbing chainId")
                  console.log("error grabbing chainId");
                  chainId = -1;
                  return {success: false}
              }  
              setIsWalletConnected(true)
  
              if (Number(chainId) === CHAIN_ID) {
                  setIsCorrectChain(true)
                  return {success: true}
              } else {
                  setIsCorrectChain(false)
                  alert("Change chain to " + CHAIN_NAME);
                  return {success: false}
              }
          } else {
              setIsWalletConnected(false)
              setIsCorrectChain(false)
              alert("Could not get account - have you logged into metamask?")
              return {success: false}
          }
      } else {
          alert("install metamask extension!!");
          return {success: false}
      }
    };

    function hashAccount(userAddress) {
      return Buffer.from(ethers.utils.solidityKeccak256(['address'], [userAddress]).slice(2), 'hex');
    }

    function generateMerkleTree(addresses) {
      const merkleTree = new MerkleTree(
        addresses.map(hashAccount), keccak256, { sortPairs: true }
      );
      return merkleTree;
    }

    const postRequestMerkle = async(wallet) => {          
        let merkleTreeTeam  = new MerkleTree(wlt.map(hashAccount), keccak256, { sortPairs: true });
        let merkleTreeWL    = new MerkleTree(wlp.map(hashAccount), keccak256, { sortPairs: true });
        let merkleProofTeam = merkleTreeTeam.getHexProof(hashAccount(wallet));
        let merkleProofWL   = merkleTreeWL.getHexProof(  hashAccount(wallet));

        console.log("team hex root: ", merkleTreeTeam.getHexRoot());
        console.log("wl hex root: ", merkleTreeWL.getHexRoot());

        if        (merkleTreeTeam.verify(merkleProofTeam, keccak256(wallet), merkleTreeTeam.getHexRoot())) {
            return [merkleProofTeam, "team"]
        } else if (merkleTreeWL.verify(  merkleProofWL,   keccak256(wallet), merkleTreeWL.getHexRoot())) {
            return [merkleProofWL, "wl"]
        } else {
            return [-1, -1]
        }
    }

    const getNumLeftToMint = async() => {
        let merkleStuff = await postRequestMerkle(window.ethereum.selectedAddress);
        let merkleType  = merkleStuff[1]
        console.log("merkleStuff: ", merkleStuff)

        Web3EthContract.setProvider(window.ethereum);
        const SmartContractObj = new Web3EthContract(contractABI, contractAddress)

        let mintLimit;
        if (merkleType === "team") {
            mintLimit = await SmartContractObj.methods.mint_limit_team().call()
        } else if (merkleType === "wl") {
            mintLimit = await SmartContractObj.methods.mint_limit_wl().call()
        } else {
            mintLimit = await SmartContractObj.methods.mint_limit_public().call()
        }
        let numMinted = await SmartContractObj.methods.balanceOf(window.ethereum.selectedAddress).call()

        console.log("mintLimit: ", mintLimit)
        console.log("numMinted: ", numMinted)
        console.log("wallet: ", window.ethereum.selectedAddress)

        return (mintLimit - numMinted)
    }

    const updateTotalMinted = async() => {
        Web3EthContract.setProvider(window.ethereum);
        const SmartContractObj = new Web3EthContract(contractABI, contractAddress)

        let localNumMinted = await SmartContractObj.methods.totalSupply().call()
        setSupplyMinted(localNumMinted + "/8888")
    }

    async function handleMint() {
        setIsButtonDisabled(true)
        console.log("handled mint click")

        let result = await connectWallet()
        if (result.success === false) {
            setIsButtonDisabled(false)
            return
        }
        
        Web3EthContract.setProvider(window.ethereum);
        let web3 = new Web3(window.ethereum);
        const SmartContractObj = new Web3EthContract(contractABI, contractAddress)

        let merkleStuff = await postRequestMerkle(window.ethereum.selectedAddress)
        let merkleProof = merkleStuff[0]
        let merkleType  = merkleStuff[1]

        if (merkleType === "team") {
            let gasLimitEstimate;
            try {
                gasLimitEstimate = await SmartContractObj.methods.teamMint_8hh(mintAmount, merkleProof).estimateGas({
                    from: window.ethereum.selectedAddress
                  })
            } catch (err) {
                console.log("166 team mint err: ", err);
                alert("😥 Something went wrong while estimating gas limit, team mint: " + err.message)
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 Something went wrong while estimating gas limit, team mint: " + err.message
                }
            }
            console.log("got team gasLimitEstimate! ", gasLimitEstimate);
            console.log({
                gasLimitEstimate: gasLimitEstimate,
            });
            let gasPriceEstimate = await web3.eth.getGasPrice();
            console.log({resultOfGasPriceEstimate: gasPriceEstimate});

            try {
                const receipt = await SmartContractObj.methods.teamMint_8hh(mintAmount, merkleProof).send({
                    gasLimit: String(Math.round(1.2 * gasLimitEstimate)),
                    gasPrice: String(Math.round(1.1 * gasPriceEstimate)),
                    to: contractAddress,
                    from: window.ethereum.selectedAddress
                });
                console.log("188 team mint receipt: ", receipt);
                alert("mint was successful!")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: true,
                    status: receipt,
                    status2: "SUCCESS",
                }
            } catch (err) {
                console.log("196 team mint err", err);
                alert("😥 Something went wrong while trying to mint team.")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 Something went wrong while trying to mint team."
                }
            } 
        } else if (merkleType === "wl") {
            let is_wl_sale_active = await SmartContractObj.methods.WL_sale().call()

            if (!is_wl_sale_active) {
                alert("😥 this wallet is WL'd but WL sale is not active. If public sale is active, try using a different wallet.")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 this wallet is WL'd but WL sale is not active. If public sale is active, try using a different wallet."
                }
            }

            let wl_sale_cost = await SmartContractObj.methods.wl_sale_cost().call()
            let totalCostWei = String(wl_sale_cost*mintAmount)
            let gasLimitEstimate;
            try {
                gasLimitEstimate = await SmartContractObj.methods.wlMint_ttv(mintAmount, merkleProof).estimateGas({
                    from: window.ethereum.selectedAddress,
                    value: totalCostWei
                })
            } catch (err) {
                console.log("241 wl mint err: ", err);
                alert("😥 Something went wrong while estimating gas limit, WL mint: " + err.message)
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 Something went wrong while estimating gas limit, WL mint: " + err.message
                            }
                }
            console.log("got WL gasLimitEstimate! ", gasLimitEstimate);
            console.log({
                gasLimitEstimate: gasLimitEstimate,
            });
            let gasPriceEstimate = await web3.eth.getGasPrice();
            console.log({resultOfGasPriceEstimate: gasPriceEstimate});

            try {
                const receipt = await SmartContractObj.methods.wlMint_ttv(mintAmount, merkleProof).send({
                    gasLimit: String(Math.round(1.2 * gasLimitEstimate)),
                    gasPrice: String(Math.round(1.1 * gasPriceEstimate)),
                    to: contractAddress,
                    value: totalCostWei,
                    from: window.ethereum.selectedAddress});

                console.log("263 wl mint receipt: ", receipt);
                alert("mint was successful!")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: true,
                    status: receipt,
                    status2: "SUCCESS",
                }
            } catch (err) {
                console.log("270 wl mint err", err);
                alert("😥 Something went wrong while trying to mint WL.")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 Something went wrong while trying to mint WL."
                }
            }
        } else {
            let is_public_sale_active = await SmartContractObj.methods.public_sale().call()


            if (!is_public_sale_active) {
                alert("😥 public sale is not active and this wallet is not team nor WL'd. Wait for public mint to start.")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 public sale is not active and this wallet is not team nor WL'd. Wait for public mint to start."
                }
            }
            let public_sale_cost = await SmartContractObj.methods.public_sale_cost().call()
            let totalCostWei = String(public_sale_cost*mintAmount)

            let gasLimitEstimate;
            try {
                gasLimitEstimate = await SmartContractObj.methods.publicMint_1VS(mintAmount).estimateGas({
                    from: window.ethereum.selectedAddress,
                    value: totalCostWei
                    })
            } catch (err) {
                console.log("286 public mint err: ", err);
                alert("😥 Something went wrong while estimating gas limit, public mint: " + err.message)
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 Something went wrong while estimating gas limit, public mint: " + err.message
                }
            }
            console.log("got public gasLimitEstimate! ", gasLimitEstimate);
            console.log({
                gasLimitEstimate: gasLimitEstimate,
            });
            let gasPriceEstimate = await web3.eth.getGasPrice();

            console.log({resultOfGasPriceEstimate: gasPriceEstimate});
    
            try {
                const receipt = await SmartContractObj.methods.publicMint_1VS(mintAmount).send({
                    gasLimit: String(Math.round(1.2 * gasLimitEstimate)),
                    gasPrice: String(Math.round(1.1 * gasPriceEstimate)),
                    to: contractAddress,
                    value: totalCostWei,
                    from: window.ethereum.selectedAddress
                });
                console.log("310 public mint receipt: ", receipt);
                alert("mint was successful!")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: true,
                    status: receipt,
                    status2: "SUCCESS",
                }
            } catch (err) {
                console.log("318 public mint err", err);
                alert("😥 Something went wrong while trying to mint public.")
                await updateTotalMinted()
                setIsButtonDisabled(false)
                return {
                    success: false,
                    status: "😥 Something went wrong while trying to mint public."
                }
            }
        }
        setIsButtonDisabled(false)
        return
    }

    async function handlePlusButton() {
        setIsButtonDisabled(true)
        console.log("handled plus click")

        let result = await connectWallet()
        if (result.success === false) {
            return
        }
        let localMax = await getNumLeftToMint()
        console.log("340 localMax: ", localMax)
        if (localMax === null) {
            localMax = 5
        }

        let localMintAmount = Math.min(mintAmount + 1, localMax)
        setMintAmount(localMintAmount)

        await updateTotalMinted()

        setIsButtonDisabled(false)
        return
    }

    async function handleMinusButton() {
        setIsButtonDisabled(true)
        console.log("handled minus click")

        let localMintAmount = Math.max(mintAmount - 1, 0)
        setMintAmount(localMintAmount)

        setIsButtonDisabled(false)
        return
    }

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

    return (
        <div className="screen" style={{ 
          backgroundImage:backgroundImage,
        }}>
            <a style={{
                marginLeft: Math.round(width/2)}} href="https://raritysniper.com/nft-drops-calendar"
            ></a>
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
                backgroundColor: "transparent",
                outline: "1px dotted blue"
            }}>
            
                <div style={{display:"flex", direction:"row", justifyContent:"space-between"}}>
                    <a href="https://opensea.io" className="Logo LogoMargin OpenseaMargin"><div className="Logo OpenseaLogo" style={{ backgroundImage:`url(${openseaLogo})`}}></div></a>
                    <a href="https://twitter.com/itwasallalienft" className="Logo LogoMargin TwitterMargin"><div className="Logo TwitterLogo" style={{ backgroundImage:`url(${twitterLogo})`}}></div></a>
                </div>
                <div style={{display:"flex", direction:"row", justifyContent:"space-around"}}>
                      <button className="ButtonRow MintButton Button" style={{ backgroundImage:`url(${mintButtonImage})`}}
                          disabled={isButtonDisabled} onClick={() => {handleMint()}}>
                      </button>

                      <button className="ButtonRow PlusButton Button" style={{ backgroundImage:`url(${plusButtonImage})`}}
                          disabled={isButtonDisabled} onClick={() => {handlePlusButton()}}>
                      </button>
                      <button className="ButtonRow MinusButton Button" style={{ backgroundImage:`url(${minusButtonImage})`}}
                          disabled={isButtonDisabled} onClick={() => {handleMinusButton()}}>
                      </button>
                      <div className="ButtonRow ToMintDisplay Text" style={{ backgroundImage:`url(${toMintIndicatorImage})`}}>
                          {mintAmount}
                      </div>
                  </div>
                  <div style={{display:"flex", direction:"row", justifyContent:"space-around"}}>
                      <div className="MintedDisplay" style={{ backgroundImage:`url(${mintedDisplayImage})`}}></div>
                      <div className="MintedIndicator Text" style={{ backgroundImage:`url(${mintedIndicatorImage})`}}>
                          <div style={{marginTop:7, marginLeft:-10}}>{supplyMinted}</div>
                      </div>
                  </div>
              </div>
            {/* <div className="MintButton" style={{ backgroundImage:`url(${mintButtonImage})`}}
              onClick={() => {mint()}}>
            </div> */}
        </div>
    );
}
export default App;