import {SubstrateDatasourceKind, SubstrateHandlerKind, SubstrateProject,} from "@subql/types";

import {WasmDatasource} from "@subql/substrate-wasm-processor";

// Can expand the Datasource processor types via the generic param
const projectShibuya: SubstrateProject<WasmDatasource> = {
    specVersion: "1.0.0",
    version: "2.0.0",
    name: "lotto-subql",
    description:
        "This SubQuery project indexes data used by the Lotto dApp on Shibuya network",
    runner: {
        node: {
            name: "@subql/node",
            version: ">=3.0.1",
        },
        query: {
            name: "@subql/query",
            version: "*",
        },
    },
    schema: {
        file: "./schema.graphql",
    },
    network: {
        chainId:
            "0xddb89973361a170839f80f152d2e9e38a376a5a7eccefcade763f46a8e567019",
        /**
         * These endpoint(s) should be public non-pruned archive node
         * We recommend providing more than one endpoint for improved reliability, performance, and uptime
         * Public nodes may be rate limited, which can affect indexing speed
         * When developing your project we suggest getting a private API key
         * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
         * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
         *
         *
         *         endpoint: ["wss://rpc.shibuya.astar.network", "wss://shibuya-rpc.dwellir.com"],
         */
        endpoint: ["wss://rpc.shibuya.astar.network"],
        bypassBlocks: [5891857]
    },
    dataSources: [
        {
            kind: "substrate/Wasm",
            startBlock: 5979041,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "lotto",
                    contract: "WMrGnPBnqDUbmK3yNSi2KFibZg4skwtUSzauYgGm3KJyCxm",
                },
            },
            assets: new Map([["lotto", {file: "./metadata_shibuya/lotto_contract.json"}]]),
            mapping: {
                file: "./dist/indexShibuya.js",
                handlers: [
                    {
                        handler: "handleRaffleStarted",
                        kind: "substrate/WasmEvent",
                        filter: {
                            identifier: "RaffleStarted"
                        }
                    },
                    {
                        handler: "handleRaffleEnded",
                        kind: "substrate/WasmEvent",
                        filter: {
                            identifier: "RaffleEnded"
                        }
                    },
                    {
                        handler: "handleParticipationRegistered",
                        kind: "substrate/WasmEvent",
                        filter: {
                            identifier: "ParticipationRegistered"
                        }
                    },
                    {
                        handler: "handleResultReceived",
                        kind: "substrate/WasmEvent",
                        filter: {
                            identifier: "ResultReceived"
                        }
                    },
                    {
                        handler: "handleWinnersRevealed",
                        kind: "substrate/WasmEvent",
                        filter: {
                            identifier: "WinnersRevealed"
                        }
                    }
                ]
            }
        },
    ],
};

// Must set default to the project instance
export default projectShibuya;
