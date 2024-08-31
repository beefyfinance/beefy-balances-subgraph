import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Token, TokenStatistic } from "../../../generated/schema"
import { ADDRESS_ZERO } from "../utils/address"
import { ZERO_BI } from "../utils/decimal"

export function isNullToken(token: Token): boolean {
  return token.id.equals(ADDRESS_ZERO)
}

export function getNullToken(): Token {
  let token = Token.load(ADDRESS_ZERO)
  if (!token) {
    token = new Token(ADDRESS_ZERO)
    token.symbol = "NULL"
    token.name = "NULL"
    token.decimals = BigInt.fromI32(18)
    token.save()
  }
  return token
}

export function getToken(tokenAddress: Bytes): Token {
  if (tokenAddress == ADDRESS_ZERO) {
    return getNullToken()
  }
  let token = Token.load(tokenAddress)
  if (!token) {
    token = new Token(tokenAddress)
    token.symbol = ""
    token.name = ""
    token.decimals = BigInt.fromI32(18)
  }
  return token
}

export function getTokenStatistic(tokenAddress: Bytes): TokenStatistic {
  let tokenStatistic = TokenStatistic.load(tokenAddress)
  if (!tokenStatistic) {
    tokenStatistic = new TokenStatistic(tokenAddress)
    tokenStatistic.token = tokenAddress
    tokenStatistic.totalSupply = ZERO_BI
    tokenStatistic.holderCount = ZERO_BI
    tokenStatistic.save()
  }
  return tokenStatistic
}
