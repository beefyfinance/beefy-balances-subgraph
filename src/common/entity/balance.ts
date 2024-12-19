import { Account, Token, TokenBalance } from "../../../generated/schema"
import { ZERO_BI } from "../utils/decimal"

export function getTokenBalance(token: Token, account: Account): TokenBalance {
  const id = account.id.concat(token.id)
  let tokenBalance = TokenBalance.load(id)
  if (!tokenBalance) {
    tokenBalance = new TokenBalance(id)
    tokenBalance.account = account.id
    tokenBalance.token = token.id
    tokenBalance.amount = ZERO_BI
    tokenBalance.rawAmount = ZERO_BI
  }

  return tokenBalance
}
