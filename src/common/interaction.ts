import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent } from "../../generated/templates/BeefyERC20Product/IERC20"
import { BURN_ADDRESS, SHARE_TOKEN_MINT_ADDRESS } from "../config"
import { getAccount } from "./entity/account"
import { getTokenBalance } from "./entity/balance"
import { getToken } from "./entity/token"

export function handleProductTransfer(event: TransferEvent): void {
  if (event.params.from.notEqual(SHARE_TOKEN_MINT_ADDRESS) && event.params.from.notEqual(BURN_ADDRESS)) {
    updateAccountBalance(event.address, event.params.from, event.params.value.neg())
  }

  if (event.params.to.notEqual(SHARE_TOKEN_MINT_ADDRESS) && event.params.to.notEqual(BURN_ADDRESS)) {
    updateAccountBalance(event.address, event.params.to, event.params.value)
  }
}

function updateAccountBalance(tokenAddress: Bytes, accountAddress: Bytes, amountDiff: BigInt): void {
  const account = getAccount(accountAddress)
  account.save()
  const token = getToken(tokenAddress)
  token.save()
  const balance = getTokenBalance(token, account)
  balance.amount = balance.amount.plus(amountDiff)
  balance.save()
}
