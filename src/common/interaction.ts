import { BigInt, Bytes, log } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent } from "../../generated/templates/BeefyERC20Product/IERC20"
import { BURN_ADDRESS, SHARE_TOKEN_MINT_ADDRESS } from "../config"
import { createAccount } from "./entity/account"
import { getTokenBalance } from "./entity/balance"
import { getToken, getTokenStatistic } from "./entity/token"
import { shouldIgnoreContract } from "./entity/ignored"
import { ZERO_BI } from "./utils/decimal"
import { fetchAndSaveTokenData } from "./utils/token"

export function handleProductTransfer(event: TransferEvent): void {
  const tokenAddress = event.address
  const transferAmount = event.params.value
  const sender = event.params.from
  const receiver = event.params.to

  if (transferAmount.equals(ZERO_BI)) {
    log.debug("Ignoring transfer with zero value: {}", [event.transaction.hash.toHexString()])
    return
  }

  fetchAndSaveTokenData(tokenAddress)
  const statistic = getTokenStatistic(tokenAddress)

  if (sender.notEqual(SHARE_TOKEN_MINT_ADDRESS) && sender.notEqual(BURN_ADDRESS)) {
    const rawAmountDiff = transferAmount.neg()
    const amountDiff = shouldIgnoreContract(sender) ? ZERO_BI : rawAmountDiff
    const balDiff = updateAccountBalance(tokenAddress, sender, amountDiff, rawAmountDiff)
    statistic.holderCount = statistic.holderCount.plus(balDiff.holderCountChange())
  }

  if (receiver.notEqual(SHARE_TOKEN_MINT_ADDRESS) && receiver.notEqual(BURN_ADDRESS)) {
    const rawAmountDiff = transferAmount
    const amountDiff = shouldIgnoreContract(receiver) ? ZERO_BI : rawAmountDiff
    const balDiff = updateAccountBalance(tokenAddress, receiver, amountDiff, rawAmountDiff)
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

function updateAccountBalance(tokenAddress: Bytes, accountAddress: Bytes, amountDiff: BigInt, rawAmountDiff: BigInt): BalanceDiff {
  const account = createAccount(accountAddress)
  const token = getToken(tokenAddress)
  const balance = getTokenBalance(token, account)

  const before = balance.amount
  const after = balance.amount.plus(amountDiff)
  balance.amount = after

  const rawBefore = balance.rawAmount
  const rawAfter = balance.rawAmount.plus(rawAmountDiff)
  balance.rawAmount = rawAfter

  balance.save()

  return new BalanceDiff(before, after, rawBefore, rawAfter)
}

class BalanceDiff {
  constructor(
    public before: BigInt,
    public after: BigInt,
    public rawBefore: BigInt,
    public rawAfter: BigInt,
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
