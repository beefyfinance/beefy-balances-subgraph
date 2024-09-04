#!/bin/bash

CHAIN=$1
valid_chains=($(ls config | sed 's/\.json//g'))

if [ -z "$CHAIN" ]; then
    echo "Usage: $0 <chain>"
    exit 1
fi

if [[ ! " ${valid_chains[@]} " =~ " ${CHAIN} " ]]; then
    echo "invalid chain"
    exit 1
fi

set -e

yarn --silent run mustache config/$CHAIN.json subgraph.template.yaml > subgraph.yaml 
yarn --silent run mustache config/$CHAIN.json src/config.template.ts > src/config.ts 

RNG=$((1 + $RANDOM % 100000))
echo '{"random": '$RNG'}' > random.json
yarn --silent run mustache random.json src/random.template.ts > src/random.ts 

yarn --silent run mustache data/${CHAIN}_data.json src/classic/bind_old_products.template.ts > src/classic/bind_old_products.ts
