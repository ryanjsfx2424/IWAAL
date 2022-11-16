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
import contractABI from './abi_v4.json';
import wlt from './TEAM.json';
import wlp from './WL.json';
import desktopVideo from './desktop.mp4'
import mobileVideo from './mobile.mp4'

// require('dotenv').config()
//const CHAIN_ID = 5 // GOERLI
//const CHAIN_NAME = "GOERLI TESTNET"
//const contractAddress = "0xf401B5a716519cf35B8066aB8eAA692f66849E91"
const CHAIN_ID = 0x1 // ETH
const CHAIN_NAME = "ETH MAINNET"
const contractAddress = "0x0A9AFc08Ab9488b0b58d371B88dD413E191793b3"
const ETHERSCAN_LINK = "https://etherscan.io/address/" + contractAddress

function App() {
    const [mintAmount,       setMintAmount]         = useState(1)
    const [supplyMinted,     setSupplyMinted]       = useState("?/8888")
    const [isButtonDisabled, setIsButtonDisabled]   = useState(false)
    const [isWalletConnected, setIsWalletConnected] = useState(false)
    const [isCorrectChain,    setIsCorrectChain]    = useState(false)
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)
    const { height, width } = useWindowDimensions()

    const onLoadedData = () => {
        setIsVideoLoaded(true)
    }

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

    // let supplyMintedMarginTop = 7
    // let supplyMintedMarginLeft = -10
    // let mintedIndicatorHeight = 60
    // let mintedIndicatorWidth = 200
    // let mintedIndicatorMarginRight = 10
    // let mintedDisplayMarginLeft = 25
    // let mintedDisplayMarginTop = 5
    // let mintedDisplayWidth = 200
    // let mintedDisplayHeight = 60
    // let textFontSize = 32
    // let toMintDisplayMarginTop = 55
    // let toMintDisplayMarginRight = 20
    // let toMintDisplayLength = 100
    // let pmButtonLength = 36
    // let mintButtonMarginLeft = 20
    // let mintButtonWidth = 100
    // let mintButtonHeight = 50
    // let buttonRowMarginTop = 60
    // let twitterMarginRight = 40
    // let openseaMarginLeft = 30
    // let logoMarginTop = 30
    // let logoLength = 69

    // let containerWidth = 420 
    // let containerHeight = 400
    // let marginTop = 40
    // let marginLeft = Math.round(0.36*width)

    let sizes = {
        supplyMintedFontSize : 2,
        supplyMintedMarginTop : 7,
        supplyMintedMarginLeft : -10,
        mintedIndicatorHeight : 60,
        mintedIndicatorWidth : 200,
        mintedIndicatorMarginRight : 10,
        mintedDisplayMarginLeft : 25,
        mintedDisplayMarginTop : 5,
        mintedDisplayWidth : 200,
        mintedDisplayHeight : 60,
        mintedDisplayMarginRight : 2,
        textFontSize : 32,
        toMintDisplayMarginTop : 55,
        toMintDisplayMarginRight : 20,
        toMintDisplayMarginLeft : 5,
        toMintDisplayLength : 100,
        pmButtonLength : 36,
        pmButtonMarginTop : 2,
        mintButtonMarginLeft : 20,
        mintButtonMarginRight : 0,
        mintButtonWidth : 100,
        mintButtonHeight : 50,
        buttonRowMarginTop : 60,
        twitterMarginRight : 40,
        openseaMarginLeft : 30,
        logoMarginTop : 30,
        logoLength : 69,
        mintedIndicatorMarginTop: 0,
    
        containerWidth : 420,
        containerHeight : 400,
        marginTop : 40,
        marginLeft : Math.round(0.36*width)
    }

    let backgroundImage = `url(${backgroundImageDesktop})`
    let vidSrc = desktopVideo
    let valueToSub = 0
    let valueToSubML = 0
    let valueToSubMT = 0
    if (height >= width) {
        console.log("height > width")
        sizes.containerWidth = 360
        sizes.containerHeight = 320
        backgroundImage = `url(${backgroundImageMobile})`
        vidSrc = mobileVideo

        if (height < 300 || width < 300) {
            return (
                <h1>Screen is too fucking small. How can you see?</h1>
            )
        }

        if (height > 299 && width > 299) {
            sizes.marginTop = 68
            sizes.marginLeft = 85
            sizes.containerHeight = 100
            sizes.containerWidth = 100

            sizes.logoLength = 18
            sizes.logoMarginTop = 12
            sizes.openseaMarginLeft = 20
            sizes.twitterMarginRight = 15


            sizes.buttonRowMarginTop = 10
            
            sizes.mintButtonHeight = 18
            sizes.mintButtonWidth = 36
            sizes.mintButtonMarginLeft = 5
            
            sizes.pmButtonLength = 14
            sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 2

            sizes.toMintDisplayLength = 24
            sizes.toMintDisplayMarginRight = 0
            sizes.toMintDisplayMarginLeft = 0
            sizes.toMintDisplayMarginTop = sizes.buttonRowMarginTop + 4

            sizes.textFontSize = 8
            
            sizes.mintedDisplayWidth = 40
            sizes.mintedDisplayMarginLeft = 10
            sizes.mintedDisplayMarginRight = 10
            sizes.mintedDisplayMarginTop = 1

            sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
            sizes.mintedIndicatorMarginRight = 1
            
            sizes.supplyMintedMarginTop = 3
            sizes.supplyMintedMarginLeft = -1
            sizes.supplyMintedFontSize = 8
        }
        if (height < 500) {
            if (width < 301) {
                sizes.containerHeight += 50 - 5 * (500 - height) / 20
                sizes.containerWidth += 66 - 6 * (500 - height) / 20
                sizes.marginTop += 50 - 5 * (500 - height) / 20
                sizes.marginLeft -= 40 - 4 * (500 - height) / 20
    
                sizes.logoLength += 12/(500-301) * height - 12*301/(500-301)
                sizes.logoMarginTop += 4/(500-301) * height - 4*301/(500-301)
                sizes.openseaMarginLeft += 5/(500-301) * height - 5*301/(500-301)
                sizes.twitterMarginRight += 15/(500-301) * height - 15*301/(500-301)
    
                sizes.mintButtonWidth += 30/(500-301) * height - 30*301/(500-301)
                sizes.mintButtonHeight += 30/(500-301) * height - 30*301/(500-301)
                
                sizes.pmButtonLength += 8/(500-301) * height - 8*301/(500-301)
                sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 2/(500-301) * height - 2*301/(500-301)
    
                sizes.toMintDisplayLength += 24/(500-301) * height - 24*301/(500-301)
                
                sizes.textFontSize += 8/(500-301) * height - 8*301/(500-301)
    
                sizes.mintedDisplayWidth += 38/(500-301) * height - 38*301/(500-301)
    
                sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                sizes.mintedIndicatorMarginRight += 5
    
                sizes.supplyMintedMarginTop += 3/(500-301) * height - 3*301/(500-301)
                sizes.supplyMintedFontSize += 6/(500-301) * height - 6*301/(500-301)
            } else {
                sizes.containerHeight += 50 - 5 * (500 - height) / 20
                sizes.containerWidth += 66 - 6 * (500 - height) / 20
                sizes.marginTop += 50 - 5 * (500 - height) / 20
                sizes.marginLeft -= 40 - 50 * (width-301) / 100
    
                sizes.logoLength += 12/(500-301) * height - 12*301/(500-301)
                sizes.logoMarginTop += 4/(500-301) * height - 4*301/(500-301)
                sizes.openseaMarginLeft += 5/(500-301) * height - 5*301/(500-301)
                sizes.twitterMarginRight += 15/(500-301) * height - 15*301/(500-301)
    
                sizes.mintButtonWidth += 30/(500-301) * height - 30*301/(500-301)
                sizes.mintButtonHeight += 30/(500-301) * height - 30*301/(500-301)
                
                sizes.pmButtonLength += 8/(500-301) * height - 8*301/(500-301)
                sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 2/(500-301) * height - 2*301/(500-301)
    
                sizes.toMintDisplayLength += 24/(500-301) * height - 24*301/(500-301)
                
                sizes.textFontSize += 8/(500-301) * height - 8*301/(500-301)
    
                sizes.mintedDisplayWidth += 38/(500-301) * height - 38*301/(500-301)
    
                sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                sizes.mintedIndicatorMarginRight += 5
    
                sizes.supplyMintedMarginTop += 3/(500-301) * height - 3*301/(500-301)
                sizes.supplyMintedFontSize += 6/(500-301) * height - 6*301/(500-301)
            }
        }
        if (height >= 500 && height < 550) {
            if (width < 301) {
                sizes.marginTop += 10 - 10*(height-501)/51
                sizes.marginLeft += 10 - 10*(height-501)/51
                sizes.containerWidth -= 12 - 12*(height-501)/51
                sizes.containerHeight -= 12 - 12*(height-501)/51
            } else {
                sizes.marginTop += 64
                sizes.marginLeft -= 48 - 50 * (width-300)/100
                sizes.containerWidth += 80
                sizes.containerHeight += 64

                for (const [key, value] of Object.entries(sizes)) {
                    if (key !== "marginLeft"  && key !== "marginTop" && key !== "containerWidth" && key !== "containerHeight") {
                        sizes[key] *= 1.7
                    }
                }
            }
        }
        if (height >= 500 && height < 800) {
            if (width < 301) {
                let denom = 800-500
                let start = 500
                let f1 = 65
                sizes.containerHeight += f1 - 0 * (800 - height) / 20
    
                f1 = 80
                sizes.containerWidth += f1 + 0 * (800 - height) / 20
    
                f1 = 190
                sizes.marginTop += f1 - 10 * (800 - height) / 20
    
                f1 = 50
                sizes.marginLeft -= f1 + 0 * (800 - height) / 20
    
                f1 = 12
                sizes.logoLength         += f1
                sizes.logoMarginTop      +=  4
                sizes.openseaMarginLeft  += 5
    
                f1 = 12
                sizes.twitterMarginRight += f1
    
                sizes.mintButtonWidth  += 30
                sizes.mintButtonHeight += 30
                
                sizes.pmButtonLength   += 8
                sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 2
    
                sizes.toMintDisplayLength += 24
                // sizes.toMintDisplayMarginRight = 0
                // sizes.toMintDisplayMarginTop -= 4
                // sizes.toMintDisplayMarginLeft = 5
    
                sizes.textFontSize += 8
    
                sizes.mintedDisplayWidth += 38
                // sizes.mintedDisplayMarginLeft = 5
                // sizes.mintedDisplayMarginRight = 5
                // sizes.mintedDisplayMarginTop = 1
    
                sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                sizes.mintedIndicatorMarginRight += 5
    
                sizes.supplyMintedMarginTop += 3
                sizes.supplyMintedFontSize  += 6
            } else if (width < 500) {
                if (height >= 550) {
                    sizes.containerHeight += 65 + (height-550)/200 + 2*(width-301)/100 + 30*(height-550)*(width-301)/20000
                    sizes.containerWidth += 80 + 2*(width-301)/100 + 2.65*(height-550)*(width-301)/2000
                    sizes.marginTop += 65 + 25  * (height-550) / 50 - 2*(width-301)/100 - 7*(height-550)*(width-301)/5000
                    sizes.marginLeft -= 48 - 48 * (width - 300) / 100 + 1.6*(height-550)*(width-301)/2000
        
                 
                    sizes.logoLength         += 16 + 3*(height-550)/100 + 2*(width-301)/100 //- 25*(height-550)*(width-301)/10000
                    sizes.logoMarginTop      +=  4
                    sizes.openseaMarginLeft  +=  5
        
                    sizes.twitterMarginRight += 12 + 0*(width-301)/100 + 0*(height-550)/5
        
                    let factor = (height-550)/10
                    sizes.mintButtonWidth  += 30 + factor
                    sizes.mintButtonHeight += 30 + factor
                    
                    sizes.buttonRowMarginTop += factor
                    sizes.toMintDisplayMarginTop += factor-factor/2
                    sizes.pmButtonLength   += 8 + factor/2
                    sizes.pmButtonMarginTop = sizes.buttonRowMarginTop
        
                    sizes.toMintDisplayLength += 24 + factor
        
                    sizes.textFontSize += 8 + factor/3
        
                    sizes.mintedDisplayWidth += 38 + factor
        
                    sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                    sizes.mintedIndicatorMarginRight += 5
        
                    sizes.supplyMintedMarginTop += 3
                    sizes.supplyMintedFontSize  += 6 + factor/3

                }
            } else {
                if (height >= 550) {
                    sizes.containerHeight += 75 + 25*(height-550)/100 
                    sizes.containerWidth += 85 + 30*(height-550)/100 
                    sizes.marginTop += 60 + 24*(height-550)/100
                    sizes.marginLeft += 74 - 20*(height-550)/100 + 40*(width - 500)/100

                    sizes.logoLength         += 16 + 4*(height-550)/100
                    sizes.logoMarginTop      +=  4
                    sizes.openseaMarginLeft  +=  5
        
                    sizes.twitterMarginRight += 12 + 4*(height-550)/100
        
                    let factor = (height-550)/10
                    sizes.mintButtonWidth  += 30 + 8*(height-550)/100
                    sizes.mintButtonHeight += 30
                    sizes.mintButtonMarginRight += 4*(height-550)/100
                    
                    sizes.buttonRowMarginTop += 8*(height-550)/100
                    sizes.toMintDisplayMarginTop += 4*(height-550)/100
                    sizes.pmButtonLength   += 8 + 2*(height-550)/100
                    sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 1*(height-550)/100
        
                    sizes.toMintDisplayLength += 24 + 8*(height-550)/100
                    sizes.toMintDisplayMarginLeft += 4*(height-550)/100
        
                    sizes.textFontSize += 8 + 4*(height-550)/100
        
                    sizes.mintedDisplayWidth += 38 + 10*(height-550)/100
                    sizes.mintedDisplayMarginTop += 4*(height-550)/100
                    sizes.mintedDisplayMarginRight += 4*(height-550)/100

                    sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                    sizes.mintedIndicatorMarginRight += 5
                    sizes.mintedIndicatorMarginTop += 2*(height-550)/100
        
                    sizes.supplyMintedMarginTop += 3
                    sizes.supplyMintedFontSize  += 6 + 4*(height-550)/100
                }
            }

        }
        if (height >= 800 && height < 1200) {
            if (width < 301) {
                sizes.marginTop += 190 + 50*(height-800)/100
                sizes.marginLeft -= 50
                sizes.containerWidth += 80
                sizes.containerHeight += 65
    
                for (const [key, value] of Object.entries(sizes)) {
                    if (key !== "marginLeft"  && key !== "marginTop" && key !== "containerWidth" && key !== "containerHeight") {
                        sizes[key] *= 1.7
                    }
                }
            } else if (width <= 500) {
                sizes.marginTop += 190 + 50*(height-800)/100 - 36*(width-301)/100
                sizes.marginLeft -= 50 - 22*(width-301)/100
                sizes.containerWidth += 80 + 44*(width-301)/100
                sizes.containerHeight += 65 + 40*(width-301)/100
    
                sizes.logoLength         += 16 + 4*(height-550)/100 
                sizes.logoMarginTop      +=  4
                sizes.openseaMarginLeft  +=  5
    
                sizes.twitterMarginRight += 12 + 4*(height-550)/100 - 20*(500 - width)/100
    
                let factor = (height-550)/10
                sizes.mintButtonWidth  += 30 + 8*(height-550)/100
                sizes.mintButtonHeight += 30
                sizes.mintButtonMarginRight += 4*(height-550)/100
                
                sizes.buttonRowMarginTop += 8*(height-550)/100 - 10*(500 - width)/100
                sizes.pmButtonLength   += 8 + 2*(height-550)/100
                sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 1*(height-550)/100
    
                sizes.toMintDisplayLength += 24 + 8*(height-550)/100
                sizes.toMintDisplayMarginLeft += 4*(height-550)/100
                sizes.toMintDisplayMarginTop += 4*(height-550)/100 - 6*(500 - width)/100
                
                sizes.textFontSize += 8 + 4*(height-550)/100 - 4*(500 - width)/100
    
                sizes.mintedDisplayWidth += 38 + 10*(height-550)/100 - 10*(500 - width)/100
                sizes.mintedDisplayMarginTop += 4*(height-550)/100 - 15*(500 - width)/100
                sizes.mintedDisplayMarginRight += 4*(height-550)/100 - 5*(500 - width)/100

                sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                sizes.mintedIndicatorMarginRight += 5
                sizes.mintedIndicatorMarginTop += 2*(height-550)/100 - 15*(500 - width)/100
    
                sizes.supplyMintedMarginTop += 3
                sizes.supplyMintedFontSize  += 6 + 4*(height-550)/100 - 5*(500 - width)/100
            } else if (width <= 700) {
                sizes.marginTop += 190 + 50*(height-800)/100 - 18*(width-301)/100
                sizes.marginLeft -= 50 - 36*(width-301)/100
                sizes.containerWidth += 80 + 23*(width-301)/100
                sizes.containerHeight += 65 + 20*(width-301)/100
    
                sizes.logoLength         += 16 + 4*(height-550)/100 
                sizes.logoMarginTop      +=  4
                sizes.openseaMarginLeft  +=  5
    
                sizes.twitterMarginRight += 12 + 4*(height-550)/100 - 20*(500 - width)/100
    
                let factor = (height-550)/10
                sizes.mintButtonWidth  += 30 + 8*(height-550)/100
                sizes.mintButtonHeight += 30
                sizes.mintButtonMarginRight += 4*(height-550)/100
                
                sizes.buttonRowMarginTop += 8*(height-550)/100 - 5*(500 - width)/100
                sizes.pmButtonLength   += 8 + 2*(height-550)/100
                sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 1*(height-550)/100
    
                sizes.toMintDisplayLength += 24 + 8*(height-550)/100
                sizes.toMintDisplayMarginLeft += 4*(height-550)/100
                sizes.toMintDisplayMarginTop += 4*(height-550)/100 - 6*(500 - width)/100
                
                sizes.textFontSize += 8 + 4*(height-550)/100 - 4*(500 - width)/100
    
                sizes.mintedDisplayWidth += 38 + 10*(height-550)/100 - 10*(500 - width)/100
                sizes.mintedDisplayMarginTop += 4*(height-550)/100 - 7*(500 - width)/100
                sizes.mintedDisplayMarginRight += 4*(height-550)/100 - 5*(500 - width)/100

                sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                sizes.mintedIndicatorMarginRight += 5
                sizes.mintedIndicatorMarginTop += 2*(height-550)/100 - 7*(500 - width)/100
    
                sizes.supplyMintedMarginTop += 3
                sizes.supplyMintedFontSize  += 6 + 4*(height-550)/100 - 2*(500 - width)/100
            } else {
                sizes.marginTop += 190 + 50*(height-800)/100 - 15*(width-301)/100
                sizes.marginLeft -= 50 - 39*(width-301)/100
                sizes.containerWidth += 80 + 18*(width-301)/100
                sizes.containerHeight += 65 + 20*(width-301)/100
    
                sizes.logoLength         += 16 + 4*(height-550)/100 + 2*(width-301)/100
                sizes.logoMarginTop      +=  4
                sizes.openseaMarginLeft  +=  5
    
                sizes.twitterMarginRight += 12 + 4*(height-550)/100 - 2*(500 - width)/100
    
                let factor = (height-550)/10
                sizes.mintButtonWidth  += 30 + 8*(height-550)/100
                sizes.mintButtonHeight += 30
                sizes.mintButtonMarginRight += 4*(height-550)/100
                
                sizes.buttonRowMarginTop += 8*(height-550)/100 - 5*(500 - width)/100
                sizes.pmButtonLength   += 8 + 2*(height-550)/100
                sizes.pmButtonMarginTop = sizes.buttonRowMarginTop + 1*(height-550)/100
    
                sizes.toMintDisplayLength += 24 + 8*(height-550)/100
                sizes.toMintDisplayMarginLeft += 4*(height-550)/100
                sizes.toMintDisplayMarginTop += 4*(height-550)/100 - 6*(500 - width)/100
                
                sizes.textFontSize += 8 + 4*(height-550)/100 - 0*(500 - width)/100
    
                sizes.mintedDisplayWidth += 38 + 10*(height-550)/100 - 10*(500 - width)/100
                sizes.mintedDisplayMarginTop += 4*(height-550)/100 - 1*(500 - width)/100
                sizes.mintedDisplayMarginRight += 4*(height-550)/100 - 5*(500 - width)/100

                sizes.mintedIndicatorWidth = sizes.mintedDisplayWidth
                sizes.mintedIndicatorMarginRight += 5
                sizes.mintedIndicatorMarginTop += 2*(height-550)/100 - 1*(500 - width)/100
    
                sizes.supplyMintedMarginTop += 3
                sizes.supplyMintedFontSize  += 6 + 4*(height-550)/100 - 1*(500 - width)/100
            }
        }
        if (height >= 1200 && width < 301) {
            return (
                <h1>Wtf are you holding?! Height &gt 1200 and width &lt 300 that's unreal.</h1>
            )
        } 
    } else {
        valueToSub =  Math.max(Math.floor((1520-width)/3.5), Math.floor((1000-height)/3.5))
        if (width > height && (height < 1000 || width < 1520) && width/height > 1.593) {
            console.log("in if")
            console.log("width > height && (height < 1000 || width < 1520) && width/height > 1.593")
    
            sizes.containerWidth = 400
            sizes.containerHeight = 400
    
            if (width < 1900)
                sizes.marginLeft = Math.round(0.36*width)
            else if (width < 2800) {
                sizes.marginLeft = Math.round(0.41*width)
            }
            else {
                sizes.marginLeft = Math.round(0.42*width)
            }
    
            valueToSub = Math.floor((1000-height)/2.5)
            valueToSubML = 0//-Math.max(Math.floor((1520-width)/4.0), Math.floor((1000-height)/4.0))
            valueToSubMT = -Math.max(Math.floor((1520-width)/24.0), Math.floor((1000-height)/3.0))
        } else if (width > height && (height < 1000 || width < 1520)) {
            console.log("width > height && (height < 1000 || width < 1520)")
            console.log("height dif: ", Math.floor((1000-height)/2.0))
            console.log("width dif: ", Math.floor((1520-width)/3.0))
    
            sizes.containerWidth = 400
            sizes.containerHeight = 400
    
            sizes.marginLeft = Math.round(0.36*width)
            valueToSub =  Math.max(Math.floor((1520-width)/4.0), Math.floor((1000-height)/3.0))
            valueToSubMT = -Math.max(Math.floor((1520-width)/24.0), Math.floor((1000-height)/3.0))
            valueToSubML = 0//Math.max(0, Math.floor((1000-height)/4.0))
        } else {
            console.log("else")
            sizes.containerWidth = 400
            sizes.containerHeight = 400
    
            sizes.marginLeft = Math.round(0.36*width)
            valueToSub =  Math.max(Math.floor((1520-width)/4.0), Math.floor((1000-height)/3.0))
            valueToSubMT = 0//-Math.max(Math.floor((1520-width)/4.0), Math.floor((1000-height)/3.0))
            valueToSubML = 0//Math.max(0, Math.floor((1000-height)/4.0))
        }
        // if (width / height > 1.6) {
        //     let wpct = 0.36
        //     let wextra = 0
        //     wextra = 0.05 * Math.abs(width-1500)/1000
        //     sizes.marginLeft = Math.round((wpct + wextra)*width)
    
        //     if (width > 3000) {
        //         return (
        //             <h1>Your screen is too large. I can't fucking handle it.</h1>
        //         )
        //     }
        //     if (height < 500) {
        //         sizes.marginLeft += ((10-width/height)*(500 - height))
        //         valueToSub += (0.35*(500 - height))
        //         sizes.marginTop -= (0.15*(500 - height))
        //     }
        // } else if (width / height < 1.59) {
        //     if (height < 1000) {
        //         sizes.marginTop += 0//(1000-height)//1.69*(1000 - height)
        //     }
        // }
    }

    let cw = sizes.containerWidth
    let ch = sizes.containerHeight
    for (const [key, value] of Object.entries(sizes)) {
        let valueToSubLocal = valueToSub
        if (key === "marginLeft") {
            valueToSubLocal = valueToSubML
        } else if (key === "marginTop") {
            valueToSubLocal = valueToSubMT
        } else if (key !== "containerWidth" && key !== "containerHeight") {
            valueToSubLocal = Math.floor(valueToSub * Math.min(value / cw, value/ch))
        }
        // } else if (key === "containerWidth" || key === "containerHeight") {
        //     valueToSubLocal = 0
        // }
        sizes[key] -= valueToSubLocal
    }
    sizes.marginTop -= 60
    sizes.pmButtonMarginTop += 45
    sizes.toMintDisplayMarginLeft += 20
    sizes.mintButtonMarginRight += 20
    sizes.supplyMintedFontSize = 20
    sizes.supplyMintedMarginTop += 5
    sizes.supplyMintedMarginLeft -= 7

    if (height > 900) {
        sizes.marginTop += 50
        sizes.marginLeft -= 10
        sizes.containerWidth -= 10
        sizes.textFontSize += 2
        sizes.pmButtonMarginTop += 10
        sizes.supplyMintedFontSize += 4
    }

    let margin = sizes.marginTop + "px" + " 0 0 " + sizes.marginLeft + "px"
    console.log("margin: ", margin)
    console.log("height, width: ", height, width)

    if (width/height > 2) {
        sizes.marginLeft = "43.5vw"
        sizes.marginTop = 25
        margin = sizes.marginTop + "px 0 0 " + sizes.marginLeft
        sizes.supplyMintedFontSize = 12
    }

    return (
        <div className="videoContainer">
            <div className="screen" style={{ backgroundImage:backgroundImage, opacity: isVideoLoaded ? 0 : 1}}></div>
            <video className="screen" autoPlay playsInline muted loop src={vidSrc} onLoadedData={onLoadedData} style={{opacity: isVideoLoaded ? 1 : 0}}></video>

            <a href="https://raritysniper.com/nft-drops-calendar"></a>
            <audio src="./itwasallalie_music.mp3" autoPlay loop></audio>

            <div className="content">
                <div className="container" style= {{
                    margin: margin,
                    width: sizes.containerWidth + "px",
                    height: sizes.containerHeight + "px",
                    backgroundColor: "transparent",
                    outline: "1px dotted transparent"
                }}>
                
                    <div style={{display:"flex", direction:"row", justifyContent:"space-between"}}>
                        <a href="https://opensea.io" className="Logo"><div className="Logo OpenseaLogo" style={{ backgroundImage:`url(${openseaLogo})`, width:sizes.logoLength, height:sizes.logoLength, marginTop: sizes.logoMarginTop, marginLeft: sizes.openseaMarginLeft }}></div></a>
                        <a href="https://twitter.com/itwasallalienft" className="Logo"><div className="Logo TwitterLogo" style={{ backgroundImage:`url(${twitterLogo})`, marginTop: sizes.logoMarginTop, width:sizes.logoLength, height:sizes.logoLength, marginRight:sizes.twitterMarginRight}}></div></a>
                    </div>
                    <div style={{display:"flex", direction:"row"}}>
                        <button className="MintButton Button" style={{ backgroundImage:`url(${mintButtonImage})`, marginTop: sizes.buttonRowMarginTop, marginLeft: sizes.mintButtonMarginLeft, marginRight: sizes.mintButtonMarginRight, width: sizes.mintButtonWidth, height: sizes.mintButtonHeight}}
                            disabled={isButtonDisabled} onClick={() => {handleMint()}}>
                        </button>

                        <button className="PlusButton Button" style={{ backgroundImage:`url(${plusButtonImage})`, marginTop: sizes.pmButtonMarginTop, width: sizes.pmButtonLength, height: sizes.pmButtonLength}}
                            disabled={isButtonDisabled} onClick={() => {handlePlusButton()}}>
                        </button>
                        <button className="MinusButton Button" style={{ backgroundImage:`url(${minusButtonImage})`, marginTop: sizes.pmButtonMarginTop, width: sizes.pmButtonLength, height: sizes.pmButtonLength}}
                            disabled={isButtonDisabled} onClick={() => {handleMinusButton()}}>
                        </button>
                        <div className="ToMintDisplay Text" style={{ backgroundImage:`url(${toMintIndicatorImage})`, marginTop: sizes.toMintDisplayMarginTop, marginLeft: sizes.toMintDisplayMarginLeft, marginRight: sizes.toMintDisplayMarginRight, width: sizes.toMintDisplayLength, height: sizes.toMintDisplayLength, fontSize: sizes.textFontSize}}>
                            {mintAmount}
                        </div>
                    </div>
                    <div style={{display:"flex", direction:"row"}}>
                        <div className="MintedDisplay" style={{ backgroundImage:`url(${mintedDisplayImage})`, height: sizes.mintedDisplayHeight, width: sizes.mintedDisplayWidth, marginLeft: sizes.mintedDisplayMarginLeft, marginRight:sizes.mintedDisplayMarginRight, marginTop: sizes.mintedDisplayMarginTop}}></div>
                        <div className="MintedIndicator Text" style={{ backgroundImage:`url(${mintedIndicatorImage})`, fontSize: sizes.textFontSize, height: sizes.mintedIndicatorHeight, width: sizes.mintedIndicatorWidth, marginRight: sizes.mintedIndicatorMarginRight, marginTop: sizes.mintedIndicatorMarginTop}}>
                            <div style={{marginTop:sizes.supplyMintedMarginTop, marginLeft:sizes.supplyMintedMarginLeft, fontSize: sizes.supplyMintedFontSize}}>{supplyMinted}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default App;
