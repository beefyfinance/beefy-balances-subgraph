import {
  BeefyERC20Product as BeefyERC20ProductTemplate,
  ContractDeployerInitializable as ContractDeployerInitializableTemplate,
} from "../../../generated/templates"
import { ContractDeployed as ContractDeployedEvent } from "../../../generated/ContractDeployer/ContractDeployer"
import { IERC20 as IERC20Contract } from "../../../generated/templates/BeefyERC20Product/IERC20"
import { fetchAndSaveTokenData } from "../utils/token"
import { Address, log } from "@graphprotocol/graph-ts"

export function handleContractDeployedWithDeployer(event: ContractDeployedEvent): void {
  const address = event.params.deploymentAddress

  // detect if we are creating an erc20 token
  const tokenContract = IERC20Contract.bind(Address.fromBytes(address))
  const tokenDecimalsRes = tokenContract.try_decimals()
  if (tokenDecimalsRes.reverted) {
    log.info("Contract {} is not an ERC20 token, decimals() reverted", [address.toHexString()])
    return
  }
  const tokenNameRes = tokenContract.try_name()
  if (tokenNameRes.reverted) {
    log.info("Contract {} is not an ERC20 token, name() reverted", [address.toHexString()])
    return
  }
  const tokenSymbolRes = tokenContract.try_symbol()
  if (tokenSymbolRes.reverted) {
    log.info("Contract {} is not an ERC20 token, symbol() reverted", [address.toHexString()])
    return
  }

  // if any of the calls return null, this is most likely an initializable contract
  const tokenDecimals = tokenDecimalsRes.value
  const tokenName = tokenNameRes.value
  const tokenSymbol = tokenSymbolRes.value
  if (tokenDecimals == 0 || tokenName == "" || tokenSymbol == "") {
    log.info("Contract {} is probably innitializable, one of the metadata calls returned null", [address.toHexString()])
    ContractDeployerInitializableTemplate.create(address)
  } else {
    log.debug("Creating BeefyERC20Product template for {} from contract-deployer", [address.toHexString()])
    fetchAndSaveTokenData(address)
    BeefyERC20ProductTemplate.create(address)
  }
}
