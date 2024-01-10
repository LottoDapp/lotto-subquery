import {
    Account,
    DAppReward,
    DAppStakingEra,
    DAppSubPeriod,
    PalletInfo,
    RaffleDone,
    Reward,
    RewardsClaimed,
    Stake
} from "../types";
import {WasmEvent} from "@subql/substrate-wasm-processor";
import {AccountId, Balance} from "@polkadot/types/interfaces/runtime";
import type {UInt, Option} from '@polkadot/types-codec';
import {SubstrateEvent} from "@subql/types";

import {Codec} from '@polkadot/types-codec/types';


const DAPPSTAKING_CONTRACT_ID = process.env.DAPPSTAKING_CONTRACT_ID as string;
const DAPPSTAKING_DEVELOPER_ID = process.env.DAPPSTAKING_DEVELOPER_ID as string;


async function getPalletInfo(): Promise<PalletInfo> {
    let palletInfo = await PalletInfo.get('0');
    if (palletInfo) {
        return palletInfo;
    }
    return PalletInfo.create({
        id: '0',
        currentEra: BigInt(0),
        currentPeriod: BigInt(0),
        currentSubPeriod: BigInt(0),
    });
}

async function getAccount(accountId: string): Promise<Account> {
    let userAccount = await Account.get(accountId);
    if (userAccount) {
        return userAccount;
    }
    return Account.create({
        id: accountId,
        totalStake: BigInt(0),
        totalRewards: BigInt(0),
        totalClaimed: BigInt(0),
        totalPending: BigInt(0)
    });
}

async function toBigInt(value: Codec): Promise<bigint> {
    return BigInt(value.toString());
}

export async function handleStake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    await logger.info("---------- DAppStaking - Stake --------- ");
    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)) {
        return;
    }

    await logger.info("---------- DAppStaking - Stake --------- ");

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await getAccount(account.toString());
    userAccount.totalStake += amount;
    await userAccount.save();

    const palletInfo = await getPalletInfo();
    const stake = Stake.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        accountId: userAccount.id,
        amount: amount,
        era: palletInfo.currentEra,
        period: palletInfo.currentPeriod,
        subPeriod: palletInfo.currentSubPeriod,
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await stake.save();
}


export async function handleUnstake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    await logger.info("---------- DSppStaking - Unstake --------- ");
    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)) {
        return;
    }

    await logger.info("---------- DSppStaking - Unstake --------- ");

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await getAccount(account.toString());
    userAccount.totalStake -= amount;
    await userAccount.save();

    const palletInfo = await getPalletInfo();
    const stake = Stake.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        accountId: userAccount.id,
        amount: -amount,
        era: palletInfo.currentEra,
        period: palletInfo.currentPeriod,
        subPeriod: palletInfo.currentSubPeriod,
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await stake.save();
}


export async function handleDAppReward(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, era, balanceOf],
        },
    } = event;
    await logger.info("---------- DAppStaking - DApp Reward --------- ");

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)) {
        return;
    }

    if (!account.toString().includes(DAPPSTAKING_DEVELOPER_ID)) {
        return;
    }

    await logger.info("---------- DAppStaking - DApp Reward --------- ");

    /* save the developer account the first time to avoid an error with FK */
    let developerAccount = await Account.get(account.toString());
    if (!developerAccount) {
        developerAccount = new Account(account.toString(), BigInt(0), BigInt(0), BigInt(0), BigInt(0));
        await developerAccount.save();
    }

    const amount = (balanceOf as Balance).toBigInt();
    const bi_era = await toBigInt(era);

    let reward = DAppReward.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        era: bi_era,
        accountId: developerAccount.id,
        amount,
        tierId: BigInt(0),
    });
    await reward.save();
}

export async function handleNewEra(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [era],
        },
    } = event;

    await logger.info("---------- DAppStaking - New Era --------- ");
    await logger.info(DAPPSTAKING_CONTRACT_ID);
    await logger.info(DAPPSTAKING_DEVELOPER_ID);

    const newEra = await toBigInt(era);
    let dappStakingEra = DAppStakingEra.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        era: newEra,
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await dappStakingEra.save();

    let palletInfo = await getPalletInfo();
    palletInfo.currentEra = newEra;
    await palletInfo.save();
}


export async function handleNewSubPeriod(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [subPeriod, period],
        },
    } = event;

    await logger.info("---------- DAppStaking - New sub period  --------- ");
    await logger.info(DAPPSTAKING_CONTRACT_ID);
    await logger.info(DAPPSTAKING_DEVELOPER_ID);

    const newSubPeriod = await toBigInt(subPeriod);
    const newPeriod = await toBigInt(period);

    let dAppSubPeriod = DAppSubPeriod.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        period: newPeriod,
        subPeriod: newSubPeriod,
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await dAppSubPeriod.save();

    let palletInfo = await getPalletInfo();
    palletInfo.currentPeriod = newPeriod;
    palletInfo.currentSubPeriod = newSubPeriod;
    await palletInfo.save();
}


type RaffleDoneEvent = [AccountId, UInt, Balance, UInt, UInt, Balance] & {
    contract: AccountId,
    era: UInt,
    pendingRewards: Balance,
    nbWinners: UInt,
    nbParticipants: UInt,
    totalValue: Balance,
}

export async function handleRaffleDone(event: WasmEvent<RaffleDoneEvent>): Promise<void> {

    await logger.info("---------- Raffle Done  --------- ");

    if (!event.args) {
        await logger.warn("No Event");
        return;
    }

    const [contract, era, pendingRewards, nbWinners, nbParticipants, totalValue] = event.args;

    let raffleDone = RaffleDone.create({
        id: `${event.blockNumber.valueOf()}-${event.eventIndex.valueOf()}`,
        era: era.toBigInt(),
        totalRewards: pendingRewards.toBigInt(),
        nbWinners: nbWinners.toBigInt(),
        nbParticipants: nbParticipants.toBigInt(),
        totalValue: totalValue.toBigInt(),
    });
    await raffleDone.save();

}


type PendingRewardEvent = [AccountId, UInt, Balance] & {
    account: AccountId,
    era: UInt,
    amount: Balance,
}

export async function handlePendingReward(event: WasmEvent<PendingRewardEvent>): Promise<void> {

    await logger.info("---------- Pending Reward --------- ");

    if (!event.args) {
        await logger.warn("No Event !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return;
    }

    const [account, era, amount] = event.args;

    let userAccount = await getAccount(account.toString());
    userAccount.totalRewards += amount.toBigInt();
    userAccount.totalPending += amount.toBigInt();
    await userAccount.save();

    let reward = Reward.create({
        id: `${event.blockNumber.valueOf()}-${event.eventIndex.valueOf()}`,
        accountId: userAccount.id,
        era: era.toBigInt(),
        amount: amount.toBigInt()
    });
    await reward.save();

}


type RewardsClaimedEvent = [AccountId, Balance] & {
    account: AccountId,
    amount: Balance,
}

export async function handleRewardsClaimed(event: WasmEvent<RewardsClaimedEvent>): Promise<void> {

    await logger.info("---------- Rewards Claimed --------- ");

    if (!event.args) {
        await logger.warn("No Event !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return;
    }

    const [account, amount] = event.args;

    let userAccount = await getAccount(account.toString());
    userAccount.totalClaimed += amount.toBigInt();
    userAccount.totalPending -= amount.toBigInt();
    await userAccount.save();

    let rewardsClaimed = RewardsClaimed.create({
            id: `${event.blockNumber.valueOf()}-${event.eventIndex.valueOf()}`,
            accountId: userAccount.id,
            amount: amount.toBigInt()
        }
    );
    await rewardsClaimed.save();
}
