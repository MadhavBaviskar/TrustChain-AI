import { network } from "hardhat";
import { loadDeployment } from "./deployment.js";

async function main() {
  console.log("=============================================");
  console.log("        TRUSTCHAIN AI HEALTH CHECK");
  console.log("=============================================\n");

  try {
    const deployment = await loadDeployment();

    const { viem, networkName } = await network.create();

    const publicClient = await viem.getPublicClient();

    const chainId = await publicClient.getChainId();

    console.log(`Network            : ${networkName}`);
    console.log(`Chain ID           : ${chainId}`);
    console.log(`Expected Chain ID  : ${deployment.chainId}`);
    console.log(`Contract           : ${deployment.contractName}`);
    console.log(`Address            : ${deployment.contractAddress}`);

    const chainMatches = chainId === deployment.chainId;

    console.log(
      `Chain ID Check     : ${
        chainMatches ? "✅ MATCH" : "❌ MISMATCH"
      }`,
    );

    if (!chainMatches) {
      throw new Error(
        `Connected chain ${chainId} does not match deployment manifest ${deployment.chainId}`,
      );
    }

    const contractCode = await publicClient.getCode({
      address: deployment.contractAddress as `0x${string}`,
    });

    const contractExists =
      contractCode !== undefined &&
      contractCode !== "0x";

    console.log(
      `Contract Reachable : ${
        contractExists ? "✅ YES" : "❌ NO"
      }`,
    );

    if (!contractExists) {
      throw new Error(
        "No contract bytecode found at the configured address.",
      );
    }

    const contractAddress = deployment.contractAddress as `0x${string}`;

    const registry = await viem.getContractAt(
      deployment.contractName,
      contractAddress,
    );

    const systemName = await registry.read.getSystemName();

    console.log(`Read Check         : ✅ OK`);
    console.log(`System Name        : ${systemName}`);

    const healthy =
      contractExists &&
      chainMatches &&
      systemName === "TrustChain AI";

    console.log(
      `Overall Status     : ${
        healthy ? "🟢 HEALTHY" : "🔴 UNHEALTHY"
      }`,
    );

    console.log("\n=============================================");

    if (!healthy) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("\n🔴 HEALTH CHECK FAILED\n");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

main();