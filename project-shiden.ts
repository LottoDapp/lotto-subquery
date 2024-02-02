import {SubstrateDatasourceKind, SubstrateHandlerKind, SubstrateProject,} from "@subql/types";

import {WasmDatasource} from "@subql/substrate-wasm-processor";

// Can expand the Datasource processor types via the generic param
const projectShiden: SubstrateProject<WasmDatasource> = {
    specVersion: "1.0.0",
    version: "2.0.0",
    name: "lucky-subql",
    description:
        "This SubQuery project indexes data used by the dApp Lucky on Shiden network",
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
            "0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108",
        endpoint: ["wss://rpc.shiden.astar.network", "wss://shiden-rpc.dwellir.com"],
    },
    dataSources: [
        {
            // This is the datasource for Astar's Native Substrate processor (dAppStakingV2)
            kind: SubstrateDatasourceKind.Runtime,
            startBlock: 3964500,
            mapping: {
                file: "./dist/indexShiden.js",
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
            startBlock: 5843300,
            mapping: {
                file: "./dist/indexShiden.js",
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
            startBlock: 3964500,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "luckyRaffle",
                    contract: "antwZPZH7fuhLwcjKQUT2cbpfjcKUJS1bt1Lnq2VxSszg8d",
                },
            },
            assets: new Map([["luckyRaffle", {file: "./metadata_shiden/lucky_raffle_metadata.json"}]]),
            mapping: {
                file: "./dist/indexShiden.js",
                handlers: [
                    {
                        handler: "handleRaffleDone",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "antwZPZH7fuhLwcjKQUT2cbpfjcKUJS1bt1Lnq2VxSszg8d",
                            identifier: "RaffleDone"
                        }
                    }
                ]
            }
        },
        {
            kind: "substrate/Wasm",
            startBlock: 3964500,
            //endBlock: 1,
            processor: {
                file: "./node_modules/@subql/substrate-wasm-processor/dist/bundle.js",
                options: {
                    abi: "rewardManager",
                    contract: "X6yBHZm9MGzedCVBn6nGHHUDxEnjUNzSoN4aqAP4qooQpEU",
                },
            },
            assets: new Map([["rewardManager", {file: "./metadata_shiden/reward_manager_metadata.json"}]]),
            mapping: {
                file: "./dist/indexShiden.js",
                handlers: [
                    {
                        handler: "handlePendingReward",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "X6yBHZm9MGzedCVBn6nGHHUDxEnjUNzSoN4aqAP4qooQpEU",
                            identifier: "PendingReward"
                        }
                    },
                    {
                        handler: "handleRewardsClaimed",
                        kind: "substrate/WasmEvent",
                        filter: {
                            contract: "X6yBHZm9MGzedCVBn6nGHHUDxEnjUNzSoN4aqAP4qooQpEU",
                            identifier: "RewardsClaimed"
                        }
                    }
                ]
            }
        },
    ],
};

// Must set default to the project instance
export default projectShiden;
