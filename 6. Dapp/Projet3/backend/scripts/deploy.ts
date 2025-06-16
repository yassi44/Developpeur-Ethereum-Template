import { ethers, network } from "hardhat";
import  { verify } from "../utils/verify";
 


async function main() {
    const SimpleStorage = await ethers.deployContract("Voting")
    console.log("Déploiement en cours...");

    const isLocalhost = network.name.includes("localhost");

    if(!isLocalhost) {
        console.log("Attente de 5 blocs avant la vérification du contrat...");
        await SimpleStorage.deploymentTransaction()?.wait(5);
    }

    console.log(`Contrat déployé à l'adresse : ${SimpleStorage.target}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});