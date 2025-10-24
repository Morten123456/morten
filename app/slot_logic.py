import json
import random
import time
import uuid
from typing import Dict, List, Tuple

SYMBOL_WEIGHTS = {
    "cherry": 35,
    "lemon": 30,
    "bar": 20,
    "seven": 10,
    "diamond": 5,
}

TIERS = {
    ("diamond", "diamond", "diamond"): "grand",
    ("seven", "seven", "seven"): "large",
    ("bar", "bar", "bar"): "medium",
    ("lemon", "lemon", "lemon"): "small",
    ("cherry", "cherry", "cherry"): "micro",
}


def generate_seed() -> str:
    return f"{time.time_ns()}-{uuid.uuid4()}"


def weighted_choice(symbols_with_weights: Dict[str, int]) -> str:
    symbols = list(symbols_with_weights.keys())
    weights = list(symbols_with_weights.values())
    return random.choices(symbols, weights=weights, k=1)[0]


def spin_reels() -> Tuple[List[List[str]], str, bool, str]:
    """
    Returns (grid, seed, is_win, tier)
    grid: 3x3 list, where grid[row][col]
    """
    seed = generate_seed()
    random.seed(seed)

    # Build 3x3 grid (rows x cols)
    grid: List[List[str]] = [["", "", ""] for _ in range(3)]
    for col in range(3):
        # Each column shows 3 symbols; middle row determines the result
        col_symbols = [weighted_choice(SYMBOL_WEIGHTS) for _ in range(3)]
        for row in range(3):
            grid[row][col] = col_symbols[row]

    midline = (grid[1][0], grid[1][1], grid[1][2])
    tier = TIERS.get(midline, "none")
    is_win = tier != "none"
    return grid, seed, is_win, tier


def grid_to_json(grid: List[List[str]]) -> str:
    return json.dumps(grid)
