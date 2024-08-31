import { Bytes } from "@graphprotocol/graph-ts"
import { IgnoredContract } from "../../../generated/schema"

export function shouldIgnoreContract(contractAddress: Bytes): boolean {
  return IgnoredContract.load(contractAddress) !== null
}

export function addIgnoredContract(contractAddress: Bytes): void {
  let ignoredcontract = IgnoredContract.load(contractAddress)
  if (!ignoredcontract) {
    ignoredcontract = new IgnoredContract(contractAddress)
    ignoredcontract.save()
  }
}
