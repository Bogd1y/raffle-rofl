import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RaffleMod = buildModule("RaffleModSep", (m) => {

  const contract = m.contract("RaffleSep", ["0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"], {});
  
  m.call(contract, "addToWhiteList", ['0x7b79995e5f793a07bc00c21412e50ecae098e7f9', BigInt (8), "0x694AA1769357215DE4FAC081bf1f309aDC325306"])
  
  return { contract };
});

export default RaffleMod;
