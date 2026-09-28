import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const artifactPath = path.join(
  root,
  "artifacts",
  "contracts",
  "TrustChainRegistry.sol",
  "TrustChainRegistry.json",
);

const outputDirectory = path.join(root, "abi");
const outputPath = path.join(outputDirectory, "TrustChainRegistry.json");

async function main() {
  try {
    console.log("=============================================");
    console.log("       TRUSTCHAIN AI ABI EXPORT");
    console.log("=============================================\n");

    const artifactRaw = await readFile(artifactPath, "utf8");
    const artifact = JSON.parse(artifactRaw);

    if (!Array.isArray(artifact.abi)) {
      throw new Error("ABI not found in Hardhat artifact.");
    }

    await mkdir(outputDirectory, { recursive: true });

    await writeFile(
      outputPath,
      JSON.stringify(artifact.abi, null, 2),
      "utf8",
    );

    console.log(`Source artifact : ${artifactPath}`);
    console.log(`ABI output      : ${outputPath}`);
    console.log(`ABI entries     : ${artifact.abi.length}`);

    console.log("\n✅ ABI export successful.");
  } catch (error) {
    console.error("\n🔴 ABI export failed.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

main();