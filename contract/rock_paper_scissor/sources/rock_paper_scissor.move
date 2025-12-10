module rock_paper_scissor::game {
    use std::bcs;

    const ROCK: u8 = 0;
    const PAPER: u8 = 1;
    const SCISSORS: u8 = 2;

    const RESULT_TIE: u8 = 0;
    const RESULT_PLAYER_WIN: u8 = 1;
    const RESULT_MACHINE_WIN: u8 = 2;

    const E_INVALID_MOVE: u64 = 0;

    public struct Match has key, store {
        id: UID,
        player: address,
        player_move: u8,
        machine_move: u8,
        result: u8,
    }

    fun validate_move(choice: u8) {
        assert!(choice < 3, E_INVALID_MOVE);
    }

    fun compute_result(player_move: u8, machine_move: u8): u8 {
        if (player_move == machine_move) {
            RESULT_TIE
        } else if (
            (player_move == ROCK && machine_move == SCISSORS) ||
            (player_move == PAPER && machine_move == ROCK) ||
            (player_move == SCISSORS && machine_move == PAPER)
        ) {
            RESULT_PLAYER_WIN
        } else {
            RESULT_MACHINE_WIN
        }
    }

    fun machine_choice(id: &UID): u8 {
        let seed_bytes = bcs::to_bytes(&object::uid_to_address(id));
        let first = *vector::borrow(&seed_bytes, 0);
        first % 3
    }

    #[allow(lint(self_transfer))]
    public fun play(player_move: u8, ctx: &mut tx_context::TxContext) {
        validate_move(player_move);
        let sender = tx_context::sender(ctx);
        let uid = object::new(ctx);
        let machine_move = machine_choice(&uid);
        let result = compute_result(player_move, machine_move);

        transfer::public_transfer(
            Match {
                id: uid,
                player: sender,
                player_move,
                machine_move,
                result,
            },
            sender,
        );
    }
}
