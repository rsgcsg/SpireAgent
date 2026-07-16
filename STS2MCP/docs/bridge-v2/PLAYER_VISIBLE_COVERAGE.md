# Player-Visible Coverage Matrix

Coverage is per exact game version and surface. "v1 exists" is not v2 support.

| Surface | v2 state | Legal actions | Completion | Real smoke | Status |
|---|---|---|---|---|---|
| deck enchant selection | implemented | implemented | action-specific | passed | runtime-qualified for exact build |
| combat turn | none | none | none | none | unsupported |
| combat card selection | none | none | none | none | unsupported |
| card reward | none | none | none | none | unsupported |
| generic deck selection | none | none | none | none | unsupported |
| bundle/relic selection | none | none | none | none | unsupported |
| map | none | none | none | none | unsupported |
| event/dialogue | none | none | none | none | unsupported |
| rest | none | none | none | none | unsupported |
| shop | none | none | none | none | unsupported |
| rewards/treasure | none | none | none | none | unsupported |
| menu/game over | none | none | none | none | unsupported |
| inspection/viewers | none | none | none | none | unsupported |
| multiplayer | none | none | none | none | unsupported |

## Deck Enchant Field Coverage

| Fact | Visibility | Source | Required | Status |
|---|---|---|---|---|
| prompt | on_screen | `%BottomLabel.text` | no | implemented |
| enchantment identity | on_screen/model identity | `_enchantment.Id` | yes | exact-version binding |
| enchantment title | on_screen | `%EnchantmentTitle.text` | yes | implemented |
| enchantment description | on_screen | `%EnchantmentDescription.text` | yes | implemented |
| amount | on_screen semantics | `_enchantmentAmount` | yes | exact-version binding |
| min/max selection | UI behavior | `_prefs` | yes | exact-version binding |
| selected card instances | on_screen highlight | `_selectedCards` | yes | exact-version binding |
| candidate card text | on_screen/inspection | rendered grid card model | yes | implemented |
| selecting/preview stage | on_screen | dedicated enchant preview containers | yes | implemented |
| exact enabled actions | on_screen/game rules | same controls and validators as execution | yes | implemented |

The installed-build smoke validated field values, stable state/action identity,
stale rejection, select-to-preview, preview cancellation, final confirmation,
and command settlement. It does not qualify generic card selection or deck
inspection surfaces.
