#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

const COUNTER: Symbol = symbol_short!("counter");

#[derive(Clone, Debug)]
#[contracttype]
pub enum DataKey {
    Split(u64),
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct Split {
    pub id: u64,
    pub creator: Address,
    pub total: i128,
    pub participants: Vec<Address>,
    pub amounts: Vec<i128>,
    pub settled: bool,
}

#[contract]
pub struct SplitContract;

#[contractimpl]
impl SplitContract {
    pub fn create_split(
        env: Env,
        creator: Address,
        participants: Vec<Address>,
        amounts: Vec<i128>,
    ) -> u64 {
        creator.require_auth();
        if participants.len() != amounts.len() {
            panic!("participants and amounts length mismatch");
        }
        if participants.is_empty() {
            panic!("at least one participant required");
        }

        let mut total: i128 = 0;
        for amount in amounts.iter() {
            if amount <= 0 {
                panic!("amounts must be positive");
            }
            total += amount;
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&COUNTER)
            .unwrap_or(0)
            + 1;

        let split = Split {
            id,
            creator: creator.clone(),
            total,
            participants: participants.clone(),
            amounts: amounts.clone(),
            settled: false,
        };

        env.storage().instance().set(&DataKey::Split(id), &split);
        env.storage().instance().set(&COUNTER, &id);

        env.events()
            .publish((symbol_short!("SplitCreated"), id), ());
        id
    }

    pub fn get_split(env: Env, id: u64) -> Split {
        env.storage()
            .instance()
            .get(&DataKey::Split(id))
            .unwrap_or_else(|| panic!("split not found"))
    }

    pub fn settle_split(env: Env, caller: Address, id: u64) {
        caller.require_auth();
        let mut split: Split = env
            .storage()
            .instance()
            .get(&DataKey::Split(id))
            .unwrap_or_else(|| panic!("split not found"));

        let mut is_participant = false;
        for p in split.participants.iter() {
            if p == caller {
                is_participant = true;
            }
        }
        if !is_participant {
            panic!("caller is not a participant");
        }

        split.settled = true;
        env.storage()
            .instance()
            .set(&DataKey::Split(id), &split);

        env.events()
            .publish((symbol_short!("SplitSettled"), id), ());
    }
}
