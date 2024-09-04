import { Address, log } from "@graphprotocol/graph-ts"
import { addIgnoredContract } from "../common/entity/ignored"
import { BeefyERC20Product as BeefyERC20ProductTemplate } from "../../generated/templates"
import { ADDRESS_ZERO } from "../common/utils/address";


export function bindOldProducts(): void {
    log.warning("Binding old boosts", [])
{{#old_boosts}}
    addIgnoredContract(Address.fromString("{{.}}"));
{{/old_boosts}}
    
    log.warning("Binding old vaults", [])
{{#old_vaults}}
    BeefyERC20ProductTemplate.create(Address.fromString("{{.}}"))
{{/old_vaults}}
}