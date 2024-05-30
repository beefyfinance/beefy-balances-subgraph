import { Address, log, BigInt } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent, BeefyVaultV7 as BeefyVaultV7Contract } from "../generated/templates/BeefyVaultV7/BeefyVaultV7"
import { getBeefyVault, isVaultInitialized } from "./entity/vault"
import { ZERO_BI, tokenAmountToDecimal } from "./utils/decimal"
import { getTokenAndInitIfNeeded } from "./entity/token"
import { SHARE_TOKEN_MINT_ADDRESS } from "./config"
import { getInvestor } from "./entity/investor"
import { getInvestorPosition } from "./entity/position"
import { BeefyVault, Investor } from "../generated/schema"
import { Multicall3Params, multicall } from "./utils/multicall"

export function handleVaultTransfer(event: TransferEvent): void {
  // transfer to self
  if (event.params.from.equals(event.params.to)) {
    log.warning("handleVaultTransfer: transfer to self, ignoring {}", [event.transaction.hash.toHexString()])
    return
  }

  /// value is zero
  if (event.params.value.equals(ZERO_BI)) {
    log.warning("handleVaultTransfer: zero value transfer {}", [event.transaction.hash.toHexString()])
    return
  }

  let vault = getBeefyVault(event.address)
  if (!isVaultInitialized(vault)) {
    log.warning("handleVaultTransfer: vault is not initialized {}", [vault.id.toHexString()])
    return
  }
  const sharesToken = getTokenAndInitIfNeeded(vault.sharesToken)

  if (event.params.from.equals(SHARE_TOKEN_MINT_ADDRESS)) {
    // minting
    vault.rawSharesTokenTotalSupply = vault.rawSharesTokenTotalSupply.plus(event.params.value)
    vault.sharesTokenTotalSupply = tokenAmountToDecimal(vault.rawSharesTokenTotalSupply, sharesToken.decimals)
  } else {
    const investorAddress = event.params.from
    const investor = getInvestor(investorAddress)
    investor.save()
    updateInvestorVaultData(vault, investor, event.params.value.neg())
  }

  if (event.params.to.equals(SHARE_TOKEN_MINT_ADDRESS)) {
    // burning
    vault.rawSharesTokenTotalSupply = vault.rawSharesTokenTotalSupply.minus(event.params.value)
    vault.sharesTokenTotalSupply = tokenAmountToDecimal(vault.rawSharesTokenTotalSupply, sharesToken.decimals)
  } else {
    const investorAddress = event.params.to
    const investor = getInvestor(investorAddress)
    investor.save()
    updateInvestorVaultData(vault, investor, event.params.value)
  }
}

function updateInvestorVaultData(vault: BeefyVault, investor: Investor, sharesDiff: BigInt): Investor {
  const sharesToken = getTokenAndInitIfNeeded(vault.sharesToken)

  ///////
  // update investor positions
  const position = getInvestorPosition(vault, investor)
  position.rawSharesBalance = position.rawSharesBalance.plus(sharesDiff)
  position.sharesBalance = tokenAmountToDecimal(position.rawSharesBalance, sharesToken.decimals)
  position.save()

  return investor
}
