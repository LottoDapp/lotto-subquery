import {SubstrateDatasourceKind, SubstrateHandlerKind, SubstrateProject,} from "@subql/types";

import {WasmDatasource} from "@subql/substrate-wasm-processor";

// Can expand the Datasource processor types via the generic param
const projectAstar: SubstrateProject<WasmDatasource> = {
    specVersion: "1.0.0",
    version: "2.0.0",
    name: "lotto-subql",
    description:
        "This SubQuery project indexes data used by the Lotto dApp on Astar network",
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
            "0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6",
        endpoint: ["wss://rpc.astar.network", "wss://astar-rpc.dwellir.com"],
    },
    dataSources: [
        {
            kind: "substrate/Wasm",
            startBlock: 6360600,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "lotto",
                    contract: "XSMfwh4kriyo96h5LBdttiixKKd3fRxZL5dR81pK4gCuNsC",
                },
            },
            assets: new Map([["lotto", {file: "./metadata_astar/lotto_contract.json"}]]),
            mapping: {
                file: "./dist/indexAstar.js",
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
        }
    ],
};

// Must set default to the project instance
export default projectAstar;
