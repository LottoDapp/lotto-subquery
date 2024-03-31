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
            // This is the datasource for Astar's Native Substrate processor (dAppStakingV2)
            kind: SubstrateDatasourceKind.Runtime,
            startBlock: 4668050,
            mapping: {
                file: "./dist/indexAstar.js",
                handlers: [
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "bondAndStakeV2",
                        filter: {
                            module: "dappsStaking",
                            method: "BondAndStake",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "unbondAndUnstakeV2",
                        filter: {
                            module: "dappsStaking",
                            method: "UnbondAndUnstake",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "nominationTransferV2",
                        filter: {
                            module: "dappsStaking",
                            method: "NominationTransfer",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "rewardV2",
                        filter: {
                            module: "dappsStaking",
                            method: "Reward",
                        },
                    },
                    {
                        kind: SubstrateHandlerKind.Event,
                        handler: "newDappStakingEraV2",
                        filter: {
                            module: "dappsStaking",
                            method: "NewDappStakingEra",
                        },
                    },
                ],
            },
        },
        {
            // This is the datasource for dAppStakingV3 events
            kind: SubstrateDatasourceKind.Runtime,
            startBlock: 5445000,
            mapping: {
                file: "./dist/indexAstar.js",
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
            startBlock: 4668050,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "luckyRaffle",
                    contract: "XPC4BUeSHhTWqzUdUWtW1cTNHhktNPgenKZ4qq2FkKR2two",
                },
            },
            assets: new Map([["luckyRaffle", {file: "./metadata_astar/lucky_raffle_metadata.json"}]]),
            mapping: {
                file: "./dist/indexAstar.js",
                handlers: [
                    {
                        handler: "handleRaffleDone",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "XPC4BUeSHhTWqzUdUWtW1cTNHhktNPgenKZ4qq2FkKR2two",
                            identifier: "RaffleDone"
                        }
                    }
                ]
            }
        },
        {
            kind: "substrate/Wasm",
            startBlock: 4668050,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "rewardManager",
                    contract: "ZSV1GVepvmWFdshMWgczS4zYvmmwEsBjWQjN4WDpUEFRRPy",
                },
            },
            assets: new Map([["rewardManager", {file: "./metadata_astar/reward_manager_metadata.json"}]]),
            mapping: {
                file: "./dist/indexAstar.js",
                handlers: [
                    {
                        handler: "handlePendingReward",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "ZSV1GVepvmWFdshMWgczS4zYvmmwEsBjWQjN4WDpUEFRRPy",
                            identifier: "PendingReward"
                        }
                    },
                    {
                        handler: "handleRewardsClaimed",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "ZSV1GVepvmWFdshMWgczS4zYvmmwEsBjWQjN4WDpUEFRRPy",
                            identifier: "RewardsClaimed"
                        }
                    }
                ]
            }
        },
    ],
};

// Must set default to the project instance
export default projectAstar;
