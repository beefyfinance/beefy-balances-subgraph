import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"
import { Initialized as InitializedEvent } from "../../../generated/ContractDeployer/Initializable"
import { IERC20 as IERC20Contract } from "../../../generated/templates/BeefyERC20Product/IERC20"
import { Address, log } from "@graphprotocol/graph-ts"
import { fetchAndSaveTokenData } from "../utils/token"

export function handleContractDeployedInitializableInitialized(event: InitializedEvent): void {
  const tokenAddress = event.address

  // detect if we are creating an erc20 token
  const tokenContract = IERC20Contract.bind(Address.fromBytes(tokenAddress))

  const tokenDecimalsRes = tokenContract.try_decimals()
  if (tokenDecimalsRes.reverted) {
    log.info("Contract {} is not an ERC20 token, decimals() reverted", [tokenAddress.toHexString()])
    return
  }

  const tokenNameRes = tokenContract.try_name()
  if (tokenNameRes.reverted) {
    log.info("Contract {} is not an ERC20 token, name() reverted", [tokenAddress.toHexString()])
    return
  }

  const tokenSymbolRes = tokenContract.try_symbol()
  if (tokenSymbolRes.reverted) {
    log.info("Contract {} is not an ERC20 token, symbol() reverted", [tokenAddress.toHexString()])
    return
  }

  log.error("Creating BeefyERC20Product template for {} from contract-deployer initialize event", [tokenAddress.toHexString()])
  fetchAndSaveTokenData(tokenAddress)
  BeefyERC20ProductTemplate.create(tokenAddress)
}
