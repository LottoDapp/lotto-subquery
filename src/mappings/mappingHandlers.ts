import {
    Account,
    DAppReward,
    DeveloperReward,
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
import type {UInt} from '@polkadot/types-codec';
import {SubstrateEvent} from "@subql/types";

import {Codec} from '@polkadot/types-codec/types';


const DAPPSTAKING_CONTRACT_ID = process.env.DAPPSTAKING_CONTRACT_ID as string;
const DAPPSTAKING_DEVELOPER_ID = process.env.DAPPSTAKING_DEVELOPER_ID as string;


/*
* PREVIOUS DAPPSTAKING V2 HANDLERS
*/

async function getCurrentEra(): Promise<bigint> {
    let palletInfo = await PalletInfo.get('0');

    if (! palletInfo) {
        await logger.info("---------- getCurrentEra V2 - New Pallet Info --------- ");
        palletInfo = PalletInfo.create({
            id: '0',
            currentEra: BigInt(0),
            currentPeriod: BigInt(0),
            currentSubPeriod: '',
        });
        await palletInfo.save();
    }

    return palletInfo.currentEra ? palletInfo.currentEra : BigInt(0);
}

export async function bondAndStakeV2(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
        return;
    }

    await logger.info("---------- DappsStaking V2- BondAndStake --------- ");

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await getAccount(account.toString());
    userAccount.totalStake += amount;
    await userAccount.save();

    const currentEra = await getCurrentEra();
    /*
    let stake = new Stake(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
        userAccount.id,
        amount,
        currentEra,
        event.block.block.header.number.toBigInt()
    );
     */
    const stake = Stake.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        accountId: userAccount.id,
        amount: amount,
        era: currentEra,
        period: BigInt(0),
        subPeriod: "NA",
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await stake.save();

}


export async function unbondAndUnstakeV2(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
        return;
    }

    await logger.info("---------- DappsStaking V2 - UnbondAndUnstake --------- ");

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await getAccount(account.toString());
    userAccount.totalStake -= amount;
    await userAccount.save();

    const currentEra = await getCurrentEra();
    /*
    let stake = new Stake(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
        userAccount.id,
        -amount,
        currentEra,
        event.block.block.header.number.toBigInt()
    );
     */
    const stake = Stake.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        accountId: userAccount.id,
        amount: -amount,
        era: currentEra,
        period: BigInt(0),
        subPeriod: "NA",
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await stake.save();
}


export async function nominationTransferV2(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, originSmartContract, balanceOf, targetSmartContract],
        },
    } = event;

    if (!originSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)
        && !targetSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)
    ){
        return;
    }

    let userAccount = await getAccount(account.toString());

    const amount = (balanceOf as Balance).toBigInt();
    const currentEra = await getCurrentEra();

    if (targetSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
        await logger.info("---------- DappsStaking V2 - nominationTransferIn --------- ");

        userAccount.totalStake += amount;
        await userAccount.save();
/*
        let stake = new Stake(
            `${event.block.block.header.number.toNumber()}-${event.idx}`,
            userAccount.id,
            amount,
            currentEra,
            event.block.block.header.number.toBigInt()
        );
*/
        const stake = Stake.create({
            id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
            accountId: userAccount.id,
            amount: amount,
            era: currentEra,
            period: BigInt(0),
            subPeriod: "NA",
            blockNumber: event.block.block.header.number.toBigInt(),
        });

        await stake.save();

    } else if (originSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
        await logger.info("---------- DappsStaking V2 - nominationTransferOut --------- ");

        userAccount.totalStake -= amount;
        await userAccount.save();
/*
        let stake = new Stake(
            `${event.block.block.header.number.toNumber()}-${event.idx}`,
            userAccount.id,
            -amount,
            currentEra,
            event.block.block.header.number.toBigInt()
        );
*/
        const stake = Stake.create({
            id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
            accountId: userAccount.id,
            amount: -amount,
            era: currentEra,
            period: BigInt(0),
            subPeriod: "NA",
            blockNumber: event.block.block.header.number.toBigInt(),
        });

        await stake.save();

    } else {
        await logger.info("---------- DappsStaking V2 - nominationTransfer ERROR --------- ");
        await logger.info(event.block.block.header.hash.toString());
    }
}


export async function rewardV2(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, era, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
        return;
    }

    if (!account.toString().includes(DAPPSTAKING_DEVELOPER_ID)){
        return;
    }

    await logger.info("---------- DappsStaking V2 - Reward --------- ");

    /* save the developer account the first time to avoid an error with FK */
    let developerAccount = await Account.get(account.toString());
    if (!developerAccount) {
        developerAccount = new Account(account.toString(), BigInt(0), BigInt(0), BigInt(0), BigInt(0));
        await developerAccount.save();
    }

    const amount = (balanceOf as Balance).toBigInt();
    const bi_era = await toBigInt(era);
/*
    let reward = new DeveloperReward(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
        bi_era,
        developerAccount.id,
        amount
    );
*/
    const reward = DeveloperReward.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        era: bi_era,
        accountId: developerAccount.id,
        amount: amount
    });


    await reward.save();
}

export async function newDappStakingEraV2(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [era],
        },
    } = event;

    await logger.info("---------- DappsStaking V2 - New DappStaking Era --------- ");
    await logger.info(DAPPSTAKING_CONTRACT_ID);
    await logger.info(DAPPSTAKING_DEVELOPER_ID);

    const newEra = await toBigInt(era);
    /*
    let dappStakingEra = new DappStakingEra(
        `${event.block.block.header.number.toNumber()}-${event.idx}`,
        newEra,
        event.block.block.header.number.toBigInt()
    );
     */
    let dappStakingEra = DAppStakingEra.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        era: newEra,
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await dappStakingEra.save();

    /*
    let palletInfo = await PalletInfo.get('0');
    if (!palletInfo) {
        palletInfo = new PalletInfo('0', newEra);
    } else {
        palletInfo.currentEra = newEra;
    }
    await palletInfo.save();
*/
    let palletInfo = await getPalletInfo();
    palletInfo.currentEra = newEra;
    await logger.info("currentPeriod : " + palletInfo.currentPeriod );
    await logger.info("currentSubPeriod : " + palletInfo.currentSubPeriod );
    await palletInfo.save();

}



/*
* END PREVIOUS DAPPSTAKING V2 HANDLERS
*/


async function getPalletInfo(): Promise<PalletInfo> {
    let palletInfo = await PalletInfo.get('0');
    if (palletInfo) {
        await logger.info("---------- getPalletInfo - existing pallet info --------- ");
        return palletInfo;
    }

    await logger.info("---------- getPalletInfo - New Pallet Info --------- ");
    return PalletInfo.create({
        id: '0',
        currentEra: BigInt(0),
        currentPeriod: BigInt(0),
        currentSubPeriod: '',
    });
}

async function getAccount(accountId: string): Promise<Account> {
    let userAccount = await Account.get(accountId);
    if (userAccount) {
        await logger.info("---------- getAccount - Existing Account --------- ");
        return userAccount;
    }
    await logger.info("---------- getAccount - New Account --------- ");
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
        await logger.info("Other contract :" + smartContract.toString());
        return;
    }

    await logger.info("Matched contract");

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
        await logger.info("Other contract :" + smartContract.toString());
        return;
    }
    await logger.info("Matched contract");

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
            data: [beneficiary, smartContract, tierId, era, amount],
        },
    } = event;
    await logger.info("---------- DAppStaking - DApp Reward --------- ");

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)) {
        await logger.info("Other smartContract :" + smartContract.toString());
        return;
    }

    /* save the developer account the first time to avoid an error with FK */
    let beneficiaryAccount = await Account.get(beneficiary.toString());
    if (!beneficiaryAccount) {
        beneficiaryAccount = new Account(beneficiary.toString(), BigInt(0), BigInt(0), BigInt(0), BigInt(0));
        await beneficiaryAccount.save();
    }

    const bi_era = await toBigInt(era);
    const tierId_era = await toBigInt(tierId);

    let reward = DAppReward.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        era: bi_era,
        beneficiaryId: beneficiaryAccount.id,
        amount: (amount as Balance).toBigInt(),
        tierId: tierId_era,
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
    await logger.info("era : " + era );

    const newEra = await toBigInt(era);
    let dappStakingEra = DAppStakingEra.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        era: newEra,
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await dappStakingEra.save();

    let palletInfo = await getPalletInfo();
    palletInfo.currentEra = newEra;
    await logger.info("currentPeriod : " + palletInfo.currentPeriod );
    await logger.info("currentSubPeriod : " + palletInfo.currentSubPeriod );
    await palletInfo.save();
}


export async function handleNewSubPeriod(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [subPeriod, period],
        },
    } = event;

    await logger.info("---------- DAppStaking - New sub period  --------- ");
    await logger.info("subPeriod : " + subPeriod );
    await logger.info("period : " + period );

    const newPeriod = await toBigInt(period);

    let dAppSubPeriod = DAppSubPeriod.create({
        id: `${event.block.block.header.number.toNumber()}-${event.idx}`,
        period: newPeriod,
        subPeriod: subPeriod.toString(),
        blockNumber: event.block.block.header.number.toBigInt(),
    });

    await dAppSubPeriod.save();

    let palletInfo = await getPalletInfo();
    await logger.info("currentEra : " + palletInfo.currentEra );
    palletInfo.currentPeriod = newPeriod;
    palletInfo.currentSubPeriod = subPeriod.toString();
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
        id: `${event.blockNumber.valueOf()}-${event.blockEventIdx.valueOf()}`,
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
        id: `${event.blockNumber.valueOf()}-${event.blockEventIdx.valueOf()}`,
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
            id: `${event.blockNumber.valueOf()}-${event.blockEventIdx.valueOf()}`,
            accountId: userAccount.id,
            amount: amount.toBigInt()
        }
    );
    await rewardsClaimed.save();
}
