import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TrustChainRegistryModule = buildModule("TrustChainRegistryModule", (m) => {
  const registry = m.contract("TrustChainRegistry");

  return { registry };
});

export default TrustChainRegistryModule;