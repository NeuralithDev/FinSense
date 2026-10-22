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
try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None
    nn = None



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


class DeepContextualBanditNet(nn.Module if nn is not None else object):
    """
    Deep Neural Contextual Bandit (Reward Network) in PyTorch.
    
    Approximates the non-linear value function Q(context, arm) mapping user financial
    features (DTI, buffer runway, health score, spending velocity) to expected recommendation
    conversion reward across all personalized financial intervention arms.
    """
    def __init__(
        self,
        context_dim: int = 5,
        num_arms: int = 4,
        hidden_dim: int = 64,
        dropout: float = 0.1
    ):
        import torch
        import torch.nn as nn
        super().__init__()
        self.context_dim = context_dim
        self.num_arms = num_arms
        self.hidden_dim = hidden_dim

        self.net = nn.Sequential(
            nn.Linear(context_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.LeakyReLU(0.2),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.LayerNorm(hidden_dim // 2),
            nn.LeakyReLU(0.2),
            nn.Linear(hidden_dim // 2, num_arms)
        )

        self.loss_fn = nn.SmoothL1Loss()

    def forward(self, x: "torch.Tensor") -> "torch.Tensor":
        """
        Forward pass producing predicted rewards across all arms for given contexts.
        """
        return self.net(x)

    def select_arm(
        self,
        context: np.ndarray,
        epsilon: float = 0.05
    ) -> Tuple[int, np.ndarray]:
        """
        Infers expected arm rewards with epsilon-greedy exploration.
        """
        import torch
        self.eval()
        with torch.no_grad():
            x = torch.tensor(context, dtype=torch.float32).unsqueeze(0)
            scores = self(x).squeeze(0).cpu().numpy()

        if np.random.random() < epsilon:
            best_arm = int(np.random.randint(self.num_arms))
        else:
            best_arm = int(np.argmax(scores))

        return best_arm, scores

    def rank_arms(self, context: np.ndarray) -> List[int]:
        """
        Ranks arms by descending predicted reward value.
        """
        _, scores = self.select_arm(context, epsilon=0.0)
        return list(np.argsort(-scores))

    def train_step(
        self,
        context: np.ndarray,
        arm: int,
        reward: float,
        optimizer: Any
    ) -> float:
        """
        Online gradient descent update step for selected arm reward.
        """
        import torch
        self.train()
        x = torch.tensor(context, dtype=torch.float32).unsqueeze(0)
        y_target = self(x).detach().clone()
        y_target[0, arm] = reward

        optimizer.zero_grad()
        preds = self(x)
        loss = self.loss_fn(preds, y_target)
        loss.backward()
        optimizer.step()
        return float(loss.item())

    def save_checkpoint(self, path: str) -> None:
        import torch
        torch.save({
            "model_state_dict": self.state_dict(),
            "context_dim": self.context_dim,
            "num_arms": self.num_arms,
            "hidden_dim": self.hidden_dim
        }, path)

    @classmethod
    def load_checkpoint(cls, path: str, device: str = "cpu") -> "DeepContextualBanditNet":
        import torch
        ckpt = torch.load(path, map_location=device, weights_only=False)
        model = cls(
            context_dim=ckpt.get("context_dim", 5),
            num_arms=ckpt.get("num_arms", 4),
            hidden_dim=ckpt.get("hidden_dim", 64)
        )
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        return model

