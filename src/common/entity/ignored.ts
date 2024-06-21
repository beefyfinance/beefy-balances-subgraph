import { Bytes } from "@graphprotocol/graph-ts"
import { IgnoredContract } from "../../../generated/schema"

export function shouldIgnoreContract(contractAddress: Bytes): boolean {
  return IgnoredContract.load(contractAddress) !== null
}

export function getIgnoredContract(contractAddress: Bytes): IgnoredContract {
  let ignoredcontract = IgnoredContract.load(contractAddress)
  if (!ignoredcontract) {
    ignoredcontract = new IgnoredContract(contractAddress)
  }

  return ignoredcontract
}
