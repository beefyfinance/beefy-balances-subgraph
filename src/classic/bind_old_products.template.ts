import { Address, log, ethereum } from "@graphprotocol/graph-ts"
import { addIgnoredContract } from "../common/entity/ignored"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../generated/templates"



export function bindOldProducts(block: ethereum.Block): void {
    log.warning("Binding old boosts at block {}", [block.number.toString()])
{{#old_boosts}}
    addIgnoredContract(Address.fromString("{{.}}"));
{{/old_boosts}}
    
    log.warning("Binding old vaults at block {}", [block.number.toString()])
{{#old_vaults}}
    BeefyERC20ProductTemplate.create(Address.fromString("{{.}}"))
{{/old_vaults}}
}