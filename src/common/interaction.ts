import { BigInt, Bytes, log } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent } from "../../generated/templates/BeefyERC20Product/IERC20"
import { BURN_ADDRESS, SHARE_TOKEN_MINT_ADDRESS } from "../config"
import { createAccount } from "./entity/account"
import { getTokenBalance } from "./entity/balance"
import { getToken, getTokenStatistic } from "./entity/token"
import { shouldIgnoreContract } from "./entity/ignored"
import { ZERO_BI } from "./utils/decimal"

export function handleProductTransfer(event: TransferEvent): void {
  if (event.params.value.equals(ZERO_BI)) {
    log.debug("Ignoring transfer with zero value: {}", [event.transaction.hash.toHexString()])
    return
  }

  if (shouldIgnoreContract(event.params.from) || shouldIgnoreContract(event.params.to)) {
    log.debug("Ignoring transfer from/to ignored contract: {}", [event.transaction.hash.toHexString()])
    return
  }

  const tokenAddress = event.address
  const statistic = getTokenStatistic(tokenAddress)

  if (event.params.from.notEqual(SHARE_TOKEN_MINT_ADDRESS) && event.params.from.notEqual(BURN_ADDRESS)) {
    const balDiff = updateAccountBalance(tokenAddress, event.params.from, event.params.value.neg())
    statistic.holderCount = statistic.holderCount.plus(balDiff.holderCountChange())
  }

  if (event.params.to.notEqual(SHARE_TOKEN_MINT_ADDRESS) && event.params.to.notEqual(BURN_ADDRESS)) {
    const balDiff = updateAccountBalance(tokenAddress, event.params.to, event.params.value)
    statistic.holderCount = statistic.holderCount.plus(balDiff.holderCountChange())
  }

  if (event.params.from.equals(BURN_ADDRESS) || event.params.from.equals(SHARE_TOKEN_MINT_ADDRESS)) {
    statistic.totalSupply = statistic.totalSupply.plus(event.params.value)
  }
  if (event.params.to.equals(BURN_ADDRESS) || event.params.to.equals(SHARE_TOKEN_MINT_ADDRESS)) {
    statistic.totalSupply = statistic.totalSupply.minus(event.params.value)
  }

  statistic.save()
}

function updateAccountBalance(tokenAddress: Bytes, accountAddress: Bytes, amountDiff: BigInt): BalanceDiff {
  const account = createAccount(accountAddress)
  const token = getToken(tokenAddress)
  const balance = getTokenBalance(token, account)
  const before = balance.amount
  const after = balance.amount.plus(amountDiff)
  balance.amount = after
  balance.save()

  return new BalanceDiff(before, balance.amount)
}

class BalanceDiff {
  constructor(
    public before: BigInt,
    public after: BigInt,
  ) {}

  public holderCountChange(): BigInt {
    if (this.before.equals(ZERO_BI) && this.after.notEqual(ZERO_BI)) {
      return BigInt.fromI32(1)
    }
    if (this.before.notEqual(ZERO_BI) && this.after.equals(ZERO_BI)) {
      return BigInt.fromI32(-1)
    }
    return ZERO_BI
  }
}
