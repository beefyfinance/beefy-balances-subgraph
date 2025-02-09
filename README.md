# Beefy beefy-balances Subgraph

This Subgraph sources events from the Beefy contracts in different networks.

# Deployments

## Goldsky.com

### Latest endpoints

- [Avalanche](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-avax/latest/gn)
- [Arbitrum](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-arbitrum/latest/gn)
- [Base](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-base/latest/gn)
- [Bsc](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-bsc/latest/gn)
- [Ethereum](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-ethereum/latest/gn)
- [Fantom](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-fantom/latest/gn)
- [Fraxtal](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-fraxtal/latest/gn)
- [Gnosis](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-gnosis/latest/gn)
- [Linea](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-linea/latest/gn)
- [Lisk](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-lisk/latest/gn)
- [Manta](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-manta/latest/gn)
- [Mantle](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-mantle/latest/gn)
- [Metis](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-metis/latest/gn)
- [Mode](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-mode/latest/gn)
- [Moonbeam](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-moonbeam/latest/gn)
- [Optimism](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-optimism/latest/gn)
- [Polygon](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-polygon/latest/gn)
- [Rootstock](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-rootstock/latest/gn)
- [Scroll](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-scroll/latest/gn)
- [Sei](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-sei/latest/gn)
- [Sonic](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-sonic/latest/gn)
- [Zksync](https://api.goldsky.com/api/public/project_clu2walwem1qm01w40v3yhw1f/subgraphs/beefy-balances-zksync/latest/gn)

# Contributing

## Prerequisites

- Git: [git-scm.com](https://git-scm.com)
- Node.js: [nodejs.org](https://nodejs.org), see version in [.nvmrc](.nvmrc)
- Yarn: [yarnpkg.com](https://yarnpkg.com)

## Setup the project

```bash
yarn install
```

## Running a local instance of graph-node locally

```bash
yarn infra:strat
```

## Run tests

```bash
yarn test # run all tests
yarn test:graph # run only matchstick-as graph tests
yarn test:lint # run prettier linter
```

## HOWTOs

### How to add a new network

1. Add the network configuration [config/<network>.json](config/).
   - `indexerHintPrune` is the number of blocks to keep for the indexer hint, aim for 2 months. Can be set to `"auto"` to prune as much as possible. Recommended for performance and cost. Or set to `"never"` to keep all updates history. ([Thegraph docs](https://thegraph.com/docs/en/cookbook/pruning/#how-to-prune-a-subgraph-with-indexerhints))
2. Add the chain in `.github/workflows/Release.yml` to configure deployments.
3. Test the build
   - Apply the configuration: `yarn configure <chain>`
   - Build the application: `yarn build`
   - Run Tests: `yarn test`
   - Deploy the new chain in DEV: `./bin/deploy.sh <chain> <dev provider>`
   - Test the data in the dev provider subgraph explorer
   - Manually deploy the new chain in PROD for the first version: `./bin/release.sh <version> <chain> <dev provider>`
4. Update the `Deployments` section subgraph URLs in this README
5. Update the [Balances API](https://github.com/beefyfinance/beefy-balances-api)
6. Standard formatting with `yarn run format`

### How to update the schema

1. Create or update the [schema.graphql](schema.graphql) file.

- See TheGraph docs for [defining entities](https://thegraph.com/docs/en/developing/creating-a-subgraph/#defining-entities)

2. Run `yarn codegen` to generate the typescript types.

- See TheGraph docs for [TypeScript code generation](https://thegraph.com/docs/en/developing/creating-a-subgraph/#code-generation)

3. Update [subgraph.template.yaml](subgraph.template.yaml) with the new entity bindings and/or data sources if needed.

- TheGraph docs for [defining a call handler](https://thegraph.com/docs/en/developing/creating-a-subgraph/#defining-a-call-handler)
- TheGraph docs for [defining a block handler](https://thegraph.com/docs/en/developing/creating-a-subgraph/#block-handlers)
- TheGraph docs for [defining a data source template](https://thegraph.com/docs/en/developing/creating-a-subgraph/#data-source-templates)

4. Update or create the mappings in the [mappings](src/mappings) folder to handle the new entity.

- TheGraph docs for [defining mappings](https://thegraph.com/docs/en/developing/creating-a-subgraph/#mapping-function)
- TheGraph [AssemblyScript API](https://thegraph.com/docs/en/developing/graph-ts/api/)

5. Write tests for the new mappings in the [tests](tests/) folder.

- TheGraph docs for [testing mappings](https://thegraph.com/docs/en/developing/unit-testing-framework/)

### Deploy the subgraph

#### Manually

```bash
./bin/deploy.sh <network> goldsky
./bin/deploy.sh <network> 0xgraph

# or both
./bin/deploy.sh <network> goldsky 0xgraph
```

#### Release a new version

- Go to https://github.com/beefyfinance/beefy-balances-subgraph/releases
- Add a new realease with a tag matching [semver](https://semver.org/) (tag matching X.X.X)
- Github actions will update all subgraph
- Monitor the indexing progress in the subgraph explorer
