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
    from src.models.contextual_bandit import EpsilonGreedyContextualBandit
    bandit = EpsilonGreedyContextualBandit(num_arms=3, context_dim=4, epsilon=0.2)
    context = np.array([0.5, 0.5, 0.5, 0.5])
    arm, rewards = bandit.select_arm(context)
    assert 0 <= arm < 3
    bandit.update(arm, context, reward=0.8)


def test_deep_contextual_bandit_net():
    from src.models.contextual_bandit import DeepContextualBanditNet
    import torch
    
    num_arms = 4
    context_dim = 5
    bnet = DeepContextualBanditNet(context_dim=context_dim, num_arms=num_arms, hidden_dim=32)
    
    context = np.array([0.5, 0.2, 0.8, 0.1, 0.4])
    arm, scores = bnet.select_arm(context, epsilon=0.0)
    assert 0 <= arm < num_arms
    assert len(scores) == num_arms
    
    ranked = bnet.rank_arms(context)
    assert len(ranked) == num_arms
    assert set(ranked) == set(range(num_arms))
    
    optimizer = torch.optim.Adam(bnet.parameters(), lr=0.01)
    loss = bnet.train_step(context, arm=1, reward=1.0, optimizer=optimizer)
    assert isinstance(loss, float)


if __name__ == "__main__":
    test_linucb_learning_convergence()
    test_thompson_sampling_selection_and_ranking()
    test_epsilon_greedy_selection()
    test_deep_contextual_bandit_net()
    print("ALL CONTEXTUAL BANDIT TESTS PASSED!")

