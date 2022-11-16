VN=v4

target=version_history/${VN}
mkdir -p ${target}
cp -r contract ${target}

dapp=it-was-all-a-lie-nft-minting-dapp
target=${target}/${dapp}
mkdir -p ${target}
cp ${dapp}/* ${target}
cp -r ${dapp}/public ${target}
cp -r ${dapp}/src ${target}
