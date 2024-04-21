import {
    Participation, Raffle, Result, Winner,
} from "../types";
import {WasmEvent} from "@subql/substrate-wasm-processor";
import {AccountId} from "@polkadot/types/interfaces/runtime";
import type {UInt} from '@polkadot/types-codec';


type RaffleStartedEvent = [UInt] & {
    num_raffle: UInt,
}

export async function handleRaffleStarted(event: WasmEvent<RaffleStartedEvent>): Promise<void> {

    await logger.info("---------- Raffle Started --------- ");

    if (!event.args) {
        await logger.warn("No Event");
        return;
    }

    const [num_raffle] = event.args;

    await logger.info("num_raffle : " + num_raffle );

    let raffle = Raffle.create({
        id: num_raffle.toString(),
        startedOn: BigInt(event.blockNumber),
        endedOn: undefined,
    });
    await raffle.save();
}


type RaffleEndedEvent = [UInt] & {
    num_raffle: UInt,
}

export async function handleRaffleEnded(event: WasmEvent<RaffleEndedEvent>): Promise<void> {

    await logger.info("---------- Raffle Ended --------- ");

    if (!event.args) {
        await logger.warn("No Event");
        return;
    }

    const [num_raffle] = event.args;

    await logger.info("num_raffle : " + num_raffle );

    let raffle = await Raffle.get(num_raffle.toString());
    if (!raffle){
        raffle = Raffle.create({
            id: num_raffle.toString(),
            startedOn: undefined,
            endedOn: BigInt(event.blockNumber),
        });
    } else {
        raffle.endedOn = BigInt(event.blockNumber);
    }
    await raffle.save();
}



type ParticipationRegisteredEvent = [UInt, AccountId, [UInt]] & {
    num_raffle: UInt,
    participant: AccountId,
    numbers: [UInt],
}

export async function handleParticipationRegistered(event: WasmEvent<ParticipationRegisteredEvent>): Promise<void> {

    await logger.info("---------- Participation Registered --------- ");

    if (!event.args) {
        await logger.warn("No Event");
        return;
    }

    const [num_raffle, participant, numbers] = event.args;

    await logger.info("num_raffle : " + num_raffle );
    await logger.info("participant : " + participant );
    await logger.info("numbers : " + numbers );

    let participation = Participation.create({
        id: `${event.blockNumber.valueOf()}-${event.blockEventIdx.valueOf()}`,
        num_raffle: num_raffle.toBigInt(),
        accountId: participant.toString(),
        numbers: numbers.map(value => value.toBigInt()),
    });
    await participation.save();
}




type ResultReceivedEvent = [UInt, [UInt]] & {
    num_raffle: UInt,
    numbers: [UInt],
}

export async function handleResultReceived(event: WasmEvent<ResultReceivedEvent>): Promise<void> {

    await logger.info("---------- Result Received --------- ");

    if (!event.args) {
        await logger.warn("No Event");
        return;
    }

    const [num_raffle, numbers] = event.args;

    await logger.info("num_raffle : " + num_raffle );
    await logger.info("numbers : " + numbers );

    let result = Result.create({
        id: `${event.blockNumber.valueOf()}-${event.blockEventIdx.valueOf()}`,
        num_raffle: num_raffle.toBigInt(),
        numbers: numbers.map(value => value.toBigInt()),
    });
    await result.save();
}


type WinnersRevealedEvent = [UInt, [AccountId]] & {
    num_raffle: UInt,
    winners: [AccountId],
}

export async function handleWinnersRevealed(event: WasmEvent<WinnersRevealedEvent>): Promise<void> {

    await logger.info("---------- Winners Revealed --------- ");

    if (!event.args) {
        await logger.warn("No Event");
        return;
    }

    const [num_raffle, winners] = event.args;

    await logger.info("num_raffle : " + num_raffle);
    await logger.info("winners : " + winners);

    for (let i=0; i<winners.length; i++){
        let result = Winner.create({
            id: `${event.blockNumber.valueOf()}-${event.blockEventIdx.valueOf()}`,
            num_raffle: num_raffle.toBigInt(),
            accountId: winners[i].toString(),
        });
        await result.save();
    }
}
