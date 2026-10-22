"""
Deep Residual Multi-Layer Perceptron (DeepPersonaMLP) for Behavioral Financial Persona
and Overdraft Risk Classification.

Maps continuous multi-pillar financial ratios (solvency, leverage, liquidity runway,
volatility, shock multipliers, spending velocity) into:
1. Soft probability distribution over the 6 Behavioral Money Personas:
   - ASSET_RICH_STEADY: High buffer, low leverage, steady positive cash-flow.
   - CASH_FLOW_CONSTRAINED: Low buffer, paycheck-to-paycheck, vulnerable to minor shocks.
   - HIGH_EARNER_HIGH_BURN: High income matched by high discretionary velocity.
   - DIGITAL_IMPULSE_SPENDER: Frequent micro-transactions, elevated late-night/e-comm velocity.
   - DISCIPLINED_SAVER: High savings rate, strategic spending caps, long runway.
   - BALANCED_MODERATE: Sustainable medium ratios, predictable routine expenses.
2. 4 Overdraft Risk Tiers:
   - LOW (Safe buffer >= 3 months)
   - MODERATE (Buffer 1-3 months)
   - ELEVATED (Buffer < 1 month, irregular income)
   - CRITICAL (Negative cash-flow trend, chronic depletion risk)
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

PERSONA_LABELS = [
    "ASSET_RICH_STEADY",
    "CASH_FLOW_CONSTRAINED",
    "HIGH_EARNER_HIGH_BURN",
    "DIGITAL_IMPULSE_SPENDER",
    "DISCIPLINED_SAVER",
    "BALANCED_MODERATE"
]

RISK_TIERS = [
    "LOW",
    "MODERATE",
    "ELEVATED",
    "CRITICAL"
]


class ResidualDenseBlock(nn.Module):
    """
    Residual Dense Block with Pre-Layer Normalization, LeakyReLU, and Dropout.
    """
    def __init__(self, hidden_dim: int, dropout: float = 0.15):
        super().__init__()
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.fc1 = nn.Linear(hidden_dim, hidden_dim)
        self.act1 = nn.LeakyReLU(0.2)
        self.dropout1 = nn.Dropout(dropout)

        self.norm2 = nn.LayerNorm(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.act2 = nn.LeakyReLU(0.2)
        self.dropout2 = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.norm1(x)
        out = self.fc1(out)
        out = self.act1(out)
        out = self.dropout1(out)

        out = self.norm2(out)
        out = self.fc2(out)
        out = self.act2(out)
        out = self.dropout2(out)

        return residual + out


class DeepPersonaMLP(nn.Module):
    """
    Deep Residual MLP with dual prediction heads for persona and overdraft risk.
    """
    def __init__(
        self,
        input_dim: int = 12,
        hidden_dim: int = 64,
        num_personas: int = 6,
        num_risk_tiers: int = 4,
        num_blocks: int = 2,
        dropout: float = 0.15
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_personas = num_personas
        self.num_risk_tiers = num_risk_tiers

        # Input Projection Layer
        self.input_layer = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.LeakyReLU(0.2),
            nn.Dropout(dropout)
        )

        # Residual Feature Extraction Backbone
        self.blocks = nn.ModuleList([
            ResidualDenseBlock(hidden_dim, dropout=dropout)
            for _ in range(num_blocks)
        ])

        # Dual Task Heads
        self.persona_head = nn.Sequential(
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, 32),
            nn.LeakyReLU(0.2),
            nn.Linear(32, num_personas)
        )

        self.risk_head = nn.Sequential(
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, 32),
            nn.LeakyReLU(0.2),
            nn.Linear(32, num_risk_tiers)
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass yielding raw logits for (persona_logits, risk_logits).
        """
        h = self.input_layer(x)
        for block in self.blocks:
            h = block(h)

        persona_logits = self.persona_head(h)
        risk_logits = self.risk_head(h)
        return persona_logits, risk_logits

    def predict_probabilities(
        self,
        x: torch.Tensor
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Infers soft probability distributions over personas and risk tiers.
        """
        self.eval()
        with torch.no_grad():
            persona_logits, risk_logits = self(x)
            persona_probs = F.softmax(persona_logits, dim=-1).cpu().numpy()
            risk_probs = F.softmax(risk_logits, dim=-1).cpu().numpy()
        return persona_probs, risk_probs

    def classify_profile(
        self,
        feature_vector: np.ndarray
    ) -> Dict[str, Any]:
        """
        Full diagnostic wrapper returning top predicted persona, confidence score,
        all persona distribution probabilities, and overdraft risk level.
        """
        x_tensor = torch.tensor(feature_vector, dtype=torch.float32).unsqueeze(0)
        persona_probs, risk_probs = self.predict_probabilities(x_tensor)

        p_probs = persona_probs[0]
        r_probs = risk_probs[0]

        top_persona_idx = int(np.argmax(p_probs))
        top_risk_idx = int(np.argmax(r_probs))

        distribution = {
            PERSONA_LABELS[i]: round(float(p_probs[i]), 4)
            for i in range(len(PERSONA_LABELS))
        }

        risk_distribution = {
            RISK_TIERS[i]: round(float(r_probs[i]), 4)
            for i in range(len(RISK_TIERS))
        }

        return {
            "predicted_persona": PERSONA_LABELS[top_persona_idx],
            "persona_confidence": round(float(p_probs[top_persona_idx]), 4),
            "predicted_risk_tier": RISK_TIERS[top_risk_idx],
            "risk_confidence": round(float(r_probs[top_risk_idx]), 4),
            "persona_distribution": distribution,
            "risk_distribution": risk_distribution
        }

    def save_checkpoint(self, path: str) -> None:
        torch.save({
            "model_state_dict": self.state_dict(),
            "input_dim": self.input_dim,
            "hidden_dim": self.hidden_dim,
            "num_personas": self.num_personas,
            "num_risk_tiers": self.num_risk_tiers
        }, path)

    @classmethod
    def load_checkpoint(cls, path: str, device: str = "cpu") -> "DeepPersonaMLP":
        ckpt = torch.load(path, map_location=device, weights_only=False)
        model = cls(
            input_dim=ckpt.get("input_dim", 12),
            hidden_dim=ckpt.get("hidden_dim", 64),
            num_personas=ckpt.get("num_personas", 6),
            num_risk_tiers=ckpt.get("num_risk_tiers", 4)
        )
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        return model
