import { Bytes } from "@graphprotocol/graph-ts"
import { Contract } from "../../../generated/schema"

export function getContract(contractAddress: Bytes): Contract {
  let contract = Contract.load(contractAddress)
  if (!contract) {
    contract = new Contract(contractAddress)
    contract.factory = false
    contract.config = false
    contract.save()
  }

  return contract
}

export function markContractDiscoveredFromFactory(contractAddress: Bytes): void {
  const contract = getContract(contractAddress)
  contract.factory = true
  contract.save()
}

export function markContractDiscoveredFromConfigFile(contractAddress: Bytes): void {
  const contract = getContract(contractAddress)
  contract.config = true
  contract.save()
}
