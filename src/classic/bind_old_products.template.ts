import { Address, log, ethereum } from "@graphprotocol/graph-ts"
import { addIgnoredContract } from "../common/entity/ignored"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../generated/templates"
import { markContractDiscoveredFromConfigFile } from "../common/entity/contract"
import { ADDRESS_ZERO } from "../common/utils/address"



export function bindOldProducts(block: ethereum.Block): void {
    log.warning("Binding old boosts at block {}", [block.number.toString()])
    let address = ADDRESS_ZERO;
    
{{#no_factory_boosts}}
        address = Address.fromString("{{.}}")
        addIgnoredContract(address)
        markContractDiscoveredFromConfigFile(address)
{{/no_factory_boosts}}
    
    log.warning("Binding old vaults at block {}", [block.number.toString()])
{{#no_factory_vaults}}
    address = Address.fromString("{{.}}")
    BeefyERC20ProductTemplate.create(address)
    markContractDiscoveredFromConfigFile(address)
{{/no_factory_vaults}}
}