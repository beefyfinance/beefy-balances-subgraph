import { Bytes } from "@graphprotocol/graph-ts"
import { Account } from "../../../generated/schema"

export function createAccount(accountAddress: Bytes): Account {
  let account = Account.load(accountAddress)
  if (!account) {
    account = new Account(accountAddress)
    account.save()
  }

  return account
}
