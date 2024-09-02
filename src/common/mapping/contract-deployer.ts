import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../../generated/templates"
import { ContractDeployed as ContractDeployedEvent } from "../../../generated/ContractDeployer/ContractDeployer"

export function handleContractDeployedWithDeployer(event: ContractDeployedEvent): void {
  const address = event.params.deploymentAddress
  BeefyERC20ProductTemplate.create(address)
}
