"""
Procurement collusion detection — synthetic data generator + detectors.

Generates a fake-but-realistic tender market with a few PLANTED cartels
(ground truth known), then runs three detectors + a peer-grouped price
check, combines them into a priority score, ranks cases, and reports
precision@K against the planted ground truth.

This is a demo-day prototype: readable over optimized, everything in
one file, no external DB. Swap the generator for a real OCDS loader
later without touching the detectors.
"""

import random
import itertools
import numpy as np
import pandas as pd
import networkx as nx

random.seed(7)
np.random.seed(7)

# ---------------------------------------------------------------------------
# 1. SYNTHETIC MARKET GENERATION
# ---------------------------------------------------------------------------

CATEGORIES = ["road_construction", "medical_equipment", "it_services",
              "office_supplies", "sanitation"]

N_VENDORS = 60
N_TENDERS = 400
N_CARTELS = 3           # number of planted collusive rings
CARTEL_SIZE = 4          # vendors per ring

def make_vendors(n):
    vendors = []
    for i in range(n):
        vendors.append({
            "vendor_id": f"V{i:03d}",
            "category": random.choice(CATEGORIES),
            "director_id": f"D{i:03d}",       # unique by default
            "reg_year": random.randint(2005, 2024),
        })
    return pd.DataFrame(vendors)

def plant_cartels(vendors_df):
    """Pick N_CARTELS groups of same-category vendors, link them via a
    shared director (simulating shell-company overlap), and mark them."""
    cartels = []
    vendors_df["cartel_id"] = None
    for cid in range(N_CARTELS):
        cat = CATEGORIES[cid % len(CATEGORIES)]
        pool = vendors_df[vendors_df.category == cat].vendor_id.tolist()
        ring = random.sample(pool, CARTEL_SIZE)
        cartels.append(ring)
        vendors_df.loc[vendors_df.vendor_id.isin(ring), "cartel_id"] = cid
        # two of the four secretly share a director (shell linkage signal)
        shared_dir = f"SHARED_D{cid}"
        for v in ring[:2]:
            vendors_df.loc[vendors_df.vendor_id == v, "director_id"] = shared_dir
    return vendors_df, cartels

def generate_tenders_and_bids(vendors_df, cartels):
    tenders, bids = [], []
    cartel_lookup = {cid: ring for cid, ring in enumerate(cartels)}

    for t in range(N_TENDERS):
        cat = random.choice(CATEGORIES)
        base_value = float(np.random.lognormal(mean=15.5, sigma=0.6))  # ~ INR
        buyer_id = f"B{random.randint(0, 14):02d}"
        tender_id = f"T{t:04d}"

        # is this tender "captured" by a cartel? (only if enough ring
        # members operate in this category — else it's a normal market)
        rigged_by = None
        for cid, ring in cartel_lookup.items():
            ring_cat = vendors_df[vendors_df.vendor_id.isin(ring)].category.iloc[0]
            if ring_cat == cat and random.random() < 0.55:
                rigged_by = cid
                break

        eligible = vendors_df[vendors_df.category == cat].vendor_id.tolist()
        n_bidders = random.randint(3, 6)
        bidders = random.sample(eligible, min(n_bidders, len(eligible)))

        if rigged_by is not None:
            ring = cartel_lookup[rigged_by]
            # ensure at least 2 ring members are in the bidder pool
            ring_present = [v for v in ring if v in eligible]
            for v in random.sample(ring_present, min(2, len(ring_present))):
                if v not in bidders:
                    bidders[random.randrange(len(bidders))] = v

            winner = random.choice([v for v in bidders if v in ring] or bidders)
            for v in bidders:
                if v == winner:
                    price = base_value * np.random.uniform(0.97, 1.02)
                elif v in ring:
                    # cover bid: tight cluster just above winner
                    price = base_value * np.random.uniform(1.02, 1.05)
                else:
                    # outsider, unaware of the rig, bids normally (wider spread)
                    price = base_value * np.random.uniform(0.90, 1.15)
                bids.append({"tender_id": tender_id, "vendor_id": v, "price": price})
        else:
            winner = None
            best_price = None
            for v in bidders:
                price = base_value * np.random.uniform(0.85, 1.20)
                bids.append({"tender_id": tender_id, "vendor_id": v, "price": price})
                if best_price is None or price < best_price:
                    best_price, winner = price, v

        tenders.append({
            "tender_id": tender_id, "category": cat, "buyer_id": buyer_id,
            "est_value": base_value, "rigged_by_cartel": rigged_by,
        })

    tenders_df = pd.DataFrame(tenders)
    bids_df = pd.DataFrame(bids)

    # compute winner (lowest bid) per tender
    winners = bids_df.loc[bids_df.groupby("tender_id").price.idxmin()]
    winners = winners.rename(columns={"vendor_id": "winner_id", "price": "award_price"})
    tenders_df = tenders_df.merge(winners[["tender_id", "winner_id", "award_price"]],
                                   on="tender_id")
    return tenders_df, bids_df


# ---------------------------------------------------------------------------
# 2. DETECTORS
# ---------------------------------------------------------------------------

def detect_cover_bidding(tenders_df, bids_df):
    """Losers clustered tightly just above the winner => cover bidding."""
    scores = {}
    for tid, group in bids_df.groupby("tender_id"):
        if len(group) < 3:
            continue
        prices = group.sort_values("price").price.values
        winner_price = prices[0]
        losers = prices[1:]
        margins = (losers - winner_price) / winner_price
        # tight AND close => low std, low mean margin
        tightness = 1 - min(margins.std() / (margins.mean() + 1e-6), 1)
        closeness = 1 - min(margins.mean() / 0.10, 1)   # <10% margin is suspicious
        scores[tid] = max(0.0, (tightness + closeness) / 2)
    return scores

def detect_bid_rotation(tenders_df):
    """For vendor pairs that co-bid often, check if wins alternate more
    evenly than random chance would predict."""
    pair_wins = {}
    pair_cobids = {}
    for cat, group in tenders_df.groupby("category"):
        winners = group.winner_id.tolist()
        for a, b in itertools.combinations(set(winners), 2):
            pass  # placeholder, real co-bid pairs computed below via bids

    # build co-bid participation from bids table is more accurate; here we
    # approximate using winner alternation frequency within a category+buyer
    scores = {}
    for (cat, buyer), group in tenders_df.groupby(["category", "buyer_id"]):
        if len(group) < 3:
            continue
        winners = group.sort_values("tender_id").winner_id.tolist()
        distinct = set(winners)
        if len(distinct) < 2 or len(distinct) > 4:
            continue
        # measure alternation: fraction of consecutive tenders with a
        # different winner drawn from the same small pool
        alternations = sum(1 for i in range(1, len(winners))
                            if winners[i] != winners[i-1])
        rotation_score = alternations / (len(winners) - 1)
        # only flag if the SAME small pool repeats (closed group), not
        # just "different winner each time" across a big open market
        pool_score = 1 - (len(distinct) / len(winners))
        s = rotation_score * pool_score
        for tid in group.tender_id:
            scores[tid] = max(scores.get(tid, 0), s)
    return scores

def detect_shell_linkage(vendors_df, tenders_df, bids_df):
    """Graph-based: competing bidders on the same tender who share a
    director_id (or other resolved identity attribute)."""
    dir_map = vendors_df.set_index("vendor_id").director_id.to_dict()
    scores = {}
    for tid, group in bids_df.groupby("tender_id"):
        vids = group.vendor_id.tolist()
        dirs = [dir_map[v] for v in vids]
        shared = len(dirs) - len(set(dirs))
        scores[tid] = min(shared / 2.0, 1.0)   # 2+ shared-director pairs -> max
    return scores

def peer_price_deviation(tenders_df):
    """Award price z-score vs category peer group (robust, median/MAD)."""
    scores = {}
    for cat, group in tenders_df.groupby("category"):
        med = group.award_price.median()
        mad = (group.award_price - med).abs().median() + 1e-6
        z = ((group.award_price - med) / (1.4826 * mad)).abs()
        for tid, val in zip(group.tender_id, z):
            scores[tid] = min(val / 4.0, 1.0)   # cap at |z|=4
    return scores


# ---------------------------------------------------------------------------
# 3. COMBINE INTO PRIORITY SCORE
# ---------------------------------------------------------------------------

def build_priority_table(tenders_df, bids_df, vendors_df):
    cover = detect_cover_bidding(tenders_df, bids_df)
    rotation = detect_bid_rotation(tenders_df)
    linkage = detect_shell_linkage(vendors_df, tenders_df, bids_df)
    price_dev = peer_price_deviation(tenders_df)

    rows = []
    for tid in tenders_df.tender_id:
        c = cover.get(tid, 0.0)
        r = rotation.get(tid, 0.0)
        l = linkage.get(tid, 0.0)
        p = price_dev.get(tid, 0.0)
        signals = [c, r, l, p]
        n_fired = sum(1 for s in signals if s > 0.3)
        corroboration = n_fired / len(signals)
        # materiality: normalize award value within its category
        rows.append({
            "tender_id": tid, "cover_bidding": c, "bid_rotation": r,
            "shell_linkage": l, "price_deviation": p,
            "signals_fired": n_fired, "corroboration": corroboration,
        })
    df = pd.DataFrame(rows).merge(tenders_df, on="tender_id")

    mat = (df.est_value - df.est_value.min()) / (df.est_value.max() - df.est_value.min() + 1e-6)
    raw_signal = df[["cover_bidding", "bid_rotation", "shell_linkage", "price_deviation"]].mean(axis=1)
    df["priority"] = raw_signal * (0.5 + 0.5 * df.corroboration) * (0.5 + 0.5 * mat)
    return df.sort_values("priority", ascending=False).reset_index(drop=True)


def precision_at_k(ranked_df, k=20):
    top_k = ranked_df.head(k)
    hits = (top_k.rigged_by_cartel.notna()).sum()
    total_rigged = ranked_df.rigged_by_cartel.notna().sum()
    return {
        "k": k,
        "precision_at_k": hits / k,
        "recall_at_k": hits / total_rigged if total_rigged else 0,
        "total_rigged_in_dataset": int(total_rigged),
        "hits_in_top_k": int(hits),
    }


# ---------------------------------------------------------------------------
# 4. RUN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    vendors_df = make_vendors(N_VENDORS)
    vendors_df, cartels = plant_cartels(vendors_df)
    tenders_df, bids_df = generate_tenders_and_bids(vendors_df, cartels)

    ranked = build_priority_table(tenders_df, bids_df, vendors_df)

    print("=== TOP 15 PRIORITY CASES ===")
    print(ranked[["tender_id", "category", "priority", "signals_fired",
                   "rigged_by_cartel", "est_value"]].head(15).to_string(index=False))

    print("\n=== PRECISION @ K ===")
    for k in (10, 20, 40):
        print(precision_at_k(ranked, k))

    print(f"\nPlanted cartels: {N_CARTELS}, total rigged tenders in dataset: "
          f"{tenders_df.rigged_by_cartel.notna().sum()} / {N_TENDERS}")



    ranked.to_csv("ranked_cases.csv", index=False)
    tenders_df.to_csv("tenders.csv", index=False)
    bids_df.to_csv("bids.csv", index=False)
    vendors_df.to_csv("vendors.csv", index=False)
    print("\nSaved: ranked_cases.csv, tenders.csv, bids.csv, vendors.csv in the current folder!")
