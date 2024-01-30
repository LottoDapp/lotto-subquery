import {SubstrateDatasourceKind, SubstrateHandlerKind, SubstrateProject,} from "@subql/types";

import {WasmDatasource} from "@subql/substrate-wasm-processor";

// Can expand the Datasource processor types via the generic param
const projectShibuya: SubstrateProject<WasmDatasource> = {
    specVersion: "1.0.0",
    version: "2.0.0",
    name: "lucky-subql",
    description:
        "This SubQuery project indexes data used by the dApp Lucky on Shibuya network",
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
    },
    dataSources: [
        {
            // This is the datasource for Astar's Native Substrate processor
            kind: SubstrateDatasourceKind.Runtime,
            startBlock: 5472414,
            mapping: {
                file: "./dist/indexShibuya.js",
                handlers: [
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "handleStake",
                        filter: {
                            module: "dappStaking",
                            method: "Stake",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "handleUnstake",
                        filter: {
                            module: "dappStaking",
                            method: "Unstake",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "handleDAppReward",
                        filter: {
                            module: "dappStaking",
                            method: "DAppReward",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "handleNewEra",
                        filter: {
                            module: "dappStaking",
                            method: "NewEra",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "handleNewSubPeriod",
                        filter: {
                            module: "dappStaking",
                            method: "NewSubperiod",
                        },
                    },
                ],
            },
        },
        {
            kind: "substrate/Wasm",
            startBlock: 5600000,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "luckyRaffle",
                    contract: "Y4k5gyegtv3UuZBLFKVtfThoXvpSAPNeQeLutodrCukrpzy",
                },
            },
            assets: new Map([["luckyRaffle", {file: "./metadata_shibuya/lucky_raffle_metadata.json"}]]),
            mapping: {
                file: "./dist/indexShibuya.js",
                handlers: [
                    {
                        handler: "handleRaffleDone",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "Y4k5gyegtv3UuZBLFKVtfThoXvpSAPNeQeLutodrCukrpzy",
                            identifier: "RaffleDone"
                        }
                    }
                ]
            }
        },
        {
            kind: "substrate/Wasm",
            startBlock: 3393298,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "rewardManager",
                    contract: "X8nqJsFQWBk137WxetcPdAGLwnJ8xpAQ5tXS1bNsHKaz1q6",
                },
            },
            assets: new Map([["rewardManager", {file: "./metadata_shibuya/reward_manager_metadata.json"}]]),
            mapping: {
                file: "./dist/indexShibuya.js",
                handlers: [
                    {
                        handler: "handlePendingReward",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "X8nqJsFQWBk137WxetcPdAGLwnJ8xpAQ5tXS1bNsHKaz1q6",
                            identifier: "PendingReward"
                        }
                    },
                    {
                        handler: "handleRewardsClaimed",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "X8nqJsFQWBk137WxetcPdAGLwnJ8xpAQ5tXS1bNsHKaz1q6",
                            identifier: "RewardsClaimed"
                        }
                    }
                ]
            }
        },
    ],
};

// Must set default to the project instance
export default projectShibuya;
