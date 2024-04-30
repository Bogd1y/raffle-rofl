import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RaffleMod = buildModule("RaffleMod", (m) => {

  const contract = m.contract("Raffle", [], {});
  
  // ! WETH IS WHITE LISTED
  m.call(contract, "addToWhiteList", ['0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', BigInt(11), "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"])

  
  return { contract };
});

export default RaffleMod;



// TODO TEST