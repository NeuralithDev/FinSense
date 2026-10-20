"""
Unit tests for Contextual Bandit algorithms (LinUCB, Thompson Sampling, Epsilon Greedy).
"""

import numpy as np
from src.models.contextual_bandit import LinUCB, ContextualThompsonSampling, EpsilonGreedyContextualBandit


def test_linucb_learning_convergence():
    np.random.seed(42)
    num_arms = 4
    context_dim = 5
    bandit = LinUCB(num_arms=num_arms, context_dim=context_dim, alpha=0.5)

    # Arm 2 is the true optimal arm with weight [1, 1, 1, 1, 1]
    # Other arms have weights [0, 0, 0, 0, 0]
    true_weights = np.zeros((num_arms, context_dim))
    true_weights[2] = 1.0

    chosen_arms = []
    for step in range(100):
        context = np.random.uniform(0.5, 1.0, context_dim)
        arm, scores = bandit.select_arm(context)
        chosen_arms.append(arm)

        # Reward with slight noise
        expected_reward = np.dot(true_weights[arm], context)
        reward = 1.0 if expected_reward > 2.0 else 0.1
        bandit.update(arm, context, reward)

    # In the last 30 steps, optimal arm 2 should be selected most often
    last_30 = chosen_arms[-30:]
    arm_2_count = last_30.count(2)
    assert arm_2_count >= 15, f"Expected arm 2 to dominate, got {arm_2_count}/30"


def test_thompson_sampling_selection_and_ranking():
    np.random.seed(42)
    bandit = ContextualThompsonSampling(num_arms=3, context_dim=4, v=0.3)
    context = np.array([1.0, 0.5, 0.2, 0.8])

    arm, rewards = bandit.select_arm(context)
    assert 0 <= arm < 3
    assert len(rewards) == 3

    # Update
    bandit.update(arm, context, reward=1.0)


def test_epsilon_greedy_selection():
    bandit = EpsilonGreedyContextualBandit(num_arms=3, context_dim=4, epsilon=0.2)
    context = np.array([0.5, 0.5, 0.5, 0.5])
    arm, rewards = bandit.select_arm(context)
    assert 0 <= arm < 3
    bandit.update(arm, context, reward=0.8)


if __name__ == "__main__":
    test_linucb_learning_convergence()
    test_thompson_sampling_selection_and_ranking()
    test_epsilon_greedy_selection()
    print("ALL CONTEXTUAL BANDIT TESTS PASSED!")
