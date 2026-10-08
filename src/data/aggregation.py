import pandas as pd


def aggregate_ibm_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
    """
    Create partial user-level aggregates from one IBM transaction chunk.
    """

    result = (
        chunk
        .groupby("User")
        .agg(
            total_spending=("Amount", "sum"),
            transaction_count=("Amount", "count"),
        )
        .reset_index()
    )

    return result

def combine_ibm_aggregates(partial_results: list[pd.DataFrame]) -> pd.DataFrame:
    
    combined = pd.concat(partial_results, ignore_index = True)
    
    result = (combined.groupby("User").agg(total_spending = ("total_spending","sum"), transaction_count = ("transaction_count","sum")).reset_index())
    result["average_transaction"] = (
        result["total_spending"] /
        result["transaction_count"]
    )

    return result