import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { network } from "hardhat";

interface DeploymentManifest {
  network: string;
  chainId: number;
  contractName: string;
  contractAddress: string;
  abiPath: string;
  source: string;
  updatedAt: string;
}

const CONTRACT_NAME = "TrustChainRegistry";
const MODULE_NAME = "TrustChainRegistryModule";

const deploymentsRoot = path.join(
  process.cwd(),
  "ignition",
  "deployments",
);

const outputPath = path.join(
  process.cwd(),
  "deployments",
  "development.json",
);

async function findDeploymentFiles(
  directory: string,
): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(
        ...(await findDeploymentFiles(fullPath)),
      );
    } else if (
      entry.isFile() &&
      entry.name === "deployed_addresses.json"
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function isEthereumAddress(
  value: unknown,
): value is `0x${string}` {
  return (
    typeof value === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(value)
  );
}

async function main() {
  console.log("=============================================");
  console.log("     TRUSTCHAIN AI DEPLOYMENT SYNC");
  console.log("=============================================\n");

  try {
    const connection = await network.create();
    const { viem } = connection;

    const publicClient =
      await viem.getPublicClient();

    const chainId =
      await publicClient.getChainId();

    console.log(`Network          : ${connection.networkName}`);
    console.log(`Chain ID         : ${chainId}`);

    const deploymentFiles =
      await findDeploymentFiles(deploymentsRoot);

    if (deploymentFiles.length === 0) {
      throw new Error(
        `No deployed_addresses.json found under ${deploymentsRoot}`,
      );
    }

    console.log(
      `Deployment files : ${deploymentFiles.length}`,
    );

    let contractAddress: string | undefined;
    let sourceFile: string | undefined;

    const targetKey =
      `${MODULE_NAME}#${CONTRACT_NAME}`;

    for (const file of deploymentFiles) {
      const raw = await readFile(file, "utf8");

      const addresses = JSON.parse(raw) as Record<
        string,
        unknown
      >;

      if (addresses[targetKey]) {
        contractAddress =
          addresses[targetKey] as string;

        sourceFile = file;
        break;
      }

      // Fallback: find any key ending in #TrustChainRegistry.
      const fallbackKey = Object.keys(addresses)
        .find((key) =>
          key.endsWith(`#${CONTRACT_NAME}`),
        );

      if (fallbackKey) {
        contractAddress =
          addresses[fallbackKey] as string;

        sourceFile = file;
        break;
      }
    }

    if (!contractAddress) {
      throw new Error(
        `Could not find ${targetKey} in deployed_addresses.json`,
      );
    }

    if (!isEthereumAddress(contractAddress)) {
      throw new Error(
        `Invalid Ethereum contract address: ${contractAddress}`,
      );
    }

    const manifest: DeploymentManifest = {
      network: connection.networkName,
      chainId,
      contractName: CONTRACT_NAME,
      contractAddress,
      abiPath:
        "blockchain/abi/TrustChainRegistry.json",
      source: path.relative(
        process.cwd(),
        sourceFile!,
      ),
      updatedAt: new Date().toISOString(),
    };

    await writeFile(
      outputPath,
      JSON.stringify(manifest, null, 2),
      "utf8",
    );

    console.log(`Contract         : ${CONTRACT_NAME}`);
    console.log(`Address          : ${contractAddress}`);
    console.log(
      `Source           : ${manifest.source}`,
    );
    console.log(
      `Manifest         : ${outputPath}`,
    );

    console.log(
      "\n✅ Deployment manifest synchronized.",
    );
  } catch (error) {
    console.error(
      "\n🔴 Deployment sync failed.\n",
    );

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

main();