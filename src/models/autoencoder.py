"""
Deep Autoencoder for Financial Spending Anomaly Detection.

Architecture:
- Input Dimension: D (e.g., 19 financial and behavioral features)
- Encoder: Compresses features through hidden layers down to a low-dimensional bottleneck (Latent Dimension K).
- Bottleneck: Forces the network to learn the fundamental manifold of normal spending behavior.
- Decoder: Reconstructs the original D features from the latent embedding.
- Anomaly Criterion: Reconstruction Error (Mean Squared Error). Unseen or erratic spending
  cannot be accurately reconstructed by the network, resulting in high reconstruction loss.
"""

from typing import Tuple, Optional, Dict, Any
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


class FinancialAutoencoder(nn.Module):
    """
    PyTorch Deep Autoencoder for continuous financial anomaly scoring.
    """
    def __init__(
        self,
        input_dim: int = 19,
        hidden_dim: int = 12,
        latent_dim: int = 6,
        dropout_rate: float = 0.1
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.latent_dim = latent_dim
        self.anomaly_threshold: Optional[float] = None

        # ---------------------------------------------------------------------
        # Encoder: D -> Hidden -> Latent
        # ---------------------------------------------------------------------
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.LeakyReLU(negative_slope=0.2),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_dim, latent_dim),
            nn.LeakyReLU(negative_slope=0.2)
        )

        # ---------------------------------------------------------------------
        # Decoder: Latent -> Hidden -> D
        # ---------------------------------------------------------------------
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.LeakyReLU(negative_slope=0.2),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_dim, input_dim)
        )

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """Extract low-dimensional latent embeddings."""
        return self.encoder(x)

    def decode(self, z: torch.Tensor) -> torch.Tensor:
        """Reconstruct original features from latent code."""
        return self.decoder(z)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass: Encode -> Decode."""
        z = self.encode(x)
        return self.decode(z)

    def compute_reconstruction_error(self, x: torch.Tensor) -> torch.Tensor:
        """
        Computes per-sample Mean Squared Error (MSE) across all feature dimensions.
        Returns 1D tensor of shape (N,) containing reconstruction error per user.
        """
        self.eval()
        with torch.no_grad():
            reconstructed = self(x)
            # MSE per sample across features (dim=1)
            errors = torch.mean((x - reconstructed) ** 2, dim=1)
        return errors

    def calibrate_threshold(
        self,
        validation_tensor: torch.Tensor,
        percentile: float = 95.0
    ) -> float:
        """
        Calibrates the anomaly cutoff dynamically using validation set errors.
        In standard financial anomaly detection, the 95th or 97.5th percentile
        of normal reconstruction loss defines the outlier boundary.
        """
        errors = self.compute_reconstruction_error(validation_tensor).cpu().numpy()
        self.anomaly_threshold = float(np.percentile(errors, percentile))
        return self.anomaly_threshold

    def predict_anomalies(
        self,
        x: torch.Tensor,
        threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Evaluates input tensors against the anomaly threshold.
        Returns:
            is_anomaly: Boolean numpy array where True indicates anomalous spending
            errors: Float numpy array of raw reconstruction errors
        """
        cutoff = threshold if threshold is not None else self.anomaly_threshold
        if cutoff is None:
            raise ValueError("Anomaly threshold is not set. Call calibrate_threshold() or supply a threshold.")

        errors = self.compute_reconstruction_error(x).cpu().numpy()
        is_anomaly = errors > cutoff
        return is_anomaly, errors

    def save_model(self, file_path: str) -> None:
        """Saves model weights and calibrated threshold."""
        payload = {
            'state_dict': self.state_dict(),
            'input_dim': self.input_dim,
            'hidden_dim': self.hidden_dim,
            'latent_dim': self.latent_dim,
            'anomaly_threshold': self.anomaly_threshold
        }
        torch.save(payload, file_path)

    @classmethod
    def load_model(cls, file_path: str, map_location: str = 'cpu') -> "FinancialAutoencoder":
        """Factory method to load checkpoint directly for inference."""
        checkpoint = torch.load(file_path, map_location=torch.device(map_location))
        model = cls(
            input_dim=checkpoint['input_dim'],
            hidden_dim=checkpoint['hidden_dim'],
            latent_dim=checkpoint['latent_dim']
        )
        model.load_state_dict(checkpoint['state_dict'])
        model.anomaly_threshold = checkpoint.get('anomaly_threshold')
        model.eval()
        return model


    def save_checkpoint(self, path: str) -> None:
        torch.save({
            "model_state_dict": self.state_dict(),
            "input_dim": self.input_dim,
            "hidden_dim": self.hidden_dim,
            "latent_dim": self.latent_dim,
            "anomaly_threshold": self.anomaly_threshold
        }, path)

    @classmethod
    def load_checkpoint(cls, path: str, device: str = "cpu") -> "FinancialAutoencoder":
        ckpt = torch.load(path, map_location=device, weights_only=False)
        model = cls(
            input_dim=ckpt.get("input_dim", 19),
            hidden_dim=ckpt.get("hidden_dim", 12),
            latent_dim=ckpt.get("latent_dim", 6)
        )
        model.load_state_dict(ckpt["model_state_dict"])
        model.anomaly_threshold = ckpt.get("anomaly_threshold", None)
        model.eval()
        return model


def train_autoencoder(
    model: FinancialAutoencoder,
    train_loader: DataLoader,
    val_loader: DataLoader,
    epochs: int = 80,
    lr: float = 1e-3,
    weight_decay: float = 1e-4,
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Standard training loop with Early Stopping and loss tracking.
    """
    model.to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

    history = {'train_loss': [], 'val_loss': []}
    best_loss = float('inf')
    best_weights = None

    for epoch in range(epochs):
        # Training Phase
        model.train()
        train_loss = 0.0
        for batch_x, _ in train_loader:
            batch_x = batch_x.to(device)
            optimizer.zero_grad()
            reconstructed = model(batch_x)
            loss = criterion(reconstructed, batch_x)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)

        epoch_train = train_loss / len(train_loader.dataset)
        history['train_loss'].append(epoch_train)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_x, _ in val_loader:
                batch_x = batch_x.to(device)
                reconstructed = model(batch_x)
                loss = criterion(reconstructed, batch_x)
                val_loss += loss.item() * batch_x.size(0)

        epoch_val = val_loss / len(val_loader.dataset)
        history['val_loss'].append(epoch_val)
        scheduler.step(epoch_val)

        if epoch_val < best_loss:
            best_loss = epoch_val
            best_weights = model.state_dict().copy()

    # Load best weights
    if best_weights is not None:
        model.load_state_dict(best_weights)

    return history
