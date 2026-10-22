"""
Temporal Convolutional Network (TemporalSpendTCN) for Financial Spending Forecasting.

Dilated Causal 1D-CNN architecture following Bai, Kolter, and Koltun (2018).
Specialized for high-frequency financial sequence modeling:
1. Receptive Field Expansion: Exponentially increasing dilation factors (d=1, 2, 4, 8)
   enable capturing both daily payday-to-weekend volatility and multi-month seasonal drift.
2. Strict Temporal Causality: Chomp1d truncation guarantees zero future temporal leakage.
3. Residual Connections: Deep residual blocks stabilize training and prevent vanishing gradients.
4. Non-Negative Dollar Projection: Terminal ReLU in log-space guarantees non-negative dollar forecasts.
"""

from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class Chomp1d(nn.Module):
    """
    Truncates the right-side padding of a 1D convolution output
    to ensure strict temporal causality (prediction at time t only uses inputs <= t).
    """
    def __init__(self, chomp_size: int):
        super().__init__()
        self.chomp_size = chomp_size

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.chomp_size == 0:
            return x
        return x[:, :, :-self.chomp_size].contiguous()


class TemporalBlock(nn.Module):
    """
    Dilated Causal Convolutional Residual Block with Dropout and residual skip connection.
    """
    def __init__(
        self,
        n_inputs: int,
        n_outputs: int,
        kernel_size: int,
        stride: int,
        dilation: int,
        padding: int,
        dropout: float = 0.1
    ):
        super().__init__()
        self.conv1 = nn.Conv1d(
            n_inputs, n_outputs, kernel_size,
            stride=stride, padding=padding, dilation=dilation
        )
        self.chomp1 = Chomp1d(padding)
        self.relu1 = nn.GELU()
        self.dropout1 = nn.Dropout(dropout)

        self.conv2 = nn.Conv1d(
            n_outputs, n_outputs, kernel_size,
            stride=stride, padding=padding, dilation=dilation
        )
        self.chomp2 = Chomp1d(padding)
        self.relu2 = nn.GELU()
        self.dropout2 = nn.Dropout(dropout)

        self.downsample = nn.Conv1d(n_inputs, n_outputs, 1) if n_inputs != n_outputs else None
        self.relu = nn.GELU()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.dropout1(self.relu1(self.chomp1(self.conv1(x))))
        out = self.dropout2(self.relu2(self.chomp2(self.conv2(out))))
        res = x if self.downsample is None else self.downsample(x)
        return self.relu(out + res)


class TemporalSpendTCN(nn.Module):
    """
    Deep Dilated Temporal Convolutional Network for multi-category spending forecasting.
    Takes input tensor of shape (B, T, D) and outputs (B, C) next-period spending predictions.
    """
    def __init__(
        self,
        num_inputs: int = 10,
        num_channels: Optional[List[int]] = None,
        output_dim: int = 5,
        kernel_size: int = 3,
        dropout: float = 0.1
    ):
        super().__init__()
        if num_channels is None:
            num_channels = [16, 32, 64]

        self.num_inputs = num_inputs
        self.num_channels = num_channels
        self.output_dim = output_dim

        layers = []
        num_levels = len(num_channels)
        for i in range(num_levels):
            dilation_size = 2 ** i
            in_channels = num_inputs if i == 0 else num_channels[i - 1]
            out_channels = num_channels[i]
            padding = (kernel_size - 1) * dilation_size
            layers.append(
                TemporalBlock(
                    in_channels,
                    out_channels,
                    kernel_size=kernel_size,
                    stride=1,
                    dilation=dilation_size,
                    padding=padding,
                    dropout=dropout
                )
            )

        self.network = nn.Sequential(*layers)
        
        last_channel = num_channels[-1]
        self.projection_head = nn.Sequential(
            nn.Linear(last_channel, 32),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(32, output_dim),
            nn.ReLU()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_transposed = x.transpose(1, 2)
        y = self.network(x_transposed)
        final_step = y[:, :, -1]
        out = self.projection_head(final_step)
        return out

    def predict_dollars(self, x: torch.Tensor) -> np.ndarray:
        self.eval()
        with torch.no_grad():
            log_preds = self(x).cpu().numpy()
            dollar_preds = np.expm1(log_preds)
        return np.maximum(0.0, dollar_preds)

    @staticmethod
    def ensemble_forecast(
        lstm_predictions: np.ndarray,
        tcn_predictions: np.ndarray,
        lstm_weight: float = 0.5
    ) -> np.ndarray:
        tcn_weight = 1.0 - lstm_weight
        ensemble = (lstm_weight * lstm_predictions) + (tcn_weight * tcn_predictions)
        return np.maximum(0.0, ensemble)

    def save_checkpoint(self, path: str) -> None:
        torch.save({
            "model_state_dict": self.state_dict(),
            "num_inputs": self.num_inputs,
            "num_channels": self.num_channels,
            "output_dim": self.output_dim
        }, path)

    @classmethod
    def load_checkpoint(cls, path: str, device: str = "cpu") -> "TemporalSpendTCN":
        ckpt = torch.load(path, map_location=device, weights_only=False)
        model = cls(
            num_inputs=ckpt.get("num_inputs", 10),
            num_channels=ckpt.get("num_channels", [16, 32, 64]),
            output_dim=ckpt.get("output_dim", 5)
        )
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        return model

