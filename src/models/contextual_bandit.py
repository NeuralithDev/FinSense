"""
Contextual Multi-Armed Bandit for Personalized Financial Recommendation Ranking.

Addresses the exploration vs. exploitation trade-off in personal finance intelligence:
Instead of static hardcoded recommendations (like Rocket Money / Mint), FinSense dynamically
personalizes and ranks action items based on the user's real-time financial context vector
and learns from user feedback (action adoption, completion, savings accrued).

Algorithms implemented:
1. LinUCB (Disjoint Linear Upper Confidence Bound): Upper confidence bound via ridge regression.
2. ContextualThompsonSampling: Bayesian posterior parameter sampling for exploration.
3. EpsilonGreedyContextualBandit: Exploration-exploitation baseline.
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np


class LinUCB:
    r"""
    LinUCB with Disjoint Linear Models.
    Each arm maintains its own ridge regression parameter estimate and covariance matrix.
    
    Formula:
        p_{t,a} = x_t^T \hat{\theta}_a + \alpha \sqrt{x_t^T A_a^{-1} x_t}
        where \hat{\theta}_a = A_a^{-1} b_a
    """
    def __init__(self, num_arms: int, context_dim: int, alpha: float = 1.0):
        self.num_arms = num_arms
        self.context_dim = context_dim
        self.alpha = alpha

        # A_a: (d, d) identity matrix per arm
        self.A = [np.identity(context_dim, dtype=np.float64) for _ in range(num_arms)]
        # b_a: (d, 1) vector per arm
        self.b = [np.zeros((context_dim, 1), dtype=np.float64) for _ in range(num_arms)]

    def select_arm(self, context: np.ndarray) -> Tuple[int, np.ndarray]:
        """
        Calculates UCB for each arm and selects the arm with highest potential reward.
        
        Args:
            context: 1D array of shape (context_dim,)
            
        Returns:
            best_arm: index of chosen arm
            p_scores: predicted UCB values across all arms
        """
        x = np.asarray(context, dtype=np.float64).reshape(-1, 1)
        p_scores = np.zeros(self.num_arms)

        for a in range(self.num_arms):
            A_inv = np.linalg.pinv(self.A[a])
            theta_a = A_inv @ self.b[a]
            # Mean reward estimate + exploration bonus
            mean_reward = float(theta_a.T @ x)
            confidence_interval = float(self.alpha * np.sqrt(x.T @ A_inv @ x))
            p_scores[a] = mean_reward + confidence_interval

        best_arm = int(np.argmax(p_scores))
        return best_arm, p_scores

    def update(self, arm: int, context: np.ndarray, reward: float) -> None:
        """
        Updates the covariance matrix A and reward vector b for the selected arm.
        """
        x = np.asarray(context, dtype=np.float64).reshape(-1, 1)
        self.A[arm] += x @ x.T
        self.b[arm] += reward * x

    def rank_arms(self, context: np.ndarray) -> List[int]:
        """
        Returns full list of arm indices sorted from highest to lowest UCB score.
        """
        _, scores = self.select_arm(context)
        return list(np.argsort(-scores))


class ContextualThompsonSampling:
    r"""
    Contextual Thompson Sampling for multi-armed bandit recommendation.
    Samples model parameters from the Gaussian posterior distribution:
    \theta_a \sim \mathcal{N}(\hat{\theta}_a, v^2 A_a^{-1})
    """
    def __init__(self, num_arms: int, context_dim: int, v: float = 0.5):
        self.num_arms = num_arms
        self.context_dim = context_dim
        self.v = v  # Exploration scale parameter

        self.B = [np.identity(context_dim, dtype=np.float64) for _ in range(num_arms)]
        self.mu_hat = [np.zeros((context_dim, 1), dtype=np.float64) for _ in range(num_arms)]
        self.f = [np.zeros((context_dim, 1), dtype=np.float64) for _ in range(num_arms)]

    def select_arm(self, context: np.ndarray) -> Tuple[int, np.ndarray]:
        x = np.asarray(context, dtype=np.float64).reshape(-1, 1)
        sampled_rewards = np.zeros(self.num_arms)

        for a in range(self.num_arms):
            B_inv = np.linalg.pinv(self.B[a])
            # Draw sample from posterior N(mu_hat, v^2 * B_inv)
            sample_theta = np.random.multivariate_normal(
                mean=self.mu_hat[a].flatten(),
                cov=(self.v ** 2) * B_inv
            ).reshape(-1, 1)
            sampled_rewards[a] = float(x.T @ sample_theta)

        best_arm = int(np.argmax(sampled_rewards))
        return best_arm, sampled_rewards

    def update(self, arm: int, context: np.ndarray, reward: float) -> None:
        x = np.asarray(context, dtype=np.float64).reshape(-1, 1)
        self.B[arm] += x @ x.T
        self.f[arm] += reward * x
        self.mu_hat[arm] = np.linalg.pinv(self.B[arm]) @ self.f[arm]


class EpsilonGreedyContextualBandit:
    """
    Epsilon-Greedy Contextual Bandit Baseline.
    With probability (1 - epsilon) picks arm with highest estimated linear reward;
    with probability epsilon picks uniformly at random to explore.
    """
    def __init__(self, num_arms: int, context_dim: int, epsilon: float = 0.1):
        self.num_arms = num_arms
        self.context_dim = context_dim
        self.epsilon = epsilon

        self.A = [np.identity(context_dim, dtype=np.float64) for _ in range(num_arms)]
        self.b = [np.zeros((context_dim, 1), dtype=np.float64) for _ in range(num_arms)]

    def select_arm(self, context: np.ndarray) -> Tuple[int, np.ndarray]:
        x = np.asarray(context, dtype=np.float64).reshape(-1, 1)
        predicted_rewards = np.zeros(self.num_arms)

        for a in range(self.num_arms):
            A_inv = np.linalg.pinv(self.A[a])
            theta_a = A_inv @ self.b[a]
            predicted_rewards[a] = float(theta_a.T @ x)

        if np.random.random() < self.epsilon:
            best_arm = int(np.random.randint(self.num_arms))
        else:
            best_arm = int(np.argmax(predicted_rewards))

        return best_arm, predicted_rewards

    def update(self, arm: int, context: np.ndarray, reward: float) -> None:
        x = np.asarray(context, dtype=np.float64).reshape(-1, 1)
        self.A[arm] += x @ x.T
        self.b[arm] += reward * x
